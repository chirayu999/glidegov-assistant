class SessionStoreService
  def create(locale: "en")
    Session.create!(locale: locale, expires_at: 24.hours.from_now)
  end

  def find(uuid)
    Session.find_by!(uuid: uuid)
  end

  def update(uuid, attrs)
    session = find(uuid)
    session.update!(attrs)
    session
  end

  def find_or_create_progress(session, scheme)
    FormProgress.find_or_create_by!(session: session, scheme: scheme)
  end

  def update_progress(progress, attrs)
    progress.update!(attrs)
    progress
  end
end
