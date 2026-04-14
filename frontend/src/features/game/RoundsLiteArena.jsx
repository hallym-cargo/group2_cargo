import { useEffect, useMemo, useRef, useState } from 'react'
import {
  cancelRoundsLiteMatchmaking,
  createRoundsLiteRoom,
  getRoundsLiteState,
  joinRoundsLiteMatchmaking,
  joinRoundsLiteRoom,
  leaveRoundsLiteRoom,
  readyRoundsLiteRoom,
  resetRoundsLiteRoom,
  selectRoundsLiteCard,
  sendRoundsLiteInput,
} from '../../api'
import './roundsLite.css'

const LAST_ROOM_KEY = 'roundsLite:lastRoomCode'
const POLL_INTERVAL = 55
const INPUT_INTERVAL = 45
const VISUAL_LERP = 0.28
const ARENA_WIDTH = 960
const ARENA_HEIGHT = 540

const phaseText = {
  WAITING: '상대를 기다리는 중',
  COUNTDOWN: '라운드 시작 카운트다운',
  ACTIVE: '전투 중',
  CARD_PICK: '승리 카드 선택',
  MATCH_END: '매치 종료',
}

const platforms = [
  { x: 0, y: 500, w: 960, h: 40, kind: 'floor' },
  { x: 200, y: 360, w: 180, h: 18, kind: 'platform' },
  { x: 580, y: 300, w: 180, h: 18, kind: 'platform' },
  { x: 390, y: 420, w: 180, h: 18, kind: 'platform' },
]

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback
}

function lerp(start, end, t) {
  return start + (end - start) * t
}

function blendVisualRoom(current, target) {
  if (!target) return null
  if (!current) return target

  const shouldSnap =
    current.phase !== 'ACTIVE' ||
    target.phase !== 'ACTIVE' ||
    current.roundNo !== target.roundNo

  const currentPlayers = new Map((current.players || []).map((player) => [player.seat, player]))
  const currentProjectiles = new Map((current.projectiles || []).map((projectile) => [projectile.id, projectile]))

  return {
    ...target,
    players: (target.players || []).map((player) => {
      const previous = currentPlayers.get(player.seat)
      if (!previous || shouldSnap) {
        return player
      }

      return {
        ...player,
        x: lerp(previous.x ?? player.x, player.x, VISUAL_LERP),
        y: lerp(previous.y ?? player.y, player.y, VISUAL_LERP),
      }
    }),
    projectiles: (target.projectiles || []).map((projectile) => {
      const previous = currentProjectiles.get(projectile.id)
      if (!previous || shouldSnap) {
        return projectile
      }

      return {
        ...projectile,
        x: lerp(previous.x ?? projectile.x, projectile.x, VISUAL_LERP),
        y: lerp(previous.y ?? projectile.y, projectile.y, VISUAL_LERP),
      }
    }),
  }
}

export default function RoundsLiteArena({ controller }) {
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [room, setRoom] = useState(null)
  const [displayRoom, setDisplayRoom] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(Date.now())
  const [copied, setCopied] = useState(false)

  const inputRef = useRef({ left: false, right: false, jump: false, shoot: false })
  const pollRef = useRef(null)
  const inputLoopRef = useRef(null)
  const animationRef = useRef(null)
  const roomRef = useRef(null)
  const visualTargetRef = useRef(null)

  const currentRoom = displayRoom || room

  const me = useMemo(
    () => room?.players?.find((player) => player.seat === room?.mySeat) ?? null,
    [room]
  )
  const opponent = useMemo(
    () => room?.players?.find((player) => player.seat !== room?.mySeat) ?? null,
    [room]
  )
  const isPicker = room?.pickerSeat && room?.pickerSeat === room?.mySeat

  useEffect(() => {
    roomRef.current = room
    visualTargetRef.current = room

    if (!room) {
      setDisplayRoom(null)
      return
    }

    setDisplayRoom((previous) => blendVisualRoom(previous, room))
  }, [room])

  useEffect(() => {
    const savedRoom = localStorage.getItem(LAST_ROOM_KEY)
    if (savedRoom) {
      setRoomCodeInput(savedRoom)
      fetchState(savedRoom, true)
    }

    return () => {
      stopLoops()
    }
  }, [])

  useEffect(() => {
    if (!room?.roomCode) {
      stopLoops()
      return undefined
    }

    startLoops(room.roomCode)
    return () => stopLoops()
  }, [room?.roomCode])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!roomRef.current?.roomCode || roomRef.current.phase !== 'ACTIVE') return
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

      const next = { ...inputRef.current }

      if (event.key === 'a' || event.key === 'ArrowLeft') next.left = true
      if (event.key === 'd' || event.key === 'ArrowRight') next.right = true
      if (event.key === 'w' || event.key === 'ArrowUp') next.jump = true
      if (event.code === 'Space') {
        event.preventDefault()
        next.shoot = true
      }

      inputRef.current = next
    }

    const handleKeyUp = (event) => {
      const next = { ...inputRef.current }

      if (event.key === 'a' || event.key === 'ArrowLeft') next.left = false
      if (event.key === 'd' || event.key === 'ArrowRight') next.right = false
      if (event.key === 'w' || event.key === 'ArrowUp') next.jump = false
      if (event.code === 'Space') next.shoot = false

      inputRef.current = next
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  function stopLoops() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }

    if (inputLoopRef.current) {
      clearInterval(inputLoopRef.current)
      inputLoopRef.current = null
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  function startLoops(roomCode) {
    stopLoops()

    pollRef.current = setInterval(() => {
      fetchState(roomCode, true)
    }, POLL_INTERVAL)

    inputLoopRef.current = setInterval(() => {
      if (roomRef.current?.phase !== 'ACTIVE') return
      sendInput(roomCode, true)
    }, INPUT_INTERVAL)

    const animate = () => {
      setDisplayRoom((previous) => blendVisualRoom(previous, visualTargetRef.current))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  async function fetchState(roomCode, silent = false) {
    try {
      const response = await getRoundsLiteState(roomCode)
      setRoom(response)
      setTick(Date.now())
      if (!silent) setError('')
      return response
    } catch (fetchError) {
      if (!silent) {
        setError(getErrorMessage(fetchError, '게임 상태를 불러오지 못했습니다.'))
      }
      throw fetchError
    }
  }

  async function handleCreateRoom() {
    setLoading(true)
    setError('')
    try {
      const response = await createRoundsLiteRoom()
      setRoom(response)
      setRoomCodeInput(response.roomCode)
      localStorage.setItem(LAST_ROOM_KEY, response.roomCode)
    } catch (createError) {
      setError(getErrorMessage(createError, '방 만들기에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinRoom() {
    const trimmed = roomCodeInput.trim().toUpperCase()
    if (!trimmed) {
      setError('방 코드를 입력하세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await joinRoundsLiteRoom(trimmed)
      setRoom(response)
      setRoomCodeInput(response.roomCode)
      localStorage.setItem(LAST_ROOM_KEY, response.roomCode)
    } catch (joinError) {
      setError(getErrorMessage(joinError, '방 참가에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleMatchmaking() {
    setLoading(true)
    setError('')

    try {
      const response = await joinRoundsLiteMatchmaking()
      setRoom(response)
      setRoomCodeInput(response.roomCode)
      localStorage.setItem(LAST_ROOM_KEY, response.roomCode)
    } catch (matchError) {
      setError(getErrorMessage(matchError, '자동 매칭에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelMatchmaking() {
    if (!room?.roomCode) return

    setLoading(true)
    setError('')

    try {
      await cancelRoundsLiteMatchmaking(room.roomCode)
      stopLoops()
      localStorage.removeItem(LAST_ROOM_KEY)
      setRoom(null)
      setDisplayRoom(null)
      setRoomCodeInput('')
    } catch (cancelError) {
      setError(getErrorMessage(cancelError, '매칭 취소에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleReady() {
    if (!room?.roomCode) return

    setLoading(true)
    setError('')

    try {
      const response = await readyRoundsLiteRoom(room.roomCode)
      setRoom(response)
    } catch (readyError) {
      setError(getErrorMessage(readyError, '준비 처리에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  async function sendInput(roomCode, silent = false) {
    try {
      const response = await sendRoundsLiteInput(roomCode, inputRef.current)
      setRoom(response)
    } catch (inputError) {
      if (!silent) {
        setError(getErrorMessage(inputError, '입력 전송에 실패했습니다.'))
      }
    }
  }

  async function handleSelectCard(cardKey) {
    if (!room?.roomCode) return

    setLoading(true)
    setError('')

    try {
      const response = await selectRoundsLiteCard(room.roomCode, cardKey)
      setRoom(response)
    } catch (cardError) {
      setError(getErrorMessage(cardError, '카드 선택에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!room?.roomCode) return

    setLoading(true)
    setError('')

    try {
      const response = await resetRoundsLiteRoom(room.roomCode)
      setRoom(response)
    } catch (resetError) {
      setError(getErrorMessage(resetError, '매치 초기화에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    if (!room?.roomCode) {
      controller.setRoutePage('main')
      return
    }

    try {
      await leaveRoundsLiteRoom(room.roomCode)
    } catch {
      // ignore
    }

    stopLoops()
    localStorage.removeItem(LAST_ROOM_KEY)
    setRoom(null)
    setDisplayRoom(null)
    controller.setRoutePage('main')
  }

  async function handleCopyRoomCode() {
    if (!room?.roomCode) return

    try {
      await navigator.clipboard.writeText(room.roomCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const countdownMs = room?.countdownEndsAt
    ? Math.max(new Date(room.countdownEndsAt).getTime() - tick, 0)
    : 0
  const countdown = Math.max(1, Math.ceil(countdownMs / 1000))

  return (
    <div className="rounds-lite-page">
      <div className="rounds-lite-shell">
        <div className="rounds-lite-hero">
          <div>
            <p className="rounds-lite-eyebrow">MINI GAME</p>
            <h1 className="rounds-lite-title">Rounds Lite Duel</h1>
            <p className="rounds-lite-subtitle">
              2인 대전, 이동, 점프, 발사, 체력, 라운드 승리, 카드 선택까지 넣은 웹용 Lite 버전이야.
            </p>
          </div>

          <div className="rounds-lite-hero-actions">
            <button type="button" className="rounds-lite-ghost" onClick={() => controller.setRoutePage('main')}>
              메인으로
            </button>
            <button type="button" className="rounds-lite-ghost" onClick={handleLeave}>
              나가기
            </button>
          </div>
        </div>

        <div className="rounds-lite-layout">
          <aside className="rounds-lite-sidebar">
            <section className="rounds-lite-card">
              <h2>방 설정</h2>

              <div className="rounds-lite-room-actions">
                <button type="button" className="rounds-lite-primary" onClick={handleCreateRoom} disabled={loading}>
                  방 만들기
                </button>

                <div className="rounds-lite-join-row">
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
                    placeholder="방 코드 6자리"
                    maxLength={6}
                  />
                  <button type="button" className="rounds-lite-secondary" onClick={handleJoinRoom} disabled={loading}>
                    참가
                  </button>
                </div>
              </div>

              <div className="rounds-lite-room-meta">
                <div>
                  <span>방 코드</span>
                  <strong>{room?.roomCode || '-'}</strong>
                </div>
                <button type="button" className="rounds-lite-chip" onClick={handleCopyRoomCode} disabled={!room?.roomCode}>
                  {copied ? '복사됨' : '코드 복사'}
                </button>
              </div>

              <div className="rounds-lite-room-meta rounds-lite-room-meta--stack">
                <div>
                  <span>상태</span>
                  <strong>{phaseText[room?.phase] || '방 생성 전'}</strong>
                </div>
                <div>
                  <span>라운드</span>
                  <strong>{room ? `${room.roundNo} / 목표 ${room.targetWins}승` : '-'}</strong>
                </div>
              </div>

              <p className="rounds-lite-message">{error || room?.message || '방을 만들거나, 방 코드를 입력하거나, 자동 매칭으로 시작하세요.'}</p>

              {room?.matchmakingQueued && (
                <div className="rounds-lite-controls">
                  <button
                    type="button"
                    className="rounds-lite-secondary"
                    onClick={handleCancelMatchmaking}
                    disabled={loading}
                  >
                    매칭 취소
                  </button>
                </div>
              )}

              <div className="rounds-lite-controls">
                <button
                  type="button"
                  className="rounds-lite-primary"
                  onClick={handleReady}
                  disabled={!room || loading || room.phase === 'ACTIVE' || room.phase === 'COUNTDOWN' || room.phase === 'CARD_PICK'}
                >
                  준비
                </button>

                <button type="button" className="rounds-lite-secondary" onClick={handleReset} disabled={!room || loading}>
                  매치 초기화
                </button>
              </div>
            </section>

            <section className="rounds-lite-card">
              <h2>조작법</h2>
              <ul className="rounds-lite-help">
                <li>A / D 또는 ← / → : 좌우 이동</li>
                <li>W 또는 ↑ : 점프</li>
                <li>Space : 발사</li>
                <li>라운드 승리 시 카드 1장 선택</li>
              </ul>
            </section>

            <section className="rounds-lite-card">
              <h2>플레이어</h2>
              <div className="rounds-lite-player-list">
                {room?.players?.map((player) => (
                  <div
                    key={player.seat}
                    className={`rounds-lite-player-item ${player.seat === room?.mySeat ? 'is-me' : ''}`}
                  >
                    <div>
                      <strong>{player.name}</strong>
                      <span>{player.seat === room?.mySeat ? '나' : '상대'}</span>
                    </div>

                    <div className="rounds-lite-player-stats">
                      <span>{player.hp}/{player.maxHp} HP</span>
                      <span>{player.wins}승</span>
                      <span>{player.ready ? '준비 완료' : '대기'}</span>
                    </div>

                    {!!player.selectedCards?.length && (
                      <div className="rounds-lite-card-tags">
                        {player.selectedCards.map((card) => (
                          <span key={card} className="rounds-lite-card-tag">{card}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="rounds-lite-main">
            <section className="rounds-lite-game-card">
              <div className="rounds-lite-arena-wrap">
                {room?.phase === 'COUNTDOWN' && (
                  <div className="rounds-lite-overlay">
                    <div className="rounds-lite-countdown">{countdown}</div>
                    <p>곧 시작합니다</p>
                  </div>
                )}

                {room?.phase === 'CARD_PICK' && (
                  <div className="rounds-lite-overlay rounds-lite-overlay--cards">
                    <h3>{isPicker ? '승리 카드 1장을 선택하세요' : '상대가 카드를 고르는 중입니다'}</h3>
                    <div className="rounds-lite-card-options">
                      {room.cardOptions?.map((card) => (
                        <button
                          key={card.key}
                          type="button"
                          className="rounds-lite-upgrade-card"
                          onClick={() => handleSelectCard(card.key)}
                          disabled={!isPicker || loading}
                        >
                          <strong>{card.title}</strong>
                          <span>{card.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {room?.phase === 'MATCH_END' && (
                  <div className="rounds-lite-overlay rounds-lite-overlay--result">
                    <h3>{room.matchWinnerSeat === room.mySeat ? '승리했습니다' : '패배했습니다'}</h3>
                    <p>{room.message}</p>
                    <button type="button" className="rounds-lite-primary" onClick={handleReset}>다시 하기</button>
                  </div>
                )}

                <div className="rounds-lite-arena" style={{ width: ARENA_WIDTH, height: ARENA_HEIGHT }}>
                  {platforms.map((platform, index) => (
                    <div
                      key={`${platform.kind}-${index}`}
                      className={`rounds-lite-platform rounds-lite-platform--${platform.kind}`}
                      style={{ left: platform.x, top: platform.y, width: platform.w, height: platform.h }}
                    />
                  ))}

                  {currentRoom?.projectiles?.map((projectile) => (
                    <div
                      key={projectile.id}
                      className={`rounds-lite-projectile ${projectile.ownerSeat === room?.mySeat ? 'is-mine' : 'is-opponent'}`}
                      style={{
                        width: projectile.radius * 2,
                        height: projectile.radius * 2,
                        transform: `translate3d(${projectile.x - projectile.radius}px, ${projectile.y - projectile.radius}px, 0)`,
                      }}
                    />
                  ))}

                  {currentRoom?.players?.map((player) => (
                    <div
                      key={player.seat}
                      className={`rounds-lite-player ${player.seat === room?.mySeat ? 'is-me' : 'is-opponent'}`}
                      style={{
                        width: player.width,
                        height: player.height,
                        transform: `translate3d(${player.x}px, ${player.y}px, 0) scaleX(${player.facingRight ? 1 : -1})`,
                      }}
                    >
                      <div className="rounds-lite-player-head" />
                      <div className="rounds-lite-player-body" />
                      <div className="rounds-lite-player-gun" />
                      <div className="rounds-lite-player-name">{player.name}</div>
                      <div className="rounds-lite-health-bar">
                        <div
                          className="rounds-lite-health-fill"
                          style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounds-lite-bottom-card">
              <div>
                <strong>현재 안내</strong>
                <p>{room?.message || '방을 만들거나, 방 코드를 입력하거나, 자동 매칭으로 시작하세요.'}</p>
              </div>
              <div>
                <strong>전투 팁</strong>
                <p>위쪽 플랫폼을 먼저 잡고, 카드 승리 효과를 누적하면 점점 Rounds 느낌이 강해져.</p>
              </div>
              <div>
                <strong>내 상태</strong>
                <p>{me ? `${me.name} · ${me.hp}/${me.maxHp} HP · ${me.wins}승` : '입장 전'}</p>
              </div>
              <div>
                <strong>상대 상태</strong>
                <p>{opponent ? `${opponent.name} · ${opponent.hp}/${opponent.maxHp} HP · ${opponent.wins}승` : '대기 중'}</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}