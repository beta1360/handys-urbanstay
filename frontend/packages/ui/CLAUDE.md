# 공유 UI 패키지(@repo/ui) 작업 지침

두 어드민 앱이 함께 쓰는 화면 컴포넌트 패키지. 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를, 쓰는 법과 패키지에 둘 것은 `frontend/docs/admin-app.md`의 'UI 컴포넌트와 공유 코드'를 따른다.

## 참고 문서

- 어드민 앱 공통 규칙: @../../docs/admin-app.md

## 패키지

- 빌드 단계가 없다. `package.json`의 `exports`가 `src/`의 소스를 가리킨다.
- FSD 앱이 아니므로 Steiger를 쓰지 않는다. 컴포넌트 파일은 `src/`에 바로 둔다.
- `react`, `react-dom`, `tailwindcss`는 쓰는 앱의 것을 쓰도록 `peerDependencies`에 두고, 타입 검사·테스트용으로 `devDependencies`에도 둔다. Pretendard는 이 패키지의 `dependencies`다.
- 쓰는 앱의 `tsc`도 이 소스를 검사하므로 `tsconfig.json`의 검사 옵션을 app-admin과 같게 둔다.
- ESLint는 app-admin과 같은 Vite 템플릿 구성에서 라우터 플러그인만 뺐다.

## 명령어 (`frontend/`에서 실행)

- 테스트: `pnpm --filter @repo/ui test` (감시 모드: `test:watch`)
- 린트: `pnpm --filter @repo/ui lint`
- 타입 검사: `pnpm --filter @repo/ui typecheck`
