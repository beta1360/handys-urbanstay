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
- 로그인 확인·로그인 화면 진입·사용 중 401 처리는 `src/app/auth`의 함수로 두고, 라우트 파일과 라우터는 이 함수를 연결만 한다. 내 정보 조회와 캐시는 `entities/account`의 함수(`ensureMe`, `isPendingMeQuery`, `forgetMe`)로 한다. 화면 동작은 `frontend/docs/admin-app.md`의 '로그인'을 따른다.
- `/`에는 화면을 두지 않고 호텔 목록(`/hotels`)으로 보낸다(방문 기록을 바꾸는 이동). 이동은 `src/app/router/index-redirect.ts`의 함수로 두고 `_authenticated/index.tsx`의 `beforeLoad`가 연결한다. 로그인 뒤 기본 이동(`/`)도 호텔 목록으로 이어진다.
- QueryClient와 라우터는 `src/app/router/router.ts`에서 함께 만든다. 라우터 context에 QueryClient를 넣고, QueryClient의 오류 처리기에 라우터를 넘기기 위해서다. `QueryProvider`도 여기서 만든 QueryClient를 쓴다.
- 라우터의 URL search 직렬화는 `src/shared/lib/search-params`의 `parseSearch`·`stringifySearch`를 쓴다(일반 쿼리 문자열). 테스트용 memory 라우터도 같은 함수를 넣는다. 규칙은 `frontend/docs/admin-app.md`의 '구조'를 따른다.
- 경로 파라미터(`$hotelId`)는 라우트의 `params.parse`·`params.stringify`로 읽고 쓴다. 두 함수는 `entities/hotel`에 두고, 상세·수정 라우트를 감싸는 `hotels/$hotelId/route.tsx`가 한 번 연결한다. 상세(`index.tsx`)와 수정(`edit.tsx`) 화면은 이 라우트의 `useParams`로 검사한 id를 읽는다. 규칙은 `frontend/docs/admin-app.md`의 '상세 화면'을 따른다.
- 여러 화면이 함께 쓰는 코드는 `frontend/docs/admin-app.md`의 '구조'에 따라 역할별로 둔다. 도메인과 무관한 폼 도우미는 `shared/lib/form`, 호텔 id 검사, 호텔 하나 조회(`useHotel`), 불러오는 중·불러오기 실패·찾을 수 없음 화면과 호텔 항목 이름(`HOTEL_FIELD_LABELS`: 입력 칸·상세·목록 표가 함께 쓴다)은 `entities/hotel`, 등록·수정이 함께 쓰는 호텔 정보 입력 칸은 `features/hotel-info-form`에 둔다. 여러 화면이 함께 쓰는 문구(`COMMON_MESSAGES`)는 `shared/config`, 화면 이동 링크(`ButtonLink`·`TextLink`)는 `shared/ui`에 둔다.
- 서버 상태는 `frontend/CLAUDE.md`의 '서버 상태'를 따른다.
  - `shared/api`: 검증을 거친 요청 함수(`fetchMe`, `fetchHotels`, `fetchHotel`, 로그인·로그아웃, 등록·수정)와 쿼리 키 함수(`meQueryKey`, `hotelListQueryKey`, `hotelQueryKey`)
  - `entities/account/api`: 내 정보 조회(`useMe`, `ensureMe`)와 로그인 상태 캐시 규칙(`startSession`, `endSession`, `forgetMe`, `isPendingMeQuery`)
  - `entities/hotel/api`: 호텔 조회 훅(`useHotelQuery`, `useHotelListQuery`)과 캐시 규칙(`cacheSavedHotel`, `refetchHotel`·`useRefetchHotel`). 목록 페이지 계산(`getLastPage`, `isBeyondLastPage` 등)은 `entities/hotel/lib`에 둔다
  - `features/<동작>/api`: 변경 훅. `hotel-create`(`useCreateHotel`), `hotel-update`(`useUpdateHotel`), `auth-login`(`useLogin`), `auth-logout`(`useLogout`)
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
   │  ├─ router/       # QueryClient·라우터 생성, route-tree.gen.ts, index-redirect.ts(/ → /hotels)
   │  ├─ routes/       # TanStack Router 라우트 파일
   │  │  ├─ __root.tsx           # 탭 제목, 오류 화면
   │  │  ├─ _authenticated.tsx   # 로그인이 필요한 화면의 레이아웃, 로그인 확인
   │  │  ├─ _authenticated/      # 로그인이 필요한 화면
   │  │  │  ├─ index.tsx         # / (/hotels로 보낸다)
   │  │  │  └─ hotels/
   │  │  │     ├─ index.tsx      # /hotels (?keyword=&page=)
   │  │  │     ├─ new.tsx        # /hotels/new (호텔 등록). 고정 경로라 $hotelId보다 먼저 잡힌다
   │  │  │     └─ $hotelId/
   │  │  │        ├─ route.tsx   # /hotels/$hotelId 경로 파라미터 검사. 화면 없이 상세·수정을 감싼다
   │  │  │        ├─ index.tsx   # /hotels/$hotelId (호텔 상세)
   │  │  │        └─ edit.tsx    # /hotels/$hotelId/edit (호텔 수정)
   │  │  └─ login.tsx            # /login (?redirect=)
   │  └─ styles/
   ├─ pages/           # error(화면 오류), hotel-create(호텔 등록: 마스터 계정 폼, 폼 스키마), hotel-detail(호텔 상세: 수정 버튼), hotel-edit(호텔 수정: 한 번만 채우는 폼, 수정 충돌 시 최신 내용 불러오기), hotel-list(호텔 목록: 검색·페이지·URL search 스키마, 호텔 등록 버튼), login(로그인 폼)
   ├─ widgets/         # admin-layout: 사이드바 메뉴(config/menu.ts), 위쪽 화면 제목·계정 이름·로그아웃
   ├─ features/
   │  ├─ hotel-info-form/ # 호텔 정보 입력 칸(이름·주소·대표 전화번호·소개)과 폼 스키마 조각. 등록·수정이 쓴다
   │  ├─ hotel-create/    # api: 호텔 등록 변경 훅. 성공하면 entities/hotel의 캐시 규칙을 부른다
   │  ├─ hotel-update/    # api: 호텔 수정 변경 훅. 성공하면 entities/hotel의 캐시 규칙을 부른다
   │  ├─ auth-login/      # api: 로그인. 성공하면 로그인 상태를 시작한다
   │  └─ auth-logout/     # api: 로그아웃. 성공하거나 401이면 로그인 상태를 끝낸다
   ├─ entities/
   │  ├─ account/      # api: 내 정보 조회, 로그인 상태 캐시 규칙(시작·끝·내 정보 지우기)
   │  └─ hotel/        # api: 호텔 상세·목록 조회 훅, 캐시 규칙. lib: 목록 페이지 계산. config: 호텔 항목 이름(HOTEL_FIELD_LABELS). 호텔 id 경로 파라미터 검사, 호텔 하나 조회(404는 찾을 수 없음), 불러오는 중·불러오기 실패·찾을 수 없음 화면
   └─ shared/
      ├─ api/          # 검증된 API만 index.ts로 내보낸다. TanStack Query를 쓰지 않는다
      │  ├─ account.ts          # 내 정보 조회와 쿼리 키, 로그인, 로그아웃, 로그인 요청 스키마
      │  ├─ hotel.ts            # 호텔 목록·상세 조회와 쿼리 키(목록 전체 포함), 등록, 수정, 목록·상세 파라미터·등록·수정 요청 스키마
      │  ├─ api-error.ts        # 서버 오류 정보 읽기 (getApiError), 오류 코드 (API_ERROR_CODES)
      │  ├─ validate.ts         # 요청(본문·파라미터)·응답 zod 검증, 개발 콘솔 로그
      │  ├─ validation-error.ts # RequestValidationError, ResponseValidationError
      │  ├─ http.ts             # orval mutator
      │  └─ generated/ # orval 생성 코드. 직접 수정하지 않고 shared/api 밖에서 import하지 않는다
      │     └─ zod/    # orval 생성 zod 스키마
      ├─ config/       # APP_INFO (앱 이름), FORM_VALIDATION_MESSAGES (서버와 같은 입력 검증 문구), COMMON_MESSAGES (여러 화면이 함께 쓰는 문구)
      ├─ lib/
      │  ├─ form/          # 필수·선택 문자열·비밀번호 검사, zod 오류·서버 fieldErrors를 칸별 오류로 나누기, 첫 오류 칸 초점
      │  └─ search-params/ # URL search 직렬화(일반 쿼리 문자열). 라우터와 테스트용 라우터가 쓴다
      └─ ui/           # ButtonLink (버튼 모양의 링크), TextLink (글자 링크)
```

## 라우트 파일 이름

TanStack Router 파일 기반 라우팅이 정한 이름은 kebab-case 규칙의 예외로 둔다.

- `__root.tsx`: 루트 라우트. 이름이 고정이다.
- `_` 접두어: 경로를 만들지 않는 레이아웃 라우트(pathless). 예: `_authenticated.tsx`
- `$` 접두어: 경로 파라미터. 이름이 JS 식별자여야 하므로 여러 단어면 camelCase로 쓴다. 예: `$hotelId/` (`$hotel-id`는 쓸 수 없다)
- `route.tsx`: 폴더 경로 자체의 라우트. 폴더 안의 라우트를 감싼다. 예: `$hotelId/route.tsx`
- `index.tsx`: 폴더 경로에서 보여줄 화면. 예: `$hotelId/index.tsx`
- 라우트 파일은 `export const Route`(named export)로 내보낸다.

## 린트

- ESLint는 Vite 공식 React-TS 템플릿 구성(`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)에 `@tanstack/eslint-plugin-router` 권장 설정을 더해 쓴다.
- `eslint-plugin-react-refresh`의 `only-export-components`에 `extraHOCs: ["createLink"]`를 준다. `shared/ui`의 링크를 TanStack Router `createLink(...)`의 결과로 바로 내보내기 때문이다.
- `src/shared/api` 밖의 파일은 `no-restricted-imports`로 `shared/api/generated` import를 막는다.
- `@tanstack/react-query`는 `src/app`, `src/entities/*/api`, `src/features/*/api`, 테스트 파일, `vitest-setup.ts`에서만 import한다. 그 밖의 파일(생성 코드를 뺀 `src/shared/api` 포함)은 `no-restricted-imports`로 막는다.
  - 두 제한은 파일 묶음마다 합친 설정 하나로 둔다. 같은 규칙을 두 설정에 두면 뒤 설정이 앞 설정을 덮기 때문이다.
- Steiger는 `fsd.configs.recommended`에서 `fsd/insignificant-slice`만 끈다(`frontend/CLAUDE.md`의 '레이어').

## 명령어 (`frontend/`에서 실행)

- 개발 서버: `pnpm --filter app-admin dev`
- 빌드: `pnpm --filter app-admin build` (`tsr generate` → `tsc --noEmit` → `vite build`)
- 린트: `pnpm --filter app-admin lint` (ESLint + Steiger)
- 타입 검사: `pnpm --filter app-admin typecheck` (`tsc --noEmit`)
- 테스트: `pnpm --filter app-admin test` (한 번 실행)
- 테스트 감시 모드: `pnpm --filter app-admin test:watch`
- API 코드 생성: `pnpm --filter app-admin codegen`. 백엔드가 실행 중이어야 한다. TanStack Query·axios 코드(`generated`)와 zod 스키마(`generated/zod`)를 함께 만든다.
- 라우트 트리만 다시 만들기: `pnpm --filter app-admin exec tsr generate`. 개발 서버와 빌드는 라우트 트리를 자동으로 다시 만든다.
