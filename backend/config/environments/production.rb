require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false

  config.force_ssl = true
  config.assume_ssl = true

  config.log_tags = [:request_id]
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  config.action_cable.disable_request_forgery_protection = false
  config.action_cable.allowed_request_origins = [
    ENV.fetch("FRONTEND_URL", "https://govglide.app")
  ]
end
