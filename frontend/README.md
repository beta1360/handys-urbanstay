# urbanstay 프론트엔드

게스트 앱(web), 전체 어드민(app-admin), 호텔 운영자(hotel-admin) 세 앱과, 두 어드민 앱이 함께 쓰는 패키지 두 개를 담은 Turborepo + pnpm workspace다. 과제 전체 설명은 [루트 README](../README.md), API는 [백엔드 README](../backend/README.md), 작업 규칙 원문은 [frontend/CLAUDE.md](CLAUDE.md)에 있다.

| 구성 | 위치 | 누가 쓰나 | 기술 (`package.json` 기준) | 주소 |
|---|---|---|---|---|
| 게스트 앱 | `apps/web` | 게스트(회원) | Next.js 16.4, React 19.3, TanStack Query, react-hook-form + zod, fetch | http://localhost:3000 |
| 전체 어드민 앱 | `apps/app-admin` | 운영사 전체 어드민 | Vite 8 + React 19.3 SPA, TanStack Router·Query, axios, react-hook-form + zod | http://app-admin.localhost:5173 |
| 호텔 운영자 앱 | `apps/hotel-admin` | 호텔 마스터·운영자 | app-admin과 같다 | http://hotel-admin.localhost:5174 |
| `@repo/ui` | `packages/ui` | 두 어드민 앱 | 화면 컴포넌트(버튼, 입력창, 표, 페이지 이동, 토스트 등). 빌드 없이 소스를 내보낸다 | - |
| `@repo/admin-kit` | `packages/admin-kit` | 두 어드민 앱 | 도메인 무관 코드(요청·응답 검증, 오류 해석, 폼 도우미, 토스트 상태, 링크). 빌드 없음 | - |

- 공통: TypeScript, Tailwind CSS 4(기본값, 디자인 토큰 없음, 라이트 테마만), orval(API·zod 코드 생성), Vitest + React Testing Library, ESLint + Steiger(FSD 린터), turbo 2.
- 게스트 앱은 어드민 패키지를 쓰지 않고 자기 `src/shared/ui`를 쓴다.

## 1. 빠른 실행

명령은 모두 `frontend/`에서 실행한다. pnpm은 `packageManager`의 10.7.1이고, Node.js는 24에서 확인했다(저장소에 고정한 버전은 없다).

```bash
pnpm install
pnpm dev                        # 세 앱을 함께 실행 (turbo run dev)
pnpm --filter hotel-admin dev   # 한 앱만 (app-admin, web도 같다)
```

| 앱 | 접속 주소 | 백엔드로 넘기는 경로 |
|---|---|---|
| web | http://localhost:3000 (`next dev` 기본 포트) | `/api/v1/app/*` (Next.js rewrites) |
| app-admin | http://app-admin.localhost:5173 (`strictPort`) | `/api/v1/app-admin` (Vite proxy) |
| hotel-admin | http://hotel-admin.localhost:5174 (`strictPort`) | `/api/v1/hotel-admin` (Vite proxy) |

- 어드민 앱은 꼭 `*.localhost` 주소로 연다. 쿠키는 포트로 나뉘지 않아서 `localhost:5173`·`localhost:5174`로 열면 두 앱의 세션·CSRF 쿠키가 섞인다.
- 백엔드 주소는 각 앱 `.env.local`의 `API_BASE_URL`(`http://localhost:8080`)이고, 과제 제출용으로 커밋했다. 서버(설정 파일)에서만 읽는 값이라 `NEXT_PUBLIC_`·`VITE_` 접두어를 붙이지 않는다.
- 세 앱 모두 백엔드가 떠 있어야 동작한다. 백엔드 실행(Docker Desktop, `./gradlew bootRun`)과 테스트 계정은 [백엔드 README의 빠른 실행](../backend/README.md#1-빠른-실행)에 있다.
- API 코드 생성은 `pnpm codegen`(세 앱) 또는 `pnpm --filter <앱> codegen`이다. 백엔드가 8080에서 실행 중이어야 한다. 순서는 [api-codegen 스킬](../.claude/skills/api-codegen/SKILL.md)에 있다.

## 2. 화면 한눈에

### 게스트 앱 (web)

| 경로 | 화면 | 로그인 |
|---|---|---|
| `/` | 호텔 목록. 서버 순서(객실이 있는 호텔 먼저)를 그대로 쓰고, 객실이 없는 호텔은 뒤에 흐린 카드로 두어 고를 수 없다 | 필요 없음 |
| `/hotels/[hotelId]` | 날짜·인원 → 객실 유형(최대 인원, 1박 요금, 남은 객실 수, 없으면 '예약불가') → 예약 내용(최종 금액) → 예약 → 같은 화면의 완료 화면. 조건은 URL search에 둔다 | 예약만 회원 |
| `/login`, `/signup` | 로그인·회원가입. 성공하면 `?redirect`로 돌아간다 | - |
| `/me/stays` | 내 이용. '지금·앞으로의 이용'을 다 받은 뒤 '지난 이용'을 10건씩 이어 불러온다(무한 스크롤, '더 보기' 버튼 함께) | 회원 |

### 전체 어드민 (app-admin)

사이드바는 호텔, 회원, 어드민 계정이다. `/`는 `/hotels`로 보내고, 로그인은 `/login`이다.

| 메뉴 | 경로 | 화면 |
|---|---|---|
| 호텔 | `/hotels`, `/hotels/new`, `/hotels/$hotelId`, `/hotels/$hotelId/edit` | 목록(이름·주소·전화번호 검색)·등록(마스터 계정 함께)·상세·수정. 상세 아래에 '마스터 계정'(비밀번호 재설정)과 그 호텔의 '객실'(읽기 전용) 묶음 |
| | `/hotels/$hotelId/master/edit` | 마스터 정보(아이디·이름) 수정 |
| 회원 | `/members`, `/members/$memberId` | 목록(이름·이메일·전화번호 검색)·상세와 호텔 이용 기록. 조회만 한다 |
| 어드민 계정 | `/admins`, `/admins/new`, `/admins/$adminId`, `/admins/$adminId/edit` | 목록·추가·상세·이름 수정 |

### 호텔 운영자 (hotel-admin)

`/`는 `/rooms`로 보낸다. 객실 유형·운영자·호텔 정보·정산 메뉴는 마스터에게만 보이고, 운영자가 주소로 들어오면 권한 없음 카드를 보여준다(그 화면의 API는 부르지 않는다).

| 메뉴 | 경로 | 화면 | 누가 |
|---|---|---|---|
| 객실 | `/rooms`, `/rooms/$roomId` | 목록(이름 검색·상태·유형 거르기, 지금 이용객)·상세(지금 이용, 상태 바꾸기, 상태 이력) | 마스터·운영자 |
| | `/rooms/new`, `/rooms/$roomId/edit` | 생성·수정 | 마스터 |
| 객실 유형 | `/room-types/**` | 목록·생성·상세·수정(최대 인원, 1박 요금, 체크인·체크아웃 시각) | 마스터 |
| 이용객 | `/guests/**` | 목록·상세(지금 이용 중인 객실)·수정. 등록은 게스트 앱 예약 때 된다 | 마스터·운영자 |
| 이용 | `/stays`, `/stays/$stayId` | 목록(이용객 검색·체크인 기간·객실·취소 여부 거르기)·상세(예약 비용)·취소 | 마스터·운영자 |
| 운영자 | `/operators/**` | 목록·등록·상세·수정, 비밀번호 재설정, 비활성화·다시 활성화 | 마스터 |
| 호텔 정보 | `/hotel`, `/hotel/edit` | 자기 호텔 정보 상세·수정 | 마스터 |
| 정산 | `/settlements?month=YYYY-MM` | 월별 요약(정산 금액·이용 건수·취소 건수)과 그 달 이용 표. 이전·다음 달 버튼 | 마스터 |

화면별 동작(문구, 오류 처리, 초점)은 각 앱의 CLAUDE.md와 [어드민 공통 규칙](docs/admin-app.md)에 있다.

## 3. 구조

```
frontend/
├─ apps/
│  ├─ web/             # app/ (Next.js 라우트 파일) + src/ (FSD: _app, _pages, widgets, features, entities, shared)
│  ├─ app-admin/       # src/ (FSD: app, pages, widgets, features, entities, shared). 라우트 파일은 src/app/routes
│  └─ hotel-admin/     # app-admin과 같은 구성
├─ packages/
│  ├─ ui/              # @repo/ui
│  └─ admin-kit/       # @repo/admin-kit
├─ docs/admin-app.md   # 두 어드민 앱의 공통 규칙
├─ turbo.json          # build·lint·typecheck·test는 의존 패키지 먼저(^), dev·codegen은 캐시하지 않는다
└─ pnpm-workspace.yaml # apps/*, packages/*
```

- **FSD 레이어**: 세 앱 모두 `src/`를 `app → pages → widgets → features → entities → shared`로 나누고 위에서 아래로만 import한다. 같은 레이어의 다른 slice는 import하지 않고, slice는 `index.ts`로만 내보낸다. 한 화면에서만 쓰는 동작도 features slice로 둔다. web은 Next.js 라우팅과 겹치지 않게 `_app`, `_pages`를 쓴다. Steiger가 `pnpm lint`에서 검사한다.
- **3계층**: slice 안은 표현(`ui`: props로 그리고 입력을 콜백으로 올린다), 응용(`model`: 화면 상태를 하나의 값으로 갖고 흐름을 맡는다), 데이터(`api`·`shared/api`: 조회·변경 훅, 쿼리 키, 캐시 규칙, 요청·응답 검증)로 나누고, 표현 → 응용 → 데이터 한 방향으로만 의존한다. 화면은 `model` 훅 하나를 부르는 연결 컴포넌트와 표현 컴포넌트로 나눈다.
- **서버 상태**: `@tanstack/react-query`는 app 레이어(web은 `_app`), `entities/*/api`(조회 훅, 쿼리 키, 캐시 규칙), `features/*/api`(변경 훅)에서만 import한다. 그 밖은 ESLint `no-restricted-imports`가 막는다. orval이 만든 TanStack Query 훅은 쓰지 않는다.
- **API 계층**: orval이 앱마다 자기 문서 그룹에서 `src/shared/api/generated`(HTTP 함수)와 `generated/zod`(zod 스키마)를 만든다. `shared/api`는 요청과 응답을 생성된 zod로 검증하는 요청 함수, 요청 스키마·타입, 쿼리 키만 내보내고, 생성 코드는 `shared/api` 밖에서 import하지 않는다. 어드민 앱은 axios + `@repo/admin-kit/api`, web은 fetch + 앱의 `shared/api/validate.ts`를 쓴다. 상태를 바꾸는 요청의 성공 문구는 응답의 `message`를 그대로 보여준다.
- **게스트 앱(Next.js)**: 호텔 목록·호텔 찾기·내 이용 첫 페이지는 서버 컴포넌트가 `API_BASE_URL`로 조회한다(Cache Components, `'use cache'`는 쓰지 않는다). 브라우저 호출(객실 유형, 예약, 로그인 상태, 내 이용 다음 페이지)은 상대 경로로 보내 rewrites를 거친다. 내 이용의 서버 조회는 들어온 요청의 세션 쿠키(`JSESSIONID`)만 백엔드에 넘긴다.
- **어드민 앱**: Vite proxy가 자기 앱의 API만 넘기고, axios가 `XSRF-TOKEN` 쿠키를 `X-XSRF-TOKEN` 헤더로 보낸다. 로그인 상태는 내 정보 쿼리 캐시로 판단하고, 사용 중 401이면 `/login`으로 보낸다.

세부 규칙: [구조 (FSD)](CLAUDE.md#구조-fsd)(레이어, 3계층, 컴포넌트 나누기, 서버 상태, 폼, 화면 이동), 어드민 앱의 [API 호출](docs/admin-app.md#api-호출)·[로그인](docs/admin-app.md#로그인), web의 [서버 컴포넌트의 조회](apps/web/CLAUDE.md#서버-컴포넌트의-조회)·[브라우저의 조회와 변경](apps/web/CLAUDE.md#브라우저의-조회와-변경).

## 4. 검사와 테스트

```bash
pnpm lint          # ESLint + Steiger (세 앱). 두 패키지는 ESLint만
pnpm typecheck     # tsc --noEmit (app-admin, hotel-admin, @repo/ui, @repo/admin-kit)
pnpm test          # Vitest 한 번 실행 (turbo로 전체)
pnpm build         # web: next build(타입 검사 포함), 어드민: tsr generate → tsc --noEmit → vite build

pnpm --filter web exec tsc --noEmit              # web은 typecheck 스크립트가 없다. 빌드 없이 타입만
pnpm --filter web exec vitest run <파일>          # 개발 중에는 고친 곳만
pnpm --filter @repo/ui test                      # 패키지는 패키지 이름으로 지정한다
```

| 패키지 | web | app-admin | hotel-admin | @repo/ui | @repo/admin-kit | 합계 |
|---|---|---|---|---|---|---|
| 테스트 수 | 107 | 437 | 450 | 42 | 44 | 1,080 |

- 테스트 수는 2026-10-31 master `c8e273b` 기준이다.
- 테스트는 대상 소스 옆 `*.test.ts(x)`에 두고, 이름은 한국어 문장, 기대 문구는 운영 코드의 상수에서 읽는다. async Server Component는 Vitest로 단위 테스트할 수 없어 `load*` 함수와 표현·클라이언트 컴포넌트를 테스트한다. 규칙은 [테스트](CLAUDE.md#테스트)에 있다.

구조 점검(프론트엔드 PR 전, 저장소 루트에서):

```bash
bash .claude/skills/structure-check/structure-check.sh hotel-admin          # 앱 전체 (app-admin, web도 같다)
bash .claude/skills/structure-check/structure-check.sh hotel-admin master   # master에서 갈라진 뒤 바뀐 파일만
```

- ESLint·Steiger가 보지 않는 3계층 책임(pages의 상태·요청, `ui`의 요청·이동, `model`의 JSX 등)을 grep으로 찾는다. 걸린 줄이 모두 위반은 아니다. 읽는 법과 PR 본문 '구조 점검 결과' 형식은 [structure-check 스킬](../.claude/skills/structure-check/SKILL.md)에 있다.

주의

- `next dev`가 도는 폴더에서 `next build`(`pnpm build`, `pnpm --filter web build`)를 돌리지 않는다. 같은 `.next`를 써서 개발 서버가 깨진다. 다른 worktree에서 하거나 dev를 멈춘 뒤 한다.
- Windows worktree에서 `tsc`가 `TS1149`(같은 파일을 경로 대소문자만 다르게 두 번 읽음)를 내면 코드 오류가 아니다. `pnpm --filter <앱> exec tsc --noEmit --forceConsistentCasingInFileNames false`로 확인하거나 대소문자가 맞는 경로에서 돌린다. `tsconfig`는 고치지 않는다.
- orval 생성 코드와 어드민 앱의 라우트 트리(`src/app/router/route-tree.gen.ts`)는 직접 고치지 않고 커밋한다. 라우트 트리만 다시 만들 때는 `pnpm --filter <앱> exec tsr generate`다.

## 5. 더 보기

| 문서 | 내용 |
|---|---|
| [frontend/CLAUDE.md](CLAUDE.md) | 프론트엔드 공통 규칙 원문: [모노레포 구조](CLAUDE.md#모노레포-구조) · [구조 (FSD)](CLAUDE.md#구조-fsd) · [이름과 export](CLAUDE.md#이름과-export) · [상수](CLAUDE.md#상수) · [토스트](CLAUDE.md#토스트) · [API 코드](CLAUDE.md#api-코드) · [스타일](CLAUDE.md#스타일) · [테스트](CLAUDE.md#테스트) · [명령어](CLAUDE.md#명령어-frontend에서-실행) |
| [docs/admin-app.md](docs/admin-app.md) | 두 어드민 앱의 공통 규칙: 스택, 구조, 화면(토스트, 목록·상세·등록·수정), 패키지 쓰는 법, API 호출, 로그인 |
| [apps/web/CLAUDE.md](apps/web/CLAUDE.md) | 게스트 앱: 화면 목록, 로그인 상태, 토스트, 폼, 서버 컴포넌트·브라우저의 조회, API 호출 |
| [apps/app-admin/CLAUDE.md](apps/app-admin/CLAUDE.md) · [apps/hotel-admin/CLAUDE.md](apps/hotel-admin/CLAUDE.md) | 어드민 앱별 화면 규칙, 구조 트리, `shared/api`·`entities/*/api`·`features/*/api` 목록, 린트 |
| [packages/ui/CLAUDE.md](packages/ui/CLAUDE.md) · [packages/admin-kit/CLAUDE.md](packages/admin-kit/CLAUDE.md) | 공유 패키지(빌드 없음, peerDependencies, 명령어) |
| [docs/frontend-flow.md](../docs/frontend-flow.md) | 프론트엔드 개발 플로우(문제 정의 → 사용자 흐름 → 데이터 계약 → 상태 설계 → 책임 분리 → 구현 → 검증 → 배포·관측) |
| [docs/api-convention.md](../docs/api-convention.md) | 프론트엔드·백엔드 공통 API 규약(응답 형식, 검증, 인증, 프론트엔드 호출 방식, codegen) |
| [backend/README.md](../backend/README.md) | 백엔드 실행, 테스트 계정, [API 한눈에](../backend/README.md#3-api-한눈에) |
| [README.md](../README.md) | 과제 전체: 문제 정의, 해결 방식, 구현 범위 |

Claude Code 스킬(`.claude/skills`)

| 스킬 | 쓸 때 |
|---|---|
| [web-feature](../.claude/skills/web-feature/SKILL.md) | 게스트 앱 화면·기능 추가(서버 컴포넌트 조회, "use client" 경계, 세션 쿠키 전달, 빌드 주의) |
| [admin-screen](../.claude/skills/admin-screen/SKILL.md) | 어드민 앱 목록·상세·등록·수정 화면 추가 순서(shared/api → entities → features → widgets → pages → routes → 테스트 → 문서 → 구조 점검) |
| [api-codegen](../.claude/skills/api-codegen/SKILL.md) | 백엔드 API가 바뀐 뒤 orval 생성 코드와 `shared/api` 래퍼 맞추기 |
| [structure-check](../.claude/skills/structure-check/SKILL.md) | PR 전 FSD·3계층 점검과 PR 본문 기록 |
| [local-run](../.claude/skills/local-run/SKILL.md) | 백엔드와 세 앱 로컬 실행, 더미 계정, 브라우저 확인 |
