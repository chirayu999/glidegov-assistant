class CreateFormProgresses < ActiveRecord::Migration[7.1]
  def change
    create_table :form_progresses do |t|
      t.references :session, null: false, foreign_key: true
      t.references :scheme, null: false, foreign_key: true
      t.integer :current_step_index, default: 0, null: false
      t.integer :total_steps
      t.string :state, default: "draft", null: false
      t.datetime :last_activity_at

      t.timestamps
    end

    add_index :form_progresses, [:session_id, :scheme_id], unique: true
  end
end
