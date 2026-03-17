# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_03_04_000003) do
  create_table "conversation_turns", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.string "role", null: false
    t.text "content_text"
    t.string "content_type", default: "text", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id", "created_at"], name: "index_conversation_turns_on_session_id_and_created_at"
    t.index ["session_id"], name: "index_conversation_turns_on_session_id"
  end

  create_table "eligibility_results", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "scheme_id", null: false
    t.string "status", null: false
    t.text "reason"
    t.json "missing_info"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["scheme_id"], name: "index_eligibility_results_on_scheme_id"
    t.index ["session_id", "scheme_id"], name: "index_eligibility_results_on_session_id_and_scheme_id", unique: true
    t.index ["session_id"], name: "index_eligibility_results_on_session_id"
  end

  create_table "form_progresses", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "scheme_id", null: false
    t.integer "current_step_index", default: 0, null: false
    t.integer "total_steps"
    t.string "state", default: "draft", null: false
    t.datetime "last_activity_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["scheme_id"], name: "index_form_progresses_on_scheme_id"
    t.index ["session_id", "scheme_id"], name: "index_form_progresses_on_session_id_and_scheme_id", unique: true
    t.index ["session_id"], name: "index_form_progresses_on_session_id"
  end

  create_table "schemes", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "external_id", null: false
    t.string "name", null: false
    t.text "source_url"
    t.string "domain"
    t.text "summary"
    t.text "raw_criteria"
    t.datetime "cached_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "deadline"
    t.index ["domain"], name: "index_schemes_on_domain"
    t.index ["external_id"], name: "index_schemes_on_external_id", unique: true
  end

  create_table "session_discoveries", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "scheme_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["scheme_id"], name: "index_session_discoveries_on_scheme_id"
    t.index ["session_id", "scheme_id"], name: "index_session_discoveries_on_session_id_and_scheme_id", unique: true
    t.index ["session_id"], name: "index_session_discoveries_on_session_id"
  end

  create_table "sessions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "uuid", null: false
    t.string "locale", default: "en", null: false
    t.string "last_step"
    t.string "status", default: "active", null: false
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_sessions_on_status"
    t.index ["uuid"], name: "index_sessions_on_uuid", unique: true
  end

  add_foreign_key "conversation_turns", "sessions"
  add_foreign_key "eligibility_results", "schemes"
  add_foreign_key "eligibility_results", "sessions"
  add_foreign_key "form_progresses", "schemes"
  add_foreign_key "form_progresses", "sessions"
  add_foreign_key "session_discoveries", "schemes"
  add_foreign_key "session_discoveries", "sessions"
end
