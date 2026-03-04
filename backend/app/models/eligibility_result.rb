# frozen_string_literal: true

class EligibilityResult < ApplicationRecord
  belongs_to :session
  belongs_to :scheme

  validates :status, presence: true, inclusion: { in: %w[eligible action_required ineligible] }

  # result hash has :status, :reason, :missing_info
  def self.upsert_for(session, scheme, result)
    record = find_or_initialize_by(session: session, scheme: scheme)
    record.assign_attributes(
      status: result[:status].to_s,
      reason: result[:reason],
      missing_info: result[:missing_info] || []
    )
    record.save!
    record
  end
end
