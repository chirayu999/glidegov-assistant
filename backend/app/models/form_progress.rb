class FormProgress < ApplicationRecord
  belongs_to :session
  belongs_to :scheme

  validates :current_step_index, numericality: { greater_than_or_equal_to: 0 }
  validates :state, presence: true, inclusion: { in: %w[draft pending_otp handoff] }

  before_save :touch_last_activity

  def progress_percentage
    return 0 if total_steps.nil? || total_steps.zero?
    ((current_step_index.to_f / total_steps) * 100).round
  end

  private

  def touch_last_activity
    self.last_activity_at = Time.current
  end
end
