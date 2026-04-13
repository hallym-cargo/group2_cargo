import { API_BASE_URL } from '../../api'

async function parseJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || '게임 요청 처리 중 오류가 발생했습니다.')
  }
  return data
}

export async function createQuickDrawRoom(playerName) {
  const response = await fetch(`${API_BASE_URL}/public/game/quickdraw/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
  })
  return parseJson(response)
}

export async function joinQuickDrawRoom(roomCode, playerName) {
  const response = await fetch(`${API_BASE_URL}/public/game/quickdraw/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerName }),
  })
  return parseJson(response)
}

export async function fetchQuickDrawRoom(roomCode, playerId) {
  const query = new URLSearchParams()
  if (playerId) query.set('playerId', playerId)
  const response = await fetch(`${API_BASE_URL}/public/game/quickdraw/rooms/${roomCode}?${query.toString()}`)
  return parseJson(response)
}
