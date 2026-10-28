# API 규약

프론트엔드와 백엔드가 함께 지키는 API 규칙. 프로젝트에 종속된 세부 규칙은 각 프로젝트의 CLAUDE.md에 둔다.

## 경로

- API는 쓰는 앱에 따라 나눈다. 앱마다 정책이 다르므로 다른 앱의 API를 쓰지 않는다.
  - 게스트 앱(web) 전용: `/api/v1/app/{리소스}`
  - 전체 어드민 앱(app-admin) 전용: `/api/v1/app-admin/{리소스}`
  - 호텔 운영자 앱(hotel-admin) 전용: `/api/v1/hotel-admin/{리소스}`

## 응답 형식

성공과 에러 모두 같은 형식으로 감싼다.

```json
{
  "success": true,
  "data": { "id": 1, "name": "..." },
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "객실을 찾을 수 없습니다.",
    "fieldErrors": []
  }
}
```

| 필드 | 설명 |
|---|---|
| `success` | 요청 성공 여부 |
| `data` | 성공 시 결과. 실패 시 `null` |
| `error` | 실패 시 에러 정보. 성공 시 `null` |
| `error.code` | 에러 코드 |
| `error.message` | 에러 메시지 |
| `error.fieldErrors` | 입력 검증 실패 목록. 각 항목은 `{ "field": "name", "message": "필수 입력입니다." }` 형태. 해당 없으면 빈 배열 |

### HTTP 상태 코드

상태 코드는 의미에 맞게 쓰고, 본문은 항상 위 형식으로 보낸다.

| 상황 | 상태 코드 |
|---|---|
| 성공 | 200 |
| 생성 성공 | 201 |
| 입력 오류 | 400 |
| 로그인 필요 | 401 |
| 권한 없음 | 403 |
| 대상 없음 | 404 |
| 충돌 (예: 같은 객실의 이용 기간 겹침) | 409 |
| 서버 오류 | 500 |

### 에러 코드

- 대문자 스네이크 케이스로 쓴다. 예: `ROOM_NOT_FOUND`
- 도메인별 에러 코드는 각 도메인을 개발할 때 정한다.

## API 문서 (Swagger)

- 백엔드는 springdoc으로 OpenAPI 문서를 제공한다. Swagger UI는 `/swagger-ui.html`이다.
- 문서는 앱별 그룹으로 나눈다. 게스트 앱은 `/v3/api-docs/app`, 전체 어드민 앱은 `/v3/api-docs/app-admin`, 호텔 운영자 앱은 `/v3/api-docs/hotel-admin`.
- 프론트엔드가 문서만 보고 API를 쓸 수 있는 수준으로 작성한다. 설명, 필드 설명, 예시, 에러 응답을 포함한다.

## 인증

- 어드민 앱(app-admin, hotel-admin)의 API는 로그인한 계정만 쓴다. 각 앱에는 그 앱의 역할 계정으로만 로그인한다.
- 로그인 상태는 서버 세션과 HttpOnly 세션 쿠키로 유지한다. 세션은 서버 메모리에 두므로 백엔드를 다시 띄우면 다시 로그인해야 한다.
- 상태를 바꾸는 요청(POST, PUT, PATCH, DELETE)은 CSRF 토큰을 함께 보낸다. 서버는 토큰을 `XSRF-TOKEN` 쿠키로 주고, 클라이언트는 같은 값을 `X-XSRF-TOKEN` 헤더로 보낸다.
- 로그인하지 않았으면 401, 권한이 없으면 403으로 응답한다.
- 게스트 앱의 로그인은 아직 정하지 않았다.

## 프론트엔드 호출 방식

- 게스트 앱(web)
  - 대부분의 API 호출은 서버 사이드에서 한다.
  - 사용자 인터랙션에 따른 브라우저 호출은 Next rewrites로 `/api/v1/app/*`를 백엔드로 넘긴다.
- 어드민 앱(app-admin, hotel-admin)
  - 브라우저에서 상대 경로로 호출하고, Vite 개발 서버의 proxy가 자기 앱의 API 경로만 백엔드로 넘긴다.
  - 쿠키는 포트로 나뉘지 않는다. 세션·CSRF 쿠키가 섞이지 않도록 앱마다 다른 호스트로 접속한다. app-admin은 `http://app-admin.localhost:5173`, hotel-admin은 `http://hotel-admin.localhost:5174`.
- CORS는 설정하지 않는다. 로컬 실행과 테스트 용도다.
- 백엔드 주소는 각 앱의 `.env.local`에 둔 `API_BASE_URL`에서 읽는다. `.env.local`은 과제 제출용으로 커밋한다.

## codegen

- 각 앱은 orval로 자기 문서 그룹에서만 API 코드를 생성한다.
  - 게스트 앱: `/v3/api-docs/app` → TanStack Query 훅 + fetch
  - 전체 어드민 앱: `/v3/api-docs/app-admin` → TanStack Query 훅 + axios
  - 호텔 운영자 앱: `/v3/api-docs/hotel-admin` → TanStack Query 훅 + axios
- `frontend/`에서 `pnpm codegen`을 실행한다. 백엔드가 실행 중이어야 한다.
- 생성 코드는 각 앱의 `src/shared/api/generated`에 두고 커밋하며, 직접 수정하지 않는다.
- 백엔드 API가 바뀌면 codegen을 다시 실행해 생성 코드를 갱신한다.
