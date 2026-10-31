# 프로젝트 작업 지침

## 과제와 확정된 전제

- 운영/예약/숙박 도메인의 문제를 가정하고, 이를 해결하는 작은 결과물을 제출한다.
- 평가 대상은 구현 완성도, 문제 정의 방식, 구현 범위의 판단, AI 활용 및 검토 과정이다.
- Backend: Kotlin, Spring
- Frontend: Next.js
- Database: PostgreSQL
- 설명과 작업 보고는 한국어로 작성한다.

## 프로젝트 설계

- 프론트엔드 디렉토리: frontend (Turborepo. `apps/web` 게스트 앱, `apps/app-admin` 전체 어드민, `apps/hotel-admin` 호텔 운영자)
- 백엔드 디렉토리: backend
- 도메인 뼈대: docs/domain.md (개발 시 참고)
- API 규약: docs/api-convention.md (프론트엔드·백엔드 공통, 개발 시 반드시 따른다)
- 코드 규칙: docs/code-convention.md (프론트엔드·백엔드 공통, 개발 시 반드시 따른다)
- Claude 스킬: .claude/skills (작업에 맞는 스킬을 먼저 읽는다)
  - 도메인: domain-rules(용어, 지켜야 할 규칙과 지키는 곳, 역할별 권한, 도메인이 바뀔 때의 순서). 원본은 docs/domain.md
  - 공통: pr-workflow(브랜치·커밋·PR·병합), local-run(로컬 실행·더미 계정·브라우저 확인)
  - 백엔드: backend-feature(도메인 API 추가), db-migration(Flyway 마이그레이션)
  - 프론트엔드: admin-screen(어드민 화면 추가), web-feature(게스트 앱), api-codegen(orval 코드 생성), structure-check(PR 전 FSD·3계층 점검)

## 필수 사항

- 프로젝트를 설계할 때는 코드를 작성하는 게 아닌, cli를 활용해서 프로젝트를 세팅한다.
- 임의로 작성하지 말자. 안되는 경우는 직접 실행하게 하자.
- 의문점이 드는 경우에는 임의로 판단하지말고 물어보자.

## 커밋 규칙

- 최대한 작은 단위로 개발을 할 것.
- 커밋 메세지는 타이틀 한 줄과 Co-Authored-By: Claude 트레일러만 작성하고, 아래와 같이 작성한다.
  - prefix(frontend/backend/common): title
  - prefix는 feature, docs, fix, chore, refactor로 구성한다.
  - 괄호안은 프로젝트별로 구분해서 작성한다. 중복은 가급적이면 허용하지 않는다.
  - title은 한글로 작성한다. 하지만 하나의 커밋당 하나의 기능을 하기에 가급적이면 짧은 글로 작성한다. 50글자 내외로 작성하자.

## 브랜치 및 PR 규칙

- PR 템플릿은 아래와 같다.

```
# prefix(frontend/backend/common) - domain: title

## 개발 목적
- 목적1
- 목적2

## 해결한 것
- 솔루션1
- 솔루션2

## 논의하고 싶은 내용
- 1
- 2

## 의사결정을 내린 것
- 의사결정1
- 의사결정2
```

- PR 본문 끝에는 "🤖 Generated with Claude Code" 문구를 남긴다.
- 하나의 PR에는 작은 단위로 개발해야하기에 300라인(diff 기준) 이내의 개발을 진행하자.
- PR에 가급적이면 frontend backend common의 내용이 섞이게 개발하지 말자.
- squash merge 방식으로 병합을 시도한다.
- 브랜치는 master 브랜치에서 따서, PR 내용을 master 브랜치에 병합한다.
- 브랜치 명은 아래와 같이 정의한다
  - prefix/part/domain
  - prefix는 커밋 prefix(feature, docs, fix, chore, refactor)를 따른다.
  - part에는 frontend/backend/common 중 하나가 들어간다.
  - domain에서는 사실 이슈번호가 없기에 해결하고자 하는 도메인을 단어 하나로 작성해둔다.
- 커밋은 claude에게 맡기되, 커밋전에 물어봐라.

## 각 프로젝트별 봐야하는 것

- backend: 백엔드 파트이기에 backend 디렉토리 내에서 CLAUDE를 활용한다.
  - 개발 플로우: docs/backend-flow.md (개발 시 반드시 따른다)
- frontend: 프론트엔드 파트이기에 frontend 디렉토리 내에서 CLAUDE를 활용한다.
  - 개발 플로우: docs/frontend-flow.md (개발 시 반드시 따른다)
- 위의 부분들을 해결하기 위해 서브에이전트를 거쳐서 해결하자. PR이후에는 메인 에이전트로 넘어가서 다시 계획을 잡는다.

## Claude code의 규칙

- 주요 의사결정은 메인 claude가 담당하고, 계획을 잡은 후 구체적인 개발사항들은 서브에이전트로 넘긴다.
- 도메인과 관련된 의사결정은 본인과 프롬프트를 거쳐서 의논 후 계획을 세우고, 나머지를 구현하게 하자.
- 애매하면 무조건 물어봐라. 임의판단은 절대 금지다.
- 권장하는 claude 스킬이 있으면 물어봐라.
- 가급적이면 주석은 달지말고, 상당히 복잡하게 되는 부분만 작성하자. 단, 작성할 땐 물어봐라.
