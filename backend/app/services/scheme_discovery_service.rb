class SchemeDiscoveryService
  def initialize(search_client: GoogleSearchClient.new)
    @search_client = search_client
  end

  def discover(query, session: nil)
    results = @search_client.search(query)

    schemes = results.map do |result|
      external_id = Digest::SHA256.hexdigest(result[:link])[0..15]

      Scheme.find_or_initialize_by(external_id: external_id).tap do |scheme|
        scheme.assign_attributes(
          name: result[:title],
          source_url: result[:link],
          domain: result[:domain],
          summary: result[:snippet],
          cached_at: Time.current
        )
        scheme.save!
      end
    end

    schemes
  rescue Faraday::Error => e
    Rails.logger.error("SchemeDiscoveryService error: #{e.message}")
    raise
  end
end
