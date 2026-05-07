async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Ошибка запроса');
  }

  return data;
}

export const api = {
  me() {
    return request('/api/me');
  },

  tests() {
    return request('/api/tests');
  },

  login(email, password) {
    return request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register(uname, email, password) {
    return request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ uname, email, password })
    });
  },

  logout() {
    return request('/api/logout', {
      method: 'POST'
    });
  }
};