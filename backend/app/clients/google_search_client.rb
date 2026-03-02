class GoogleSearchClient
  BASE_URL = "https://www.googleapis.com/customsearch/v1".freeze

  def initialize(
    api_key: ENV.fetch("GOOGLE_SEARCH_API_KEY"),
    cx: ENV.fetch("GOOGLE_SEARCH_CX")
  )
    @api_key = api_key
    @cx = cx
    @conn = Faraday.new(url: BASE_URL) do |f|
      f.response :json
      f.response :raise_error
      f.adapter Faraday.default_adapter
    end
  end

  # Search restricted to government domains (.gov.in, .nic.in)
  def search(query, num: 10, site_restrict: "*.gov.in OR *.nic.in")
    full_query = site_restrict.present? ? "#{query} site:(#{site_restrict})" : query

    response = @conn.get do |req|
      req.params["key"] = @api_key
      req.params["cx"] = @cx
      req.params["q"] = full_query
      req.params["num"] = [num, 10].min
    end

    parse_results(response.body)
  end

  private

  def parse_results(body)
    items = body.fetch("items", [])
    items.map do |item|
      {
        title: item["title"],
        link: item["link"],
        snippet: item["snippet"],
        domain: extract_domain(item["link"])
      }
    end
  end

  def extract_domain(url)
    URI.parse(url).host
  rescue URI::InvalidURIError
    nil
  end
end
