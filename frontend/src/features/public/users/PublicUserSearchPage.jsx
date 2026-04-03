import { formatRatingSummary, roleText } from '../../../utils/formatters'

export default function PublicUserSearchPage({ controller, role }) {
  const isDriver = role === 'DRIVER'
  const users = controller.publicUsers
  const keyword = controller.publicUserKeyword

  const getProfileImage = (user) => {
    return user.profileImageUrl || '/images/default-profile.png'
  }

  return (
    <div className="public-shell landing-shell public-directory-shell">
      <header className="landing-header">
        <div className="landing-header__inner">
          <button className="landing-brand" onClick={() => controller.setRoutePage('main')}>
            <span className="landing-brand__mark">HC</span>
            <span className="landing-brand__text">
              <strong>hallym-cargo</strong>
              <small>{isDriver ? '차주 검색' : '화주 검색'}</small>
            </span>
          </button>

          <nav className="landing-nav">
            <button onClick={() => controller.setRoutePage('main')}>메인으로</button>
            <button onClick={() => controller.openPublicUserPage('SHIPPER')}>화주 찾기</button>
            <button onClick={() => controller.openPublicUserPage('DRIVER')}>차주 찾기</button>
          </nav>

          <div className="landing-header__actions">
            <button className="landing-btn landing-btn--light" onClick={() => controller.setRoutePage('main')}>
              돌아가기
            </button>
          </div>
        </div>
      </header>

      <section className="landing-info public-directory-hero">
        <div className="landing-info__inner">
          <div className="landing-sectionHead">
            <span>{isDriver ? 'DRIVER DIRECTORY' : 'SHIPPER DIRECTORY'}</span>
            <h2>
              {isDriver
                ? '가입된 차주를 한 번에 보고 이름으로 바로 찾을 수 있습니다.'
                : '가입된 화주를 한 번에 보고 이름으로 바로 찾을 수 있습니다.'}
            </h2>
            <p>페이지에 처음 들어오면 전체 목록이 보이고, 검색창에 이름을 입력하면 일치하는 회원만 남도록 구성했습니다.</p>
          </div>

          <div className="public-directory-search surface">
            <div className="public-directory-search__meta">
              <strong>{roleText(role)} 목록</strong>
              <small>총 {users.length}명</small>
            </div>
            <div className="public-directory-search__controls">
              <input
                type="text"
                placeholder={isDriver ? '차주 이름 검색' : '화주 이름 검색'}
                value={keyword}
                onChange={(e) => controller.setPublicUserKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') controller.searchPublicUsers(role, controller.publicUserKeyword)
                }}
              />
              <button
                className="landing-btn landing-btn--primary"
                onClick={() => controller.searchPublicUsers(role, controller.publicUserKeyword)}
              >
                검색
              </button>
              <button className="landing-btn landing-btn--light" onClick={() => controller.resetPublicUserSearch(role)}>
                전체 보기
              </button>
            </div>
          </div>

          <div className="public-directory-grid">
            {users.length ? (
              users.map((user) => (
                <article key={user.id} className="public-directory-card surface">
                  <div className="public-directory-card__head">
                    <div className="public-directory-card__profile">
                      <img
                        src={getProfileImage(user)}
                        alt={user.name}
                        className="public-directory-card__avatar"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-profile.png'
                        }}
                      />
                      <div className="public-directory-card__title">
                        <span>{roleText(user.role)}</span>
                        <h3>{user.name}</h3>
                      </div>
                    </div>
                    <strong>{formatRatingSummary(user.averageRating, user.ratingCount)}</strong>
                  </div>

                  <div className="public-directory-card__stats">
                    <div>
                      <span>{isDriver ? '차량 정보' : '회사명'}</span>
                      <strong>{isDriver ? (user.vehicleType || '-') : (user.companyName || '-')}</strong>
                    </div>
                    <div>
                      <span>완료 건수</span>
                      <strong>{user.completedCount || 0}건</strong>
                    </div>
                  </div>

                  <dl className="public-directory-card__info">
                    <div>
                      <dt>연락 이메일</dt>
                      <dd>{user.contactEmail || '-'}</dd>
                    </div>
                    <div>
                      <dt>연락처</dt>
                      <dd>{user.contactPhone || '-'}</dd>
                    </div>
                  </dl>

                  <p>{user.bio || (isDriver ? '등록된 차주 소개가 없습니다.' : '등록된 화주 소개가 없습니다.')}</p>
                </article>
              ))
            ) : (
              <div className="public-directory-empty surface">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}