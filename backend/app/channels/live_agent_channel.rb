# frozen_string_literal: true

# ActionCable channel for the Live voice agent. Client subscribes with session_id.
# Backend opens a WebSocket to Gemini Live, bridges audio and handles tool calls.
class LiveAgentChannel < ApplicationCable::Channel
  def subscribed
    session = Session.find_by(uuid: params[:session_id])
    unless session
      reject
      return
    end

    @session = session
    stream_name = "live_agent_#{session.uuid}"
    stream_from stream_name

    broadcast_callback = ->(msg) do
      if msg.is_a?(Hash) && msg["type"]
        ActionCable.server.broadcast(stream_name, msg)
      else
        payload = msg.is_a?(String) ? msg : msg.to_json
        ActionCable.server.broadcast(stream_name, { type: "live", data: payload })
      end
    end

    @bridge = GeminiLiveBridgeService.new(session, broadcast_callback: broadcast_callback)
    @bridge.start
  end

  def unsubscribed
    @bridge&.close
    stop_all_streams
  end

  # Client sends: { "audio" => base64_string } or { "type" => "audio", "data" => base64 }
  def receive(data)
    return unless @bridge

    payload = data.is_a?(Hash) ? data : {}
    base64_audio = payload["data"] || payload["audio"]
    if base64_audio.present?
      Rails.logger.info("LiveAgent: got audio from client")
      @bridge.send_audio(base64_audio)
    end
  end
end
