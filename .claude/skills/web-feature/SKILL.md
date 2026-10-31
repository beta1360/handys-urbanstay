---
name: web-feature
description: 게스트 앱(web, Next.js 16)에 화면·기능을 추가할 때의 순서와 규칙(서버 컴포넌트 조회, "use client" 경계, rewrites로 하는 브라우저 호출, 세션 쿠키 전달, 로그인 redirect, 토스트, Suspense·Cache Components, 빌드·브라우저 확인 주의). "게스트 앱", "web 기능", "Next.js", "서버 컴포넌트", "예약 화면", "내 이용", "use client" 요청에 쓴다.
---

# 게스트 앱(web) 기능 추가

규칙의 원본은 `frontend/apps/web/CLAUDE.md`(화면·로그인 상태·토스트·폼·구조·API 호출)와 `frontend/CLAUDE.md`의 '구조 (FSD)'다. 이 스킬은 순서와 실제 예시 파일만 모은다. 경로는 `frontend/apps/web` 기준이다.

## 0. 시작 전

- 도메인 규칙·권한·용어는 `domain-rules` 스킬, 원본은 `docs/domain.md`. 문서에 없는 동작은 정하지 말고 묻는다.
- 이 Next.js는 학습한 버전과 API·규칙이 다를 수 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 관련 가이드를 읽는다(`AGENTS.md`).
- 화면 목록과 화면 규칙은 web `CLAUDE.md`의 '화면'을 따른다. 어드민 패키지(`@repo/ui`, `@repo/admin-kit`)는 쓰지 않고 `src/shared/ui`를 쓴다.
- 새 API면 먼저 `api-codegen` 스킬로 생성 코드를 만든다.

## 1. 라우트와 레이어

- Next.js 라우팅은 `app/`, FSD는 `src/`(`_app`, `_pages`, widgets, features, entities, shared)에 둔다.
- `app/`의 라우트 파일은 `src/_pages`의 페이지를 내보내기만 한다(예: `app/me/stays/page.tsx`). default export는 라우트 파일만 쓴다.
- `_pages`는 `<Suspense>` 안에서 `params.then(...)`으로 경로 파라미터를 읽고 연결 컴포넌트를 배치만 한다(예: `src/_pages/hotel-booking/ui/`). Cache Components(`next.config.ts`의 `cacheComponents: true`)에서는 `params`와 캐시하지 않는 조회가 `<Suspense>` 안에 있어야 한다.
- `'use cache'`는 쓰지 않는다. 호텔·객실 정보는 운영 앱에서 바뀌므로 항상 새로 조회한다.

## 2. 서버 컴포넌트의 조회 (기본)

클라이언트와 같은 3계층으로 둔다. 예: `src/entities/hotel/`, `src/widgets/my-stays/`

| 계층 | 위치 | 하는 일 |
|---|---|---|
| 데이터 | `entities/<도메인>/api` | 조회 함수 `get*`·`find*`와 조회 설정(예: `size` 100). `@/shared/api`의 검증된 요청 함수를 부른다 |
| 응용 | `<slice>/model`의 `load*` | 경로 파라미터 검사(`shared/lib/path-param`, 생성 스키마). 대상이 없으면 `notFound()`. 그 밖의 실패는 그대로 던진다. 화면 상태가 여럿이면 union 하나로 돌려준다 |
| 표현 | `<slice>/ui` | async 연결 컴포넌트가 `load*` 하나를 부르고 표현 컴포넌트를 고르기만 한다 |

- 목록은 첫 페이지(`size` 100)만 쓴다.
- 서버의 실패: 대상 없음은 `app/not-found.tsx`, 그 밖은 `app/error.tsx`가 보여준다.

### 로그인 정보가 필요한 서버 조회

예: `src/widgets/my-stays/model/load-my-stays.ts`

- 들어온 요청의 세션 쿠키만 백엔드에 넘긴다. `cookies()`(`next/headers`)에서 `JSESSIONID`(`widgets/my-stays/config/session-cookie.ts`)만 골라 `이름=값`으로 `entities/<도메인>/api` 조회 함수에 넘기고, `shared/api` 요청 함수가 `cookie` 헤더로 보낸다. 쿠키가 없으면 헤더 없이 보낸다.
- `next/headers`는 widgets의 `model`에서만 쓴다.
- 401 `UNAUTHORIZED`면 `redirect(loginHref(<그 화면>))`. `<Suspense>` 안에서 스트리밍 중이라 HTTP 307이 아니라 화면 안의 이동(meta refresh)으로 간다.

## 3. "use client" 경계

- 서버 컴포넌트가 가져오는 slice의 `index.ts`가 클라이언트 훅(`useSearchParams`, `usePathname` 등)을 쓰는 파일을 함께 내보내면 묶음 전체가 서버 그래프에 들어가 오류가 난다.
  - 그 훅 파일에 `"use client"`를 붙이거나(예: `src/entities/stay/model/use-stay-criteria.ts`), 서버가 쓰지 않는 세그먼트로 나눈다(예: `src/shared/lib/current-href`를 `login-redirect`와 따로 둠).
- 브라우저에서 상태를 갖는 연결 컴포넌트(`ui`)에 `"use client"`를 붙인다(예: `features/auth-login/ui/login-form.tsx`).

## 4. 브라우저의 조회와 변경

- 브라우저에서는 사용자 입력에 따른 조회(객실 유형), 로그인 상태(내 정보), 변경(예약, 로그인·회원가입·로그아웃)만 한다. 나머지는 서버에서 조회한다(`docs/api-convention.md` '프론트엔드 호출 방식').
- 브라우저 요청은 상대 경로로 보내고, `next.config.ts`의 rewrites가 `/api/v1/app/*`만 `API_BASE_URL`로 넘긴다. 서버에서는 `shared/api/http.ts`가 `API_BASE_URL`을 붙인다. `.env.local`의 `API_BASE_URL`에는 `NEXT_PUBLIC_`을 붙이지 않는다.
- TanStack Query 규칙은 `frontend/CLAUDE.md` '서버 상태'와 같다. `@tanstack/react-query`는 `_app`, `entities/*/api`, `features/*/api`에서만 쓴다.
- fetch는 2xx가 아니어도 던지지 않으므로 `shared/api` 요청 함수가 `ApiResponseError`를 던진다. 오류는 `getApiError(error)`로 읽고 `API_ERROR_CODES`와 비교한다.
- 요청·응답 검증 실패와 4xx는 재시도하지 않는다(`src/_app/query`).
- 예약 조건처럼 공유·새로고침에 필요한 값은 URL search에 두고, 폼 제출은 `window.history.pushState`로 search만 바꾼다(web `CLAUDE.md` '화면 목록' 아래).

## 5. 로그인 상태와 redirect

- 로그인 상태는 `entities/member`의 내 정보 캐시(`checking | guest | member` 하나의 값). 401은 비회원(`null`)으로 캐시한다.
- 로그인·회원가입 성공은 회원을 캐시에 넣고 `router.replace(redirect)`, 로그아웃은 캐시를 `null`로 바꾸고 `router.refresh()`. 로그아웃의 401은 성공으로 본다.
- `redirect` 값은 반드시 `sanitizeLoginRedirect`(`src/shared/lib/login-redirect`)를 거친다. 로그인 링크는 `loginHref`·`signupHref`, 인증 화면에서는 `loginReturnTo`로 그 화면의 `redirect`를 그대로 넘긴다.
- 회원을 로그인·가입 화면에서 내보내는 것은 `src/widgets/guest-only`가 맡는다.
- 지금 주소를 `useSearchParams`로 읽는 컴포넌트는 `<Suspense>` 안에 둔다(헤더).

## 6. 폼과 토스트

- 폼 규칙(제출할 때만 검사, 첫 오류 칸 초점, 서버와 같은 문구, 400 칸 오류, 그 밖은 제출 버튼 위 `role="alert"` 알림 `errors.root.server`)은 web `CLAUDE.md`의 '폼'. 도우미는 `src/shared/lib/form`.
- 토스트는 로그인·회원가입·로그아웃의 서버 `message`만 보여준다. 폼 오류는 토스트로 보이지 않는다. `showToast`는 `src/shared/lib/toast`, 표현은 `src/shared/ui`, 영역은 `src/_app/toast`. 동작 규칙은 web `CLAUDE.md`의 '토스트'.
- 이동은 `next/link` 기반 `ButtonLink`·`TextLink`(`src/shared/ui`). 제출·로그아웃 뒤 이동만 `model`에서 `router`로 한다.

## 7. 테스트

- async Server Component는 Vitest로 단위 테스트할 수 없다. `load*` 함수(예: `widgets/my-stays/model/load-my-stays.test.ts`, `entities/hotel/model/load-hotel.test.ts`)와 표현·클라이언트 컴포넌트를 테스트한다.
- 계층별 테스트, 기대 문구는 상수에서, 반복 사례는 `it.each`(`frontend/CLAUDE.md` '테스트').

## 8. 검사와 확인

`frontend/`에서 실행한다.

```bash
pnpm --filter web exec vitest run <파일>      # 개발 중
pnpm turbo run lint test --filter=web        # 끝에 한 번
pnpm --filter web exec tsc --noEmit          # 빌드 없이 타입만
pnpm --filter web dev                        # http://localhost:3000
```

- `next dev`가 도는 폴더에서 `next build`(`pnpm --filter web build`)를 돌리지 않는다. 같은 `.next`를 써서 개발 서버가 깨진다. 빌드는 다른 worktree에서 하거나 dev를 멈춘 뒤 한다.
- 내장 브라우저 창이 숨겨져 있으면 `<Suspense>`의 내용이 나타나지 않고 불러오는 중에서 멈춘 것처럼 보일 수 있다. 스크린샷을 찍으면 다시 그린다. 로그인·더미 계정은 `local-run` 스킬.
- 구조는 `structure-check` 스킬로 `bash .claude/skills/structure-check/structure-check.sh web master`를 돌려 PR 본문 '구조 점검 결과'에 적는다.
- web `CLAUDE.md`의 화면 규칙과 구조 트리를 함께 고친다.
