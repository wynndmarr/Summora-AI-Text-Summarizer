USE summora_db;

CREATE TABLE IF NOT EXISTS summaries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    original_text LONGTEXT NOT NULL,
    main_idea TEXT,
    summary_points JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
