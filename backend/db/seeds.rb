# Seed data for development

Scheme.find_or_create_by!(external_id: "post-matric-scholarship") do |s|
  s.name = "Post-Matric Scholarship"
  s.source_url = "https://scholarships.gov.in"
  s.domain = "scholarships.gov.in"
  s.summary = "Full tuition fee waiver and monthly stipend for students from economically weaker sections."
  s.raw_criteria = "Family income below threshold, post-matriculation education"
  s.cached_at = Time.current
end
