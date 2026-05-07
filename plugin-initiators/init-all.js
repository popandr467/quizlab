module.exports = (fastify) => {
  require('./cookie')(fastify);
  require('./jwt')(fastify);
  require('./forms')(fastify);
  require('./sql')(fastify);
};