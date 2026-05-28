async function createTables(fastify) {
  const connection = await fastify.mysql.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(100) NOT NULL,
        username VARCHAR(30) NOT NULL,
        name VARCHAR(100),
        password_hash VARCHAR(80) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY uq_users_email (email),
        UNIQUE KEY uq_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author_id INT,
        max_attempts INT DEFAULT 1,
        time_limit INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shuffle_questions TINYINT(1) DEFAULT 0,
        show_results TINYINT(1) DEFAULT 1,
        show_answers TINYINT(1) DEFAULT 1,

        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_author (author_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        test_id INT NOT NULL,
        text TEXT NOT NULL,
        type ENUM('text', 'number', 'choice', 'matching', 'crossword') NOT NULL,
        points INT DEFAULT 1,
        options JSON,
        correct_answer TEXT NOT NULL,

        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
        INDEX idx_test (test_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS attempts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        test_id INT NOT NULL,
        user_id INT NOT NULL,
        score INT,
        max_score INT,
        percentage DECIMAL(5,2),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
        INDEX idx_test_user (test_id, user_id),
        INDEX idx_percentage (percentage)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id INT NOT NULL,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        answer TEXT NOT NULL,
        given_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        UNIQUE KEY attempt_question (attempt_id, question_id),
        INDEX idx_attempt_id (attempt_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Таблицы созданы/проверены");
  } finally {
    connection.release();
  }
}

module.exports = (fastify) => {
  fastify.register(require("@fastify/mysql"), {
    promise: true,
    connectionString: process.env.DATABASE_URL,
  });

  fastify.ready(async (err) => {
    if (err) {
      console.error("Ошибка подключения к БД:", err);
      process.exit(1);
    }

    await createTables(fastify);
    console.log("✅ MariaDB готова к работе");
  });
};
