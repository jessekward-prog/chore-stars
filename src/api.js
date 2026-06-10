async function req(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export const getState         = () => req('/api/state')
export const toggleChore      = (kidId, choreId) => req('/api/toggle',       { method: 'POST', body: JSON.stringify({ kidId, choreId }) })
export const markDayComplete  = (dayKey)          => req('/api/day-complete', { method: 'POST', body: JSON.stringify({ dayKey }) })
export const markWheelSpun    = ()                => req('/api/wheel-spun',   { method: 'POST', body: JSON.stringify({}) })
export const resetDay         = ()                => req('/api/day-reset',    { method: 'POST', body: JSON.stringify({}) })

export const login          = (password)    => req('/api/auth/login',           { method: 'POST', body: JSON.stringify({ password }) })
export const logout         = ()            => req('/api/auth/logout',          { method: 'POST', body: JSON.stringify({}) })
export const getAuthStatus  = ()            => req('/api/auth/status')
export const changePassword = (newPassword) => req('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ newPassword }) })

export const createKid = (data) => req('/api/kids',         { method: 'POST',   body: JSON.stringify(data) })
export const updateKid = (id, data) => req(`/api/kids/${id}`, { method: 'PUT',  body: JSON.stringify(data) })
export const deleteKid = (id) => req(`/api/kids/${id}`,     { method: 'DELETE' })
export const uploadAvatar = (id, file) => {
  const form = new FormData()
  form.append('avatar', file)
  return fetch(`/api/kids/${id}/avatar`, { method: 'POST', body: form }).then(r => r.json())
}

export const createChore = (data)      => req('/api/chores',          { method: 'POST',   body: JSON.stringify(data) })
export const updateChore = (id, data)  => req(`/api/chores/${id}`,    { method: 'PUT',    body: JSON.stringify(data) })
export const deleteChore = (id)        => req(`/api/chores/${id}`,    { method: 'DELETE' })

export const updatePrize = (id, data)  => req(`/api/prizes/${id}`,    { method: 'PUT',    body: JSON.stringify(data) })

export const completeSetup = () => req('/api/setup/complete', { method: 'POST', body: JSON.stringify({}) })
