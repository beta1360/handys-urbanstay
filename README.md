# handys-urbanstay

여러 호텔을 운영하는 숙박 운영사의 운영 도구다. 객실 중복 배정, 객실 상태 꼬임, 이용 취소 누락을 서버 규칙으로 막는 데 집중했다.

| 구성 | 위치 | 사용자 | 기술 |
|---|---|---|---|
| 백엔드 API | `backend` | 세 앱 | Kotlin 2.3, Spring Boot 4.1, PostgreSQL 18, Flyway |
| 전체 어드민 앱 | `frontend/apps/app-admin` | 운영사 어드민 | Vite + React, TanStack Router·Query |
| 호텔 운영자 앱 | `frontend/apps/hotel-admin` | 호텔 마스터·운영자 | Vite + React, TanStack Router·Query |
| 게스트 앱 | `frontend/apps/web` | 게스트 (뼈대만) | Next.js 16 |

## 1. 문제 정의

운영사 한 곳이 여러 호텔을 운영한다고 가정한다. 운영사의 전체 어드민이 호텔을 등록하고, 각 호텔의 마스터·운영자가 자기 호텔의 객실과 이용(예약)을 관리한다.

| 문제 | 그대로 두면 | 지켜야 할 규칙 |
|---|---|---|
| 중복 배정 | 같은 객실에 기간이 겹치는 이용이 두 건 등록되어, 한 방에 두 팀이 배정된다 | 같은 객실에 기간이 겹치는 이용은 하나만 둔다. 두 운영자가 동시에 같은 객실·기간을 등록해도 하나만 남는다 |
| 객실 상태 꼬임 | 허용되지 않는 변경(예: 공실 → 이용중)이나 동시 변경 충돌로 실제와 다른 상태가 된다 | 정해진 방향으로만 바꾼다. 화면에서 본 상태가 그대로일 때만 바꾼다. 누가 언제 바꿨는지 남긴다 |
| 취소 처리 | 기록 없이 사라지거나, 두 번 처리되거나, 객실 상태가 그대로 남는다 | 취소 기록(누가·언제·왜)과 객실 상태 복구가 함께, 한 번만 일어난다 |
| 계정·권한 | 다른 호텔의 데이터를 보거나 바꾼다 | 역할별로 할 수 있는 일을 나누고, 호텔 계정은 자기 호텔만 다룬다 |

### 객실 상태

```mermaid
stateDiagram-v2
    state "공실" as VACANT
    state "예약됨" as RESERVED
    state "이용중" as OCCUPIED
    state "정비중" as MAINTENANCE
    [*] --> VACANT: 객실 등록
    VACANT --> RESERVED
    RESERVED --> OCCUPIED
    OCCUPIED --> MAINTENANCE
    MAINTENANCE --> VACANT
    RESERVED --> VACANT: 예약 되돌림
    VACANT --> MAINTENANCE: 이용 없이 정비
```

- 위 여섯 방향만 허용한다. 그 밖의 변경과 같은 상태로 바꾸는 요청은 거절한다.
- 상태는 운영자가 직접 바꾼다. 이용 등록은 객실 상태를 바꾸지 않는다.
- 예외는 하나다. 이용을 취소할 때 객실이 예약됨이면 공실로 돌린다. 이용중·정비중이면 그대로 둔다. 다른 이용객이 쓰는 객실이 다른 이용의 취소로 공실이 되지 않게 하기 위해서다.

### 이용

- 이용은 객실, 이용객, 기간, 인원을 묶은 단위다. 기간은 날짜 단위(박)이고 체크아웃 날은 비어 있다고 본다(1일~3일과 3일~5일은 겹치지 않는다).
- 체크인은 오늘(한국 시간) 이후, 1~30박, 인원은 객실 최대 인원 이하다.
- 이용은 수정하지 않는다. 바꾸려면 취소하고 다시 등록한다. 취소한 이용은 겹침 검사에서 뺀다.
- 끝나지 않은 이용만 취소할 수 있고, 취소는 되돌릴 수 없다.

### 계정과 역할

| 역할 | 앱 | 하는 일 |
|---|---|---|
| 전체 어드민 | app-admin | 호텔 등록·수정, 호텔 마스터 계정 관리 |
| 호텔 마스터 | hotel-admin | 운영자 업무 전부 + 같은 호텔의 운영자 계정 관리 |
| 호텔 운영자 | hotel-admin | 자기 호텔의 정보 수정, 객실, 객실 상태, 이용객, 이용 관리 |

- 호텔 마스터는 어드민이 호텔을 등록할 때 함께 만들어진다(호텔마다 하나). 운영자는 마스터가 만들고, 지우지 않고 비활성화한다.
- 계정이 비활성화되거나 비밀번호·아이디가 바뀌면 그 계정의 기존 세션은 다음 요청에서 끊긴다.

전체 규칙은 [docs/domain.md](docs/domain.md)에 있다.

## 2. 해결 방식

규칙마다 서버가 어떻게 지키는지 정리했다. 화면에서 막는 것은 보조이고, 최종 판단은 서버와 DB가 한다.

| 규칙 | 서버가 지키는 방법 | 실패 응답 |
|---|---|---|
| 기간 겹침 금지 | 사전 확인 + PostgreSQL 배제 제약(`exclude using gist`, `daterange [)`, 취소하지 않은 이용만). 사전 확인만으로는 동시에 온 두 요청이 둘 다 통과한다 | 409 `STAY_PERIOD_OVERLAPPED` |
| 객실 상태 전이 | 상태 전이 표(`RoomStatus.canChangeTo`). 16가지 조합 전부를 테스트한다 | 409 `ROOM_STATUS_TRANSITION_NOT_ALLOWED` |
| 동시 상태 변경 | 화면에서 본 상태(`from`)를 함께 받아 조건부 UPDATE(`where status = :from`). 바뀐 행이 없으면 먼저 바뀐 것이다 | 409 `ROOM_STATUS_CHANGED` |
| 상태 이력 | 상태 변경과 같은 트랜잭션에서 한 줄 저장. 이전·바뀐 상태, 계정 id와 그때의 이름, 시각 | - |
| 취소는 한 번만 | 조건부 UPDATE(`where canceled_at is null`). 같은 트랜잭션에서 객실 `RESERVED → VACANT` 조건부 UPDATE와 이력 저장 | 409 `STAY_ALREADY_CANCELED` |
| 동시 수정 | 낙관적 잠금(`@Version`). 수정 요청에 조회 때 받은 `version`을 보낸다. 호텔·객실·이용객·호텔 계정 | 409 `*_MODIFIED` |
| 중복 등록 | 사전 확인 + DB 유일 제약. 위반을 도메인 409로 바꾼다. 호텔 이름+주소, 같은 호텔의 객실 이름, 같은 호텔의 이용객 전화번호(숫자만 비교), 호텔 계정 아이디, 호텔당 마스터 하나 | 409 |
| 자기 호텔만 | 호텔 id는 요청이 아니라 로그인한 세션의 계정에서 읽는다. 다른 호텔의 데이터는 없는 것으로 다룬다 | 404 |
| 로그인·권한 | 서버 세션 + HttpOnly 쿠키. 어드민 API의 변경 요청은 CSRF 토큰(`XSRF-TOKEN` 쿠키 → `X-XSRF-TOKEN` 헤더). 요청마다 호텔 계정을 다시 확인해 바뀐 계정의 세션을 끊는다 | 401 / 403 |
| 앱별 정책 | API 경로, 컨트롤러·DTO, API 문서 그룹을 앱별로 나눈다(`/api/v1/app`, `/api/v1/app-admin`, `/api/v1/hotel-admin`) | - |
| 응답 형식 | 모든 응답을 `{ success, data, message, error }`로 감싼다. 성공 문구와 오류 문구는 서버가 정하고, 화면은 받은 문구를 그대로 보여준다 | - |
| 입력 검증 | 서버는 Bean Validation과 서비스 검사, 클라이언트는 orval이 만든 zod로 요청과 응답을 모두 검증한다 | 400 `INVALID_INPUT` + `fieldErrors` |

객실 상태는 `version`과 따로 움직인다. 상태가 바뀌어도 열어 둔 객실 수정은 거절되지 않고, 반대로 객실 수정이 상태를 옛 값으로 덮어쓰지 않도록 `Room.status`를 JPA UPDATE에서 뺐다(`@Column(updatable = false)`).

### 검증

- DB가 필요한 백엔드 테스트는 실제 PostgreSQL(Testcontainers)에서 돈다. 백엔드 테스트는 PR #80 시점에 1198개다.
- 동시성은 두 가지로 확인한다.
  - 동시 요청: 두 스레드를 함께 출발시킨다. 실행마다 어느 경로를 탈지 정해지지 않는다.
  - 순서 고정: 먼저 온 트랜잭션을 열어 둔 채 다음 요청이 잠금을 기다리는지 확인하고 커밋한다. "사전 확인은 통과했지만 DB에서 막히는" 경로를 매번 같게 재현한다.
- 실제 서버를 띄워 요청을 보내 확인한 항목은 PR 본문에 적었다(예: #49, #55, #58).

## 3. 구현 범위와 판단

### 화면 구현 현황 (master 기준)

| 앱 | 기능 | API | 화면 |
|---|---|---|---|
| app-admin | 로그인·로그아웃 | 완료 | 완료 |
| app-admin | 호텔 목록·검색·상세 | 완료 | 완료 |
| app-admin | 호텔 등록(마스터 계정 함께)·수정 | 완료 | 완료 |
| app-admin | 마스터 조회·정보 수정·비밀번호 재설정 | 완료 | 없음 |
| hotel-admin | 로그인·로그아웃·헤더 | 완료 | 완료 |
| hotel-admin | 객실 등록·목록·상세·수정 | 완료 | 진행 중 |
| hotel-admin | 객실 상태 변경·이력 | 완료 | 진행 중 |
| hotel-admin | 이용객 등록·목록·수정 | 완료 | 진행 중 |
| hotel-admin | 이용 등록·목록 | 완료 | 진행 중 |
| hotel-admin | 이용 취소 | 완료 | 진행 중 |
| hotel-admin | 운영자 관리(마스터 전용) | 완료 | 진행 중 |
| web | 게스트 앱 | - | 레이아웃 뼈대 |

### 하지 않은 것

| 항목 | 이유 |
|---|---|
| 객실 상태 자동 변경(날짜에 따라 이용중 등) | 도메인 문서에서 범위 밖으로 정했다. 상태는 운영자가 바꾸고, 예외는 취소 때 예약됨 → 공실 하나다 |
| 이용 수정 | 도메인 문서에서 취소 후 다시 등록하는 규칙으로 정했다 |
| 결제·요금 | 도메인 뼈대에 없다. 배정·상태·취소의 정합성에 집중했다 |
| 게스트 앱 기능 | 게스트 앱의 로그인과 노출 설정이 미정이다. Next.js 뼈대만 둔다 |
| 본인 비밀번호 변경 | 도메인 문서에서 아직 다루지 않기로 했다 |
| 호텔·객실·이용객 삭제 | 도메인 문서에서 다루지 않기로 했다. 운영자 계정도 지우지 않고 비활성화한다 |
| 전체 어드민 계정 추가 | 도메인 문서에는 있으나 API·화면을 만들지 않았다 |
| hotel-admin의 자기 호텔 정보 수정 | 도메인 문서에는 있으나 API·화면을 만들지 않았다 |
| 별도 운영 도메인(투숙 중 청소 등) | 도메인 문서에서 뼈대 완성 뒤 논의하기로 했다 |
| 배포 환경 | 로컬 실행용이다. CORS는 설정하지 않고, 세션은 서버 메모리에 둔다(백엔드를 다시 띄우면 다시 로그인) |

### 전제와 다른 점: 어드민 앱은 Vite + React SPA

- 과제 전제는 'Frontend: Next.js'다.
- 게스트 앱(`apps/web`)은 Next.js로 두었다. 지금은 뼈대만 있다.
- 두 어드민 앱은 로그인한 운영자만 쓰는 화면이다. 검색 노출(SEO)과 서버 렌더링이 필요 없어서 Vite + React SPA(TanStack Router·Query, axios)로 만들었다. 2026-10-28 사용자와 정했다.
- 어드민 앱의 API 호출은 Vite 개발 서버의 proxy가 자기 앱의 API 경로만 백엔드로 넘긴다.

## 4. 실행 방법

### 준비물

| 도구 | 버전 | 근거 |
|---|---|---|
| JDK | 25 | `backend/build.gradle.kts`의 toolchain. Gradle은 wrapper(9.8.2)를 쓴다 |
| Docker Desktop | 실행 중이어야 한다 | 개발 DB(`backend/compose.yaml`)와 테스트(Testcontainers) |
| Node.js | 24에서 확인 | 저장소에 고정한 버전은 없다 |
| pnpm | 10.7.1 | `frontend/package.json`의 `packageManager` |

### 백엔드

```bash
cd backend
./gradlew bootRun          # Windows: .\gradlew.bat bootRun
```

- `compose.yaml`의 PostgreSQL 18 컨테이너가 자동으로 뜬다(Spring Boot Docker Compose). 앱을 꺼도 DB는 계속 떠 있다(`start-only`).
  - 정지: `docker compose stop`, 데이터까지 삭제: `docker compose down -v` (`backend/`에서 실행)
- 스키마는 Flyway가 적용한다(`src/main/resources/db/migration`, V1~V10).
- 주소: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`. 문서는 앱별 그룹이다.
  - `/v3/api-docs/app`, `/v3/api-docs/app-admin`, `/v3/api-docs/hotel-admin`

### 프론트엔드

```bash
cd frontend
pnpm install
pnpm dev                          # 세 앱을 함께 실행 (turbo)
pnpm --filter app-admin dev       # 한 앱만 실행
```

| 앱 | 접속 주소 |
|---|---|
| app-admin | http://app-admin.localhost:5173 |
| hotel-admin | http://hotel-admin.localhost:5174 |
| web | http://localhost:3000 (`next dev` 기본 포트) |

- 백엔드 주소는 각 앱의 `.env.local`(`API_BASE_URL`)에 있고, 과제 제출용으로 커밋했다.
- 어드민 앱은 위의 `*.localhost` 주소로 접속한다. 쿠키는 포트로 나뉘지 않아서, 호스트를 나눠야 두 앱의 세션·CSRF 쿠키가 섞이지 않는다.

### 처음 로그인

1. app-admin: 첫 전체 어드민 계정은 백엔드가 뜰 때 `backend/src/main/resources/application.properties`의 `urbanstay.initial-admin.*`(`login-id`, `password`, `name`) 값으로 만들어진다. 어드민이 하나도 없을 때만 만든다. 그 아이디와 비밀번호로 로그인한다.
2. hotel-admin: app-admin에서 호텔을 등록할 때 그 호텔의 마스터 계정(아이디, 이름, 처음 비밀번호)을 함께 만든다. 그 계정으로 hotel-admin에 로그인한다.
3. 운영자 계정은 마스터가 만든다.

### 테스트와 검사

```bash
cd backend
./gradlew test             # Docker 필요 (Testcontainers로 PostgreSQL 18을 띄운다)

cd frontend
pnpm test                  # Vitest + React Testing Library (turbo로 전체)
pnpm lint                  # ESLint + Steiger(FSD 규칙)
pnpm typecheck             # tsc --noEmit (app-admin, hotel-admin, packages)
pnpm build
```

- 테스트용 PostgreSQL 컨테이너를 실행 사이에 재사용하려면 `~/.testcontainers.properties`에 `testcontainers.reuse.enable=true`를 둔다. 없으면 매번 새로 만든다.
- API 코드 생성은 `frontend/`에서 `pnpm codegen`이다. 백엔드가 실행 중이어야 한다.

## 5. 구조

```
handys-urbanstay/
├─ CLAUDE.md                     # 작업 지침 (커밋·브랜치·PR 규칙, AI 역할 분담)
├─ docs/                         # 프론트엔드·백엔드 공통 계약
├─ backend/                      # Kotlin + Spring Boot
│  ├─ compose.yaml               # 개발용 PostgreSQL 18
│  └─ src/main/
│     ├─ kotlin/com/marco/assignment/handys/urbanstay/
│     │  ├─ common/              # 응답 봉투, 예외, 보안, 요청 검증, 설정
│     │  ├─ account/             # 전체 어드민·호텔 계정, 로그인
│     │  ├─ hotel/               # 호텔
│     │  ├─ room/                # 객실, 객실 상태와 이력
│     │  ├─ guest/               # 이용객
│     │  └─ stay/                # 이용, 취소
│     └─ resources/
│        ├─ db/migration/        # Flyway V1~V10
│        └─ messages.properties  # 응답·검증·API 문서 문구
└─ frontend/                     # Turborepo + pnpm workspace
   ├─ apps/
   │  ├─ web/                    # 게스트 앱 (Next.js, 뼈대)
   │  ├─ app-admin/              # 전체 어드민 앱 (Vite + React)
   │  └─ hotel-admin/            # 호텔 운영자 앱 (Vite + React)
   ├─ packages/
   │  ├─ ui/                     # 두 어드민 앱의 화면 컴포넌트 (@repo/ui)
   │  └─ admin-kit/              # 두 어드민 앱의 도메인 무관 코드 (@repo/admin-kit)
   └─ docs/admin-app.md          # 두 어드민 앱의 공통 규칙
```

- 백엔드 도메인 패키지는 `controller`(앱별 `app`·`appadmin`·`hoteladmin`), `dto`, `service`, `repository`, `entity`, `exception`으로 나눈다. 다른 도메인은 그 도메인의 Service로만 쓴다.
- 프론트엔드는 FSD 레이어(`app` → `pages` → `widgets` → `features` → `entities` → `shared`)로 나누고, slice 안은 표현(`ui`)·응용(`model`)·데이터(`api`) 3계층으로 나눈다. FSD 규칙은 Steiger로 검사한다.

## 6. AI 활용과 검토 과정

Claude Code로 진행했다. 규칙은 `CLAUDE.md`와 `docs/`에 계약으로 두고, AI가 임의로 정하지 않고 사용자에게 묻도록 했다.

| 단계 | 하는 일 |
|---|---|
| 계획 | 메인 에이전트가 사용자와 계획을 세운다. 도메인 규칙은 질문으로 정한다. PR 본문에 '사용자 결정'으로 남는다 |
| 규칙 문서 | 도메인 규칙은 코드보다 먼저 `docs(common)` PR로 남긴다. 예: 객실 상태 규칙 #57 → 구현 #58, 이용·취소 규칙 #75 → 구현 #76·#78·#80 |
| 구현 | 서브에이전트가 [백엔드](docs/backend-flow.md)·[프론트엔드](docs/frontend-flow.md) 개발 플로우를 따라 구현한다. '확인된 사실·모르는 것·결정·검증 방법'으로 보고한다 |
| 검토 | 메인이 테스트를 돌리고, 실제 서버·브라우저에서 확인한다. 프론트엔드 PR은 만들기 전에 FSD·3계층 위반을 grep으로 찾는 구조 점검을 하고 결과를 PR 본문에 적는다 |
| PR | '논의하고 싶은 내용'에 모르는 것과 남은 한계를, '의사결정을 내린 것'에 결정과 이유를 적는다. 300줄 권장을 넘으면 이유를 적는다 |
| 병합 | 사용자가 승인하고 squash merge한다 |

주석 추가처럼 작은 것도 사용자 승인을 받았다(#58, #78).

### 검토로 바뀐 결정 (PR 본문에서)

| PR | 무엇이 바뀌었나 |
|---|---|
| #32 → #33 | 어드민 공통 문서(#32)에 shadcn/ui가 들어갔다. 처음 합의('Tailwind 기본값, 별도 디자인 토큰 없음')와 맞지 않아 #33에서 되돌렸다. 색 변수를 끄는 shadcn CLI 옵션도 시험했지만, 모노레포 init에서는 옵션이 무시되고 설정으로 끄면 잘못된 class가 만들어졌다 |
| #49, #78, #80 | 동시 요청 테스트만으로는 실행마다 어느 경로를 탈지 정해지지 않는다. 그래서 먼저 온 트랜잭션을 열어 둔 채 다음 요청이 잠금을 기다리는지 확인하고 커밋하는 순서 고정 테스트를 두었다. 409 변환 코드를 빼면 테스트가 실패하는 것도 확인했다(#49) |
| #58 | 객실 수정이 객실을 읽은 뒤 상태 변경이 커밋되면, JPA가 모든 컬럼을 UPDATE하면서 상태를 옛 값으로 되돌리는 경로를 찾았다. `Room.status`를 `updatable = false`로 빼고, 이를 지우면 실패하는 테스트를 두었다 |
| #51, #55 | 직접 재 보고 바꿨다. 처음 이메일 정규식은 Java와 JS의 `\s` 범위가 달랐고, 특정 입력에서 처리 시간이 길이의 제곱으로 늘었다(점 2만 개에 2.7초). 길이에 비례하는 정규식으로 바꿨다(#51). 객실 이름순은 실제 서버에서 `1001`이 `101`보다 앞에 오는 것을 보고 ICU 숫자 정렬로 바꿨다(#55, 사용자 결정) |
| #64 ~ #72 | app-admin 호텔 화면을 마친 뒤 점검해 보니 react-query를 허용 범위 밖에서 쓰는 파일이 7개였고, 폼 훅 하나가 입력·검사·요청·캐시·이동을 모두 맡았다. 기능 추가를 멈추고 규칙 문서(#64)를 먼저 고친 뒤 #65~#72에서 코드를 맞췄다(사용자 결정). 이후 프론트엔드 PR마다 구조 점검을 한다 |

## 7. 문서

| 문서 | 내용 |
|---|---|
| [CLAUDE.md](CLAUDE.md) | 작업 지침. 커밋·브랜치·PR 규칙, AI 역할 분담 |
| [docs/domain.md](docs/domain.md) | 도메인 규칙 (호텔, 객실, 객실 상태, 이용, 이용객, 계정과 역할, 미정) |
| [docs/api-convention.md](docs/api-convention.md) | API 규약 (경로, 응답 형식, 목록, 검증, 인증, codegen) |
| [docs/code-convention.md](docs/code-convention.md) | 코드 규칙 (상수 관리) |
| [docs/backend-flow.md](docs/backend-flow.md) | 백엔드 개발 플로우 |
| [docs/frontend-flow.md](docs/frontend-flow.md) | 프론트엔드 개발 플로우 |
| [backend/CLAUDE.md](backend/CLAUDE.md) | 백엔드 구조, 동시성·검증 규칙, 실행·테스트 |
| [frontend/CLAUDE.md](frontend/CLAUDE.md) | 프론트엔드 구조(FSD, 3계층), 서버 상태, 폼, 명령어 |
| [frontend/docs/admin-app.md](frontend/docs/admin-app.md) | 두 어드민 앱의 공통 규칙 (화면, 토스트, 로그인) |
| [app-admin](frontend/apps/app-admin/CLAUDE.md) · [hotel-admin](frontend/apps/hotel-admin/CLAUDE.md) · [web](frontend/apps/web/CLAUDE.md) | 앱별 지침 |
| [packages/ui](frontend/packages/ui/CLAUDE.md) · [packages/admin-kit](frontend/packages/admin-kit/CLAUDE.md) | 공유 패키지 지침 |
