export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  
  if (!options.method || options.method === 'GET') {
    // GET requests
  } else if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  options.headers = headers;
  options.credentials = 'include';

  let response = await fetch(url, options);

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
  get: <T = any>(url: string): Promise<ApiResponse<T>> => fetchWithCsrf(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any): Promise<ApiResponse<T>> => {
    const isFormData = body instanceof FormData;
    return fetchWithCsrf(url, {
      method: 'POST',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  },
  put: <T = any>(url: string, body?: any): Promise<ApiResponse<T>> => {
    const isFormData = body instanceof FormData;
    return fetchWithCsrf(url, {
      method: 'PUT',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  },
  delete: <T = any>(url: string): Promise<ApiResponse<T>> => fetchWithCsrf(url, { method: 'DELETE' }),
};
