class CreateSessions < ActiveRecord::Migration[7.1]
  def change
    create_table :sessions do |t|
      t.string :uuid, null: false
      t.string :locale, default: "en", null: false
      t.string :last_step
      t.string :status, default: "active", null: false
      t.datetime :expires_at

      t.timestamps
    end

    add_index :sessions, :uuid, unique: true
    add_index :sessions, :status
  end
end
