---
name: api-codegen
description: 백엔드 API가 바뀌었을 때 프론트엔드 앱의 orval 생성 코드(TanStack Query·HTTP 함수, zod 스키마)를 다시 만들고 shared/api 래퍼와 타입을 맞추는 순서. "orval", "codegen", "API 코드 생성", "생성 코드 갱신", "zod 스키마 생성", "api-docs" 요청에 쓴다.
---

# API 코드 생성 (orval)

규칙의 원본은 `docs/api-convention.md`의 'codegen'·'검증'과 `frontend/CLAUDE.md`의 'API 코드'·'명령어'다. 어드민 앱의 `shared/api` 규칙은 `frontend/docs/admin-app.md`의 'API 호출', web은 `frontend/apps/web/CLAUDE.md`의 'API 호출'이다. 경로는 저장소 루트 기준이다.

## 앱별 설정

| 앱 | 문서 그룹 | 생성 | 설정 |
|---|---|---|---|
| web | `/v3/api-docs/app` | TanStack Query 훅 + fetch + zod | `frontend/apps/web/orval.config.ts` |
| app-admin | `/v3/api-docs/app-admin` | TanStack Query 훅 + axios + zod | `frontend/apps/app-admin/orval.config.ts` |
| hotel-admin | `/v3/api-docs/hotel-admin` | TanStack Query 훅 + axios + zod | `frontend/apps/hotel-admin/orval.config.ts` |

- 세 설정 모두 `API_DOCS_URL`이 `http://localhost:8080/v3/api-docs/<그룹>`이다.
- 생성 위치는 `src/shared/api/generated`(요청은 mutator `src/shared/api/http.ts`를 거친다)와 `src/shared/api/generated/zod`다.
- 생성 코드는 직접 고치지 않고 커밋한다. orval이 만든 TanStack Query 훅은 쓰지 않는다.

## 1. 백엔드 띄우기

- 실행 방법은 `local-run` 스킬('2. 백엔드')을 따른다. 8080에 그 API 변경이 들어간 백엔드가 떠 있어야 한다.
- 떠 있는 백엔드에 새 API가 있는지 먼저 본다.

```bash
curl -s http://localhost:8080/v3/api-docs/hotel-admin | grep -o '"operationId":"[A-Za-z]*"' | sort | head -50
```

### 8080의 백엔드가 다른 브랜치일 때

8080은 다른 작업(다른 checkout)이 쓰고 있고, 바뀐 API는 다른 브랜치·worktree에만 있으면 그 백엔드를 다른 포트로 잠깐 띄운다.

1. 바뀐 API가 있는 checkout의 `backend/`에서 `./gradlew bootRun --args=--server.port=8082`를 백그라운드로 띄운다.
2. 생성할 앱의 `orval.config.ts`의 `API_DOCS_URL` 포트만 `8082`로 잠깐 바꾼다.
3. 아래 2단계로 생성한다.
4. `git checkout -- frontend/apps/<앱>/orval.config.ts`로 설정을 되돌리고, 8082를 잡은 java 프로세스만 끈다. 설정 변경은 커밋하지 않는다.

- 임시 백엔드도 같은 개발 DB를 쓴다(`local-run` '3. 더미 데이터와 공유 DB'). 그 브랜치에 아직 병합되지 않은 새 마이그레이션이 있으면 그것도 공유 DB에 적용된다. 적용된 마이그레이션 파일을 나중에 고치면 Flyway checksum이 달라져 백엔드가 뜨지 않으므로, 마이그레이션이 확정되기 전이면 띄우기 전에 사용자에게 묻는다.

## 2. 생성

`frontend/`에서 실행한다.

```bash
pnpm --filter hotel-admin codegen   # 한 앱만 (app-admin, web도 같다)
pnpm codegen                        # 세 앱 모두 (turbo)
```

- 바뀐 앱만 생성한다. 백엔드가 그 앱의 문서 그룹을 바꾸지 않았으면 그 앱은 건드리지 않는다.
- `git status`·`git diff --stat -- frontend/apps/<앱>/src/shared/api/generated`로 무엇이 바뀌었는지 본다. 이름이 바뀐 생성 함수·스키마가 다음 단계의 수정 대상이다.

## 3. shared/api 래퍼와 타입 맞추기

- `src/shared/api/<도메인>.ts`에 검증을 거친 요청 함수, 요청 스키마·타입, 쿼리 키 함수를 더하거나 고친다. `index.ts`에서 내보낸다.
  - 어드민: `@repo/admin-kit/api`의 `parseRequest`·`parseResponseBody`, 성공 응답 스키마는 생성 스키마를 `.extend`(`success: z.literal(true)`, `data`, 변경 API는 `message: z.string()`). 예: `frontend/apps/hotel-admin/src/shared/api/room-type.ts`
  - web: 앱의 `shared/api/validate.ts`의 `parseRequest`·`parseResponse`를 쓴다. 2xx가 아니면 요청 함수가 `ApiResponseError`를 던진다. 예: `frontend/apps/web/src/shared/api/stay.ts`
  - 쿼리 키는 생성된 `get...QueryKey`로 만든다.
- 새 도메인 오류 코드는 `src/shared/api/api-error.ts`의 `API_ERROR_CODES`에 더한다.
- zod 스키마를 손으로 쓰지 않는다. 화면 입력 검사는 생성 스키마에 화면 문구만 덧붙인다(`docs/api-convention.md` '검증').
- 생성 코드는 `shared/api` 밖에서 import하지 않는다(ESLint가 막는다).
- 응답에 필드가 더해진 것만으로는 화면이 깨지지 않는다(스키마에 없는 필드는 버린다). 빠지거나 타입이 바뀐 필드는 쓰는 곳까지 고친다.

## 4. 타입 검사와 테스트

```bash
pnpm --filter hotel-admin typecheck          # app-admin도 같다
pnpm --filter web exec tsc --noEmit          # web은 빌드 없이 타입만
pnpm --filter hotel-admin exec vitest run src/shared/api   # 바뀐 래퍼의 테스트
```

- web의 `next build`는 `next dev`가 도는 폴더에서 돌리지 않는다(`web-feature` 스킬).
- 라우트 파일도 바꿨다면 어드민 앱의 라우트 트리를 다시 만든다: `pnpm --filter <앱> exec tsr generate`(개발 서버·빌드는 자동). `route-tree.gen.ts`도 직접 고치지 않고 커밋한다.

### Windows worktree의 경로 대소문자 (TS1149)

- 일부 worktree에서 `tsc`가 `TS1149: File name '...' differs from already included file name '...' only in casing`을 낸다. 같은 파일을 경로의 대소문자만 다르게(예: `c--Users`와 `C--Users`) 두 번 읽은 것이라 코드 오류가 아니다.
- 그 worktree에서는 `pnpm --filter <앱> exec tsc --noEmit --forceConsistentCasingInFileNames false`로 확인하거나, 대소문자가 맞는 경로의 worktree에서 검사를 돌린다. 앱의 `tsconfig`는 고치지 않는다.

## 5. 커밋

- 생성 코드만 담은 커밋은 타입 검사가 깨질 수 있다. 생성 코드와 그 때문에 고친 래퍼·화면 코드를 같은 커밋에 넣어 커밋마다 타입 검사가 통과하게 한다.
- 커밋 전에 사용자에게 묻는다(루트 `CLAUDE.md` '커밋 규칙'). 메시지 형식은 `pr-workflow` 스킬.
- PR이 300줄 권장을 넘으면 생성 코드 줄 수를 운영 코드·테스트·문서와 나눠 PR 본문에 적는다.
