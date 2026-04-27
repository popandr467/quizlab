module.exports=(fastify) => {
  fastify.register(require('@fastify/view'), {
    engine: { ejs: require('ejs') },
    root: './views'
  });
}