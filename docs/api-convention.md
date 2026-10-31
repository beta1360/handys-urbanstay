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
  "message": "호텔을 등록했습니다.",
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "message": null,
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
| `data` | 성공 시 결과. 돌려줄 결과가 없는 성공(예: 로그아웃)과 실패 시 `null` |
| `message` | 상태를 바꾸는 요청이 성공했을 때 사용자에게 보여줄 결과 문구. 조회와 실패 시 `null` (아래 '성공 메시지') |
| `error` | 실패 시 에러 정보. 성공 시 `null` |
| `error.code` | 에러 코드 |
| `error.message` | 에러 메시지 |
| `error.fieldErrors` | 입력 검증 실패 목록. 각 항목은 `{ "field": "name", "message": "필수 입력입니다." }` 형태. 해당 없으면 빈 배열 |

### 성공 메시지

- 상태를 바꾸는 요청(POST, PUT, PATCH, DELETE)이 성공하면 `message`에 결과 문구를 담는다. 로그인·로그아웃도 포함한다. 예: 호텔 등록 '호텔을 등록했습니다.', 로그아웃 '로그아웃했습니다.'
- 조회(GET)가 성공하면 `message`는 `null`이다.
- 실패 응답의 `message`는 `null`이다. 실패 문구는 `error.message`에 담는다.
- 문구는 서버가 정한다. 클라이언트는 받은 문구를 그대로 보여주고, 같은 뜻의 문구를 따로 만들지 않는다. 어느 화면에서 어떻게 보여줄지(예: 토스트)는 클라이언트가 정한다.
- `message`는 응답 스키마에서 항상 있는 필드다(문자열 또는 `null`).

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

## 목록 조회

- 목록 API는 페이지로 나눠 돌려준다.
- 요청: `?page=0&size=10`
  - `page`는 0부터 시작한다. 기본값은 0, 최대 99다(최대 100페이지).
  - `size`는 기본값 10, 최소 1, 최대 100이다.
  - 범위를 벗어나면 400 `INVALID_INPUT`이다.
- 100페이지 너머의 항목은 검색으로 찾는다. 검색 파라미터(예: `keyword`)와 검색 기준은 API마다 정해 API 문서에 적는다.
- 응답의 `data`:

```json
{
  "items": [],
  "page": 0,
  "size": 10,
  "totalElements": 23,
  "totalPages": 3
}
```

- 정렬 기준은 API마다 정해 API 문서에 적는다.

## 검증

요청과 응답은 서버와 클라이언트가 각자 스키마로 검증한다. 상대가 검증했다고 믿고 건너뛰지 않는다.

### 서버

- 요청 본문과 파라미터는 Bean Validation(`@Valid`)으로 검사한다.
- 아래 경우는 모두 400 `INVALID_INPUT`이다.
  - 검증 규칙을 어긴 값
  - JSON 형식이 틀린 본문
  - 빠진 필드, 타입이 틀린 필드
  - 문서에 없는 필드
- 어느 필드가 틀렸는지 알 수 있으면 `fieldErrors`에 필드 이름과 문구를 담는다.

### 클라이언트

- 서버로 보내는 요청 본문은 zod 스키마로 검증한 뒤 보낸다. 검증에 실패하면 요청을 보내지 않는다.
  - 검증을 통과한 값(스키마에 있는 필드만)을 보낸다. 서버는 문서에 없는 필드를 거부한다.
- 서버에서 받은 응답은 zod 스키마로 검증한 뒤 쓴다. 필드가 빠졌거나 타입이 틀리면 오류로 처리하고 받은 값을 쓰지 않는다.
  - 스키마에 없는 필드가 더 있으면 오류로 보지 않고 버린다. 서버가 응답 필드를 추가해도 클라이언트가 codegen 전까지 깨지지 않게 하기 위해서다.
- zod 스키마는 orval이 자기 앱의 문서 그룹에서 생성한다. 손으로 따로 쓰지 않는다.
- 화면 입력 검사는 생성된 스키마를 바탕으로 하고, 화면 문구만 덧붙인다.
- 검증에 실패하면 전용 오류(요청 검증 실패, 응답 검증 실패)로 처리한다.
  - 재시도하지 않는다.
  - 화면에는 일반 오류 문구를 보여준다.
  - 개발 콘솔에 어느 필드가 틀렸는지 남긴다.

## API 문서 (Swagger)

- 백엔드는 springdoc으로 OpenAPI 문서를 제공한다. Swagger UI는 `/swagger-ui.html`이다.
- 문서는 앱별 그룹으로 나눈다. 게스트 앱은 `/v3/api-docs/app`, 전체 어드민 앱은 `/v3/api-docs/app-admin`, 호텔 운영자 앱은 `/v3/api-docs/hotel-admin`.
- 프론트엔드가 문서만 보고 API를 쓸 수 있는 수준으로 작성한다. 설명, 필드 설명, 예시, 에러 응답을 포함한다.

## 인증

- 어드민 앱(app-admin, hotel-admin)의 API는 로그인한 계정만 쓴다. 각 앱에는 그 앱의 역할 계정으로만 로그인한다.
- 게스트 앱(web)의 API는 회원 로그인이 필요한 API(예약, 내 이용, 내 정보, 로그아웃)만 로그인한 회원이 쓴다. 호텔·객실 유형 조회는 로그인 없이 쓴다.
- 로그인 상태는 서버 세션과 HttpOnly 세션 쿠키로 유지한다. 세 앱이 같다. 세션은 서버 메모리에 두므로 백엔드를 다시 띄우면 다시 로그인해야 한다.
- 어드민 API의 상태를 바꾸는 요청(POST, PUT, PATCH, DELETE)은 CSRF 토큰을 함께 보낸다. 게스트 API에는 CSRF를 적용하지 않는다.
  - 게스트 앱의 세션 쿠키는 `SameSite=Lax`로 둔다. 다른 사이트에서 오는 변경 요청에는 세션 쿠키가 실리지 않아 로그인한 회원으로 처리되지 않는다.
  - 서버는 어드민 API 응답에 토큰을 `XSRF-TOKEN` 쿠키로 준다. 401 응답에도 준다.
  - 클라이언트는 같은 값을 `X-XSRF-TOKEN` 헤더로 보낸다.
- 에러 응답
  - 로그인하지 않았으면 401 `UNAUTHORIZED`
  - 권한이 없으면 403 `FORBIDDEN`
  - CSRF 토큰이 없거나 틀리면 403 `INVALID_CSRF_TOKEN`
- CSRF 검사가 로그인 확인보다 먼저다. 그래서 로그인하지 않고 토큰도 없는 어드민 변경 요청은 403 `INVALID_CSRF_TOKEN`을 받는다.

### 로그인 흐름 (app-admin)

| API | 설명 |
|---|---|
| `GET /api/v1/app-admin/auth/me` | 내 정보 조회. 로그인 필요 |
| `POST /api/v1/app-admin/auth/login` | 로그인. 로그인 없이 호출하지만 CSRF 토큰은 필요 |
| `POST /api/v1/app-admin/auth/logout` | 로그아웃. 로그인 필요 |

1. 앱이 뜨면 내 정보 API로 로그인 상태를 확인한다. 로그인 전이면 401 `UNAUTHORIZED`와 함께 `XSRF-TOKEN` 쿠키를 받는다.
2. 로그인은 받은 토큰을 `X-XSRF-TOKEN` 헤더에 넣어 보낸다.
   - 성공하면 200과 내 정보(`id`, `loginId`, `name`)를 받는다.
   - 성공하면 세션 쿠키와 `XSRF-TOKEN` 쿠키가 새로 바뀐다. 다음 요청부터는 새 쿠키 값을 보낸다.
3. 로그인 API의 401은 `INVALID_CREDENTIALS`다. 아이디가 없을 때와 비밀번호가 틀렸을 때 같은 응답이다. 다른 API의 401(`UNAUTHORIZED`, 로그인 필요)과 구분해서 처리한다.
4. 로그아웃하면 세션 쿠키와 `XSRF-TOKEN` 쿠키가 지워진다. 다시 로그인하기 전에는 1번처럼 토큰을 다시 받는다.

### 로그인 흐름 (hotel-admin)

app-admin과 같은 흐름이고, 경로만 다르다.

| API | 설명 |
|---|---|
| `GET /api/v1/hotel-admin/auth/me` | 내 정보 조회. 로그인 필요 |
| `POST /api/v1/hotel-admin/auth/login` | 로그인. 로그인 없이 호출하지만 CSRF 토큰은 필요 |
| `POST /api/v1/hotel-admin/auth/logout` | 로그아웃. 로그인 필요 |

- 로그인과 내 정보의 `data`는 아래와 같다. `role`은 `MASTER`(마스터) 또는 `OPERATOR`(운영자)다.

```json
{
  "id": 1,
  "loginId": "master@example.com",
  "name": "홍길동",
  "role": "MASTER",
  "hotel": { "id": 1, "name": "어반스테이 강남" }
}
```

- 비활성 계정의 로그인도 401 `INVALID_CREDENTIALS`다. 아이디가 없거나 비밀번호가 틀렸을 때와 구분하지 않는다.
- 서버는 요청마다 계정을 다시 확인한다. 로그인한 뒤 계정이 비활성화되거나, 비밀번호가 재설정되거나, 아이디가 바뀌면 그 세션의 다음 요청은 401 `UNAUTHORIZED`이고 세션은 끊긴다. 다시 로그인해야 한다.

### 로그인 흐름 (게스트 앱)

| API | 설명 |
|---|---|
| `POST /api/v1/app/auth/signup` | 회원가입. 로그인 없이 호출 |
| `POST /api/v1/app/auth/login` | 로그인. 로그인 없이 호출 |
| `POST /api/v1/app/auth/logout` | 로그아웃. 로그인 필요 |
| `GET /api/v1/app/auth/me` | 내 정보 조회. 로그인 필요 |

- CSRF 토큰을 쓰지 않는다. 다른 사이트의 변경 요청은 세션 쿠키 `SameSite=Lax`로 막는다.
- 로그인 API의 401은 `INVALID_CREDENTIALS`다. 이메일이 없을 때와 비밀번호가 틀렸을 때 같은 응답이다. 다른 API의 401(`UNAUTHORIZED`, 로그인 필요)과 구분해서 처리한다.
- 로그인에 성공하면 세션 쿠키가 새로 바뀐다. 로그아웃하면 세션 쿠키가 지워진다.
- 게스트 앱의 서버 사이드 조회가 로그인 정보를 써야 하면(예: 내 이용 첫 페이지) 들어온 요청의 세션 쿠키만 백엔드 요청에 넘긴다.

## 프론트엔드 호출 방식

- 게스트 앱(web)
  - 대부분의 API 호출은 서버 사이드에서 한다.
  - 사용자 인터랙션에 따른 브라우저 호출(예약, 로그인·로그아웃, 내 이용의 다음 페이지)과 로그인 상태 확인(`/auth/me`)은 브라우저에서 하고, Next rewrites로 `/api/v1/app/*`를 백엔드로 넘긴다.
- 어드민 앱(app-admin, hotel-admin)
  - 브라우저에서 상대 경로로 호출하고, Vite 개발 서버의 proxy가 자기 앱의 API 경로만 백엔드로 넘긴다.
  - 쿠키는 포트로 나뉘지 않는다. 세션·CSRF 쿠키가 섞이지 않도록 앱마다 다른 호스트로 접속한다. app-admin은 `http://app-admin.localhost:5173`, hotel-admin은 `http://hotel-admin.localhost:5174`.
- CORS는 설정하지 않는다. 로컬 실행과 테스트 용도다.
- 백엔드 주소는 각 앱의 `.env.local`에 둔 `API_BASE_URL`에서 읽는다. `.env.local`은 과제 제출용으로 커밋한다.

## codegen

- 각 앱은 orval로 자기 문서 그룹에서만 API 코드를 생성한다.
  - 게스트 앱: `/v3/api-docs/app` → TanStack Query 훅 + fetch + zod 스키마
  - 전체 어드민 앱: `/v3/api-docs/app-admin` → TanStack Query 훅 + axios + zod 스키마
  - 호텔 운영자 앱: `/v3/api-docs/hotel-admin` → TanStack Query 훅 + axios + zod 스키마
- `frontend/`에서 `pnpm codegen`을 실행한다. 백엔드가 실행 중이어야 한다.
- 생성 코드는 각 앱의 `src/shared/api/generated`에 두고 커밋하며, 직접 수정하지 않는다.
- 백엔드 API가 바뀌면 codegen을 다시 실행해 생성 코드를 갱신한다.
