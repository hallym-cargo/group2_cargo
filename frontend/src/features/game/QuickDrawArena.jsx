import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createQuickDrawRoom,
  getQuickDrawRoomState,
  joinQuickDrawRoom,
  leaveQuickDrawRoom,
  markQuickDrawReady,
  resetQuickDrawRoom,
  shootQuickDraw,
} from '../../api'
import './quickDraw.css'

const LAST_ROOM_KEY = 'quickdraw:lastRoomCode'
const POLL_INTERVAL = 700

const PHASE_TEXT = {
  WAITING: '상대를 기다리는 중',
  COUNTDOWN: '카운트다운 진행 중',
  DRAWABLE: '발사 가능',
  ROUND_END: '라운드 종료',
  MATCH_END: '매치 종료',
}

function getPlayerSummary(room, seat) {
  if (!room || !seat) return null
  return room.players?.find((player) => player.seat === seat) ?? null
}

function getStatusText(room, me) {
  if (!room) return '방을 만들거나 참가하세요.'

  if (!me) {
    return '방 정보를 불러오는 중입니다.'
  }

  if (room.phase === 'WAITING') {
    if (room.players.length < 2) {
      return '상대가 방에 들어오면 준비 버튼을 눌러 주세요.'
    }
    return '두 플레이어가 모두 준비하면 자동으로 카운트다운이 시작됩니다.'
  }

  if (room.phase === 'COUNTDOWN') {
    return '집중하세요. 발사 신호가 뜨기 전에는 누르면 반칙 패배입니다.'
  }

  if (room.phase === 'DRAWABLE') {
    return '지금 발사하세요.'
  }

  if (room.phase === 'ROUND_END' || room.phase === 'MATCH_END') {
    return room.lastRoundMessage || '라운드 결과를 확인하세요.'
  }

  return '방을 만들거나 참가하세요.'
}

export default function QuickDrawArena({ controller }) {
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [room, setRoom] = useState(null)
  const [mySeat, setMySeat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('방을 만들거나 참가하세요.')
  const [error, setError] = useState('')
  const [tick, setTick] = useState(Date.now())
  const pollRef = useRef(null)

  const me = useMemo(() => getPlayerSummary(room, mySeat), [room, mySeat])
  const opponent = useMemo(() => {
    if (!room || !mySeat) return null
    return room.players?.find((player) => player.seat !== mySeat) ?? null
  }, [room, mySeat])

  useEffect(() => {
    setMessage(getStatusText(room, me))
  }, [room, me])

  useEffect(() => {
    const savedRoom = localStorage.getItem(LAST_ROOM_KEY)
    if (savedRoom) {
      setRoomCodeInput(savedRoom)
      restoreRoom(savedRoom)
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!room?.roomCode) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return undefined
    }

    fetchRoomState(room.roomCode, { silent: true })

    pollRef.current = setInterval(() => {
      fetchRoomState(room.roomCode, { silent: true })
    }, POLL_INTERVAL)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [room?.roomCode])

  async function restoreRoom(roomCode) {
    try {
      const response = await getQuickDrawRoomState(roomCode)
      setRoom(response)
      setMySeat(response.mySeat || null)
      if (response.mySeat) {
        localStorage.setItem(`${LAST_ROOM_KEY}:seat:${roomCode}`, response.mySeat)
      }
      setError('')
      setMessage(getStatusText(response, getPlayerSummary(response, response.mySeat)))
    } catch {
      localStorage.removeItem(LAST_ROOM_KEY)
      setMySeat(null)
    }
  }

  async function fetchRoomState(roomCode, options = {}) {
    try {
      const response = await getQuickDrawRoomState(roomCode)
      setRoom(response)
      setMySeat(response.mySeat || null)
      if (response.mySeat) {
        localStorage.setItem(`${LAST_ROOM_KEY}:seat:${roomCode}`, response.mySeat)
      }
      setTick(Date.now())
      if (!options.silent) {
        setError('')
      }
      return response
    } catch (fetchError) {
      if (!options.silent) {
        setError(fetchError.response?.data?.message || '방 정보를 불러오지 못했습니다.')
      }
      throw fetchError
    }
  }

  async function handleCreateRoom() {
    setLoading(true)
    setError('')
    try {
      const response = await createQuickDrawRoom()
      setRoom(response)
      setMySeat(response.mySeat)
      setRoomCodeInput(response.roomCode)
      localStorage.setItem(LAST_ROOM_KEY, response.roomCode)
      localStorage.setItem(`${LAST_ROOM_KEY}:seat:${response.roomCode}`, response.mySeat || '')
      setMessage('방이 만들어졌습니다. 상대에게 방 코드를 보내세요.')
    } catch (createError) {
      setError(createError.response?.data?.message || '방 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinRoom() {
    const trimmedCode = roomCodeInput.trim().toUpperCase()
    if (!trimmedCode) {
      setError('방 코드를 입력하세요.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await joinQuickDrawRoom(trimmedCode)
      setRoom(response)
      setMySeat(response.mySeat)
      setRoomCodeInput(response.roomCode)
      localStorage.setItem(LAST_ROOM_KEY, response.roomCode)
      localStorage.setItem(`${LAST_ROOM_KEY}:seat:${response.roomCode}`, response.mySeat || '')
      setMessage('방 참가에 성공했습니다. 준비 버튼을 눌러 주세요.')
    } catch (joinError) {
      setError(joinError.response?.data?.message || '방 참가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReady() {
    if (!room?.roomCode) return
    setLoading(true)
    setError('')
    try {
      const response = await markQuickDrawReady(room.roomCode)
      setRoom(response)
      setMySeat(response.mySeat || null)
    } catch (readyError) {
      setError(readyError.response?.data?.message || '준비 처리에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleShoot() {
    if (!room?.roomCode) return
    setLoading(true)
    setError('')
    try {
      const response = await shootQuickDraw(room.roomCode)
      setRoom(response)
      setMySeat(response.mySeat || null)
    } catch (shootError) {
      setError(shootError.response?.data?.message || '발사 처리에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!room?.roomCode) return
    setLoading(true)
    setError('')
    try {
      const response = await resetQuickDrawRoom(room.roomCode)
      setRoom(response)
      setMySeat(response.mySeat || null)
      setMessage('새 매치가 시작되었습니다. 다시 준비해 주세요.')
    } catch (resetError) {
      setError(resetError.response?.data?.message || '새 게임 시작에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    if (!room?.roomCode) {
      controller.setRoutePage('main')
      return
    }

    setLoading(true)
    setError('')
    try {
      await leaveQuickDrawRoom(room.roomCode)
    } catch {
      // 방 정리는 백엔드 실패와 관계없이 프론트에서 마무리
    } finally {
      localStorage.removeItem(LAST_ROOM_KEY)
      localStorage.removeItem(`${LAST_ROOM_KEY}:seat:${room.roomCode}`)
      setRoom(null)
      setMySeat(null)
      setRoomCodeInput('')
      setLoading(false)
      controller.setRoutePage('main')
    }
  }

  const drawAt = room?.drawAt ? new Date(room.drawAt).getTime() : null
  const remainingMs = drawAt ? Math.max(drawAt - tick, 0) : 0
  const countdownSeconds = Math.ceil(remainingMs / 1000)
  const canShoot = !!room && room.phase === 'DRAWABLE' && !me?.shotAt
  const isReady = !!me?.ready
  const winnerSeat = room?.winnerSeat || null
  const isMatchEnd = room?.phase === 'MATCH_END'

  return (
    <div className="quickdraw-page">
      <div className="quickdraw-shell">
        <div className="quickdraw-topbar">
          <button type="button" className="quickdraw-back" onClick={handleLeave}>
            {room ? '방 나가기' : '메인으로'}
          </button>

          <div className="quickdraw-title-wrap">
            <p className="quickdraw-eyebrow">PLAYGROUND MODE</p>
            <h1 className="quickdraw-title">Quick Draw Duel</h1>
            <p className="quickdraw-subtitle">
              메인페이지와 같은 밝은 브랜드 톤 위에, 서부 결투장 느낌을 얹은 2인 반응속도 대결이야.
            </p>
          </div>
        </div>

        <div className="quickdraw-layout">
          <section className="quickdraw-card quickdraw-card--control">
            <h2>방 설정</h2>

            <div className="quickdraw-roombox">
              <button type="button" className="quickdraw-primary" onClick={handleCreateRoom} disabled={loading}>
                방 만들기
              </button>

              <div className="quickdraw-join">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
                  placeholder="방 코드 입력"
                  maxLength={6}
                />
                <button type="button" className="quickdraw-secondary" onClick={handleJoinRoom} disabled={loading}>
                  참가하기
                </button>
              </div>
            </div>

            <div className="quickdraw-statusbox">
              <div>
                <span className="quickdraw-label">현재 상태</span>
                <strong>{room ? PHASE_TEXT[room.phase] || room.phase : '대기'}</strong>
              </div>
              <div>
                <span className="quickdraw-label">방 코드</span>
                <strong>{room?.roomCode || '-'}</strong>
              </div>
              <div>
                <span className="quickdraw-label">내 자리</span>
                <strong>{mySeat || '-'}</strong>
              </div>
            </div>

            <p className="quickdraw-message">{message}</p>
            {error && <p className="quickdraw-error">{error}</p>}

            <div className="quickdraw-actions">
              <button
                type="button"
                className={`quickdraw-ready ${isReady ? 'is-active' : ''}`}
                onClick={handleReady}
                disabled={loading || !room || room.players.length < 2 || room.phase === 'COUNTDOWN' || room.phase === 'DRAWABLE'}
              >
                {isReady ? '준비 완료' : '준비'}
              </button>

              <button
                type="button"
                className={`quickdraw-shoot ${canShoot ? 'is-armed' : ''}`}
                onClick={handleShoot}
                disabled={loading || !room || !!me?.shotAt || room.phase === 'ROUND_END'}
              >
                FIRE
              </button>

              <button
                type="button"
                className="quickdraw-reset"
                onClick={handleReset}
                disabled={loading || !room || (!isMatchEnd && room.phase !== 'ROUND_END')}
              >
                새 게임
              </button>
            </div>
          </section>

          <section className="quickdraw-card quickdraw-card--arena">
            <div className="quickdraw-scoreboard">
              <div className={`quickdraw-player ${winnerSeat === me?.seat ? 'is-winner' : ''}`}>
                <span className="quickdraw-player__seat">{me?.seat || 'ME'}</span>
                <strong>{me?.name || '플레이어 대기중'}</strong>
                <em>{me ? `${me.score}점` : '-'}</em>
                <span className={`quickdraw-player__ready ${me?.ready ? 'is-on' : ''}`}>{me?.ready ? '준비됨' : '미준비'}</span>
              </div>

              <div className="quickdraw-vs">VS</div>

              <div className={`quickdraw-player ${winnerSeat === opponent?.seat ? 'is-winner' : ''}`}>
                <span className="quickdraw-player__seat">{opponent?.seat || 'OPP'}</span>
                <strong>{opponent?.name || '상대 대기중'}</strong>
                <em>{opponent ? `${opponent.score}점` : '-'}</em>
                <span className={`quickdraw-player__ready ${opponent?.ready ? 'is-on' : ''}`}>
                  {opponent?.ready ? '준비됨' : '미준비'}
                </span>
              </div>
            </div>

            <div className={`quickdraw-arena ${room?.phase === 'DRAWABLE' ? 'is-draw' : ''}`}>
              <div className="quickdraw-arena-sky" />
              <div className="quickdraw-arena-sun" />
              <div className="quickdraw-arena-mountain quickdraw-arena-mountain--left" />
              <div className="quickdraw-arena-mountain quickdraw-arena-mountain--right" />
              <div className="quickdraw-arena-town">
                <span className="quickdraw-town-building quickdraw-town-building--saloon" />
                <span className="quickdraw-town-building quickdraw-town-building--tower" />
                <span className="quickdraw-town-building quickdraw-town-building--shed" />
              </div>
              <div className="quickdraw-arena-ground" />
              <div className="quickdraw-duelist quickdraw-duelist--left">
                <span className="quickdraw-duelist__aura" />
                <span className="quickdraw-duelist__hat" />
                <span className="quickdraw-duelist__core">
                  <span className="quickdraw-duelist__face" />
                  <span className="quickdraw-duelist__gun" />
                </span>
              </div>
              <div className="quickdraw-duelist quickdraw-duelist--right">
                <span className="quickdraw-duelist__aura" />
                <span className="quickdraw-duelist__hat" />
                <span className="quickdraw-duelist__core">
                  <span className="quickdraw-duelist__face" />
                  <span className="quickdraw-duelist__gun" />
                </span>
              </div>
              <div className="quickdraw-signal">
                {room?.phase === 'COUNTDOWN' && <span>{countdownSeconds > 0 ? countdownSeconds : '...'}</span>}
                {room?.phase === 'DRAWABLE' && <span>DRAW</span>}
                {room?.phase === 'WAITING' && <span>READY</span>}
                {(room?.phase === 'ROUND_END' || room?.phase === 'MATCH_END') && <span>RESULT</span>}
                {!room && <span>JOIN</span>}
              </div>
            </div>

            <div className="quickdraw-roundinfo">
              <div>
                <span className="quickdraw-label">최근 판정</span>
                <strong>{room?.lastRoundMessage || '-'}</strong>
              </div>
              <div>
                <span className="quickdraw-label">목표 점수</span>
                <strong>{room ? `${room.targetScore}점 선취` : '-'}</strong>
              </div>
              <div>
                <span className="quickdraw-label">참가 인원</span>
                <strong>{room ? `${room.players.length}/2` : '-'}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
