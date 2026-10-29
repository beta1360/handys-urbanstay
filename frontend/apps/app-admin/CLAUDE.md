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
- `__root.tsx`에는 자체 UI를 두지 않는다. 탭 제목(`head`)과 `<HeadContent />`, `<Outlet />`만 둔다.
- 라우트 트리는 `src/app/router/route-tree.gen.ts`에 생성된다. 직접 수정하지 않고 커밋한다.
- 라우트 생성 설정은 `tsr.config.json`에만 둔다.

```
apps/app-admin/
├─ index.html          # 진입점: /src/app/entrypoint/main.tsx
├─ tsr.config.json     # 라우트 생성 설정
└─ src/
   ├─ app/
   │  ├─ entrypoint/   # main.tsx
   │  ├─ router/       # 라우터 생성, route-tree.gen.ts
   │  ├─ routes/       # TanStack Router 라우트 파일
   │  │  ├─ __root.tsx
   │  │  ├─ _authenticated.tsx   # 로그인이 필요한 화면의 레이아웃
   │  │  ├─ _authenticated/      # 로그인이 필요한 화면 (index.tsx: /)
   │  │  └─ login.tsx            # /login
   │  └─ styles/
   ├─ pages/           # home, login
   ├─ widgets/         # admin-layout: 사이드바 메뉴(config/menu.ts), 위쪽 화면 제목
   └─ shared/
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
- Steiger는 `fsd.configs.recommended`를 예외 없이 쓴다.

## 명령어 (`frontend/`에서 실행)

- 개발 서버: `pnpm --filter app-admin dev`
- 빌드: `pnpm --filter app-admin build` (`tsr generate` → `tsc --noEmit` → `vite build`)
- 린트: `pnpm --filter app-admin lint` (ESLint + Steiger)
- 타입 검사: `pnpm --filter app-admin typecheck` (`tsc --noEmit`)
- 라우트 트리만 다시 만들기: `pnpm --filter app-admin exec tsr generate`. 개발 서버와 빌드는 라우트 트리를 자동으로 다시 만든다.
