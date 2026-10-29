# 전체 어드민 앱(app-admin) 작업 지침

전체 어드민이 쓰는 앱(Vite + React). 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를, 두 어드민 앱의 공통 규칙은 `frontend/docs/admin-app.md`를 따른다.

## 참고 문서

- 어드민 앱 공통 규칙: @../../docs/admin-app.md

## 앱

- 사용자: 전체 어드민. 하는 일은 `docs/domain.md`의 '운영 계정과 역할'을 따른다.
- API: 앱 전용 API(`/api/v1/app-admin/**`)만 쓴다.
- 접속 주소: `http://app-admin.localhost:5173`. 개발 서버는 5173 포트로만 뜬다(`strictPort`).

## 구조

- 라우트 파일은 `src/app/routes`에 두고, `src/pages`의 페이지를 가져와 연결만 한다.
- `__root.tsx`에는 자체 UI를 두지 않는다. 탭 제목(`head`)과 `<HeadContent />`, `<Outlet />`, 오류 화면(`errorComponent`: `<HeadContent />`와 `ErrorPage`)만 둔다.
- 로그인 확인·로그인 화면 진입·사용 중 401 처리는 `src/app/auth`의 함수로 두고, 라우트 파일과 라우터는 이 함수를 연결만 한다. 화면 동작은 `frontend/docs/admin-app.md`의 '로그인'을 따른다.
- QueryClient와 라우터는 `src/app/router/router.ts`에서 함께 만든다. 라우터 context에 QueryClient를 넣고, QueryClient의 오류 처리기에 라우터를 넘기기 위해서다. `QueryProvider`도 여기서 만든 QueryClient를 쓴다.
- 라우트 트리는 `src/app/router/route-tree.gen.ts`에 생성된다. 직접 수정하지 않고 커밋한다.
- 라우트 생성 설정은 `tsr.config.json`에만 둔다.

```
apps/app-admin/
├─ .env.local          # API_BASE_URL (proxy가 넘길 백엔드 주소)
├─ index.html          # 진입점: /src/app/entrypoint/main.tsx
├─ orval.config.ts     # API 코드 생성 설정
├─ tsr.config.json     # 라우트 생성 설정
├─ vitest.config.mts   # 테스트 설정. vite.config.ts와 따로 둬서 라우터 플러그인·proxy를 읽지 않는다
├─ vitest-setup.ts     # jest-dom 매처 등록, 테스트마다 cleanup
└─ src/
   ├─ app/
   │  ├─ auth/         # 로그인 연결
   │  │  ├─ login-guard.ts          # 로그인 확인, 로그인 화면 진입 (beforeLoad에서 부른다)
   │  │  ├─ login-redirect.ts       # /login의 search 스키마, redirect 경로 검사
   │  │  └─ unauthorized-handler.ts # 사용 중 401이면 /login으로 보낸다
   │  ├─ entrypoint/   # main.tsx, app-providers.tsx (Provider 조합)
   │  ├─ query/        # QueryClient 생성(재시도 규칙, 오류 처리기), QueryProvider (Devtools 포함)
   │  ├─ router/       # QueryClient·라우터 생성, route-tree.gen.ts
   │  ├─ routes/       # TanStack Router 라우트 파일
   │  │  ├─ __root.tsx           # 탭 제목, 오류 화면
   │  │  ├─ _authenticated.tsx   # 로그인이 필요한 화면의 레이아웃, 로그인 확인
   │  │  ├─ _authenticated/      # 로그인이 필요한 화면 (index.tsx: /)
   │  │  └─ login.tsx            # /login (?redirect=)
   │  └─ styles/
   ├─ pages/           # error(화면 오류), home, login(로그인 폼)
   ├─ widgets/         # admin-layout: 사이드바 메뉴(config/menu.ts), 위쪽 화면 제목·계정 이름·로그아웃
   └─ shared/
      ├─ api/          # 검증된 API만 index.ts로 내보낸다
      │  ├─ account.ts          # 내 정보 쿼리 옵션, 로그인, 로그아웃, 로그인 요청 스키마
      │  ├─ api-error.ts        # 서버 오류 정보 읽기 (getApiError), 오류 코드 (API_ERROR_CODES)
      │  ├─ validate.ts         # 요청 본문·응답 zod 검증, 개발 콘솔 로그
      │  ├─ validation-error.ts # RequestValidationError, ResponseValidationError
      │  ├─ http.ts             # orval mutator
      │  └─ generated/ # orval 생성 코드. 직접 수정하지 않고 shared/api 밖에서 import하지 않는다
      │     └─ zod/    # orval 생성 zod 스키마
      └─ config/       # APP_INFO (앱 이름)
```

## 라우트 파일 이름

TanStack Router 파일 기반 라우팅이 정한 이름은 kebab-case 규칙의 예외로 둔다.

- `__root.tsx`: 루트 라우트. 이름이 고정이다.
- `_` 접두어: 경로를 만들지 않는 레이아웃 라우트(pathless). 예: `_authenticated.tsx`
- `$` 접두어: 경로 파라미터. 이름이 JS 식별자여야 하므로 여러 단어면 camelCase로 쓴다. 예: `$hotelId.tsx` (`$hotel-id`는 쓸 수 없다)
- 라우트 파일은 `export const Route`(named export)로 내보낸다.

## 린트

- ESLint는 Vite 공식 React-TS 템플릿 구성(`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)에 `@tanstack/eslint-plugin-router` 권장 설정을 더해 쓴다.
- `src/shared/api` 밖의 파일은 `no-restricted-imports`로 `shared/api/generated` import를 막는다.
- Steiger는 `fsd.configs.recommended`를 예외 없이 쓴다.

## 명령어 (`frontend/`에서 실행)

- 개발 서버: `pnpm --filter app-admin dev`
- 빌드: `pnpm --filter app-admin build` (`tsr generate` → `tsc --noEmit` → `vite build`)
- 린트: `pnpm --filter app-admin lint` (ESLint + Steiger)
- 타입 검사: `pnpm --filter app-admin typecheck` (`tsc --noEmit`)
- 테스트: `pnpm --filter app-admin test` (한 번 실행)
- 테스트 감시 모드: `pnpm --filter app-admin test:watch`
- API 코드 생성: `pnpm --filter app-admin codegen`. 백엔드가 실행 중이어야 한다. TanStack Query·axios 코드(`generated`)와 zod 스키마(`generated/zod`)를 함께 만든다.
- 라우트 트리만 다시 만들기: `pnpm --filter app-admin exec tsr generate`. 개발 서버와 빌드는 라우트 트리를 자동으로 다시 만든다.
