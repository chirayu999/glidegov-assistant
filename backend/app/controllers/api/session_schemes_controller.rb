# frozen_string_literal: true

module Api
  class SessionSchemesController < BaseController
    def index
      session = Session.find_by!(uuid: params[:session_id])
      schemes = session.discovered_schemes.distinct

      schemes_with_eligibility = schemes.map do |s|
        er = s.eligibility_results.find_by(session: session)
        {
          id: s.id,
          name: s.name,
          summary: s.summary,
          source_url: s.source_url,
          domain: s.domain,
          eligibility: er && {
            status: er.status,
            reason: er.reason,
            missing_info: er.missing_info || []
          }
        }
      end

      render json: { schemes: schemes_with_eligibility }
    end
  end
end
