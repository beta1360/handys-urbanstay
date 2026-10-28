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
└─ packages/        # 앱 간 공유 코드. 예: ui/ (어드민 앱용 shadcn/ui)
```

- 세 앱은 정책이 다르므로 각자 전용 API만 쓴다. API 코드는 앱마다 orval로 따로 생성한다.
- 어드민 앱(`app-admin`, `hotel-admin`)은 아직 만들지 않았다. 앱을 만들 때 각 앱의 CLAUDE.md를 두고 `docs/admin-app.md`를 인용한다.

## 구조 (FSD)

- 두 앱 모두 `src/` 아래를 FSD로 구성한다. `@/*`는 각 앱의 `src/*`를 가리킨다.

| 레이어 | 역할 |
|---|---|
| app | Provider 등 앱 전체 설정 |
| pages | 페이지 |
| `widgets` | 단독으로 동작하는 미니앱 |
| `features` | 기능 단위. 등록·조회·수정·삭제(CRUD)가 여기 속한다 |
| `entities` | 도메인 정의 |
| `shared` | 도메인과 무관한 공통 코드. API 생성 코드(`shared/api/generated`)도 여기 둔다 |

- app·pages 레이어의 폴더 이름은 앱마다 정한다. web은 Next.js 라우팅과 겹치지 않게 `_app`, `_pages`를 쓴다.
- 레이어는 위에서 아래로만 import한다: app → pages → widgets → features → entities → shared
- 같은 레이어의 다른 slice는 import하지 않는다.
- slice는 `index.ts`(public API)로만 외부에 내보내고, 다른 slice는 public API로만 가져온다.
- 다른 slice를 `export { X } from "..."`로 재수출하지 않는다. 필요하면 import한 뒤 export한다. Steiger가 재수출은 검사하지 않기 때문이다. slice 자기 내부를 `index.ts`에서 재수출하는 것은 괜찮다.
- app 레이어에는 UI 컴포넌트를 두지 않는다. 앱 틀(레이아웃) 같은 UI는 widgets에 둔다.
- 세그먼트 이름은 역할이 아니라 목적으로 짓는다. `components`, `hooks`, `providers` 같은 이름은 쓰지 않는다.
- FSD 규칙은 Steiger(FSD 공식 린터)로 검사한다. 설정은 각 앱의 `steiger.config.mjs`이고, `pnpm lint`에 포함된다.

## 이름과 export

- 폴더·파일 이름은 kebab-case로 쓴다. 컴포넌트 이름은 PascalCase다. 예: `room-status-badge.tsx` 안의 `RoomStatusBadge`
- named export를 기본으로 한다. 프레임워크가 default export를 요구하는 파일만 예외다.

## 상수

- 화면 문구 등 상수는 `as const` 객체로 둔다.
- slice 전용 상수는 그 slice의 `config/`에, 여러 곳에서 쓰는 상수는 `shared/config/`에 둔다.

## Provider

- Provider는 역할별로 잘게 나눠 컴포넌트로 만들고 app 레이어에 둔다.
- 각 Provider는 목적 이름의 세그먼트에 둔다. 예: `query/query-provider.tsx`. `providers` 세그먼트는 쓰지 않는다.
- 모든 Provider는 `entrypoint/app-providers.tsx`에서 조합하고, 루트 레이아웃은 이 조합 하나만 감싼다.

## API 코드

- orval이 생성한 `src/shared/api/generated`를 쓴다. 생성 코드는 직접 수정하지 않고 codegen으로 다시 만든다.

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
- 특정 앱만: `pnpm --filter web dev`처럼 `--filter`로 지정한다.
- 테스트 감시 모드: `pnpm --filter web test:watch`
- API 코드 생성은 백엔드가 실행 중이어야 한다.
