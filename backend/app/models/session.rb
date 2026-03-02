class Session < ApplicationRecord
  has_many :form_progresses, dependent: :destroy
  has_many :conversation_turns, dependent: :destroy
  has_many :schemes, through: :form_progresses

  validates :uuid, presence: true, uniqueness: true
  validates :locale, presence: true
  validates :status, presence: true, inclusion: { in: %w[active paused handoff] }

  before_validation :generate_uuid, on: :create

  scope :active, -> { where(status: "active") }
  scope :not_expired, -> { where("expires_at IS NULL OR expires_at > ?", Time.current) }

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  private

  def generate_uuid
    self.uuid ||= SecureRandom.uuid
  end
end
