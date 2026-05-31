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
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function toPublicQuestion(question) {
  const options = parseJsonField(question.options, {});

  return {
    id: question.id,
    text: question.text,
    type: question.type,
    points: question.points ?? 1,
    options:
      question.type === "choice" || question.type === 'multichoice'
        ? {
            variants: Array.isArray(options) ? options : [],
          }
        : null,
  };
}

function toPublicAnswer(question) {
  const options = parseJsonField(question.options, {});

  return {
    text: question.text,
    type: question.type,
    points: question.points ?? 1,
    options:
      question.type === "choice" || question.type === 'multichoice'
        ? {
            variants: Array.isArray(options) ? options : [],
          }
        : null,
    answer: question.answer,
    correct_answer: question.correct_answer,
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
    const correct =
      Number.isInteger(selectedIndex) && selectedIndex === correctIndex;

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
    const correct =
      normalizeTextAnswer(answer) ===
      normalizeTextAnswer(question.correct_answer);

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

  if (!username) return { error: "Введите username" };

  if (/\s/.test(withoutAt))
    return { error: "Username не должен содержать пробелы" };

  if (withoutAt.includes("@"))
    return { error: "Символ @ используется только в начале username" };

  if (!USERNAME_RE.test(username))
    return {
      error:
        'Username должен быть длиной 3–30 символов и может содержать латинские буквы, цифры, ".", "_" и "-"',
    };

  return { username };
}

function publicUser(user) {
  if (!user) return null;

  return {
    name: user.name,
    username: user.username,
  };
}

function reducedAttemptStats(attempt) {
  return {
    id: attempt.id,
    score: attempt.score,
    max_score: attempt.max_score,
    percentage: attempt.percentage,
    date: attempt.finished_at,
    name: attempt.name,
  };
}

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {import('fastify').FastifyPluginOptions} options
 */
module.exports = async function apiRoutes(fastify) {
  fastify.get("/me", async (request) => {
    const { authData } = await fastify.get_auth_data(request);

    return { user: publicUser(authData) };
  });

  fastify.get("/profiles/:username", async (request, reply) => {
    const { username, error } = normalizeUsername(request.params.username);
    if (error) return reply.code(404).send({ error: "Профиль не найден" });
    const conn = await fastify.mysql.getConnection();

    try {
      const [[profile = null]] = await conn.query(
        "SELECT name, username, created_at FROM users WHERE username = ?",
        [username],
      );
      if (!profile) return reply.code(404).send({ error: "Профиль не найден" });
      return { profile };
    } finally {
      conn.release();
    }
  });

  fastify.get("/tests", async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);
    if (!authData) return reply.code(401).send({ error: "Не авторизован" });
    const conn = await fastify.mysql.getConnection();

    try {
      const [tests] = await conn.query(
        `SELECT id, title, description, max_attempts, time_limit, created_at
        FROM tests WHERE author_id = ? ORDER BY created_at DESC`,
        [authData.id],
      );
      return { tests };
    } finally {
      conn.release();
    }
  });

  fastify.post("/login",
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
        if (!user)
          return reply.code(401).send({ error: "Неверный email или пароль" });
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid)
          return reply.code(401).send({ error: "Неверный email или пароль" });
        const sessionID = uuidv4();
        await conn.query("INSERT INTO sessions (id, user_id) VALUES (?, ?)", [
          sessionID,
          user.id,
        ]);

        const token = fastify.jwt.sign({ sessionID });

        reply.setCookie("token", token, getCookieOptions());

        return { user: publicUser(user) };
      } finally {
        conn.release();
      }
    },
  );

  fastify.post("/register",
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
      if (!name) return reply.code(400).send({ error: "Введите имя" });
      const normalized = normalizeUsername(usernameRaw);
      if (normalized.error)
        return reply.code(400).send({ error: normalized.error });

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
        const token = fastify.jwt.sign({ sessionID });
        reply.setCookie("token", token, getCookieOptions());

        return { user: { name, username } };
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          const message = String(error.sqlMessage || "");

          if (
            message.includes("username") ||
            message.includes("uq_users_username")
          ) {
            return reply
              .code(409)
              .send({ error: "Пользователь с таким username уже существует" });
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

  fastify.post("/addtest",
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
                required: ["title", "type", "points", "type_specific"],
                properties: {
                  title: { type: "string" },
                  type: { type: "string" },
                  points: { type: "number", minimum: 0 },
                  type_specific: {
                    type: "object",
                    required: [],
                    properties: {
                      text: {
                        type: "object",
                        required: ["correctAnswer"],
                        properties: {
                          correctAnswer: { type: "string" },
                        },
                      },
                      choice: {
                        type: "object",
                        required: ["correct", "variants"],
                        properties: {
                          correct: { type: "number" },
                          variants: {
                            type: "array",
                            items: {
                              type: "object",
                              required: ["text"],
                              properties: { text: { type: "string" } },
                            },
                          },
                        },
                      },
                      multichoice: {
                        type: "object",
                        required: ["correct", "variants"],
                        properties: {
                          correct: { type: "number" },
                          variants: {
                            type: "array",
                            items: {
                              type: "object",
                              required: ["text"],
                              properties: { text: { type: "string" } },
                            },
                          },
                        },
                      },
                    },
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

      if (!authData) return reply.code(401).send({ error: "Не авторизован" });

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
          INSERT INTO tests (title,description,author_id,max_attempts,time_limit,created_at,shuffle_questions,show_result,show_answers)
          VALUES (?,?,?,?,?,?,?,?,?)
          `,
          [
            name,
            description,
            authData.id,
            attemptsCount,
            timeLimit,
            new Date(),
            shuffleQuestions,
            showResult,
            showAnswers,
          ],
        );

        const test_id = result.insertId;
        for (const {
          title,
          type,
          points,
          type_specific: { text: { correctAnswer } = {}, choice: c_options, multichoice: mc_options },
        } of questions) {
          if (type === "text")
            await conn.query(
              `
                INSERT INTO questions (test_id,text,type,points,correct_answer)
                VALUES (?,?,?,?,?)
              `,
              [test_id, title, "text", points, correctAnswer],
            );
          else if (type === "choice" || type === 'multichoice')
            await conn.query(
              `
              INSERT INTO questions (test_id,text,type,points,correct_answer,options)
              VALUES (?,?,?,?,?,?)
              `,
              [
                test_id,
                title,
                type,
                points,
                String((c_options??mc_options).correct),
                JSON.stringify((c_options??mc_options).variants.map((i) => i.text)),
              ],
            );
          else console.error(`unknown question type: ${type}`);
        }
        return { ok: true, testId: test_id };
      } finally {
        conn.release();
      }
    },
  );

  fastify.get("/tests/:id/take", async (request, reply) => {
    const testId = Number(request.params.id);
    if (!Number.isInteger(testId) || testId <= 0)
      return reply.code(400).send({ error: "Некорректный id теста" });
    const { authData } = await fastify.get_auth_data(request);
    if (!authData) return reply.code(401).send({ error: "Не авторизован" });
    const conn = await fastify.mysql.getConnection();
    try {
      const [[test = null]] = await conn.query(
        `SELECT id, title, description, max_attempts, time_limit, created_at, shuffle_questions, show_answers, show_result, author_id
        FROM tests WHERE id = ?`,
        [testId],
      );
      if (!test) return reply.code(404).send({ error: "Тест не найден" });

      const [[attemptInfo]] = await conn.query(
        "SELECT COUNT(*) AS attempts_used FROM attempts WHERE test_id = ? AND user_id = ?",
        [testId, authData.id],
      );

      const attemptsUsed = Number(attemptInfo?.attempts_used ?? 0);
      const maxAttempts = Number(test.max_attempts ?? 1);
      if (
        maxAttempts > 0 &&
        attemptsUsed >= maxAttempts &&
        test.author_id !== authData.id
      )
        return reply.code(403).send({ error: "Количество попыток исчерпано" });

      const [questions] = await conn.query(
        `SELECT id, text, type, points, options
        FROM questions WHERE test_id = ?
        ORDER BY id ASC`,
        [testId],
      );

      const [result] = await conn.query(
        "INSERT INTO attempts (test_id, user_id) VALUES (?,?)",
        [testId, authData.id],
      );

      return {
        test: {
          ...test,
          attemptsUsed,
          attemptsLeft:
            maxAttempts > 0 ? Math.max(maxAttempts - attemptsUsed, 0) : null,
        },
        questions: questions.map(toPublicQuestion),
        attemptId: result.insertId,
      };
    } finally {
      conn.release();
    }
  });

  fastify.post("/attempt/:aid/giveAnswer/:qid",
    {
      schema: {
        body: {
          type: "object",
          required: ["answer"],
          properties: { answer: { type: ["string", "number"] } },
        },
      },
    },
    async (request, reply) => {
      const attemptId = Number(request.params.aid),
        questionId = Number(request.params.qid);
      if (!Number.isInteger(attemptId) || attemptId <= 0)
        return reply.code(400).send({ error: "Некорректный id попытки" });
      if (!Number.isInteger(questionId) || questionId <= 0)
        return reply.code(400).send({ error: "Некорректный id вопроса" });
      const { authData } = await fastify.get_auth_data(request);
      if (!authData) return reply.code(401).send({ error: "Не авторизован" });
      const conn = await fastify.mysql.getConnection();
      try {
        const [[attempt = null]] = await conn.query(
          "SELECT user_id, finished_at, test_id FROM attempts WHERE id=?",
          [attemptId],
        );
        if (!attempt)
          return reply.code(404).send({ error: "Попытка не найдена" });
        if (attempt.user_id !== authData.id)
          return reply.code(401).send({
            error: "Данные авторизации не принадлежат автору попытки",
          });
        if (attempt.finished_at)
          return reply
            .code(400)
            .send({ error: "Попытка уже завершена, дать ответ нельзя" });
        const [[question = null]] = await conn.query(
          "SELECT test_id FROM questions WHERE id=?",
          [questionId],
        );
        if (!attempt)
          return reply.code(404).send({ error: "Вопрос не найден" });
        if (attempt.test_id !== question.test_id)
          return reply
            .code(401)
            .send({ error: "Вопрос и попытка относятся к разным тестам" });
        await conn.query(
          "INSERT IGNORE INTO answers (attempt_id, question_id, answer) VALUES (?, ?, ?)",
          [attemptId, questionId, request.body.answer],
        );
        return reply.code(206).send();
      } finally {
        conn.release();
      }
    },
  );

  fastify.post("/terminate_attempt/:id", async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);
    if (!authData) return reply.code(401).send({ error: "Не авторизован" });
    const attemptId = Number(request.params.id);
    if (!Number.isInteger(attemptId) || attemptId <= 0)
      return reply.code(400).send({ error: "Некорректный id попытки" });
    const conn = await fastify.mysql.getConnection();
    try {
      const [[attempt = null]] = await conn.query(
        "SELECT user_id, finished_at FROM attempts WHERE id=?",
        [attemptId],
      );
      if (!attempt)
        return reply.code(404).send({ error: "Попытка не найдена" });
      if (attempt.user_id !== authData.id)
        return reply
          .code(401)
          .send({ error: "Данные авторизации не принадлежат автору попытки" });
      if (attempt.finished_at)
        return reply
          .code(400)
          .send({ error: "Попытка завершена, прервать нельзя" });
      await conn.query("DELETE FROM attempts WHERE id=?", [attemptId]);
      return reply.code(206).send();
    } finally {
      conn.release();
    }
  });

  fastify.post("/finish_attempt/:id", async (request, reply) => {
    const attemptId = Number(request.params.id);
    if (!Number.isInteger(attemptId) || attemptId <= 0)
      return reply.code(400).send({ error: "Некорректный id попытки" });
    const { authData } = await fastify.get_auth_data(request);
    if (!authData) return reply.code(401).send({ error: "Не авторизован" });
    const conn = await fastify.mysql.getConnection();
    try {
      const [[attempt = null]] = await conn.query(
        `SELECT a.user_id, a.started_at, a.finished_at, a.test_id, t.time_limit FROM attempts a
        JOIN tests t ON a.test_id=t.id
        WHERE a.id=?`,
        [attemptId],
      );
      if (!attempt)
        return reply.code(404).send({ error: "Попытка не найдена" });
      if (attempt.user_id !== authData.id)
        return reply
          .code(401)
          .send({ error: "Данные авторизации не принадлежат автору попытки" });
      if (attempt.finished_at)
        return reply.code(400).send({ error: "Попытка уже завершена" });
      const now = new Date();
      if (now - attempt.started_at > attempt.timeLimit * 60000 + 30000)
        return reply.code(400).send({ error: "Время вышло!" });
      const [answers] = await conn.query(
        `SELECT q.points, q.correct_answer, a.answer FROM questions q
        LEFT JOIN answers a ON a.question_id=q.id AND a.attempt_id=?
        WHERE q.test_id=?`,
        [attemptId, attempt.test_id],
      );
      let score = 0, max_score = 0;
      console.log(attempt.test_id, attemptId);
      console.log(answers);
      for (const { points, answer, correct_answer } of answers) {
        max_score += points;
        if (correct_answer === answer) score += points;
        console.log(answer, correct_answer);
      }
      await conn.query(
        "UPDATE attempts SET finished_at=?, score=?, max_score=?, percentage=? WHERE id=?",
        [now, score, max_score, (score / max_score || 1) * 100, attemptId],
      );
      return reply.code(206).send();
    } finally {
      conn.release();
    }
  });
  /*fastify.post("/tests/:id/submit", async (request, reply) => {
    const { authData } = await fastify.get_auth_data(request);
    if (!authData) return reply.code(401).send({ error: "Не авторизован" });

    const testId = Number(request.params.id);
    const answers = request.body?.answers;

    if (!Number.isInteger(testId) || testId <= 0) return reply.code(400).send({ error: "Некорректный id теста" });

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) return reply.code(400).send({ error: "Передайте answers объектом" });

    const conn = await fastify.mysql.getConnection();

    try {
      const [[test = null]] = await conn.query(`SELECT id, max_attempts FROM tests WHERE id = ?`, [testId]);

      if (!test) {
        return reply.code(404).send({ error: "Тест не найден" });
      }

      const [[attemptInfo]] = await conn.query(
        `SELECT COUNT(*) AS attempts_used FROM attempts
        WHERE test_id = ? AND user_id = ?`, [testId, authData.id]
      );

      const attemptsUsed = Number(attemptInfo?.attempts_used ?? 0);
      const maxAttempts = Number(test.max_attempts ?? 1);

      if (maxAttempts > 0 && attemptsUsed >= maxAttempts) {
        return reply.code(403).send({error: "Количество попыток исчерпано",});
      }

      const [questions] = await conn.query(
        `SELECT id, text, type, points, options, correct_answer
        FROM questions WHERE test_id = ?
        ORDER BY id ASC`, [testId],
      );

      if (questions.length === 0) return reply.code(400).send({ error: "В тесте нет вопросов" });

      let score = 0;
      const maxScore = questions.reduce((sum, question) => sum + Number(question.points ?? 1), 0);

      const checkedAnswers = questions.map((question) => {
        const checked = gradeQuestion(question, answers[String(question.id)]);
        score += checked.earned;
        return checked;
      });

      const percentage = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;

      const [result] = await conn.query(
        `INSERT INTO attempts (test_id, user_id, score, max_score, percentage, finished_at, answers)
        VALUES (?, ?, ?, ?, ?, NOW(), ?)`, [testId, authData.id, score, maxScore, percentage, JSON.stringify(checkedAnswers)]
      );

      return {result: {attemptId: result.insertId, score, maxScore, percentage, answers: checkedAnswers,},};
    } finally {
      conn.release();
    }
  });*/

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

  fastify.get("/report/:id", async (request, reply) => {
    const attemptId = Number(request.params.id);
    if (!Number.isInteger(attemptId) || attemptId <= 0)
      return reply.code(400).send({ error: "Некорректный id попытки" });
    let { authData } = await fastify.get_auth_data(request);
    if (!authData) authData = { id: null };
    const conn = await fastify.mysql.getConnection();
    try {
      const [[attempt = null]] = await conn.query(
        `SELECT a.user_id, a.finished_at, a.test_id, a.percentage, a.score, a.max_score, t.author_id, t.show_result, t.show_answers FROM attempts a
        JOIN tests t ON a.test_id=t.id
        WHERE a.id=?`,
        [attemptId],
      );
      if (!attempt)
        return reply.code(404).send({ error: "Попытка не найдена" });
      if (!attempt.finished_at)
        return reply.code(400).send({ error: "Попытка не завершена" });
      const showResult =
        attempt.show_result || attempt.author_id == authData.id;
      const showAnswers =
        attempt.show_answers || attempt.author_id == authData.id;
      return {
        ...(attempt.user_id !== authData.id
          ? {
              user: publicUser(
                (
                  await conn.query(
                    "SELECT name, username FROM users WHERE id=?",
                    [attempt.user_id],
                  )
                )[0][0],
              ),
            }
          : {}),
        ...(showResult
          ? {
              result: {
                percentage: attempt.percentage,
                score: attempt.score,
                max_score: attempt.max_score,
              },
            }
          : {}),
        ...(showAnswers
          ? {
              answers: (
                await conn.query(
                  `SELECT a.answer, q.correct_answer, q.text, q.type, q.points, q.options
            FROM answers a JOIN questions q ON a.question_id=q.id WHERE a.attempt_id=?`,
                  [attemptId],
                )
              )[0].map(toPublicAnswer),
            }
          : {}),
      };
    } finally {
      conn.release();
    }
  });

  fastify.delete("/tests/:id", async (request, reply) => {
    const testId = Number(request.params.id);
    if (!Number.isInteger(testId) || testId <= 0)
      return reply.code(400).send({ error: "Некорректный id теста" });
    const { authData } = await fastify.get_auth_data(request);
    if (!authData) return reply.code(401).send({ error: "Не авторизован" });
    const conn = await fastify.mysql.getConnection();
    try {
      const [[test]] = await conn.query(
        "SELECT author_id FROM tests WHERE id=?",
        [testId],
      );
      if (!test) return reply.code(404).send({ error: "Тест не найден" });
      if (test.author_id !== authData.id)
        return reply
          .code(401)
          .send({ error: "Данные авторизации не принадлежат автору теста" });
      await conn.query("DELETE FROM tests WHERE id=?", [testId]);
      return reply.code(206).send();
    } finally {
      conn.release();
    }
  });

  fastify.get("/tests/:id/stats", async (request, reply) => {
    const testId = Number(request.params.id);
    if (!Number.isInteger(testId) || testId <= 0)
      return reply.code(400).send({ error: "Некорректный id теста" });
    const { authData } = await fastify.get_auth_data(request);
    if (!authData) return reply.code(401).send({ error: "Не авторизован" });
    const conn = await fastify.mysql.getConnection();
    try {
      const [[test]] = await conn.query(
        "SELECT author_id, title FROM tests WHERE id=?",
        [testId],
      );
      if (!test) return reply.code(404).send({ error: "Тест не найден" });
      if (test.author_id !== authData.id)
        return reply
          .code(401)
          .send({ error: "Данные авторизации не принадлежат автору теста" });
      const res = {
        attempts: (
          await conn.query(
            "SELECT a.id, a.score, a.max_score, a.percentage, a.finished_at, u.name FROM attempts a JOIN users u ON u.id=a.user_id WHERE a.test_id=? and a.finished_at IS NOT NULL",
            [testId],
          )
        )[0], //.map(reducedAttemptStats)
        test_title: test.title,
      };
      console.log(testId);
      console.log(test);
      console.log(res);
      return res;
    } finally {
      conn.release();
    }
  });
};
