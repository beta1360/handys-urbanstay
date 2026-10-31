---
name: structure-check
description: 프론트엔드 PR 전에 FSD 레이어와 표현·응용·데이터 3계층 규칙을 grep으로 점검하고, 결과를 PR 본문의 '구조 점검 결과'에 적는다. "PR 전 구조 점검", "구조 점검", "FSD 점검", "structure check", "3계층", "레이어 규칙" 요청이나 프론트엔드 서브에이전트 결과를 검토할 때 쓴다.
---

# 프론트엔드 구조 점검

규칙의 원본은 `frontend/CLAUDE.md`의 '구조 (FSD)'(레이어, 3계층, 컴포넌트 나누기, 서버 상태, 공용 UI와 화면 이동)와 '상수', 어드민 앱은 `frontend/docs/admin-app.md`, web은 `frontend/apps/web/CLAUDE.md`의 '구조'다. 이 스킬은 점검 순서와 결과 읽는 법만 모은다. 경로는 저장소 루트 기준이다.

## 언제

- 프론트엔드 코드 PR을 만들기 전(푸시·PR 생성을 묻기 전)
- 서브에이전트가 프론트엔드 작업을 마치고 결과를 보고했을 때
- 문서만 바꾼 PR은 이 스크립트 대신 문서 사이 참조와 내용이 맞는지 본다.

## 실행

```bash
# 앱 전체
bash .claude/skills/structure-check/structure-check.sh hotel-admin

# master에서 갈라진 뒤 바뀐 파일만 (커밋 전 변경·새 파일 포함)
bash .claude/skills/structure-check/structure-check.sh hotel-admin master
```

- 앱 이름은 `app-admin`, `hotel-admin`, `web` 중 하나다. 바꾼 앱마다 따로 돌린다.
- 저장소(또는 worktree) 안 어디서 실행해도 그 checkout의 `frontend/apps/<앱>/src`를 본다.
- `*.test.ts(x)`, `shared/api/generated`, `route-tree.gen.ts`는 보지 않는다.
- `@repo/ui`, `@repo/admin-kit`은 FSD 앱이 아니라 대상이 아니다(각 패키지의 `CLAUDE.md`).
- 레이어 import 방향·public API·같은 레이어 slice import는 Steiger(`pnpm --filter <앱> lint`)가, `shared/api/generated` import와 `@tanstack/react-query` import 위치는 ESLint `no-restricted-imports`가 함께 막는다. 스크립트는 lint가 보지 않는 3계층 책임을 주로 본다.

## 점검 항목

| 번호 | 보는 것 | 규칙 |
|---|---|---|
| 1 | `@tanstack/react-query` import가 app 레이어(web은 `_app`), `entities/*/api`, `features/*/api` 밖에 없다 | '서버 상태 (TanStack Query)' |
| 2 | pages(web은 `_pages`)에 `useState`·`useEffect`·쿼리·뮤테이션·이동 훅이 없다 | '레이어'의 pages, '컴포넌트 나누기' |
| 3 | `ui` 세그먼트에 상태·쿼리·뮤테이션·`navigate`(web은 `useRouter`·`pushState`·`cookies()`)가 없다 | '3계층'의 표현 |
| 4 | `model`에 JSX가 없고, `shared/api` 요청 함수·쿼리 키·`queryClient`를 직접 쓰지 않는다 | '3계층'의 응용 |
| 5 | 버튼 `onClick`으로 이동하지 않는다 | '공용 UI와 화면 이동' |
| 6 | `model`에 불리언 `useState`가 둘 이상이면 하나의 상태 값으로 묶을 수 있는지 본다 | '컴포넌트 나누기', `docs/frontend-flow.md` '4. 상태 설계' |
| 7 | 같은 문구가 여러 `config/*messages.ts`에 따로 있지 않다 | '상수' |
| web | `next/headers`는 `widgets/*/model`에서만 쓴다 | web `CLAUDE.md` '서버 컴포넌트의 조회' |

## 결과 읽기

grep이라 걸린 줄이 모두 위반은 아니다. 줄마다 아래로 판단하고, 위반이면 고친 뒤 다시 돌린다.

1. 걸린 파일의 조회·캐시 코드는 `entities/<도메인>/api`로, 변경 훅은 `features/<동작>/api`로 옮긴다. `shared/api`에서도 쓰지 않는다.
2. pages는 URL(경로 파라미터·search, route context, web의 `params.then`)을 읽고 연결 컴포넌트를 배치만 한다. 이런 읽기는 걸리지 않는다. 걸린 상태·요청은 widgets·features의 `model`로 옮긴다. 어드민 오류 화면의 `useRouter().invalidate()`('다시 시도', `admin-app.md` '로그인')는 패턴에 넣지 않았다.
3. 연결 컴포넌트가 같은 slice의 `model` 훅 하나를 부르는 것은 괜찮다(이름이 `...Query(`·`...Mutation(`으로 끝나지 않으면 걸리지 않는다). `use...Query(`가 걸리면 `ui`가 데이터 훅을 직접 부르는 것이므로 `model`을 거치게 한다.
4. 요청 함수 이름은 `shared/api/*.ts`의 `export async function`에서 읽는다. 낱말 경계로 찾으므로 예전 임시 스크립트에서 걸리던 `useRefetchRoom`·`refetchRoomType` 같은 이름은 걸리지 않는다. 그래도 걸리면 그 이름이 `@/shared/api`에서 온 것인지, 같은 이름으로 받은 변경 훅의 함수인지 import를 보고 판단한다. 성공 뒤 `navigate`는 `model`에서 해도 된다.
5. 한 줄에 쓴 `onClick={... navigate ...}`만 찾는다. 이동은 `ButtonLink`·`TextLink`(어드민은 `@repo/admin-kit/link`, web은 `shared/ui`)로 바꾼다. 여러 줄 핸들러는 리뷰로 본다.
6. 휴리스틱이다. 함께 움직이는 상태면 `"loading" | "failed" | "notFound" | "ready"` 같은 union 하나로 돌려준다. 제출 중 상태(`formState.isSubmitting || formState.isSubmitSuccessful`)는 규칙이 정한 값이라 해당하지 않는다. 걸리지 않아도 바꾼 `model` 훅의 반환 타입은 리뷰로 한 번 본다.
7. 기준 ref를 주면 바뀐 messages 파일이 끼인 중복만 보여준다.
   - 여러 화면이 함께 쓰는 문구(예: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', '불러오는 중입니다.', '다시 시도')는 `shared/config`로 옮긴다.
   - 옮길 수 없는 중복은 이유를 PR 본문에 적는다. 이전 PR의 예: 같은 레이어 slice끼리 import하지 않아 entities마다 같은 항목 이름을 둔 경우('1박 요금'이 `entities/room-type`과 `entities/stay`에), 목록 버튼과 등록 화면 제목이 pages slice마다 따로 있는 경우('객실 생성'·'운영자 등록').

## 리뷰로 보는 것

- features slice 하나가 사용자 동작 하나만 맡는다.
- 쿼리 키와 캐시 규칙은 그 도메인의 `entities/*/api` 한 곳에만 있고, `features/*/api`는 entities의 캐시 규칙 함수를 부른다.
- 의존이 표현 → 응용 → 데이터 한 방향이다.
- 테스트가 계층에 맞다(표현은 props, `model`은 데이터 훅 mock, 데이터 계층은 검증·쿼리 키·캐시). 통합 테스트는 핵심 흐름만.
- 앱 `CLAUDE.md`의 구조 트리와 화면 규칙, 필요하면 `frontend/docs/admin-app.md`를 함께 고쳤다.
- lint(ESLint + Steiger)·typecheck·test를 PR 끝에 한 번 돌린다. web 빌드는 `web-feature` 스킬의 주의를 따른다.

## PR 본문

PR 템플릿(루트 `CLAUDE.md`) 뒤에 `## 구조 점검 결과`를 두고 항목마다 한 줄로 적는다. 예외는 이유를 함께 적고, 정하지 못한 것은 '논의하고 싶은 내용'으로 옮긴다.

```markdown
## 구조 점검 결과
- `@tanstack/react-query` import는 `app`, `entities/*/api`, `features/*/api`에만 있다(`entities/room-type/api`, `features/room-type-create/api` 추가)
- `pages`에 상태·요청 없음. route context의 `isMaster`를 읽어 배치·전달만 한다
- `ui`에 `useNavigate`·`navigate(`·쿼리·뮤테이션·`useState`·`useEffect` 없음
- `model`에 JSX 없음, 요청 함수·쿼리 키 직접 호출 없음
- 이동은 링크(`ButtonLink`·`TextLink`), 성공 뒤 이동만 model의 `navigate`
- 상태는 화면마다 하나의 상태 값(`useRoomTypeList`·`useRoomType`)
- 문구 중복: '1박 요금'이 `entities/room-type`과 `entities/stay`에 따로 있다(엔티티끼리 가져오지 않음)
```
