# 프론트엔드 작업 지침

프론트엔드(Next.js) 작업 시 따르는 규칙. 백엔드와 공통인 규칙은 docs/ 문서를 따른다.

## 참고 문서

- 도메인 뼈대: @../docs/domain.md
- 프론트엔드 개발 플로우: @../docs/frontend-flow.md
- API 규약: @../docs/api-convention.md
- 코드 규칙: @../docs/code-convention.md
- Next.js 에이전트 규칙: @AGENTS.md

## 구조 (FSD)

- Next.js 라우팅은 `app/`에, FSD 레이어는 `src/`에 둔다. `@/*`는 `src/*`를 가리킨다.
- `app/`의 라우트 파일은 `src/_pages`의 페이지를 가져와 내보내기만 한다.

```
frontend/
├─ app/            # Next.js 라우팅
└─ src/
   ├─ _app/
   ├─ _pages/
   ├─ widgets/
   ├─ features/
   ├─ entities/
   └─ shared/
```

| 레이어 | 역할 |
|---|---|
| `_app` | Provider 등 앱 전체 설정 |
| `_pages` | 페이지 |
| `widgets` | 단독으로 동작하는 미니앱 |
| `features` | 기능 단위. 등록·조회·수정·삭제(CRUD)가 여기 속한다 |
| `entities` | 도메인 정의 |
| `shared` | 도메인과 무관한 공통 코드. API 생성 코드(`shared/api/generated`)도 여기 둔다 |

- 레이어는 위에서 아래로만 import한다: `_app` → `_pages` → `widgets` → `features` → `entities` → `shared`
- 같은 레이어의 다른 slice는 import하지 않는다.
- slice는 `index.ts`(public API)로만 외부에 내보내고, 다른 slice는 public API로만 가져온다.

## 이름과 export

- 폴더·파일 이름은 kebab-case로 쓴다. 컴포넌트 이름은 PascalCase다. 예: `room-status-badge.tsx` 안의 `RoomStatusBadge`
- named export를 기본으로 한다. Next.js가 요구하는 `app/` 라우트 파일(page, layout 등)만 default export를 쓴다.

## 상수

- 화면 문구 등 상수는 `as const` 객체로 둔다.
- slice 전용 상수는 그 slice의 `config/`에, 여러 곳에서 쓰는 상수는 `shared/config/`에 둔다.

## Provider

- Provider는 역할별로 잘게 나눠 컴포넌트로 만들고 `src/_app`에 둔다.

## API 호출

- 대부분의 API 호출은 서버 사이드에서 한다. 사용자 인터랙션에 따른 호출만 브라우저에서 Next rewrites를 거친다.
- API 코드는 orval이 생성한 `src/shared/api/generated`를 쓴다. 생성 코드는 직접 수정하지 않고 `pnpm codegen`으로 다시 만든다.
- 백엔드 주소는 `.env`에서 읽는다.

## 렌더링과 스타일

- React Compiler는 쓰지 않는다. 메모이제이션이 필요하면 `useMemo`, `useCallback`, `memo`로 직접 한다.
- Cache Components가 켜져 있다. 캐시할 부분은 `'use cache'`로 명시한다.
- 스타일은 Tailwind CSS로 작성한다.

## 명령어

- 개발 서버: `pnpm dev`
- 빌드: `pnpm build`
- 린트: `pnpm lint`
- API 코드 생성: `pnpm codegen` (백엔드가 실행 중이어야 한다)
