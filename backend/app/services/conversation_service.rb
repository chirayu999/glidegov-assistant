class ConversationService
  def append(session, role:, content_text:, content_type: "text")
    session.conversation_turns.create!(
      role: role,
      content_text: content_text,
      content_type: content_type
    )
  end

  def history(session)
    session.conversation_turns.chronological
  end

  def append_and_broadcast(session, role:, content_text:, content_type: "text")
    turn = append(session, role: role, content_text: content_text, content_type: content_type)

    if role == "assistant"
      SessionChannel.broadcast_message(session.uuid, content_text)
    end

    turn
  end
end
