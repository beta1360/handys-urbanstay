---
name: local-run
description: 백엔드(Spring Boot + Docker Compose PostgreSQL)와 세 프론트엔드 앱을 로컬에서 띄우고, 더미 계정으로 로그인해 브라우저에서 확인하는 방법. "로컬 실행", "서버 띄우기", "run", "더미 계정", "테스트 계정", "브라우저 확인", "Swagger" 요청에 쓴다.
---

# 로컬 실행과 확인

내장 `/run` 스킬이 앱을 띄울 때 이 스킬을 쓴다. 원본은 `README.md` '4. 실행 방법'(준비물·백엔드·프론트엔드·테스트 계정·확인 흐름)과 `backend/CLAUDE.md`의 '로컬 실행'·'로컬 더미 데이터'다. 경로는 저장소 루트 기준이다.

## 1. 준비물

| 도구 | 버전 |
|---|---|
| JDK | 25 (Gradle은 wrapper) |
| Docker Desktop | 실행 중이어야 한다 |
| Node.js | 24에서 확인(저장소에 고정한 버전은 없다) |
| pnpm | 10.7.1 |

## 2. 백엔드 (`http://localhost:8080`)

```bash
cd backend
./gradlew bootRun          # Windows: .\gradlew.bat bootRun
```

- `compose.yaml`의 PostgreSQL 18이 Spring Boot Docker Compose로 자동으로 뜬다. 앱을 꺼도 DB는 계속 떠 있다(`start-only`).
- Windows에서 `Cannot run program "docker"`로 실패하면 `docker`가 PATH에 없는 것이다. Docker Desktop 설치 폴더의 `resources\bin`(예: `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin`)을 PATH에 더한 뒤 실행한다.
  - Git Bash: `PATH="$PATH:/c/Users/<사용자>/AppData/Local/Programs/DockerDesktop/resources/bin" ./gradlew bootRun`
- Swagger UI: `http://localhost:8080/swagger-ui.html`. 문서 그룹은 `/v3/api-docs/app`, `/v3/api-docs/app-admin`, `/v3/api-docs/hotel-admin`.
- 세션은 서버 메모리에 있다. 백엔드를 다시 띄우면 세 앱 모두 다시 로그인해야 한다(`docs/api-convention.md` '인증').
- 백그라운드로 띄운 bootRun을 멈춘 뒤에도 8080을 잡은 java 프로세스가 남을 수 있다. 그 프로세스만 찾아 끈다.

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen | Select-Object OwningProcess
Stop-Process -Id <PID>
```

## 3. 더미 데이터와 공유 DB

- 백엔드가 뜰 때 호텔이 하나도 없을 때만 더미 데이터를 넣는다(`urbanstay.seed.enabled=true`). 호텔이 있으면 아무것도 하지 않는다.
- 처음부터 다시 넣으려면 `backend/`에서 `docker compose down -v` 후 bootRun한다. 개발 DB의 데이터가 모두 지워지므로 **반드시 사용자에게 먼저 묻는다.**
- 개발 DB는 어느 worktree에서 띄운 백엔드든 같이 쓴다(compose 프로젝트 이름이 폴더 이름 `backend`로 같다). 그래서:
  - 확인 중에 더미 계정의 비밀번호·아이디를 바꾸지 않는다. 다른 작업의 로그인이 깨진다.
  - 더미 마스터로 로그인이 안 되면 app-admin 호텔 상세에서 그 마스터의 비밀번호를 `Test1234!`로 재설정한다. 운영자는 그 호텔 마스터가 hotel-admin에서 재설정한다.
  - `docker compose down -v`도 모든 worktree에 영향을 준다.

## 4. 프론트엔드

```bash
cd frontend
pnpm install
pnpm dev                       # 세 앱 함께 (turbo)
pnpm --filter app-admin dev    # 한 앱만 (hotel-admin, web도 같다)
```

| 앱 | 주소 |
|---|---|
| app-admin | http://app-admin.localhost:5173 |
| hotel-admin | http://hotel-admin.localhost:5174 |
| web | http://localhost:3000 |

- 백엔드 주소는 각 앱의 `.env.local`(`API_BASE_URL`)에 있다.
- API 코드 생성(`pnpm codegen`)은 백엔드가 떠 있어야 한다.
- web은 `next dev`가 도는 폴더에서 `next build`(`pnpm build`)를 돌리지 않는다. 빌드는 다른 worktree에서 하거나 dev를 멈춘 뒤 한다.

## 5. 테스트 계정

비밀번호는 모두 `Test1234!`다(`backend/CLAUDE.md` '로컬 더미 데이터').

| 앱 | 계정 |
|---|---|
| hotel-admin 마스터 | `master1@urbanstay.test`(강남), `master2@…`(홍대), `master3@…`(해운대) |
| hotel-admin 운영자 | `operator1a`·`operator1b`(강남), `operator2a`·`operator2b`(홍대), `operator3a`·`operator3b`(해운대) `@urbanstay.test` |
| web 회원 | `member1@urbanstay.test` ~ `member10@urbanstay.test` |
| app-admin | `backend/src/main/resources/application.properties`의 `urbanstay.initial-admin.login-id` / `.password` |

- app-admin 첫 계정은 어드민이 하나도 없을 때 위 설정값으로 만들어진다.
- app-admin 비밀번호는 파일에서 읽어 쓰기만 한다. 대화·PR·커밋·로그에 값을 적지 않는다.

## 6. 브라우저 확인

- 어드민 앱은 반드시 `*.localhost` 주소로 연다. 쿠키는 포트로 나뉘지 않아서 `localhost:5173`으로 열면 두 앱의 세션·CSRF 쿠키가 섞인다(`frontend/docs/admin-app.md` 'API 호출').
- 내장 브라우저 창이 숨겨져 있으면 화면이 그려지지 않고 멈춘 것처럼 보일 수 있다. 스크린샷을 찍으면 다시 그린다.
- 무엇을 볼지는 `README.md`의 '확인 흐름'(web 예약 → hotel-admin 이용·객실 → 요금 변경·정산 → 운영자 권한 → app-admin 검색·회원)을 따른다.
