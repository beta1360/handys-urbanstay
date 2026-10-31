# urbanstay 백엔드

게스트 앱(web), 전체 어드민(app-admin), 호텔 운영자(hotel-admin)가 함께 쓰는 API 서버다. 객실 중복 배정, 객실 상태 꼬임, 취소 누락, 지난 예약 금액 변경을 서버와 DB 규칙으로 막는다. 과제 전체 설명은 [루트 README](../README.md), 작업 규칙 원문은 [backend/CLAUDE.md](CLAUDE.md)에 있다.

| 구분 | 내용 (`build.gradle.kts`, `compose.yaml` 기준) |
|---|---|
| 언어·빌드 | Kotlin 2.3.21, JDK 25(toolchain), Gradle wrapper 9.8.2 |
| 프레임워크 | Spring Boot 4.1.2 (Web MVC, Data JPA, Security, Validation, Actuator) |
| DB | PostgreSQL 18(`postgres:18`), Flyway |
| API 문서 | springdoc-openapi 3.2.0 |
| 테스트 | JUnit 5, Spring Security Test, Testcontainers(PostgreSQL) |

## 1. 빠른 실행

Docker Desktop을 먼저 띄운다. 명령은 모두 `backend/`에서 실행한다.

```bash
./gradlew bootRun          # Windows: .\gradlew.bat bootRun
```

- Windows에서 `Cannot run program "docker"`로 실패하면 `docker`가 PATH에 없는 것이다. Docker Desktop 설치 폴더의 `resources\bin`(사용자별 설치면 `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin`)을 PATH에 더한다.
  - Git Bash 예: `PATH="$PATH:/c/Users/<사용자>/AppData/Local/Programs/DockerDesktop/resources/bin" ./gradlew bootRun`
- DB: Spring Boot Docker Compose가 `compose.yaml`의 PostgreSQL 18을 자동으로 띄운다. `start-only`라 앱을 꺼도 DB는 계속 떠 있다.
  - 정지는 `docker compose stop`. `compose.yaml`을 바꿨으면 `docker compose up -d`로 반영한다(이미 떠 있으면 Spring이 기동을 건너뛴다).
- 스키마: 앱이 뜰 때 Flyway가 `src/main/resources/db/migration`(V1~V15)을 적용하고, `ddl-auto=validate`로 엔티티와 대조한다.
- 더미 데이터: 뜰 때 호텔이 하나도 없으면 한 트랜잭션으로 넣는다(`SeedService.seedIfEmpty`). 호텔이 하나라도 있으면 아무것도 하지 않는다. 끄려면 `urbanstay.seed.enabled=false`.
  - 처음부터 다시 넣으려면 `docker compose down -v` 후 `bootRun`한다. **개발 DB의 데이터가 모두 지워지고**, 같은 compose 프로젝트(`backend`)를 쓰는 모든 worktree에 영향을 준다.
- 주소는 `http://localhost:8080`, Swagger UI는 `http://localhost:8080/swagger-ui.html`이다. 문서는 앱별 그룹으로만 제공한다(통합 문서 `/v3/api-docs`는 끈다).

| 그룹 | 문서 | 쓰는 앱 |
|---|---|---|
| app | `/v3/api-docs/app` | 게스트 앱(web) |
| app-admin | `/v3/api-docs/app-admin` | 전체 어드민 |
| hotel-admin | `/v3/api-docs/hotel-admin` | 호텔 운영자 |

### 테스트 계정

| 앱 | 아이디 | 비밀번호 |
|---|---|---|
| app-admin | `src/main/resources/application.properties`의 `urbanstay.initial-admin.login-id` | 같은 파일의 `urbanstay.initial-admin.password` |
| hotel-admin 마스터 | `master1@urbanstay.test`(강남), `master2@…`(홍대), `master3@…`(해운대) | `Test1234!` |
| hotel-admin 운영자 | `operator1a`·`operator1b`(강남), `operator2a`·`operator2b`(홍대), `operator3a`·`operator3b`(해운대) `@urbanstay.test` | `Test1234!` |
| web 회원 | `member1@urbanstay.test` ~ `member10@urbanstay.test` | `Test1234!` |

- 전체 어드민 첫 계정은 어드민이 하나도 없을 때 위 설정값으로 만들어진다(`InitialAdminConfig`).
- `Test1234!`는 로컬 테스트 값이다(`SeedService.PASSWORD`). 넣는 데이터(호텔 3곳, 유형, 객실 상태, 이용 40건)는 [로컬 더미 데이터](CLAUDE.md#로컬-더미-데이터)에 있다.

## 2. 구조

```
src/main/kotlin/com/marco/assignment/handys/urbanstay/
├─ common/    # 응답 봉투·예외 처리, 보안(SecurityConfig·세션 확인), 요청 바인딩·검증, BaseEntity, 설정(Clock·Jackson)
├─ account/   # 전체 어드민·호텔 계정(마스터·운영자), 어드민 로그인, 첫 어드민 생성
├─ member/    # 게스트 앱 회원, 회원가입·로그인
├─ hotel/     # 호텔
├─ room/      # 객실 유형, 객실, 객실 상태와 이력
├─ guest/     # 호텔별 이용객(회원 연결)
├─ stay/      # 이용(예약·객실 배정·예약 비용), 취소, 월별 정산
└─ seed/      # 로컬 더미 데이터
src/main/resources/
├─ db/migration/         # Flyway V1~V15
└─ messages.properties   # 응답·검증·API 문서 문구
```

- 도메인 안은 `controller`, `dto`, `service`, `repository`, `entity`, `exception`으로 나눈다.
- 세 앱은 정책이 달라 컨트롤러와 DTO를 앱별 하위 패키지로 나눈다. 엔티티·리포지토리는 함께 쓰고, 서비스는 앱별 정책이 다를 때만 나눈다.

| 하위 패키지 | 앱 | 경로 상수 (`common/ApiPaths`) | 이름 예 |
|---|---|---|---|
| `app` | 게스트 앱 | `APP` = `/api/v1/app` | `HotelAppController`, `HotelAppResponse` |
| `appadmin` | 전체 어드민 | `APP_ADMIN` = `/api/v1/app-admin` | `HotelAppAdminController`, `HotelAppAdminResponse` |
| `hoteladmin` | 호텔 운영자 | `HOTEL_ADMIN` = `/api/v1/hotel-admin` | `HotelHotelAdminController`, `HotelHotelAdminResponse` |

- 다른 도메인은 그 도메인의 Service로만 쓴다. 다른 도메인의 Repository는 직접 쓰지 않는다(엔티티 간 JPA 연관관계는 허용). 예외는 서비스로 만들 수 없는 더미 데이터(지난 이용 등)뿐이다.
- 서비스 의존은 순환하지 않게 한 방향으로 둔다. 예: `HotelMasterService → HotelService → HotelAdminService`, `StayService → RoomService`([계정](CLAUDE.md#계정)).

## 3. API 한눈에

접근 규칙은 `common/config/SecurityConfig` 한 곳에 있다. 아래 경로는 앱 경로 뒤의 부분이다.

### 게스트 앱 `/api/v1/app`: 기본은 로그인 없이, `MEMBER_APIS`만 회원

| 메서드·경로 | 내용 | 누가 |
|---|---|---|
| `POST /auth/signup`, `POST /auth/login` | 회원가입(바로 로그인)·로그인 | 누구나 |
| `GET /auth/me`, `POST /auth/logout` | 내 정보, 로그아웃 | 회원 |
| `GET /hotels` | 호텔 목록과 `roomCount`. 객실이 있는 호텔 먼저, 그 안에서 이름순(같으면 id) | 누구나 |
| `GET /hotels/{hotelId}/room-types?checkInDate=&checkOutDate=&guestCount=` | 유형별 1박 요금, `roomCount`, `availableCount`(0이면 예약불가) | 누구나 |
| `POST /stays` | 유형으로 예약. 서버가 객실을 배정한다 | 회원 |
| `GET /me/stays?period=` | 내 이용. `UPCOMING`(체크아웃이 오늘 뒤, 체크인 오름차순), `PAST`(체크아웃이 오늘이거나 그 전, 체크인 내림차순), 없으면 전체 | 회원 |

### 전체 어드민 `/api/v1/app-admin`: `APP_ADMIN` 역할만

| 메서드·경로 | 내용 |
|---|---|
| `POST /auth/login` | 로그인. `PUBLIC_ADMIN_APIS`라 로그인 없이 쓰고, CSRF는 걸린다 |
| `POST /auth/logout`, `GET /auth/me` | 로그아웃, 내 정보 |
| `GET·POST /admins`, `GET·PUT /admins/{adminId}` | 전체 어드민 계정 목록(id 내림차순)·추가·상세·이름 수정(`version`) |
| `GET·POST /hotels`, `GET·PUT /hotels/{hotelId}` | 호텔 목록(이름·주소·대표 전화번호 검색)·등록(마스터 함께)·상세·수정 |
| `GET·PUT /hotels/{hotelId}/master`, `PUT /hotels/{hotelId}/master/password` | 호텔 마스터 조회·정보 수정·비밀번호 재설정 |
| `GET /hotels/{hotelId}/rooms` | 호텔의 객실 목록(읽기 전용) |
| `GET /members`, `GET /members/{memberId}`, `GET /members/{memberId}/stays` | 회원 목록·상세·호텔 이용 기록 |

### 호텔 운영자 `/api/v1/hotel-admin`: `HOTEL_ADMIN`(마스터·운영자), 일부는 마스터만

| 메서드·경로 | 내용 | 누가 |
|---|---|---|
| `POST /auth/login` | 로그인(`PUBLIC_ADMIN_APIS`) | 누구나 |
| `POST /auth/logout`, `GET /auth/me` | 로그아웃, 내 정보 | 마스터·운영자 |
| `GET·PUT /hotel` | 자기 호텔 정보 조회·수정 | 마스터(`HOTEL_MASTER_APIS`) |
| `GET /room-types`, `GET /room-types/{roomTypeId}` | 객실 유형 목록(페이지 없음)·상세 | 마스터·운영자 |
| `POST /room-types`, `PUT /room-types/{roomTypeId}` | 객실 유형 생성·수정 | 마스터(`HOTEL_MASTER_APIS`) |
| `GET /rooms`, `GET /rooms/{roomId}` | 객실 목록(이름 검색·상태·유형 거르기)·상세, 지금 이용 | 마스터·운영자 |
| `POST /rooms`, `PUT /rooms/{roomId}` | 객실 생성·수정 | 마스터(`HOTEL_MASTER_APIS`) |
| `PUT /rooms/{roomId}/status`, `GET /rooms/{roomId}/status-histories` | 상태 변경(`{ from, to }`)·이력 | 마스터·운영자 |
| `GET /guests`, `GET·PUT /guests/{guestId}` | 이용객 목록·상세·수정 | 마스터·운영자 |
| `GET /stays`, `GET /stays/{stayId}`, `POST /stays/{stayId}/cancel` | 이용 목록·상세·취소 | 마스터·운영자 |
| `/operators/**` | 운영자 등록·목록·상세·수정·비밀번호 재설정·활성 상태 변경 | 마스터(경로 규칙 `HOTEL_MASTER_PATTERN`) |
| `GET /settlements?month=`, `GET /settlements/stays?month=` | 월별 정산, 그 달의 이용 로그 | 마스터(`HOTEL_MASTER_APIS`) |

- 호텔 계정이 다루는 호텔은 경로·본문이 아니라 세션(`HotelAdminPrincipal.hotelId`)에서 읽는다. 다른 호텔의 id는 없는 id와 같은 404다.
- 로그인하지 않으면 401 `UNAUTHORIZED`, 역할이 맞지 않으면 403 `FORBIDDEN`이다. 그 밖의 경로(actuator 포함)는 막고, Swagger UI와 문서는 연다.
- API가 바뀌면 프론트엔드는 `frontend/`에서 `pnpm codegen`(백엔드 실행 중)으로 생성 코드를 갱신한다.

## 4. 규칙을 지키는 방법 (요약)

세부 규칙과 판단 순서는 [backend/CLAUDE.md](CLAUDE.md)에 있다. 여기에는 무엇으로 막는지만 적는다.

| 주제 | 방법 | 자세히 |
|---|---|---|
| 응답 형식 | 에러를 포함한 모든 응답을 `{ success, data, message, error }`로 감싼다. 상태를 바꾸는 성공 응답의 `message`는 `@SuccessMessage` 키의 문구(`messages.properties`)다 | [응답과 예외](CLAUDE.md#응답과-예외), [상수](CLAUDE.md#상수) |
| 입력 검증 | Bean Validation과 서비스 검사. 문서에 없는 필드, 타입이 틀린 값, 스칼라 강제 변환도 400 `INVALID_INPUT` + `fieldErrors`다 | [응답과 예외](CLAUDE.md#응답과-예외) |
| 인증·세션 | 서버 세션(메모리, 8시간, 백엔드를 다시 띄우면 다시 로그인) + HttpOnly·SameSite=Lax 쿠키. 앱마다 인증을 따로 만들고 회원 세션은 다른 세션 속성 키에 둔다. 호텔 계정은 요청마다 DB에서 다시 확인한다(비활성, `credential_version`) | [보안](CLAUDE.md#보안), [인증](CLAUDE.md#인증) |
| CSRF | 어드민 API에만 SPA 모드로 건다. `XSRF-TOKEN` 쿠키 → `X-XSRF-TOKEN` 헤더, 없거나 틀리면 403 `INVALID_CSRF_TOKEN`. 게스트 API는 SameSite=Lax로 막는다 | [보안](CLAUDE.md#보안) |
| 기간 겹침 | 배제 제약 `stay_room_id_period_excl`(`exclude using gist`, 취소하지 않은 이용만)이 안전망이다. 위반은 409 `STAY_PERIOD_OVERLAPPED` | [이용](CLAUDE.md#이용) |
| 객실 배정 | 그 유형 객실을 id 오름차순 비관적 잠금(`@Lock(PESSIMISTIC_WRITE)`, `for no key update`)한 뒤 다시 조회해 이름순 첫 빈 객실을 고른다. 없으면 409 `ROOM_TYPE_UNAVAILABLE` | [게스트 앱 API](CLAUDE.md#게스트-앱-api) |
| 동시 수정 | 낙관적 잠금(`@Version`). 호텔·전체 어드민·호텔 계정·객실·객실 유형·이용객, 409 `*_MODIFIED` | [동시성과 충돌](CLAUDE.md#동시성과-충돌) |
| 상태 변경·취소 | 조건부 UPDATE. 상태는 `where status = :from`(409 `ROOM_STATUS_CHANGED`), 취소는 `where canceled_at is null`(409 `STAY_ALREADY_CANCELED`) | [객실 상태](CLAUDE.md#객실-상태), [이용](CLAUDE.md#이용) |
| 이용객 찾기·만들기 | `insert ... on conflict do nothing` 뒤 다시 조회한다. 같은 새 이용객의 동시 예약도 이용객은 하나다 | [이용객](CLAUDE.md#이용객), [게스트 앱 API](CLAUDE.md#게스트-앱-api) |
| 중복 등록 | 사전 확인 + 이름 있는 유일 제약. 위반은 `violates(제약 이름)`로 찾아 도메인 409로 바꾼다 | [동시성과 충돌](CLAUDE.md#동시성과-충돌) |
| 예약 비용 | 예약할 때 `room_rate`, `nights`, `base_amount`, `discount_amount`(0), `total_amount`를 이용에 저장한다. `stay_amount_check`가 계산이 어긋난 값을 막고, 정산은 저장값을 합친다 | [이용](CLAUDE.md#이용), [월별 정산](CLAUDE.md#월별-정산) |

## 5. 테스트

```bash
./gradlew test                              # 전체. Docker가 떠 있어야 한다
./gradlew test --tests '*StayServiceTest'   # 고친 곳만
```

- 테스트는 1280개다(2026-10-31, 전체 실행 실패 0). DB가 필요한 테스트는 Testcontainers로 실제 PostgreSQL 18에서 돈다(`TestcontainersConfiguration`). 운영 마이그레이션과 테스트 전용 마이그레이션(`src/test/resources/db/test-migration`, `V0_1` 같은 0.x 버전)을 함께 적용한다.
- 컨테이너를 실행 사이에 재사용하려면 `~/.testcontainers.properties`에 `testcontainers.reuse.enable=true`를 둔다. 없으면 매번 새로 만든다.
  - 새로 만들려면 `docker rm -f $(docker ps -aq --filter label=org.testcontainers.hash --filter ancestor=postgres:18)`
- 테스트는 더미 데이터를 넣지 않는다(`src/test/resources/config/application.properties`의 `urbanstay.seed.enabled=false`).
- 저장소 테스트는 롤백이 기본이다. 트랜잭션·동시성을 보는 Service·API 테스트는 커밋하고 끝나면 직접 지운다. 빈 테이블, 특정 id, 실행 순서를 가정하지 않는다.
- 동시성은 두 방식으로 본다.
  - 동시 요청: 두 스레드를 `CountDownLatch`로 함께 출발시킨다. 실행마다 어느 경로를 탈지 정해지지 않는다.
  - 순서 고정: 먼저 온 트랜잭션을 열어 둔 채 다음 요청이 잠금을 기다리는지(`pg_stat_activity`) 확인하고 커밋한다. 사전 확인은 통과했지만 DB에서 막히는 경로를 매번 같게 재현한다(`StayServiceTest`, `RoomServiceTest`, `GuestServiceTest`, `HotelServiceTest` 등). 예약 테스트는 `@Lock`이나 `on conflict do nothing`을 빼면 실패한다.
- 기존 데이터를 옮기는 마이그레이션은 별도 스키마에 이전 버전까지 적용해 행을 넣고, 새 버전을 적용해 확인한다(`RoomTypeMigrationTest`, `StayAmountMigrationTest`, `RoomStatusMigrationTest`).
- 세션 쿠키 속성과 로그인·로그아웃은 `RANDOM_PORT`로 띄운 서버에 실제 HTTP로 확인한다.

## 6. 더 보기

| 문서 | 내용 |
|---|---|
| [backend/CLAUDE.md](CLAUDE.md) | 백엔드 규칙 원문: [패키지 구조](CLAUDE.md#패키지-구조) · [보안](CLAUDE.md#보안) · [목록 조회](CLAUDE.md#목록-조회) · [엔티티](CLAUDE.md#엔티티) · [동시성과 충돌](CLAUDE.md#동시성과-충돌) · [테스트](CLAUDE.md#테스트) · [DB 마이그레이션](CLAUDE.md#db-마이그레이션-flyway) · [API 문서](CLAUDE.md#api-문서-springdoc) · [로컬 실행](CLAUDE.md#로컬-실행) |
| [docs/domain.md](../docs/domain.md) | 도메인 규칙 원본 |
| [docs/api-convention.md](../docs/api-convention.md) | 프론트엔드·백엔드 공통 API 규약(경로, 응답 형식, 목록, 검증, 인증, codegen) |
| [docs/backend-flow.md](../docs/backend-flow.md) | 백엔드 개발 플로우(업무 규칙 → API 계약 → 데이터 모델 → 트랜잭션 → 동시성 → 실패 처리 → 구현·검증 → 운영·관측) |
| [docs/code-convention.md](../docs/code-convention.md) | 코드 규칙(상수 관리) |
| [README.md](../README.md) | 과제 전체: 문제 정의, 해결 방식, 구현 범위, 프론트엔드 실행 |

Claude Code 스킬(`.claude/skills`)

| 스킬 | 쓸 때 |
|---|---|
| [backend-feature](../.claude/skills/backend-feature/SKILL.md) | 도메인 기능·API를 추가·변경하는 순서와 체크리스트 |
| [db-migration](../.claude/skills/db-migration/SKILL.md) | Flyway 스키마 변경, 기존 데이터 이전 |
| [domain-rules](../.claude/skills/domain-rules/SKILL.md) | 도메인 규칙 요약·찾아보기, 규칙을 바꿀 때의 순서 |
| [local-run](../.claude/skills/local-run/SKILL.md) | 로컬 실행, 더미 계정, 브라우저 확인 |
