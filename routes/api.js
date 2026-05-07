const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const HASH_ROUNDS = Number(process.env.HASH_ROUNDS || 8);

function getCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
}

module.exports = async function apiRoutes(fastify) {
  fastify.get('/me', async (request) => {
    const { authData } = await fastify.get_auth_data(request);

    return {
      user: authData
    };
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
        'SELECT id, password_hash, name FROM users WHERE email = ?',
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
        name: user.name
      });

      reply.setCookie('token', token, getCookieOptions());

      return {
        user: {
          id: user.id,
          name: user.name
        }
      };
    } finally {
      conn.release();
    }
  });

  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['uname', 'email', 'password'],
        properties: {
          uname: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const { uname, email, password } = request.body;
    const name = uname.trim();

    if (!name) {
      return reply.code(400).send({ error: 'Введите имя' });
    }

    const conn = await fastify.mysql.getConnection();

    try {
      const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);

      const [result] = await conn.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      );

      const userId = result.insertId;
      const sessionID = uuidv4();

      await conn.query(
        'INSERT INTO sessions (id, user_id) VALUES (?, ?)',
        [sessionID, userId]
      );

      const token = fastify.jwt.sign({
        sessionID,
        id: userId,
        name
      });

      reply.setCookie('token', token, getCookieOptions());

      return {
        user: {
          id: userId,
          name
        }
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
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