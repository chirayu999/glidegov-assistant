class FormNavigationService
  WAIT_TIMEOUT = 300
  POLL_INTERVAL = 2

  def initialize(session_store: SessionStoreService.new, gemini: GeminiClient.new)
    @session_store = session_store
    @gemini = gemini
  end

  def navigate(session, scheme, start_url:)
    @progress = @session_store.find_or_create_progress(session, scheme)
    @session_uuid = session.uuid
    @redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))

    @pii_data = load_pii

    Playwright.create(playwright_cli_executable_path: "npx playwright") do |pw|
      browser = pw.chromium.launch(headless: true)
      @page = browser.new_page(viewport: { width: 1280, height: 800 })

      @page.goto(start_url, wait_until: "networkidle")
      broadcast_screenshot("Opened government portal")

      pre_scan_and_collect_missing_data
      fill_form_loop(start_url)

      browser.close
    end

    @progress.reload
  end

  private

  def pre_scan_and_collect_missing_data
    screenshot_b64 = take_screenshot
    required_fields = identify_required_fields(screenshot_b64)

    missing = required_fields.select { |f| @pii_data[f[:key].to_s].blank? }
    return if missing.empty?

    SessionChannel.broadcast_data_required(
      @session_uuid,
      missing_fields: missing.map { |f| f.transform_keys(&:to_s) },
      message: "We need a few more details before filling this form."
    )
    broadcast_screenshot("Waiting for your details...")

    wait_for_data_submission
    @pii_data = load_pii
  end

  def identify_required_fields(screenshot_b64)
    prompt = <<~PROMPT
      Analyze this government form screenshot. List ALL required fields visible on this page.
      For each field, provide a standardized key name and a human-readable label.

      Respond with JSON only:
      { "required_fields": [
          { "key": "full_name", "label": "Full Name", "type": "text", "required": true },
          { "key": "mobile", "label": "Mobile Number", "type": "tel", "required": true },
          { "key": "email", "label": "Email Address", "type": "email", "required": true },
          { "key": "address", "label": "Full Address", "type": "textarea", "required": false }
      ]}

      Use these standardized keys when possible:
      full_name, date_of_birth, mobile, email, gender, category, state,
      district, address, pincode, annual_income, education_level,
      institution_name, aadhaar_number, bank_account, ifsc_code
    PROMPT

    raw = @gemini.generate_content_with_image(prompt, screenshot_b64)
    parsed = JSON.parse(raw.match(/\{.*\}/m)[0])
    parsed["required_fields"].to_a.map(&:symbolize_keys)
  rescue => e
    Rails.logger.warn("FormNavigationService#identify_required_fields failed: #{e.message}")
    []
  end

  def fill_form_loop(start_url)
    step_index = 0
    loop do
      step_index += 1
      screenshot_b64 = take_screenshot
      analysis = analyze_page_for_filling(screenshot_b64)

      case analysis[:action].to_s
      when "fill_fields"
        fill_fields_with_interactive_fallback(analysis[:fields].to_a)
        update_progress(step_index, analysis[:total_steps], analysis[:message], "draft")
        broadcast_screenshot(analysis[:message])

      when "click_next"
        selector = analysis[:selector]
        if selector.present?
          @page.click(selector)
          @page.wait_for_load_state("networkidle")
        end
        broadcast_screenshot("Navigating to next step...")

      when "otp_required"
        handle_otp_handoff(step_index, analysis[:total_steps], analysis[:selector])

      when "captcha_required"
        SessionChannel.broadcast_handoff(@session_uuid, reason: "captcha", url: start_url)
        broadcast_screenshot("Captcha detected -- please complete it on the portal")
        break

      when "form_complete"
        update_progress(step_index, step_index, "Form filling complete!", "handoff")
        broadcast_screenshot("All done! Review your application.")
        SessionChannel.broadcast_handoff(@session_uuid, reason: "review", url: start_url)
        break

      else
        update_progress(step_index, step_index, analysis[:message] || "Processing...", "draft")
        broadcast_screenshot(analysis[:message] || "Analyzing form...")
      end
    end
  end

  def fill_fields_with_interactive_fallback(fields)
    fields.each do |field|
      f = field.is_a?(Hash) ? field : {}
      key = f["value"] || f["key"] || f[:value] || f[:key]
      value = @pii_data[key.to_s] || @pii_data[key.to_sym]

      if value.blank?
        SessionChannel.broadcast_data_required(
          @session_uuid,
          missing_fields: [{
            "key" => key,
            "label" => f["label"] || f[:label] || key.to_s.humanize,
            "type" => f["input_type"] || f["type"] || "text",
            "required" => true
          }],
          message: "I need one more piece of information to continue."
        )
        broadcast_screenshot("Waiting for: #{f['label'] || f[:label] || key}")
        wait_for_data_submission
        @pii_data = load_pii
        value = @pii_data[key.to_s] || @pii_data[key.to_sym]
        next if value.blank?
      end

      selector = f["selector"] || f[:selector]
      next if selector.blank?

      field_type = (f["type"] || f[:type] || "text").to_s
      begin
        case field_type
        when "select"
          @page.select_option(selector, value: value.to_s)
        when "radio", "checkbox"
          @page.check(selector)
        else
          @page.fill(selector, value.to_s)
        end
      rescue => e
        Rails.logger.warn("FormNavigationService fill field failed: #{e.message}")
      end

      sleep(0.3)
      broadcast_screenshot("Filled: #{f['label'] || f[:label] || key}")
    end
  end

  def handle_otp_handoff(step_index, total_steps, otp_selector)
    @session_store.update_progress(@progress, state: "pending_otp",
                                   current_step_index: step_index, total_steps: total_steps)
    SessionChannel.broadcast_handoff(@session_uuid, reason: "otp")
    broadcast_screenshot("OTP required -- please check your phone")

    otp = wait_for_value("form_nav:otp:#{@session_uuid}")
    if otp.present?
      begin
        @page.fill(otp_selector.to_s, otp) if otp_selector.present?
        @page.keyboard.press("Enter")
        @page.wait_for_load_state("networkidle")
      rescue => e
        Rails.logger.warn("FormNavigationService OTP fill failed: #{e.message}")
      end
      @redis.del("form_nav:otp:#{@session_uuid}")
      @session_store.update_progress(@progress, state: "draft")
      broadcast_screenshot("OTP entered successfully!")
    end
  end

  def load_pii
    raw = @redis.get("form_nav:pii:#{@session_uuid}")
    raw.present? ? JSON.parse(raw) : {}
  end

  def take_screenshot
    Base64.strict_encode64(@page.screenshot(type: "jpeg", quality: 70))
  end

  def broadcast_screenshot(message)
    SessionChannel.broadcast_screenshot(@session_uuid, take_screenshot, message: message)
  end

  def update_progress(step_index, total_steps, message, state)
    @session_store.update_progress(@progress, current_step_index: step_index, total_steps: total_steps)
    SessionChannel.broadcast_form_progress(@session_uuid, step_index: step_index,
                                           total_steps: total_steps, message: message, state: state)
  end

  def wait_for_data_submission
    wait_for_value("form_nav:data:#{@session_uuid}")
    @redis.del("form_nav:data:#{@session_uuid}")
  end

  def wait_for_value(key)
    (WAIT_TIMEOUT / POLL_INTERVAL).times do
      value = @redis.get(key)
      return value if value.present?
      sleep(POLL_INTERVAL)
    end
    nil
  end

  def analyze_page_for_filling(screenshot_b64)
    prompt = <<~PROMPT
      You are a form-filling assistant. Analyze this government website form screenshot.

      User data keys available: #{@pii_data.keys.join(', ')}

      Respond with JSON only:
      {
        "action": "fill_fields" | "click_next" | "otp_required" | "captcha_required" | "form_complete",
        "fields": [{"selector": "css_selector", "value": "pii_key", "key": "pii_key",
                     "label": "Human label", "type": "text|select|radio|checkbox"}],
        "selector": "css_selector_for_next_button (if click_next)",
        "message": "Human-readable description of current step",
        "total_steps": estimated_total_form_steps
      }
    PROMPT

    raw = @gemini.generate_content_with_image(prompt, screenshot_b64)
    JSON.parse(raw.match(/\{.*\}/m)[0]).symbolize_keys
  rescue => e
    Rails.logger.warn("FormNavigationService#analyze_page_for_filling failed: #{e.message}")
    { action: "form_complete", message: "Could not analyze page" }
  end
end
