# 백엔드 작업 지침

백엔드(Kotlin, Spring Boot) 작업 시 따르는 규칙. 프론트엔드와 공통인 규칙은 docs/ 문서를 따른다.

## 참고 문서

- 도메인 뼈대: @../docs/domain.md
- 백엔드 개발 플로우: @../docs/backend-flow.md
- API 규약: @../docs/api-convention.md
- 코드 규칙: @../docs/code-convention.md

## 패키지 구조

- 기본 패키지는 `com.marco.assignment.handys.urbanstay`이다.
- 도메인별로 패키지를 나누고, 도메인 안은 하위 패키지로 나눈다.

```
urbanstay/
├─ common/
└─ {domain}/
   ├─ controller/
   │  ├─ app/          # 게스트 앱 API ({Domain}AppController)
   │  ├─ appadmin/     # 전체 어드민 앱 API ({Domain}AppAdminController)
   │  └─ hoteladmin/   # 호텔 운영자 앱 API ({Domain}HotelAdminController)
   ├─ dto/
   │  ├─ app/          # 예: HotelAppResponse
   │  ├─ appadmin/     # 예: HotelAppAdminResponse
   │  └─ hoteladmin/   # 예: HotelHotelAdminResponse
   ├─ service/
   ├─ repository/
   ├─ entity/
   └─ exception/       # 도메인 에러 코드 ({Domain}ErrorCode)와 문서용 어노테이션 ({Domain}ApiErrors)
```

- 게스트 앱, 전체 어드민 앱, 호텔 운영자 앱의 API는 정책이 다르므로 컨트롤러와 DTO를 앱별로 나눈다. 클래스 이름은 도메인 이름 뒤에 `App`/`AppAdmin`/`HotelAdmin`을 넣는다. 예: `HotelAppController`, `HotelAppAdminController`, `HotelHotelAdminController`, `RoomHotelAdminController`, `HotelHotelAdminResponse`
- DTO 이름은 `{Domain}{Purpose}{App}{Request|Response}`다. 도메인의 대표 응답에는 목적을 넣지 않는다. 예: `AccountLoginAppAdminRequest`(로그인 요청), `AccountAppAdminResponse`(전체 어드민 계정 응답)
- 엔티티와 리포지토리는 공유한다. 서비스는 앱별 정책이 다를 때만 나눈다.
- API 경로는 `common/ApiPaths`의 상수로 시작한다. 예: `@RequestMapping(ApiPaths.APP + "/hotels")`. 경로 리터럴을 직접 쓰지 않는다.

- 여러 도메인이 함께 쓰는 코드는 `common/`에 둔다.
- 다른 도메인을 쓸 때는 그 도메인의 Service를 통해서만 쓴다. 다른 도메인의 Repository를 직접 쓰지 않는다. 엔티티 간 JPA 연관관계는 허용한다.

## 응답과 예외

- 모든 응답은 API 규약의 공통 형식(`success / data / message / error`)으로 감싼다. 에러도 같은 형식이다.
- 예외는 전역에서 처리해 공통 에러 형식으로 바꾼다.
- 요청 본문을 읽지 못했거나 요청 파라미터가 맞지 않으면 400 `INVALID_INPUT`이다. 어느 필드인지 알 수 있으면 `fieldErrors`에 하나를 담는다(`GlobalExceptionHandler`).
  - 문서에 없는 필드: `validation.unknown-field`. 모든 앱의 JSON 본문에 적용한다(`spring.jackson.deserialization.fail-on-unknown-properties=true`).
  - non-null 프로퍼티의 빠진 필드·null, 빠진 필수 요청 파라미터: `validation.required`
  - non-null 원소 목록(예: `List<String>`)의 null 원소도 `validation.required`이고 필드는 원소 경로(예: `tags[0]`)다. Kotlin 모듈의 `StrictNullChecks`(기본 켜짐)가 막는다. `List<String?>`는 null 원소를 받는다.
  - 타입이 틀린 값(예: 문자열 자리에 배열·객체), 쿼리·경로 파라미터 타입 불일치: `validation.type`
  - 정수(`Int`·`Long`, nullable·목록 원소·중첩 객체 포함)의 타입 범위를 넘는 값도 `validation.type`이고 필드는 그 경로(예: `capacity`, `ids[1]`)다. Jackson은 이 오류를 `MismatchedInputException`이 아닌 `InputCoercionException`(경로는 담겨 있다)으로 던지므로 `GlobalExceptionHandler`가 함께 처리한다. 쿼리·경로 파라미터의 범위 초과도 `validation.type`이다.
  - enum은 상수 이름 문자열만 받는다(대소문자 구분). 숫자(예: `0`)와 없는 이름은 `validation.type`이다(`spring.jackson.datatype.enum.fail-on-numbers-for-enums=true`).
    - 빈 문자열과 공백만 있는 값도 `validation.type`이다. 앞뒤에 공백이 붙은 이름(예: `" VACANT"`)은 Jackson이 공백을 지운 이름으로 받는다(`RoomHotelAdminControllerTest`).
    - 요청 파라미터의 enum(예: 객실 목록의 `status`)은 Spring 변환기가 앞뒤 공백을 지워 받고, 비었거나 공백만 있으면 null(선택 파라미터면 거르지 않음)이며, 없는 이름은 `validation.type`이고 필드는 파라미터 이름이다.
    - 문서 스키마에는 값 목록(`enum`)이 나온다. nullable enum 응답 필드는 `type: [string, null]`이고 `enum`에는 null이 없다(예: 객실 상태 이력의 `fromStatus`).
  - `LocalDate`, `LocalDateTime`, `OffsetDateTime`은 ISO 8601 문자열(예: `2026-10-29`, `2026-10-29T10:00:00`, `2026-10-29T10:00:00+09:00`)만 받는다. 숫자(타임스탬프), 배열, 숫자 문자열, 다른 형식은 `validation.type`이다(`JacksonConfig`의 `isoDateTimeModule`, `@JsonFormat` 패턴으로 바꿀 수 없다). `OffsetDateTime`은 UTC로 바꿔 읽는다. 다른 날짜·시간 타입(예: `Instant`)을 요청에 쓰려면 먼저 `isoDateTimeModule`에 등록한다.
    - 요청 파라미터(쿼리·경로)의 `LocalDate`도 `YYYY-MM-DD`만 받는다. 모든 앱에 걸리는 전역 설정 `spring.mvc.format.date=iso`(`ISO_LOCAL_DATE`)가 지역 형식(`11/2/26`), 오프셋이 붙은 값(`2026-11-02+09:00`), `20261102`를 `validation.type`으로 막는다(`StayAppControllerTest`). 지금 날짜 파라미터는 게스트 앱 객실 유형 목록의 `checkInDate`·`checkOutDate`와 hotel-admin 이용 목록의 `checkInFrom`·`checkInTo`다.
  - `LocalTime`은 시와 분이 두 자리씩인 `HH:mm` 문자열(`00:00`~`23:59`, 예: `15:00`, `09:30`)만 받는다. 초가 붙은 값(`15:00:00`), 한 자리 시(`9:30`), `24:00`, 앞뒤 공백이 붙은 값, 숫자, 배열은 `validation.type`이다(`isoDateTimeModule`에 등록한 `ResolverStyle.STRICT`의 `HH:mm` 포매터). 응답도 같은 포매터의 `LocalTimeSerializer`(`isoDateTimeModule`에 등록)로 `HH:mm` 문자열이다. Jackson 기본 직렬화는 `15:00:00`이다.
    - 요청·응답의 `LocalTime` 필드에는 `@Schema(pattern = JacksonConfig.LOCAL_TIME_PATTERN, example = "15:00")`를 붙인다. springdoc 기본 스키마(`type: string`, `format: time-local`)에 pattern이 더해져 orval zod가 서버와 같은 규칙으로 검사한다.
    - DB 컬럼은 `time`이고 CHECK 제약(`extract(second from 컬럼) = 0`)으로 초가 있는 값을 막는다. 엔티티도 분 단위로 잘라 저장한다(예: `RoomType`).
  - Jackson의 스칼라 강제 변환은 끈다. 숫자·불리언을 문자열로, 문자열을 숫자·불리언으로, 실수를 정수로 바꾸지 않고 `validation.type`으로 응답한다. 문자열 대상은 `common/config/JacksonConfig`가, 나머지는 `application.properties`의 `spring.jackson.mapper.allow-coercion-of-scalars=false`, `spring.jackson.deserialization.accept-float-as-int=false`가 막는다.
  - 요청 파라미터(쿼리·경로 변수 등)의 불리언은 소문자 `true`, `false`만 받고, 그 밖의 값(`1`·`yes`·`on`·`TRUE`, 빈 값, 앞뒤 공백이 붙은 값)은 `validation.type`이다. `common/request/RequestParameterBindingAdvice`가 모든 컨트롤러의 `@InitBinder`에 `StrictBooleanEditor`를 등록한다(`Converter`로 등록하면 실패했을 때 Spring이 기본 `CustomBooleanEditor`로 다시 변환해 이 값들을 받아 버린다). 기본값이 있는 파라미터의 빈 값은 Spring이 변환 전에 기본값으로 바꾼다.
  - 필드 이름은 Bean Validation과 같은 경로 형식이다. 예: `name`, `address.city`, `rooms[0].name`. 요청 파라미터는 파라미터 이름이다.
  - 중첩 요청 객체 필드에는 `@Valid`를 붙여 안쪽 필드까지 검증한다(예: 호텔 등록의 `master`, 오류 필드는 `master.loginId`).
  - 필드를 알 수 없는 오류(JSON 문법 오류, 빈 본문, 본문 전체의 타입 불일치, 지원하지 않는 미디어 타입)는 빈 `fieldErrors`다.
  - Jackson은 첫 오류에서 멈추므로 본문을 읽는 오류는 `fieldErrors`가 하나다. Bean Validation 오류는 틀린 필드를 모두 담는다.
- 응답의 시각(`Instant`)은 Jackson 기본 직렬화인 UTC ISO 8601 문자열이다(예: `2026-10-30T06:59:32.123456Z`). 초 아래 자릿수는 값에 따라 없거나 3자리씩 늘고(`...32Z`, `...32.120Z`, `...32.123456Z`), DB(`timestamptz`)에서 읽은 값은 마이크로초까지다. 문서 스키마는 `type: string`, `format: date-time`이고 필드에 예시를 적는다. 실제 응답 형식은 API 테스트로 고정한다(객실 상태 이력의 `changedAt`).
- 앞뒤 공백을 지운 값으로 검사할 문자열 필드에는 `@JsonDeserialize(using = TrimmedStringDeserializer::class)`(`common/request`)를 붙인다. 본문을 읽을 때 Kotlin `trim()`으로 지우므로 `@NotBlank`·길이·형식 제약이 지운 값에 걸린다. 타입·null 처리는 기본 문자열과 같다. 저장할 값의 정규화는 엔티티가 따로 한다(예: `Hotel.normalize`).
- 문자열 요청 파라미터(예: 검색어)는 컨트롤러의 `@InitBinder`에서 `TrimmedStringEditor`(`common/request`)를 등록해 앞뒤 공백을 지우고, 비면 null로 받는다. `@Size` 같은 제약은 지운 값에 걸린다.
- 필수 문자열(`@NotBlank`)은 문서에 `minLength: 1`로 나온다. `@Size`는 문서의 minLength를 `min`(기본 0)으로 덮으므로 필수 문자열의 최대 길이는 `@Size` 대신 Hibernate Validator의 `@Length(max = ..., message = "{validation.max-length}")`로 검사하고 문서 길이는 `@Schema(maxLength = ...)`로 적는다. 선택 문자열은 `@Size(max)`를 그대로 쓴다.
- 형식이 있는 필수 문자열(예: 전화번호)은 `@NotBlank`와 `@PatternThenMaxLength`(`common/validation`)를 붙이고 `@Pattern`·`@Size`는 쓰지 않는다. 필드마다 오류가 하나만 난다. 빈 값은 `validation.required`, 형식이 틀리면 길이와 관계없이 형식 메시지, 형식이 맞는데 길면 `validation.max-length`다. 문서의 형식과 길이는 `@Schema(pattern = ..., maxLength = ...)`로 적는다.
- 요청만으로 검사할 수 없는 입력 규칙(예: 오늘 이후 날짜, 최대 숙박 수)은 서비스가 검사해 `BusinessException(CommonErrorCode.INVALID_INPUT, fieldErrors)`로 던진다. 틀린 항목을 모아 한 번에 던진다(이용 절).
  - `InvalidField(field, messageKey, arguments)`의 `arguments`가 문구의 `{이름}` 자리를 채운다. 예: `validation.max-nights`의 `{max}`에 최대 숙박 수(`Stay.MAX_NIGHTS`)

## 목록 조회

- 목록 API는 `ApiResponse<PageResponse<T>>`(`common/response/PageResponse`)로 응답한다. 서비스가 돌려준 `Page`를 `PageResponse.from(page.map(...))`으로 바꾼다. 문서 스키마 이름은 `PageResponse{항목 스키마}`(예: `PageResponseHotelAppAdminResponse`)이고 모든 필드가 필수다.
  - 예외: 게스트 앱 객실 유형 목록과 hotel-admin 객실 유형 목록은 페이지 없이 `ApiResponse<List<T>>`로 전부 준다. 한 호텔의 유형 수가 적고, 화면이 한 번에 모두 보여주거나(게스트 앱 API 절) 객실 생성·수정의 선택 상자와 거르기에 쓰기 때문이다(객실 유형 절).
- `page`(0~99, 기본 0), `size`(1~100, 기본 10)는 `@RequestParam`으로 받고 `common/request/PageParams` 상수를 쓴다(`@Min`·`@Max`, 메시지 `validation.min`·`validation.max`). 범위를 벗어나면 메서드 검증으로 400 `INVALID_INPUT`이고 `fieldErrors`의 필드는 파라미터 이름이다. 100페이지 밖의 항목은 검색으로 좁혀 찾는다.
- 정렬 기준은 서비스에서 정하고 operation 설명에 적는다.
- 사람이 보는 이름으로 정렬하는 컬럼에는 ICU collation `natural_sort`(`provider = icu, locale = 'und-u-kn'`)를 지정한다. 예: `name varchar(50) collate natural_sort`(`V6__create_room.sql`이 collation을 만든다).
  - 이유: DB 기본 collation(postgres:18 이미지 기본값 `en_US.utf8`)은 숫자도 글자 순서(`1001`, `101`, `99`)이고, 한글이 영문보다 앞에 오는 등 환경(collation)마다 순서가 달라진다. `natural_sort`는 이름 속 숫자를 숫자 크기로 비교하고(`99`, `101`, `1001`, `B동 99`, `B동 101`) 숫자, 영문, 한글 순이며, 대소문자만 다르면 소문자가 먼저다(`deluxe`, `Deluxe`).
  - 결정적(deterministic, 기본값) collation이라 같은 값 비교(유일 제약, 중복 확인)는 지금처럼 글자 그대로, 대소문자를 구분한다. `upper`·LIKE 검색과 이스케이프도 그대로 동작한다.
  - 정렬 순서는 operation 설명에 적고, 숫자·영문 대소문자·한글이 섞인 이름으로 저장소 테스트와 API 테스트에서 확인한다.
  - 이름이 유일한 범위의 목록에도 id를 둘째 기준으로 둔다(예: 객실 목록은 이름 오름차순, 같으면 id 오름차순).
  - 예외: 호텔 이름(`hotel.name`)은 `natural_sort`가 아니다. 게스트 앱 호텔 목록은 DB 기본 collation의 이름순이다(게스트 앱 API 절).
  - 객실 유형 이름(`room_type.name`)도 `natural_sort`다(`V11__create_room_type.sql`). 두 유형 목록은 이름 오름차순, 같으면 id 오름차순이다.
- 부분 일치 검색은 Spring Data 파생 쿼리(예: `findByNameContainingIgnoreCase`)로 한다. 파생 쿼리는 `\`, `%`, `_`를 이스케이프하고 `escape '\'`를 붙여 입력을 글자 그대로 찾는다. `@Query`로 LIKE를 직접 쓰면 이스케이프되지 않는다.
- 한 필드 검색과 선택 필터를 AND로만 묶는 목록은 조합마다 파생 쿼리를 두고 서비스가 고른다. 예: 객실 목록의 `findByHotelId`, `findByHotelIdAndStatus`, `findByHotelIdAndNameContainingIgnoreCase`, `findByHotelIdAndStatusAndNameContainingIgnoreCase`와 같은 조합에 `RoomTypeId`를 더한 넷(여덟 가지, 서비스가 `when`으로 고른다). 이스케이프와 서비스가 정한 정렬이 그대로 적용된다. 필터가 더 늘어 조합이 감당하기 어려워지면 `Specification`으로 옮긴다.
  - 객실 목록은 여덟 가지지만 파생 쿼리로 둔다. `Specification`으로 옮기면 검색어 이스케이프를 직접 해야 해서, 공용 검색 조건(이스케이프)을 둔 뒤 옮긴다.
- 여러 필드 중 하나에 들어 있으면 찾는 검색(OR)과 선택 필터가 함께 있어 파생 쿼리로 쓰기 어려우면 `Specification`(`JpaSpecificationExecutor`)으로 한다. 예: `account/repository/HotelAdminSpecifications.search`(이름 또는 아이디 검색 + 활성 여부 필터)
  - 이스케이프는 파생 쿼리와 같게 직접 한다. 검색어를 `EscapeCharacter.DEFAULT.escape`로 바꿔 `%검색어%`를 만들고, `like(..., EscapeCharacter.DEFAULT.escapeCharacter)`로 `escape '\'`를 붙인다.
  - 대소문자 구분 없는 비교는 파생 쿼리처럼 컬럼과 검색어 양쪽에 DB의 `upper`를 건다. 검색어만 Kotlin에서 대소문자를 바꾸면 DB의 `upper`와 결과가 달라지는 글자(예: `ß`)가 있을 수 있다.
  - 검색어는 `HibernateCriteriaBuilder.value(...)`로 넘겨 바인딩 파라미터로 만든다. `CriteriaBuilder.literal(...)`은 검색어를 SQL 문자열에 그대로 넣는다.
  - 새 검색은 이 세 규칙을 담은 `common/repository/SearchPredicates`를 쓴다. `containsIgnoreCase`는 대소문자 구분 없는 부분 일치, `phoneContains`는 저장값과 검색어 양쪽의 하이픈을 뺀 부분 일치이고, 하이픈을 빼면 빈 검색어는 null(전화번호로 거르지 않음)이다. 예: `HotelSpecifications.search`(호텔 이름·주소·대표 전화번호), `StaySpecifications.search`(이용객 이름·전화번호). `GuestSpecifications`, `HotelAdminSpecifications`는 아직 자기 함수를 쓴다.
  - `%`, `_`, `\`가 글자 그대로 찾히는지 저장소 테스트와 API 테스트로 확인한다. 이스케이프를 빼면 실패하는지도 한 번 확인한다.

## 보안

- 경로별 접근 규칙은 `common/config/SecurityConfig`에 둔다. 필터 체인은 어드민 경로용, 게스트 경로용(`ApiPaths.APP`), 그 밖의 경로용 세 개다.
  - `ApiPaths.APP`: 로그인 없이 쓴다. 회원 로그인이 필요한 API만 `SecurityConfig.MEMBER_APIS`(HTTP 메서드 + 경로)에 적어 `Role.MEMBER`로 막는다(로그인하지 않으면 401 `UNAUTHORIZED`). 지금은 내 정보 조회, 로그아웃, 예약, 내 이용 목록이다. 접근 규칙과 API 문서(app 그룹의 401 자동 에러)가 이 목록 하나를 함께 쓴다.
  - `ApiPaths.APP_ADMIN`: `Role.APP_ADMIN`만, `ApiPaths.HOTEL_ADMIN`: `Role.HOTEL_ADMIN`만 쓴다.
  - 호텔 계정은 모두 `Role.HOTEL_ADMIN`을 받고, 마스터는 `Role.HOTEL_MASTER`도 받는다. 마스터만 쓰는 API는 `Role.HOTEL_MASTER`로 막는다.
    - 경로 규칙(`HOTEL_MASTER_PATTERN`)으로 막는다. 지금은 운영자 관리(`ApiPaths.HOTEL_ADMIN + ApiPaths.OPERATORS` 아래 전부)다. `HOTEL_ADMIN_PATTERN` 규칙보다 먼저 둔다(먼저 맞는 규칙을 쓴다). `/operators/**`는 `/operators`도 포함한다.
    - 조회는 둘 다 쓰고 변경만 마스터가 쓰는 API는 메서드와 경로를 함께 적는 `SecurityConfig.HOTEL_MASTER_APIS`(`Endpoint(HTTP 메서드, 경로)`)로 막는다. 지금은 객실 유형 생성·수정(`POST /room-types`, `PUT /room-types/*`)과 객실 생성·수정(`POST /rooms`, `PUT /rooms/*`)이다. `*`는 경로 한 칸이라 객실 상태 변경(`PUT /rooms/{roomId}/status`)은 마스터·운영자 모두 쓴다.
    - 마스터만 쓰는 조회도 이 목록에 메서드와 경로로 적는다. 지금은 월별 정산(`GET /settlements`, `GET /settlements/stays`, 월별 정산 절)이다.
    - 운영자 계정과 전체 어드민 계정은 403 `FORBIDDEN`, 로그인하지 않으면 401 `UNAUTHORIZED`다. 어드민 그룹 문서에 자동으로 붙는 401·403과 같으므로 문서에 따로 적을 에러는 없고, operation 설명에 마스터 전용임을 적는다.
  - 로그인 없이 여는 어드민 API는 `SecurityConfig.PUBLIC_ADMIN_APIS`(HTTP 메서드 + 경로)에만 적는다. 접근 규칙(permitAll)과 API 문서(401·403 자동 에러 제외)가 이 목록 하나를 함께 쓴다. 지금은 전체 어드민 로그인과 호텔 운영자 로그인이다. 열린 API에도 CSRF는 걸린다.
  - Swagger UI와 API 문서(`/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`): 로그인 없이 연다.
  - 그 밖의 경로(actuator 포함)는 막는다. 에러 디스패치는 원래 상태 코드를 유지하도록 연다.
  - 기본 폼 로그인, HTTP Basic, 기본 로그아웃은 끈다.
- CSRF는 어드민 API에만 SPA 모드(`csrf.spa()`)로 건다. 쿠키 없이 들어온 어드민 API 요청의 응답(401 포함)에 `XSRF-TOKEN` 쿠키(스크립트에서 읽을 수 있음)가 발급되고, 상태를 바꾸는 요청은 같은 값을 `X-XSRF-TOKEN` 헤더로 보낸다. 게스트 API에는 CSRF 필터가 없다. 회원 세션 쿠키가 `SameSite=Lax`라 다른 사이트에서 온 변경 요청에는 세션 쿠키가 실리지 않는다.
- 보안 에러는 `SecurityErrorHandler`가 공통 형식으로 응답한다.
  - 로그인 안 함: 401 `UNAUTHORIZED`
  - 권한 없음: 403 `FORBIDDEN`
  - CSRF 토큰 없음·불일치: 403 `INVALID_CSRF_TOKEN`. CSRF 검사가 인가보다 먼저라서 로그인하지 않고 토큰 없이 보낸 상태 변경 요청도 이 코드다.
- 컨트롤러에서 발생한 `AccessDeniedException`, `AuthenticationException`은 `GlobalExceptionHandler`가 다시 던져 Spring Security가 401·403으로 응답한다.
- 세션은 서버 메모리에 두고 8시간 유지한다. 세션 쿠키는 HttpOnly, SameSite=Lax다(`application.properties`). 게스트 API는 회원가입·로그인 말고는 세션을 만들지 않는다.
- 게스트 체인의 SecurityContext는 세션 속성 `URBANSTAY_MEMBER_SECURITY_CONTEXT`(어드민은 기본 키)에 따로 둔다. 같은 세션에 어드민 인증이 있어도 게스트 API에서는 로그인하지 않은 것이고, 회원 세션으로 어드민 API를 부르면 401 `UNAUTHORIZED`다. 회원 세션은 요청마다 다시 확인하지 않는다(회원을 바꾸는 API가 없다).
- 로그인한 세션은 요청마다 계정을 다시 확인한다. 어드민 필터 체인의 SecurityContext 저장소를 `VerifyingSecurityContextRepository`(`common/security`)로 감싼다.
  - 세션에서 SecurityContext를 처음 꺼낼 때(인가 전) `SessionAuthenticationVerifier` 빈이 모두 통과시켜야 그 인증을 쓴다. 하나라도 거절하면 세션을 무효화하고 로그인하지 않은 요청으로 처리해 401 `UNAUTHORIZED`로 응답한다. CSRF 검사는 그보다 먼저다.
  - 도메인은 자기 계정의 확인 규칙을 `SessionAuthenticationVerifier` 빈으로 둔다. 자기 principal이 아니면 통과시킨다.
  - 호텔 계정은 `HotelAdminSessionVerifier`가 DB에서 다시 읽어, 없거나 비활성이거나 `credential_version`이 세션 값과 다르면 거절한다. 이름 변경은 세션을 끊지 않는다.
  - 전체 어드민 세션은 확인하지 않는다(어드민 계정을 바꾸는 API가 아직 없다).
- 테스트
  - 로그인 사용자는 `with(user("tester").roles(Role.APP_ADMIN.name))`로 만든다. 호텔 계정 principal이 필요한 API(세션의 호텔로 범위를 정하는 API)는 저장한 계정으로 만든 principal을 넣는다. 예: `with(user(HotelAdminPrincipal.from(master)))`. 회원 API도 같다. 예: `with(user(MemberPrincipal.from(member)))`
  - `user(...)`는 SecurityContext를 직접 넣으므로 세션 속성 키 분리(어드민·회원)는 확인하지 못한다. 키 분리와 회원 세션은 `RANDOM_PORT` 서버에서 실제로 가입·로그인해 확인한다(`MemberAppControllerTest`).
  - `user(...)`로 넣은 인증은 테스트가 넣은 SecurityContext를 그대로 써서, principal이 `HotelAdminPrincipal`이어도 요청마다 하는 계정 확인을 거치지 않는다(DB에서 비활성으로 바꿔도 통과한다). 호텔 계정의 세션 동작은 실제 로그인으로 확인한다.
  - CSRF 토큰은 어드민 API 응답의 `XSRF-TOKEN` 쿠키를 받아 `cookie(xsrf)`와 `header("X-XSRF-TOKEN", xsrf.value)`로 보낸다. `csrf()` post-processor는 쓰지 않는다. 캐시된 컨텍스트의 CsrfFilter 저장소를 세션 저장소로 바꿔 다른 테스트에 영향을 준다.
  - `@WebMvcTest`는 `SecurityConfig`, `JacksonConfig`를 읽지 않으므로 `SecurityConfig`, `JacksonConfig`, `SecurityErrorHandler`, `ErrorResponseFactory`를 `@Import`한다. 테스트용 컨트롤러는 열린 경로나 검증할 앱 경로 아래에 둔다.
  - 세션 쿠키 속성과 에러 디스패치는 서블릿 컨테이너 동작이라 MockMvc로 확인할 수 없다. `RANDOM_PORT`로 띄운 서버에 HTTP로 요청한다.
  - 로그인·로그아웃 API는 가짜 사용자 없이 `RANDOM_PORT` 서버에 실제 세션·`XSRF-TOKEN` 쿠키를 주고받으며 확인한다.

## 인증

- 로그인·로그아웃·내 정보 경로는 `{앱 경로}/auth/login`, `/auth/logout`, `/auth/me`다(`ApiPaths.AUTH`, `ApiPaths.LOGIN`).
- 인증은 앱마다 따로 만든다. 앱의 인증 서비스(`AppAdminAuthService`, `HotelAdminAuthService`, 게스트 앱 회원은 `MemberAuthService`)가 그 앱의 `UserDetailsService`와 `PasswordEncoder`로 `DaoAuthenticationProvider`를 만들어 자기 `ProviderManager`에 넣는다. 다른 앱의 계정으로는 인증되지 않는다.
  - Spring Boot의 전역 `AuthenticationManager`는 쓰지 않는다. 앱별 매니저를 `AuthenticationManager` 타입 빈으로 만들지 않는다. 그런 빈이 둘 이상이고 `UserDetailsService` 빈도 둘 이상이면 전역 매니저를 만들다가 시작에 실패한다.
  - 없는 아이디와 틀린 비밀번호는 `DaoAuthenticationProvider`가 같은 예외로, 처리 시간 차이를 줄여 처리한다. 서비스는 이를 도메인 에러(`INVALID_CREDENTIALS`, 401)로 바꾼다. 계정 조회 중 오류는 로그인 실패가 아니라 500으로 응답한다.
  - 로그인할 수 없는 계정(예: 비활성 호텔 계정)은 `UserDetailsService`가 찾지 못한 것으로(`UsernameNotFoundException`) 처리해 없는 아이디와 같은 응답, 같은 처리 시간 균등화를 탄다.
  - `ProviderManager`는 인증 뒤 입력한 비밀번호와 principal의 비밀번호 해시를 지운다(`CredentialsContainer`). 그래서 세션에 비밀번호가 남지 않는다. 직접 만든 principal(`HotelAdminPrincipal`)도 `CredentialsContainer`를 구현한다.
  - 호텔 계정의 principal(`HotelAdminPrincipal`)은 계정 id, 호텔 id, `credential_version`을 담는다. 응답에 쓰는 이름 같은 값은 세션이 아니라 DB에서 읽는다.
  - 로그인한 호텔 계정의 호텔로 범위를 정하는 API는 컨트롤러에서 `@AuthenticationPrincipal HotelAdminPrincipal`을 받아 `hotelId`를 서비스에 넘긴다. 경로나 본문으로 호텔 id를 받지 않는다. springdoc은 이 파라미터를 문서에 넣지 않는다.
  - `UserDetailsService` 빈이 셋이라 시작할 때 Spring Security가 전역 매니저에 쓰지 않는다는 WARN 로그(`Found 3 UserDetailsService beans`)를 남긴다. 전역 매니저를 쓰지 않으므로 정상이다.
- 세션 처리는 `common/security/LoginSessionHandler`가 Spring Security 구현체로 한다. `SecurityConfig`가 필터 체인과 같은 CSRF 토큰 저장소·SecurityContext 저장소를 넘겨 앱별로 만든다.
  - 어드민용 빈(`loginSessionHandler`, `@Primary`)은 어드민 CSRF 토큰 저장소를 받는다. 회원용 빈(`SecurityConfig.MEMBER_LOGIN_SESSION_HANDLER`)은 CSRF 토큰 저장소 없이(null) 회원 SecurityContext 저장소를 받고, 컨트롤러가 `@Qualifier`로 고른다. CSRF 저장소가 없으면 아래의 CSRF 처리(새 토큰 발급, CSRF 쿠키 삭제)를 건너뛴다.
  - 로그인: 세션이 이미 있으면 세션 ID를 바꾸고(`ChangeSessionIdAuthenticationStrategy`), CSRF 토큰을 새로 만들어 응답에 새 `XSRF-TOKEN` 쿠키를 싣고(`CsrfAuthenticationStrategy`), SecurityContext를 세션에 저장한다.
  - 로그아웃: CSRF 쿠키를 지우고(`CsrfLogoutHandler`), 세션 쿠키를 만료시키고(`CookieClearingLogoutHandler`, 이름은 `server.servlet.session.cookie.name`), 세션을 무효화하고 SecurityContext를 비운다(`SecurityContextLogoutHandler`).
  - CSRF 토큰 저장소는 쿠키다. 서버는 토큰을 기억하지 않으므로, 로그인 후 이전 토큰이 거절되는 것은 쿠키가 새 값으로 바뀌어 이전 헤더 값과 맞지 않기 때문이다.

## 계정

- 계정은 `account` 도메인에 둔다. 전체 어드민은 `app_admin` 테이블(`AppAdmin`)에, 호텔 계정(마스터·운영자)은 `hotel_admin` 테이블(`HotelAdmin`)에 저장한다. 따로 저장하므로 같은 이메일을 양쪽 아이디로 써도 된다.
- 로그인 아이디는 이메일이다. 저장하거나 조회하기 전에 `LoginId.normalize`로 앞뒤 공백을 지우고 소문자로 바꾼다. DB도 CHECK 제약으로 정규화된 로그인 아이디와 공백이 아닌 이름만 받는다.
- 비밀번호는 `PasswordEncoder` 빈(`common/config/PasswordEncoderConfig`, `PasswordEncoderFactories.createDelegatingPasswordEncoder()`, bcrypt)으로 해시해 저장한다.
- 로그인 아이디(이메일)를 받는 요청 필드는 `TrimmedStringDeserializer`, `@NotBlank`, `@PatternThenMaxLength(regexp = LoginId.PATTERN, max = 254, message = "{validation.email}")`를 붙이고 문서에 `pattern`, `maxLength`를 적는다.
  - 형식은 `^[\x21-\x3F\x41-\x7E]+@[\x21-\x2D\x2F-\x3F\x41-\x7E]+(\.[\x21-\x2D\x2F-\x3F\x41-\x7E]+)+$`이다. 영문 자판 글자만(공백 제외) 쓰고, 도메인은 빈 조각 없이 점으로 나눈 두 조각 이상이다.
  - 이유: `\x` 범위만 써서 서버(Java)와 zod(JS)가 같게 판단하고(`\s`는 둘의 범위가 다르다), 조각마다 점을 빼 되돌아가기가 없어 처리 시간이 길이에 비례한다(`PatternThenMaxLength`는 길이보다 형식을 먼저 검사한다).
- 비밀번호 규칙은 계정을 만들거나 비밀번호를 바꾸는 모든 요청이 함께 쓴다.
  - 8~64자, 영문과 숫자를 모두 넣고, 영문 자판의 글자(ASCII 0x20~0x7E)만 쓴다. ASCII로 제한해 bcrypt의 72바이트 한도를 넘지 않는다.
  - 필드에 `@NotBlank`와 `@Password`(`common/validation`)를 붙이고 `TrimmedStringDeserializer`는 붙이지 않는다. 앞뒤 공백도 비밀번호다.
  - 빈 값·공백만 있는 값은 `validation.required` 하나, 규칙을 어기면 `validation.password` 하나다(`@Password`는 빈 값을 건너뛴다).
  - 문서는 `@Schema(minLength = Password.MIN_LENGTH, maxLength = Password.MAX_LENGTH, pattern = Password.PATTERN)`로 적는다.
  - 로그인 요청의 비밀번호는 규칙을 검사하지 않고 `@NotBlank`만 붙인다.
- 호텔 계정(`hotel_admin`)
  - 호텔(`hotel_id`)에 속하고 역할(`HotelAdminRole`: `MASTER`, `OPERATOR`), 활성 여부(`active`), 로그인 정보 버전(`credential_version`), 낙관적 잠금 버전(`version`)을 가진다. 이름은 앞뒤 공백을 지워 저장한다.
  - 로그인 아이디는 모든 호텔 계정을 통틀어 유일하다(`hotel_admin_login_id_key`). 사전 확인(수정은 자기 자신을 빼고 `existsByLoginIdAndIdNot`)과 함께 이 제약 위반도 `AccountErrorCode.LOGIN_ID_DUPLICATED`(409)로 바꾼다.
  - 호텔마다 마스터는 하나다(부분 유일 인덱스 `hotel_admin_master_key`).
  - `credential_version`은 0에서 시작한다. 기존 세션을 끊어야 하는 변경(비활성화, 비밀번호 재설정, 아이디 변경)에서 올린다. 이름 변경, 다시 활성화는 올리지 않는다.
    - 활성 상태 변경은 활성 → 비활성일 때만 올린다. 다시 활성화는 비활성화 때 이미 세션이 끊겼으므로 올리지 않고, 끊긴 세션은 다시 활성화해도 되살아나지 않는다. 지금과 같은 상태로의 변경은 아무것도 바꾸지 않는다(version도 그대로).
    - 아이디 변경은 `LoginId.normalize`한 값이 지금과 다를 때만 올린다. 대소문자·앞뒤 공백만 다른 아이디는 같은 아이디라 올리지 않고 중복으로도 보지 않는다.
    - 비밀번호 재설정은 같은 비밀번호여도 항상 올린다.
    - 엔티티 메서드(`HotelAdmin.update`, `HotelAdmin.resetPassword`, `HotelAdmin.changeActive`)가 올린다. 서비스가 직접 셈하지 않는다.
  - `version`은 호텔(`hotel.version`)과 같은 낙관적 잠금이다(`V4__add_hotel_admin_version.sql`). 정보 수정은 요청의 `version`이 다르면 409 `AccountErrorCode.HOTEL_ADMIN_MODIFIED`다.
    - 비밀번호 재설정도 엔티티를 바꾸므로 version이 올라간다. 그사이 열어 둔 정보 수정 화면의 저장은 409가 된다(의도한 동작).
    - 재설정과 활성 상태 변경은 `version`을 받지 않는다. 같은 계정의 다른 변경과 동시에 처리돼 flush 때 막히면 같은 409 `HOTEL_ADMIN_MODIFIED`다. 활성 상태 변경도 상태가 바뀌면 version이 올라간다.
  - 호텔 계정의 변경은 `HotelAdminService`(`createMaster`, `createOperator`, `update`, `resetPassword`, `changeActive`)가 한다. 순서는 version 확인 → 아이디 중복 확인 → 엔티티 변경 → `saveAndFlush`이고, 유일 제약 위반과 `OptimisticLockingFailureException`의 변환(`translateConflicts`)을 함께 쓴다. version 충돌과 아이디 중복이 겹치면 version 충돌이 먼저다.
    - `createOperator`는 아이디 중복 확인까지 한다. `createMaster`의 중복 확인은 호텔 중복 확인 뒤에 해야 해서 `HotelService.create`가 따로 한다.
  - 마스터는 호텔 등록(`HotelService.create`)이 계정 도메인의 `HotelAdminService`로 같은 트랜잭션에서 만든다. 사전 확인은 호텔 중복 → 아이디 중복 순서이고, 저장은 호텔 → 마스터 순서다. 마스터 저장이 실패하면 호텔도 남지 않는다.
  - 전체 어드민의 마스터 관리(`ApiPaths.APP_ADMIN + "/hotels/{hotelId}/master"`의 조회·정보 수정과 `/password` 재설정, `AccountHotelMasterAppAdminController`)는 `HotelMasterService`가 한다. 호텔이 없으면 `HotelService.getHotel`의 404 `HOTEL_NOT_FOUND`, 호텔은 있는데 마스터가 없으면 404 `AccountErrorCode.HOTEL_MASTER_NOT_FOUND`다. 찾은 마스터의 변경은 `HotelAdminService`에 맡긴다.
    - 순환 의존을 피해 서비스를 나눈다. `HotelService`가 마스터 생성에 `HotelAdminService`를 쓰므로 `HotelAdminService`는 호텔 도메인 Service를 쓰지 않는다. 호텔 확인이 필요한 계정 기능은 `HotelMasterService`, `HotelOperatorService`처럼 따로 두어 `HotelMasterService → HotelService → HotelAdminService`, `HotelMasterService → HotelAdminService` 방향만 둔다. `HotelOperatorService`도 같은 방향이다.
  - 마스터의 운영자 관리(`ApiPaths.HOTEL_ADMIN + ApiPaths.OPERATORS`의 등록·목록·조회·정보 수정과 `/password` 재설정, `/active` 활성 상태 변경, `AccountHotelOperatorHotelAdminController`)는 `HotelOperatorService`가 한다. 마스터만 쓴다(보안 절).
    - 대상 호텔은 로그인한 마스터 세션의 `HotelAdminPrincipal.hotelId`다. 등록은 `HotelService.getHotel(hotelId)`로 호텔을 읽어 `HotelAdminService.createOperator`에 맡긴다.
    - 조회·변경할 계정은 같은 호텔의 `OPERATOR`만 찾는다(`findByIdAndHotelIdAndRole`). 없는 id, 다른 호텔의 계정, 마스터(자기 자신 포함)의 id는 모두 404 `AccountErrorCode.HOTEL_OPERATOR_NOT_FOUND`다. 다른 호텔 계정의 존재를 알리지 않고, 마스터 계정은 이 API로 바꾸지 않기 위해서다. 찾은 운영자의 변경은 `HotelAdminService`에 맡긴다.
    - 목록은 같은 호텔의 `OPERATOR`만 활성·비활성 모두 id 내림차순으로 준다. `active`(선택)로 상태를 거르고, `keyword`(선택, 100자)는 이름 또는 아이디에서 찾는다(`HotelAdminSpecifications.search`, 목록 조회 절). 호텔별 조회에 `hotel_admin_hotel_id_idx`(`V5__add_hotel_admin_hotel_id_index.sql`)를 쓴다.
- `AppAdminUserDetailsService`가 로그인 아이디로 전체 어드민을 읽고 `Role.APP_ADMIN`을 준다. `HotelAdminUserDetailsService`는 활성 호텔 계정만 읽고 `Role.HOTEL_ADMIN`(마스터는 `Role.HOTEL_MASTER`도)을 준다. 이 빈들이 있어서 Spring Boot의 기본 사용자(`user`, 생성 비밀번호)는 만들어지지 않는다.
- 첫 전체 어드민은 백엔드가 뜰 때(`account/config/InitialAdminConfig`의 `ApplicationRunner`) `urbanstay.initial-admin.*`(`login-id`, `password`, `name`) 설정값으로 만든다.
  - 전체 어드민이 하나도 없을 때만 만들고, 하나라도 있으면 아무것도 하지 않는다. 기존 계정은 바꾸지 않는다.
  - 설정값은 `application.properties`에 있고, 과제 제출용으로 커밋한다.
  - 설정값은 시작할 때 검증한다(이메일 형식, 빈 값 금지, 로그인 아이디 254자·이름 50자 이하). 올바르지 않으면 앱이 뜨지 않는다.
  - 로컬 단일 인스턴스로 실행하는 과제라 시작 시 경합은 그대로 둔다. 두 인스턴스가 동시에 뜨면 같은 아이디는 유일 제약으로 늦은 쪽이 시작에 실패하고, Tomcat이 뜬 뒤 첫 어드민이 만들어지기 전 잠깐(약 1초)은 어드민이 없다.
- 테스트
  - `@SpringBootTest` 컨텍스트가 뜰 때도 첫 어드민 생성이 실행되므로 테스트 DB에 어드민이 남아 있을 수 있다. 어드민이 없는 상태가 필요하면 테스트 트랜잭션 안에서 지우고 롤백한다.
  - 호텔 계정이 있는 호텔은 외래 키 때문에 지우기 전에 그 호텔의 `hotel_admin`을 먼저 지운다.
  - 세션 확인 규칙만 따로 볼 때의 비활성화와 `credential_version` 변경은 테스트에서 DB를 직접 바꿔 재현한다(`AccountHotelAdminControllerTest`). 그 밖의 테스트에서 비활성 계정이 필요하면 API나 `HotelAdmin.changeActive`로 만든다.
  - 마스터의 아이디 변경·비밀번호 재설정이 세션을 끊는지는 전체 어드민과 마스터가 각자 실제로 로그인한 `RANDOM_PORT` 서버에서 확인한다(`AccountHotelMasterAppAdminSessionTest`). 운영자의 아이디 변경·비밀번호 재설정·비활성화도 마스터와 운영자가 각자 실제로 로그인해 확인하고, 마스터 자신의 세션이 유지되는지도 함께 본다(`AccountHotelOperatorHotelAdminSessionTest`).

## 회원

- 회원(게스트 앱 계정)은 `member` 도메인의 `member` 테이블(`Member`, `V13__create_member.sql`)에 저장한다. 이메일(로그인 아이디), 비밀번호 해시, 이름, 전화번호를 가진다. 수정·탈퇴가 없어 `version`을 두지 않는다.
  - 이메일은 계정과 같은 규칙이다(`LoginId.PATTERN`, 254자, `LoginId.normalize`로 소문자 저장). 모든 회원을 통틀어 유일하고(`member_email_key`, `Member.EMAIL_UNIQUE_CONSTRAINT`), 사전 확인(`existsByEmail`)과 함께 이 제약 위반도 409 `MemberErrorCode.MEMBER_EMAIL_DUPLICATED`로 바꾼다. 계정 테이블과 따로라 어드민·호텔 계정과 같은 이메일을 써도 된다.
  - 비밀번호는 계정의 비밀번호 규칙(`@Password`)과 `PasswordEncoder` 해시, 이름은 앞뒤 공백을 지운 1~50자, 전화번호는 이용객과 같은 규칙(`Hotel.PHONE_PATTERN`, 20자, 입력 모양 그대로)이다. DB도 CHECK로 막는다.
- 게스트 앱 인증(`ApiPaths.APP + ApiPaths.AUTH`, `MemberAppController`): `POST /signup`, `POST /login`, `POST /logout`, `GET /me`. 로그인·로그아웃의 흐름과 문구(`success.auth.login`, `success.auth.logout`)는 어드민과 같고 CSRF만 없다(인증 절).
  - 가입(`MemberService.signup`)은 저장한 뒤 바로 로그인 세션을 만든다(201, `success.member.signed-up`). 비밀번호를 다시 검사하지 않고 저장한 회원으로 인증 객체를 만든다(`MemberAuthService.authenticated`, 비밀번호 해시를 지운 principal).
  - 로그인 실패는 계정과 같은 401 `AccountErrorCode.INVALID_CREDENTIALS`다. principal(`MemberPrincipal`)은 회원 id와 이메일을 담고 `Role.MEMBER`를 받는다. 회원으로 범위를 정하는 API는 `@AuthenticationPrincipal MemberPrincipal`의 id를 서비스에 넘긴다.
  - 로그아웃은 세션을 무효화하고 세션 쿠키를 지운다(API 규약).
- 전체 어드민의 회원 조회(`ApiPaths.APP_ADMIN + "/members"`의 목록·조회, `MemberAppAdminController`)는 조회만 한다.
  - 목록은 최근 가입 순(id 내림차순)이다. `keyword`(선택, 100자)는 이름·이메일(대소문자 구분 없이)이나 하이픈을 뺀 전화번호에 들어 있으면 찾는다(`MemberSpecifications.search`, 이스케이프는 목록 조회 절). 하이픈만 있는 검색어는 이름·이메일에서만 찾는다.
  - 없는 회원은 404 `MEMBER_NOT_FOUND`다.
  - 회원의 호텔 이용 기록(`/members/{memberId}/stays`)은 이용 절에 있다.
- 테스트: 가입·로그인·로그아웃과 세션은 `RANDOM_PORT` 서버에 실제 쿠키를 주고받으며 확인한다(`MemberAppControllerTest`). 회원이 연결된 이용객이 있으면 외래 키 때문에 이용객(호텔 id로)을 지운 뒤 회원을 지운다.

## 객실

- 객실은 `room` 도메인의 `room` 테이블(`Room`, `V6__create_room.sql`)에 저장한다. 한 호텔에 속하고(`hotel_id`, `Hotel`과 JPA 연관관계) 이름, 객실 유형(`room_type_id`, `RoomType`과 JPA 연관관계, 객실 유형 절), 층(선택), 소개(선택), 상태(`status`, 객실 상태 절), 낙관적 잠금 버전(`version`)을 가진다. 최대 인원, 1박 요금, 체크인·체크아웃 시각은 유형에서 읽는다.
  - 객실은 같은 호텔의 유형만 가리킨다. DB는 `room_type (id, hotel_id)` 유일 제약을 가리키는 복합 외래 키 `room_room_type_id_hotel_id_fkey (room_type_id, hotel_id)`로 막는다. 유형별 조회는 `room_room_type_id_idx`를 쓴다.
  - 객실 삭제는 아직 없다.
- 값의 규칙
  - 이름(호수)은 앞뒤 공백을 지운 뒤 1~50자, 소개는 1000자 이하이고 비거나 공백만 있으면 null이다. 엔티티(`Room.normalize`)가 지워 저장한다.
  - 층은 -10~200(지하는 음수, null 가능) 정수다. 요청은 `@Min`·`@Max`(`validation.min`·`validation.max`)로 검사하고 상수는 `Room.MIN_FLOOR` 등이다.
  - 유형은 요청의 `roomTypeId`로 고른다. 같은 호텔에서만 찾고(`RoomTypeService.getRoomType`) 없는 id와 다른 호텔의 유형 id는 모두 404 `RoomErrorCode.ROOM_TYPE_NOT_FOUND`다.
  - DB도 CHECK 제약으로 정리된 문자열과 층 범위만 받는다.
- 이름 컬럼은 `natural_sort` collation이다(목록 조회 절). 목록의 이름순은 이 collation을 따른다.
- 이름은 같은 호텔 안에서만 유일하다(`room_hotel_id_name_key unique (hotel_id, name)`, 앞뒤 공백을 지운 값을 대소문자 구분해 비교). 다른 호텔과는 같아도 된다.
  - 사전 확인(수정은 자기 자신을 빼고 `existsByHotelIdAndNameAndIdNot`)과 함께 이 제약 위반도 `RoomErrorCode.ROOM_DUPLICATED`(409)로 바꾼다.
  - 이 제약의 인덱스가 호텔별 목록의 `hotel_id` 조건에도 쓰여 따로 인덱스를 두지 않는다.
- 객실 관리(`ApiPaths.HOTEL_ADMIN + ApiPaths.ROOMS`의 생성·목록·조회·수정과 `/{roomId}/status` 상태 변경, `/{roomId}/status-histories` 상태 이력 조회, `RoomHotelAdminController`)는 `RoomService`가 한다. 생성·수정은 마스터만(운영자는 403 `FORBIDDEN`, `HOTEL_MASTER_APIS`), 조회·상태 변경·이력 조회는 호텔 계정 모두(`Role.HOTEL_ADMIN`, 마스터·운영자)가 쓰고, 전체 어드민 계정은 403 `FORBIDDEN`이다. 성공 문구는 생성 `success.room.created`('객실을 생성했습니다.')다.
  - 대상 호텔은 로그인한 계정의 `HotelAdminPrincipal.hotelId`다. 생성은 `HotelService.getHotel(hotelId)`로 호텔을 읽어 연관관계에 쓴다. 판단 순서는 호텔 → 유형(404 `ROOM_TYPE_NOT_FOUND`) → 이름 중복 → 저장이다.
  - 조회·수정할 객실은 같은 호텔에서만 찾는다(`findByIdAndHotelId`). 없는 id와 다른 호텔의 객실 id는 모두 404 `RoomErrorCode.ROOM_NOT_FOUND`다. 다른 호텔 객실의 존재를 알리지 않기 위해서다.
  - 수정은 PUT으로 모든 항목을 바꾼다. 층과 소개를 보내지 않거나 null이면 null로 바뀐다. 순서는 객실 조회 → version 확인(`ROOM_MODIFIED`) → 유형 확인(`ROOM_TYPE_NOT_FOUND`) → 이름 중복 확인 → 엔티티 변경 → `saveAndFlush`이고, 유일 제약 위반과 `OptimisticLockingFailureException`을 함께 변환한다. version 충돌과 이름 중복이 겹치면 version 충돌이 먼저다.
  - 목록은 같은 호텔의 객실을 이름 오름차순, 같으면 id 오름차순으로 준다(목록 조회 절). `keyword`(선택, 100자)는 이름에서 대소문자 구분 없이 찾고, `status`(선택, 하나)는 그 상태의 객실만, `roomTypeId`(선택)는 그 유형의 객실만 거른다. 함께 보내면 AND다(조합별 파생 쿼리, 목록 조회 절). 없거나 다른 호텔의 유형 id면 빈 목록이다(호텔 조건과 AND라 따로 확인하지 않는다). 상태 필터용 인덱스는 따로 두지 않는다(`hotel_id` 조건에 유일 제약의 인덱스를 쓴다).
  - 객실 응답(`RoomHotelAdminResponse`)에는 유형 `roomType: { id, name, capacity, roomRate, checkInTime, checkOutTime }`(조회 시점의 유형 값)을 담는다. 응답은 트랜잭션 밖에서 만들므로 객실 조회(`findByIdAndHotelId`, 목록의 파생 쿼리)는 `@EntityGraph`로 유형을 함께 읽는다.
  - 객실 응답에는 지금 이용 `currentStay: { id, checkInDate, checkOutDate, guest: { id, name, phone } }`를 담고, 없으면 null이다. 지금 이용은 오늘(`Clock`, Asia/Seoul)이 [체크인, 체크아웃) 안에 있는 취소하지 않은 이용이며, 배제 제약 때문에 객실마다 많아야 하나다. 컨트롤러가 `StayService.getCurrentStays(roomIds)`로 조회해 붙인다. 목록은 페이지의 객실을 한 번에 조회하고(이용객은 `@EntityGraph`, 인덱스는 `stay_room_id_check_in_date_id_idx`), 조회·수정·상태 변경은 그 객실 하나를 조회한다. 등록 응답은 항상 null이다. 서비스 방향은 `StayService → RoomService` 그대로이고 `RoomService`는 이용 도메인을 쓰지 않는다.
- 전체 어드민의 호텔 객실 조회(`GET ApiPaths.APP_ADMIN + "/hotels/{hotelId}/rooms"`, `RoomAppAdminController`, `RoomService.getHotelRoomPage`)는 읽기 전용이다. `HotelService.getHotel`로 호텔을 확인하고(없으면 404 `HOTEL_NOT_FOUND`) 그 호텔의 객실을 hotel-admin 목록과 같은 이름순 페이지로 준다. 항목(`RoomAppAdminResponse`)은 `{ id, name, roomType: { id, name }, floor, status }`이고 유형은 `findByHotelId`의 `@EntityGraph`로 함께 읽는다. 검색·필터는 없다.
- 테스트
  - 마스터와 운영자가 모두 쓰는 API는 두 역할의 principal로 정상 흐름을 확인한다(`@EnumSource(HotelAdminRole::class)`, `RoomHotelAdminControllerTest`). 마스터 전용 API는 운영자 principal로 403과 바뀌지 않음을 확인한다.
  - 객실이 있는 호텔은 외래 키 때문에 지우기 전에 그 호텔 객실의 `room_status_history`, 그다음 `room`, 그다음 `room_type`을 먼저 지운다. 테스트 객실은 저장한 유형으로 만든다(`RoomTypeRepository`). 이력은 바꾼 호텔 계정(`hotel_admin`)도 가리키므로, 여러 호텔을 지울 때는 모든 호텔의 이력을 먼저 지운 뒤 객실과 호텔 계정을 지운다.

## 객실 유형

- 객실 유형은 `room` 도메인의 `room_type` 테이블(`RoomType`, `V11__create_room_type.sql`)에 호텔마다 따로 저장한다. 한 호텔에 속하고(`hotel_id`) 이름, 최대 인원(`capacity`), 1박 요금(`room_rate`, 원 정수), 체크인·체크아웃 시각, 낙관적 잠금 버전(`version`)을 가진다. 삭제는 없다.
- 값의 규칙
  - 이름은 앞뒤 공백을 지운 뒤 1~50자(`RoomType.normalize`), 최대 인원은 1~20, 1박 요금은 0~10,000,000이다(`RoomType.MIN_ROOM_RATE`·`MAX_ROOM_RATE`). 금액이 박 수(최대 30)와 곱해도 `integer` 범위 안이다.
  - 체크인·체크아웃 시각은 `LocalTime`(`HH:mm`, 응답과 예외 절)이고 앞뒤를 비교하지 않는다. 체크아웃이 체크인보다 이르거나 같아도 된다.
  - DB도 CHECK 제약으로 정리된 이름, 인원·요금 범위, 초가 0인 시각만 받는다.
- 이름은 같은 호텔 안에서만 유일하다(`room_type_hotel_id_name_key`, 대소문자 구분). 사전 확인(수정은 자기 자신을 뺀다)과 제약 위반 모두 409 `RoomErrorCode.ROOM_TYPE_DUPLICATED`다. 이름 컬럼은 `natural_sort`다.
- 유형 관리(`ApiPaths.HOTEL_ADMIN + ApiPaths.ROOM_TYPES`의 생성·목록·조회·수정, `RoomTypeHotelAdminController`)는 `RoomTypeService`가 한다. 태그는 객실과 같은 `room`이다.
  - 생성·수정은 마스터만 쓰고(운영자 403, `HOTEL_MASTER_APIS`), 목록·조회는 마스터·운영자 모두 쓴다(객실 생성 선택 상자·거르기).
  - 대상 호텔은 로그인한 계정의 호텔이다. 없는 id와 다른 호텔의 유형 id는 모두 404 `ROOM_TYPE_NOT_FOUND`다.
  - 목록은 그 호텔 유형 전부를 페이지 없이 이름 오름차순, 같으면 id 오름차순으로 준다(목록 조회 절).
  - 수정은 PUT으로 모든 항목을 바꾼다. 순서는 유형 조회 → version 확인(`ROOM_TYPE_MODIFIED`) → 이름 중복 확인 → 엔티티 변경 → `saveAndFlush`다. 바꾼 값은 그 유형의 모든 객실에 바로 적용되고, 1박 요금은 그 뒤의 예약부터 쓰인다(이미 한 예약의 금액은 이용에 저장돼 그대로다, 이용 절).
  - 성공 문구는 `success.room-type.created`, `success.room-type.updated`다.
- 기존 객실 이전(`V11`): 호텔마다 객실의 `type` 글자값별로 유형을 만들었다. 최대 인원은 그 유형 객실의 최댓값, 시각은 id가 가장 작은 객실의 값, 1박 요금은 100000원이다. 객실에 `room_type_id`를 채운 뒤 `type`·`capacity`·`check_in_time`·`check_out_time` 컬럼을 지웠다. 규칙은 마이그레이션 주석에도 적었다.
- 테스트: 이전 규칙은 별도 스키마에 V10까지 적용해 객실을 넣은 뒤 V11을 적용해 확인한다(`RoomTypeMigrationTest`, 객실 상태 절의 방식).

## 객실 상태

- 상태는 `RoomStatus`(`VACANT` 공실, `RESERVED` 예약됨, `OCCUPIED` 이용중, `MAINTENANCE` 정비중)이고 `room.status`에 상수 이름으로 저장한다(`V7__add_room_status.sql`, CHECK로 네 값만, not null). 새 객실은 `VACANT`로 시작하고 등록 요청은 상태를 받지 않는다. 마이그레이션 전 객실은 `VACANT`로 채우고 이력은 남기지 않았다.
- 허용하는 변경은 `RoomStatus.canChangeTo`의 여섯 가지뿐이다. `VACANT → RESERVED`, `RESERVED → OCCUPIED`, `OCCUPIED → MAINTENANCE`, `MAINTENANCE → VACANT`, `RESERVED → VACANT`(예약을 되돌림), `VACANT → MAINTENANCE`(이용 없이 정비). 같은 상태로의 변경을 포함한 나머지는 409 `RoomErrorCode.ROOM_STATUS_TRANSITION_NOT_ALLOWED`다. 16가지 조합 전부를 `RoomStatusTest`로 확인한다.
- 상태 변경(`PUT ApiPaths.HOTEL_ADMIN + "/rooms/{roomId}/status"`, 본문 `{ from, to }`, `RoomService.changeStatus`)은 호텔 계정 모두가 자기 호텔의 객실에만 한다. 요청에는 화면에서 본 상태 `from`과 바꿀 상태 `to`를 보낸다.
  - 판단 순서는 객실 조회(`findByIdAndHotelId`, 404 `ROOM_NOT_FOUND`) → 전이 확인(요청의 `from → to`, 409 `ROOM_STATUS_TRANSITION_NOT_ALLOWED`) → 조건부 UPDATE(바뀐 행이 없으면 409 `ROOM_STATUS_CHANGED`)다. 허용되지 않는 변경이면서 `from`도 지금 상태와 다르면 `ROOM_STATUS_TRANSITION_NOT_ALLOWED`다.
  - 상태는 조건부 UPDATE(compare-and-set)로만 바꾼다. `RoomRepository.updateStatus`가 `where id = :id and hotel.id = :hotelId and status = :from`으로 한 번에 바꾸고 바뀐 행 수를 돌려준다. 동시에 같은 `from`으로 바꾸면 늦은 쪽은 먼저 커밋된 변경을 기다렸다가 조건이 맞지 않아 0행이 된다.
  - 상태 변경은 `version`을 올리지 않는다(벌크 UPDATE라 JPA 버전 검사를 타지 않는다). 상태가 바뀌어도 열어 둔 객실 수정(PUT)은 거절되지 않는다.
  - 반대로 객실 수정이 상태를 덮어쓰지 않도록 `Room.status`는 `@Column(updatable = false)`로 JPA UPDATE에서 뺀다. JPA는 엔티티를 저장할 때 모든 컬럼을 UPDATE하므로, 수정이 객실을 읽은 뒤 상태 변경이 커밋되면 version은 그대로라 통과한 수정의 flush가 읽어 둔 옛 상태로 되돌린다.
  - 벌크 UPDATE는 영속성 컨텍스트를 거치지 않으므로 `@Modifying(flushAutomatically = true, clearAutomatically = true)`로 앞의 변경을 먼저 flush하고 뒤에 비운다. 응답과 이력에 쓸 객실은 비운 뒤 다시 읽는다. 비우지 않으면 응답에 옛 상태가 나간다.
  - 벌크 UPDATE는 JPA Auditing을 거치지 않으므로 `updated_at`을 같은 문장에서 함께 바꾼다(서비스의 `Instant.now(clock)`, 엔티티 절).
  - 성공하면 바뀐 상태의 객실 응답(`RoomHotelAdminResponse`, version 그대로)을 준다.
- 이력은 `room_status_history`(`RoomStatusHistory`)에 상태가 바뀔 때마다 한 줄, 상태 변경과 같은 트랜잭션에서 저장한다. 변경이 거절되거나 실패하면 이력도 남지 않는다.
  - 항목은 이전 상태(`from_status`, 등록이면 null), 바뀐 상태(`to_status`), 바꾼 호텔 계정(`changed_by_id`, `HotelAdmin`과 JPA 연관관계)과 그때의 이름(`changed_by_name`), 바꾼 시각이다. 바꾼 시각은 따로 두지 않고 공통 컬럼 `created_at`을 쓴다(이력은 바꾸지 않으므로 `updated_at`도 같다).
  - 객실 등록(`RoomService.create`)도 등록한 계정으로 `(null → VACANT)` 이력을 같은 트랜잭션에 남긴다. 컨트롤러가 `HotelAdminPrincipal.id`를 넘긴다.
  - 이름은 세션 principal에 없으므로(이름 변경은 세션을 끊지 않는다) 변경 시점에 `HotelAdminService.getHotelAdmin`으로 계정을 읽어 지금 이름을 저장한다. 나중에 이름이 바뀌거나 계정이 비활성화돼도 이력은 저장한 이름 그대로다. 서비스 방향은 `RoomService → HotelService → HotelAdminService`, `RoomService → HotelAdminService`이고 계정 도메인은 객실 도메인을 쓰지 않는다. 세션은 요청마다 계정을 확인하므로 계정이 없으면 서버 오류(500)로 둔다.
  - DB도 CHECK로 네 상태 값, 정리된 이름(호텔 계정 이름처럼 1~50자, 앞뒤 공백 없음)만 받고, 객실과 호텔 계정은 외래 키로 가리킨다. 호텔 계정은 지우지 않는다.
- 이력 조회(`GET ApiPaths.HOTEL_ADMIN + "/rooms/{roomId}/status-histories"`, `RoomService.getStatusHistories`)는 `(roomId, hotelId)`로 객실을 먼저 확인해(404 `ROOM_NOT_FOUND`) 다른 호텔 객실의 이력이 새지 않게 하고, 그 객실의 이력을 최신순(바꾼 시각 내림차순, 같으면 id 내림차순)으로 페이지로 준다. 인덱스는 `room_status_history_room_id_created_at_id_idx (room_id, created_at desc, id desc)`다.
  - 응답(`RoomStatusHistoryHotelAdminResponse`)은 `{ id, fromStatus, toStatus, changedBy: { id, name }, changedAt }`이고 `changedAt`은 UTC ISO 8601 문자열이다(응답과 예외 절).
- 테스트
  - 순서 고정 테스트(`RoomServiceTest`): 두 상태 변경이 모두 전이 확인을 통과한 뒤 먼저 커밋된 변경 때문에 늦은 쪽의 조건부 UPDATE가 0행이 돼 `ROOM_STATUS_CHANGED`가 되는 경로, 객실 수정이 객실을 읽은 뒤 상태 변경이 커밋돼도 수정의 저장이 상태를 덮어쓰지 않는 경로. 뒤의 것은 `updatable = false`를 빼면 실패한다(`RoomRepositoryTest`도 같은 보호를 확인한다).
  - 이력의 이름 고정, 바꾼 시각의 응답 형식, 최신순·페이지는 API 테스트에서 확인한다. 정렬과 시각 형식은 바꾼 시각을 정해 JDBC로 넣은 이력으로 확인한다.
  - 마이그레이션의 기존 객실 채우기는 별도 스키마에 V6까지 적용해 객실을 넣은 뒤 V7을 적용해 확인한다(`RoomStatusMigrationTest`, 테스트 트랜잭션 없이, 끝나면 그 스키마를 `clean`).

## 이용객

- 이용객은 `guest` 도메인의 `guest` 테이블(`Guest`, `V8__create_guest.sql`)에 저장한다. 한 호텔에 속하고(`hotel_id`, `Hotel`과 JPA 연관관계) 이름, 전화번호, 이메일, 낙관적 잠금 버전(`version`)을 가진다.
  - 이용객은 게스트 앱 예약에서 등록된다(게스트 앱 API 절). hotel-admin에는 등록 API가 없다.
  - 이용객 삭제는 없다.
- 이용객은 회원과 연결될 수 있다(`member_id`, nullable 외래 키, `V14__add_guest_member_id.sql`). 회원 기능 전에 만든 이용객은 연결되지 않았다.
  - 연결은 예약의 이용객 찾기·만들기만 한다(게스트 앱 API 절). 새 이용객은 INSERT에서 함께 넣고, 연결되지 않은 기존 이용객은 조건부 UPDATE(`GuestRepository.linkMember`, `where member_id is null or member_id = 회원`)로 연결한다. 0행이면 다른 회원과 연결된 이용객이라 409 `GuestErrorCode.GUEST_LINKED_TO_OTHER_MEMBER`다. 다른 회원의 이용이 내 이용에 섞이지 않게 하려는 가장 단순한 규칙이다.
  - `Guest.member`는 `@JoinColumn(updatable = false)`라 hotel-admin의 이용객 수정(JPA UPDATE)이 연결을 바꾸지 않는다. 연결은 version을 올리지 않는다.
  - 회원별 조회에 `guest_member_id_idx`를 쓴다.
- 값의 규칙
  - 이름은 앞뒤 공백을 지운 뒤 1~50자다. 같은 호텔에서도 겹쳐도 된다.
  - 전화번호는 호텔 대표 전화번호와 같은 규칙과 검증 방식이다(`Hotel.PHONE_PATTERN`, 20자, `@PatternThenMaxLength`). 앞뒤 공백만 지우고 입력한 모양 그대로 저장한다.
  - 이메일은 로그인 아이디와 같은 형식이다(`LoginId.PATTERN`, 254자, `@PatternThenMaxLength`). 앞뒤 공백만 지우고 대소문자를 바꾸지 않고 저장하며, 유일하지 않다.
  - 엔티티(`Guest.normalize`)가 공백을 지워 저장한다. DB도 CHECK 제약으로 정리된 이름·이메일과 호텔과 같은 규칙의 전화번호만 받는다.
- 전화번호는 같은 호텔 안에서 하이픈을 뺀 숫자로 유일하다. `010-1234-5678`과 `01012345678`은 같은 번호다. 다른 호텔과는 같아도 된다.
  - DB는 식 유일 인덱스 `guest_hotel_id_phone_digits_key (hotel_id, replace(phone, '-', ''))`로 막는다. CHECK가 숫자와 `-`만 받으므로 하이픈을 뺀 값이 숫자만 뽑은 값이다.
  - 수정의 사전 확인도 같은 식으로 비교하고(`GuestSpecifications.samePhone`, 자기 자신을 뺀다), 이 인덱스 위반도 `GuestErrorCode.GUEST_PHONE_DUPLICATED`(409)로 바꾼다. 인덱스 이름은 `Guest.HOTEL_PHONE_UNIQUE_CONSTRAINT`다.
  - 예약의 이용객 찾기·만들기는 같은 번호를 409로 거절하지 않고 그 이용객으로 예약한다. 이 인덱스를 `on conflict` 대상으로 써서 같은 새 이용객이 동시에 와도 하나만 남긴다(게스트 앱 API 절).
  - 이 인덱스가 호텔별 목록의 `hotel_id` 조건에도 쓰여 따로 인덱스를 두지 않는다.
- 이용객 관리(`ApiPaths.HOTEL_ADMIN + "/guests"`의 목록·조회·수정, `GuestHotelAdminController`)는 `GuestService`가 한다. 호텔 계정 모두(마스터·운영자)가 쓰고, 전체 어드민 계정은 403 `FORBIDDEN`이다. 보안 규칙은 따로 두지 않는다(`HOTEL_ADMIN_PATTERN`).
  - 대상 호텔은 로그인한 계정의 `HotelAdminPrincipal.hotelId`다.
  - 조회·수정할 이용객은 같은 호텔에서만 찾는다(`findByIdAndHotelId`). 없는 id와 다른 호텔의 이용객 id는 모두 404 `GuestErrorCode.GUEST_NOT_FOUND`다.
  - 수정은 PUT으로 모든 항목을 바꾼다. 순서는 이용객 조회 → version 확인(`GUEST_MODIFIED`) → 전화번호 중복 확인 → 엔티티 변경 → `saveAndFlush`이고, 유일 인덱스 위반과 `OptimisticLockingFailureException`을 함께 변환한다. version 충돌과 전화번호 중복이 겹치면 version 충돌이 먼저다.
  - 목록은 같은 호텔의 이용객을 최근 등록 순(id 내림차순)으로 준다. `keyword`(선택, 100자)는 이름 또는 전화번호에서 찾는다(`GuestSpecifications.search`, 이스케이프는 목록 조회 절). 이름은 대소문자 구분 없이, 전화번호는 저장값과 검색어 양쪽의 하이픈을 빼고 부분 일치로 찾는다(`01012345678`로 `010-1234-5678`을 찾는다).
  - 하이픈만 있는 검색어는 하이픈을 빼면 비어 모든 전화번호에 맞으므로 이름에서만 찾는다.
  - 조회·수정 응답(`GuestDetailHotelAdminResponse`)에는 지금 이용 `currentStay: { id, room: { id, name, roomType: { id, name } }, checkInDate, checkOutDate }`(호실·유형·기간, 조회 시점의 값)를 담고, 없으면 null이다. 목록 항목(`GuestHotelAdminResponse`)에는 담지 않는다. 수정 응답에도 담는 것은 프론트엔드가 수정 응답으로 상세 캐시를 바꾸기 때문이다.
    - 지금 이용은 객실의 지금 이용과 같은 기준(오늘(`Clock`)이 [체크인, 체크아웃) 안, 취소 제외)이다. 이용객은 여러 객실을 함께 쓸 수 있어 여러 개일 수 있는데, 하나만 체크인 날짜 오름차순(같으면 id 오름차순)으로 고른다(`StayService.getCurrentStayOfGuest`, 객실과 유형은 `@EntityGraph`, 인덱스는 `stay_guest_id_check_in_date_id_idx`).
    - 컨트롤러가 `StayService`로 조회해 붙인다. 서비스 방향은 `StayService → GuestService` 그대로이고 `GuestService`는 이용 도메인을 쓰지 않는다.
- 테스트
  - 수정이 사전 확인을 통과한 뒤 유일 인덱스(하이픈 모양만 다른 번호)와 JPA 버전 검사가 막는 경로는 순서를 고정해 확인한다(`GuestServiceTest`). 테스트 이용객은 저장소로 만든다(`GuestService.getOrCreate`는 회원이 필요하다).
  - 이용객이 있는 호텔은 외래 키 때문에 지우기 전에 그 호텔의 `guest`를 먼저 지운다.

## 이용

- 이용은 `stay` 도메인의 `stay` 테이블(`Stay`, `V9__create_stay.sql`)에 저장한다. 객실(`room_id`, `Room`)과 이용객(`guest_id`, `Guest`)을 JPA 연관관계로 가리키고 체크인 날짜, 체크아웃 날짜(`LocalDate`, `date`), 인원을 가진다.
  - 호텔 컬럼은 두지 않는다. 호텔은 객실로 정해지고(객실의 호텔은 바뀌지 않는다) 객실과 이용객이 같은 호텔인지는 서비스가 확인한다.
  - 수정이 없어 `version`을 두지 않고 응답에도 싣지 않는다. 취소는 같은 행의 취소 컬럼에 기록한다(취소 절).
- 예약 비용은 이용에 저장한다(`V12__add_stay_amount.sql`): 1박 요금(`room_rate`, 예약할 때 그 유형의 요금), 박 수(`nights`), 기본 금액(`base_amount` = 1박 요금 × 박 수), 할인 금액(`discount_amount`, 지금은 0), 최종 금액(`total_amount` = 기본 − 할인). 나중에 유형 요금이 바뀌어도 지난 이용 금액은 그대로다.
  - 엔티티(`Stay` 생성자에 1박 요금을 넘긴다)가 박 수와 금액을 계산한다. DB는 `stay_amount_check`(금액 ≥ 0, 박 수 = 체크아웃 − 체크인, 기본 = 요금 × 박 수, 최종 = 기본 − 할인)로 막는다.
  - 기존 이용은 마이그레이션이 그 객실 유형의 요금으로 채웠다(할인 0, `StayAmountMigrationTest`).
  - 이용 응답(게스트 앱 예약, hotel-admin 목록·조회·취소)에 `roomRate, nights, baseAmount, discountAmount, totalAmount`를 담는다. 취소한 이용도 금액은 그대로 담는다.
  - CHECK 제약은 이름 알파벳순으로 검사하므로 여러 제약을 함께 어기면 `stay_amount_check`가 먼저 보일 수 있다(저장소 테스트는 요금 0으로 기간 제약만 어기게 만든다).
- 기간은 날짜 단위의 반열린 구간 [체크인, 체크아웃)이다. 체크아웃 날은 비어 있다고 보아 1일~3일과 3일~5일은 겹치지 않는다.
- 값의 규칙. 어기면 400 `INVALID_INPUT`이고 틀린 항목을 모두 `fieldErrors`에 담는다(응답과 예외 절).
  - 체크인 날짜는 오늘(`Clock` 빈, Asia/Seoul)이거나 그 뒤다. `checkInDate`, `validation.today-or-later`
  - 체크아웃 날짜는 체크인 날짜보다 뒤이고(최소 1박) 최대 30박이다(`Stay.MAX_NIGHTS`). `checkOutDate`, `validation.after-check-in` 또는 `validation.max-nights`
  - 인원은 1 이상(요청의 `@Min`, `validation.min`)이다. 유형의 최대 인원이 인원보다 작으면 배정하지 않는다(예약할 수 있는 객실이 없으면 409, 게스트 앱 API 절).
  - DB도 CHECK로 1~30박, 1~20명만 받는다. 오늘 규칙은 DB가 막지 않는다.
- 같은 객실에 기간이 겹치는 취소하지 않은 이용은 둘 수 없다. 예약은 그 유형 객실을 잠근 뒤 겹치는 이용이 없는 객실만 고르고(`StayRepository.findOverlappedRoomIds`, 게스트 앱 API 절), 배제 제약(`stay_room_id_period_excl`, `btree_gist`로 `room_id WITH =`, `daterange(check_in_date, check_out_date, '[)') WITH &&`, `where (canceled_at is null)`)이 안전망으로 막는다. 제약 위반은 409 `StayErrorCode.STAY_PERIOD_OVERLAPPED`다(동시성과 충돌 절). 취소한 이용과는 겹쳐도 된다.
  - 배제 제약은 `V10__add_stay_cancellation.sql`이 같은 이름으로 다시 만들어 취소하지 않은 이용에만 건다.
  - 배제 제약의 gist 인덱스는 취소하지 않은 이용만 담아 취소를 포함한 목록에 쓰이지 않는다. 객실별 조회는 `stay_room_id_check_in_date_id_idx`, 이용객별 조회는 `stay_guest_id_check_in_date_id_idx`를 쓴다.
- 이용 등록은 게스트 앱 예약(`StayService.reserve`)만 한다(게스트 앱 API 절). 객실 상태와 관계없고 상태를 바꾸지 않는다.
- 회원의 이용은 회원과 연결된 이용객(모든 호텔)의 이용이다(`StayService.getMemberStays`, 없는 회원은 404 `MEMBER_NOT_FOUND`). 게스트 앱 내 이용과 전체 어드민의 회원 이용 기록(`ApiPaths.APP_ADMIN + "/members/{memberId}/stays"`, `StayAppAdminController`)이 함께 쓴다. 전체 어드민 응답은 호텔 `{ id, name }`, 객실 `{ id, name }`, 유형 `{ id, name }`(조회 시점의 값), 기간, 인원, 금액(예약할 때 저장한 값), `canceledAt`을 담는다(`StayAppAdminResponse`).
- 이용 관리(`ApiPaths.HOTEL_ADMIN + "/stays"`의 목록·조회와 `/{stayId}/cancel` 취소, `StayHotelAdminController`)는 `StayService`가 한다. 호텔 계정 모두(마스터·운영자)가 쓰고, 전체 어드민 계정은 403 `FORBIDDEN`이다. 등록과 수정은 없다.
  - 조회할 이용은 객실의 호텔로 찾는다(`findByIdAndRoomHotelId`). 없는 id와 다른 호텔의 이용 id는 모두 404 `STAY_NOT_FOUND`다.
  - 목록은 같은 호텔의 이용을 취소한 이용까지 체크인 날짜 내림차순, 같으면 id 내림차순으로 준다. `roomId`·`guestId`·`canceled`·`keyword`·`checkInFrom`·`checkInTo`(모두 선택)로 거르고 함께 보내면 AND다. 조합이 많아 파생 쿼리 대신 `StaySpecifications.search`로 거른다(목록 조회 절). 없거나 다른 호텔의 id로 거르면 빈 목록이다.
    - `keyword`(100자)는 이용객 목록 검색과 같은 방식으로 이용객 이름(대소문자 구분 없이)이나 전화번호(양쪽 하이픈을 빼고)에서 찾는다(`SearchPredicates`).
    - `checkInFrom`·`checkInTo`(`LocalDate`)는 체크인 날짜가 그 사이(양 끝 포함)인 이용만 거르고 하나만 보내도 된다. `checkInFrom`이 `checkInTo`보다 늦으면 서비스가 400 `INVALID_INPUT`(`checkInTo`, `validation.from-or-later`)으로 던진다.
    - 조합은 `StayHotelAdminControllerTest`의 parameterized 테스트로 확인한다.
  - 응답은 객실 `{ id, name }`, 이용객 `{ id, name, phone }`을 조회 시점의 값으로 담고, 저장한 금액(이용 절)과 취소 정보 `cancellation: { canceledAt, canceledBy: { id, name }, reason }`(취소하지 않았으면 null)을 담는다. 목록(`findAll(Specification, Pageable)`을 다시 선언)과 조회는 `@EntityGraph`로 객실과 이용객을 함께 읽는다.
- 취소(`POST ApiPaths.HOTEL_ADMIN + "/stays/{stayId}/cancel"`, 본문 `{ reason? }`, `StayService.cancel`)는 되돌릴 수 없다. 성공하면 취소 정보가 담긴 이용 응답을 준다.
  - 판단 순서는 이용 조회(404 `STAY_NOT_FOUND`) → 이미 취소(409 `STAY_ALREADY_CANCELED`) → 끝난 이용(409 `STAY_ALREADY_ENDED`) → 조건부 UPDATE다. 끝나지 않은 이용은 체크아웃 날짜가 오늘(`Clock`, Asia/Seoul)보다 뒤인 이용이다. 이미 취소했으면서 끝난 이용은 `STAY_ALREADY_CANCELED`다.
  - 취소 시각(`canceled_at`), 처리한 호텔 계정(`canceled_by_id`)과 그때의 이름(`canceled_by_name`), 사유(`cancel_reason`)는 `StayRepository.cancel`이 `where id = :id and canceled_at is null`로 한 번에 쓴다. 바뀐 행이 없으면 409 `STAY_ALREADY_CANCELED`다. 동시에 두 번 취소하면 늦은 쪽은 먼저 커밋된 취소를 기다렸다가 0행이 되어 기록은 하나만 남는다. 벌크 UPDATE의 `updated_at`과 다시 읽기는 객실 상태 변경과 같다(객실 상태 절).
  - 이름은 객실 상태 이력처럼 `HotelAdminService.getHotelAdmin`으로 읽은 지금 이름을 저장한다. 서비스 방향은 `StayService → HotelAdminService`다.
  - 사유는 선택이고 앞뒤 공백을 지운 뒤 200자 이하다(`TrimmedStringDeserializer`, `@Size`). 비었거나 공백만 있으면 null로 저장한다(`Stay.normalizeCancelReason`). 본문은 필수라 사유 없이 취소할 때는 `{}`를 보낸다.
  - 객실이 예약됨(`RESERVED`)이면 같은 트랜잭션에서 공실(`VACANT`)로 바꾸고 취소한 계정으로 상태 이력을 남긴다(`RoomService.releaseReservation`, `RESERVED → VACANT` 조건부 UPDATE). 이용중·정비중·공실이거나 그사이 상태가 바뀌어 0행이면 그대로 두고 취소는 성공한다.
  - DB도 CHECK로 취소 시각·계정·이름이 함께 있거나 함께 없고, 사유는 취소한 이용에만 있으며(`stay_cancellation_check`), 이름(50자)·사유(200자)는 비지 않고 앞뒤 공백이 없는 값만 받는다. 처리한 계정은 외래 키로 가리킨다.
- 테스트
  - 순서를 고정해 확인하는 경로(`StayServiceTest`): 같은 유형의 먼저 온 예약이 커밋되기 전에 다음 예약이 객실 잠금(`for no key update`)을 기다렸다가 다음 이름순 객실을 배정받는 경로와 빈 객실이 없어 `ROOM_TYPE_UNAVAILABLE`이 되는 경로(새 이용객도 남지 않는다), 잠금을 거치지 않고 넣은 겹치는 이용이 커밋되기 전이라 빈 객실로 보고 배정한 예약이 배제 제약에 막히는 경로(`STAY_PERIOD_OVERLAPPED`, 새 이용객도 남지 않는다), 같은 회원이 다른 유형으로 동시에 한 예약이 이용객 INSERT에서 먼저 온 예약의 커밋을 기다렸다가 그 이용객으로 예약되는 경로(이용객은 하나), 먼저 온 취소 때문에 늦은 취소의 조건부 UPDATE가 0행이 되는 경로. 앞의 둘은 `@Lock`을 빼면 잠금을 기다리지 않아 실패하고, 이용객 경로는 `on conflict do nothing`을 빼면 유일 인덱스 위반으로 실패한다.
  - 오늘 규칙은 UTC로는 전날인 한국 시각으로 고정한 Clock(`FixedClockConfiguration`)으로 확인한다. 오늘 체크아웃하는 이용은 끝난 이용이다.
  - 이용이 있는 호텔은 외래 키 때문에 지우기 전에 그 호텔 객실의 `stay`를 먼저 지운다. 취소가 객실 상태 이력을 남기므로 `room_status_history`도 객실과 호텔 계정보다 먼저 지운다. 예약은 이용객을 새로 만들 수 있으므로 `guest`는 호텔 id로 지운다.

## 월별 정산

- 월별 정산(`ApiPaths.HOTEL_ADMIN + ApiPaths.SETTLEMENTS`, `StaySettlementHotelAdminController`)은 이용을 모아 보는 기능이라 `stay` 도메인에 따로 둔 `StaySettlementService`가 한다. 태그는 `stay`다. 마스터만 쓰고(운영자 403, `HOTEL_MASTER_APIS`, 보안 절) 대상 호텔은 로그인한 마스터의 호텔이다.
- 그 달은 쿼리 파라미터 `month`(필수, `YearMonth`, `YYYY-MM`)로 받는다. 형식이 틀리면(`2026-13`, `2026-1`, `2026-11-01`, 앞뒤 공백) 400 `validation.type`, 없으면 `validation.required`이고 필드는 `month`다(Spring의 `YearMonth` 변환). 문서는 springdoc 기본 스키마에 맡기지 않고 `@Parameter(schema = Schema(type = "string", pattern = ...))`로 문자열과 형식(`StaySettlementHotelAdminResponse.MONTH_PATTERN`)을 적어 orval zod가 같은 규칙으로 검사하게 한다. 응답의 `month`도 같은 형식의 문자열이다.
- 그 달 정산에는 체크인 날짜가 그 달 1일~말일(`between`)인 이용을 넣는다. 다음 달로 이어지는 이용도 체크인 달에 들어간다.
- 정산(`GET /settlements?month=`)은 `{ month, totalAmount, stayCount, canceledCount }`다. 취소하지 않은 이용의 최종 금액 합계와 건수, 취소 건수를 쿼리 하나(`StayRepository.summarize`, 집계의 `filter (where ...)`)로 구한다. 합계는 `Int` 범위를 넘을 수 있어 `Long`이다(1건 최대 3억 원). 이용이 없으면 모두 0이다.
- 이용 로그(`GET /settlements/stays?month=&page=&size=`)는 같은 범위의 이용을 취소한 이용까지 체크인 날짜 오름차순, 같으면 id 오름차순으로 페이지로 준다. 항목은 `{ id, room: { id, name }, roomType: { id, name }, guest: { id, name }, checkInDate, checkOutDate, nights, totalAmount, canceledAt }`이고 객실·유형·이용객은 조회 시점의 값이다(유형은 지금 그 객실의 유형, 예약할 때의 유형은 저장하지 않는다). `@EntityGraph`로 객실·유형·이용객을 함께 읽는다.
- 호텔 조건은 객실의 호텔(`room.hotel.id`)이고 인덱스는 `stay_room_id_check_in_date_id_idx`를 쓴다. 마이그레이션은 없다.
- 테스트(`StaySettlementHotelAdminControllerTest`): 달 경계(전달 말일·말일·다음 달 1일), 취소 건수, 다른 호텔 제외, `Int`를 넘는 합계, 로그 순서와 페이지, 운영자 403, `month` 형식 400.

## 게스트 앱 API

- 게스트 앱 API(`ApiPaths.APP`)는 CSRF가 없고, 호텔·객실 유형 조회는 로그인과 세션 없이 쓴다. 예약·내 이용·내 정보·로그아웃은 회원 로그인이 필요하다(`SecurityConfig.MEMBER_APIS`, 보안 절, 회원 절). 컨트롤러는 도메인마다 `controller/app`(`HotelAppController`, `StayAppController`, `MemberAppController`), DTO는 `dto/app`에 둔다. 문서는 `app` 그룹이고 `MEMBER_APIS`의 operation에만 401 자동 에러가 붙는다(403은 없다).
- 예약 흐름은 호텔 → 날짜·인원 → 객실 유형 → 예약(로그인한 회원)이고 이용객 정보는 입력하지 않는다. 게스트는 객실(호수)을 고르지 않는다. 객실 유형은 마스터가 만든 그 호텔의 유형(객실 유형 절)이다. 게스트 앱의 객실 목록·예약된 기간 API는 없앴다.
- 예약할 수 있는 객실은 그 유형이고, 유형의 최대 인원이 인원 이상이고, 그 기간에 취소하지 않은 이용과 겹치지 않는 객실이다(객실 상태 무관). 유형 목록과 예약이 같은 계산(`StayService.availableRooms`)을 쓴다. 겹치는 객실은 `StayRepository.findOverlappedRoomIds`(후보 객실 id 안에서 취소하지 않았고 `check_in_date < 체크아웃 and check_out_date > 체크인`인 이용의 객실 id)로 한 번에 찾는다.
- 호텔 목록(`GET ApiPaths.APP + "/hotels"`, `HotelService.getHotelsByName`)은 모든 호텔의 `{ id, name, address }`를 이름 오름차순, 같으면 id 오름차순으로 준다. 검색은 없다.
  - `hotel.name`은 `natural_sort`가 아니라 DB 기본 collation으로 정렬한다. 이름 속 숫자는 글자 순서로 비교해(`1001`이 `101`보다 앞) 객실 목록의 이름순과 다를 수 있고, operation 설명에 적는다. collation을 바꾸는 마이그레이션은 유일 제약·전체 어드민 검색까지 바뀌어 게스트 앱 정렬 하나로는 과하다고 보고 하지 않았다.
- 객실 유형 목록(`GET ApiPaths.APP + "/hotels/{hotelId}/room-types?checkInDate=&checkOutDate=&guestCount="`, `StayService.getRoomTypes`)은 그 호텔 유형마다 `{ id, name, capacity, roomRate, checkInTime, checkOutTime, roomCount, availableCount }`를 유형 이름순(같으면 id, 목록 조회 절)으로 준다. 객실이 없는 유형도 `roomCount` 0, `availableCount` 0으로 나온다. `availableCount`는 그 기간·인원으로 예약할 수 있는 객실 수이고 0이면 화면이 '예약불가'로 보여준다. 페이지 없이 전부 준다(목록 조회 절).
  - 판단 순서는 파라미터(400: 세 파라미터 필수, 날짜 형식(응답과 예외 절), 인원 `@Min(1)`) → 기간(400, 이용 절의 날짜 규칙, `checkInDate`·`checkOutDate`를 모아 한 번에) → 호텔(`RoomTypeService.getRoomTypes`가 `HotelService.getHotel`로 확인, 404 `HOTEL_NOT_FOUND`)이다. 유형이 없는 호텔은 빈 목록이다.
  - 그 호텔 유형을 한 번, 객실을 유형과 함께 한 번 읽고(`findAllByHotelId`, `@EntityGraph`) 겹치는 객실 id를 한 번 찾아(`findOverlappedRoomIds`) 서비스가 유형 id별로 묶는다. 이용 겹침이 필요해 `stay` 도메인(`StayService → RoomService`)에 둔다.
- 예약(`POST ApiPaths.APP + "/stays"`, 본문 `{ hotelId, roomTypeId, checkInDate, checkOutDate, guestCount }`, `StayService.reserve(memberId, ...)`)은 로그인한 회원만 하고(401 `UNAUTHORIZED`), 서버가 객실을 배정하고 201과 `success.stay.reserved`로 응답한다. 본문에 `guest`를 보내면 400 `validation.unknown-field`다.
  - `roomTypeId`는 유형 목록의 `id`다. 그 호텔의 유형이어야 한다.
  - 판단 순서는 로그인(401) → 요청 검증(400) → 기간(400, 이용 절의 날짜 규칙) → 유형 확인(`RoomTypeService.getRoomType(hotelId, roomTypeId)`, 없거나 다른 호텔의 유형이면 404 `RoomErrorCode.ROOM_TYPE_NOT_FOUND`) → 그 유형 객실 잠금(`RoomService.lockRoomsByType`) → 예약할 수 있는 객실 중 이름순(`natural_sort`, 같으면 id) 첫 객실(없으면 409 `RoomErrorCode.ROOM_TYPE_UNAVAILABLE`) → 이용객 찾기·만들기와 회원 연결(다른 회원과 연결된 이용객이면 409 `GUEST_LINKED_TO_OTHER_MEMBER`) → 이용 `saveAndFlush`(배제 제약 위반 409 `STAY_PERIOD_OVERLAPPED`)다. 한 트랜잭션이라 이용 저장이 실패하면 새로 만든 이용객과 연결도 남지 않는다.
  - 없는 호텔도 그 호텔에 그 유형이 없는 것이므로 `ROOM_TYPE_NOT_FOUND`로 묶는다(호텔을 따로 조회하지 않는다).
  - 인원이 유형의 최대 인원보다 크거나 유형에 객실이 없어도 예약할 수 있는 객실이 없는 것이므로 409 `ROOM_TYPE_UNAVAILABLE`이다. 유형 목록의 `availableCount`가 0인 경우와 같은 규칙이다.
  - 이용은 그 유형의 1박 요금으로 금액을 계산해 저장한다(이용 절).
  - 잠금: `RoomRepository.lockByRoomTypeId`(`@Lock(PESSIMISTIC_WRITE)`, Hibernate의 PostgreSQL 방언은 `for no key update`)이 그 유형 객실 행을 id 오름차순으로 잠근다. 같은 유형 예약끼리는 순서가 같아 교착 없이 줄을 서고, 다른 유형 예약은 서로 기다리지 않는다. 잠근 뒤 `findByIdIn(잠근 id, 이름순)`(`@EntityGraph`로 호텔·유형 함께)으로 다시 읽고, 겹침 조회는 그다음 문장이라 READ COMMITTED에서 먼저 커밋된 예약의 이용을 본다. 잠근 행만 후보로 써서 그사이 유형이 바뀌어 들어온 객실은 고르지 않는다.
    - `for no key update`는 자기끼리와 객실 UPDATE(상태 변경·수정)와는 충돌하지만 이용 INSERT의 외래 키 확인(`for key share`)과는 충돌하지 않는다. 그래서 잠금을 거치지 않은 이용 INSERT가 있으면 배제 제약이 마지막으로 막는다(테스트로 확인).
  - 이용객 찾기·만들기(`GuestService.getOrCreate(hotelId, member)`, 회원은 `MemberService.getMember`로 읽는다): 그 호텔에서 회원 전화번호와 숫자가 같은 이용객을 찾아(`GuestSpecifications.samePhone`) 있으면 그 이용객으로 예약하고 이름·이메일은 바꾸지 않는다. 없으면 `GuestRepository.insertIfPhoneAbsent`(`insert ... on conflict (hotel_id, (replace(phone, '-', ''))) do nothing`)로 회원의 이름·전화번호·이메일과 `member_id`를 넣은 뒤 다시 찾는다. 찾은 이용객이 이 회원과 연결되어 있지 않으면 조건부 UPDATE로 연결한다(이용객 절).
    - 이유: 같은 새 이용객의 예약이 동시에 오면 둘 다 찾지 못한다. JPA 저장의 유일 인덱스 위반은 트랜잭션을 깨뜨려(PostgreSQL은 오류 뒤 같은 트랜잭션의 문장을 받지 않는다) 다시 찾거나 이용을 저장할 수 없다. `on conflict do nothing`은 늦은 쪽이 먼저 넣은 행의 커밋을 기다렸다가 아무것도 넣지 않고, READ COMMITTED라 다음 조회가 커밋된 행을 본다. 먼저 쪽이 롤백되면 늦은 쪽이 넣는다.
    - 네이티브 INSERT는 JPA Auditing과 엔티티 정규화를 거치지 않으므로 서비스가 회원 엔티티의 값(이미 앞뒤 공백을 지운 값)과 `Instant.now(clock)`을 넘기고 version은 0이다.
    - 알려진 경합: 찾은 뒤 그 이용객의 전화번호가 hotel-admin 수정으로 바뀌어 커밋되면 다시 찾기가 비어 500이 된다. 드물어 다루지 않았다.
  - 응답은 `{ id, hotel: { id, name }, roomType: { id, name }, checkInDate, checkOutDate, guestCount, roomRate, nights, baseAmount, discountAmount, totalAmount, guest: { name } }`이다. 배정한 객실(호수)은 싣지 않는다. 객실은 `findByIdIn`이 호텔과 함께 읽어 트랜잭션 밖에서 응답을 만든다.
- 내 이용(`GET ApiPaths.APP + "/me/stays"`, `StayService.getMemberStays`)은 로그인한 회원과 연결된 이용객(모든 호텔)의 이용을 취소 포함해 페이지로 준다. 선택 파라미터 `period`(`StayPeriod`)로 화면의 두 묶음을 나눠 받는다. 오늘은 `Clock`(Asia/Seoul)의 날짜다.
  - `UPCOMING`(지금·앞으로): 체크아웃 날짜가 오늘보다 뒤인 이용, 체크인 날짜 오름차순, 같으면 id 오름차순(`findByGuestMemberIdAndCheckOutDateAfter`).
  - `PAST`(지난 이용): 체크아웃 날짜가 오늘이거나 지난 이용, 체크인 날짜 내림차순, 같으면 id 내림차순(`findByGuestMemberIdAndCheckOutDateLessThanEqual`). 체크아웃이 오늘인 이용은 끝난 이용이라 여기에 든다(취소 절의 '끝난 이용'과 같은 경계).
  - 없거나 비었거나 공백만 있으면 모든 이용을 체크인 날짜 내림차순, 같으면 id 내림차순으로 준다(`findByGuestMemberId`, 기간을 나누기 전과 같다). 없는 이름(소문자 포함)은 400 `validation.type`(`period`)이다(응답과 예외 절).
  - 화면은 `size=10`으로 `UPCOMING`을 마지막 페이지까지 받은 뒤 `PAST`를 `page=0`부터 이어서 받는다(무한 스크롤). 전체 어드민의 회원 이용 기록은 `period` 없이 같은 서비스를 쓴다.
  - 세 쿼리 모두 `@EntityGraph`로 객실의 호텔과 유형을 함께 읽는다. 항목은 `{ id, hotel: { id, name }, roomType: { id, name }, checkInDate, checkOutDate, guestCount, roomRate, nights, baseAmount, discountAmount, totalAmount, canceledAt }`(`StayMyAppResponse`)이다. 유형 이름은 조회 시점의 값이고 금액은 예약할 때 저장한 값이다.
- 테스트는 조회 API를 로그인·CSRF 토큰 없이 요청하고 세션·쿠키가 생기지 않는지 확인한다. 예약·내 이용은 `with(user(MemberPrincipal.from(member)))`로 요청한다(`StayAppControllerTest`). 내 이용의 `period`는 `FixedClockConfiguration`으로 경계(체크아웃이 오늘이면 `PAST`, 지금 이용 중이면 `UPCOMING`), 정렬, `size=10`의 두 번째 페이지, 취소 포함, 다른 회원 제외, 잘못된 값과 빈 값을 확인한다. 지운 두 API가 404 `NOT_FOUND`이고 문서에 없는 것도 확인한다. 호텔 목록은 다른 테스트의 호텔이 있을 수 있어 `size=100`으로 받아 자기 호텔만 골라 순서를 본다(`HotelAppControllerTest`).

## 상수

- 응답 메시지는 `src/main/resources/messages.properties`에 두고 MessageSource로 읽는다.
- 에러 코드는 별도 문자열 없이 enum 이름을 쓴다. 메시지 키는 `ErrorCode.messageKey`(`error.{CODE}`)다.
- 도메인 ErrorCode enum을 추가하면 `messages.properties`에 키를 추가하고, `ErrorCodeMessageTest`의 목록에 등록한다.
- 상태를 바꾸는 요청(POST·PUT·PATCH·DELETE)이 성공하면 응답의 `message`에 결과 문구를 담는다(API 규약의 성공 메시지).
  - 핸들러에 `@SuccessMessage("success.{대상}.{동작}")`(`common/response`)를 붙인다. `SuccessMessageAdvice`가 그 핸들러의 `ApiResponse`에 키의 문구를 채우므로 컨트롤러는 `ApiResponse.success(data)`를 그대로 반환한다.
  - 문구는 요청 값과 관계없이 고정이다. 같은 문구는 같은 키를 함께 쓴다. 예: 두 어드민 앱의 로그인 `success.auth.login`, 마스터·운영자 비밀번호 재설정 `success.password.reset`
  - 상태를 바꾸는 핸들러에는 모두 붙이고 GET 핸들러에는 붙이지 않는다(GET의 `message`는 null). `SuccessMessageConventionTest`가 확인한다.
  - 실패 응답의 `message`는 null이다. 어노테이션이 붙은 핸들러가 예외를 던져도 예외 처리기의 응답에는 문구를 채우지 않는다.
- 입력 검증 메시지는 제약마다 하나인 공용 키(`validation.{제약}`)를 `messages.properties`에 두고 어노테이션에서 `{키}`로 쓴다. 예: `@NotBlank(message = "{validation.required}")`
  - 키 이름: `validation.required`(필수), `validation.email`(이메일 형식), `validation.max-length`(최대 길이, 문구에 `{max}`를 넣는다), `validation.min`·`validation.max`(숫자 범위, 문구에 `{value}`를 넣는다), `validation.phone`(전화번호 형식), `validation.password`(비밀번호 규칙), `validation.type`(타입이 틀린 값), `validation.unknown-field`(문서에 없는 필드), `validation.today-or-later`(오늘 이후 날짜), `validation.after-check-in`(체크인 뒤 날짜), `validation.max-nights`(최대 숙박 수, 문구에 `{max}`를 넣는다), `validation.from-or-later`(기간의 시작과 같거나 뒤 날짜)
  - `validation.type`, `validation.unknown-field`는 어노테이션이 아니라 `GlobalExceptionHandler`가 본문·파라미터 오류에 쓴다. `validation.today-or-later`, `validation.after-check-in`, `validation.max-nights`, `validation.from-or-later`는 서비스가 쓴다(이용 절).
  - Spring Boot의 MessageSource 기반 interpolator가 키를 풀고, `{max}` 같은 제약 속성은 Hibernate Validator가 채운다. 응답의 `fieldErrors[].message`에 풀린 문구가 들어간다.
  - 실제로 쓰는 키만 추가한다.
- 설정값은 `application.properties`에 둔다.

## 엔티티

- 모든 엔티티는 공통 엔티티(`common/entity/BaseEntity`)를 상속한다.
  - `id`: `Long`, IDENTITY 전략
  - `createdAt`, `updatedAt`: `Instant`, JPA Auditing으로 관리
- 현재 시각과 날짜는 `Clock` 빈(`common/config/ClockConfig`, Asia/Seoul)으로 구한다(`Instant.now(clock)`, `LocalDate.now(clock)`). JPA Auditing도 이 Clock을 쓴다(`JpaAuditingConfig`의 `dateTimeProviderRef`). 시각을 고정할 테스트는 `@Primary` 고정 Clock(`FixedClockConfiguration`)을 `@Import`한다.
- 테이블 DDL에는 공통 컬럼을 아래와 같이 둔다.
  - `id bigint generated by default as identity primary key`
  - `created_at timestamptz not null`
  - `updated_at timestamptz not null`
- 스키마는 Flyway로만 바꾼다. 앱 시작 시 `ddl-auto=validate`로 엔티티와 스키마가 일치하는지 검사한다.
- 엔티티 저장(JPA UPDATE)과 조건부 UPDATE가 함께 바꾸면 안 되는 컬럼은 `@Column(updatable = false)`로 JPA UPDATE에서 빼고 조건부 UPDATE로만 바꾼다(예: `Room.status`, 객실 상태 절).
- open-in-view는 끈다. 지연 로딩은 Service의 트랜잭션 안에서만 쓴다.

## 동시성과 충돌

- 유일해야 하는 값은 서비스의 사전 확인과 함께 마이그레이션의 이름 있는 유일 제약(예: `constraint hotel_name_address_key unique (name, address)`)으로 막는다. 사전 확인만으로는 동시에 온 요청이 둘 다 통과한다.
  - 서비스는 저장을 `saveAndFlush`로 서비스 안에서 실행하고, `DataIntegrityViolationException`이 그 제약을 가리키면(`common/exception`의 `violates(제약 이름)`) 도메인 409로 바꾼다. 다른 제약 위반은 그대로 던진다(500).
  - 제약 이름은 엔티티 상수로 둔다. 예: `Hotel.NAME_ADDRESS_UNIQUE_CONSTRAINT`
- 범위가 겹치면 안 되는 값(예: 같은 객실의 이용 기간)은 사전 확인과 함께 PostgreSQL 배제 제약(`exclude using gist`)으로 막고, 그 위반도 `violates(제약 이름)`으로 찾아 도메인 409로 바꾼다(이용 절).
  - Hibernate의 PostgreSQL 방언은 배제 제약 위반(SQLState `23P01`)의 제약 이름을 뽑지 않아 `violates`가 다른 제약과 같은 형식의 오류 메시지에서 직접 뽑는다.
- 여러 후보 중 하나를 골라 쓰는 변경(예: 예약의 객실 배정)은 후보 행을 비관적 잠금(`@Lock(LockModeType.PESSIMISTIC_WRITE)`, PostgreSQL에서 `for no key update`)으로 id 오름차순으로 잡은 뒤, 다음 문장에서 다시 조회해 고른다. 확인만 하고 고르면 동시에 온 요청이 같은 후보를 고른다. 잠금 순서를 id로 고정해 교착을 피하고, 잠금은 트랜잭션 끝까지 간다(게스트 앱 API 절). DB 제약(예: 배제 제약)은 안전망으로 함께 둔다.
- 동시 수정은 낙관적 잠금으로 막는다. 엔티티에 `@Version var version: Long`(`version bigint not null`)을 두고 응답에 `version`을 싣고, 수정 요청은 `version`을 필수로 받는다.
  - 서비스는 읽은 엔티티의 version이 요청과 다르면 도메인 409를 던진다.
  - 같은 version으로 동시에 들어온 수정은 flush 때 JPA가 막는다. flush를 서비스 안(`saveAndFlush`)에서 해 `OptimisticLockingFailureException`도 같은 도메인 409로 바꾼다. 커밋 때 터지면 서비스 밖이라 500이 된다.
  - 지금 낙관적 잠금을 쓰는 엔티티는 `Hotel`(`HOTEL_MODIFIED`), `HotelAdmin`(`HOTEL_ADMIN_MODIFIED`), `Room`(`ROOM_MODIFIED`), `RoomType`(`ROOM_TYPE_MODIFIED`), `Guest`(`GUEST_MODIFIED`)이다. version을 받지 않는 변경(예: 비밀번호 재설정, 활성 상태 변경)도 같은 엔티티를 바꾸면 같은 변환을 거친다.
- version과 따로 움직여야 하는 값(예: 객실 상태)은 요청에 화면에서 본 값을 함께 받아 "지금 값이 그것일 때만" 바꾸는 조건부 UPDATE로 막는다. 바뀐 행이 없으면 도메인 409다(`ROOM_STATUS_CHANGED`, 객실 상태 절).
- 한 번만 일어나야 하는 변경(예: 이용 취소)도 "아직 일어나지 않았을 때만" 바꾸는 조건부 UPDATE로 막는다. 바뀐 행이 없으면 도메인 409다(`STAY_ALREADY_CANCELED`, 이용 절).
- 유일한 키로 "있으면 쓰고 없으면 만드는" 행(예: 예약의 이용객)은 `insert ... on conflict (유일 인덱스) do nothing` 뒤 다시 조회한다. 유일 제약 위반을 잡아 바꾸는 방식은 트랜잭션이 깨져 이어서 쓸 수 없다(게스트 앱 API 절).
- 중복 확인 같은 조회는 엔티티를 바꾸기 전에 한다. 바뀐 엔티티가 있으면 조회 전 자동 flush로 제약 위반이 변환 범위 밖에서 난다.
- 테스트는 두 경로를 모두 확인한다.
  - 동시 요청: 두 스레드를 `CountDownLatch`로 함께 출발시킨다.
  - 사전 확인을 통과한 뒤 DB에서 막히는 경로: 먼저 온 트랜잭션을 열어 둔 채 다음 요청이 잠금을 기다리는지(`pg_stat_activity`) 확인하고 커밋한다(`HotelServiceTest`, `HotelMasterServiceTest`, `HotelOperatorServiceTest`, `RoomServiceTest`, `GuestServiceTest`, `StayServiceTest`). 조건부 UPDATE도 같은 방식으로 늦은 쪽이 0행이 되는 경로를, 비관적 잠금은 늦은 쪽이 잠금을 기다렸다가 다른 후보나 409가 되는 경로를 확인한다(객실 상태 절, 이용 절).
  - 동시 요청 테스트는 실행마다 어느 경로를 탈지 정해지지 않는다. 변환 코드를 지켜 주는 것은 순서를 고정한 경로 테스트다.

## 테스트

- JPA 테스트 전용 엔티티는 기본 패키지 밖인 `com.marco.assignment.handys.fixture`에 두고, 테스트에서 `@EntityScan`으로 기본 패키지와 함께 지정한다. 기본 패키지 안에 두면 `@SpringBootTest`가 테스트 엔티티까지 스키마 검증 대상으로 잡는다. 기본 패키지를 빼면 운영 리포지토리의 엔티티를 찾지 못해 컨텍스트가 뜨지 않는다.
- 테스트 전용 마이그레이션은 `src/test/resources/db/test-migration/`에 두고, 운영 버전(V1, V2…)과 겹치지 않게 `V0_1`처럼 0.x 버전을 쓴다.
- DB가 필요한 테스트는 `TestcontainersConfiguration`을 쓴다. 테스트용 PostgreSQL 컨테이너는 실행 사이에 재사용하고, 운영·테스트 마이그레이션을 함께 등록하며, 테스트 실행(JVM)마다 처음 한 번 DB를 초기화한다.
- 테스트 데이터
  - 저장소(JPA) 테스트는 트랜잭션 롤백을 기본으로 한다. 제약을 검증할 때는 `flush()`를 명시한다.
  - 트랜잭션 동작(경계, 커밋 시 제약, 지연 로딩, 동시성)을 검증하는 Service·API 테스트는 테스트 트랜잭션 없이 커밋하고, 끝난 뒤 직접 정리한다.
  - 빈 테이블, 특정 id 값, 테스트 실행 순서를 가정하지 않는다.
- 테스트 전용 메시지(에러 코드, 문서 키)는 `src/test/resources/test-messages.properties`에 두고, `spring.messages.basename=messages,test-messages`로 등록한다.
- 테스트용 컨트롤러는 테스트 클래스 안에 중첩하고 `@Import`로 등록한다.

## DB 마이그레이션 (Flyway)

- 파일 위치는 `src/main/resources/db/migration`이다.
- 파일 하나에 논리적인 스키마 변경 하나를 담는다. 보통 그 도메인 PR의 변경 하나다.
- 버전은 순차 정수를 쓴다. 예: `V1__create_app_admin.sql`, `V2__create_hotel.sql`
- 이미 적용된 파일은 수정하지 않는다. 변경은 새 버전 파일로 추가한다.
- 기존 테이블에 not null 컬럼을 더할 때는 default로 기존 행을 채운 뒤 default를 지운다. 새 행의 값은 엔티티가 정한다(`V4__add_hotel_admin_version.sql`, `V7__add_room_status.sql`).
- 한 파일에 여러 도메인의 테이블을 섞지 않는다.
- 시드 데이터는 스키마(DDL)와 다른 파일로 둔다.
- 도메인 규칙을 지키는 DB 제약(예: 이용 기간 겹침 방지)은 해당 도메인의 마이그레이션에 함께 넣는다.

## API 문서 (springdoc)

- 프론트엔드가 문서만 보고 API를 쓸 수 있도록 작성한다.
- 엔드포인트마다 설명, 요청·응답 필드 설명, 예시, 발생할 수 있는 에러 응답을 적는다.
- 태그 이름은 도메인 패키지 이름(영문 소문자)을 쓴다. 예: `hotel`
- 문서는 앱별 그룹(`app`, `app-admin`, `hotel-admin`)으로만 제공한다. 통합 문서(`/v3/api-docs`)는 끈다.
- operationId는 컨트롤러 메서드 이름이다. 그룹 안에서 유일하게 짓는다. 서로 다른 그룹에는 같은 이름(예: `getHotel`)이 있어도 된다.
- 설명 문구는 어노테이션에 직접 쓰지 않고 `messages.properties`의 키로 쓴다. 키는 `openapi.`로 시작한다.
  - 문서 설명: `openapi.info.description`
  - 그룹 이름: `openapi.group.{group}`
  - 태그: `openapi.{group}.tag.{tag}`
  - 오퍼레이션: `openapi.{group}.operation.{operationId}.summary` (필요하면 `.description`)
  - 요청 파라미터: `openapi.{group}.operation.{operationId}.parameter.{name}` (`@Parameter(description = ...)`)
  - 스키마 필드: `openapi.schema.{SchemaName}.{field}`
- 400·500 공통 에러 응답은 모든 API에 자동으로 붙는다. 게스트 그룹은 회원 로그인이 필요한 operation(`SecurityConfig.MEMBER_APIS`)에만 401이 붙는다. 어드민 그룹에는 401·403도 붙고(`SecurityConfig.PUBLIC_ADMIN_APIS`의 열린 API는 빼고), 상태를 바꾸는 operation(POST·PUT·PATCH·DELETE)의 403에는 `INVALID_CSRF_TOKEN` 예시가 함께 붙는다. 에러 응답 스키마는 `ErrorApiResponse`이고 `data`와 `message`는 `null` 타입이다.
- operation이 내는 도메인 에러는 도메인 어노테이션으로 적는다. 예: `@AccountApiErrors(AccountErrorCode.INVALID_CREDENTIALS)`. 자동 에러와 합쳐 상태 코드별로 예시가 붙는다.
  - 도메인마다 `{Domain}ErrorCode` 옆(`exception/`)에 `@ApiErrors`를 붙인 `annotation class {Domain}ApiErrors(vararg val value: {Domain}ErrorCode)`를 둔다(대상 FUNCTION, 유지 RUNTIME).
  - `CommonErrorResponseCustomizer`가 `@ApiErrors`가 붙은 어노테이션을 찾아 `value`를 읽는다. `value`가 ErrorCode enum 배열이 아니면 문서 생성이 실패한다.
- 돌려줄 data가 없으면 `ApiResponse<Nothing?>`를 반환하고 `ApiResponse.success(null)`로 응답한다. 문서에는 data가 null인 `EmptyApiResponse`로 나온다. `message`는 다른 성공 응답처럼 `string | null`이다.
- 문서 전체에 적용하는 처리는 `GlobalOpenApiCustomizer`로 만든다. `OpenApiCustomizer`는 그룹 문서에 적용되지 않는다.
- 생성 응답(201)은 `@ResponseStatus(HttpStatus.CREATED)`를 붙이고 `ApiResponse<T>`를 반환한다.
- 요청 DTO와 응답 DTO는 분리한다. 응답 스키마는 모든 필드가 required(nullable 필드는 `| null`)로, 요청 스키마는 non-null 필드만 required로 문서화된다.
- 응답 media type은 `application/json`이다.

## 로컬 실행

- Docker Desktop을 실행한 뒤 `./gradlew bootRun`을 실행한다. Docker Compose로 PostgreSQL 18이 자동으로 뜨고, 앱을 종료해도 계속 실행된다(`start-only`).
  - `compose.yaml`을 바꿨다면 `docker compose up -d`로 반영한다. 이미 떠 있으면 Spring이 기동을 건너뛰기 때문이다.
  - 개발 DB 정지는 `docker compose stop`, 데이터까지 삭제는 `docker compose down -v`다(`backend/`에서 실행).
- 테스트는 `./gradlew test`로 실행한다. 테스트용 PostgreSQL 18 컨테이너를 재사용한다.
  - 재사용하려면 `~/.testcontainers.properties`에 `testcontainers.reuse.enable=true`가 있어야 한다. 없으면 매번 새로 만든다.
  - 테스트 컨테이너를 새로 만들려면 `docker rm -f $(docker ps -aq --filter label=org.testcontainers.hash --filter ancestor=postgres:18)`를 실행한다.
- Gradle configuration cache가 켜져 있다(`gradle.properties`).
- Swagger UI는 `http://localhost:8080/swagger-ui.html`, 문서는 `http://localhost:8080/v3/api-docs/app`, `http://localhost:8080/v3/api-docs/app-admin`, `http://localhost:8080/v3/api-docs/hotel-admin`이다.

## 로컬 더미 데이터

- 백엔드가 뜰 때(`seed/config/SeedConfig`의 `ApplicationRunner`) `urbanstay.seed.enabled`가 `true`이고 호텔이 하나도 없으면 화면마다 확인할 만큼의 더미 데이터를 한 트랜잭션으로 넣는다(`SeedService.seedIfEmpty`). 호텔이 하나라도 있으면 아무것도 하지 않고, 중간에 실패하면 아무것도 남지 않는다.
  - `application.properties`는 `true`다. 테스트는 `src/test/resources/config/application.properties`가 `false`로 덮어쓴다(`classpath:/config/`가 나중에 읽혀 우선한다). 테스트 DB에 더미 데이터가 섞이지 않게 하기 위해서다.
  - 호텔이 이미 있는 개발 DB에는 넣지 않는다. 처음부터 넣으려면 `docker compose down -v`로 데이터를 지운 뒤 `./gradlew bootRun`을 실행한다.
- 서비스 규칙을 그대로 거친다: 호텔과 마스터(`HotelService.create`), 운영자(`HotelOperatorService.create`), 유형(`RoomTypeService.create`), 객실과 `(없음 → 공실)` 이력(`RoomService.create`, 등록한 계정은 마스터), 상태 변경과 이력(`RoomService.changeStatus`, 운영자A·운영자B·마스터가 번갈아), 회원(`MemberService.signup`, 비밀번호 해시), 회원과 연결된 이용객(`GuestService.getOrCreate`), 끝나지 않은 이용의 취소(`StayService.cancel`).
- 서비스로 만들 수 없는 것만 저장소로 넣는다(다른 도메인의 Repository를 쓰지 않는 규칙의 예외).
  - 지난 이용: 예약은 오늘 이후 체크인만 받으므로 `StayRepository.saveAndFlush(Stay(...))`로 넣는다. 금액은 엔티티가 그 유형의 1박 요금으로 계산하고, 인원은 유형의 최대 인원 이하이며, 같은 객실의 기간은 겹치지 않게 짰다(배제 제약이 막는다).
  - 회원 없는 이용객: 예약은 회원만 하므로 `GuestRepository`로 넣는다. 전화번호는 호텔 안에서 회원과도 겹치지 않는다.
  - 지난 이용의 취소: 취소는 끝나지 않은 이용만 받으므로 `StayRepository.cancel`로 체크인 3일 전 10시(Asia/Seoul)를 취소 시각으로 넣는다.
- 날짜는 오늘(`Clock`) 기준 상대 날짜다(체크인 −40일 ~ +33일). 어느 날 띄워도 지난달·이번 달·다음 달에 체크인이 있다.
- 넣는 데이터
  - 호텔 3곳: 어반스테이 강남(객실 12), 홍대(10), 해운대(8). 호텔마다 마스터 1·운영자 2.
  - 객실 유형(호텔마다 3개): 스탠다드(2명, 15:00/11:00), 디럭스(3명, 15:00/12:00), 스위트(4명, 14:00/12:00). 1박 요금은 강남 89,000/129,000/219,000원, 홍대 79,000/115,000/189,000원, 해운대 99,000/149,000/259,000원.
  - 객실: 101~105 스탠다드, 201~205 디럭스, 301~302 스위트 중 호텔 객실 수만큼. 상태는 101·201 이용중(지금 이용), 102 정비중(오늘 체크아웃, 공실 → 예약됨 → 이용중 → 정비중), 103 예약됨(내일 체크인), 302 정비중(공실 → 정비중), 나머지 공실이다.
  - 회원 10명. 회원마다 이용이 하나 이상 있고, member3 말고는 두 호텔 이상에 이용이 있다.
  - 이용 40건: 호텔마다 12건과 취소 4건(강남 2(지난 이용 1·앞으로 1), 홍대 1(사유 없음), 해운대 1(지난 이용)). 스위트 2실이 모두 +5일~+8일에 예약돼 그 기간에는 스위트를 예약할 수 없다.
  - 이용객: 회원과 연결된 이용객과 회원 없는 이용객(호텔마다 4명)이 섞인다.
- 테스트 계정. 비밀번호는 모두 `Test1234!`(로컬 테스트 값, `SeedService.PASSWORD`)다.

  | 구분 | 아이디 |
  |---|---|
  | 전체 어드민 | `urbanstay.initial-admin.*` 설정값(계정 절) |
  | 강남 마스터 / 운영자 | `master1@urbanstay.test` / `operator1a@urbanstay.test`, `operator1b@urbanstay.test` |
  | 홍대 마스터 / 운영자 | `master2@urbanstay.test` / `operator2a@urbanstay.test`, `operator2b@urbanstay.test` |
  | 해운대 마스터 / 운영자 | `master3@urbanstay.test` / `operator3a@urbanstay.test`, `operator3b@urbanstay.test` |
  | 회원 | `member1@urbanstay.test` ~ `member10@urbanstay.test` |

- 테스트(`SeedServiceTest`): 테스트 트랜잭션 안에서 관련 테이블을 지우고, 켠 설정의 러너를 두 번 실행해 개수(호텔 3·호텔 계정 9·유형 9·객실 30·회원 10·이용 30~40·취소 3~5)가 늘지 않는지 보고 롤백한다. 객실 상태 네 가지, 지금 이용, 지난달~다음 달 체크인, 회원·비회원 이용객, 비밀번호 해시도 확인한다. 같은 객실의 겹침은 저장이 배제 제약을 통과한 것으로 확인한다. 테스트 설정의 러너가 아무것도 넣지 않는지도 확인한다.
