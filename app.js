require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const HASH_ROUNDS=8;
fastify.register(require('@fastify/view'), {
  engine: { ejs: require('ejs') },
  root: './views'
});

fastify.register(require('@fastify/cookie'), {
  secret: process.env.COOKIE_SECRET, // Optional: for signed cookies
  parseOptions: {}     // Optional: default parsing options
})
const qs = require('qs')
fastify.register(require('@fastify/formbody'), { parser: str => qs.parse(str) })


// Подключаем mysql и JWT
require('./sqlinit')(fastify);
require('./jwtinit')(fastify);
// fastify.register(require('./sqlinit'),{});
// fastify.register(require('./jwtinit'),{});

// fastify.register(require('./routes/root'),{prefix:'/'});

// fastify.decorate

fastify.get('/', async (request, reply)=>{
    const authData=(await fastify.get_auth_data(request)).authData;
    const authenticated=await fastify.check_auth(request);
    return reply.view('layout.ejs',{authData, title: "Homepage", body:(authData?`
        <div class="
    `:'')});
});

fastify.get('/login', async (request, reply)=>{
    const authData=(await fastify.get_auth_data(request)).authData;
    const authenticated=await fastify.check_auth(request);
    if(authData!==null)reply.redirect('/logout');
    return reply.view('layout.ejs',{authData, title: "Login", body:`
    <div class="row justify-content-center align-items-center">
        <div class="col-lg-4 col-sm-6">
            <div class="card">
                <div class="card-header bg-white">
                    <h4 class="mb-0">Вход в систему</h4>
                </div>
                <div class="card-body">
                    <form action method="POST">
                        <div class="mb-3">
                            <label for="email" class="form-label">Email адрес</label>
                            <input type="email" class="form-control" id="email" placeholder="example@mail.com" required name="email">
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Пароль</label>
                            <input type="password" class="form-control" id="password" placeholder="Введите пароль" required name="password">
                        </div>
                        <!--<div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="remember">
                            <label class="form-check-label" for="remember">Запомнить меня</label>
                        </div>-->
                        <button type="submit" class="btn btn-primary w-100">Войти</button>
                    </form>
                </div>
                <div class="card-footer bg-white text-center">
                    <small class="text-muted">Нет аккаунта? <a href="/register">Зарегистрироваться</a></small>
                </div>
            </div>
        </div>
    </div>`});
});

fastify.post('/login',  {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        password: { type: 'string' },
        email: { type: 'string', format: 'email' },
      }
    }
  }
}, async (request, reply)=>{
    const {email, password} = request.body;
    const conn = await fastify.mysql.getConnection();
    try{
        const [[user=null]] = await conn.query(
            'SELECT id, password_hash, name FROM users WHERE email = ?',
            [email]
        );
        if(user){
            const isValid = await bcrypt.compare(password, user.password_hash);
            if(isValid){
                const sessionID=uuidv4();
                await conn.query(`INSERT INTO sessions (id, user_id) VALUES (?, ?)`,[sessionID, user.id]);
                const token=fastify.jwt.sign({
                    sessionID, name:user.name, id:user.id
                });
                reply.setCookie('token', token, {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict'
                });
                
                return reply.redirect('/');
            }
        }
        return reply.redirect('#');
    }catch(err){
        // conn.release();
        throw err;
    }finally{
        conn.release();
    }
    
})

fastify.get('/register', async (request, reply)=>{
    const authenticated=await fastify.check_auth(request);
    if(authenticated)reply.redirect('/logout');
    return reply.view('layout.ejs',{authData:null, title: "Registration", body:`
        <div class="row justify-content-center align-items-center">
        <div class="col-lg-4 col-sm-6">
            <div class="card">
                <div class="card-header bg-white">
                    <h4 class="mb-0">Регистрация</h4>
                </div>
                <div class="card-body">
                    <form action method="POST">
                        <div class="mb-3">
                            <label for="uname" class="form-label">Ваше имя</label>
                            <input class="form-control" id="uname" placeholder="Иван Кузнецов" required name="uname">
                        </div>
                        <div class="mb-3">
                            <label for="email" class="form-label">Email адрес</label>
                            <input type="email" class="form-control" id="email" placeholder="example@mail.com" required name="email">
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Пароль</label>
                            <input type="password" class="form-control" id="password" placeholder="Введите пароль" required name="password">
                        </div>
                        <!-- <div class="mb-3">
                            <label for="password-repeat" class="form-label">Повторите пароль</label>
                            <input type="password" class="form-control" id="password-repeat" placeholder="Повторите пароль" required>
                        </div> -->
                        <button type="submit" class="btn btn-primary w-100">Регистрация</button>
                    </form>
                </div>
                <div class="card-footer bg-white text-center">
                    <small class="text-muted">Уже есть аккаунт? <a href="/login">Войти</a></small>
                </div>
            </div>
        </div>
    </div>`});
});

fastify.post('/register',{
  schema: {
    body: {
      type: 'object',
      required: ['uname','email', 'password'],
      properties: {
        password: { type: 'string' },
        email: { type: 'string', format: 'email' },
        uname: { type: 'string' }
      }
    }
  }
},async (request, reply)=>{
    const {email, password, uname} = request.body;
    const conn = await fastify.mysql.getConnection();
    try{
        const pwhsh=await bcrypt.hash(password, HASH_ROUNDS);

        const [res] = await conn.query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [uname, email, pwhsh]
        );
        const sessionID=uuidv4();
        await conn.query(`INSERT INTO sessions (id, user_id) VALUES (?, ?)`,[sessionID, res.insertId]);
        const token=fastify.jwt.sign({
            sessionID, name:uname, id: res.insertId
        });
        reply.setCookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });
        
        return reply.redirect('/');
    }catch(err){
        // conn.release();
        throw err;
    }finally{
        conn.release();
    }
});

fastify.get('/logout', async (request, reply)=>{
    reply.clearCookie('token');
    return reply.redirect('/')
});



const start = async () => {
//   await fastify.ready();
  try {
    console.log('Сервер запускается на http://localhost:3000');
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Сервер запущен на http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
start();