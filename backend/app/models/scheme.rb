class Scheme < ApplicationRecord
  has_many :form_progresses, dependent: :destroy
  has_many :sessions, through: :form_progresses
  has_many :eligibility_results, dependent: :destroy
  has_many :session_discoveries, dependent: :destroy

  validates :external_id, presence: true, uniqueness: true
  validates :name, presence: true

  scope :recently_cached, -> { where("cached_at > ?", 24.hours.ago) }

  def stale?
    cached_at.nil? || cached_at < 24.hours.ago
  end
end
