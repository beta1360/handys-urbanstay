# 호텔 운영자 앱(hotel-admin) 작업 지침

호텔 마스터·운영자가 쓰는 앱(Vite + React). 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를, 두 어드민 앱의 공통 규칙은 `frontend/docs/admin-app.md`를 따른다.

## 참고 문서

- 어드민 앱 공통 규칙: @../../docs/admin-app.md

## 앱

- 사용자: 호텔 마스터·운영자. 하는 일은 `docs/domain.md`의 '운영 계정과 역할'을 따른다.
- API: 앱 전용 API(`/api/v1/hotel-admin/**`)만 쓴다.
- 접속 주소: `http://hotel-admin.localhost:5174`. 개발 서버는 5174 포트로만 뜬다(`strictPort`).
- 로그인·로그인 확인·사용 중 로그인 만료·로그아웃·토스트는 app-admin과 같다(`frontend/docs/admin-app.md`의 '로그인'·'토스트').
- 위쪽 영역 오른쪽에는 내 정보 쿼리에서 읽은 호텔 이름, 계정 이름과 역할, 로그아웃 버튼을 둔다. 역할 문구(`MASTER` '마스터', `OPERATOR` '운영자')는 `entities/account`의 `ACCOUNT_ROLE_LABELS`다.
- `/`에 들어오면 방문 기록을 바꿔 객실 목록(`/rooms`)으로 보낸다(`app/router/index-redirect.ts`). 로그인 뒤 기본 이동 경로(`/`)도 같다. 사이드바 메뉴는 '객실' 하나다.
- 객실 화면: 목록 `/rooms`(`?keyword=&status=&page=`), 등록 `/rooms/new`, 상세 `/rooms/$roomId`, 수정 `/rooms/$roomId/edit`. 동작은 `frontend/docs/admin-app.md`의 목록·상세·등록·수정 화면 규칙을 따르고, 아래만 더한다.
  - 목록 열은 이름·유형·층·최대 인원·상태다. 이름순은 서버가 정한다.
  - 상태 거르기는 검색 폼 안의 선택 입력(`SelectField`, '전체'와 네 상태)으로 한다. 검색어처럼 '검색'을 눌러야 반영하고, 바꿀 때마다 이동하지 않는다. URL의 `status`는 생성된 목록 파라미터 스키마의 값만 쓰고 그 밖의 값은 지운다.
  - 검색어나 상태로 거른 목록이 비면 '검색 결과가 없습니다'를 보여준다.
  - 상태 문구(`VACANT` '공실', `RESERVED` '예약됨', `OCCUPIED` '이용중', `MAINTENANCE` '정비중')는 `entities/room`의 `ROOM_STATUS_LABELS`다. 층이 없으면 '층 없음', 소개가 없으면 '소개 없음'을 회색으로 보여준다.
  - 등록·수정 폼의 최대 인원·층은 글자 입력창(`inputMode="numeric"`)이고 `@repo/admin-kit/form`의 정수 검사로 숫자로 바꿔 보낸다. 층이 비면 null이다. 체크인·체크아웃 시각은 브라우저 시간 입력(`type="time"`, 값 `HH:mm`)이다.
  - 같은 이름의 객실이 있다는 409(`ROOM_DUPLICATED`)는 이름 칸의 오류로 보여준다. 수정 충돌은 `ROOM_MODIFIED`, 대상 없음은 `ROOM_NOT_FOUND`다.

## 구조

- 라우트 파일은 `src/app/routes`에 두고, `src/pages`의 페이지를 가져와 연결만 한다.
- `__root.tsx`에는 자체 UI를 두지 않는다. 탭 제목(`head`)과 `<HeadContent />`, `<Outlet />`, 오류 화면(`errorComponent`: `<HeadContent />`와 `ErrorPage`)만 둔다.
- 로그인 확인·로그인 화면 진입·사용 중 401 처리는 `src/app/auth`의 함수로 두고, 라우트 파일과 라우터는 이 함수를 연결만 한다. 내 정보 조회와 캐시는 `entities/account`의 함수(`ensureMe`, `isPendingMeQuery`, `forgetMe`)로 한다.
- QueryClient와 라우터는 `src/app/router/router.ts`에서 함께 만든다. 라우터 context에 QueryClient를 넣고, QueryClient의 오류 처리기에 라우터를 넘기기 위해서다. `QueryProvider`도 여기서 만든 QueryClient를 쓴다.
- 라우터의 URL search 직렬화는 `src/shared/lib/search-params`의 `parseSearch`·`stringifySearch`를 쓴다(일반 쿼리 문자열). 테스트용 memory 라우터도 같은 함수를 넣는다.
- 도메인과 무관한 폼 도우미, 토스트 상태, 화면 이동 링크, 요청·응답 검증과 서버와 같은 입력 검증 문구는 `@repo/admin-kit`의 것을 쓴다(`frontend/docs/admin-app.md`의 'packages/admin-kit를 쓰는 법').
- 서버 상태는 `frontend/CLAUDE.md`의 '서버 상태'를 따른다.
  - `shared/api`: 검증을 거친 요청 함수(`fetchMe`, 로그인·로그아웃, 객실 목록·조회·등록·수정)와 쿼리 키 함수(`meQueryKey`, `roomListQueryKey`, `roomQueryKey`), 서버 오류 정보 읽기(`getApiError`)와 오류 코드(`API_ERROR_CODES`)
  - `entities/account/api`: 내 정보 조회(`useMe`, `ensureMe`)와 로그인 상태 캐시 규칙(`startSession`, `endSession`, `forgetMe`, `isPendingMeQuery`)
  - `entities/room/api`: 객실 목록 조회(`useRoomListQuery`), 객실 조회(`useRoomQuery`)와 새로 조회(`useRefetchRoom`), 저장한 객실 캐시 규칙(`cacheSavedRoom`)
  - `features/<동작>/api`: `auth-login`(`useLogin`), `auth-logout`(`useLogout`), `room-create`(`useCreateRoom`), `room-update`(`useUpdateRoom`)
- 라우트 트리는 `src/app/router/route-tree.gen.ts`에 생성된다. 직접 수정하지 않고 커밋한다.
- 라우트 생성 설정은 `tsr.config.json`에만 둔다.

```
apps/hotel-admin/
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
   │  ├─ toast/        # ToastProvider (라우터 바깥에서 토스트 영역을 그린다)
   │  ├─ router/       # QueryClient·라우터 생성, route-tree.gen.ts, index-redirect.ts(/ → /rooms)
   │  ├─ routes/       # TanStack Router 라우트 파일
   │  │  ├─ __root.tsx           # 탭 제목, 오류 화면
   │  │  ├─ _authenticated.tsx   # 로그인이 필요한 화면의 레이아웃, 로그인 확인
   │  │  ├─ _authenticated/      # 로그인이 필요한 화면
   │  │  │  ├─ index.tsx         # / (객실 목록으로 보낸다)
   │  │  │  └─ rooms/            # index.tsx(목록, search 스키마 연결), new.tsx(등록), $roomId/route.tsx(id 파싱), $roomId/index.tsx(상세), $roomId/edit.tsx(수정)
   │  │  └─ login.tsx            # /login (?redirect=)
   │  └─ styles/
   ├─ pages/           # error(화면 오류), login(로그인 화면 틀), room-list(검색 폼·등록 버튼·목록 배치, URL search 스키마), room-detail, room-create, room-edit(경로의 id를 읽어 배치. 잘못된 id는 찾을 수 없음)
   ├─ widgets/
   │  ├─ admin-layout/ # 사이드바 메뉴(config/menu.ts: 객실), 위쪽 영역. model: useAdminHeader(화면 제목·호텔 이름·계정 이름·역할 문구·로그아웃 상태). ui: AdminHeader(연결)·AdminHeaderBar(표현)
   │  ├─ room-list/    # 객실 목록. model: useRoomList(상태별 내용, 마지막 페이지를 넘으면 바꿔 이동, 페이지 이동). ui: RoomList(연결)·표·빈 상태·불러오기 실패·페이지 이동
   │  └─ room-detail/  # 객실 상세. 상태별 내용과 '목록으로'·'수정' 링크 줄
   ├─ features/
   │  ├─ auth-login/   # 로그인 폼. api: 로그인(성공하면 로그인 상태 시작). model: 폼 스키마, useLoginForm(react-hook-form, 성공하면 redirect로 이동). ui: LoginForm(연결)·LoginFormView(표현)
   │  ├─ auth-logout/  # api: 로그아웃. 성공하거나 401이면 로그인 상태를 끝낸다
   │  ├─ room-search/  # 객실 목록 검색(이름 검색어·상태). model: useRoomSearchForm(제출하면 1페이지로 이동). ui: RoomSearchForm(연결)·RoomSearchFormView(표현)
   │  ├─ room-create/  # 객실 등록. api: useCreateRoom. model: 폼 스키마, useRoomCreateForm(이름 중복은 이름 칸 오류, 성공하면 상세로 이동). ui: 연결·표현
   │  └─ room-update/  # 객실 수정. api: useUpdateRoom. model: 폼 스키마·값 채우기, useRoomUpdateForm(수정 충돌이면 최신 내용 불러오기). ui: RoomUpdate(불러오기 상태)·RoomUpdateForm(연결)·표현
   ├─ entities/
   │  ├─ account/      # api: 내 정보 조회, 로그인 상태 캐시 규칙. config: 역할 문구(ACCOUNT_ROLE_LABELS)
   │  └─ room/         # api: 목록·상세 조회, 새로 조회, 캐시 규칙. config: 항목 이름·상태 문구(ROOM_STATUS_LABELS)·화면 문구. lib: 검색어·상태·페이지 검사. model: 경로 파라미터 검사, useRoom(불러오는 중·실패·찾을 수 없음·내용), 등록·수정이 함께 쓰는 폼 스키마 조각. ui: 객실 정보 입력 칸, 상세 내용, 층 표시, 상태별 카드
   └─ shared/
      ├─ api/          # 검증된 API만 index.ts로 내보낸다. TanStack Query를 쓰지 않는다
      │  ├─ account.ts          # 내 정보 조회와 쿼리 키, 로그인, 로그아웃, 로그인 요청 스키마
      │  ├─ room.ts             # 객실 목록·조회·등록·수정과 쿼리 키, 요청 스키마, 객실 타입
      │  ├─ api-error.ts        # 서버 오류 정보 읽기 (getApiError), 오류 코드 (API_ERROR_CODES: 공통 코드와 ROOM_NOT_FOUND·ROOM_DUPLICATED·ROOM_MODIFIED)
      │  ├─ http.ts             # orval mutator
      │  └─ generated/ # orval 생성 코드. 직접 수정하지 않고 shared/api 밖에서 import하지 않는다
      │     └─ zod/    # orval 생성 zod 스키마
      ├─ config/       # APP_INFO (앱 이름), COMMON_MESSAGES (여러 화면이 함께 쓰는 문구), TOAST_MESSAGES (토스트 영역·닫기 버튼 이름)
      └─ lib/
         └─ search-params/ # URL search 직렬화(일반 쿼리 문자열). 라우터와 테스트용 라우터가 쓴다
```

## 라우트 파일 이름

TanStack Router 파일 기반 라우팅이 정한 이름은 kebab-case 규칙의 예외로 둔다.

- `__root.tsx`: 루트 라우트. 이름이 고정이다.
- `_` 접두어: 경로를 만들지 않는 레이아웃 라우트(pathless). 예: `_authenticated.tsx`
- `$` 접두어: 경로 파라미터. 이름이 JS 식별자여야 하므로 여러 단어면 camelCase로 쓴다. 예: `$roomId.tsx` (`$room-id`는 쓸 수 없다)
- 라우트 파일은 `export const Route`(named export)로 내보낸다.

## 린트

- ESLint는 Vite 공식 React-TS 템플릿 구성(`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)에 `@tanstack/eslint-plugin-router` 권장 설정을 더해 쓴다.
- `src/shared/api` 밖의 파일은 `no-restricted-imports`로 `shared/api/generated` import를 막는다.
- `@tanstack/react-query`는 `src/app`, `src/entities/*/api`, `src/features/*/api`, 테스트 파일, `vitest-setup.ts`에서만 import한다. 그 밖의 파일(생성 코드를 뺀 `src/shared/api` 포함)은 `no-restricted-imports`로 막는다.
  - 두 제한은 파일 묶음마다 합친 설정 하나로 둔다. 같은 규칙을 두 설정에 두면 뒤 설정이 앞 설정을 덮기 때문이다.
- Steiger는 `fsd.configs.recommended`에서 `fsd/insignificant-slice`만 끈다(`frontend/CLAUDE.md`의 '레이어').

## 명령어 (`frontend/`에서 실행)

- 개발 서버: `pnpm --filter hotel-admin dev`
- 빌드: `pnpm --filter hotel-admin build` (`tsr generate` → `tsc --noEmit` → `vite build`)
- 린트: `pnpm --filter hotel-admin lint` (ESLint + Steiger)
- 타입 검사: `pnpm --filter hotel-admin typecheck` (`tsc --noEmit`)
- 테스트: `pnpm --filter hotel-admin test` (한 번 실행)
- 테스트 감시 모드: `pnpm --filter hotel-admin test:watch`
- API 코드 생성: `pnpm --filter hotel-admin codegen`. 백엔드가 실행 중이어야 한다. TanStack Query·axios 코드(`generated`)와 zod 스키마(`generated/zod`)를 함께 만든다.
- 라우트 트리만 다시 만들기: `pnpm --filter hotel-admin exec tsr generate`. 개발 서버와 빌드는 라우트 트리를 자동으로 다시 만든다.
