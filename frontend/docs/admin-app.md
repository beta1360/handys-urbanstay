# 어드민 앱 공통 규칙

전체 어드민 앱(`apps/app-admin`)과 호텔 운영자 앱(`apps/hotel-admin`)에 함께 적용하는 규칙. 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`에, 앱마다 다른 것(API 경로, 포트, 사용자)은 각 앱의 CLAUDE.md에 둔다.

## 앱

| 앱 | 사용자 | API | 접속 주소 |
|---|---|---|---|
| app-admin | 전체 어드민 | `/api/v1/app-admin/**` | `http://app-admin.localhost:5173` |
| hotel-admin | 호텔 마스터·운영자 | `/api/v1/hotel-admin/**` | `http://hotel-admin.localhost:5174` |

- 각 앱이 하는 일은 `docs/domain.md`의 '운영 계정과 역할'을 따른다.

## 스택

- Vite + React + TypeScript
- 라우팅: TanStack Router (파일 기반)
- 서버 상태: TanStack Query, HTTP 요청: axios
- 스타일: Tailwind CSS 기본값. UI 컴포넌트는 shadcn/ui
- 테스트: Vitest + React Testing Library (`frontend/CLAUDE.md`의 테스트 규칙을 따른다)
- 앱은 TanStack Router 공식 CLI(`@tanstack/cli create --router-only`)로 만들고, 생성된 예제 파일은 걷어낸다.

## 구조

- `src/` 아래를 FSD로 구성한다. 레이어 규칙은 `frontend/CLAUDE.md`를 따른다.
- 라우트 파일은 FSD의 pages 레이어를 가져와 연결만 한다.
- 라우트 폴더의 위치와 app·pages 레이어 폴더 이름은 첫 앱(app-admin)을 만들 때 Steiger 검사와 맞춰 정한다.
- 로그인 확인은 로그인이 필요한 화면을 묶는 레이아웃 라우트의 `beforeLoad`에서 한다.

## 화면

- 데스크톱 화면을 기준으로 만든다.
- 기본 틀은 왼쪽 사이드바(메뉴), 위쪽(현재 위치, 계정·로그아웃), 가운데(내용)로 나눈다. 로그인 화면은 이 틀 밖에 둔다.
- 라이트 테마만 지원하고, 폰트는 Pretendard를 쓴다.

## UI 컴포넌트와 공유 코드

- shadcn/ui 컴포넌트는 `packages/ui`(`@repo/ui`)에 두고 두 앱이 함께 쓴다. 컴포넌트는 shadcn CLI로 추가한다.
- 그 밖의 코드는 지금은 공유하지 않는다. axios 설정, 로그인 만료 처리 등은 각 앱의 `shared`에 둔다. 실제로 중복이 생기면 그때 `packages/`로 옮긴다.

## API 호출

- 자기 앱의 API만 쓴다.
- 브라우저에서 상대 경로로 호출한다. Vite 개발 서버의 proxy가 자기 앱의 API 경로만 백엔드로 넘긴다. CORS는 쓰지 않는다.
- 백엔드 주소는 각 앱의 `.env.local`에 둔 `API_BASE_URL`에서 읽는다.
  - `VITE_` 접두어를 붙이지 않는다. 브라우저 코드에는 들어가지 않고 `vite.config`의 proxy 설정에서만 읽는다.
  - `.env.local`은 과제 제출용으로 커밋한다.
- 쿠키는 포트로 나뉘지 않는다. 두 앱의 세션·CSRF 쿠키가 섞이지 않도록 위 표의 접속 주소(`*.localhost`)로 연다.
- API 코드는 orval이 자기 문서 그룹(`/v3/api-docs/app-admin`, `/v3/api-docs/hotel-admin`)에서 TanStack Query 훅과 axios 함수로 생성한다.

## 로그인

- 로그인 흐름과 CSRF는 `docs/api-convention.md`의 인증 절을 따른다.
- axios는 같은 출처 요청에서 `XSRF-TOKEN` 쿠키를 읽어 `X-XSRF-TOKEN` 헤더로 보낸다. 이 기본 동작을 그대로 쓴다.
- 로그인 API의 401(`INVALID_CREDENTIALS`)과 다른 API의 401(`UNAUTHORIZED`)을 구분해서 처리한다. 구체적인 화면 동작은 로그인을 연결할 때 정한다.
- hotel-admin의 로그인은 호텔 계정(백엔드)이 생긴 뒤 연결한다.

## foundation

게스트 앱과 같은 수준으로 갖춘다.

- ESLint + Steiger (`pnpm lint`)
- 사이드바 레이아웃과 로그인 화면 뼈대
- TanStack Query Provider
- `.env.local`, Vite proxy, `*.localhost` 접속
- orval codegen
- Vitest + React Testing Library
