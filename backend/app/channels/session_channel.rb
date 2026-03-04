class SessionChannel < ApplicationCable::Channel
  def subscribed
    session = Session.find_by(uuid: params[:session_id])
    if session
      stream_from "session_#{session.uuid}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  def self.broadcast_message(session_uuid, content)
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "message",
      data: { content: content, timestamp: Time.current.iso8601 }
    })
  end

  def self.broadcast_form_progress(session_uuid, step_index:, total_steps:, message:, state:)
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "form_progress",
      data: {
        step_index: step_index,
        total_steps: total_steps,
        message: message,
        state: state,
        timestamp: Time.current.iso8601
      }
    })
  end

  def self.broadcast_handoff(session_uuid, reason:, url: nil)
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "handoff",
      data: {
        reason: reason,
        url: url,
        timestamp: Time.current.iso8601
      }
    })
  end

  def self.broadcast_screenshot(session_uuid, screenshot_base64, message: nil)
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "screenshot",
      data: {
        image: screenshot_base64,
        message: message,
        timestamp: Time.current.iso8601
      }
    })
  end

  def self.broadcast_data_required(session_uuid, missing_fields:, message: nil)
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "data_required",
      data: {
        missing_fields: missing_fields,
        message: message,
        timestamp: Time.current.iso8601
      }
    })
  end
end
