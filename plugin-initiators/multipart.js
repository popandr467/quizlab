module.exports = (fastify) => {
  fastify.register(require("@fastify/multipart"), {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });
};