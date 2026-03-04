# frozen_string_literal: true

class CreateSessionDiscoveries < ActiveRecord::Migration[7.2]
  def change
    create_table :session_discoveries, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci" do |t|
      t.references :session, null: false, foreign_key: true
      t.references :scheme, null: false, foreign_key: true

      t.timestamps
    end

    add_index :session_discoveries, %i[session_id scheme_id], unique: true
  end
end
