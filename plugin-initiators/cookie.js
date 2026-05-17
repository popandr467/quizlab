module.exports = (fastify) => {
  fastify.register(require("@fastify/cookie"), {
    secret: process.env.COOKIE_SECRET, // Optional: for signed cookies
    parseOptions: {}, // Optional: default parsing options
  });
};
