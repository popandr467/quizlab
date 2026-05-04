require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const HASH_ROUNDS=Number(process.env.HASH_ROUNDS); // Загружаем конфиг

require('./plugin-initiators/init-all')(fastify);

// fastify.register(require('./routes/root'),{prefix:'/'});

fastify.get('/', async (request, reply)=>{
    const {authData}=await fastify.get_auth_data(request);
    if(authData){
        let tests=[];
        const conn=await fastify.mysql.getConnection();
        try{
            [tests]=await conn.query('SELECT id, title FROM tests WHERE author_id = ?', [authData.user_id]);
        }catch(err){
            conn.release();
            throw err;
        }
        conn.release();
        console.log(authData);
        return reply.view('layout.ejs',{authData, title: "Homepage", body:(`
        <div class="row justify-content-center align-items-center col-sm-12">
            <div class="row col-sm-12">
                <div class="col-lg-6 col-sm-12">
                    <div class="card mb-2 overflow-y-auto" style="min-height:200px; max-height:60vh">
                        <div class="card-header bg-white">
                            <h4 class="mb-0">Ваши тесты</h4>
                        </div>
                        <div class="d-flex flex-column flex-grow-1 m-3">
                            <div id="itemsListContainer" class="d-flex flex-column gap-2">
                                ${tests.map(i=>`
                                <div class="item-object d-flex justify-content-between align-items-center p-3 bg-white border rounded-3 shadow-sm">
                                    <span class="fw-medium text-dark">${i.title}</span>
                                    <button class="btn btn-sm btn-outline-danger delete-btn" type="button">
                                        <i class="bi bi-trash3"></i> Удалить
                                    </button>
                                </div>`)}
                                <!--<div class="item-object d-flex justify-content-between align-items-center p-3 bg-white border rounded-3 shadow-sm">
                                    <span class="fw-medium text-dark">Проект "Весенний марафон"</span>
                                    <button class="btn btn-sm btn-outline-danger delete-btn" type="button">
                                        <i class="bi bi-trash3"></i> Удалить
                                    </button>
                                </div>
                                <div class="item-object d-flex justify-content-between align-items-center p-3 bg-white border rounded-3 shadow-sm">
                                    <span class="fw-medium text-dark">Документация API v2</span>
                                    <button class="btn btn-sm btn-outline-danger delete-btn" type="button">
                                        <i class="bi bi-trash3"></i> Удалить
                                    </button>
                                </div>
                                <div class="item-object d-flex justify-content-between align-items-center p-3 bg-white border rounded-3 shadow-sm">
                                    <span class="fw-medium text-dark">Аналитика продаж</span>
                                    <button class="btn btn-sm btn-outline-danger delete-btn" type="button">
                                        <i class="bi bi-trash3"></i> Удалить
                                    </button>
                                </div>
                                <div class="item-object d-flex justify-content-between align-items-center p-3 bg-white border rounded-3 shadow-sm">
                                    <span class="fw-medium text-dark">Редизайн главной страницы</span>
                                    <button class="btn btn-sm btn-outline-danger delete-btn" type="button">
                                        <i class="bi bi-trash3"></i> Удалить
                                    </button>
                                </div>
                                <div class="item-object d-flex justify-content-between align-items-center p-3 bg-white border rounded-3 shadow-sm">
                                    <span class="fw-medium text-dark">Отчет по KPI за март</span>
                                    <button class="btn btn-sm btn-outline-danger delete-btn" type="button">
                                        <i class="bi bi-trash3"></i> Удалить
                                    </button>
                                </div>-->
                            </div>
                            <div class="mt-3">
                                <a id="addItemBtn" class="btn btn-primary btn-sm w-100" href="/tests/create">
                                    <i class="bi bi-plus-circle"></i> Новый тест
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 col-sm-12">
                    <div class="card mb-2 column" style="min-height:200px">
                        <div class="card-header bg-white">
                            <h4 class="mb-0">Статистика</h4>
                        </div>
                        <div class="d-flex flex-column justify-content-center align-items-center flex-grow-1">
                            Скоро появится...
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `)});
    } else {
        return reply.view('layout.ejs',{authData, title: "Homepage", body:''});
    }
    
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
        console.log(err.stack);
        throw err;
    }finally{
        conn.release();
    }
});

fastify.get('/logout', async (request, reply)=>{
    reply.clearCookie('token');
    return reply.redirect('/')
});

// fastify.get('/tests/create', async (request, reply)=>{

// })

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