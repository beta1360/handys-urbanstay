# 어드민 공통 패키지(@repo/admin-kit) 작업 지침

두 어드민 앱이 함께 쓰는 도메인 무관 코드 패키지. 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를, 쓰는 법과 패키지에 둘 것은 `frontend/docs/admin-app.md`의 'UI 컴포넌트와 공유 코드'를 따른다.

## 참고 문서

- 어드민 앱 공통 규칙: @../../docs/admin-app.md

## 패키지

- 빌드 단계가 없다. `package.json`의 `exports`가 `src/`의 소스를 가리킨다.
- FSD 앱이 아니므로 Steiger를 쓰지 않는다. 코드는 목적별 폴더(`src/<이름>/`)에 두고 폴더의 `index.ts`로만 내보낸다. 내보내는 경로와 쓰는 법은 `docs/admin-app.md`의 'packages/admin-kit를 쓰는 법'에 둔다.
- 도메인 규칙, 도메인 오류 코드, 화면 문구, 앱의 생성 코드는 두지 않는다. 문구는 두 앱이 같게 쓰는 것(서버와 같은 입력 검증 문구, 일반 오류 문구)만 `config`에 둔다. 앱마다 다른 값(예: 생성된 오류 응답 스키마)은 인자로 받는다.
- `react`, `@tanstack/react-router`, `react-hook-form`, `zod`, `axios`는 쓰는 앱과 같은 것을 쓰도록 `peerDependencies`에 두고, 타입 검사·테스트용으로 `devDependencies`에도 앱과 같은 버전으로 둔다. `react-dom`은 라우터가 앱과 같은 설치본으로 풀리도록 `devDependencies`에 둔다. `@repo/ui`는 `dependencies`(`workspace:*`)다.
- 쓰는 앱의 `tsc`도 이 소스를 검사하므로 `tsconfig.json`의 검사 옵션을 app-admin과 같게 둔다. `import.meta.env` 타입은 `vite/client`에서 읽는다.
- ESLint는 packages/ui와 같은 Vite 템플릿 구성에 `createLink`를 `extraHOCs`로 더하고(`link`의 링크를 `createLink(...)`의 결과로 바로 내보내기 때문이다), `@tanstack/react-query` import를 막는다.

## 명령어 (`frontend/`에서 실행)

- 테스트: `pnpm --filter @repo/admin-kit test` (감시 모드: `test:watch`)
- 린트: `pnpm --filter @repo/admin-kit lint`
- 타입 검사: `pnpm --filter @repo/admin-kit typecheck`
