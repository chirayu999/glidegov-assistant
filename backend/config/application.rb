require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_cable/engine"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

module Govglide
  class Application < Rails::Application
    config.load_defaults 7.1
    config.api_only = true

    config.active_job.queue_adapter = :sidekiq

    config.autoload_paths << Rails.root.join("app", "services")
    config.autoload_paths << Rails.root.join("app", "clients")
  end
end
