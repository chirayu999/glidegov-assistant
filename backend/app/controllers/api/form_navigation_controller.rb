module Api
  class FormNavigationController < BaseController
    def start
      session_uuid = params.require(:session_id)
      scheme_id = params.require(:scheme_id)
      start_url = params.require(:start_url)

      Session.find_by!(uuid: session_uuid)
      Scheme.find(scheme_id)

      pii_data = params[:pii_data]&.permit!&.to_h || {}

      redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      redis.set("form_nav:pii:#{session_uuid}", pii_data.to_json, ex: 3600)

      job = FormNavigationJob.perform_later(session_uuid, scheme_id, start_url)
      render json: { job_id: job.provider_job_id, status: "processing" }, status: :accepted
    end

    def submit_data
      session_uuid = params.require(:session_id)
      new_data = params.require(:data).permit!.to_h
      Session.find_by!(uuid: session_uuid)

      redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))

      existing = JSON.parse(redis.get("form_nav:pii:#{session_uuid}") || "{}")
      merged = existing.merge(new_data)
      redis.set("form_nav:pii:#{session_uuid}", merged.to_json, ex: 3600)

      redis.set("form_nav:data:#{session_uuid}", "ready", ex: 300)

      render json: { status: "data_received" }
    end

    def submit_otp
      session_uuid = params.require(:session_id)
      otp_value = params.require(:otp)
      Session.find_by!(uuid: session_uuid)

      redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      redis.set("form_nav:otp:#{session_uuid}", otp_value, ex: 300)

      render json: { status: "otp_received" }
    end

    def status
      session_uuid = params.require(:session_id)
      session = Session.find_by!(uuid: session_uuid)

      progresses = session.form_progresses.includes(:scheme)

      if params[:scheme_id].present?
        progresses = progresses.where(scheme_id: params[:scheme_id])
      end

      render json: {
        session_id: session.uuid,
        form_progresses: progresses.map { |fp|
          {
            scheme_id: fp.scheme_id,
            scheme_name: fp.scheme.name,
            current_step_index: fp.current_step_index,
            total_steps: fp.total_steps,
            state: fp.state,
            progress_percentage: fp.progress_percentage,
            last_activity_at: fp.last_activity_at
          }
        }
      }
    end
  end
end
