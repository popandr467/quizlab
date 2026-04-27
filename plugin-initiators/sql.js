async function createTables(fastify) {
  const connection = await fastify.mysql.getConnection();
  
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100),
        password_hash VARCHAR(80) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_author (author_id)
      ) ENGINE=InnoDB;
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
      ) ENGINE=InnoDB;
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
        answers JSON,
        FOREIGN KEY (test_id) REFERENCES tests(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_test_user (test_id, user_id),
        INDEX idx_percentage (percentage)
      ) ENGINE=InnoDB;
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id INT NOT NULL,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Таблицы созданы/проверены');
  } finally {
    connection.release(); // Важно! Возвращаем соединение в пул
  }
}

module.exports=(fastify)=>{
  fastify.register(require('@fastify/mysql'), {
    promise: true,  // Используем async/await
    connectionString: process.env.DATABASE_URL
  });
  fastify.ready(async (err) => {
    if (err) {
      console.error('Ошибка подключения к БД:', err);
      process.exit(1);
    }
    
    // Создаём таблицы при старте
    await createTables(fastify);
    console.log('✅ MariaDB готова к работе');
  });
}
