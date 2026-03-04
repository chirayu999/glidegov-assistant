require "sidekiq/web"

Rails.application.routes.draw do
  namespace :api do
    resources :sessions, only: [:create, :show, :update] do
      resources :turns, only: [:index, :create], controller: "conversation_turns"
      resources :schemes, only: [:index], controller: "session_schemes"
    end

    post "schemes/discover", to: "schemes#discover"
    post "eligibility/check", to: "eligibility#check"
    post "form_navigation/start", to: "form_navigation#start"
    post "form_navigation/submit_data", to: "form_navigation#submit_data"
    post "form_navigation/submit_otp", to: "form_navigation#submit_otp"
    get  "form_navigation/status", to: "form_navigation#status"
  end

  mount ActionCable.server => "/cable"

  if Rails.env.development?
    mount Sidekiq::Web => "/sidekiq"
  end
end
