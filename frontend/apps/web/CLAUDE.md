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
- API 코드는 orval이 TanStack Query 훅과 fetch 함수로 생성한다.
- 백엔드 주소는 `.env`에서 읽는다.

## 렌더링

- Cache Components가 켜져 있다. 캐시할 부분은 `'use cache'`로 명시한다.
