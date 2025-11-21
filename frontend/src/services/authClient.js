const API_BASE = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:4000';

const STORAGE_KEY = 'univote::authSession';

const makeRequest = async (path, { token, ...options } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || 'Request failed.';
    throw new Error(message);
  }

  return payload;
};

export const signIn = async ({ identifier, password }) =>
  makeRequest('/sign-in', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  });

export const signUp = async ({ username, email, password }) =>
  makeRequest('/sign-up', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });

export const requestWalletNonce = async (address) =>
  makeRequest('/wallet/nonce', {
    method: 'POST',
    body: JSON.stringify({ address })
  });

export const verifyWalletSignature = async ({ address, signature }) =>
  makeRequest('/wallet/verify', {
    method: 'POST',
    body: JSON.stringify({ address, signature })
  });

export const getSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse stored session', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const setSession = (session) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getAuthToken = () => getSession()?.token || '';

export const withAuth = async (path, options = {}) =>
  makeRequest(path, { ...options, token: getAuthToken() });

export const publicRequest = async (path, options = {}) => makeRequest(path, options);
