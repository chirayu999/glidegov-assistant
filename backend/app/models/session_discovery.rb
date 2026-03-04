# frozen_string_literal: true

class SessionDiscovery < ApplicationRecord
  belongs_to :session
  belongs_to :scheme
end
