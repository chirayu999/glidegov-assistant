class CreateSchemes < ActiveRecord::Migration[7.1]
  def change
    create_table :schemes do |t|
      t.string :external_id, null: false
      t.string :name, null: false
      t.text :source_url
      t.string :domain
      t.text :summary
      t.text :raw_criteria
      t.datetime :cached_at

      t.timestamps
    end

    add_index :schemes, :external_id, unique: true
    add_index :schemes, :domain
  end
end
