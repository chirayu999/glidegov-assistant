class GeminiClient
  BASE_URL = "https://generativelanguage.googleapis.com/v1beta".freeze
  DEFAULT_MODEL = "gemini-1.5-pro".freeze

  def initialize(api_key: ENV.fetch("GEMINI_API_KEY"))
    @api_key = api_key
    @conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.response :json
      f.response :raise_error
      f.adapter Faraday.default_adapter
    end
  end

  def generate_content(prompt, model: DEFAULT_MODEL)
    response = @conn.post("models/#{model}:generateContent", {
      contents: [{ parts: [{ text: prompt }] }]
    }) do |req|
      req.params["key"] = @api_key
    end

    extract_text(response.body)
  end

  def generate_content_with_image(prompt, image_base64, mime_type: "image/png", model: DEFAULT_MODEL)
    response = @conn.post("models/#{model}:generateContent", {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mime_type, data: image_base64 } }
        ]
      }]
    }) do |req|
      req.params["key"] = @api_key
    end

    extract_text(response.body)
  end

  private

  def extract_text(body)
    candidates = body.dig("candidates")
    return nil if candidates.nil? || candidates.empty?

    candidates.first.dig("content", "parts", 0, "text")
  end
end
