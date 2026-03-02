class ConversationTurn < ApplicationRecord
  belongs_to :session

  validates :role, presence: true, inclusion: { in: %w[user assistant] }
  validates :content_type, presence: true

  scope :chronological, -> { order(created_at: :asc) }
end
