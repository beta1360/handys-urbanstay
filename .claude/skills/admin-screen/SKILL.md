---
name: admin-screen
description: app-admin·hotel-admin에 목록·상세·등록·수정 화면을 추가하는 순서(shared/api → entities → features → widgets → pages → routes → 테스트 → 문서 → 구조 점검). "어드민 화면 추가", "목록·상세·등록·수정", "admin screen", "CRUD 화면", "hotel-admin 화면", "app-admin 화면" 요청에 쓴다.
---

# 어드민 화면 추가

화면 동작의 원본은 `frontend/docs/admin-app.md`의 '목록 화면'·'상세 화면'·'등록·수정 화면'·'수정 화면'·'토스트'·'API 호출'이고, 배치는 `frontend/CLAUDE.md`의 '구조 (FSD)'와 각 앱 `CLAUDE.md`의 '구조'다. 이 스킬은 순서와 실제 예시 파일만 모은다. 경로는 `frontend/apps/<앱>/src` 기준이고, 예시는 hotel-admin 객실 유형(`room-type`)이다.

## 0. 시작 전

- 도메인 규칙·권한·용어는 `domain-rules` 스킬, 원본은 `docs/domain.md`. 문서에 없는 동작(문구, 열, 권한, 오류별 처리)은 정하지 말고 묻는다.
- `docs/frontend-flow.md`의 1~5단계(완료 기준, 정상·예외 흐름, 데이터 계약, 상태, 책임)를 짧게 정리한다.
- 앱 `CLAUDE.md`에 같은 종류의 화면 규칙(예: hotel-admin '객실 유형 관리')이 있으면 그 틀을 따른다.
- 새 API면 먼저 `api-codegen` 스킬로 생성 코드를 만든다.

## 1. shared/api (데이터: 검증과 쿼리 키)

예: `shared/api/room-type.ts`, `shared/api/api-error.ts`, `shared/api/index.ts`

- `./generated`의 생성 함수와 `./generated/zod`의 생성 스키마로 요청 함수를 만든다. 스키마를 손으로 쓰지 않는다(`docs/api-convention.md` '검증').
- 요청 본문·파라미터는 `@repo/admin-kit/api`의 `parseRequest`로, 응답은 `parseResponseBody`로 검증한다. 성공 응답 스키마는 생성 스키마를 `.extend`해 `success: z.literal(true)`, `data`(null 아님), 변경 API는 `message: z.string()`을 더한다.
- 조회는 `data`만, 변경은 `{ data, message }`를 돌려준다. 조회 함수는 `signal`을 받아 넘긴다.
- 쿼리 키 함수는 생성된 `get...QueryKey`로 만든다.
- 도메인 오류 코드는 `api-error.ts`의 `API_ERROR_CODES`에 더한다.
- `index.ts`로 요청 함수, 요청 스키마·타입, 쿼리 키만 내보낸다. 생성 코드와 `http`는 내보내지 않는다. TanStack Query는 쓰지 않는다.
- 규칙 전체: `frontend/docs/admin-app.md` 'API 호출'

## 2. entities/<도메인> (조회·캐시·도메인 표시)

예: `entities/room-type/`

- `api/`: `queryOptions`로 조회 설정, `use...Query`, 새로 조회(`refetch...`·`useRefetch...`, 진행 중 조회 취소 후 `staleTime: 0`), 캐시 규칙(`cacheSaved...`: 목록 무효화 + 상세 캐시에 넣기). 같은 데이터의 캐시 규칙은 여기에만 둔다.
- `config/messages.ts`: 항목 이름(`..._FIELD_LABELS`), 불러오기·찾을 수 없음 문구. 여러 화면 공통 문구는 `shared/config`.
- `lib/`: 검색어·거르기 값·페이지 검사 같은 순수 함수.
- `model/`: 경로 파라미터 `parse...PathParams`·`stringify...PathParams`(규칙: `admin-app.md` '상세 화면'), 하나 조회 훅(`useRoomType`: `loading | failed | notFound | ready` 하나의 값), 등록·수정이 함께 쓰는 폼 스키마 조각(`create...InfoFormShape`, `..._INFO_FIELDS`).
- `ui/`: 등록·수정이 함께 쓰는 입력 칸(칸마다 입력창 props), 상세 내용(`DescriptionList`), 불러오는 중·실패·찾을 수 없음 카드.
- `index.ts`에 public API를 모은다.

## 3. features/<동작> (등록·수정·검색 등 동작 하나씩)

예: `features/room-type-create/`, `features/room-type-update/`

- `api/use-...ts`: `useMutation`으로 변경 훅. `onSuccess`에서 entities의 캐시 규칙 함수를 부른다. 캐시 키를 직접 다루지 않는다.
- `model/`: 폼 스키마(생성 요청 스키마 + 화면 문구)와 제출 훅. 예: `use-room-type-create-form.ts`
  - `SUBMIT_ONLY_VALIDATION`, `zodResolver`, `toFieldPropsMap`(`@repo/admin-kit/form`)
  - 제출 중: `formState.isSubmitting || formState.isSubmitSuccessful`. 제출 중 다시 제출하지 않는다.
  - 성공: `mutate`의 두 번째 인자 `onSuccess`에서 `showToast({ type: "success", message })`(서버 문구 그대로) 뒤 상세로 `navigate({ ..., replace: true })`
  - 실패: `showSubmitError(getApiError(error), { fields, setError, fieldOfCode, onAlert })`. 400 `fieldErrors`는 칸 오류, 한 칸의 409는 `fieldOfCode`로 그 칸에, 그 밖은 `onAlert`로 `useFormErrorToast`의 오류 토스트. 다시 제출하면 그 토스트를 지운다.
  - 수정 충돌 409(`..._MODIFIED`): 제출 버튼 위 알림과 '최신 내용 불러오기'(`useRefetch...`로 서버에서 다시 읽어 폼을 다시 채우고 첫 칸에 초점). 저장 요청의 404는 오류 토스트. 규칙: `admin-app.md` '수정 화면'
- `ui/`: 연결 컴포넌트(`model` 훅 하나를 불러 넘기기만)와 표현 컴포넌트(props만). 수정은 불러오기 상태를 고르는 컴포넌트(`RoomTypeUpdate`)를 더한다.
- 목록 검색도 features slice다(예: `features/room-search`).

## 4. widgets (화면 블록)

예: `widgets/room-type-list/`, `widgets/room-list/`, `widgets/room-type-detail/`

- 목록: `model`이 `loading | failed | empty | ready` 하나의 값, 마지막 페이지를 넘으면 바꿔 이동(replace), 페이지 이동을 만든다. `ui`는 표·빈 상태·불러오기 실패·페이지 이동.
- 상세: 상태별 내용과 '목록으로'·'수정' 링크 줄. 링크는 `ButtonLink`·`TextLink`(`@repo/admin-kit/link`), 상위 경로 링크는 `activeOptions={{ exact: true }}`.

## 5. pages (배치만)

예: `pages/room-type-create/`, `pages/room-list/`

- `getRouteApi(...)`로 search·경로 파라미터·route context를 읽고 연결 컴포넌트를 배치만 한다. 상태·요청을 두지 않는다.
- 목록의 URL search 스키마는 그 pages slice의 `model/`에 둔다(예: `pages/room-list/model/room-list-search.ts`의 `roomListSearchSchema`, `ROOM_LIST_DEFAULT_SEARCH`). 규칙: `admin-app.md` '구조'·'목록 화면'
- 화면 제목은 `config/messages.ts`의 `title`.
- hotel-admin은 `fsd/excessive-slicing`을 끄고 화면마다 pages slice를 하나씩 둔다(사용자 결정, `apps/hotel-admin/CLAUDE.md` '린트'). app-admin은 이 규칙을 끄지 않았으므로 한 레이어의 slice가 권장 한도를 넘으면 정하지 말고 묻는다.

## 6. routes (`src/app/routes`)

예: `app/routes/_authenticated/room-types/`, `app/routes/_authenticated/rooms/index.tsx`

- 로그인이 필요한 화면은 `_authenticated/` 아래. 라우트 파일은 `export const Route = createFileRoute(...)`로 pages를 연결만 한다. 이름 규칙은 앱 `CLAUDE.md` '라우트 파일 이름'.
- 목록 `index.tsx`: `validateSearch`, `search.middlewares: [stripSearchParams(..._DEFAULT_SEARCH)]`, `staticData.title`
- `$<id>/route.tsx`: entities의 `params.parse`·`params.stringify`를 한 번 연결. 상세 `index.tsx`, 수정 `edit.tsx`, 등록 `new.tsx`
- hotel-admin 마스터 전용: 폴더 `route.tsx`의 `beforeLoad: ({ context }) => checkMasterAccess(context.queryClient)`와 `component: MasterAccessPage`. 객실처럼 일부 화면만 마스터면 그 pages가 route context의 `isMaster`로 고른다. 사이드바 메뉴는 `widgets/admin-layout/config/menu.ts`(`masterOnly`). 규칙: `apps/hotel-admin/CLAUDE.md` '앱'
- 라우트 트리 `app/router/route-tree.gen.ts`는 개발 서버·빌드가 다시 만든다. 따로는 `pnpm --filter <앱> exec tsr generate`. 직접 고치지 않고 커밋한다.

## 7. 테스트

- 계층별로: 표현은 props, `model`은 데이터 훅 mock, 데이터 계층은 검증·쿼리 키·캐시. 화면 통합 테스트는 핵심 흐름만(`frontend/CLAUDE.md` '컴포넌트 나누기').
- 반복되는 규칙 사례는 `it.each`로 묶는다(예: `app/auth/master-guard.test.ts`, `pages/master-access`의 운영자 권한 없음).
- 라우터가 필요하면 테스트 안에서 memory history 라우터를 만들고 `parseSearch`·`stringifySearch`를 넣는다. 앱의 라우트 트리는 가져오지 않는다(예: `pages/room-type-create/ui/room-type-create-page.test.tsx`).
- `@/shared/api`의 요청 함수와 `@repo/admin-kit/toast`를 mock한다. 기대 문구는 상수에서 읽는다.
- 개발 중에는 `pnpm --filter <앱> exec vitest run <파일>`, 끝에 lint·typecheck·test를 한 번.

## 8. 문서와 점검

- 앱 `CLAUDE.md`: 화면 규칙(앱의 차이만), 구조 트리, `shared/api`·`entities/*/api`·`features/*/api` 목록. 두 앱 공통 규칙이 바뀌면 `frontend/docs/admin-app.md`.
- `structure-check` 스킬로 점검하고 결과를 PR 본문 '구조 점검 결과'에 적는다.
