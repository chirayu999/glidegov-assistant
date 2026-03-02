module Api
  class SchemesController < BaseController
    def discover
      query = params.require(:query)
      session_uuid = params.require(:session_id)

      session = Session.find_by!(uuid: session_uuid)

      if params[:async] == "true"
        job = SchemeDiscoveryJob.perform_later(session_uuid, query)
        render json: { job_id: job.provider_job_id, status: "processing" }, status: :accepted
      else
        service = SchemeDiscoveryService.new
        schemes = service.discover(query, session: session)
        render json: {
          schemes: schemes.map { |s|
            { id: s.id, external_id: s.external_id, name: s.name,
              source_url: s.source_url, domain: s.domain, summary: s.summary }
          }
        }
      end
    end
  end
end
