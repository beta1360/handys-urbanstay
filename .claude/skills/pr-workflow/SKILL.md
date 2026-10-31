---
name: pr-workflow
description: 이 저장소에서 브랜치를 따고, 커밋하고, PR을 만들고, 검사·리뷰 뒤 squash 병합하는 순서와 형식. "PR 만들기", "커밋", "브랜치", "병합", "PR 본문", "squash", "rebase" 요청에 쓴다.
---

# PR 작업 흐름

규칙의 원본은 루트 `CLAUDE.md`의 '커밋 규칙'과 '브랜치 및 PR 규칙'이다. 이 스킬은 순서와 명령만 모은다. 경로는 저장소 루트 기준이다.

## 1. 브랜치

- `master`에서 따고, PR은 `master`로 보낸다.
- 이름은 `prefix/part/domain`이다.
  - prefix: `feature`, `docs`, `fix`, `chore`, `refactor`
  - part: `frontend`, `backend`, `common` 중 하나
  - domain: 이슈 번호 대신 해결하려는 도메인을 단어 하나로. 예: `feature/backend/seed`, `feature/frontend/settlement`, `docs/common/submission`

```bash
git switch master && git pull
git switch -c feature/backend/seed
```

## 2. 커밋

- 최대한 작은 단위로, 커밋 하나에 기능 하나.
- 메시지는 제목 한 줄과 트레일러만 쓴다.
  - 제목: `prefix(part): 한글 제목`. 50자 내외로 짧게. 예: `feature(backend): 로컬 더미 데이터 자동 입력`
  - 트레일러: Claude 트레일러 하나만(루트 `CLAUDE.md`). 지금은 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`이고, 쓰는 모델이 바뀌면 그 이름으로 쓴다(아래 예시도 같다).
- 커밋 전에 사용자에게 묻는다(`CLAUDE.md` '브랜치 및 PR 규칙'). 사용자가 따로 맡기지 않았다면 매번 묻는다.

```bash
git commit -m "feature(backend): 로컬 더미 데이터 자동 입력" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## 3. PR 범위

- 한 PR에 frontend·backend·common을 섞지 않는다.
- diff 300줄 이내를 권장한다. 넘으면 본문에 'PR 크기' 절을 두고 이유를 적는다.
  - 생성 코드(orval `src/shared/api/generated`, 라우트 트리)는 빼고 운영 코드·테스트·문서가 얼마인지 나눠 적는다.
  - 커밋을 어떻게 나눴는지도 적는다(리뷰를 커밋 단위로 볼 수 있게).
- 크기 확인: `git diff --shortstat master...HEAD`

## 4. PR 제목과 본문

- 제목: `prefix(part) - domain: title`. 예: `feature(backend) - seed: 로컬 더미 데이터 자동 입력`
- 본문은 루트 `CLAUDE.md` 템플릿(개발 목적·해결한 것·논의하고 싶은 내용·의사결정을 내린 것)을 넓힌 아래 순서다. 템플릿의 H1 제목 줄은 `gh pr create --title`로 넣으므로 본문에는 쓰지 않는다. 실제 예는 `gh pr view 104`(frontend)·`gh pr view 106`(backend).

```markdown
## 개발 목적
## 해결한 것
## 검증
## 구조 점검 결과        <!-- frontend PR -->
## PR 크기 (+N −M)       <!-- 300줄 권장 초과 시 -->
## 메인 코드 리뷰
## 논의하고 싶은 내용
## 의사결정을 내린 것

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- '검증': 돌린 명령과 결과(통과 개수), 브라우저에서 본 것.
- '논의하고 싶은 내용'에는 아직 모르는 것과 남은 한계를, '의사결정을 내린 것'에는 결정과 이유를 적는다(`docs/frontend-flow.md`·`docs/backend-flow.md`의 '기록과 보고'). 사용자가 정한 것은 '사용자 결정'으로 표시한다.
- 본문은 파일로 써서 넘긴다(한글·마크다운이 깨지지 않게). 파일은 스크래치패드에 둔다.

```bash
git push -u origin feature/backend/seed
gh pr create --base master --title "feature(backend) - seed: 로컬 더미 데이터 자동 입력" --body-file <본문 파일>
gh pr edit <번호> --body-file <본문 파일>   # 리뷰 결과 등을 더할 때
```

## 5. 병합 전 확인

- 검사 통과. 명령은 `README.md` '4. 실행 방법'의 '테스트와 검사'.
  - backend: `./gradlew test` (Docker 필요)
  - frontend: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- UI가 바뀌었으면 브라우저에서 확인한다(`local-run` 스킬).
- frontend PR은 구조 점검을 하고 '구조 점검 결과'에 항목별로 적는다(`structure-check` 스킬). 규칙의 원본은 `frontend/CLAUDE.md`의 '구조 (FSD)'·'3계층'·'서버 상태'다.
- 별도 리뷰: 서브에이전트가 diff를 따로 리뷰하고, 결과를 '메인 코드 리뷰'에 적는다. 이 PR에서 고친 것(커밋)과 남긴 것(비차단)을 나눈다(`README.md` '6. AI 활용과 검토 과정').

## 6. master가 앞서 나갔을 때

- push 전이면 master 위로 rebase한다: `git fetch origin && git rebase origin/master`
- 이미 push한 브랜치를 rebase·amend하면 force push가 필요한데, 막혀 있을 수 있다. 그때는 기록을 고치지 말고 커밋을 덧붙여 일반 push한다. squash 병합이라 master에는 한 커밋으로 남는다.
- rebase 뒤에는 바뀐 부분의 테스트를 다시 돌리고 '검증'이나 '메인 코드 리뷰'에 적는다.

## 7. 병합

- squash merge로 병합한다. 제목은 커밋과 같은 `prefix(part): 한글 제목`, 본문은 트레일러만 둔다.
- 병합은 사용자 승인을 받는다. 사용자가 맡겼으면 검사·브라우저 확인·코드 리뷰를 마친 PR을 병합하고 보고한다(`README.md` '6. AI 활용과 검토 과정'의 '병합').

```bash
gh pr merge <번호> --squash \
  --subject "feature(backend): 로컬 더미 데이터 자동 입력" \
  --body "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git switch master && git pull
```

- PR 뒤에는 메인 에이전트가 다음 계획을 다시 잡는다(`CLAUDE.md` '각 프로젝트별 봐야하는 것').
