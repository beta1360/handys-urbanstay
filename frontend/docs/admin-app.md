# 어드민 앱 공통 규칙

전체 어드민 앱(`apps/app-admin`)과 호텔 운영자 앱(`apps/hotel-admin`)에 함께 적용하는 규칙. 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`에, 앱마다 다른 것(API 경로, 포트, 사용자)은 각 앱의 CLAUDE.md에 둔다.

## 앱

| 앱 | 사용자 | API | 접속 주소 |
|---|---|---|---|
| app-admin | 전체 어드민 | `/api/v1/app-admin/**` | `http://app-admin.localhost:5173` |
| hotel-admin | 호텔 마스터·운영자 | `/api/v1/hotel-admin/**` | `http://hotel-admin.localhost:5174` |

- 각 앱이 하는 일은 `docs/domain.md`의 '운영 계정과 역할'을 따른다.

## 스택

- Vite + React + TypeScript
- 라우팅: TanStack Router (파일 기반)
- 서버 상태: TanStack Query, HTTP 요청: axios
- 폼: react-hook-form + `@hookform/resolvers`의 zod resolver. 정확한 버전으로 고정한다(`pnpm add -E`). 범위(`^`)로 넣으면 lockfile이 배포된 지 2주가 안 된 새 버전으로 풀리기 때문이다.
- 스타일: Tailwind CSS 기본값. 게스트 앱과 같은 규칙으로, 별도 디자인 토큰을 두지 않는다. UI 라이브러리 없이 화면 컴포넌트를 직접 만든다.
- 테스트: Vitest + React Testing Library (`frontend/CLAUDE.md`의 테스트 규칙을 따른다)
  - 라우터가 필요한 컴포넌트는 테스트 파일 안에서 memory history로 만든 라우터에 넣어 테스트한다. 앱의 라우트 트리는 가져오지 않는다. widgets·pages가 app 레이어를 import하게 되어 FSD 규칙에 어긋나기 때문이다.
- 앱은 TanStack Router 공식 CLI(`@tanstack/cli create --router-only`)로 만들고, 생성된 예제 파일은 걷어낸다.

## 구조

- `src/` 아래를 FSD로 구성한다. 레이어·세그먼트·서버 상태·폼·화면 이동의 배치는 `frontend/CLAUDE.md`의 '구조 (FSD)'를 따른다. 어드민 앱에서는 아래처럼 둔다.
  - pages: 라우트 하나의 화면 조립. URL search 스키마도 그 화면의 pages slice에 두고 라우트 파일이 연결한다(아래 '목록 화면').
  - widgets: 여러 도메인·동작을 묶은 화면 블록. 예: `admin-layout`(사이드바·위쪽 영역), `hotel-detail`(호텔 상세: 상태별 내용과 '목록으로'·'수정' 링크 줄)
  - features: 사용자 동작 하나. 예: `hotel-create`(호텔 등록), `hotel-update`(호텔 수정), `hotel-search`(호텔 목록 검색), `auth-login`(로그인), `auth-logout`(로그아웃). 여러 동작이 함께 쓰는 입력 묶음은 그 묶음의 slice에 둔다. 예: `hotel-info-form`(등록·수정의 호텔 정보 입력 칸, 그 폼 스키마 조각과 문구)
  - entities: 도메인 하나. 예: `hotel`(호텔 조회 훅, 쿼리 키·캐시 규칙, 경로 파라미터 검사, 호텔 하나의 상태 값(불러오는 중·실패·찾을 수 없음·내용), 상태별 화면과 상세 내용 목록, 그 문구), `account`(내 정보 조회와 로그인 상태 캐시 규칙)
  - shared: `api`(검증을 거친 요청 함수), `lib/form`(도메인 무관 폼 도우미), `lib/search-params`(URL search 직렬화), `ui`(`ButtonLink`·`TextLink`), `config`(앱 이름, 서버와 같은 입력 검증 문구, 여러 곳에서 쓰는 문구)
- app·pages 레이어 폴더 이름은 `app`, `pages`를 그대로 쓴다.
- 라우트 파일은 app 레이어의 `routes` 세그먼트(`src/app/routes`)에 두고, FSD의 pages 레이어를 가져와 연결만 한다. 라우트 파일도 app 레이어 안에 있으므로 Steiger가 import 규칙을 검사한다.
- 라우터 생성 코드와 생성된 라우트 트리(`route-tree.gen.ts`)는 `src/app/router/`에, 진입점(`main.tsx`)은 `src/app/entrypoint/`에 둔다.
- 라우트 생성 설정(`routesDirectory`, `generatedRouteTree` 등)은 앱의 `tsr.config.json`에만 둔다. Vite 플러그인과 `tsr generate`가 이 파일을 함께 읽는다.
- 생성된 라우트 트리는 직접 수정하지 않고 커밋한다.
- 루트 라우트(`__root.tsx`)는 `<HeadContent />`와 `<Outlet />`만 그린다. 오류 화면(`errorComponent`)은 `<HeadContent />`와 pages의 오류 화면만 그린다. 브라우저 탭 제목은 루트 라우트의 `head`에서 `APP_INFO.name`(`shared/config`)으로 정하고, `index.html`에는 `<title>`을 두지 않는다.
- 로그인이 필요한 화면은 경로를 만들지 않는 레이아웃 라우트 `_authenticated` 아래에 두고, 로그인 화면(`/login`)은 그 밖에 둔다. 로그인 확인은 `_authenticated`의 `beforeLoad`에서 한다.
- 위쪽에 보여줄 현재 화면 제목은 각 화면 라우트의 `staticData.title`(선택)에 둔다. 타입은 `src/app/router/router.ts`에서 `StaticDataRouteOption`을 모듈 확장해 정한다.
- URL search는 TanStack Router 기본 직렬화(JSON) 대신 일반 쿼리 문자열로 읽고 쓴다. 기본 직렬화는 숫자만 있는 글자 값에 따옴표를 붙여 주소가 `?keyword=%22101%22`처럼 되기 때문이다.
  - 직렬화 함수는 `shared/lib/search-params`에 두고, 라우터 옵션 `parseSearch`·`stringifySearch`로 연결한다. 테스트용 memory 라우터에도 같은 함수를 넣는다.
  - 모든 값은 글자로 읽는다. 같은 이름이 여러 번 오면 마지막 값을 쓴다. 쓸 때는 `undefined`·`null`인 값을 뺀다.
  - 숫자 변환과 검사는 각 라우트의 search 스키마가 한다. 앱 안의 이동(`navigate`)은 검증된 값(숫자)을 다시 스키마에 넣으므로, 숫자 값의 스키마는 글자와 숫자를 함께 받는다.
  - hotel-admin 라우터는 아직 바꾸지 않았다. 첫 search 파라미터(로그인 `redirect`)를 쓸 때 같은 규칙을 적용한다.

## 화면

- 데스크톱 화면을 기준으로 만든다.
- 기본 틀은 왼쪽 사이드바(메뉴), 위쪽(현재 위치, 계정·로그아웃), 가운데(내용)로 나눈다. 로그인 화면은 이 틀 밖에 둔다.
  - 기본 틀은 widgets에 두고, `_authenticated` 레이아웃 라우트가 연결한다.
- 라이트 테마만 지원하고, 폰트는 Pretendard를 쓴다.

### 목록 화면

- 검색어와 페이지는 URL search(`?keyword=&page=`)에 둔다. 새로고침·뒤로 가기·주소 공유에도 같은 목록을 보여준다.
  - search 스키마는 그 화면의 pages slice에 두고, 라우트 파일이 `validateSearch`와 `stripSearchParams`로 연결한다.
  - 기본값(1페이지, 검색 없음)은 URL에 남기지 않는다.
  - 화면과 URL의 페이지는 1부터 센다. API에는 1을 뺀 값(0부터)을 보낸다.
  - URL의 잘못된 값은 기본값으로 바꾼다. 페이지는 API가 받는 범위의 정수만, 검색어는 앞뒤 공백을 지운 뒤 비어 있지 않고 API 최대 길이 이하인 값만 쓴다. 범위는 생성된 목록 파라미터 스키마로 검사한다.
  - 앱이 처음 뜰 때 라우터가 URL을 정리한 값으로 바꾼다(replace).
  - URL의 페이지가 받은 응답의 마지막 페이지보다 크면, 검색어는 그대로 두고 마지막 페이지로 바꾼다(replace). 결과가 없으면 1페이지로 간다. 바꾸는 동안에는 빈 상태 문구 대신 불러오는 중 문구를 보여준다.
  - 뒤로 가기 등으로 URL이 바뀌면 검색창의 값도 URL을 따라간다.
- 검색은 검색창과 '검색' 버튼(Enter 포함)으로 한다.
  - 입력할 때마다 검색하지 않는다.
  - 검색하면 1페이지로 가고, 검색창에는 앞뒤 공백을 지운 값을 남긴다.
  - 검색창은 API 최대 길이까지만 입력된다.
- 페이지 이동은 이전·다음 버튼과 현재 위치(`n / m 페이지`)로 한다.
  - 1페이지에서 이전, 마지막 페이지에서 다음은 누를 수 없다. 전체 페이지가 API가 받는 마지막 페이지보다 많아도 그 페이지에서 다음은 누를 수 없다.
  - 페이지를 옮기는 동안 이전 목록을 그대로 보여준다(`placeholderData`). 그동안 표에 `aria-busy`를 붙여 흐리게 보여준다. 마지막 페이지를 넘은 페이지의 응답은 이전 목록으로 쓰지 않는다.
  - 결과가 없으면 페이지 이동을 감춘다.
- 목록 자리에는 상태에 따라 하나만 보여준다.
  - 데이터가 있으면 표를, 항목이 없으면 빈 상태 문구를 보여준다. 빈 상태 문구는 검색어가 있을 때와 없을 때를 나눈다.
  - 데이터 없이 실패하면 오류 문구(`role="alert"`)와 '다시 시도' 버튼(다시 조회)을 보여준다. 데이터가 있을 때 다시 조회가 실패하면 데이터를 그대로 보여준다.
  - 401은 아래 '로그인'의 사용 중 로그인 만료를 따른다.
  - 처음 불러오는 동안과 마지막 페이지로 옮기는 동안에는 불러오는 중 문구(`role="status"`)를 보여준다.
- 이름 칸은 그 항목의 상세 화면으로 가는 링크다.
- 등록 화면이 있는 목록은 오른쪽 위에 등록 버튼(primary, 버튼 모양의 링크 `ButtonLink`)을 두고, 누르면 등록 화면으로 간다. 검색 버튼은 secondary다.

### 상세 화면

수정 화면처럼 id로 대상 하나를 불러오는 다른 화면도 경로 파라미터와 찾을 수 없음(위쪽 '목록으로' 링크를 감추고 카드의 '목록으로' 버튼만 둔다)은 상세 화면과 같게 처리한다.

- 경로는 목록 경로 아래의 id다. 예: `/hotels/$hotelId`
- id는 라우트의 `params.parse`·`params.stringify`로 숫자로 읽고 글자로 쓴다. 두 함수는 대상의 entities slice에 두고, 상세·수정 라우트를 감싸는 id 경로 라우트(예: `hotels/$hotelId/route.tsx`)가 한 번 연결한다.
  - 숫자만 있는 글자(`^\d+$`)를 숫자로 바꾼 값이 1 이상이고 생성된 경로 파라미터 스키마(안전한 정수)를 통과할 때만 쓴다. 앞의 0은 무시한다(`01`은 1).
  - 그 밖의 값(숫자가 아닌 글자, 0, 음수, 소수, 지수 표기, 안전한 정수보다 큰 수)은 `undefined`로 바꾼다. 오류를 던지면 루트 오류 화면으로 가기 때문이다.
  - 잘못된 id는 요청을 보내지 않고 바로 '찾을 수 없음'을 보여준다.
- 내용 자리에는 상태에 따라 하나만 보여준다.
  - 데이터가 있으면 내용을 보여준다. 다시 조회가 실패해도 데이터를 그대로 보여준다.
  - 잘못된 id와 대상이 없다는 404(예: `HOTEL_NOT_FOUND`)는 찾을 수 없다는 문구(`role="alert"`)와 '목록으로' 버튼만 카드에 보여준다. 위쪽 '목록으로' 링크는 그리지 않는다.
  - 그 밖의 실패는 오류 문구(`role="alert"`)와 '다시 시도' 버튼(다시 조회)을 보여준다. 401은 아래 '로그인'의 사용 중 로그인 만료를 따른다.
  - 처음 불러오는 동안에는 불러오는 중 문구(`role="status"`)를 보여준다.
- 위쪽에 '목록으로' 링크를 둔다. 찾을 수 없음일 때만 감추고, 불러오는 중·그 밖의 실패·내용 표시에서는 보여준다. 정상 흐름에서 링크가 깜빡이지 않도록 불러오는 중에도 보여준다.
  - 링크와 찾을 수 없음의 '목록으로' 버튼은 목록 첫 화면(검색·페이지 없음)으로 간다. 보던 검색·페이지로는 브라우저 뒤로 가기로 돌아간다. 위쪽 링크는 글자 링크(`TextLink`), 카드의 버튼은 버튼 모양의 링크(`ButtonLink`)다.
  - '목록으로' 링크에는 `activeOptions={{ exact: true }}`를 준다. 주지 않으면 하위 경로인 상세 화면에서 활성이 되어 `aria-current="page"`가 붙는다.
- 수정 화면이 있으면 '목록으로' 링크 줄의 오른쪽 끝에 '수정' 버튼(primary, `ButtonLink`)을 두고, 누르면 수정 화면(예: `/hotels/$hotelId/edit`)으로 간다. 내용을 보여줄 때만 두고, 불러오는 중·오류·찾을 수 없음에는 두지 않는다. 버튼이 나타나도 아래 내용이 움직이지 않도록 줄의 높이를 버튼 높이로 둔다.
- 상세 화면의 항목 이름과 값은 `DescriptionList`(`dl`)로 보여준다.

### 등록·수정 화면

입력 검사를 제출할 때만 하는 것, 입력 오류를 입력창 아래에 보여주고 첫 번째로 틀린 입력창(화면 순서)에 초점을 옮기는 것, 입력창을 고치면 그 입력창의 오류만 지우는 것, 제출 중에 다시 제출하지 않는 것(Enter 포함)은 아래 '로그인'의 로그인 화면과 같다. 여기에는 로그인과 다른 점과 등록·수정 폼에만 있는 규칙을 적는다.

- 폼은 react-hook-form과 zod resolver로 만든다. 폼 스키마와 제출 흐름은 그 동작의 features slice의 `model`에, 폼 화면은 `ui`에 둔다(`frontend/CLAUDE.md`의 '폼').
- 관련 있는 입력창은 `fieldset`과 `legend`로 묶는다(`FormSection`). 예: 호텔 등록의 '호텔 정보'와 '마스터 계정'
- 검사와 보내는 값
  - 생성된 요청 스키마에 화면 문구를 덧붙인 폼 스키마로 검사한다. 길이·형식 규칙과 그 숫자는 생성된 스키마에서 읽고 다시 적지 않는다.
  - 문자열은 앞뒤 공백을 지운 값으로 검사하고 지운 값을 보낸다. 공백만 있는 값은 빈 값이다. 로그인은 입력한 그대로 보낸다.
  - 비밀번호만 입력한 그대로 검사하고 보낸다(`docs/domain.md`의 비밀번호 규칙).
  - 선택 항목은 지운 뒤 비었으면 null로 보낸다. 여러 줄 입력은 줄바꿈을 그대로 보낸다.
- 오류 문구는 서버와 같은 문구를 쓴다(필수 입력, 최대 길이, 형식, 비밀번호 규칙). 필드마다 오류는 하나이고 우선순위도 서버와 같다.
  - 빈 값은 필수 오류만 보여준다.
  - 형식이 있는 값(전화번호, 이메일)은 형식이 틀리면 길이와 관계없이 형식 오류, 형식이 맞는데 길면 길이 오류다.
  - 비밀번호는 규칙(길이 포함)을 어기면 비밀번호 규칙 문구 하나다.
- 입력창에 글자 수 제한(`maxLength`)을 걸지 않는다. 길면 제출할 때 오류로 알린다. 목록의 검색창과 다르다.
- 형식이 있는 칸은 입력창 아래에 짧은 안내 문구(`hint`)를 두고 입력창과 연결한다(`aria-describedby`). 오류가 나도 안내 문구는 그대로 둔다.
- 선택 항목만 이름 옆에 '(선택)'을 붙인다.
- 다른 사람의 계정을 만드는 칸(예: 마스터 아이디·처음 비밀번호)은 브라우저가 로그인한 어드민의 아이디·비밀번호를 채우지 않도록 아이디에 `autocomplete="off"`, 비밀번호에 `autocomplete="new-password"`를 준다. 비밀번호를 보여주는 버튼은 두지 않는다.
- 서버 오류
  - 400의 `fieldErrors`는 경로가 같은 입력창에 서버 문구로 보여주고 첫 번째로 틀린 입력창에 초점을 옮긴다. 중첩 객체의 경로는 점으로 잇는다(예: `master.loginId`).
  - 한 입력창의 문제인 409(예: `LOGIN_ID_DUPLICATED`)는 그 입력창의 오류로 보여주고 초점을 옮긴다.
  - 그 밖의 형식에 맞는 오류 응답(예: 409 `HOTEL_DUPLICATED`)은 서버 `message`를, 본문을 쓸 수 없는 오류는 로그인과 같은 일반 오류 문구를 제출 버튼 위 알림(`role="alert"`)으로 보여준다. 다시 제출하면 알림을 지운다.
  - 401은 아래 '로그인'의 사용 중 로그인 만료를 따른다. 그래서 등록·수정 요청은 그 동작의 변경 훅(`features/<동작>/api`의 `useMutation`)으로 한다(`MutationCache`의 `onError`를 거친다).
- 제출 버튼은 성공 뒤 이동할 때까지 로딩 상태로 둔다.
- 성공하면 목록 전체 쿼리를 무효화하고, 응답을 상세 쿼리 캐시에 넣은 뒤 그 항목의 상세 화면으로 간다. 뒤로 가기로 제출한 폼에 돌아오지 않도록 방문 기록을 바꿔(replace) 간다.
  - 캐시 갱신은 변경 훅이 entities의 캐시 규칙 함수로 한다(`useMutation`의 `onSuccess`). 화면에 묶인 이동은 제출 흐름이 `mutate`의 두 번째 인자(`onSuccess`)로 한다. 요청이 끝나기 전에 화면을 떠났으면 캐시만 갱신하고 이동하지 않기 위해서다.
- 폼 아래쪽에 제출 버튼(primary)과 '취소'(secondary)를 둔다. 제출 버튼은 등록 화면이 '등록', 수정 화면이 '저장'이다. '취소'는 버튼 모양의 링크(`ButtonLink`)로, 확인 없이 등록 화면은 목록으로, 수정 화면은 그 항목의 상세 화면으로 간다.

#### 수정 화면

위 등록·수정 규칙에 더해 아래를 따른다. 예: 호텔 수정(`/hotels/$hotelId/edit`)

- 경로 파라미터, 찾을 수 없음(잘못된 id는 요청 없이), 처음 불러오는 동안의 문구, 그 밖의 불러오기 실패(오류 문구와 '다시 시도')는 상세 화면과 같다. 위쪽 '목록으로' 링크는 두지 않는다.
- 폼은 상세 조회 값으로 채운다. 선택 항목의 null은 빈 칸으로 채운다.
  - 처음 받은 값으로 한 번만 채운다. 창 포커스 등으로 다시 조회돼도 입력 중인 값을 덮지 않는다.
  - 상세 쿼리 캐시가 이미 있으면 불러오는 중 없이 그 값으로 바로 채운다.
- 요청 본문은 생성된 수정 요청 스키마(version 포함)로 검사한다. 보내는 version은 폼을 채운 값의 version이다. 바뀐 값이 없어도 저장할 수 있다.
- 다른 사람이 먼저 수정했다는 409(예: `HOTEL_MODIFIED`)는 서버 `message`를 제출 버튼 위 알림으로 보여주고, 그 옆에 '최신 내용 불러오기'(secondary) 버튼을 둔다.
  - 누르면 캐시가 아니라 서버에서 새로 조회한다(진행 중인 조회는 취소한다). 성공하면 입력한 내용을 버리고 최신 값과 최신 version으로 폼을 다시 채우고, 입력 오류와 알림을 지운 뒤 첫 번째 입력창에 초점을 옮긴다.
  - 다시 읽는 동안에는 이 버튼을 로딩 상태로 두고 저장하지 않는다(Enter 포함).
  - 다시 읽기가 대상이 없다는 404면 찾을 수 없음을 보여준다. 그 밖의 실패는 입력한 내용을 그대로 두고, 불러오기 실패 문구와 '최신 내용 불러오기' 버튼을 알림 자리에 보여준 뒤 그 버튼에 초점을 돌린다. 다시 읽는 동안 버튼이 비활성화되어 초점을 잃기 때문이다.
- 저장 요청의 404(예: `HOTEL_NOT_FOUND`)는 그 밖의 형식에 맞는 오류처럼 서버 `message`를 알림으로 보여준다. 입력한 내용은 그대로 둔다.

## UI 컴포넌트와 공유 코드

- 두 앱이 함께 쓰는 화면 컴포넌트(버튼, 입력창, 사이드바 등)는 처음부터 `packages/ui`(`@repo/ui`)에 둔다. Tailwind 기본 class로 직접 만든다.
- 라우터를 아는 공용 UI는 각 앱의 `shared/ui`에 둔다. 버튼 모양의 링크 `ButtonLink`는 `packages/ui`가 내보내는 버튼 모양 class를 라우터 `Link`에 붙여 만들고, 글자 링크 `TextLink`는 밑줄과 초점 테두리 모양을 정해 둔다. 패키지는 라우터를 모르므로 이 둘은 패키지에 두지 않는다.
  - 둘 다 TanStack Router `createLink`로 만들어 `Link`처럼 `to`·`params`를 타입 검사한다. 넘긴 `className`은 기본 모양 뒤에 덧붙는다.
  - 지금 화면의 상위 경로로 가는 링크(예: 상세에서 목록, 수정에서 상세)는 `activeOptions={{ exact: true }}`를 넘긴다. `Link`는 경로 앞부분이 같으면 현재 위치(`aria-current="page"`)로 표시하기 때문이다.
- 그 밖의 코드는 지금은 공유하지 않는다. axios 설정, 로그인 만료 처리 등은 각 앱의 `shared`에 둔다. 실제로 중복이 생기면 그때 `packages/`로 옮긴다.

### packages/ui를 쓰는 법

- 빌드하지 않고 소스(`.tsx`, `.css`)를 그대로 내보낸다(Just-in-Time 패키지). 쓰는 앱의 Vite가 함께 컴파일하고, 앱의 `tsc`가 함께 타입 검사한다.
- 스타일은 앱의 `src/app/styles/index.css`에서 `@import "@repo/ui/styles.css";`로 가져온다.
  - 이 파일 하나가 Tailwind, Pretendard, `--font-sans`를 함께 들여온다. 앱에서 `tailwindcss`를 따로 import하지 않는다.
  - 패키지 컴포넌트의 class는 `styles.css`의 `@source`로 찾는다. 테스트 파일은 제외한다. 앱의 class는 Tailwind가 앱 폴더에서 자동으로 찾는다.
  - 앱 전용 스타일이 생기면 앱의 `index.css`에 이어서 적는다.
- 컴포넌트는 `@repo/ui/button`처럼 파일 단위로 바로 import한다. `shared/ui`에 다시 감싸지 않는다. import할 수 있는 경로는 패키지 `package.json`의 `exports`에 적은 것뿐이다.

| 경로 | 컴포넌트 | 내용 |
|---|---|---|
| `@repo/ui/button` | `Button` | variant `primary`·`secondary`·`ghost`. `loading`이면 비활성화하고 `aria-busy`를 붙인다 |
| `@repo/ui/button-class-name` | `buttonClassName`, `ButtonVariant` | 버튼 모양 class(variant별). `Button`과 앱의 `ButtonLink`가 함께 쓴다. hover 모양은 링크에도 걸리고 비활성 버튼에는 걸리지 않는다. 컴포넌트 파일과 따로 두는 것은 컴포넌트 파일이 컴포넌트만 내보내야 하기 때문이다(`react-refresh/only-export-components`) |
| `@repo/ui/text-field` | `TextField` | label·입력창·안내 문구·오류 문구를 묶는다. 선택 `hint`(안내 문구)는 입력창 아래에 보여준다. 입력창의 `aria-describedby`는 안내 문구와 오류 문구 중 있는 것을 모두 가리킨다. `error`가 있으면 `aria-invalid`를 붙인다 |
| `@repo/ui/textarea-field` | `TextareaField` | `TextField`의 여러 줄 입력창(`textarea`)판. label·`hint`·`error` 연결과 색·테두리가 `TextField`와 같다 |
| `@repo/ui/card` | `Card` | 테두리가 있는 흰색 상자. 선택 `header` 영역 |
| `@repo/ui/form-section` | `FormSection` | 관련 있는 입력창을 `fieldset`으로 묶어 `Card` 안에 보여준다. `legend`가 묶음의 이름이 된다 |
| `@repo/ui/description-list` | `DescriptionList`, `DescriptionListItem` | 항목 이름과 값의 목록(`dl`). `DescriptionListItem`은 `term`을 항목 이름(`dt`)으로, children을 값(`dd`)으로 한 줄에 보여준다. 값은 줄바꿈을 살리고, 긴 낱말은 칸 안에서 줄을 바꾼다 |
| `@repo/ui/sidebar` | `Sidebar`, `SidebarItem` | 왼쪽 메뉴. `Sidebar`는 `aria-label`이 필수인 `nav`다 |
| `@repo/ui/table` | `Table` | 열 정의(`columns`: 머리글, 칸을 그리는 함수)와 `rows`로 표를 그린다. 머리글은 `scope="col"`이다. `aria-busy`면 흐리게 보여준다. `className`은 표를 감싼 상자에 붙는다. 빈 상태는 쓰는 쪽이 표 대신 보여준다 |
| `@repo/ui/pagination` | `Pagination` | `aria-label`이 필수인 `nav` 안에 이전·다음 버튼과 현재 위치(`status`)를 둔다. `hasPrevious`·`hasNext`가 false면 그 버튼을 비활성화한다. 페이지 계산은 쓰는 쪽이 한다 |

### packages/ui에 둘 것과 앱에 둘 것

- 패키지에는 도메인 규칙과 화면 문구가 없는 표현용 컴포넌트만 둔다. 문구는 모두 props·children으로 받는다.
- 메뉴 구성, 로그인 상태처럼 앱마다 다른 화면 블록은 각 앱의 widgets에, 라우터를 아는 공용 UI는 각 앱의 `shared/ui`에 둔다.
- 패키지는 라우터(`@tanstack/react-router`)에 의존하지 않는다.
  - `SidebarItem`은 자식 링크를 꾸미기만 한다. 현재 메뉴는 링크의 `aria-current="page"`로 표시하고, 활성 스타일도 이 속성을 따른다.
  - TanStack Router의 `Link`는 활성일 때 `aria-current="page"`를 스스로 붙인다. 활성 여부는 경로를 `/` 단위(세그먼트)로 비교한다.
    - `/` 메뉴는 `/hotels` 같은 다른 경로에서 활성이 되지 않는다.
    - 상위 메뉴(`/hotels`)는 하위 경로(`/hotels/new`)에서도 활성이다.
    - 하위 경로에서 활성으로 보이면 안 되는 메뉴가 생기면 그때 그 메뉴에 `activeOptions={{ exact: true }}`를 준다.
- `className`은 위치·크기(여백, 너비, 배치)를 덧붙일 때만 쓴다. 색·테두리·안쪽 여백처럼 컴포넌트가 정한 스타일은 `className`으로 덮지 않는다. class를 합치는 도구(tailwind-merge)를 쓰지 않으므로 같은 속성의 class가 겹치면 어느 쪽이 이길지 장담할 수 없다. 다른 모양이 필요하면 패키지에 variant를 추가한다.
- 입력 오류는 Tailwind 기본 `red-600`으로 표시한다. 그 밖의 색은 `neutral` 계열을 쓴다.

### 컴포넌트 추가

1. `packages/ui/src/`에 kebab-case 파일(`<이름>.tsx`, named export)과 옆에 테스트(`<이름>.test.tsx`)를 만든다.
2. 패키지 `package.json`의 `exports`에 `"./<이름>": "./src/<이름>.tsx"`를 추가한다.
3. `frontend/`에서 `pnpm --filter @repo/ui test`, `lint`, `typecheck`로 확인한다.

## API 호출

- 자기 앱의 API만 쓴다.
- 브라우저에서 상대 경로로 호출한다. Vite 개발 서버의 proxy가 자기 앱의 API 경로만 백엔드로 넘긴다. CORS는 쓰지 않는다.
- 백엔드 주소는 각 앱의 `.env.local`에 둔 `API_BASE_URL`에서 읽는다.
  - `VITE_` 접두어를 붙이지 않는다. 브라우저 코드에는 들어가지 않고, `vite.config.ts`가 `loadEnv`로 읽어 proxy 설정에만 쓴다.
  - `.env.local`은 과제 제출용으로 커밋한다.
- 쿠키는 포트로 나뉘지 않는다. 두 앱의 세션·CSRF 쿠키가 섞이지 않도록 위 표의 접속 주소(`*.localhost`)로 연다.
- API 코드는 orval이 자기 문서 그룹(`/v3/api-docs/app-admin`, `/v3/api-docs/hotel-admin`)에서 TanStack Query 훅과 axios 함수로 생성한다. 요청은 mutator인 `shared/api/http.ts`를 거친다.
- zod 스키마도 같은 문서 그룹에서 orval로 `shared/api/generated/zod`에 생성한다. 요청 본문·응답 스키마와 오류 응답(`ErrorApiResponse`) 스키마가 들어 있다.
  - orval의 axios 클라이언트는 응답을 검증하지 않는다. 그래서 검증은 `shared/api`에서 직접 연결한다.
- `shared/api/http.ts`는 axios 인스턴스로 요청하고 응답 본문을 돌려준다. 2xx가 아닌 응답은 오류로 던지므로 React Query가 error로 받는다.
- `shared/api`는 검증을 거친 요청 함수, 요청 스키마·타입, 쿼리 키 함수만 내보낸다. 생성 코드(orval이 만든 TanStack Query 훅 포함)와 `http`는 내보내지 않는다. `shared/api`는 TanStack Query를 쓰지 않는다.
  - 요청 본문과 쿼리·경로 파라미터를 스키마로 검증한 뒤 생성 함수를 부르고, 받은 응답을 스키마로 검증한 뒤 돌려준다.
  - 보내는 값은 검증을 통과한 값이다. 스키마에 없는 필드는 빠지고, 빠진 파라미터에는 스키마의 기본값이 채워진다.
  - 결과(`data`)를 돌려주는 API는 `data`만 돌려준다. 성공 응답의 `success`가 false이거나 `data`가 null이면 응답 검증 실패로 본다.
  - 조회 요청 함수는 `signal`을 받아 생성 함수에 넘긴다. 쿼리가 취소되면 요청도 취소된다.
  - 쿼리 키 함수는 생성된 `get...QueryKey`로 만든다. 키는 요청 경로를 따르는 배열일 뿐이라 TanStack Query 없이 만들 수 있다.
- 조회 훅, 쿼리 키·조회 설정, 캐시 규칙 함수는 `entities/<도메인>/api`에, 변경 훅은 `features/<동작>/api`에 둔다(`frontend/CLAUDE.md`의 '서버 상태').
  - 조회 훅의 `queryFn`은 `shared/api`의 요청 함수를 부른다. 파라미터 검증이 요청 함수 안에 있으므로 검증 실패는 그 쿼리의 오류가 된다.
  - 쿼리 하나는 그 쿼리의 키로, 여러 쿼리(예: 검색어·페이지가 다른 목록 전체)는 파라미터 없이 만든 키로 가리킨다. 이 키를 쓰는 캐시 갱신은 entities의 캐시 규칙 함수 안에서만 한다.
- `shared/api` 밖에서는 `shared/api/generated`를 import하지 않는다. ESLint `no-restricted-imports`로 막는다. Steiger는 다른 레이어의 import만 막고 재수출과 같은 shared 레이어의 import는 막지 않기 때문이다.
- 검증에 실패하면 전용 오류를 던진다. AxiosError와 구분된다.
  - 요청 검증 실패는 `RequestValidationError`다. 요청을 보내지 않는다.
  - 응답 검증 실패는 `ResponseValidationError`다. 받은 값을 쓰지 않는다.
  - 응답에 스키마에 없는 필드가 더 있으면 오류로 보지 않고 버린다. 빠진 필드와 타입이 틀린 필드만 오류다. 서버가 응답 필드를 추가해도 codegen 전까지 화면이 깨지지 않게 하기 위해서다.
  - 두 오류 모두 zod issue를 담는다. 개발 환경에서만 콘솔에 틀린 필드의 경로와 오류 코드를 남기고, 값은 남기지 않는다.
- 서버의 오류 정보(`code`, `message`, `fieldErrors`)는 `getApiError(error)`로 읽는다. 오류 응답 본문이 형식과 다르면 응답 검증 실패처럼 콘솔에 남기고 아무것도 돌려주지 않는다.
- QueryClient는 쿼리 재시도 규칙과 오류 처리기(`QueryCache`·`MutationCache`의 `onError`, 아래 '로그인' 참고)만 정하고 나머지는 TanStack Query 기본값을 쓴다. SPA라 서버 렌더링용 설정을 두지 않는다.
  - 쿼리는 검증 오류와 4xx 응답이면 재시도하지 않는다. 그 밖(5xx, 네트워크 오류)은 기본값대로 세 번까지 재시도한다. 단, 로그인 확인과 로그인 화면 진입의 내 정보 조회는 재시도하지 않는다(아래 '로그인' 참고).
  - 뮤테이션은 기본값대로 재시도하지 않는다.
- 개발 도구는 React Query Devtools만 둔다.

## 로그인

- 로그인 흐름과 CSRF는 `docs/api-convention.md`의 인증 절을 따른다.
- axios는 같은 출처 요청에서 `XSRF-TOKEN` 쿠키를 읽어 `X-XSRF-TOKEN` 헤더로 보낸다. 이 기본 동작을 그대로 쓴다.
- 로그인 API의 401(`INVALID_CREDENTIALS`)과 다른 API의 401(`UNAUTHORIZED`)을 구분해서 처리한다.
- 로그인 상태는 내 정보 쿼리의 캐시로 판단한다. 내 정보 조회와 로그인 상태 캐시 규칙(넣기, 지우기, 비우기)은 `entities/account`에 두고, 로그인·로그아웃은 각 동작의 features slice(`auth-login`, `auth-logout`)에 둔다. 라우터 context로 QueryClient를 넘겨 `beforeLoad`에서 쓴다.
  - 내 정보·로그인 API는 계정 정보(`data`)만 돌려준다. 성공 응답의 `success`가 false이거나 `data`가 null이면 응답 검증 실패로 본다.
- 로그인 확인과 로그인 화면 진입은 내 정보를 캐시에서 읽고 없을 때만 조회한다(`queryClient.query`에 `staleTime: "static"`). 재시도하지 않으므로(`retry: false`) 백엔드가 응답하지 않으면 바로 실패한다.
- 로그인 확인(`_authenticated`의 `beforeLoad`)
  - 401 `UNAUTHORIZED`면 지금 경로(쿼리 포함)를 `redirect`에 담아 `/login`으로 보낸다.
  - 그 밖의 오류는 루트 라우트의 오류 화면을 보여준다. '다시 시도'는 `router.invalidate()`로 다시 불러온다.
- 로그인 화면(`/login`)
  - `redirect`는 앱 안의 경로만 받는다. `/`로 시작하고, `//`·`/\`처럼 다른 호스트로 해석되지 않고, `/login`이 아닌 값이다. 그 밖의 값과 빈 값은 `/`로 바꾸고, `/`는 URL에 남기지 않는다.
  - `beforeLoad`에서 내 정보를 조회한다. 성공하면 `redirect`로 보내고, 실패하면(401 등) 로그인 화면을 보여준다. 이 조회의 401 응답으로 로그인 전에 `XSRF-TOKEN` 쿠키를 받는다.
  - 입력 검사는 제출할 때만 한다. 요청 스키마에 화면 문구를 덧붙인 폼 스키마로 검사하고, 공백만 있는 값도 비어 있는 것으로 본다. 보내는 값은 입력한 그대로다.
  - 입력 오류는 입력창 아래에 보여주고 첫 번째로 틀린 입력창에 초점을 옮긴다. 입력창을 고치면 그 입력창의 오류만 지운다.
  - 제출 중에는 버튼을 로딩 상태로 두고 다시 제출하지 않는다.
  - 400의 `fieldErrors`(아이디·비밀번호)는 입력창 오류로 보여준다. 그 밖의 형식에 맞는 오류 응답(401 `INVALID_CREDENTIALS` 등)은 서버 `message`를, 본문을 쓸 수 없는 오류(네트워크 오류, 검증 오류, 형식이 다른 오류 응답)는 일반 오류 문구를 로그인 버튼 위 알림(`role="alert"`)으로 보여준다.
  - 성공하면 쿼리 캐시를 모두 비운 뒤 받은 계정 정보를 내 정보 쿼리 캐시에 넣고 `redirect`로 이동한다.
- 사용 중 로그인 만료
  - 쿼리·뮤테이션이 401 `UNAUTHORIZED`로 실패하면 내 정보 캐시를 지우고 지금 위치를 `redirect`에 담아 `/login`으로 보낸다(`QueryCache`·`MutationCache`의 `onError`).
  - 데이터가 있는 내 정보 쿼리(위쪽 영역의 창 포커스 재조회)도 같다.
  - 데이터가 없는 내 정보 쿼리(로그인 확인과 로그인 화면 진입의 조회)의 오류는 각 `beforeLoad`가 처리하므로 무시한다. 이미 `/login`이면 아무것도 하지 않는다.
- 위쪽 영역의 계정 이름은 내 정보 쿼리에서 읽는다. 처음 그릴 때는 로그인 확인이 불러온 값을 쓰고 다시 조회하지 않는다(`refetchOnMount: false`). 창에 다시 초점이 오면 기본값대로 다시 조회해 세션을 확인한다.
- 로그아웃(위쪽 영역의 계정 이름 옆 버튼)
  - 성공하거나 401이면 쿼리 캐시를 모두 비우고 `/login`으로 이동한다.
  - 그 밖의 실패는 화면을 그대로 두고 버튼 옆에 오류 문구(`role="alert"`)를 보여준다.
  - 로그아웃은 뮤테이션 캐시를 거치지 않고 직접 호출한다. 401을 로그아웃이 처리하므로 사용 중 만료 처리와 함께 이동하지 않는다.
- hotel-admin의 로그인은 호텔 계정(백엔드)이 생긴 뒤 연결한다.

## foundation

게스트 앱과 같은 수준으로 갖춘다.

- ESLint + Steiger (`pnpm lint`)
- 공유 컴포넌트 패키지 `packages/ui` 연결
- 사이드바 레이아웃과 로그인 화면 뼈대
- TanStack Query Provider
- `.env.local`, Vite proxy, `*.localhost` 접속
- orval codegen
- Vitest + React Testing Library
