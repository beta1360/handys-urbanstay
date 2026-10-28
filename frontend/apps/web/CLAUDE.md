# 게스트 앱(web) 작업 지침

게스트가 쓰는 앱(Next.js). 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를 따른다.

## 참고 문서

- Next.js 에이전트 규칙: @AGENTS.md

## 화면

- 어반스테이 앱처럼 앱 형태의 UI로 만든다. 데스크톱에서도 모바일 폭으로 고정된 가운데 컬럼으로 보여준다.
- 폰트는 Pretendard를 쓴다.

## 구조

- Next.js 라우팅은 `app/`에, FSD 레이어는 `src/`에 둔다.
- `app/`의 라우트 파일은 `src/_pages`의 페이지를 가져와 내보내기만 한다.
- Next.js 라우트 파일(page, layout 등)만 default export를 쓴다.
- Steiger의 `fsd/typo-in-layer-name`은 `_app`·`_pages`에서만 끈다. 접두어가 붙은 레이어를 오타로 잘못 잡는 Steiger 버그(feature-sliced/steiger#282) 때문이며, 수정되면 예외를 없앤다.

```
apps/web/
├─ app/            # Next.js 라우팅
└─ src/
   ├─ _app/
   ├─ _pages/
   ├─ widgets/
   ├─ features/
   ├─ entities/
   └─ shared/
```

## API 호출

- 앱 전용 API(`/api/v1/app/**`)만 쓴다.
- 대부분의 API 호출은 서버 사이드에서 한다. 사용자 인터랙션에 따른 호출만 브라우저에서 Next rewrites를 거친다.
- API 코드는 orval이 TanStack Query 훅과 fetch 함수로 생성한다. 요청은 mutator인 `shared/api/http.ts`를 거친다.
- 백엔드 주소는 `.env.local`의 `API_BASE_URL`에서 읽는다. 서버 전용 변수라 `NEXT_PUBLIC_`을 붙이지 않는다. `.env.local`은 과제 제출용으로 커밋한다.
- 서버에서는 `API_BASE_URL`을 붙인 절대 주소로, 브라우저에서는 상대 경로로 요청해 rewrites를 거친다.
- 2xx가 아닌 응답의 처리는 첫 도메인을 개발할 때 정한다.

## 렌더링

- Cache Components가 켜져 있다. 캐시할 부분은 `'use cache'`로 명시한다.
