# frozen_string_literal: true

class CreateEligibilityResults < ActiveRecord::Migration[7.2]
  def change
    create_table :eligibility_results, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci" do |t|
      t.references :session, null: false, foreign_key: true
      t.references :scheme, null: false, foreign_key: true
      t.string :status, null: false  # eligible | action_required | ineligible
      t.text :reason
      t.json :missing_info  # array of strings

      t.timestamps
    end

    add_index :eligibility_results, %i[session_id scheme_id], unique: true
  end
end
