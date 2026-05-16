const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const HASH_ROUNDS = Number(process.env.HASH_ROUNDS || 8);
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

function getCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
}

function normalizeUsername(value) {
  const raw = String(value ?? '').trim();
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  const username = withoutAt.toLowerCase();

  if (!username) {
    return { error: 'Введите username' };
  }

  if (/\s/.test(withoutAt)) {
    return { error: 'Username не должен содержать пробелы' };
  }

  if (withoutAt.includes('@')) {
    return { error: 'Символ @ используется только в начале username' };
  }

  if (!USERNAME_RE.test(username)) {
    return {
      error:
        'Username должен быть длиной 3–30 символов и может содержать латинские буквы, цифры, ".", "_" и "-"'
    };
  }

  return { username };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username
  };
}

module.exports = async function apiRoutes(fastify) {
  fastify.get('/me', async (request) => {
    const { authData } = await fastify.get_auth_data(request);
    return { user: authData };
  });

  fastify.get('/profiles/:username', async (request, reply) => {
    const { username, error } = normalizeUsername(request.params.username);

    if (error) {
      return reply.code(404).send({ error: 'Профиль не найден' });
    }

    const conn = await fastify.mysql.getConnection();

    try {
      const [[profile = null]] = await conn.query(
        `
        SELECT id, name, username, created_at
        FROM users
        WHERE username = ?
        `,
        [username]
      );

      if (!profile) {
        return reply.code(404).send({ error: 'Профиль не найден' });
      }

      return { profile };
    } finally {
      conn.release();
    }
  });

  fastify.get('/tests', async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);

    if (!authData) {
      return reply.code(401).send({ error: 'Не авторизован' });
    }

    const conn = await fastify.mysql.getConnection();

    try {
      const [tests] = await conn.query(
        `
        SELECT id, title, description, max_attempts, time_limit, created_at
        FROM tests
        WHERE author_id = ?
        ORDER BY created_at DESC
        `,
        [authData.id]
      );

      return { tests };
    } finally {
      conn.release();
    }
  });

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    const conn = await fastify.mysql.getConnection();

    try {
      const [[user = null]] = await conn.query(
        'SELECT id, password_hash, name, username FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return reply.code(401).send({ error: 'Неверный email или пароль' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return reply.code(401).send({ error: 'Неверный email или пароль' });
      }

      const sessionID = uuidv4();

      await conn.query(
        'INSERT INTO sessions (id, user_id) VALUES (?, ?)',
        [sessionID, user.id]
      );

      const token = fastify.jwt.sign({
        sessionID,
        id: user.id,
        name: user.name,
        username: user.username
      });

      reply.setCookie('token', token, getCookieOptions());

      return {
        user: publicUser(user)
      };
    } finally {
      conn.release();
    }
  });

  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['uname', 'username', 'email', 'password'],
        properties: {
          uname: { type: 'string', minLength: 1 },
          username: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const { uname, username: usernameRaw, email, password } = request.body;

    const name = uname.trim();

    if (!name) {
      return reply.code(400).send({ error: 'Введите имя' });
    }

    const normalized = normalizeUsername(usernameRaw);

    if (normalized.error) {
      return reply.code(400).send({ error: normalized.error });
    }

    const username = normalized.username;

    const conn = await fastify.mysql.getConnection();

    try {
      const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);

      const [result] = await conn.query(
        'INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)',
        [name, username, email, passwordHash]
      );

      const userId = result.insertId;
      const sessionID = uuidv4();

      await conn.query(
        'INSERT INTO sessions (id, user_id) VALUES (?, ?)',
        [sessionID, userId]
      );

      const user = {
        id: userId,
        name,
        username
      };

      const token = fastify.jwt.sign({
        sessionID,
        id: userId,
        name,
        username
      });

      reply.setCookie('token', token, getCookieOptions());

      return { user };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const message = String(error.sqlMessage || '');

        if (message.includes('username') || message.includes('uq_users_username')) {
          return reply.code(409).send({
            error: 'Пользователь с таким username уже существует'
          });
        }

        return reply.code(409).send({
          error: 'Пользователь с таким email уже существует'
        });
      }

      throw error;
    } finally {
      conn.release();
    }
  });

  fastify.post('/logout', async (request, reply) => {
    let token = null;

    try {
      token = await request.jwtVerify();
    } catch {
      token = null;
    }

    if (token?.sessionID) {
      const conn = await fastify.mysql.getConnection();

      try {
        await conn.query(
          'DELETE FROM sessions WHERE id = ?',
          [token.sessionID]
        );
      } finally {
        conn.release();
      }
    }

    reply.clearCookie('token', { path: '/' });

    return { ok: true };
  });
};