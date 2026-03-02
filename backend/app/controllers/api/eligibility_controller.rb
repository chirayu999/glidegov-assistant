module Api
  class EligibilityController < BaseController
    def check
      session_uuid = params.require(:session_id)
      scheme_ids = params.require(:scheme_ids)
      profile = params.require(:profile).permit!.to_h

      Session.find_by!(uuid: session_uuid)

      if params[:async] == "true"
        job = EligibilityCheckJob.perform_later(session_uuid, scheme_ids, profile)
        render json: { job_id: job.provider_job_id, status: "processing" }, status: :accepted
      else
        service = EligibilityService.new
        results = scheme_ids.map do |scheme_id|
          scheme = Scheme.find(scheme_id)
          result = service.check(scheme, profile.symbolize_keys)
          { scheme_id: scheme.id, scheme_name: scheme.name }.merge(result)
        end
        render json: { results: results }
      end
    end
  end
end
