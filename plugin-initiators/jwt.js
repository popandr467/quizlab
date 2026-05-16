module.exports = async (fastify) => {
  await fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false
    }
  });

  fastify.decorate('get_auth_data', async (request) => {
    try {
      const token = await request.jwtVerify();

      if (!token?.sessionID) {
        return { authData: null };
      }

      const conn = await fastify.mysql.getConnection();

      try {
        const [[session = null]] = await conn.query(
          `
          SELECT sessions.user_id, users.name, users.username
          FROM sessions
          JOIN users ON users.id = sessions.user_id
          WHERE sessions.id = ?
          `,
          [token.sessionID]
        );

        if (!session) {
          return { authData: null };
        }

        return {
          authData: {
            id: session.user_id,
            name: session.name,
            username: session.username
          }
        };
      } finally {
        conn.release();
      }
    } catch {
      return { authData: null };
    }
  });

  fastify.decorate('check_auth', async (request) => {
    const { authData } = await fastify.get_auth_data(request);
    return authData !== null;
  });

  fastify.decorate('authenticate', async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);

    if (!authData) {
      return reply.code(401).send({ error: 'Не авторизован' });
    }

    request.user = authData;
  });
};