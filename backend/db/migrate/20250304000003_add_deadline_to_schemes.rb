# frozen_string_literal: true

class AddDeadlineToSchemes < ActiveRecord::Migration[7.2]
  def change
    add_column :schemes, :deadline, :date
  end
end
