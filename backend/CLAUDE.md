# 백엔드 작업 지침

백엔드(Kotlin, Spring Boot) 작업 시 따르는 규칙. 프론트엔드와 공통인 규칙은 docs/ 문서를 따른다.

## 참고 문서

- 도메인 뼈대: @../docs/domain.md
- 백엔드 개발 플로우: @../docs/backend-flow.md
- API 규약: @../docs/api-convention.md

## 패키지 구조

- 기본 패키지는 `com.marco.assignment.handys.urbanstay`이다.
- 도메인별로 패키지를 나누고, 도메인 안은 하위 패키지로 나눈다.

```
urbanstay/
├─ common/
└─ {domain}/
   ├─ controller/
   ├─ service/
   ├─ repository/
   ├─ entity/
   └─ dto/
```

- 여러 도메인이 함께 쓰는 코드는 `common/`에 둔다.
- 다른 도메인을 쓸 때는 그 도메인의 Service를 통해서만 쓴다. 다른 도메인의 Repository를 직접 쓰지 않는다. 엔티티 간 JPA 연관관계는 허용한다.

## 응답과 예외

- 모든 응답은 API 규약의 공통 형식(`success / data / error`)으로 감싼다. 에러도 같은 형식이다.
- 예외는 전역에서 처리해 공통 에러 형식으로 바꾼다.
- 엔티티의 생성·수정 시각은 JPA Auditing 공통 엔티티로 관리한다.

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

## 로컬 실행

- Docker Desktop을 실행한 뒤 `./gradlew bootRun`을 실행한다. Docker Compose로 PostgreSQL 18이 자동으로 뜬다.
- 테스트는 `./gradlew test`로 실행한다. Testcontainers로 PostgreSQL 18을 띄운다.
- Swagger UI는 `http://localhost:8080/swagger-ui.html`, 문서는 `http://localhost:8080/v3/api-docs`이다.
