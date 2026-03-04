class EligibilityCheckJob < ApplicationJob
  queue_as :eligibility

  def perform(session_uuid, scheme_ids, profile)
    session = Session.find_by!(uuid: session_uuid)
    service = EligibilityService.new

    results = scheme_ids.map do |scheme_id|
      scheme = Scheme.find(scheme_id)
      result = service.check(scheme, profile.symbolize_keys)
      { scheme_id: scheme.id, scheme_name: scheme.name }.merge(result)
    end

    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "eligibility_done",
      data: { results: results, timestamp: Time.current.iso8601 }
    })
  rescue => e
    Rails.logger.error("EligibilityCheckJob failed for session #{session_uuid}: #{e.message}")
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "error",
      data: { message: "Eligibility check failed. Please try again.", timestamp: Time.current.iso8601 }
    })
    raise
  end
end
