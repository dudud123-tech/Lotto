# Cloudflare Pages Functions

Cloudflare Pages에서 D1 DB를 연결하면 아래 API를 사용할 수 있도록 준비했습니다.

## D1 바인딩

Pages 프로젝트 설정에서 D1 binding 이름을 다음으로 설정합니다.

```text
Binding name: DB
Database: lotto-studio-db
```

## API

```text
GET  /api/latest-draw
POST /api/tickets
POST /api/tickets/check-history
GET  /api/stats/latest-round
```

## 요청 예시

```bash
curl -X POST https://YOUR_DOMAIN/api/tickets/check-history \
  -H "content-type: application/json" \
  -d "{\"numbers\":[12,15,19,22,24,36]}"
```

## 참고

현재 프론트엔드는 정적 JSON을 우선 사용합니다. D1 배포 후 프론트 fetch 경로를 API로 전환하면 됩니다.
