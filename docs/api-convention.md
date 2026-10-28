# API 규약

프론트엔드와 백엔드가 함께 지키는 API 규칙. 프로젝트에 종속된 세부 규칙은 각 프로젝트의 CLAUDE.md에 둔다.

## 경로

- API는 쓰는 앱에 따라 나눈다. 게스트 앱과 운영 앱은 정책이 다르므로 서로의 API를 쓰지 않는다.
  - 게스트 앱 전용: `/api/v1/app/{리소스}`
  - 운영 앱 전용: `/api/v1/ops/{리소스}`

## 응답 형식

성공과 에러 모두 같은 형식으로 감싼다.

```json
{
  "success": true,
  "data": { "id": 1, "name": "..." },
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "객실을 찾을 수 없습니다.",
    "fieldErrors": []
  }
}
```

| 필드 | 설명 |
|---|---|
| `success` | 요청 성공 여부 |
| `data` | 성공 시 결과. 실패 시 `null` |
| `error` | 실패 시 에러 정보. 성공 시 `null` |
| `error.code` | 에러 코드 |
| `error.message` | 에러 메시지 |
| `error.fieldErrors` | 입력 검증 실패 목록. 각 항목은 `{ "field": "name", "message": "필수 입력입니다." }` 형태. 해당 없으면 빈 배열 |

### HTTP 상태 코드

상태 코드는 의미에 맞게 쓰고, 본문은 항상 위 형식으로 보낸다.

| 상황 | 상태 코드 |
|---|---|
| 성공 | 200 |
| 생성 성공 | 201 |
| 입력 오류 | 400 |
| 대상 없음 | 404 |
| 충돌 (예: 같은 객실의 이용 기간 겹침) | 409 |
| 서버 오류 | 500 |

### 에러 코드

- 대문자 스네이크 케이스로 쓴다. 예: `ROOM_NOT_FOUND`
- 도메인별 에러 코드는 각 도메인을 개발할 때 정한다.

## API 문서 (Swagger)

- 백엔드는 springdoc으로 OpenAPI 문서를 제공한다. Swagger UI는 `/swagger-ui.html`이다.
- 문서는 앱별 그룹으로 나눈다. 게스트 앱은 `/v3/api-docs/app`, 운영 앱은 `/v3/api-docs/ops`.
- 프론트엔드가 문서만 보고 API를 쓸 수 있는 수준으로 작성한다. 설명, 필드 설명, 예시, 에러 응답을 포함한다.

## 프론트엔드 호출 방식

- 게스트 앱(web)
  - 대부분의 API 호출은 서버 사이드에서 한다.
  - 사용자 인터랙션에 따른 브라우저 호출은 Next rewrites로 `/api/v1/app/*`를 백엔드로 넘긴다.
- 운영 앱(ops)의 호출 방식은 운영 앱을 구성할 때 정한다.
- CORS는 설정하지 않는다. 로컬 실행과 테스트 용도다.
- 백엔드 주소는 `.env`에서 읽는다.

## codegen

- 각 앱은 orval로 자기 문서 그룹에서만 API 코드를 생성한다.
  - 게스트 앱: `/v3/api-docs/app` → TanStack Query 훅 + fetch
  - 운영 앱: `/v3/api-docs/ops` → TanStack Query 훅 + axios
- `frontend/`에서 `pnpm codegen`을 실행한다. 백엔드가 실행 중이어야 한다.
- 생성 코드는 각 앱의 `src/shared/api/generated`에 두고 커밋하며, 직접 수정하지 않는다.
- 백엔드 API가 바뀌면 codegen을 다시 실행해 생성 코드를 갱신한다.
