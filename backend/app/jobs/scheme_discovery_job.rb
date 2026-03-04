class SchemeDiscoveryJob < ApplicationJob
  queue_as :discovery

  def perform(session_uuid, query)
    session = Session.find_by!(uuid: session_uuid)
    service = SchemeDiscoveryService.new
    schemes = service.discover(query, session: session)

    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "discovery_done",
      data: {
        schemes: schemes.map { |s|
          { id: s.id, name: s.name, source_url: s.source_url, summary: s.summary, domain: s.domain }
        },
        timestamp: Time.current.iso8601
      }
    })
  rescue => e
    Rails.logger.error("SchemeDiscoveryJob failed for session #{session_uuid}: #{e.message}")
    ActionCable.server.broadcast("session_#{session_uuid}", {
      type: "error",
      data: { message: "Scheme discovery failed. Please try again.", timestamp: Time.current.iso8601 }
    })
    raise
  end
end
