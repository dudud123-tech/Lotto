# Cloudflare Pages 배포 가이드

Lotto Studio는 정적 사이트로 구성되어 있어 Cloudflare Pages에서 GitHub 저장소와 연결해 배포할 수 있습니다.

## 1. GitHub 저장소

- Repository: `dudud123-tech/Lotto`
- 배포 대상 브랜치: `main`
- GitHub에 push된 코드만 Cloudflare Pages에 배포되도록 설정합니다.

## 2. Cloudflare Pages 설정

Cloudflare Dashboard에서 다음 순서로 진행합니다.

1. `Workers & Pages`로 이동
2. `Create application`
3. `Pages`
4. `Connect to Git`
5. GitHub 저장소 `dudud123-tech/Lotto` 선택
6. Production branch를 `main`으로 설정
7. Build 설정 입력

```text
Framework preset: None
Build command: 비움
Build output directory: lotto-recommender/public
Root directory: /
```

Cloudflare Pages Functions를 함께 사용하려면 `Functions directory`는 기본값인 `functions`를 사용합니다. 이 저장소에서는 다음 API 파일을 준비해두었습니다.

```text
functions/api/latest-draw.js
functions/api/tickets/index.js
functions/api/tickets/check-history.js
functions/api/stats/latest-round.js
```

## 2-1. Wrangler 로컬 준비

로컬에서 D1과 Pages Functions를 테스트하려면 Node.js 환경에서 의존성을 설치합니다.

```powershell
cd C:\Workspace\02.Lotto\lotto-recommender
npm install
npx wrangler login
```

Wrangler 설정 파일:

```text
wrangler.toml
```

주의: `wrangler.toml`의 `database_id`는 D1 데이터베이스를 만든 뒤 실제 ID로 교체해야 합니다.

## 3. 배포 흐름

```text
로컬 수정
  -> git commit
  -> git push origin main
  -> Cloudflare Pages 자동 배포
```

로컬에서만 수정한 파일은 배포되지 않습니다. 반드시 GitHub `main` 브랜치에 push되어야 운영 사이트가 업데이트됩니다.

## 4. 배포 후 수정할 값

Cloudflare Pages 프로젝트 URL 또는 커스텀 도메인이 정해지면 아래 파일의 도메인을 실제 주소로 변경합니다.

- `public/robots.txt`
- `public/sitemap.xml`

현재 임시 주소:

```text
https://lotto-studio.pages.dev
```

## 5. AdSense 신청 전 점검

- 서비스 소개 페이지 확인: `/about/`
- 개인정보처리방침 확인: `/privacy/`
- 이용약관 확인: `/terms/`
- 면책 고지 확인: `/disclaimer/`
- 문의하기 확인: `/contact/`
- 홈 푸터 링크 정상 동작 확인
- 최신 당첨번호 데이터 표시 확인

## 6. 이후 DB 단계

Cloudflare D1을 추가할 때는 Pages Functions 또는 Workers를 별도로 연결합니다.

예정 API:

```text
GET  /api/latest-draw
POST /api/tickets
POST /api/tickets/check-history
GET  /api/stats/latest-round
```

Pages 프로젝트에서 D1 binding을 다음 이름으로 설정합니다.

```text
Binding name: DB
Database: lotto-studio-db
```

D1 생성 후 초기화:

```powershell
cd C:\Workspace\02.Lotto\lotto-recommender
npx wrangler d1 create lotto-studio-db
```

출력되는 `database_id`를 `wrangler.toml`에 반영합니다.

그 다음 스키마와 로또 이력 데이터를 넣습니다.

```powershell
npm run build:d1-seed
npm run cf:d1:schema
npm run cf:d1:seed
```

로컬 Pages Functions 테스트:

```powershell
npm run cf:pages:dev
```
