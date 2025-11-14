import toast from 'react-hot-toast'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  try {
    return localStorage.getItem('siac_token')
  } catch {
    return null
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    // Network/connection failure — show a single global toast
    toast.error('Backend unreachable. Please check server connection.')
    throw err
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = text
    try { const json = JSON.parse(text); msg = json.detail || JSON.stringify(json) } catch {}
    const err = new Error(msg || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  // 204 no content
  if (res.status === 204) return null

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return await res.json()
  return await res.text()
}

export const api = {
  login: (username, password) => request('/api/v1/auth/login', { method: 'POST', body: { username, password } }),
  // Users
  getUsers: () => request('/api/v1/users'),
  createUser: (payload) => request('/api/v1/users', { method: 'POST', body: payload }),
  updateUser: (id, payload) => request(`/api/v1/users/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteUser: (id) => request(`/api/v1/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getDevices: () => request('/api/v1/devices'),
  getDevice: (id) => request(`/api/v1/devices/${encodeURIComponent(id)}`),
  createDevice: (payload) => request('/api/v1/devices', { method: 'POST', body: payload }),
  updateDevice: (id, payload) => request(`/api/v1/devices/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteDevice: (id) => request(`/api/v1/devices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  sendTelemetry: (payload) => request('/api/v1/telemetry', { method: 'POST', body: payload }),
  getDashboardSummary: () => request('/api/v1/dashboard_summary'),
  getRecentAlerts: (limit = 5) => request(`/api/v1/alerts/recent?limit=${encodeURIComponent(limit)}`),
  getActiveAlerts: () => request('/api/v1/alerts/active'),
  acknowledgeAlert: (alertId) => request(`/api/v1/alerts/${encodeURIComponent(alertId)}/ack`, { method: 'POST' }),
  resolveAlert: (alertId) => request(`/api/v1/alerts/${encodeURIComponent(alertId)}/resolve`, { method: 'POST' }),
  getDevicesActivity24h: () => request('/api/v1/metrics/devices_activity_24h'),
  getDataVolume7d: () => request('/api/v1/metrics/data_volume_7d'),
  // ML endpoints
  getModelStatus: () => request('/api/v1/ml/status'),
  trainModel: (nSamples = 1000) => request('/api/v1/ml/train', { method: 'POST', body: { n_samples: nSamples } }),
  getRecommendations: () => request('/api/v1/alerts/recommendations'),
}
