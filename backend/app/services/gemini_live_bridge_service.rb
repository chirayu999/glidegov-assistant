# frozen_string_literal: true

require "websocket-client-simple"
require "json"

# Holds the outbound WebSocket to Gemini Live API, sends setup (system instruction + tools),
# bridges client audio to Gemini and Gemini responses to the client. Executes tool calls
# (discover_schemes, check_eligibility) and sends tool results back.
class GeminiLiveBridgeService
  LIVE_WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent".freeze
  DEFAULT_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025".freeze

  def initialize(session, broadcast_callback:)
    @session = session
    @broadcast = broadcast_callback
    @ws = nil
    @thread = nil
    @discovery_service = SchemeDiscoveryService.new
    @eligibility_service = EligibilityService.new
  end

  def start
    api_key = ENV["GEMINI_API_KEY"]
    unless api_key.present?
      @broadcast.call({ "type" => "error", "data" => { "message" => "GEMINI_API_KEY not configured" } })
      return
    end

    url = "#{LIVE_WS_URL}?key=#{ERB::Util.url_encode(api_key)}"
    payload = LiveContextService.new(@session).build_setup_payload
    setup_message = build_setup_message(payload)

    # Capture callback in a local so ws.on blocks (run with instance_exec by the client) can use it
    broadcast = @broadcast
    bridge = self
    @thread = Thread.new do
      begin
        WebSocket::Client::Simple.connect(url) do |ws|
          @ws = ws

          ws.on :open do
            ws.send(setup_message)
          end

          ws.on :message do |event|
            bridge.send(:handle_server_message, event.data)
          end

          ws.on :error do |e|
            Rails.logger.error("GeminiLiveBridge error: #{e.message}")
            broadcast.call({ "type" => "error", "data" => { "message" => e.message } })
          end

          ws.on :close do |e|
            code = e.respond_to?(:code) ? e.code : nil
            reason = e.respond_to?(:reason) ? e.reason : nil
            Rails.logger.info("GeminiLiveBridge closed: #{code} #{reason}")
          end
        end
      rescue => e
        Rails.logger.error("GeminiLiveBridge failed: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
        broadcast.call({ "type" => "error", "data" => { "message" => e.message } })
      end
    end
  end

  def send_audio(base64_audio)
    return unless @ws

    msg = {
      realtimeInput: {
        audio: { mimeType: "audio/pcm;rate=16000", data: base64_audio }
      }
    }
    @ws.send(msg.to_json)
  rescue => e
    Rails.logger.error("GeminiLiveBridge send_audio error: #{e.message}")
    @broadcast&.call({ "type" => "error", "data" => { "message" => "Failed to send audio" } })
  end

  def close
    @ws&.close
    @thread&.kill
    @ws = nil
    @thread = nil
  end

  private

  def build_setup_message(payload)
    {
      "setup" => {
        "model" => "models/#{DEFAULT_MODEL}",
        "generationConfig" => {
          "responseModalities" => ["AUDIO"]
        },
        "systemInstruction" => { "parts" => [ { "text" => payload[:system_instruction].to_s } ] },
        # NOTE: tools temporarily disabled to avoid Live API \"invalid argument\" on setup;
        # when re-enabling, ensure function_declarations.parameters schema matches docs exactly.
        # "tools" => tools
      }
    }.to_json
  end

  def deep_camelize_keys(obj)
    case obj
    when Hash
      obj.each_with_object({}) do |(k, v), h|
        new_key = k.to_s.camelize(:lower).presence || k
        new_value =
          if k.to_s == "required" && v.is_a?(Array)
            v.map { |name| name.to_s.camelize(:lower) }
          else
            deep_camelize_keys(v)
          end
        h[new_key] = new_value
      end
    when Array
      obj.map { |e| deep_camelize_keys(e) }
    else
      obj
    end
  end

  def handle_server_message(raw)
    Rails.logger.info("LiveAgent: got response from Gemini")
    if raw.is_a?(String) && !(raw.lstrip.start_with?("{") || raw.lstrip.start_with?("["))
      # Plain-text error from Gemini (not JSON)
      Rails.logger.warn("GeminiLiveBridge non-JSON message: #{raw.to_s.strip}")
      @broadcast.call({ "type" => "error", "data" => { "message" => raw.to_s.strip } })
      return
    end

    data = raw.is_a?(Hash) ? raw : JSON.parse(raw.to_s)
    Rails.logger.info("LiveAgent: Gemini message keys=#{data.is_a?(Hash) ? data.keys : []}")
    raw_for_broadcast = raw.is_a?(String) ? raw : data.to_json
    handle_server_message_parsed(data, raw_for_broadcast)
  rescue JSON::ParserError => e
    Rails.logger.warn("GeminiLiveBridge JSON parse error: #{e.message}")
    @broadcast.call({ "type" => "error", "data" => { "message" => raw.to_s.strip.presence || e.message } })
  end

  def handle_server_message_parsed(data, raw)
    if data.key?("setupComplete") || data.key?("setup_complete")
      @broadcast.call({ "type" => "live_ready", "data" => {} })
    end

    server_content = data["serverContent"] || data["server_content"]
    if server_content
      interrupt_id = server_content["interruptId"]
      if server_content["modelTurn"] && server_content["modelTurn"]["parts"]
        server_content["modelTurn"]["parts"].each do |part|
          handle_tool_call(part["functionCall"], interrupt_id) if part["functionCall"]
        end
      end
      if server_content["toolCall"] && server_content["toolCall"]["functionCalls"]
        server_content["toolCall"]["functionCalls"].each do |fc|
          handle_tool_call(fc, interrupt_id)
        end
      end
    end

    # Top-level toolCall (message type is toolCall, not serverContent)
    tool_call = data["toolCall"] || data["tool_call"]
    if tool_call && tool_call["functionCalls"]
      tool_call["functionCalls"].each do |fc|
        handle_tool_call(fc, nil)
      end
    end

    @broadcast.call(raw)
  end

  def handle_tool_call(function_call, interrupt_id)
    name = function_call["name"]
    args = function_call.dig("args") || {}
    args = args.transform_keys(&:to_sym) if args.is_a?(Hash)

    result =
      case name
      when "discover_schemes"
        run_discover_schemes(args)
      when "check_eligibility"
        run_check_eligibility(args)
      else
        { error: "Unknown tool: #{name}" }
      end

    function_call_id = function_call["id"]
    send_tool_response(interrupt_id, function_call_id, name, result)
  rescue => e
    Rails.logger.error("GeminiLiveBridge tool #{name} error: #{e.message}")
    send_tool_response(interrupt_id, function_call["id"], name, { error: e.message })
  end

  def run_discover_schemes(args)
    session_id = args[:session_id] || @session.uuid
    query = args[:query].to_s
    session = Session.find_by!(uuid: session_id)
    schemes = @discovery_service.discover(query, session: session)
    {
      schemes: schemes.map { |s|
        { id: s.id, name: s.name, summary: s.summary, source_url: s.source_url }
      }
    }
  end

  def run_check_eligibility(args)
    session_id = args[:session_id] || @session.uuid
    scheme_ids = Array(args[:scheme_ids]).map(&:to_i)
    profile = (args[:profile] || {}).transform_keys(&:to_s)

    session = Session.find_by!(uuid: session_id)
    results = scheme_ids.map do |sid|
      scheme = Scheme.find(sid)
      result = @eligibility_service.check(scheme, profile.symbolize_keys)
      EligibilityResult.upsert_for(session, scheme, result)
      { scheme_id: scheme.id, scheme_name: scheme.name }.merge(result)
    end
    { results: results }
  end

  def send_tool_response(interrupt_id, function_call_id, name, result)
    return unless @ws

    response_entry = { name: name, response: result }
    response_entry[:id] = function_call_id if function_call_id.present?

    tool_response = { functionResponses: [ response_entry ] }
    tool_response[:interruptId] = interrupt_id if interrupt_id.present?

    msg = { toolResponse: tool_response }
    @ws.send(msg.to_json)
  end
end
