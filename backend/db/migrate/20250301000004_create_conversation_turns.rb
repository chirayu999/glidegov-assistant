class CreateConversationTurns < ActiveRecord::Migration[7.1]
  def change
    create_table :conversation_turns do |t|
      t.references :session, null: false, foreign_key: true
      t.string :role, null: false
      t.text :content_text
      t.string :content_type, default: "text", null: false

      t.timestamps
    end

    add_index :conversation_turns, [:session_id, :created_at]
  end
end
