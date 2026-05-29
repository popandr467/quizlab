import { urlEncode as url } from "./utils";

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Ошибка запроса");
  }

  return data;
}

export const api = {
  me() {
    return request("/api/me");
  },
  tests() {
    return request("/api/tests");
  },
  profile(username) {
    return request(url`/api/profiles/${username}`);
  },
  logout() {
    return request("/api/logout", { method: "POST" });
  },
  login(email, password) {
    return request("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(uname, username, email, password) {
    return request("/api/register", {
      method: "POST",
      body: JSON.stringify({ uname, username, email, password }),
    });
  },

  addTest(data) {
    return request("/api/addtest", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  testForPassing(id) {
    return request(url`/api/tests/${id}/take`);
  },

  // submitTest(id, answers) {
  //   return request(url`/api/tests/${id}/submit`, {
  //     method: "POST",
  //     body: JSON.stringify({ answers }),
  //   });
  // },

  attempts() {
    return request("/api/attempts");
  },
  terminateAttempt(id) {
    return request(url`/api/terminate_attempt/${id}`, { method: "POST" });
  },
  giveAnswer(aid, qid, answer) {
    return request(url`/api/attempt/${aid}/giveAnswer/${qid}`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    });
  },
  finishAttempt(aid) {
    return request(url`/api/finish_attempt/${aid}`, { method: "POST" });
  },
  getReport(aid) {
    return request(url`/api/report/${aid}`);
  },
  delTest(id) {
    return request(url`/api/tests/${id}`, { method: "DELETE" });
  },
  testStats(id) {
    return request(url`/api/tests/${id}/stats`);
  },
};
