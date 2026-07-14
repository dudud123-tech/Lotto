# Cloudflare Pages 배포 가이드

Lotto Studio는 정적 사이트와 Cloudflare Pages Functions로 구성되어 있습니다. GitHub `main` 브랜치에 push되면 Cloudflare Pages가 자동으로 새 버전을 배포하는 구조입니다.

## 1. Pages 프로젝트 설정

Cloudflare Dashboard에서 다음 순서로 진행합니다.

1. `Workers & Pages` 이동
2. `Create application`
3. `Pages`
4. `Import an existing Git repository`
5. GitHub 저장소 `dudud123-tech/Lotto` 선택
6. Production branch를 `main`으로 설정
7. Build 설정 입력

```text
Framework preset: None
Build command: 비워둠
Build output directory: public
Root directory: lotto-recommender
```

현재 저장소 구조상 `wrangler.toml`, `public`, `functions` 폴더가 모두 `lotto-recommender` 아래에 있으므로 Root directory를 반드시 `lotto-recommender`로 설정해야 합니다.

## 2. 첫 배포

첫 배포는 D1 데이터베이스 없이 먼저 진행합니다. `wrangler.toml`의 D1 binding 블록은 DB를 만든 뒤 활성화합니다.

현재 상태:

```toml
# [[d1_databases]]
# binding = "DB"
# database_name = "lotto-studio-db"
# database_id = "REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID"
```

이 상태에서는 사이트와 Pages Functions가 먼저 배포됩니다. DB가 필요한 API는 D1 binding을 연결하기 전까지 정상 데이터 대신 설정 오류를 반환할 수 있습니다.

## 3. D1 데이터베이스 생성

사이트 첫 배포가 성공한 뒤 D1을 생성합니다.

```powershell
cd C:\Workspace\02.Lotto\lotto-recommender
npm install
npx wrangler login
npx wrangler d1 create lotto-studio-db
```

명령 출력에 표시되는 `database_id`를 복사합니다.

## 4. D1 binding 활성화

`wrangler.toml`에서 D1 블록 주석을 해제하고 실제 UUID를 넣습니다.

```toml
[[d1_databases]]
binding = "DB"
database_name = "lotto-studio-db"
database_id = "실제_D1_DATABASE_UUID"
```

수정 후 GitHub에 push하면 Cloudflare Pages가 다시 배포하면서 Functions와 D1을 연결합니다.

## 5. D1 스키마와 데이터 넣기

로또 당첨번호 데이터를 D1에 넣습니다.

```powershell
cd C:\Workspace\02.Lotto\lotto-recommender
npm run build:d1-seed
npm run cf:d1:schema
npm run cf:d1:seed
```

준비된 API:

```text
GET  /api/latest-draw
POST /api/tickets
POST /api/tickets/check-history
GET  /api/stats/latest-round
```

## 6. AdSense 신청 전 점검

다음 페이지가 배포 URL에서 정상 접근되는지 확인합니다.

```text
/about/
/privacy/
/terms/
/disclaimer/
/contact/
/robots.txt
/sitemap.xml
```

배포 도메인이 정해지면 아래 파일의 임시 도메인도 실제 주소로 바꿉니다.

```text
public/robots.txt
public/sitemap.xml
```

