---
name: backend-feature
description: 백엔드(Kotlin, Spring) 도메인 기능이나 API를 추가·변경할 때 따르는 작업 순서와 체크리스트. "백엔드 API 추가", "도메인 기능", "엔드포인트", "Kotlin", "Spring", "컨트롤러·서비스 구현", "백엔드 테스트" 같은 요청에 쓴다.
---

# 백엔드 기능 개발

경로는 저장소 루트 기준이다. 규칙 원문은 아래 문서에 있고, 여기에는 작업 순서와 찾을 곳만 적는다. 문서와 다르면 문서를 따른다.

## 1. 업무 규칙과 설계 (구현 전)

- [ ] 도메인 규칙·권한·용어는 `domain-rules` 스킬, 원본은 `docs/domain.md`. 문서에 없는 규칙은 임의로 정하지 않고 묻는다(루트 `CLAUDE.md` '필수 사항', 'Claude code의 규칙'). 규칙이 바뀌면 합의 후 `docs/domain.md`부터 고친다.
- [ ] `backend/CLAUDE.md`에서 그 도메인 절(예: '이용', '월별 정산')과 비슷한 기존 코드를 찾아 같은 방식으로 만든다.
- [ ] `docs/backend-flow.md`의 8단계를 순서대로 본다: ① 업무 규칙 ② API 계약 ③ 데이터 모델 ④ 트랜잭션 ⑤ 동시성 ⑥ 실패 처리 ⑦ 구현·검증 ⑧ 운영·관측. 뒤에서 모순이 나오면 앞의 결정을 고친다.
- [ ] 단계마다, 그리고 메인에게 보고할 때 네 가지를 짧게 적는다: 확인된 사실 / 아직 모르는 것 / 내가 내린 결정 / 검증 방법(`docs/backend-flow.md` '기록과 보고').

## 2. 패키지·이름·경로

`backend/CLAUDE.md` '패키지 구조'
- [ ] `urbanstay/{domain}/` 아래 `controller/{app|appadmin|hoteladmin}`, `dto/{app|appadmin|hoteladmin}`, `service`, `repository`, `entity`, `exception`.
- [ ] 컨트롤러 `{Domain}{App|AppAdmin|HotelAdmin}Controller`, DTO `{Domain}{Purpose}{App}{Request|Response}`(대표 응답은 Purpose 없음). 예: `StaySettlementHotelAdminController`, `StayCancelHotelAdminRequest`, `StayHotelAdminResponse`.
- [ ] 엔티티·리포지토리는 공유하고, 서비스는 앱별 정책이 다를 때만 나눈다.
- [ ] 다른 도메인은 그 도메인의 Service로만 쓴다(Repository 직접 사용 금지). 서비스 의존이 순환하지 않게 한다('계정' 절의 서비스 방향).
- [ ] 경로는 `common/ApiPaths` 상수로 시작한다. 예: `@RequestMapping(ApiPaths.HOTEL_ADMIN + ApiPaths.SETTLEMENTS)`.

## 3. 보안

`backend/CLAUDE.md` '보안', '인증' / `backend/src/main/kotlin/com/marco/assignment/handys/urbanstay/common/config/SecurityConfig.kt`
- [ ] 게스트 앱(`ApiPaths.APP`)은 로그인 없이 열린다. 회원 로그인이 필요하면 `MEMBER_APIS`에 `Endpoint(메서드, 경로)`를 더한다(문서의 401도 이 목록을 쓴다).
- [ ] 어드민 API는 기본으로 그 앱의 역할만 쓴다. 로그인 없이 열 어드민 API만 `PUBLIC_ADMIN_APIS`에 적는다.
- [ ] hotel-admin 마스터 전용: 메서드별로 막으면 `HOTEL_MASTER_APIS`(마스터 전용 조회 포함, `*`는 경로 한 칸), 경로 전체면 `HOTEL_MASTER_PATTERN`. operation 설명에 마스터 전용임을 적는다.
- [ ] 호텔 범위: `@AuthenticationPrincipal HotelAdminPrincipal`의 `hotelId`를 서비스에 넘긴다. 경로·본문으로 호텔 id를 받지 않는다. 대상은 호텔과 함께 찾고(`findByIdAndHotelId`) 없는 id와 다른 호텔의 id는 같은 404다.
- [ ] 회원 범위: `@AuthenticationPrincipal MemberPrincipal`의 id를 넘긴다.

## 4. 요청·응답·에러·문서

`backend/CLAUDE.md` '응답과 예외', '목록 조회', '상수', 'API 문서 (springdoc)' / `docs/api-convention.md` / `docs/code-convention.md`
- [ ] 응답은 `ApiResponse.success(data)`. data가 없으면 `ApiResponse<Nothing?>` + `success(null)`, 생성은 `@ResponseStatus(HttpStatus.CREATED)`. 목록은 `ApiResponse<PageResponse<T>>`와 `PageParams` 상수, 정렬은 서비스가 정하고 operation 설명에 적는다.
- [ ] 상태를 바꾸는 핸들러에는 모두 `@SuccessMessage("success.{대상}.{동작}")`, GET에는 붙이지 않는다(`SuccessMessageConventionTest`). 같은 문구는 같은 키를 쓴다.
- [ ] 에러: `{Domain}ErrorCode`에 코드·상태 → `messages.properties`에 `error.{CODE}` → 새 enum이면 `ErrorCodeMessageTest` 목록에 등록 → operation에 `@{Domain}ApiErrors(...)`. 새 도메인이면 `exception/`에 `{Domain}ApiErrors`를 둔다(`StayApiErrors` 참고).
- [ ] 검증 메시지는 공용 키 `{validation.*}`만 쓰고, 실제로 쓰는 키만 더한다. 필수 문자열 `@NotBlank` + `@Length(max = ..., message = "{validation.max-length}")` + `@Schema(maxLength)`, 선택 문자열 `@Size(max)`, 형식 있는 필수 문자열 `@PatternThenMaxLength`, 공백을 지울 필드 `TrimmedStringDeserializer`, 중첩 객체 `@Valid`.
- [ ] 요청만으로 검사할 수 없는 규칙은 서비스가 틀린 항목을 모아 `BusinessException(CommonErrorCode.INVALID_INPUT, fieldErrors)`로 한 번에 던진다.
- [ ] 날짜·시간·enum·불리언 입력 형식은 전역 설정이 정한다. 새 타입을 요청에 쓰면 '응답과 예외' 절을 먼저 본다.
- [ ] 문서 문구는 `messages.properties`의 `openapi.*` 키: 태그 `openapi.{group}.tag.{tag}`, `openapi.{group}.operation.{operationId}.summary|description|parameter.{name}`, 필드 `openapi.schema.{SchemaName}.{field}`. 태그는 도메인 패키지 이름, operationId는 메서드 이름(그룹 안에서 유일).

## 5. 데이터와 동시성

`backend/CLAUDE.md` '엔티티', '동시성과 충돌' / 스키마 변경은 `db-migration` 스킬
- [ ] 유일 값: 사전 확인 + 이름 있는 유일 제약. 서비스 안에서 `saveAndFlush`, `DataIntegrityViolationException`이 `violates(엔티티의 제약 이름 상수)`이면 도메인 409, 아니면 그대로 던진다. 범위 겹침은 배제 제약으로 같은 방식.
- [ ] 동시 수정: `@Version var version: Long`, 응답에 version, 수정 요청은 version 필수. 순서는 조회 → version 확인 → 중복 확인 → 엔티티 변경 → `saveAndFlush`이고 `OptimisticLockingFailureException`도 같은 409다.
- [ ] version과 따로 움직이는 값, 한 번만 일어나야 하는 변경: 조건부 UPDATE, 0행이면 409. `@Modifying(flushAutomatically = true, clearAutomatically = true)`, `updated_at`도 같은 문장에서(`Instant.now(clock)`), 응답용 엔티티는 다시 읽는다. 그 컬럼은 `@Column(updatable = false)`.
- [ ] 후보 중 하나를 고르는 변경: `@Lock(PESSIMISTIC_WRITE)`로 id 오름차순 잠금 → 다음 문장에서 다시 조회해 고른다. DB 제약은 안전망으로 둔다.
- [ ] 있으면 쓰고 없으면 만드는 행: `insert ... on conflict (유일 인덱스) do nothing` 뒤 다시 조회(네이티브라 Auditing·정규화를 거치지 않는다).
- [ ] 중복 확인 조회는 엔티티를 바꾸기 전에 한다. 지금 시각·오늘은 `Clock` 빈으로 구한다.
- [ ] open-in-view가 꺼져 있다. 트랜잭션 밖에서 응답을 만들면 `@EntityGraph`로 함께 읽는다.

## 6. 테스트 작성

`backend/CLAUDE.md` '테스트', 그리고 '보안'·'동시성과 충돌'·각 도메인 절의 테스트 항목
- [ ] DB가 필요하면 `TestcontainersConfiguration`을 `@Import`한다.
- [ ] 저장소 테스트는 롤백이 기본이고, 제약은 `flush()`로 확인한다.
- [ ] 트랜잭션 경계·커밋 시 제약·지연 로딩·동시성을 보는 Service·API 테스트는 테스트 트랜잭션 없이 커밋하고 끝나면 직접 지운다. 빈 테이블·id·실행 순서를 가정하지 않는다.
- [ ] 동시성: `CountDownLatch` 동시 요청과 순서를 고정한 경로 테스트(먼저 연 트랜잭션을 둔 채 늦은 쪽이 잠금을 기다리는지 `pg_stat_activity`로 보고 커밋, `StayServiceTest`). 변환 코드를 지키는 것은 순서 고정 테스트다.
- [ ] 인증: `with(user(HotelAdminPrincipal.from(master)))`, `with(user(MemberPrincipal.from(member)))`. 두 역할이 쓰는 API는 `@EnumSource(HotelAdminRole::class)`, 마스터 전용은 운영자 403과 바뀌지 않음을 확인한다.
- [ ] CSRF는 응답의 `XSRF-TOKEN` 쿠키를 받아 `cookie(xsrf)` + `X-XSRF-TOKEN` 헤더로 보낸다. `csrf()` post-processor는 쓰지 않는다.
- [ ] 세션·쿠키 속성·로그인/로그아웃·에러 디스패치는 `RANDOM_PORT` 서버에 실제 HTTP로 확인한다. 오늘 규칙은 `FixedClockConfiguration`.
- [ ] 정리 순서(외래 키): `stay` → `room_status_history` → `guest`(호텔 id로) → `room` → `room_type` → `hotel_admin` → `hotel`. 회원은 연결된 이용객 뒤에 지운다.
- [ ] 테스트 전용 메시지는 `src/test/resources/test-messages.properties`, 테스트용 컨트롤러는 테스트 클래스 안에 중첩하고 `@Import`한다.

## 7. 실행

`backend/CLAUDE.md` '로컬 실행'(서버 띄우기·더미 계정은 `local-run` 스킬). 모두 `backend/`에서 실행한다.
- [ ] Docker Desktop을 띄운다. `docker`가 PATH에 없어 실패하면 Docker Desktop의 `resources/bin`을 PATH에 더한다. 예(Git Bash): `PATH="$PATH:<Docker Desktop 설치 폴더>/resources/bin" ./gradlew ...`(사용자별 설치면 `%LOCALAPPDATA%\Programs\DockerDesktop`). `bootRun`도 같다.
- [ ] 개발 중에는 고친 곳의 테스트만 돌린다: `./gradlew test --tests '*StayServiceTest'`.
- [ ] 마지막에 전체 `./gradlew test`를 한 번 돌린다.
- [ ] 확인 방법(명령, 포트, Swagger `http://localhost:8080/swagger-ui.html`)을 보고에 적는다.

## 8. 문서와 PR

- [ ] `backend/CLAUDE.md`의 그 도메인 절에 판단 순서·에러 코드·제약·인덱스·테스트를 기존 절 형식으로 적는다.
- [ ] 공통 API 규칙이 바뀌면 `docs/api-convention.md`를 고친다. API가 바뀌면 프론트엔드 codegen이 필요하다(`docs/api-convention.md` 'codegen'). 프론트엔드 변경은 별도 PR.
- [ ] 주석은 달지 않는다. 꼭 필요한 복잡한 부분만, 쓰기 전에 묻는다.
- [ ] 커밋·브랜치·PR은 `pr-workflow` 스킬과 루트 `CLAUDE.md` '커밋 규칙', '브랜치 및 PR 규칙'. 커밋 전에 묻는다. PR 본문의 '논의하고 싶은 내용'에는 아직 모르는 것, '의사결정을 내린 것'에는 결정과 이유를 적는다.
