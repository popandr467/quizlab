async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
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
    return request(`/api/profiles/${encodeURIComponent(username)}`);
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

  logout() {
    return request("/api/logout", {
      method: "POST",
    });
  },

  addTest(data) {
    return request("/api/addtest", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  testForPassing(id) {
    return request(`/api/tests/${encodeURIComponent(id)}/take`);
  },

  submitTest(id, answers) {
    return request(`/api/tests/${encodeURIComponent(id)}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  },

  attempts() {
    return request("/api/attempts");
  },
};