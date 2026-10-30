# 프론트엔드 작업 지침

프론트엔드의 모든 앱에 공통으로 적용하는 규칙. 앱 전용 규칙은 각 앱의 CLAUDE.md에, 두 어드민 앱의 공통 규칙은 `frontend/docs/admin-app.md`에, 백엔드와 공통인 규칙은 저장소 루트의 docs/ 문서에 둔다.

## 참고 문서

- 도메인 뼈대: @../docs/domain.md
- 프론트엔드 개발 플로우: @../docs/frontend-flow.md
- API 규약: @../docs/api-convention.md
- 코드 규칙: @../docs/code-convention.md

## 모노레포 구조

- `frontend/`는 Turborepo + pnpm workspace 루트다.

```
frontend/
├─ apps/
│  ├─ web/          # 게스트 앱 (Next.js). 규칙: apps/web/CLAUDE.md
│  ├─ app-admin/    # 전체 어드민 앱 (Vite + React)
│  └─ hotel-admin/  # 호텔 운영자 앱 (Vite + React)
├─ docs/
│  └─ admin-app.md  # 두 어드민 앱의 공통 규칙
└─ packages/        # 앱 간 공유 코드
   └─ ui/           # 두 어드민 앱이 함께 쓰는 화면 컴포넌트 (@repo/ui). 규칙: packages/ui/CLAUDE.md
```

- 세 앱은 정책이 다르므로 각자 전용 API만 쓴다. API 코드는 앱마다 orval로 따로 생성한다.
- 어드민 앱은 `app-admin`(규칙: `apps/app-admin/CLAUDE.md`)과 `hotel-admin`(규칙: `apps/hotel-admin/CLAUDE.md`)이다. 각 앱의 CLAUDE.md는 `docs/admin-app.md`를 인용한다.

## 구조 (FSD)

- 세 앱 모두 `src/` 아래를 FSD로 구성한다. `@/*`는 각 앱의 `src/*`를 가리킨다.
- 한 단위가 여러 관심사를 함께 갖지 않게 나누는 것이 목적이다. 화면 조립, 사용자 동작, 도메인 데이터, 도메인과 무관한 도구를 서로 다른 레이어에 둔다.

### 레이어

| 레이어 | 맡는 일 | 예 |
|---|---|---|
| app | 앱 전체 설정. Provider, 라우터, QueryClient, 인증 가드 연결 | `app/query`, `app/auth` |
| pages | 라우트 하나의 화면. URL(경로 파라미터·search)을 읽고 widgets·features·entities를 배치만 한다. 상태와 요청 로직을 두지 않는다 | `pages/hotel-edit` |
| widgets | 여러 기능·도메인을 묶은 화면 블록 | `widgets/admin-layout` |
| features | 사용자 동작 하나. 그 동작의 폼, 제출, 변경 요청, 성공 뒤 동작을 둔다. 등록·수정·삭제·검색·로그인·로그아웃 같은 동작이 여기 속한다 | `features/hotel-create`, `features/auth-login` |
| entities | 도메인 하나. 그 도메인의 조회, 쿼리 키와 캐시 규칙, 대상 식별(예: 경로 파라미터 검사), 도메인을 보여주는 컴포넌트를 둔다 | `entities/hotel`, `entities/account` |
| shared | 도메인과 무관한 공통 코드. API 클라이언트(생성 코드, 검증을 거친 요청 함수), 폼 도우미, 라우터를 아는 공용 UI, 여러 곳에서 쓰는 문구 | `shared/api`, `shared/ui` |

- 한 화면에서만 쓰는 동작도 features slice로 둔다. 동작을 pages에 두면 화면 하나가 URL, 폼, 요청, 캐시, 이동을 모두 갖게 되고, 다른 화면이 쓰게 될 때마다 아래 레이어로 옮겨야 하기 때문이다. 그래서 Steiger의 `fsd/insignificant-slice` 규칙은 끈다.
- app·pages 레이어의 폴더 이름은 앱마다 정한다. web은 Next.js 라우팅과 겹치지 않게 `_app`, `_pages`를 쓴다.
- 레이어는 위에서 아래로만 import한다: app → pages → widgets → features → entities → shared
- 같은 레이어의 다른 slice는 import하지 않는다.
- slice는 `index.ts`(public API)로만 외부에 내보내고, 다른 slice는 public API로만 가져온다.
- 다른 slice를 `export { X } from "..."`로 재수출하지 않는다. 필요하면 import한 뒤 export한다. Steiger가 재수출은 검사하지 않기 때문이다. slice 자기 내부를 `index.ts`에서 재수출하는 것은 괜찮다.
- app 레이어에는 UI 컴포넌트를 두지 않는다. 앱 틀(레이아웃) 같은 UI는 widgets에 둔다.
- FSD 규칙은 Steiger(FSD 공식 린터)로 검사한다. 설정은 각 앱의 `steiger.config.mjs`이고, `pnpm lint`에 포함된다.

### 세그먼트

세그먼트 이름은 역할이 아니라 목적으로 짓는다. `components`, `hooks`, `providers` 같은 이름은 쓰지 않는다. slice 안은 아래 세그먼트로 나눈다.

| 세그먼트 | 맡는 일 |
|---|---|
| `ui` | 화면을 그린다. props로 받은 값과 이벤트로 그리고, 같은 slice의 `model` 훅만 부를 수 있다. 서버 상태 훅, TanStack Query, `navigate`를 직접 부르지 않는다. 라우터 `Link`로 그리는 것은 된다 |
| `model` | 상태와 흐름. 폼, 제출, 성공 뒤 이동 같은 훅을 두고 `ui`에 넘길 값을 만든다. 서버 상태는 `api`의 훅으로 다룬다 |
| `api` | 서버 상태. entities·features에만 둔다(아래 '서버 상태') |
| `lib` | 순수 함수 |
| `config` | 화면 문구와 상수 |

- slice의 화면은 훅을 불러 값을 모으는 연결 컴포넌트 하나와, 받은 값을 그리기만 하는 컴포넌트들로 나눈다.
- pages의 화면 컴포넌트는 URL을 읽고 widgets·features·entities의 컴포넌트를 배치만 한다.

### 서버 상태 (TanStack Query)

- `shared/api`는 도메인을 모르는 API 클라이언트다. orval 생성 코드, `http`, 생성된 zod로 검증한 요청 함수와 요청 스키마·타입만 내보낸다. TanStack Query를 쓰지 않는다.
- `entities/<도메인>/api`에 그 도메인의 조회 훅, 쿼리 키와 조회 설정(`staleTime`, `placeholderData` 등), 캐시 규칙 함수(예: 상세 캐시에 넣기, 목록 무효화, 내 정보 지우기)를 둔다. 같은 데이터의 캐시 규칙은 이 한 곳에만 둔다.
- `features/<동작>/api`에 그 동작의 변경 훅을 둔다. 변경이 성공하면 entities의 캐시 규칙 함수를 부른다. 캐시 키를 직접 다루지 않는다.
- app 레이어는 QueryClient 생성(재시도 규칙, 오류 처리기)과 인증 가드를 맡는다. 가드도 내 정보 조회·캐시는 entities의 함수로 한다.
- `@tanstack/react-query`는 `entities/*/api`, `features/*/api`, app 레이어에서만 import한다. 그 밖의 곳은 ESLint `no-restricted-imports`로 막는다. orval이 만든 TanStack Query 훅은 쓰지 않는다.

### 폼

- 폼은 react-hook-form과 zod resolver로 만든다.
- 폼 스키마(생성된 요청 스키마에 화면 문구를 덧붙인 것)와 제출 흐름(변경 훅 호출, 서버 오류 표시, 성공 뒤 동작)은 그 동작의 `features/<동작>/model`에, 폼 화면은 `features/<동작>/ui`에 둔다.
- 여러 동작이 함께 쓰는 입력 묶음(예: 등록·수정의 호텔 정보 입력 칸)은 그 묶음의 features slice에 둔다.
- 도메인과 무관한 폼 도우미(예: 서버 오류를 입력창 오류와 폼 알림으로 나누기)는 `shared/lib/form`에 둔다.
- 검사 시점, 오류 표시, 초점 같은 화면 동작은 각 앱의 화면 규칙(어드민 앱은 `docs/admin-app.md`)을 따른다.

### 공용 UI와 화면 이동

- 라우터를 아는 공용 UI는 각 앱의 `shared/ui`에 둔다.
- 화면 이동은 진짜 링크로 한다. 버튼처럼 보이는 이동은 `shared/ui`의 `ButtonLink`(버튼 모양의 라우터 `Link`), 글자 링크는 `TextLink`를 쓴다. `Button`에 `navigate`를 붙여 이동하지 않는다. 새 탭으로 열 수 있고 화면 낭독기에 링크로 읽히게 하기 위해서다.
- 제출 성공 뒤 이동처럼 동작의 결과로 일어나는 이동은 `model`의 훅에서 `navigate`로 한다.

## 이름과 export

- 폴더·파일 이름은 kebab-case로 쓴다. 컴포넌트 이름은 PascalCase다. 예: `room-status-badge.tsx` 안의 `RoomStatusBadge`
- named export를 기본으로 한다. 프레임워크가 default export를 요구하는 파일만 예외다.

## 상수

- 화면 문구 등 상수는 `as const` 객체로 둔다.
- slice 전용 상수는 그 slice의 `config/`에, 여러 곳에서 쓰는 상수는 `shared/config/`에 둔다. 여러 slice에 같은 문구(예: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', '불러오는 중입니다.', '다시 시도')를 따로 두지 않는다.

## Provider

- Provider는 역할별로 잘게 나눠 컴포넌트로 만들고 app 레이어에 둔다.
- 각 Provider는 목적 이름의 세그먼트에 둔다. 예: `query/query-provider.tsx`. `providers` 세그먼트는 쓰지 않는다.
- 모든 Provider는 `entrypoint/app-providers.tsx`에서 조합하고, 루트 레이아웃은 이 조합 하나만 감싼다.

## API 코드

- orval이 생성한 `src/shared/api/generated`를 쓴다. 생성 코드는 직접 수정하지 않고 codegen으로 다시 만든다.
- 요청 본문은 보내기 전에, 응답은 쓰기 전에 orval이 생성한 zod 스키마로 검증한다. 규칙은 `docs/api-convention.md`의 '검증'을 따른다.

## 스타일

- Tailwind CSS 기본값으로 작성한다. 별도 디자인 토큰은 두지 않는다.
- 라이트 테마만 지원한다.
- React Compiler는 쓰지 않는다. 메모이제이션이 필요하면 `useMemo`, `useCallback`, `memo`로 직접 한다.

## 테스트

- Vitest + React Testing Library로 테스트한다. 사용자 조작은 user-event, DOM 검증은 jest-dom 매처를 쓴다.
- 테스트 파일은 대상 소스 옆에 `*.test.ts(x)`로 둔다. 예: `app-header.tsx` 옆의 `app-header.test.tsx`
- 테스트 이름은 한국어 문장으로 쓴다. 예: `헤더에 앱 이름과 마이페이지 버튼을 보여준다`
- 화면 문구 같은 기대값은 상수에서 읽는다. 운영 코드의 문구를 테스트에 복사하지 않는다.
- async Server Component는 Vitest로 단위 테스트할 수 없다(Next.js 가이드).

## 명령어 (`frontend/`에서 실행)

- 모든 앱: `pnpm dev`, `pnpm build`, `pnpm lint`(ESLint + Steiger), `pnpm test`(한 번 실행), `pnpm codegen` (turbo로 실행)
- 타입 검사: `pnpm typecheck` (`tsc --noEmit`). `typecheck` 스크립트가 있는 `app-admin`, `hotel-admin`, `@repo/ui`에서 실행한다. web은 `next build`가 타입을 검사한다.
- 특정 앱만: `pnpm --filter web dev`처럼 `--filter`로 지정한다. 패키지는 `pnpm --filter @repo/ui test`처럼 패키지 이름으로 지정한다.
- 테스트 감시 모드: `pnpm --filter web test:watch`
- API 코드 생성은 백엔드가 실행 중이어야 한다.
