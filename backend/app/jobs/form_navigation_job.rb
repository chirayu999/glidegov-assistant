class FormNavigationJob < ApplicationJob
  queue_as :form_navigation

  def perform(session_uuid, scheme_id, start_url)
    session = Session.find_by!(uuid: session_uuid)
    scheme = Scheme.find(scheme_id)

    service = FormNavigationService.new
    service.navigate(session, scheme, start_url: start_url)
  rescue => e
    Rails.logger.error("FormNavigationJob failed for session #{session_uuid}: #{e.message}")
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "error",
      data: { message: "Form navigation failed. Please try again.", timestamp: Time.current.iso8601 }
    })
    raise
  end
end
