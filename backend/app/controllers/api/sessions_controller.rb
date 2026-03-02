module Api
  class SessionsController < BaseController
    def create
      session = Session.create!(session_create_params)
      render json: {
        session_id: session.uuid,
        status: session.status,
        locale: session.locale,
        created_at: session.created_at
      }, status: :created
    end

    def show
      session = current_session
      last_progress = session.form_progresses.order(last_activity_at: :desc).first
      scheme = last_progress&.scheme

      render json: {
        session_id: session.uuid,
        status: session.status,
        locale: session.locale,
        last_step: session.last_step,
        expires_at: session.expires_at,
        last_progress: last_progress && {
          scheme_id: scheme&.id,
          scheme_name: scheme&.name,
          current_step_index: last_progress.current_step_index,
          total_steps: last_progress.total_steps,
          state: last_progress.state,
          progress_percentage: last_progress.progress_percentage
        }
      }
    end

    def update
      session = current_session
      session.update!(session_update_params)
      render json: {
        session_id: session.uuid,
        status: session.status,
        last_step: session.last_step
      }
    end

    private

    def session_create_params
      params.permit(:locale)
    end

    def session_update_params
      params.permit(:last_step, :status)
    end
  end
end
