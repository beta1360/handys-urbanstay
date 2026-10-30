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
- 스타일: Tailwind CSS 기본값. 게스트 앱과 같은 규칙으로, 별도 디자인 토큰을 두지 않는다. UI 라이브러리 없이 화면 컴포넌트를 직접 만든다.
- 테스트: Vitest + React Testing Library (`frontend/CLAUDE.md`의 테스트 규칙을 따른다)
  - 라우터가 필요한 컴포넌트는 테스트 파일 안에서 memory history로 만든 라우터에 넣어 테스트한다. 앱의 라우트 트리는 가져오지 않는다. widgets·pages가 app 레이어를 import하게 되어 FSD 규칙에 어긋나기 때문이다.
- 앱은 TanStack Router 공식 CLI(`@tanstack/cli create --router-only`)로 만들고, 생성된 예제 파일은 걷어낸다.

## 구조

- `src/` 아래를 FSD로 구성한다. 레이어 규칙은 `frontend/CLAUDE.md`를 따른다.
- app·pages 레이어 폴더 이름은 `app`, `pages`를 그대로 쓴다.
- 라우트 파일은 app 레이어의 `routes` 세그먼트(`src/app/routes`)에 두고, FSD의 pages 레이어를 가져와 연결만 한다. 라우트 파일도 app 레이어 안에 있으므로 Steiger가 import 규칙을 검사한다.
- 라우터 생성 코드와 생성된 라우트 트리(`route-tree.gen.ts`)는 `src/app/router/`에, 진입점(`main.tsx`)은 `src/app/entrypoint/`에 둔다.
- 라우트 생성 설정(`routesDirectory`, `generatedRouteTree` 등)은 앱의 `tsr.config.json`에만 둔다. Vite 플러그인과 `tsr generate`가 이 파일을 함께 읽는다.
- 생성된 라우트 트리는 직접 수정하지 않고 커밋한다.
- 루트 라우트(`__root.tsx`)는 `<HeadContent />`와 `<Outlet />`만 그린다. 오류 화면(`errorComponent`)은 `<HeadContent />`와 pages의 오류 화면만 그린다. 브라우저 탭 제목은 루트 라우트의 `head`에서 `APP_INFO.name`(`shared/config`)으로 정하고, `index.html`에는 `<title>`을 두지 않는다.
- 로그인이 필요한 화면은 경로를 만들지 않는 레이아웃 라우트 `_authenticated` 아래에 두고, 로그인 화면(`/login`)은 그 밖에 둔다. 로그인 확인은 `_authenticated`의 `beforeLoad`에서 한다.
- 위쪽에 보여줄 현재 화면 제목은 각 화면 라우트의 `staticData.title`(선택)에 둔다. 타입은 `src/app/router/router.ts`에서 `StaticDataRouteOption`을 모듈 확장해 정한다.

## 화면

- 데스크톱 화면을 기준으로 만든다.
- 기본 틀은 왼쪽 사이드바(메뉴), 위쪽(현재 위치, 계정·로그아웃), 가운데(내용)로 나눈다. 로그인 화면은 이 틀 밖에 둔다.
  - 기본 틀은 widgets에 두고, `_authenticated` 레이아웃 라우트가 연결한다.
- 라이트 테마만 지원하고, 폰트는 Pretendard를 쓴다.

## UI 컴포넌트와 공유 코드

- 두 앱이 함께 쓰는 화면 컴포넌트(버튼, 입력창, 사이드바 등)는 처음부터 `packages/ui`(`@repo/ui`)에 둔다. Tailwind 기본 class로 직접 만든다.
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
| `@repo/ui/text-field` | `TextField` | label·입력창·오류 문구를 묶는다. `error`가 있으면 입력창에 `aria-invalid`와 오류 문구를 가리키는 `aria-describedby`를 붙인다 |
| `@repo/ui/card` | `Card` | 테두리가 있는 흰색 상자. 선택 `header` 영역 |
| `@repo/ui/sidebar` | `Sidebar`, `SidebarItem` | 왼쪽 메뉴. `Sidebar`는 `aria-label`이 필수인 `nav`다 |
| `@repo/ui/table` | `Table` | 열 정의(`columns`: 머리글, 칸을 그리는 함수)와 `rows`로 표를 그린다. 머리글은 `scope="col"`이다. `aria-busy`면 흐리게 보여준다. `className`은 표를 감싼 상자에 붙는다. 빈 상태는 쓰는 쪽이 표 대신 보여준다 |
| `@repo/ui/pagination` | `Pagination` | `aria-label`이 필수인 `nav` 안에 이전·다음 버튼과 현재 위치(`status`)를 둔다. `hasPrevious`·`hasNext`가 false면 그 버튼을 비활성화한다. 페이지 계산은 쓰는 쪽이 한다 |

### packages/ui에 둘 것과 앱에 둘 것

- 패키지에는 도메인 규칙과 화면 문구가 없는 표현용 컴포넌트만 둔다. 문구는 모두 props·children으로 받는다.
- 메뉴 구성, 라우터 링크, 로그인 상태처럼 앱마다 다른 것은 각 앱의 widgets에 둔다.
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
- `shared/api`는 검증을 거친 것만 내보낸다. 생성 코드와 `http`는 내보내지 않는다.
  - 요청 본문과 쿼리·경로 파라미터를 스키마로 검증한 뒤 생성 함수를 부르고, 받은 응답을 스키마로 검증한 뒤 돌려준다.
  - 보내는 값은 검증을 통과한 값이다. 스키마에 없는 필드는 빠지고, 빠진 파라미터에는 스키마의 기본값이 채워진다.
  - 결과(`data`)를 돌려주는 API는 `data`만 돌려준다. 성공 응답의 `success`가 false이거나 `data`가 null이면 응답 검증 실패로 본다.
  - 조회는 TanStack Query 옵션(`queryKey`, `queryFn`)으로, 변경은 함수로 내보낸다.
    - 쿼리 키는 생성된 `get...QueryKey`로 만든다.
    - 조회 파라미터는 `queryFn` 안에서 검증한다. 검증 실패는 그 쿼리의 오류가 된다.
    - `queryFn`이 받은 `signal`을 생성 함수에 넘긴다. 쿼리가 취소되면 요청도 취소된다.
  - 캐시를 갱신할 때 쿼리 하나는 쿼리 옵션의 `queryKey`로 가리킨다. 여러 쿼리를 한 번에 가리키는 키(예: 검색어·페이지가 다른 목록 전체)가 필요하면 파라미터 없이 만든 생성 키를 따로 내보낸다.
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
- 로그인 상태는 내 정보 쿼리(`meQueryOptions`)의 캐시로 판단한다. 라우터 context로 QueryClient를 넘겨 `beforeLoad`에서 쓴다.
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
