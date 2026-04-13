import { useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { API_BASE_URL } from '../../api'
import { createQuickDrawRoom, fetchQuickDrawRoom, joinQuickDrawRoom } from './gameApi'
import './quickDraw.css'

function phaseLabel(phase) {
  switch (phase) {
    case 'WAITING': return '상대 대기'
    case 'READY': return '준비 단계'
    case 'COUNTDOWN': return '카운트다운'
    case 'FIRE': return '발사 신호'
    case 'RESULT': return '라운드 결과'
    case 'FINISHED': return '매치 종료'
    default: return phase || '-'
  }
}

export default function QuickDrawArena({ controller }) {
  const defaultName = controller?.auth?.name || localStorage.getItem('name') || ''
  const [playerName, setPlayerName] = useState(defaultName)
  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom] = useState(null)
  const [status, setStatus] = useState('방을 만들거나 참가하세요.')
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)
  const subscriptionRef = useRef(null)

  const myPlayer = useMemo(() => {
    if (!room?.players?.length || !room?.playerId) return null
    return room.players.find((player) => player.playerId === room.playerId) || null
  }, [room])

  const opponent = useMemo(() => {
    if (!room?.players?.length || !room?.playerId) return null
    return room.players.find((player) => player.playerId !== room.playerId) || null
  }, [room])

  useEffect(() => () => {
    subscriptionRef.current?.unsubscribe()
    clientRef.current?.deactivate()
  }, [])

  const ensureSocket = async (snapshot) => {
    if (!snapshot?.roomCode) return

    subscriptionRef.current?.unsubscribe()
    clientRef.current?.deactivate()

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 1500,
      onConnect: async () => {
        setConnected(true)
        subscriptionRef.current = client.subscribe(`/topic/game/quickdraw/${snapshot.roomCode}`, (message) => {
          const body = JSON.parse(message.body)
          if (!body.playerId) {
            body.playerId = snapshot.playerId
          }
          setRoom((prev) => ({ ...prev, ...body, playerId: prev?.playerId || snapshot.playerId }))
          setStatus(body.message || '업데이트 완료')
        })

        const latest = await fetchQuickDrawRoom(snapshot.roomCode, snapshot.playerId)
        setRoom(latest)
        setStatus(latest.message || '입장 완료')
      },
      onStompError: () => {
        setConnected(false)
        setError('게임 소켓 연결에 실패했습니다.')
      },
      onWebSocketClose: () => {
        setConnected(false)
      },
    })

    client.activate()
    clientRef.current = client
  }

  const handleCreateRoom = async () => {
    try {
      setError('')
      const snapshot = await createQuickDrawRoom(playerName)
      setRoom(snapshot)
      setJoinCode(snapshot.roomCode)
      setStatus(snapshot.message || '방 생성 완료')
      await ensureSocket(snapshot)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleJoinRoom = async () => {
    try {
      setError('')
      const snapshot = await joinQuickDrawRoom(joinCode.trim().toUpperCase(), playerName)
      setRoom(snapshot)
      setStatus(snapshot.message || '방 참가 완료')
      await ensureSocket(snapshot)
    } catch (err) {
      setError(err.message)
    }
  }

  const publish = (destination) => {
    if (!clientRef.current?.connected || !room?.roomCode || !room?.playerId) return
    clientRef.current.publish({
      destination,
      body: JSON.stringify({ roomCode: room.roomCode, playerId: room.playerId }),
    })
  }

  const handleReady = () => publish('/app/game/quickdraw/ready')
  const handleFire = () => publish('/app/game/quickdraw/fire')

  return (
    <div className="quickdraw-shell">
      <div className="quickdraw-page">
        <div className="quickdraw-topbar">
          <div>
            <p className="quickdraw-eyebrow">GAME FOLDER</p>
            <h1>Quick Draw Duel</h1>
            <p className="quickdraw-subtitle">기존 물류 기능과 분리된 1대1 온라인 반응속도 미니게임</p>
          </div>
          <div className="quickdraw-topbar__actions">
            <button type="button" className="quickdraw-ghost" onClick={() => controller?.setRoutePage?.('main')}>메인으로</button>
          </div>
        </div>

        <div className="quickdraw-grid">
          <section className="quickdraw-card quickdraw-card--setup">
            <h2>입장</h2>
            <label>
              닉네임
              <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="닉네임 입력" />
            </label>
            <div className="quickdraw-actions">
              <button type="button" className="quickdraw-primary" onClick={handleCreateRoom}>방 만들기</button>
            </div>
            <label>
              방 코드
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="예: A7K9P2" />
            </label>
            <div className="quickdraw-actions">
              <button type="button" className="quickdraw-secondary" onClick={handleJoinRoom}>방 참가</button>
            </div>
            <div className="quickdraw-status-box">
              <span>연결 상태</span>
              <strong>{connected ? '연결됨' : '대기 중'}</strong>
            </div>
            {error && <p className="quickdraw-error">{error}</p>}
            <p className="quickdraw-status">{status}</p>
          </section>

          <section className="quickdraw-card quickdraw-card--arena">
            <div className="quickdraw-roomline">
              <span>방 코드</span>
              <strong>{room?.roomCode || '-'}</strong>
              <span>상태</span>
              <strong>{phaseLabel(room?.phase)}</strong>
            </div>

            <div className="quickdraw-scoreboard">
              <article className={`quickdraw-player ${myPlayer ? 'is-me' : ''}`}>
                <span>나</span>
                <strong>{myPlayer?.playerName || '대기 중'}</strong>
                <b>{myPlayer?.score ?? 0}</b>
                <small>{myPlayer?.ready ? '준비 완료' : '준비 안 됨'}</small>
              </article>
              <div className="quickdraw-versus">VS</div>
              <article className="quickdraw-player">
                <span>상대</span>
                <strong>{opponent?.playerName || '상대 없음'}</strong>
                <b>{opponent?.score ?? 0}</b>
                <small>{opponent?.ready ? '준비 완료' : '준비 안 됨'}</small>
              </article>
            </div>

            <div className={`quickdraw-stage phase-${(room?.phase || 'waiting').toLowerCase()}`}>
              <div className="quickdraw-stage__inner">
                <p className="quickdraw-stage__round">Round {room?.roundNumber || 1}</p>
                <h2>
                  {room?.phase === 'WAITING' && '상대 입장을 기다리는 중'}
                  {room?.phase === 'READY' && '둘 다 준비를 눌러 시작'}
                  {room?.phase === 'COUNTDOWN' && '아직 누르지 마'}
                  {room?.phase === 'FIRE' && '지금 눌러'}
                  {room?.phase === 'RESULT' && (room?.winnerPlayerName ? `${room.winnerPlayerName} 승리` : '결과 확인 중')}
                  {room?.phase === 'FINISHED' && (room?.winnerPlayerName ? `${room.winnerPlayerName} 최종 승리` : '매치 종료')}
                  {!room?.phase && '게임 준비'}
                </h2>
                <p>{room?.message || '방 생성 후 상대를 기다리세요.'}</p>
              </div>
            </div>

            <div className="quickdraw-actions quickdraw-actions--arena">
              <button type="button" className="quickdraw-secondary" onClick={handleReady} disabled={!room?.roomCode || !myPlayer}>
                {myPlayer?.ready ? '준비 해제' : '준비'}
              </button>
              <button type="button" className="quickdraw-fire" onClick={handleFire} disabled={!room?.roomCode || !myPlayer}>
                FIRE
              </button>
            </div>
            <p className="quickdraw-help">카운트다운 중 먼저 누르면 실수 처리되고, 3점을 먼저 얻으면 최종 승리.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
