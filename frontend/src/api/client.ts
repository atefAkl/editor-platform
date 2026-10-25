export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchWithCsrf(url: string, options: RequestInit = {}) {
  // Add CSRF Token setup for Sanctum
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  
  if (!options.method || options.method === 'GET') {
    // For GET requests, we can just proceed
  } else {
    headers.set('Content-Type', 'application/json');
    // Ensure we send cookies for stateful auth
  }

  options.headers = headers;
  options.credentials = 'include'; // Essential for Sanctum session cookies

  let response = await fetch(url, options);

  // If 419 CSRF token mismatch, try fetching the cookie and retry once
  if (response.status === 419) {
    await fetch('/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include',
    });
    response = await fetch(url, options);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || response.statusText,
      data
    );
  }

  return data;
}

export const apiClient = {
  get: (url: string) => fetchWithCsrf(url, { method: 'GET' }),
  post: (url: string, body: any) => fetchWithCsrf(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url: string, body: any) => fetchWithCsrf(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url: string) => fetchWithCsrf(url, { method: 'DELETE' }),
};
