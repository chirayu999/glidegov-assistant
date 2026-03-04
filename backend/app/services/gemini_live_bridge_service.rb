# frozen_string_literal: true

require "websocket-client-simple"
require "json"

# Holds the outbound WebSocket to Gemini Live API, sends setup (system instruction + tools),
# bridges client audio to Gemini and Gemini responses to the client. Executes tool calls
# (discover_schemes, check_eligibility) and sends tool results back.
class GeminiLiveBridgeService
  LIVE_WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent".freeze
  DEFAULT_MODEL = "gemini-2.0-flash-exp".freeze

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

    @thread = Thread.new do
      begin
        WebSocket::Client::Simple.connect(url) do |ws|
          @ws = ws

          ws.on :open do
            ws.send(setup_message)
            @broadcast.call({ "type" => "live_ready", "data" => {} })
          end

          ws.on :message do |event|
            handle_server_message(event.data)
          end

          ws.on :error do |e|
            Rails.logger.error("GeminiLiveBridge error: #{e.message}")
            @broadcast.call({ "type" => "error", "data" => { "message" => e.message } })
          end

          ws.on :close do |e|
            Rails.logger.info("GeminiLiveBridge closed: #{e.code} #{e.reason}")
          end
        end
      rescue => e
        Rails.logger.error("GeminiLiveBridge failed: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
        @broadcast.call({ "type" => "error", "data" => { "message" => e.message } })
      end
    end
  end

  def send_audio(base64_audio)
    return unless @ws

    msg = {
      realtimeInput: {
        mediaChunks: [
          { mimeType: "audio/pcm", data: base64_audio }
        ]
      }
    }
    @ws.send(msg.to_json)
  rescue => e
    Rails.logger.error("GeminiLiveBridge send_audio error: #{e.message}")
        @broadcast.call({ "type" => "error", "data" => { "message" => "Failed to send audio" } })
  end

  def close
    @ws&.close
    @thread&.kill
    @ws = nil
    @thread = nil
  end

  private

  def build_setup_message(payload)
    tools = (payload[:tools] || []).map { |t| deep_camelize_keys(t) }
    {
      "setup" => {
        "model" => DEFAULT_MODEL,
        "generationConfig" => {
          "responseModalities" => ["AUDIO", "TEXT"],
          "speechConfig" => {
            "voiceConfig" => {
              "prebuiltVoiceConfig" => { "voiceName" => "Puck" }
            }
          }
        },
        "systemInstruction" => payload[:system_instruction],
        "tools" => tools
      }
    }.to_json
  end

  def deep_camelize_keys(obj)
    case obj
    when Hash
      obj.transform_keys { |k| k.to_s.camelize(:lower).presence || k }.transform_values { |v| deep_camelize_keys(v) }
    when Array
      obj.map { |e| deep_camelize_keys(e) }
    else
      obj
    end
  end

  def handle_server_message(raw)
    data = JSON.parse(raw)
    handle_server_message_parsed(data, raw)
  rescue JSON::ParserError
    @broadcast.call(raw.is_a?(String) ? raw : raw.to_json)
  end

  def handle_server_message_parsed(data, raw)
    server_content = data["serverContent"]
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

    send_tool_response(interrupt_id, name, result)
  rescue => e
    Rails.logger.error("GeminiLiveBridge tool #{name} error: #{e.message}")
    send_tool_response(interrupt_id, name, { error: e.message })
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

  def send_tool_response(interrupt_id, name, result)
    return unless @ws && interrupt_id

    msg = {
      toolResponse: {
        interruptId: interrupt_id,
        functionResponses: [
          { name: name, response: result }
        ]
      }
    }
    @ws.send(msg.to_json)
  end
end
