import { formatDate } from '../../utils/formatters'

export default function ChatWindowModal({ room, draft, setDraft, onSend, onClose, isSending }) {
  if (!room) return null

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal__head">
          <div className="chat-modal__peer">
            {room.targetProfile?.profileImageUrl ? (
              <img src={room.targetProfile.profileImageUrl} alt={room.targetProfile.name} className="chat-modal__avatar" />
            ) : (
              <div className="chat-modal__avatar chat-modal__avatar--fallback">{(room.targetProfile?.name || '?').slice(0, 1)}</div>
            )}
            <div>
              <strong>{room.targetProfile?.name}</strong>
              <small>1대1 채팅</small>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="chat-modal__messages">
          {room.messages?.length ? room.messages.map((message) => (
            <div key={message.id} className={message.mine ? 'chat-bubble chat-bubble--mine' : 'chat-bubble'}>
              {!message.mine && (
                <div className="chat-bubble__sender">{message.senderName}</div>
              )}
              <p>{message.content}</p>
              <span>{formatDate(message.createdAt)}</span>
            </div>
          )) : (
            <div className="empty-box small">아직 대화가 없습니다. 먼저 메시지를 보내 보세요.</div>
          )}
        </div>

        <div className="chat-modal__composer">
          <textarea
            rows="3"
            placeholder="메시지를 입력하세요"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
          />
          <button className="btn btn-primary" onClick={onSend} disabled={isSending}>전송</button>
        </div>
      </div>
    </div>
  )
}
