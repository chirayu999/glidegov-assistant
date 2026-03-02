module Api
  class ConversationTurnsController < BaseController
    before_action :set_session

    def index
      turns = @session.conversation_turns.chronological
      render json: {
        session_id: @session.uuid,
        turns: turns.map { |t| turn_json(t) }
      }
    end

    def create
      turn = @session.conversation_turns.create!(turn_params)
      render json: turn_json(turn), status: :created
    end

    private

    def set_session
      @session = Session.find_by!(uuid: params[:session_id])
    end

    def turn_params
      params.require(:turn).permit(:role, :content_text, :content_type)
    end

    def turn_json(turn)
      {
        id: turn.id,
        role: turn.role,
        content_text: turn.content_text,
        content_type: turn.content_type,
        created_at: turn.created_at
      }
    end
  end
end
