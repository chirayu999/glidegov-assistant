module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :session_uuid

    def connect
      self.session_uuid = request.params[:session_id]
      reject_unauthorized_connection unless session_uuid.present?
    end
  end
end
