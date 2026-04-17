export default function PenaltyBlockedModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          style={{ position: "absolute", top: 20, right: 20, left: "auto" }}
        >
          ×
        </button>

        <div className="profile-modal__head">
          <div>
            <div className="profile-modal__role">거래 제한 안내</div>
            <h3>패널티 상태</h3>
            <p>현재 거래를 진행할 수 없습니다.</p>
          </div>
        </div>

        <div className="profile-modal__bio">
          <span>안내 문구</span>
          <p style={{ whiteSpace: "pre-line" }}>
            {message || "패널티 상태입니다."}
          </p>
        </div>

        <div className="profile-modal__actions">
          <button className="btn btn-primary" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}