module.exports=async (fastify) => {
  await fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
    cookie: {cookieName: 'token'}
  });
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const res=await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Не авторизован' });
    }
  });
  fastify.decorate('get_auth_data', async (request, reply)=>{
    try {
      const token = await request.jwtVerify();
      console.log(token);
      const conn=await fastify.mysql.getConnection();
      try{
        const [[session=null]]=await conn.query('SELECT user_id FROM sessions WHERE id = ?',[token.sessionID]);
        if(!session)return {authData:null}
        else return {authData:{name:token.name, user_id:session.user_id}};
      }finally{
        conn.release();
      }
    } catch (err) {
      console.log('-------------------');
      console.log(err)
      return {authData:null};
    }
  });
  fastify.decorate('check_auth', async (request, reply)=>{
    const a=await fastify.get_auth_data(request, reply)
    console.log(a);
    return (a.authData)!==null;
  });
}