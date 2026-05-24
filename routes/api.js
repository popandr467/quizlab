const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const HASH_ROUNDS = Number(process.env.HASH_ROUNDS || 8);
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

function parseJsonField(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeTextAnswer(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toPublicQuestion(question) {
  const options = parseJsonField(question.options, {});

  return {
    id: question.id,
    text: question.text,
    type: question.type,
    points: question.points ?? 1,
    options:
      question.type === "choice"
        ? {
            variants: Array.isArray(options) ? options : [],
          }
        : null,
  };
}

function gradeQuestion(question, answer) {
  const points = Number(question.points ?? 1);

  if (question.type === "choice") {
    const options = parseJsonField(question.options, {});
    const correctIndex = Number(
      question.correct_answer !== null && question.correct_answer !== ""
        ? question.correct_answer
        : options.correct,
    );

    const selectedIndex = Number(answer);
    const correct = Number.isInteger(selectedIndex) && selectedIndex === correctIndex;

    return {
      questionId: question.id,
      type: question.type,
      answer: Number.isInteger(selectedIndex) ? selectedIndex : null,
      correct,
      earned: correct ? points : 0,
      points,
      correctAnswer: correctIndex,
      correctAnswerText: options.variants?.[correctIndex] ?? null,
    };
  }

  if (question.type === "text") {
    const correct = normalizeTextAnswer(answer) === normalizeTextAnswer(question.correct_answer);

    return {
      questionId: question.id,
      type: question.type,
      answer: String(answer ?? ""),
      correct,
      earned: correct ? points : 0,
      points,
      correctAnswer: question.correct_answer,
    };
  }

  return {
    questionId: question.id,
    type: question.type,
    answer,
    correct: false,
    earned: 0,
    points,
    correctAnswer: null,
  };
}

function getCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
}

function normalizeUsername(value) {
  const raw = String(value ?? "").trim();
  const withoutAt = raw.startsWith("@") ? raw.slice(1) : raw;
  const username = withoutAt.toLowerCase();

  if (!username) {
    return { error: "Введите username" };
  }

  if (/\s/.test(withoutAt)) {
    return { error: "Username не должен содержать пробелы" };
  }

  if (withoutAt.includes("@")) {
    return { error: "Символ @ используется только в начале username" };
  }

  if (!USERNAME_RE.test(username)) {
    return {
      error:
        'Username должен быть длиной 3–30 символов и может содержать латинские буквы, цифры, ".", "_" и "-"',
    };
  }

  return { username };
}

function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    name: user.name,
    username: user.username,
  };
}

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {import('fastify').FastifyPluginOptions} options
 */
module.exports = async function apiRoutes(fastify) {
  fastify.get("/me", async (request) => {
    const { authData } = await fastify.get_auth_data(request);

    return {
      user: publicUser(authData),
    };
  });


  fastify.get("/profiles/:username", async (request, reply) => {
    const { username, error } = normalizeUsername(request.params.username);

    if (error) {
      return reply.code(404).send({ error: "Профиль не найден" });
    }

    const conn = await fastify.mysql.getConnection();

    try {
      const [[profile = null]] = await conn.query(
        `
        SELECT name, username, created_at
        FROM users
        WHERE username = ?
        `,
        [username],
      );

      if (!profile) {
        return reply.code(404).send({ error: "Профиль не найден" });
      }

      return { profile };
    } finally {
      conn.release();
    }
  });


  fastify.get("/tests", async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);

    if (!authData) {
      return reply.code(401).send({ error: "Не авторизован" });
    }

    const conn = await fastify.mysql.getConnection();

    try {
      const [tests] = await conn.query(
        `
        SELECT id, title, description, max_attempts, time_limit, created_at
        FROM tests
        WHERE author_id = ?
        ORDER BY created_at DESC
        `,
        [authData.id],
      );

      return { tests };
    } finally {
      conn.release();
    }
  });


  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const conn = await fastify.mysql.getConnection();

      try {
        const [[user = null]] = await conn.query(
          "SELECT id, password_hash, name, username FROM users WHERE email = ?",
          [email],
        );

        if (!user) return reply.code(401).send({ error: "Неверный email или пароль" });

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) return reply.code(401).send({ error: "Неверный email или пароль" });

        const sessionID = uuidv4();

        await conn.query("INSERT INTO sessions (id, user_id) VALUES (?, ?)", [
          sessionID,
          user.id,
        ]);

        const token = fastify.jwt.sign({sessionID,});

        reply.setCookie("token", token, getCookieOptions());

        return {user: publicUser(user),};
      } finally {
        conn.release();
      }
    },
  );


  fastify.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["uname", "username", "email", "password"],
          properties: {
            uname: { type: "string", minLength: 1 },
            username: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { uname, username: usernameRaw, email, password } = request.body;

      const name = uname.trim();

      if (!name) {
        return reply.code(400).send({ error: "Введите имя" });
      }

      const normalized = normalizeUsername(usernameRaw);

      if (normalized.error) {
        return reply.code(400).send({ error: normalized.error });
      }

      const username = normalized.username;

      const conn = await fastify.mysql.getConnection();

      try {
        const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);

        const [result] = await conn.query(
          "INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)",
          [name, username, email, passwordHash],
        );

        const userId = result.insertId;
        const sessionID = uuidv4();

        await conn.query("INSERT INTO sessions (id, user_id) VALUES (?, ?)", [
          sessionID,
          userId,
        ]);

        const token = fastify.jwt.sign({
          sessionID,
        });

        reply.setCookie("token", token, getCookieOptions());

        return {
          user: {
            name,
            username,
          },
        };
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          const message = String(error.sqlMessage || "");

          if (
            message.includes("username") ||
            message.includes("uq_users_username")
          ) {
            return reply.code(409).send({
              error: "Пользователь с таким username уже существует",
            });
          }

          return reply.code(409).send({
            error: "Пользователь с таким email уже существует",
          });
        }

        throw error;
      } finally {
        conn.release();
      }
    },
  );


  fastify.post("/logout", async (request, reply) => {
    let token = null;

    try {
      token = await request.jwtVerify();
    } catch {
      token = null;
    }

    if (token?.sessionID) {
      const conn = await fastify.mysql.getConnection();

      try {
        await conn.query("DELETE FROM sessions WHERE id = ?", [
          token.sessionID,
        ]);
      } finally {
        conn.release();
      }
    }

    reply.clearCookie("token", { path: "/" });

    return { ok: true };
  });


  fastify.post(
    "/addtest",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "deadline",
            "timeLimit",
            "name",
            "description",
            "attemptsCount",
            "shuffleQuestions",
            "showResult",
            "showAnswers",
            "questions",
          ],
          properties: {
            deadline: { type: "string" },
            timeLimit: { type: "number" },
            name: { type: "string" },
            description: { type: "string" },
            attemptsCount: { type: "number" },
            shuffleQuestions: { type: "boolean" },
            showResult: { type: "boolean" },
            showAnswers: { type: "boolean" },
            questions: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["title", "type", "points","type_specific"],
                properties: {
                  title: { type: "string" },
                  type: { type: "string" },
                  points: { type: "number", minimum: 0 },
                  type_specific:{
                    type:'object',
                    required:[],
                    properties:{
                      text:{
                        type:'object',
                        required:['correctAnswer'],
                        properties:{
                          correctAnswer:{type:'string'}
                        }
                      },
                      choice: {
                        type: "object",
                        required: ["correct", "variants"],
                        properties: {
                          correct: { type: "number" },
                          variants: {
                            type: "array",
                            items: { type: "object", required:['text'], properties: {text: {type:'string'}} },
                          },
                        },
                      },
                    }
                  },
                },
              },
            },
            // uname: { type: "string", minLength: 1 },
            // username: { type: "string", minLength: 1 },
            // email: { type: "string", format: "email" },
            // password: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { authData } = await fastify.get_auth_data(request);

      if (!authData) {
        return reply.code(401).send({ error: "Не авторизован" });
      }

      const conn = await fastify.mysql.getConnection();

      try {
        const {
          deadline,
          timeLimit,
          name,
          description,
          attemptsCount,
          shuffleQuestions,
          showResult,
          showAnswers,
          questions,
        } = request.body;
        const [result] = await conn.query(
          `
          INSERT INTO tests (title,description,author_id,max_attempts,time_limit,created_at)
          VALUES (?,?,?,?,?,?)
          `,
          [
            name,
            description,
            authData.id,
            attemptsCount,
            timeLimit,
            new Date(),
          ],
        );

        const test_id = result.insertId;
        for (const {
          title,
          type,
          points,
          type_specific:{
            text:{correctAnswer}={},
            choice:options
          }
        } of questions) {
          if (type === "text")
            await conn.query(
              `
                INSERT INTO questions (test_id,text,type,points,correct_answer)
                VALUES (?,?,?,?,?)
              `,
              [test_id, title, "text", points, correctAnswer],
            );
          else if (type === "choice")
            await conn.query(
              `
              INSERT INTO questions (test_id,text,type,points,correct_answer,options)
              VALUES (?,?,?,?,?,?)
              `,
              [
                test_id,
                title,
                "choice",
                points,
                String(options.correct),
                JSON.stringify(options.variants.map(i=>i.text)),
              ],
            );
        }
        return { ok: true, testId: test_id };
      } finally {
        conn.release();
      }
    },
  );


  fastify.get("/tests/:id/take", async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);

    if (!authData)return reply.code(401).send({ error: "Не авторизован" });

    const testId = Number(request.params.id);

    if (!Number.isInteger(testId) || testId <= 0) return reply.code(400).send({ error: "Некорректный id теста" });

    const conn = await fastify.mysql.getConnection();

    try {
      const [[test = null]] = await conn.query(
        `
        SELECT id, title, description, max_attempts, time_limit, created_at
        FROM tests
        WHERE id = ?
        `,
        [testId],
      );

      if (!test) return reply.code(404).send({ error: "Тест не найден" });

      const [[attemptInfo]] = await conn.query(
        `
        SELECT COUNT(*) AS attempts_used
        FROM attempts
        WHERE test_id = ? AND user_id = ?
        `,
        [testId, authData.id],
      );

      const attemptsUsed = Number(attemptInfo?.attempts_used ?? 0);
      const maxAttempts = Number(test.max_attempts ?? 1);

      if (maxAttempts > 0 && attemptsUsed >= maxAttempts) {
        return reply.code(403).send({
          error: "Количество попыток исчерпано",
        });
      }

      const [questions] = await conn.query(
        `
        SELECT id, text, type, points, options
        FROM questions
        WHERE test_id = ?
        ORDER BY id ASC
        `,
        [testId],
      );

      return {
        test: {
          ...test,
          attemptsUsed,
          attemptsLeft: maxAttempts > 0 ? Math.max(maxAttempts - attemptsUsed, 0) : null,
        },
        questions: questions.map(toPublicQuestion),
      };
    } finally {
      conn.release();
    }
  });


  fastify.post("/tests/:id/submit", async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);

    if (!authData) {
      return reply.code(401).send({ error: "Не авторизован" });
    }

    const testId = Number(request.params.id);
    const answers = request.body?.answers;

    if (!Number.isInteger(testId) || testId <= 0) {
      return reply.code(400).send({ error: "Некорректный id теста" });
    }

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return reply.code(400).send({ error: "Передайте answers объектом" });
    }

    const conn = await fastify.mysql.getConnection();

    try {
      const [[test = null]] = await conn.query(
        `
        SELECT id, max_attempts
        FROM tests
        WHERE id = ?
        `,
        [testId],
      );

      if (!test) {
        return reply.code(404).send({ error: "Тест не найден" });
      }

      const [[attemptInfo]] = await conn.query(
        `
        SELECT COUNT(*) AS attempts_used
        FROM attempts
        WHERE test_id = ? AND user_id = ?
        `,
        [testId, authData.id],
      );

      const attemptsUsed = Number(attemptInfo?.attempts_used ?? 0);
      const maxAttempts = Number(test.max_attempts ?? 1);

      if (maxAttempts > 0 && attemptsUsed >= maxAttempts) {
        return reply.code(403).send({
          error: "Количество попыток исчерпано",
        });
      }

      const [questions] = await conn.query(
        `
        SELECT id, text, type, points, options, correct_answer
        FROM questions
        WHERE test_id = ?
        ORDER BY id ASC
        `,
        [testId],
      );

      if (questions.length === 0) {
        return reply.code(400).send({ error: "В тесте нет вопросов" });
      }

      let score = 0;
      const maxScore = questions.reduce(
        (sum, question) => sum + Number(question.points ?? 1),
        0,
      );

      const checkedAnswers = questions.map((question) => {
        const checked = gradeQuestion(question, answers[String(question.id)]);
        score += checked.earned;
        return checked;
      });

      const percentage = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;

      const [result] = await conn.query(
        `
        INSERT INTO attempts
          (test_id, user_id, score, max_score, percentage, finished_at, answers)
        VALUES
          (?, ?, ?, ?, ?, NOW(), ?)
        `,
        [
          testId,
          authData.id,
          score,
          maxScore,
          percentage,
          JSON.stringify(checkedAnswers),
        ],
      );

      return {
        result: {
          attemptId: result.insertId,
          score,
          maxScore,
          percentage,
          answers: checkedAnswers,
        },
      };
    } finally {
      conn.release();
    }
  });

  fastify.get("/attempts", async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);

    if (!authData) {
      return reply.code(401).send({ error: "Не авторизован" });
    }

    const conn = await fastify.mysql.getConnection();

    try {
      const [attempts] = await conn.query(
        `
        SELECT
          attempts.id,
          attempts.test_id,
          tests.title AS test_title,
          attempts.score,
          attempts.max_score,
          attempts.percentage,
          attempts.finished_at
        FROM attempts
        JOIN tests ON tests.id = attempts.test_id
        WHERE attempts.user_id = ?
        ORDER BY attempts.finished_at DESC, attempts.id DESC
        `,
        [authData.id],
      );

      return { attempts };
    } finally {
      conn.release();
    }
  });

};
