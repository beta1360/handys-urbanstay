# 게스트 앱(web) 작업 지침

게스트가 쓰는 앱(Next.js). 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를 따른다.

## 참고 문서

- Next.js 에이전트 규칙: @AGENTS.md

## 화면

- 어반스테이 앱처럼 앱 형태의 UI로 만든다. 데스크톱에서도 모바일 폭으로 고정된 가운데 컬럼으로 보여준다.
- 폰트는 Pretendard를 쓴다.
- UI 라이브러리 없이 Tailwind 기본값으로 만든다. 앱 안에서 함께 쓰는 화면 조각(버튼, 링크, 입력창, 불러오는 중 문구, 토스트)은 `shared/ui`에 둔다. 어드민 전용 패키지(`@repo/ui`, `@repo/admin-kit`)는 쓰지 않는다.

### 화면 목록

| 경로 | 화면 |
|---|---|
| `/` | 호텔 목록. 고르면 그 호텔의 예약 화면으로 간다 |
| `/hotels/[hotelId]` | 호텔 이름, 날짜·인원 → 객실 유형 선택(1박 요금) → 예약 내용(최종 금액) → 예약(회원만) → 같은 화면의 완료 화면 |
| `/login` | 로그인(이메일, 비밀번호). 성공하면 `?redirect`로 간다 |
| `/signup` | 회원가입(이메일, 비밀번호, 이름, 전화번호). 가입하면 바로 로그인되고 `?redirect`로 간다 |
| `/me/stays` | 내 이용. 로그인 필요. 지금·앞으로의 이용과 지난 이용 |

- 예약 조건(체크인·체크아웃 날짜, 인원)은 URL search(`?checkInDate&checkOutDate&guestCount`)에 둔다. 공유·새로고침·뒤로 가기로 같은 조건을 다시 볼 수 있게 하기 위해서다.
  - 날짜·인원 폼을 제출하면 `window.history.pushState`로 search만 바꾼다. 서버 컴포넌트를 다시 그리지 않고 `useSearchParams`가 따라간다.
  - URL의 조건이 검사 규칙(아래 '폼')을 어기면 조건이 없는 것으로 보고 빈 폼을 보여준다.
  - 조건이 바뀌면 고른 객실 유형과 폼 오류를 지운다.
- 완료 화면은 화면 상태라 새로고침하면 사라지고 예약 화면으로 돌아간다. 지난 예약은 '내 이용'에서 본다.
- 금액은 원 단위에 천 단위 쉼표로 보여준다(예: 180,000원, `shared/lib/money`의 `formatWon`).

### 로그인 상태

- 로그인 상태는 브라우저에서 내 정보(`GET /auth/me`)로 확인한다(`entities/member`). 401 `UNAUTHORIZED`는 오류가 아니라 비회원(`null`)으로 캐시하고, 그 밖의 실패도 비회원으로 본다. 상태는 `checking | guest | member` 하나의 값이다.
- 로그인·회원가입이 성공하면 받은 회원을 그 캐시에 넣고 `redirect`로 `router.replace`한다. 로그아웃은 캐시를 `null`로 바꾸고 `router.refresh()`로 서버 컴포넌트를 다시 그린다(로그인이 필요한 화면은 서버가 로그인으로 보낸다). 로그아웃의 401은 이미 끊긴 세션이라 성공으로 본다.
- `redirect`는 `/`로 시작하는 앱 안의 경로만 받는다. 비었거나, `//`로 시작하거나, 로그인·회원가입 경로면 `/`로 간다(`shared/lib/login-redirect`).
- 헤더: 확인 중에는 비워 두고, 비회원은 지금 주소로 돌아오는 로그인·회원가입 링크, 회원은 이름·'내 이용'·로그아웃을 보여준다. 지금 주소를 `useSearchParams`로 읽어 `<Suspense>` 안에 둔다.
- 로그인·회원가입·로그아웃이 성공하면 서버 `message`를 토스트로 띄우고 다음 화면으로 간다. 로그아웃이 401로 끝나면 받은 문구가 없으므로 띄우지 않는다.
- 로그아웃이 실패하면 서버 오류 문구(없으면 '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')를 토스트로 띄우고 회원 메뉴를 그대로 둔다.

### 토스트

- 로그인·회원가입·로그아웃의 결과 문구만 토스트로 보여준다. 폼 오류는 토스트가 아니라 폼 안에 둔다(아래 '폼').
- 한 번에 하나만 보여준다. 새 문구가 오면 바로 바꾸고, 마지막 문구에서 3초 뒤 사라진다. 닫기 버튼은 두지 않는다.
- 가운데 컬럼 아래쪽에 띄운다. 영역은 늘 그려 두는 `role="status"`라 문구가 바뀌면 화면 낭독기가 읽는다.
- 표현은 `shared/ui`의 `ToastRegion`·`ToastMessage`, 상태와 `showToast`는 `shared/lib/toast`, 영역은 `_app/toast`의 `ToastProvider`가 맡는다. 화면을 옮겨도 남도록 `ToastProvider`는 레이아웃 바깥(`AppProviders`)에 둔다.

### 폼

- 입력 검사는 제출할 때만 한다. 틀린 칸 아래에 오류를 보여주고 첫 번째로 틀린 칸(화면 순서)에 초점을 옮기며, 칸을 고치면 그 칸의 오류만 지운다. 제출 중에는 다시 제출하지 않는다(Enter 포함).
- 오류 문구는 서버와 같은 문구를 쓴다(필수 입력, 최대 길이, 형식, 숫자 범위, 날짜 규칙). 길이·형식 규칙과 그 숫자는 생성된 스키마에서 읽는다.
- 날짜는 `type="date"`, 인원은 글자 입력창에 `inputMode="numeric"`을 준다(숫자 입력창은 잘못 친 값을 빈 값으로 돌려준다). 형식이 있는 칸(전화번호, 이메일)은 칸 아래에 안내 문구를 두고 칸과 연결한다.
- 서버 오류
  - 400의 `fieldErrors`는 경로가 같은 칸(예: `phone`)에 서버 문구로 보여주고 초점을 옮긴다. 회원가입의 409 `MEMBER_EMAIL_DUPLICATED`는 이메일 칸에 보여준다.
  - 그 밖의 형식에 맞는 오류는 서버 `message`를, 본문을 쓸 수 없는 오류는 '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'를 폼 안 제출 버튼 위의 알림(`role="alert"`, `errors.root.server`)으로 보여준다. 토스트는 쓰지 않는다.
- 예약
  - 유형마다 최대 인원, 1박 요금, 남은 객실 수를 보여준다. 남은 객실이 없는 유형은 '예약불가'로 보여주고 고를 수 없다.
  - 유형을 고르면 예약 내용(객실 유형, 기간·박 수, 인원, 1박 요금, 최종 금액)이 나타난다. 최종 금액은 화면 표시용으로 1박 요금 × 박 수로 계산하고(`entities/stay`의 `estimateTotalAmount`), 완료 화면은 서버가 저장한 금액을 쓴다.
  - 이용객 정보는 입력하지 않는다(서버가 회원 정보를 쓴다). 본문은 `{ hotelId, roomTypeId, checkInDate, checkOutDate, guestCount }`다.
  - 로그인하지 않았으면 예약 버튼 대신 지금 주소로 돌아오는 '로그인하고 예약하기' 링크를 보여준다. 로그인 확인 중에는 예약 버튼을 불러오는 중으로 둔다.
  - 예약이 401 `UNAUTHORIZED`를 받으면(세션 끊김) 회원 캐시를 비워 같은 로그인 링크로 바꾸고, 서버 문구를 폼 알림으로 보여준다.
  - 409 `ROOM_TYPE_UNAVAILABLE`·`STAY_PERIOD_OVERLAPPED`, 404 `ROOM_TYPE_NOT_FOUND`는 폼 알림으로 보여주고 객실 유형 목록을 다시 조회한다. 409 `GUEST_LINKED_TO_OTHER_MEMBER`도 폼 알림이다.
  - 성공하면 같은 화면에서 완료 화면(서버 문구, 호텔, 객실 유형, 기간, 인원, 이용객 이름, 최종 금액)으로 바꾸고 제목에 초점을 옮긴다. 배정된 객실(호수)은 보여주지 않는다.
- 내 이용
  - 체크아웃 날짜가 오늘(한국 시간)보다 뒤면 '지금·앞으로의 이용', 오늘이거나 지났으면 '지난 이용'이다. 구역 안의 순서는 서버 순서(체크인 늦은 순)를 따른다.
  - 항목마다 호텔, 객실 유형, 기간, 인원, 최종 금액, 취소 여부('취소됨')를 보여준다. 이용이 하나도 없으면 '호텔 목록' 링크를 보여준다.

## 구조

- Next.js 라우팅은 `app/`에, FSD 레이어는 `src/`에 둔다.
- 레이어·세그먼트·서버 상태·폼·화면 이동의 배치는 `frontend/CLAUDE.md`의 '구조 (FSD)'를 따른다.
- `app/`의 라우트 파일은 `src/_pages`의 페이지를 가져와 내보내기만 한다. `not-found.tsx`·`error.tsx`도 같다.
- Next.js 라우트 파일(page, layout 등)만 default export를 쓴다.
- Steiger의 `fsd/typo-in-layer-name`은 `_app`·`_pages`에서만 끈다. 접두어가 붙은 레이어를 오타로 잘못 잡는 Steiger 버그(feature-sliced/steiger#282) 때문이며, 수정되면 예외를 없앤다.

```
apps/web/
├─ app/                    # Next.js 라우팅 (page, not-found, error)
└─ src/
   ├─ _app/                # QueryClient, 토스트 영역, Provider
   ├─ _pages/              # hotel-list, hotel-booking, login, signup, my-stays, not-found, error
   ├─ widgets/             # app-layout (헤더 로그인 상태), hotel-booking (서버에서 호텔을 찾아 예약 화면 조립), my-stays (쿠키를 넘겨 내 이용 조회)
   ├─ features/            # stay-search (날짜·인원 → URL), stay-reserve (유형 선택·금액·예약·완료), auth-login, auth-signup, auth-logout
   ├─ entities/            # hotel (목록, 호텔 찾기), room-type (유형 조회, 예약불가 표시), stay (조건 검사·URL, 기간·금액, 내 이용 표시), member (로그인 상태)
   └─ shared/              # api, config, lib (form, date, path-param, login-redirect, current-href, money, toast), ui
```

### 서버 컴포넌트의 조회

- 모양은 클라이언트의 연결 컴포넌트·model 훅·조회 훅과 같은 3계층으로 둔다.
  - `entities/<도메인>/api`: 조회 함수(`get*`, `find*`)와 조회 설정(예: `size`). `shared/api`의 검증된 요청 함수를 부른다.
  - `<slice>/model`: `load*` 함수. 경로 파라미터를 검사하고(숫자만, 1 이상, 생성된 스키마 통과), 대상이 없으면(잘못된 id, 404, 목록에 없음) `notFound()`를 부른다. 그 밖의 실패는 그대로 던진다. 화면 상태가 여럿이면 하나의 상태 값(union)으로 돌려준다.
  - `<slice>/ui`: async 연결 컴포넌트. `load*` 하나를 부르고 표현 컴포넌트를 고르기만 한다.
- `_pages`는 `<Suspense>` 안에서 `params.then(...)`으로 경로 파라미터를 읽어 연결 컴포넌트를 배치만 한다. Cache Components에서 `params`와 캐시하지 않는 조회는 `<Suspense>` 안에 있어야 하기 때문이다.
- `'use cache'`는 쓰지 않는다. 호텔·객실 정보가 운영 앱에서 바뀌므로 항상 최신으로 조회한다.
- 목록은 첫 페이지(`size` 100)만 쓴다. 객실 유형 화면의 호텔도 이 목록에서 찾고, 없으면 찾을 수 없음이다. 내 이용도 첫 페이지(`size` 100)만 쓴다.
- 로그인 정보가 필요한 서버 조회(내 이용)는 들어온 요청의 쿠키를 백엔드에 넘긴다.
  - `widgets/my-stays/model`의 `load*`가 `cookies()`(`next/headers`)를 읽어 문자열로 `entities/stay/api`의 `getMyStays(cookie)`에 넘기고, `shared/api`의 요청 함수가 `cookie` 헤더로 보낸다. `next/headers`는 widgets의 `model`에서만 쓴다.
  - 401 `UNAUTHORIZED`면 `redirect`로 `/login?redirect=<그 화면>`에 보낸다. `<Suspense>` 안에서 스트리밍 중이라 HTTP 307이 아니라 화면 안의 이동(meta refresh)으로 간다.
- 서버 컴포넌트가 가져오는 slice의 `index.ts`가 클라이언트 훅(`useSearchParams`, `usePathname` 등)을 쓰는 파일을 함께 내보내면 묶음 전체가 서버 그래프에 들어가 오류가 난다. 그런 훅 파일에는 `"use client"`를 붙이거나(`entities/stay`의 `useStayCriteria`), 서버가 쓰지 않는 세그먼트로 나눈다(`shared/lib/current-href`).

### 브라우저의 조회와 변경

- 사용자 입력에 따른 조회(객실 유형), 로그인 상태(내 정보)와 변경(예약, 로그인·회원가입·로그아웃)만 브라우저에서 한다. `frontend/CLAUDE.md`의 '서버 상태 (TanStack Query)'를 따른다.
- 객실 유형은 남은 객실 수가 자주 바뀌어 `staleTime` 0으로 조회하고, 예약이 성공하거나 객실이 없어졌다는 오류를 받으면 그 호텔의 유형 목록을 무효화한다.
- 요청 검증·응답 검증 실패와 4xx는 재시도하지 않는다(`_app/query`).

## API 호출

- 앱 전용 API(`/api/v1/app/**`)만 쓴다.
- API 코드는 orval이 TanStack Query 훅·fetch 함수와 zod 스키마로 생성한다. 요청은 mutator인 `shared/api/http.ts`를 거친다. orval이 만든 TanStack Query 훅은 쓰지 않는다.
- 생성 코드(`shared/api/generated`)는 `shared/api` 밖에서 가져오지 않는다(ESLint). 검증된 요청 함수와 스키마·타입을 `@/shared/api`에서 가져온다.
- 백엔드 주소는 `.env.local`의 `API_BASE_URL`에서 읽는다. 서버 전용 변수라 `NEXT_PUBLIC_`을 붙이지 않는다. `.env.local`은 과제 제출용으로 커밋한다.
- 서버에서는 `API_BASE_URL`을 붙인 절대 주소로, 브라우저에서는 상대 경로로 요청해 rewrites를 거친다.
- 2xx가 아닌 응답
  - fetch는 2xx가 아니어도 던지지 않으므로 `shared/api`의 요청 함수가 상태 코드를 보고, 본문을 오류 응답 스키마로 검증해 `ApiResponseError`(상태 코드, 서버 오류 정보)를 던진다. 본문이 오류 형식이 아니면 서버 오류 정보 없이 던진다.
  - 오류 정보는 `getApiError(error)`로 읽고, 코드는 `API_ERROR_CODES`와 비교한다.
  - 서버 컴포넌트: 대상이 없으면 `app/not-found.tsx`(찾을 수 없음, '호텔 목록' 링크), 그 밖의 실패는 `app/error.tsx`(일반 오류 문구, '다시 시도'로 다시 그리기)를 보여준다.
  - 브라우저: 조회는 '불러오지 못함'과 '다시 시도', 변경은 위 '폼'의 서버 오류 규칙을 따른다.

## 명령어 (`frontend/`에서 실행)

- 개발 서버: `pnpm --filter web dev` (`http://localhost:3000`)
- 검사: `pnpm turbo run lint test --filter=web`, 빌드(타입 검사 포함): `pnpm --filter web build`. 빌드 없이 타입만 볼 때는 `pnpm --filter web exec tsc --noEmit`
- API 코드 생성: `pnpm --filter web codegen` (백엔드가 8080에서 실행 중이어야 한다)
