module.exports = (fastify) => {
  require("./cookie")(fastify);
  require("./jwt")(fastify);
  require("./forms")(fastify);
  require("./multipart")(fastify);
  require("./sql")(fastify);
};