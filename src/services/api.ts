const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('auth-storage')

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${JSON.parse(token).state.token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error(error.message || `Error ${response.status}`)
  }

  return response.json()
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, username: string, password: string) =>
    apiFetch<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    }),
}

export const tablesApi = {
  getTables: () => apiFetch<any[]>('/tables'),
  createTable: (data: { name: string; minBuyIn: number }) =>
    apiFetch<any>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTable: (id: string) => apiFetch<any>(`/tables/${id}`),
  joinTable: (id: string) =>
    apiFetch<any>(`/tables/${id}/join`, { method: 'POST' }),
  leaveTable: (id: string) =>
    apiFetch<void>(`/tables/${id}/leave`, { method: 'DELETE' }),
}

export const paymentsApi = {
  createPreference: (amount: number) =>
    apiFetch<{ preferenceId: string; initPoint: string }>('/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  getPayments: () => apiFetch<any[]>('/payments'),
}