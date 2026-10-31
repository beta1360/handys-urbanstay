# 전체 어드민 앱(app-admin) 작업 지침

전체 어드민이 쓰는 앱(Vite + React). 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를, 두 어드민 앱의 공통 규칙은 `frontend/docs/admin-app.md`를 따른다.

## 참고 문서

- 어드민 앱 공통 규칙: @../../docs/admin-app.md

## 앱

- 사용자: 전체 어드민. 하는 일은 `docs/domain.md`의 '운영 계정과 역할'을 따른다.
- API: 앱 전용 API(`/api/v1/app-admin/**`)만 쓴다.
- 접속 주소: `http://app-admin.localhost:5173`. 개발 서버는 5173 포트로만 뜬다(`strictPort`).
- 호텔 마스터 계정 관리(`docs/domain.md`의 '호텔 마스터')는 호텔 상세(`/hotels/$hotelId`)의 '마스터 계정' 묶음과 마스터 정보 수정(`/hotels/$hotelId/master/edit`) 화면이다. 화면 동작은 `frontend/docs/admin-app.md`의 '상세 화면'·'등록·수정 화면'을 따르고, 아래만 더한다.
  - '마스터 계정' 묶음은 호텔 내용을 보여줄 때만 호텔 내용 아래에 그린다. 이름·아이디(`DescriptionList`), 묶음 머리의 '마스터 정보 수정' 버튼(`ButtonLink`, 마스터 정보를 보여줄 때만), 비밀번호 재설정 폼을 둔다. 마스터 정보를 불러오는 중·실패('다시 시도')는 묶음 안에서만 보여주고 호텔 내용은 그대로 둔다.
  - 비밀번호 재설정은 새 비밀번호 칸(`autocomplete="new-password"`, 보기 버튼 없음)과 '비밀번호 재설정' 버튼이다. 안내 문구에 재설정하면 마스터의 세션이 끊긴다는 내용을 둔다. 제출할 때만 검사하고, 성공하면 서버 문구를 토스트로 보여주고 칸을 비운 뒤 마스터 정보를 다시 불러온다(재설정도 version을 올리므로). 400 칸 오류는 칸 아래, 그 밖은 오류 토스트다.
  - 수정 화면은 아이디(이메일, `autocomplete="off"`)·이름이다. 아이디 칸 안내 문구에 바꾸면 마스터의 세션이 끊긴다는 내용을 둔다. 아이디 중복 409(`LOGIN_ID_DUPLICATED`)는 아이디 칸 오류, 수정 충돌 409(`HOTEL_ADMIN_MODIFIED`)는 '최신 내용 불러오기'와 함께 폼 안에 보여준다. 성공하면 호텔 상세로 간다(replace).
  - 찾을 수 없음은 잘못된 호텔 id와 404 `HOTEL_NOT_FOUND`다. 404 `HOTEL_MASTER_NOT_FOUND`(호텔은 있는데 마스터가 없음)는 마스터를 호텔과 함께 만들므로 생기지 않는 경우라 그 밖의 불러오기 실패로 둔다.
- 호텔 목록의 검색어 하나로 이름·주소·대표 전화번호를 찾는다(검색창 이름 '이름·주소·전화번호').
- 호텔 상세의 '마스터 계정' 묶음 아래에 그 호텔의 '객실' 묶음을 둔다(읽기 전용). 열은 호실, 유형, 층(없으면 회색 '층 없음'), 상태(공실·예약됨·이용중·정비중)이고, 이름 순은 서버가 정한다. 페이지와 묶음 안 상태 표시는 회원 상세의 '호텔 이용 기록'과 같다.
- 회원(`docs/domain.md`의 '회원')은 조회만 한다. 사이드바 '회원' 메뉴의 회원 목록(`/members`)과 회원 상세(`/members/$memberId`)다. 화면 동작은 `frontend/docs/admin-app.md`의 '목록 화면'·'상세 화면'을 따르고, 아래만 더한다.
  - 목록은 이름(상세 링크)·이메일·전화번호 열이고, 최근 가입순은 서버가 정한다. 검색어 하나로 이름·이메일·전화번호를 찾는다(검색창 이름 '이름·이메일·전화번호'). 등록 버튼은 없다.
  - 상세는 이름·이메일·전화번호·가입일(한국 날짜 `YYYY-MM-DD`)이다. 수정 화면이 없으므로 '목록으로' 링크 줄에 '수정' 버튼을 두지 않는다. 찾을 수 없음은 잘못된 회원 id와 404 `MEMBER_NOT_FOUND`다.
  - 상세 내용 아래 '호텔 이용 기록' 묶음은 그 회원과 연결된 이용객(모든 호텔)의 이용이다. 열은 호텔, 객실(호수), 유형, 기간(`체크인 ~ 체크아웃 (n박)`), 인원(`n명`), 최종 금액(천 단위 쉼표와 '원'), 취소 여부(취소한 이용만 '취소됨')다. 체크인이 늦은 순은 서버가 정한다.

## 구조

- 라우트 파일은 `src/app/routes`에 두고, `src/pages`의 페이지를 가져와 연결만 한다.
- `__root.tsx`에는 자체 UI를 두지 않는다. 탭 제목(`head`)과 `<HeadContent />`, `<Outlet />`, 오류 화면(`errorComponent`: `<HeadContent />`와 `ErrorPage`)만 둔다.
- 로그인 확인·로그인 화면 진입·사용 중 401 처리는 `src/app/auth`의 함수로 두고, 라우트 파일과 라우터는 이 함수를 연결만 한다. 내 정보 조회와 캐시는 `entities/account`의 함수(`ensureMe`, `isPendingMeQuery`, `forgetMe`)로 한다. 화면 동작은 `frontend/docs/admin-app.md`의 '로그인'을 따른다.
- `/`에는 화면을 두지 않고 호텔 목록(`/hotels`)으로 보낸다(방문 기록을 바꾸는 이동). 이동은 `src/app/router/index-redirect.ts`의 함수로 두고 `_authenticated/index.tsx`의 `beforeLoad`가 연결한다. 로그인 뒤 기본 이동(`/`)도 호텔 목록으로 이어진다.
- QueryClient와 라우터는 `src/app/router/router.ts`에서 함께 만든다. 라우터 context에 QueryClient를 넣고, QueryClient의 오류 처리기에 라우터를 넘기기 위해서다. `QueryProvider`도 여기서 만든 QueryClient를 쓴다.
- 라우터의 URL search 직렬화는 `src/shared/lib/search-params`의 `parseSearch`·`stringifySearch`를 쓴다(일반 쿼리 문자열). 테스트용 memory 라우터도 같은 함수를 넣는다. 규칙은 `frontend/docs/admin-app.md`의 '구조'를 따른다.
- 경로 파라미터(`$hotelId`)는 라우트의 `params.parse`·`params.stringify`로 읽고 쓴다. 두 함수는 `entities/hotel`에 두고, 상세·수정 라우트를 감싸는 `hotels/$hotelId/route.tsx`가 한 번 연결한다. 상세(`index.tsx`), 수정(`edit.tsx`), 마스터 정보 수정(`master/edit.tsx`) 화면은 이 라우트의 `useParams`로 검사한 id를 읽는다. 규칙은 `frontend/docs/admin-app.md`의 '상세 화면'을 따른다.
  - 회원은 상세 화면 하나뿐이라 감싸는 라우트 없이 `members/$memberId.tsx`가 `entities/member`의 두 함수를 연결한다.
- 여러 화면이 함께 쓰는 코드는 `frontend/docs/admin-app.md`의 '구조'에 따라 역할별로 둔다. 호텔 id 검사, 호텔 하나 조회(`useHotel`: 상태 값 `loading`·`failed`·`notFound`·`ready` 하나를 돌려준다), 상태별 화면(`HotelLoading`·`HotelLoadFailed`·`HotelNotFound`)과 상세 내용 목록(`HotelInformation`), 호텔 항목 이름(`HOTEL_FIELD_LABELS`: 입력 칸·상세·목록 표가 함께 쓴다), 등록·수정이 함께 쓰는 호텔 정보 입력 칸(`HotelInfoFields`: 칸마다 입력창 props를 받는 표현 컴포넌트)과 그 폼 스키마 조각(`createHotelInfoFormShape`)은 `entities/hotel`에 둔다. 호텔 마스터 조회(`useHotelMaster`: `useHotel`과 같은 상태 값), '마스터 계정' 묶음 카드(`HotelMasterSection`)와 묶음 안 상태 표시(`HotelMasterLoading`·`HotelMasterLoadFailed`)·정보 목록(`HotelMasterInformation`), 등록·수정이 함께 쓰는 마스터 아이디·이름 칸(`HotelMasterInfoFields`)과 처음·새 비밀번호 칸(`HotelMasterPasswordField`), 그 폼 스키마 조각(`createHotelMasterInfoFormShape`·`createHotelMasterPasswordSchema`)은 `entities/hotel-master`에 둔다. 회원 id 검사, 회원 하나 조회(`useMember`: `useHotel`과 같은 상태 값), 목록·이용 기록 조회 훅, 목록 페이지 계산과 검색어 정리, 상태별 화면(`MemberLoading`·`MemberLoadFailed`·`MemberNotFound`)과 상세 내용 목록(`MemberInformation`), 회원 항목 이름(`MEMBER_FIELD_LABELS`)은 `entities/member`에, 호텔의 객실 목록 조회 훅, 객실 항목 이름(`ROOM_FIELD_LABELS`: 호텔 상세의 객실 표와 회원 상세의 이용 기록 표가 함께 쓴다), 상태 문구(`ROOM_STATUS_LABELS`), 층 표시(`RoomFloor`)는 `entities/room`에 둔다. 여러 화면이 함께 쓰는 문구(`COMMON_MESSAGES`: 불러오는 중, 다시 시도, 취소, 목록으로, 저장, 최신 내용 불러오기, 검색, 검색 결과 없음, 페이지 이동)는 `shared/config`에, 금액 표시(`formatWon`)와 서버 UTC 시각의 한국 날짜 표시(`formatKoreanDate`)는 `shared/lib`에 둔다. 도메인과 무관한 폼 도우미, 토스트 상태, 화면 이동 링크(`ButtonLink`·`TextLink`), 요청·응답 검증과 서버와 같은 입력 검증 문구는 `@repo/admin-kit`의 것을 쓴다(`frontend/docs/admin-app.md`의 'packages/admin-kit를 쓰는 법').
- 서버 상태는 `frontend/CLAUDE.md`의 '서버 상태'를 따른다.
  - `shared/api`: 검증을 거친 요청 함수(`fetchMe`, `fetchHotels`, `fetchHotel`, `fetchHotelMaster`, `fetchMembers`, `fetchMember`, `fetchMemberStays`, `fetchHotelRooms`, 로그인·로그아웃, 호텔 등록·수정, 마스터 정보 수정·비밀번호 재설정)와 쿼리 키 함수(`meQueryKey`, `hotelListQueryKey`, `hotelQueryKey`, `hotelMasterQueryKey`, `memberListQueryKey`, `memberQueryKey`, `memberStayListQueryKey`, `hotelRoomListQueryKey`), 서버 오류 정보 읽기(`getApiError`)와 오류 코드(`API_ERROR_CODES`)
  - `entities/account/api`: 내 정보 조회(`useMe`, `ensureMe`)와 로그인 상태 캐시 규칙(`startSession`, `endSession`, `forgetMe`, `isPendingMeQuery`)
  - `entities/hotel/api`: 호텔 조회 훅(`useHotelQuery`, `useHotelListQuery`)과 캐시 규칙(`cacheSavedHotel`, `refetchHotel`·`useRefetchHotel`). 목록 페이지 계산(`getLastPage`, `isBeyondLastPage` 등)은 `entities/hotel/lib`에 둔다
  - `entities/hotel-master/api`: 마스터 조회 훅(`useHotelMasterQuery`)과 캐시 규칙(`cacheSavedHotelMaster`, `refetchHotelMaster`·`useRefetchHotelMaster`, 비밀번호 재설정 뒤 다시 불러오기 `refreshHotelMaster`)
  - `entities/member/api`: 회원 목록·상세·이용 기록 조회 훅(`useMemberListQuery`, `useMemberQuery`, `useMemberStayListQuery`). 회원은 조회만 하므로 캐시 규칙 함수가 없다. 목록 페이지 계산은 `entities/member/lib`에 둔다
  - `entities/room/api`: 호텔의 객실 목록 조회 훅(`useHotelRoomListQuery`). 조회만 하므로 캐시 규칙 함수가 없다
  - `features/<동작>/api`: 변경 훅. `hotel-create`(`useCreateHotel`), `hotel-update`(`useUpdateHotel`), `hotel-master-update`(`useUpdateHotelMaster`), `hotel-master-password-reset`(`useResetHotelMasterPassword`: 성공하면 `refreshHotelMaster`가 끝날 때까지 요청 중으로 둔다), `auth-login`(`useLogin`), `auth-logout`(`useLogout`)
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
   │  ├─ toast/        # ToastProvider (라우터 바깥에서 토스트 영역을 그린다)
   │  ├─ router/       # QueryClient·라우터 생성, route-tree.gen.ts, index-redirect.ts(/ → /hotels)
   │  ├─ routes/       # TanStack Router 라우트 파일
   │  │  ├─ __root.tsx           # 탭 제목, 오류 화면
   │  │  ├─ _authenticated.tsx   # 로그인이 필요한 화면의 레이아웃, 로그인 확인
   │  │  ├─ _authenticated/      # 로그인이 필요한 화면
   │  │  │  ├─ index.tsx         # / (/hotels로 보낸다)
   │  │  │  ├─ members/
   │  │  │  │  ├─ index.tsx      # /members (?keyword=&page=)
   │  │  │  │  └─ $memberId.tsx  # /members/$memberId (회원 상세). 경로 파라미터 검사
   │  │  │  └─ hotels/
   │  │  │     ├─ index.tsx      # /hotels (?keyword=&page=)
   │  │  │     ├─ new.tsx        # /hotels/new (호텔 등록). 고정 경로라 $hotelId보다 먼저 잡힌다
   │  │  │     └─ $hotelId/
   │  │  │        ├─ route.tsx   # /hotels/$hotelId 경로 파라미터 검사. 화면 없이 상세·수정을 감싼다
   │  │  │        ├─ index.tsx   # /hotels/$hotelId (호텔 상세)
   │  │  │        ├─ edit.tsx    # /hotels/$hotelId/edit (호텔 수정)
   │  │  │        └─ master/
   │  │  │           └─ edit.tsx # /hotels/$hotelId/master/edit (마스터 정보 수정)
   │  │  └─ login.tsx            # /login (?redirect=)
   │  └─ styles/
   ├─ pages/           # error(화면 오류), hotel-create(호텔 등록: features/hotel-create의 HotelCreateForm 배치), hotel-detail(호텔 상세: 경로 파라미터를 읽고 widgets/hotel-detail을 배치), hotel-edit(호텔 수정: 경로 파라미터를 읽고 features/hotel-update의 HotelUpdate 배치), hotel-master-edit(마스터 정보 수정: 경로 파라미터를 읽고 features/hotel-master-update의 HotelMasterUpdate 배치), hotel-list(호텔 목록: URL search 스키마. keyword·page를 읽어 features/hotel-search의 HotelSearchForm, 호텔 등록 링크, widgets/hotel-list의 HotelList 배치), member-list(회원 목록: URL search 스키마. keyword·page를 읽어 features/member-search의 MemberSearchForm, widgets/member-list의 MemberList 배치), member-detail(회원 상세: 경로 파라미터를 읽고 widgets/member-detail을 배치), login(로그인 화면 틀. redirect를 읽어 features/auth-login의 LoginForm 배치)
   ├─ widgets/
   │  ├─ admin-layout/ # 사이드바 메뉴(config/menu.ts), 위쪽 영역. model: useAdminHeader(화면 제목·계정 이름·로그아웃 상태). ui: AdminHeader(연결)·AdminHeaderBar(표현)
   │  ├─ hotel-detail/ # 호텔 상세. HotelDetail(연결)이 useHotel의 상태 값으로 찾을 수 없음 또는 링크 줄 + 불러오는 중·실패·내용을 고른다. 내용 아래의 HotelMasterPanel(연결)이 useHotelMaster의 상태 값으로 '마스터 계정' 묶음 안의 불러오는 중·실패·마스터 정보('마스터 정보 수정' 링크, 비밀번호 재설정)를 고르고, 그 아래 HotelRoomList(연결)가 useHotelRoomList(불러오는 중·실패·빈 상태·내용, 화면 상태의 페이지 이동)로 '객실' 묶음 안을 고른다
   │  ├─ member-list/  # 회원 목록. hotel-list와 같은 구성(useMemberList, MemberList·표·페이지 이동·상태별 화면)
   │  ├─ member-detail/ # 회원 상세. MemberDetail(연결)이 useMember의 상태 값으로 찾을 수 없음 또는 '목록으로' 링크 줄 + 불러오는 중·실패·내용을 고른다. 내용 아래의 MemberStayHistory(연결)가 useMemberStayHistory(불러오는 중·실패·빈 상태·내용, 화면 상태의 페이지 이동)로 '호텔 이용 기록' 묶음 안을 고른다
   │  └─ hotel-list/   # 호텔 목록. model: useHotelList(상태 값 loading·failed·empty·ready, 마지막 페이지를 넘으면 바로잡기, 페이지 이동). ui: HotelList(연결)·표·페이지 이동·상태별 화면(표현)
   ├─ features/
   │  ├─ hotel-create/    # 호텔 등록 폼. api: 등록 변경 훅(성공하면 entities/hotel의 캐시 규칙). model: 폼 스키마(마스터 계정 포함), useHotelCreateForm(react-hook-form, 성공하면 상세로 이동). ui: HotelCreateForm(연결)·HotelCreateFormView·MasterAccountFields(표현: entities/hotel-master의 마스터 칸)
   │  ├─ hotel-update/    # 호텔 수정. api: 수정 변경 훅(성공하면 entities/hotel의 캐시 규칙). model: 폼 스키마(version 포함), useHotelUpdateForm(react-hook-form, 처음 값으로 한 번만 채움, 수정 충돌 시 최신 내용 불러오기, 성공하면 상세로 이동). ui: HotelUpdate(연결: useHotel 상태로 불러오는 중·실패·찾을 수 없음·폼을 고름)·HotelUpdateForm(연결)·HotelUpdateFormView(표현)
   │  ├─ hotel-master-update/ # 마스터 정보 수정. api: 수정 변경 훅(성공하면 entities/hotel-master의 캐시 규칙). model: 폼 스키마(version 포함), useHotelMasterUpdateForm(호텔 수정과 같은 흐름, 아이디 중복은 아이디 칸 오류, 성공하면 호텔 상세로 이동). ui: HotelMasterUpdate(연결: useHotelMaster 상태로 고름)·HotelMasterUpdateForm(연결)·HotelMasterUpdateFormView(표현)
   │  ├─ hotel-master-password-reset/ # 마스터 비밀번호 재설정. api: 재설정 변경 훅(성공하면 마스터 다시 불러오기). model: useHotelMasterPasswordResetForm(성공하면 토스트·칸 비우기). ui: HotelMasterPasswordReset(연결)·HotelMasterPasswordResetView(표현)
   │  ├─ auth-login/      # 로그인 폼. api: 로그인(성공하면 로그인 상태 시작). model: 폼 스키마, useLoginForm(react-hook-form, 성공하면 redirect로 이동). ui: LoginForm(연결)·LoginFormView(표현)
   │  ├─ auth-logout/     # api: 로그아웃. 성공하거나 401이면 로그인 상태를 끝낸다
   │  ├─ member-search/   # 회원 목록 검색. hotel-search와 같은 흐름(검색하면 1페이지 /members로 이동)
   │  └─ hotel-search/    # 호텔 목록 검색. model: useHotelSearchForm(react-hook-form, URL 검색어를 따라감, 검색하면 1페이지 목록으로 이동). ui: HotelSearchForm(연결)·표현
   ├─ entities/
   │  ├─ account/      # api: 내 정보 조회, 로그인 상태 캐시 규칙(시작·끝·내 정보 지우기)
   │  ├─ hotel/        # api: 호텔 상세·목록 조회 훅, 캐시 규칙. lib: 목록 페이지 계산, 요청할 수 있는 페이지 범위, 검색어 정리(URL 스키마·검색·목록이 함께 쓴다). config: 호텔 항목 이름(HOTEL_FIELD_LABELS). 호텔 id 경로 파라미터 검사, 호텔 하나 조회(상태 값 하나, 404는 notFound), 상태별 화면·상세 내용 목록(HotelInformation), 등록·수정이 함께 쓰는 호텔 정보 입력 칸(HotelInfoFields)과 폼 스키마 조각
   │  ├─ member/       # api: 회원 목록·상세·이용 기록 조회 훅. lib: 목록·이용 기록 페이지 계산, 검색어 정리. config: 회원 항목 이름·화면 문구. model: 회원 id 경로 파라미터 검사, useMember(불러오는 중·실패·찾을 수 없음·내용). ui: 상태별 화면, 상세 내용 목록
   │  ├─ room/         # api: 호텔의 객실 목록 조회 훅. config: 객실 항목 이름·상태 문구. lib: 객실 목록 페이지 검사. ui: 층 표시
   │  └─ hotel-master/ # api: 마스터 조회 훅, 캐시 규칙, 새로 조회, 재설정 뒤 다시 불러오기. config: 항목 이름·화면 문구. lib: 비밀번호 길이. model: useHotelMaster(불러오는 중·실패·찾을 수 없음·내용), 등록·수정이 함께 쓰는 폼 스키마 조각과 비밀번호 검사. ui: '마스터 계정' 묶음 카드, 묶음 안 상태 표시, 정보 목록, 아이디·이름 칸, 비밀번호 칸
   └─ shared/
      ├─ api/          # 검증된 API만 index.ts로 내보낸다. TanStack Query를 쓰지 않는다
      │  ├─ account.ts          # 내 정보 조회와 쿼리 키, 로그인, 로그아웃, 로그인 요청 스키마
      │  ├─ hotel.ts            # 호텔 목록·상세 조회와 쿼리 키(목록 전체 포함), 등록, 수정, 목록·상세 파라미터·등록·수정 요청 스키마
      │  ├─ hotel-master.ts     # 호텔 마스터 조회와 쿼리 키, 정보 수정, 비밀번호 재설정, 수정·재설정 요청 스키마, 마스터 타입
      │  ├─ room.ts             # 호텔의 객실 목록 조회와 쿼리 키, 목록 파라미터 스키마, 객실·객실 상태 타입
      │  ├─ member.ts           # 회원 목록·상세·이용 기록 조회와 쿼리 키, 목록·이용 기록 파라미터 스키마, 회원·이용 기록 타입
      │  ├─ api-error.ts        # 서버 오류 정보 읽기 (getApiError: 생성된 ErrorApiResponse를 @repo/admin-kit의 createApiErrorReader에 넣는다), 오류 코드 (API_ERROR_CODES: 공통 코드 + 도메인 코드)
      │  ├─ http.ts             # orval mutator
      │  └─ generated/ # orval 생성 코드. 직접 수정하지 않고 shared/api 밖에서 import하지 않는다
      │     └─ zod/    # orval 생성 zod 스키마
      ├─ config/       # APP_INFO (앱 이름), COMMON_MESSAGES (여러 화면이 함께 쓰는 문구), TOAST_MESSAGES (토스트 영역·닫기 버튼 이름)
      └─ lib/
         ├─ currency/      # 금액을 천 단위 쉼표와 '원'으로 보여주기(formatWon)
         ├─ date-time/     # 서버의 UTC 시각을 한국 날짜 `YYYY-MM-DD`로 보여주기(formatKoreanDate)
         └─ search-params/ # URL search 직렬화(일반 쿼리 문자열). 라우터와 테스트용 라우터가 쓴다
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
