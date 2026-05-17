module.exports = (fastify) => {
  const qs = require("qs");
  fastify.register(require("@fastify/formbody"), {
    parser: (str) => qs.parse(str),
  });
};
