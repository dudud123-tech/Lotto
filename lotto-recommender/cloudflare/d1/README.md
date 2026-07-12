# Cloudflare D1 계획

Lotto Studio의 동적 데이터는 Cloudflare D1에 저장하는 방향으로 준비합니다.

## 저장할 데이터

- `lotto_draws`: 회차별 당첨번호
- `generated_tickets`: 사용자가 만든 번호
- `ticket_match_results`: 생성 번호와 특정 회차의 비교 결과
- `site_stats_daily`: 일별 생성/당첨 비교 통계

## 로컬 SQL 생성

현재 JSON 데이터를 D1 import용 SQL로 변환합니다.

```powershell
cd C:\Workspace\02.Lotto\lotto-recommender
node tools/build-d1-seed.js
```

생성 파일:

```text
cloudflare/d1/seed-lotto-draws.sql
```

## D1 생성 예시

Cloudflare Wrangler를 사용하는 경우:

```powershell
wrangler d1 create lotto-studio-db
wrangler d1 execute lotto-studio-db --file=cloudflare/d1/schema.sql
wrangler d1 execute lotto-studio-db --file=cloudflare/d1/seed-lotto-draws.sql
```

## 예정 API

```text
GET  /api/latest-draw
POST /api/tickets
POST /api/tickets/check-history
GET  /api/stats/latest-round
```

## 등수 계산 기준

- 1등: 6개 일치
- 2등: 5개 + 보너스 일치
- 3등: 5개 일치
- 4등: 4개 일치
- 5등: 3개 일치
