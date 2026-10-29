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

- 모든 응답은 API 규약의 공통 형식(`success / data / error`)으로 감싼다. 에러도 같은 형식이다.
- 예외는 전역에서 처리해 공통 에러 형식으로 바꾼다.
- 요청 본문을 읽지 못했거나 요청 파라미터가 맞지 않으면 400 `INVALID_INPUT`이다. 어느 필드인지 알 수 있으면 `fieldErrors`에 하나를 담는다(`GlobalExceptionHandler`).
  - 문서에 없는 필드: `validation.unknown-field`. 모든 앱의 JSON 본문에 적용한다(`spring.jackson.deserialization.fail-on-unknown-properties=true`).
  - non-null 프로퍼티의 빠진 필드·null, 빠진 필수 요청 파라미터: `validation.required`
  - non-null 원소 목록(예: `List<String>`)의 null 원소도 `validation.required`이고 필드는 원소 경로(예: `tags[0]`)다. Kotlin 모듈의 `StrictNullChecks`(기본 켜짐)가 막는다. `List<String?>`는 null 원소를 받는다.
  - 타입이 틀린 값(예: 문자열 자리에 배열·객체), 쿼리·경로 파라미터 타입 불일치: `validation.type`
  - enum은 상수 이름 문자열만 받는다(대소문자 구분). 숫자(예: `0`)와 없는 이름은 `validation.type`이다(`spring.jackson.datatype.enum.fail-on-numbers-for-enums=true`).
  - `LocalDate`, `LocalDateTime`, `OffsetDateTime`은 ISO 8601 문자열(예: `2026-10-29`, `2026-10-29T10:00:00`, `2026-10-29T10:00:00+09:00`)만 받는다. 숫자(타임스탬프), 배열, 숫자 문자열, 다른 형식은 `validation.type`이다(`JacksonConfig`의 `isoDateTimeModule`, `@JsonFormat` 패턴으로 바꿀 수 없다). `OffsetDateTime`은 UTC로 바꿔 읽는다. 다른 날짜·시간 타입(예: `Instant`)을 요청에 쓰려면 먼저 `isoDateTimeModule`에 등록한다.
  - Jackson의 스칼라 강제 변환은 끈다. 숫자·불리언을 문자열로, 문자열을 숫자·불리언으로, 실수를 정수로 바꾸지 않고 `validation.type`으로 응답한다. 문자열 대상은 `common/config/JacksonConfig`가, 나머지는 `application.properties`의 `spring.jackson.mapper.allow-coercion-of-scalars=false`, `spring.jackson.deserialization.accept-float-as-int=false`가 막는다.
  - 필드 이름은 Bean Validation과 같은 경로 형식이다. 예: `name`, `address.city`, `rooms[0].name`. 요청 파라미터는 파라미터 이름이다.
  - 중첩 요청 객체 필드에는 `@Valid`를 붙여 안쪽 필드까지 검증한다(예: 호텔 등록의 `master`, 오류 필드는 `master.loginId`).
  - 필드를 알 수 없는 오류(JSON 문법 오류, 빈 본문, 본문 전체의 타입 불일치, 지원하지 않는 미디어 타입)는 빈 `fieldErrors`다.
  - Jackson은 첫 오류에서 멈추므로 본문을 읽는 오류는 `fieldErrors`가 하나다. Bean Validation 오류는 틀린 필드를 모두 담는다.
- 앞뒤 공백을 지운 값으로 검사할 문자열 필드에는 `@JsonDeserialize(using = TrimmedStringDeserializer::class)`(`common/request`)를 붙인다. 본문을 읽을 때 Kotlin `trim()`으로 지우므로 `@NotBlank`·길이·형식 제약이 지운 값에 걸린다. 타입·null 처리는 기본 문자열과 같다. 저장할 값의 정규화는 엔티티가 따로 한다(예: `Hotel.normalize`).
- 문자열 요청 파라미터(예: 검색어)는 컨트롤러의 `@InitBinder`에서 `TrimmedStringEditor`(`common/request`)를 등록해 앞뒤 공백을 지우고, 비면 null로 받는다. `@Size` 같은 제약은 지운 값에 걸린다.
- 필수 문자열(`@NotBlank`)은 문서에 `minLength: 1`로 나온다. `@Size`는 문서의 minLength를 `min`(기본 0)으로 덮으므로 필수 문자열의 최대 길이는 `@Size` 대신 Hibernate Validator의 `@Length(max = ..., message = "{validation.max-length}")`로 검사하고 문서 길이는 `@Schema(maxLength = ...)`로 적는다. 선택 문자열은 `@Size(max)`를 그대로 쓴다.
- 형식이 있는 필수 문자열(예: 전화번호)은 `@NotBlank`와 `@PatternThenMaxLength`(`common/validation`)를 붙이고 `@Pattern`·`@Size`는 쓰지 않는다. 필드마다 오류가 하나만 난다. 빈 값은 `validation.required`, 형식이 틀리면 길이와 관계없이 형식 메시지, 형식이 맞는데 길면 `validation.max-length`다. 문서의 형식과 길이는 `@Schema(pattern = ..., maxLength = ...)`로 적는다.

## 목록 조회

- 목록 API는 `ApiResponse<PageResponse<T>>`(`common/response/PageResponse`)로 응답한다. 서비스가 돌려준 `Page`를 `PageResponse.from(page.map(...))`으로 바꾼다. 문서 스키마 이름은 `PageResponse{항목 스키마}`(예: `PageResponseHotelAppAdminResponse`)이고 모든 필드가 필수다.
- `page`(0~99, 기본 0), `size`(1~100, 기본 10)는 `@RequestParam`으로 받고 `common/request/PageParams` 상수를 쓴다(`@Min`·`@Max`, 메시지 `validation.min`·`validation.max`). 범위를 벗어나면 메서드 검증으로 400 `INVALID_INPUT`이고 `fieldErrors`의 필드는 파라미터 이름이다. 100페이지 밖의 항목은 검색으로 좁혀 찾는다.
- 정렬 기준은 서비스에서 정하고 operation 설명에 적는다.
- 부분 일치 검색은 Spring Data 파생 쿼리(예: `findByNameContainingIgnoreCase`)로 한다. 파생 쿼리는 `\`, `%`, `_`를 이스케이프하고 `escape '\'`를 붙여 입력을 글자 그대로 찾는다. `@Query`로 LIKE를 직접 쓰면 이스케이프되지 않는다.

## 보안

- 경로별 접근 규칙은 `common/config/SecurityConfig`에 둔다. 필터 체인은 어드민 경로용과 그 밖의 경로용 두 개다.
  - `ApiPaths.APP`: 로그인 없이 쓴다.
  - `ApiPaths.APP_ADMIN`: `Role.APP_ADMIN`만, `ApiPaths.HOTEL_ADMIN`: `Role.HOTEL_ADMIN`만 쓴다.
  - 호텔 계정은 모두 `Role.HOTEL_ADMIN`을 받고, 마스터는 `Role.HOTEL_MASTER`도 받는다. 마스터만 쓰는 API는 `Role.HOTEL_MASTER`로 막는다.
  - 로그인 없이 여는 어드민 API는 `SecurityConfig.PUBLIC_ADMIN_APIS`(HTTP 메서드 + 경로)에만 적는다. 접근 규칙(permitAll)과 API 문서(401·403 자동 에러 제외)가 이 목록 하나를 함께 쓴다. 지금은 전체 어드민 로그인과 호텔 운영자 로그인이다. 열린 API에도 CSRF는 걸린다.
  - Swagger UI와 API 문서(`/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`): 로그인 없이 연다.
  - 그 밖의 경로(actuator 포함)는 막는다. 에러 디스패치는 원래 상태 코드를 유지하도록 연다.
  - 기본 폼 로그인, HTTP Basic, 기본 로그아웃은 끈다.
- CSRF는 어드민 API에만 SPA 모드(`csrf.spa()`)로 건다. 쿠키 없이 들어온 어드민 API 요청의 응답(401 포함)에 `XSRF-TOKEN` 쿠키(스크립트에서 읽을 수 있음)가 발급되고, 상태를 바꾸는 요청은 같은 값을 `X-XSRF-TOKEN` 헤더로 보낸다. 게스트 API에는 CSRF 필터가 없다.
- 보안 에러는 `SecurityErrorHandler`가 공통 형식으로 응답한다.
  - 로그인 안 함: 401 `UNAUTHORIZED`
  - 권한 없음: 403 `FORBIDDEN`
  - CSRF 토큰 없음·불일치: 403 `INVALID_CSRF_TOKEN`. CSRF 검사가 인가보다 먼저라서 로그인하지 않고 토큰 없이 보낸 상태 변경 요청도 이 코드다.
- 컨트롤러에서 발생한 `AccessDeniedException`, `AuthenticationException`은 `GlobalExceptionHandler`가 다시 던져 Spring Security가 401·403으로 응답한다.
- 세션은 서버 메모리에 두고 8시간 유지한다. 세션 쿠키는 HttpOnly, SameSite=Lax다(`application.properties`). 게스트 API는 세션을 만들지 않는다.
- 로그인한 세션은 요청마다 계정을 다시 확인한다. 어드민 필터 체인의 SecurityContext 저장소를 `VerifyingSecurityContextRepository`(`common/security`)로 감싼다.
  - 세션에서 SecurityContext를 처음 꺼낼 때(인가 전) `SessionAuthenticationVerifier` 빈이 모두 통과시켜야 그 인증을 쓴다. 하나라도 거절하면 세션을 무효화하고 로그인하지 않은 요청으로 처리해 401 `UNAUTHORIZED`로 응답한다. CSRF 검사는 그보다 먼저다.
  - 도메인은 자기 계정의 확인 규칙을 `SessionAuthenticationVerifier` 빈으로 둔다. 자기 principal이 아니면 통과시킨다.
  - 호텔 계정은 `HotelAdminSessionVerifier`가 DB에서 다시 읽어, 없거나 비활성이거나 `credential_version`이 세션 값과 다르면 거절한다. 이름 변경은 세션을 끊지 않는다.
  - 전체 어드민 세션은 확인하지 않는다(어드민 계정을 바꾸는 API가 아직 없다).
- 테스트
  - 로그인 사용자는 `with(user("tester").roles(Role.APP_ADMIN.name))`로 만든다. 이 가짜 사용자는 호텔 계정 principal이 아니라서 요청마다 계정 확인을 거치지 않는다. 호텔 계정의 세션 동작은 실제 로그인으로 확인한다.
  - CSRF 토큰은 어드민 API 응답의 `XSRF-TOKEN` 쿠키를 받아 `cookie(xsrf)`와 `header("X-XSRF-TOKEN", xsrf.value)`로 보낸다. `csrf()` post-processor는 쓰지 않는다. 캐시된 컨텍스트의 CsrfFilter 저장소를 세션 저장소로 바꿔 다른 테스트에 영향을 준다.
  - `@WebMvcTest`는 `SecurityConfig`, `JacksonConfig`를 읽지 않으므로 `SecurityConfig`, `JacksonConfig`, `SecurityErrorHandler`, `ErrorResponseFactory`를 `@Import`한다. 테스트용 컨트롤러는 열린 경로나 검증할 앱 경로 아래에 둔다.
  - 세션 쿠키 속성과 에러 디스패치는 서블릿 컨테이너 동작이라 MockMvc로 확인할 수 없다. `RANDOM_PORT`로 띄운 서버에 HTTP로 요청한다.
  - 로그인·로그아웃 API는 가짜 사용자 없이 `RANDOM_PORT` 서버에 실제 세션·`XSRF-TOKEN` 쿠키를 주고받으며 확인한다.

## 인증

- 로그인·로그아웃·내 정보 경로는 `{앱 경로}/auth/login`, `/auth/logout`, `/auth/me`다(`ApiPaths.AUTH`, `ApiPaths.LOGIN`).
- 인증은 앱마다 따로 만든다. 앱의 인증 서비스(`AppAdminAuthService`, `HotelAdminAuthService`)가 그 앱의 `UserDetailsService`와 `PasswordEncoder`로 `DaoAuthenticationProvider`를 만들어 자기 `ProviderManager`에 넣는다. 다른 앱의 계정으로는 인증되지 않는다.
  - Spring Boot의 전역 `AuthenticationManager`는 쓰지 않는다. 앱별 매니저를 `AuthenticationManager` 타입 빈으로 만들지 않는다. 그런 빈이 둘 이상이고 `UserDetailsService` 빈도 둘 이상이면 전역 매니저를 만들다가 시작에 실패한다.
  - 없는 아이디와 틀린 비밀번호는 `DaoAuthenticationProvider`가 같은 예외로, 처리 시간 차이를 줄여 처리한다. 서비스는 이를 도메인 에러(`INVALID_CREDENTIALS`, 401)로 바꾼다. 계정 조회 중 오류는 로그인 실패가 아니라 500으로 응답한다.
  - 로그인할 수 없는 계정(예: 비활성 호텔 계정)은 `UserDetailsService`가 찾지 못한 것으로(`UsernameNotFoundException`) 처리해 없는 아이디와 같은 응답, 같은 처리 시간 균등화를 탄다.
  - `ProviderManager`는 인증 뒤 입력한 비밀번호와 principal의 비밀번호 해시를 지운다(`CredentialsContainer`). 그래서 세션에 비밀번호가 남지 않는다. 직접 만든 principal(`HotelAdminPrincipal`)도 `CredentialsContainer`를 구현한다.
  - 호텔 계정의 principal(`HotelAdminPrincipal`)은 계정 id, 호텔 id, `credential_version`을 담는다. 응답에 쓰는 이름 같은 값은 세션이 아니라 DB에서 읽는다.
  - `UserDetailsService` 빈이 둘이라 시작할 때 Spring Security가 전역 매니저에 쓰지 않는다는 WARN 로그(`Found 2 UserDetailsService beans`)를 남긴다. 전역 매니저를 쓰지 않으므로 정상이다.
- 세션 처리는 `common/security/LoginSessionHandler`가 Spring Security 구현체로 한다. `SecurityConfig`가 어드민 필터 체인과 같은 CSRF 토큰 저장소·SecurityContext 저장소를 넘겨 만든다.
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
  - 호텔(`hotel_id`)에 속하고 역할(`HotelAdminRole`: `MASTER`, `OPERATOR`), 활성 여부(`active`), 로그인 정보 버전(`credential_version`)을 가진다. 이름은 앞뒤 공백을 지워 저장한다.
  - 로그인 아이디는 모든 호텔 계정을 통틀어 유일하다(`hotel_admin_login_id_key`). 사전 확인과 함께 이 제약 위반도 `AccountErrorCode.LOGIN_ID_DUPLICATED`(409)로 바꾼다.
  - 호텔마다 마스터는 하나다(부분 유일 인덱스 `hotel_admin_master_key`).
  - `credential_version`은 0에서 시작한다. 기존 세션을 끊어야 하는 변경(비활성화, 비밀번호 재설정, 아이디 변경)에서 올린다. 이름 변경은 올리지 않는다.
  - 마스터는 호텔 등록(`HotelService.create`)이 계정 도메인의 `HotelAdminService`로 같은 트랜잭션에서 만든다. 사전 확인은 호텔 중복 → 아이디 중복 순서이고, 저장은 호텔 → 마스터 순서다. 마스터 저장이 실패하면 호텔도 남지 않는다.
- `AppAdminUserDetailsService`가 로그인 아이디로 전체 어드민을 읽고 `Role.APP_ADMIN`을 준다. `HotelAdminUserDetailsService`는 활성 호텔 계정만 읽고 `Role.HOTEL_ADMIN`(마스터는 `Role.HOTEL_MASTER`도)을 준다. 이 빈들이 있어서 Spring Boot의 기본 사용자(`user`, 생성 비밀번호)는 만들어지지 않는다.
- 첫 전체 어드민은 백엔드가 뜰 때(`account/config/InitialAdminConfig`의 `ApplicationRunner`) `urbanstay.initial-admin.*`(`login-id`, `password`, `name`) 설정값으로 만든다.
  - 전체 어드민이 하나도 없을 때만 만들고, 하나라도 있으면 아무것도 하지 않는다. 기존 계정은 바꾸지 않는다.
  - 설정값은 `application.properties`에 있고, 과제 제출용으로 커밋한다.
  - 설정값은 시작할 때 검증한다(이메일 형식, 빈 값 금지, 로그인 아이디 254자·이름 50자 이하). 올바르지 않으면 앱이 뜨지 않는다.
  - 로컬 단일 인스턴스로 실행하는 과제라 시작 시 경합은 그대로 둔다. 두 인스턴스가 동시에 뜨면 같은 아이디는 유일 제약으로 늦은 쪽이 시작에 실패하고, Tomcat이 뜬 뒤 첫 어드민이 만들어지기 전 잠깐(약 1초)은 어드민이 없다.
- 테스트
  - `@SpringBootTest` 컨텍스트가 뜰 때도 첫 어드민 생성이 실행되므로 테스트 DB에 어드민이 남아 있을 수 있다. 어드민이 없는 상태가 필요하면 테스트 트랜잭션 안에서 지우고 롤백한다.
  - 호텔 계정이 있는 호텔은 외래 키 때문에 지우기 전에 그 호텔의 `hotel_admin`을 먼저 지운다.
  - 비활성화·`credential_version` 변경처럼 아직 API가 없는 변경은 테스트에서 DB를 직접 바꿔 재현한다.

## 상수

- 응답 메시지는 `src/main/resources/messages.properties`에 두고 MessageSource로 읽는다.
- 에러 코드는 별도 문자열 없이 enum 이름을 쓴다. 메시지 키는 `ErrorCode.messageKey`(`error.{CODE}`)다.
- 도메인 ErrorCode enum을 추가하면 `messages.properties`에 키를 추가하고, `ErrorCodeMessageTest`의 목록에 등록한다.
- 입력 검증 메시지는 제약마다 하나인 공용 키(`validation.{제약}`)를 `messages.properties`에 두고 어노테이션에서 `{키}`로 쓴다. 예: `@NotBlank(message = "{validation.required}")`
  - 키 이름: `validation.required`(필수), `validation.email`(이메일 형식), `validation.max-length`(최대 길이, 문구에 `{max}`를 넣는다), `validation.min`·`validation.max`(숫자 범위, 문구에 `{value}`를 넣는다), `validation.phone`(전화번호 형식), `validation.password`(비밀번호 규칙), `validation.type`(타입이 틀린 값), `validation.unknown-field`(문서에 없는 필드)
  - `validation.type`, `validation.unknown-field`는 어노테이션이 아니라 `GlobalExceptionHandler`가 본문·파라미터 오류에 쓴다.
  - Spring Boot의 MessageSource 기반 interpolator가 키를 풀고, `{max}` 같은 제약 속성은 Hibernate Validator가 채운다. 응답의 `fieldErrors[].message`에 풀린 문구가 들어간다.
  - 실제로 쓰는 키만 추가한다.
- 설정값은 `application.properties`에 둔다.

## 엔티티

- 모든 엔티티는 공통 엔티티(`common/entity/BaseEntity`)를 상속한다.
  - `id`: `Long`, IDENTITY 전략
  - `createdAt`, `updatedAt`: `Instant`, JPA Auditing으로 관리
- 테이블 DDL에는 공통 컬럼을 아래와 같이 둔다.
  - `id bigint generated by default as identity primary key`
  - `created_at timestamptz not null`
  - `updated_at timestamptz not null`
- 스키마는 Flyway로만 바꾼다. 앱 시작 시 `ddl-auto=validate`로 엔티티와 스키마가 일치하는지 검사한다.
- open-in-view는 끈다. 지연 로딩은 Service의 트랜잭션 안에서만 쓴다.

## 동시성과 충돌

- 유일해야 하는 값은 서비스의 사전 확인과 함께 마이그레이션의 이름 있는 유일 제약(예: `constraint hotel_name_address_key unique (name, address)`)으로 막는다. 사전 확인만으로는 동시에 온 요청이 둘 다 통과한다.
  - 서비스는 저장을 `saveAndFlush`로 서비스 안에서 실행하고, `DataIntegrityViolationException`이 그 제약을 가리키면(`common/exception`의 `violates(제약 이름)`) 도메인 409로 바꾼다. 다른 제약 위반은 그대로 던진다(500).
  - 제약 이름은 엔티티 상수로 둔다. 예: `Hotel.NAME_ADDRESS_UNIQUE_CONSTRAINT`
- 동시 수정은 낙관적 잠금으로 막는다. 엔티티에 `@Version var version: Long`(`version bigint not null`)을 두고 응답에 `version`을 싣고, 수정 요청은 `version`을 필수로 받는다.
  - 서비스는 읽은 엔티티의 version이 요청과 다르면 도메인 409를 던진다.
  - 같은 version으로 동시에 들어온 수정은 flush 때 JPA가 막는다. flush를 서비스 안(`saveAndFlush`)에서 해 `OptimisticLockingFailureException`도 같은 도메인 409로 바꾼다. 커밋 때 터지면 서비스 밖이라 500이 된다.
- 중복 확인 같은 조회는 엔티티를 바꾸기 전에 한다. 바뀐 엔티티가 있으면 조회 전 자동 flush로 제약 위반이 변환 범위 밖에서 난다.
- 테스트는 두 경로를 모두 확인한다.
  - 동시 요청: 두 스레드를 `CountDownLatch`로 함께 출발시킨다.
  - 사전 확인을 통과한 뒤 DB에서 막히는 경로: 먼저 온 트랜잭션을 열어 둔 채 다음 요청이 잠금을 기다리는지(`pg_stat_activity`) 확인하고 커밋한다(`HotelServiceTest`).

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
- 버전은 순차 정수를 쓴다. 예: `V1__create_hotel.sql`, `V2__create_room.sql`
- 이미 적용된 파일은 수정하지 않는다. 변경은 새 버전 파일로 추가한다.
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
- 400·500 공통 에러 응답은 모든 API에 자동으로 붙는다. 어드민 그룹에는 401·403도 붙고(`SecurityConfig.PUBLIC_ADMIN_APIS`의 열린 API는 빼고), 상태를 바꾸는 operation(POST·PUT·PATCH·DELETE)의 403에는 `INVALID_CSRF_TOKEN` 예시가 함께 붙는다. 에러 응답 스키마는 `ErrorApiResponse`다.
- operation이 내는 도메인 에러는 도메인 어노테이션으로 적는다. 예: `@AccountApiErrors(AccountErrorCode.INVALID_CREDENTIALS)`. 자동 에러와 합쳐 상태 코드별로 예시가 붙는다.
  - 도메인마다 `{Domain}ErrorCode` 옆(`exception/`)에 `@ApiErrors`를 붙인 `annotation class {Domain}ApiErrors(vararg val value: {Domain}ErrorCode)`를 둔다(대상 FUNCTION, 유지 RUNTIME).
  - `CommonErrorResponseCustomizer`가 `@ApiErrors`가 붙은 어노테이션을 찾아 `value`를 읽는다. `value`가 ErrorCode enum 배열이 아니면 문서 생성이 실패한다.
- 돌려줄 data가 없으면 `ApiResponse<Nothing?>`를 반환하고 `ApiResponse.success(null)`로 응답한다. 문서에는 data가 null인 `EmptyApiResponse`로 나온다.
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
