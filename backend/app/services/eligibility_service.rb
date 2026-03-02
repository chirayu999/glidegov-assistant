class EligibilityService
  def initialize(gemini_client: GeminiClient.new)
    @gemini = gemini_client
  end

  def check(scheme, profile)
    prompt = build_prompt(scheme, profile)
    raw_response = @gemini.generate_content(prompt)
    parse_response(raw_response)
  rescue Faraday::Error => e
    Rails.logger.error("EligibilityService error: #{e.message}")
    { status: "error", reason: "Failed to check eligibility. Please try again." }
  end

  private

  def build_prompt(scheme, profile)
    <<~PROMPT
      You are an eligibility assessment assistant for Indian government schemes.

      Scheme: #{scheme.name}
      Scheme Summary: #{scheme.summary}
      Eligibility Criteria: #{scheme.raw_criteria.presence || "Not available - use the summary to infer."}

      Applicant Profile (anonymized):
      #{profile.map { |k, v| "- #{k}: #{v}" }.join("\n")}

      Based on the above, determine the applicant's eligibility. Respond ONLY with valid JSON:
      {
        "status": "eligible" | "action_required" | "ineligible",
        "reason": "Brief explanation",
        "missing_info": ["list of any missing information needed"] or []
      }
    PROMPT
  end

  def parse_response(raw)
    json_match = raw&.match(/\{.*\}/m)
    return { status: "error", reason: "Could not parse eligibility response." } unless json_match

    JSON.parse(json_match[0]).symbolize_keys
  rescue JSON::ParserError
    { status: "error", reason: "Could not parse eligibility response." }
  end
end
