module Api
  class BaseController < ApplicationController
    rescue_from ActiveRecord::RecordNotFound, with: :not_found
    rescue_from ActiveRecord::RecordInvalid, with: :unprocessable
    rescue_from ActionController::ParameterMissing, with: :bad_request

    private

    def current_session
      @current_session ||= Session.find_by!(uuid: params[:session_id] || params[:id])
    end

    def not_found(exception)
      render json: { error: exception.message }, status: :not_found
    end

    def unprocessable(exception)
      render json: { error: exception.record.errors.full_messages }, status: :unprocessable_entity
    end

    def bad_request(exception)
      render json: { error: exception.message }, status: :bad_request
    end
  end
end
