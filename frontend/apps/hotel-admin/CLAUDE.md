# 호텔 운영자 앱(hotel-admin) 작업 지침

호텔 마스터·운영자가 쓰는 앱(Vite + React). 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를, 두 어드민 앱의 공통 규칙은 `frontend/docs/admin-app.md`를 따른다.

## 참고 문서

- 어드민 앱 공통 규칙: @../../docs/admin-app.md

## 앱

- 사용자: 호텔 마스터·운영자. 하는 일은 `docs/domain.md`의 '운영 계정과 역할'을 따른다.
- API: 앱 전용 API(`/api/v1/hotel-admin/**`)만 쓴다.
- 접속 주소: `http://hotel-admin.localhost:5174`. 개발 서버는 5174 포트로만 뜬다(`strictPort`).
- 로그인은 호텔 계정(백엔드)이 생긴 뒤 연결한다. 그때 `_authenticated`의 `beforeLoad`에 로그인 확인을 붙인다.
- axios, orval codegen, zod 검증(`shared/api`)과 QueryClient의 재시도 규칙·오류 처리기는 호텔 API가 생긴 뒤 붙인다. 지금은 Vite proxy와 TanStack Query 기본값의 QueryClient만 둔다.

## 구조

- 라우트 파일은 `src/app/routes`에 두고, `src/pages`의 페이지를 가져와 연결만 한다.
- `__root.tsx`에는 자체 UI를 두지 않는다. 탭 제목(`head`)과 `<HeadContent />`, `<Outlet />`만 둔다.
- 라우트 트리는 `src/app/router/route-tree.gen.ts`에 생성된다. 직접 수정하지 않고 커밋한다.
- 라우트 생성 설정은 `tsr.config.json`에만 둔다.

```
apps/hotel-admin/
├─ .env.local          # API_BASE_URL (proxy가 넘길 백엔드 주소)
├─ index.html          # 진입점: /src/app/entrypoint/main.tsx
├─ tsr.config.json     # 라우트 생성 설정
├─ vitest.config.mts   # 테스트 설정. vite.config.ts와 따로 둬서 라우터 플러그인·proxy를 읽지 않는다
├─ vitest-setup.ts     # jest-dom 매처 등록, 테스트마다 cleanup
└─ src/
   ├─ app/
   │  ├─ entrypoint/   # main.tsx, app-providers.tsx (Provider 조합)
   │  ├─ query/        # QueryClient (TanStack Query 기본값), QueryProvider (Devtools 포함)
   │  ├─ router/       # 라우터 생성, route-tree.gen.ts
   │  ├─ routes/       # TanStack Router 라우트 파일
   │  │  ├─ __root.tsx           # 탭 제목
   │  │  ├─ _authenticated.tsx   # 로그인이 필요한 화면의 레이아웃
   │  │  ├─ _authenticated/      # 로그인이 필요한 화면 (index.tsx: /)
   │  │  └─ login.tsx            # /login
   │  └─ styles/
   ├─ pages/           # home, login(로그인 화면 뼈대)
   ├─ widgets/         # admin-layout: 사이드바 메뉴(config/menu.ts), 위쪽 화면 제목
   └─ shared/
      └─ config/       # APP_INFO (앱 이름)
```

## 라우트 파일 이름

TanStack Router 파일 기반 라우팅이 정한 이름은 kebab-case 규칙의 예외로 둔다.

- `__root.tsx`: 루트 라우트. 이름이 고정이다.
- `_` 접두어: 경로를 만들지 않는 레이아웃 라우트(pathless). 예: `_authenticated.tsx`
- `$` 접두어: 경로 파라미터. 이름이 JS 식별자여야 하므로 여러 단어면 camelCase로 쓴다. 예: `$roomId.tsx` (`$room-id`는 쓸 수 없다)
- 라우트 파일은 `export const Route`(named export)로 내보낸다.

## 린트

- ESLint는 Vite 공식 React-TS 템플릿 구성(`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)에 `@tanstack/eslint-plugin-router` 권장 설정을 더해 쓴다.
- `@tanstack/react-query`는 `src/app`, `src/entities/*/api`, `src/features/*/api`, 테스트 파일, `vitest-setup.ts`에서만 import한다. 그 밖의 파일은 `no-restricted-imports`로 막는다.
- Steiger는 `fsd.configs.recommended`에서 `fsd/insignificant-slice`만 끈다(`frontend/CLAUDE.md`의 '레이어').

## 명령어 (`frontend/`에서 실행)

- 개발 서버: `pnpm --filter hotel-admin dev`
- 빌드: `pnpm --filter hotel-admin build` (`tsr generate` → `tsc --noEmit` → `vite build`)
- 린트: `pnpm --filter hotel-admin lint` (ESLint + Steiger)
- 타입 검사: `pnpm --filter hotel-admin typecheck` (`tsc --noEmit`)
- 테스트: `pnpm --filter hotel-admin test` (한 번 실행)
- 테스트 감시 모드: `pnpm --filter hotel-admin test:watch`
- 라우트 트리만 다시 만들기: `pnpm --filter hotel-admin exec tsr generate`. 개발 서버와 빌드는 라우트 트리를 자동으로 다시 만든다.
