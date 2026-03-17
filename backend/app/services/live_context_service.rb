# frozen_string_literal: true

# Builds system instruction and tools spec for Gemini Live API setup.
# Used when the backend opens the Live WebSocket: generic instruction for empty slate,
# optional current context when session already has eligibility results.
class LiveContextService
  GENERIC_SYSTEM_INSTRUCTION = <<~TEXT.freeze
    You are GovGlide, a friendly voice assistant for Indian government schemes. You help users discover and understand schemes (scholarships, pensions, farmer subsidies, healthcare, etc.) and explain eligibility in simple terms.

    When the user tells you what they need (e.g. scholarship, pension) or their profile (income, education, category), use the provided tools to discover schemes and check eligibility. Then explain the results clearly: why they are eligible or not, what options they have, and which scheme has the earliest deadline if known. Speak in a warm, simple way; use Hindi or English as appropriate for the user.

    You have two tools:
    - discover_schemes: Call this with the user's search query (e.g. "post matric scholarship") to find official government schemes. Use the session_id you are given.
    - check_eligibility: After discovering schemes, call this with the scheme IDs and the user's profile (e.g. annual_income, education_level, category) to see if they qualify. Explain the outcome and any missing documents or actions needed.
  TEXT

  def initialize(session)
    @session = session
  end

  # Returns a hash suitable for the Live API setup message:
  #   { system_instruction: String, tools: Array, locale: String }
  def build_setup_payload
    {
      system_instruction: build_system_instruction,
      tools: build_tools,
      locale: @session.locale.presence || "en"
    }
  end

  def build_system_instruction
    parts = [GENERIC_SYSTEM_INSTRUCTION]
    current_context = build_current_context
    parts << current_context if current_context.present?
    parts.join("\n\n")
  end

  # Gemini Live API tools: array of function declarations (Gemini format)
  def build_tools
    [
      {
        function_declarations: [
          {
            name: "discover_schemes",
            description: "Search for official Indian government schemes by topic (e.g. scholarship, pension, farmer subsidy). Returns a list of schemes with name, summary, id, and source_url.",
            parameters: {
              type: "object",
              properties: {
                session_id: { type: "string", description: "The current session UUID" },
                query: { type: "string", description: "Search query, e.g. post matric scholarship, PM-Kisan, Ayushman Bharat" }
              },
              required: %w[session_id query]
            }
          },
          {
            name: "check_eligibility",
            description: "Check whether the user is eligible for the given schemes based on their profile. Returns per-scheme status (eligible/action_required/ineligible), reason, and missing_info.",
            parameters: {
              type: "object",
              properties: {
                session_id: { type: "string", description: "The current session UUID" },
                scheme_ids: {
                  type: "array",
                  items: { type: "integer" },
                  description: "List of scheme IDs to check"
                },
                profile: {
                  type: "object",
                  description: "User profile: annual_income, education_level, category (SC/ST/OBC/General), state, etc. Pass key-value pairs as strings."
                }
              },
              required: %w[session_id scheme_ids profile]
            }
          }
        ]
      }
    ]
  end

  private

  def build_current_context
    return "" if @session.eligibility_results.empty?

    lines = ["Current context (from earlier in this session):"]
    @session.eligibility_results.includes(:scheme).find_each do |er|
      scheme = er.scheme
      deadline_str = scheme.respond_to?(:deadline) && scheme.deadline.present? ? " Deadline: #{scheme.deadline}" : ""
      lines << "- #{scheme.name}: #{er.status} — #{er.reason}. #{scheme.summary}#{deadline_str}"
      lines << "  Missing: #{er.missing_info.join(', ')}" if er.missing_info.present?
    end
    lines.join("\n")
  end
end
