require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const fastify = require('fastify')({
  logger: true
});

require('./plugin-initiators/init-all')(fastify);

fastify.register(require('./routes/api'), {
  prefix: '/api'
});

const frontendDist = path.join(__dirname, 'frontend', 'dist');
const frontendIndex = path.join(frontendDist, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndex);

if (hasFrontendBuild) {
  fastify.register(require('@fastify/static'), {
    root: frontendDist,
    prefix: '/'
  });
}

fastify.setNotFoundHandler((request, reply) => {
  const url = request.raw.url || '';

  if (url.startsWith('/api/')) {
    return reply.code(404).send({
      error: 'API route not found'
    });
  }

  if (hasFrontendBuild) {
    return reply.sendFile('index.html');
  }

  return reply.code(404).send({
    error: 'Frontend build not found. Для разработки откройте http://localhost:5173 или выполните npm run build:frontend.'
  });
});

const start = async () => {
  try {
    console.log('Сервер запускается на http://localhost:3000');

    await fastify.listen({
      port: 3000,
      host: '0.0.0.0'
    });

    console.log('Сервер запущен на http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();