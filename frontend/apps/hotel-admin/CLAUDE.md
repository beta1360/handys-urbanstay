# 호텔 운영자 앱(hotel-admin) 작업 지침

호텔 마스터·운영자가 쓰는 앱(Vite + React). 프론트엔드 공통 규칙은 `frontend/CLAUDE.md`를, 두 어드민 앱의 공통 규칙은 `frontend/docs/admin-app.md`를 따른다.

## 참고 문서

- 어드민 앱 공통 규칙: @../../docs/admin-app.md

## 앱

- 사용자: 호텔 마스터·운영자. 하는 일은 `docs/domain.md`의 '운영 계정과 역할'을 따른다.
- API: 앱 전용 API(`/api/v1/hotel-admin/**`)만 쓴다.
- 접속 주소: `http://hotel-admin.localhost:5174`. 개발 서버는 5174 포트로만 뜬다(`strictPort`).
- 로그인·로그인 확인·사용 중 로그인 만료·로그아웃·토스트는 app-admin과 같다(`frontend/docs/admin-app.md`의 '로그인'·'토스트').
- 위쪽 영역 오른쪽에는 내 정보 쿼리에서 읽은 호텔 이름, 계정 이름과 역할, 로그아웃 버튼을 둔다. 역할 문구(`MASTER` '마스터', `OPERATOR` '운영자')는 `entities/account`의 `ACCOUNT_ROLE_LABELS`다.
- `/`에 들어오면 방문 기록을 바꿔 객실 목록(`/rooms`)으로 보낸다(`app/router/index-redirect.ts`). 로그인 뒤 기본 이동 경로(`/`)도 같다. 사이드바 메뉴는 '객실', '객실 유형', '이용객', '이용', '운영자', '정산' 순서다. '객실 유형'·'운영자'·'정산'은 내 정보의 역할이 마스터일 때만 보인다(`config/menu.ts`의 `masterOnly`).
- 마스터만 쓰는 화면과 버튼(`docs/domain.md`의 '운영 계정과 역할'): 마스터 판단은 `entities/account`의 `isMaster`다. `rooms/route.tsx`·`room-types/route.tsx`·`operators/route.tsx`·`settlements/route.tsx`의 `beforeLoad`가 캐시된 내 정보로 `isMaster`를 route context에 넣는다(`app/auth/master-guard.ts`). 운영자가 마스터 전용 화면에 직접 들어오면 하위 화면 대신 `shared/ui/master-forbidden`의 '권한이 없습니다' 문구와 '객실 목록으로' 버튼을 카드에 보여준다. 하위 화면을 그리지 않으므로 그 화면의 API 요청을 보내지 않는다. 서버도 403 `FORBIDDEN`으로 막는다.
  - `/room-types/**`·`/operators/**`는 레이아웃 라우트의 `pages/master-access`가 고른다.
  - 객실은 조회와 상태 변경은 모두 하고 생성·수정만 마스터가 한다. 그래서 `/rooms/**` 전체가 아니라 `pages/room-create`·`pages/room-edit`가 route context로 고르고, 운영자에게는 목록의 '객실 생성' 버튼과 상세의 '수정' 버튼을 숨긴다.
- 객실 화면: 목록 `/rooms`(`?keyword=&status=&roomTypeId=&page=`), 생성 `/rooms/new`, 상세 `/rooms/$roomId`, 수정 `/rooms/$roomId/edit`. 동작은 `frontend/docs/admin-app.md`의 목록·상세·등록·수정 화면 규칙을 따르고, 아래만 더한다. 화면 문구는 '객실 생성'(목록 버튼, 화면 제목)이고 폼 버튼은 '생성'이다.
  - 목록 열은 이름·유형·층·최대 인원·상태·지금 이용객이다. 유형 이름과 최대 인원은 응답의 `roomType`(조회할 때 유형의 값)에서 읽는다. 이름순은 서버가 정한다.
  - 지금 이용객은 응답의 `currentStay`(`docs/domain.md`의 '객실', 오늘(한국 시간)이 기간 안인 취소하지 않은 이용)다. 이용객 이름을 그 이용객의 상세(`/guests/$guestId`)로 가는 글자 링크로 보여주고, 없으면 빈칸이다. 객실 상태와 따로 정해지며 상태는 운영자가 그대로 바꾼다.
  - 상태 거르기는 검색 폼 안의 선택 입력(`SelectField`, '전체'와 네 상태)으로 한다. 검색어처럼 '검색'을 눌러야 반영하고, 바꿀 때마다 이동하지 않는다. URL의 `status`는 생성된 목록 파라미터 스키마의 값만 쓰고 그 밖의 값은 지운다.
  - 유형 거르기는 검색 폼 안의 선택 입력(`SelectField`, '전체'와 그 호텔의 유형(서버 순서))이다. 선택지는 `useRoomTypeOptions`(빈 값 문구 '전체')로 만들고, 상태처럼 '검색'을 눌러야 반영한다. URL의 `roomTypeId`는 숫자만 있는 1 이상의 안전한 정수만 쓰고 그 밖의 값은 지운다.
  - 검색어·상태·유형으로 거른 목록이 비면 '검색 결과가 없습니다'를 보여준다.
  - 상태 문구(`VACANT` '공실', `RESERVED` '예약됨', `OCCUPIED` '이용중', `MAINTENANCE` '정비중')는 `entities/room`의 `ROOM_STATUS_LABELS`다. 층이 없으면 '층 없음', 소개가 없으면 '소개 없음'을 회색으로 보여준다.
  - 생성·수정 폼은 이름·유형·층(선택)·소개(선택)다. 최대 인원·1박 요금·체크인·체크아웃 시각은 유형에서 오므로 칸이 없다.
  - 유형은 선택 입력(`SelectField`)이고 선택지는 그 호텔의 유형 목록(서버의 이름순) 앞에 '유형 선택'(빈 값)을 둔다. 유형 목록 조회와 선택지는 `entities/room-type`의 `useRoomTypeOptions`다. 목록을 불러오지 못하면 칸 아래에 '객실 유형을 불러오지 못했습니다.'를 보여준다. 고른 유형 id를 정수로 바꿔 `roomTypeId`로 보낸다.
  - 생성 화면에서 유형 목록을 불러왔는데 비어 있으면 유형 칸 아래에 '먼저 객실 유형을 생성해 주세요.'와 유형 생성 화면(`/room-types/new`)으로 가는 '객실 유형 생성' 글자 링크를 보여준다(`entities/room-type`의 `RoomTypeEmptyGuide`).
  - 수정 화면은 객실의 지금 유형(처음 조회 값, '최신 내용 불러오기' 뒤에는 다시 불러온 값)을 선택지에 넣는다. 유형 목록을 불러오지 못해도 칸이 '유형 선택'이 아닌 지금 유형을 보여주고 그 id를 보내게 하기 위해서다. 목록에 이미 있으면 더하지 않는다.
  - 층은 글자 입력창(`inputMode="numeric"`)이고 `@repo/admin-kit/form`의 정수 검사로 숫자로 바꿔 보낸다. 층이 비면 null이다.
  - 같은 이름의 객실이 있다는 409(`ROOM_DUPLICATED`)는 이름 칸의 오류로, 유형이 없다는 404(`ROOM_TYPE_NOT_FOUND`)는 유형 칸의 오류로 보여준다. 수정 충돌은 `ROOM_MODIFIED`, 대상 없음은 `ROOM_NOT_FOUND`다.
  - 상세 내용은 이름·유형·최대 인원·1박 요금·체크인 시각·체크아웃 시각·층·소개·상태다. 유형의 값(최대 인원~체크아웃 시각)은 `entities/room-type`의 `RoomTypeTerms`가 그린다.
  - 상세의 '목록으로' 링크 줄 오른쪽, '수정' 버튼 앞에 그 객실의 이용 목록으로 가는 '이용 보기'(글자 링크, `/stays?roomId=`)를 둔다.
  - 상세 내용 아래에 '지금 이용' 카드를 둔다. 이용객(이용객 상세 링크)·이용객 전화번호·체크인 날짜·체크아웃 날짜를 보여주고, 카드 머리 오른쪽에 그 이용의 상세로 가는 '이용 상세'(글자 링크)를 둔다. 지금 이용이 없으면 '지금 이용 중인 이용객이 없습니다.'를 회색으로 보여준다. 항목 이름은 `entities/stay`의 `STAY_FIELD_LABELS`다.
- 객실 상태는 상세 화면에서 바꾼다(`docs/domain.md`의 '객실 상태'). '지금 이용' 카드 아래에 '상태 바꾸기' 묶음과 상태 이력을 차례로 둔다. 둘 다 내용을 보여줄 때만 그린다.
  - 지금 상태는 상세 내용의 '상태' 항목이 보여준다. 버튼은 지금 상태에서 갈 수 있는 상태만 바뀔 상태 이름(`ROOM_STATUS_LABELS`)으로 둔다. 갈 수 있는 방향은 `entities/room`의 `ROOM_STATUS_TRANSITIONS`다(공실 → 예약됨·정비중, 예약됨 → 이용중·공실, 이용중 → 정비중, 정비중 → 공실).
  - 누르면 확인 없이 화면에서 본 상태(`from`)와 바꿀 상태(`to`)를 보낸다. 요청이 끝나고 다시 불러올 때까지 모든 상태 버튼을 비활성화한다.
  - 성공하면 객실 상세·상태 이력을 다시 불러오고 객실 목록을 무효화한 뒤 서버의 성공 문구를 토스트로 보여준다.
  - 그사이 다른 사람이 바꿨다는 409(`ROOM_STATUS_CHANGED`)와 바꿀 수 없는 방향이라는 409(`ROOM_STATUS_TRANSITION_NOT_ALLOWED`)는 서버 문구를 오류 토스트로 보여주고, 성공과 같게 다시 불러온다. 그 밖의 실패는 등록·수정 폼의 폼 전체 오류처럼 오류 토스트로 보여주고(본문을 쓸 수 없으면 일반 오류 문구), 다시 누르면 그 토스트를 지운다. 401은 사용 중 로그인 만료 처리를 따른다.
  - 상태 이력 표의 열은 바꾼 시각(한국 시간 `YYYY-MM-DD HH:mm`), 상태 변경(`이전 → 바뀐`, 객실 등록 이력의 이전 상태는 회색 '없음'), 바꾼 사람(그때의 이름)이다. 최신순은 서버가 정한다.
  - 이력의 페이지는 URL에 두지 않고 화면 상태로 1페이지부터 센다. 상세 화면 안의 보조 목록이라 새로고침·주소 공유로 같은 페이지를 다시 볼 일이 적기 때문이다. 페이지 이동 중 이전 이력을 흐리게 보여주는 것, 불러오는 중·불러오기 실패('다시 시도')·빈 상태('상태 이력이 없습니다.')는 목록 화면과 같다.
- 객실 유형 관리는 호텔 마스터만 한다(`docs/domain.md`의 '객실 유형'). 목록(`/room-types`), 생성(`/room-types/new`), 상세(`/room-types/$roomTypeId`), 수정(`/room-types/$roomTypeId/edit`) 화면이다. 화면 동작은 `frontend/docs/admin-app.md`의 '목록 화면'·'상세 화면'·'등록·수정 화면'을 따르고, 아래만 더한다.
  - 목록은 페이지·검색 없이 서버가 주는 전부(이름순)를 이름·최대 인원·1박 요금·체크인 시각·체크아웃 시각 열로 보여준다. 이름은 상세로 가는 링크다. 비면 '생성된 객실 유형이 없습니다.'다.
  - 1박 요금 같은 금액은 `shared/lib/money`의 `formatWon`으로 천 단위 쉼표와 '원'을 붙여 보여준다(예: `150,000원`).
  - 생성·수정 폼은 이름·최대 인원·1박 요금·체크인 시각·체크아웃 시각이다. 최대 인원·1박 요금은 글자 입력창(`inputMode="numeric"`)이고 `@repo/admin-kit/form`의 정수 검사로 숫자로 바꿔 보낸다(쉼표는 형식 오류). 시각은 브라우저 시간 입력(`type="time"`, 값 `HH:mm`)이다. 범위는 생성된 요청 스키마의 값이다.
  - 같은 이름의 유형이 있다는 409(`ROOM_TYPE_DUPLICATED`)는 이름 칸 오류로 보여준다. 수정 충돌 409(`ROOM_TYPE_MODIFIED`)는 '최신 내용 불러오기'와 함께 폼 안에 보여준다. 대상 없음은 `ROOM_TYPE_NOT_FOUND`다.
  - 유형을 수정하면 유형 캐시와 함께 객실 목록·객실 상세 캐시도 무효화한다(`entities/room`의 `invalidateRooms`). 객실 화면이 유형 이름·최대 인원 같은 유형의 값을 함께 보여주기 때문이다. 상태 이력은 유형 값을 쓰지 않으므로 두지 않는다.
- 이용객은 목록(`/guests`), 상세(`/guests/$guestId`), 수정(`/guests/$guestId/edit`) 화면이다. 이용객 등록은 게스트 앱에서 이용객이 예약할 때 하고, hotel-admin은 조회와 수정만 한다. 그래서 목록에 등록 버튼이 없다. 화면 동작은 `frontend/docs/admin-app.md`의 '목록 화면'·'상세 화면'·'등록·수정 화면'(수정 화면)을 따른다.
  - 목록은 이름·전화번호·이메일 열이고, 검색어(이름 또는 전화번호)와 페이지를 URL search에 둔다. 정렬(최근 등록순)과 검색 기준은 서버가 정한다.
  - 수정할 때 같은 호텔의 전화번호 중복 409(`GUEST_PHONE_DUPLICATED`)는 전화번호 칸 오류로 보여준다. 수정 충돌 409(`GUEST_MODIFIED`)는 '최신 내용 불러오기'와 함께 폼 안에 보여준다.
  - 상세의 '목록으로' 링크 줄 오른쪽, '수정' 버튼 앞에 그 이용객의 이용 목록으로 가는 '이용 보기'(글자 링크, `/stays?guestId=`)를 둔다.
  - 상세·수정 응답은 지금 이용(`currentStay`, 오늘(한국 시간)이 기간 안인 취소하지 않은 이용 하나, 없으면 null)을 함께 준다(`GuestDetail`). 수정에 성공하면 이 응답을 그대로 상세 캐시에 넣는다.
  - 상세 내용 아래에 '지금 이용' 카드를 둔다. 호실(객실 상세 `/rooms/$roomId` 링크)·유형 이름·기간(`체크인 날짜 ~ 체크아웃 날짜`)을 보여주고, 카드 머리 오른쪽에 그 이용의 상세로 가는 '이용 상세'(글자 링크)를 둔다. 지금 이용이 없으면 '지금 이용 중인 객실이 없습니다.'를 회색으로 보여준다.
- 이용은 목록(`/stays`, `?roomId=&guestId=&canceled=&keyword=&checkInFrom=&checkInTo=&page=`)과 상세(`/stays/$stayId`) 화면이다. 이용 등록은 게스트 앱에서 이용객이 하고, hotel-admin은 조회와 취소만 한다. 화면 동작은 `frontend/docs/admin-app.md`의 '목록 화면'·'상세 화면'을 따르고, 아래만 더한다.
  - 목록 열은 객실 이름·이용객(이름과 전화번호)·체크인 날짜·체크아웃 날짜·인원·금액(최종 금액, `formatWon`)·취소 여부·상세다. 이용에는 이름 칸이 없으므로 마지막 '상세' 열의 '보기' 링크로 상세에 간다. 취소한 이용만 취소 여부 칸에 '취소됨'을 보여준다. 정렬(체크인 날짜 늦은 순)은 서버가 정한다.
  - 거르기는 검색 폼 안의 이용객 검색어('이용객', 안내 글자 '이름 또는 전화번호', 서버 `keyword`), 체크인 시작·체크인 끝(브라우저 날짜 입력 `type="date"`, 서버 `checkInFrom`·`checkInTo`), 객실 선택(`SelectField`, '전체'와 이름순 객실 100개까지), 취소 여부 선택('전체'·'취소 안 됨'·'취소됨', 서버 `canceled`)이다. 객실 목록의 상태 거르기처럼 '검색'을 눌러야 반영하고, 검색하면 1페이지로 간다. 이용객 거르기(`guestId`)는 그대로 둔다. 빈 값은 URL과 요청에서 뺀다.
  - 체크인 끝이 시작보다 이르면 제출할 때 끝 칸에 '체크인 시작 날짜와 같거나 뒤여야 합니다.'를 보여주고 이동·조회하지 않는다. 직접 입력한 URL처럼 서버가 400으로 거르기 칸(`checkInTo` 등)의 오류를 주면 그 문구를 해당 칸 아래에 보여준다. 거르기 폼은 목록과 같은 파라미터로 이용 목록 쿼리를 함께 구독해 오류를 읽는다(같은 쿼리 키라 요청은 한 번이다).
  - 이용객 거르기는 선택 입력 없이 URL의 `guestId`로만 받는다(이용객 상세의 '이용 보기'). 걸려 있으면 검색 폼 아래에 '이용객: 이름 (전화번호)'와 이용객 거르기만 푸는 링크를 보여준다. 이름은 이용객 조회로 읽고, 불러오는 중·찾을 수 없음·실패에는 `entities/guest`의 문구를 대신 보여준다.
  - URL의 `roomId`·`guestId`는 숫자만 있는 1 이상의 안전한 정수만, `canceled`는 `true`·`false`(소문자)만, `keyword`는 앞뒤 공백을 지운 100자 이하만, `checkInFrom`·`checkInTo`는 있는 날짜의 `YYYY-MM-DD`만 쓰고 그 밖의 값은 지운다. 이용객 거르기를 푸는 링크는 다른 거르기 값을 모두 둔다. 거르기 값이 하나라도 있는데 목록이 비면 '검색 결과가 없습니다'를 보여준다.
  - 상세는 객실(객실 상세 링크)·이용객(이용객 상세 링크)·이용객 전화번호·체크인 날짜·체크아웃 날짜·인원과 예약 비용(1박 요금·박 수·기본 금액·할인 금액·최종 금액, 금액은 `formatWon`)이다. 예약 비용은 예약할 때 저장된 응답 값을 그대로 보여준다. 취소한 이용은 아래에 '취소 정보' 카드(취소 시각(한국 시간 `YYYY-MM-DD HH:mm`)·처리한 계정 이름·사유, 사유가 없으면 '사유 없음'을 회색으로)를 더한다. 대상 없음은 `STAY_NOT_FOUND`다.
  - 이용은 상세에서 취소한다. 취소하지 않았고 끝나지 않은 이용(체크아웃 날짜가 한국 시간 오늘(`getKoreanToday`)보다 뒤)이면 상세 내용 아래에 '이용 취소' 묶음을 둔다. 판단은 `entities/stay`의 `isStayCancelable`이다.
  - '이용 취소'를 누르면 라이브러리나 `window.confirm` 없이 화면 안에 되돌릴 수 없다는 안내, 취소 사유 칸(선택), '취소 확정'·'닫기' 버튼이 열리고 사유 칸에 초점이 간다. '취소 확정'이 확인 버튼이다. '닫기'는 입력을 버리고 '이용 취소' 버튼에 초점을 돌린다.
  - 사유는 앞뒤 공백을 지운 뒤 200자 이하(생성된 요청 스키마)로 제출할 때 검사한다. 비면 사유 없이 빈 본문(`{}`)을 보낸다. 제출 중에는 '취소 확정'을 로딩 상태로 두고 다시 제출하지 않는다.
  - 성공하면 이용 상세·목록을 무효화하고, 객실이 예약됨이었으면 공실로 바뀌므로 객실 상세·목록·상태 이력도 `entities/room`의 `refreshRoomStatus`로 무효화한다. 다시 불러올 때까지 요청 중으로 두고, 끝나면 서버 문구를 토스트로 보여준다. 다시 불러온 이용에는 취소 정보 카드가 보이고 '이용 취소' 묶음은 사라진다.
  - 이미 취소했다는 409(`STAY_ALREADY_CANCELED`)와 끝난 이용이라는 409(`STAY_ALREADY_ENDED`)는 서버 문구를 오류 토스트로 보여주고 성공과 같게 다시 불러온다. 사유 칸의 400은 칸 아래에, 그 밖의 실패는 오류 토스트로 보여준다. 401은 사용 중 로그인 만료를 따른다.
- 운영자 관리는 호텔 마스터(`MASTER`)만 한다(`docs/domain.md`의 '호텔 운영자'). 목록(`/operators`, `?keyword=&active=&page=`), 등록(`/operators/new`), 상세(`/operators/$operatorId`), 수정(`/operators/$operatorId/edit`) 화면이다. 화면 동작은 `frontend/docs/admin-app.md`의 '목록 화면'·'상세 화면'·'등록·수정 화면'을 따르고, 아래만 더한다.
  - 운영자가 들어오면 위의 '마스터만 쓰는 화면과 버튼'처럼 권한 없음 카드를 보여준다.
  - 목록 열은 이름·아이디·사용 여부('사용 중'·'사용 안 함', `entities/operator`의 `OPERATOR_ACTIVE_LABELS`)다. 검색어는 이름 또는 아이디다. 사용 여부 거르기는 검색 폼 안의 선택 입력(`SelectField`, '전체'·'사용 중'·'사용 안 함')으로 하고, 객실 상태처럼 '검색'을 눌러야 반영한다. URL의 `active`는 `true`·`false`만 쓰고 그 밖의 값은 지운다. 정렬(최근 등록순)과 검색 기준은 서버가 정한다.
  - 등록은 아이디(이메일)·이름·처음 비밀번호를 한 묶음('운영자 계정')에, 수정은 아이디·이름을 둔다. 다른 사람의 계정 칸이므로 아이디는 `autocomplete="off"`, 처음 비밀번호와 상세의 새 비밀번호는 `autocomplete="new-password"`이고 비밀번호 보기 버튼은 없다. 비밀번호 검사 문구는 `@repo/admin-kit/form`의 `passwordSchema`로 서버와 같게 한다.
  - 아이디 중복 409(`LOGIN_ID_DUPLICATED`)는 등록·수정 모두 아이디 칸 오류로 보여준다. 수정 충돌 409(`HOTEL_ADMIN_MODIFIED`)는 '최신 내용 불러오기'와 함께 폼 안에 보여준다. 수정 화면의 아이디 칸 안내 문구에 아이디를 바꾸면 그 운영자의 세션이 끊긴다는 내용을 둔다. 대상 없음은 `HOTEL_OPERATOR_NOT_FOUND`다.
  - 상세 내용 아래에 비밀번호 재설정 폼('비밀번호' 묶음)과 '사용 여부 바꾸기' 묶음을 차례로 둔다. 둘 다 내용을 보여줄 때만 그린다.
    - 비밀번호 재설정은 새 비밀번호 칸과 '비밀번호 재설정' 버튼이다. 제출할 때만 검사한다. 성공하면 서버 문구를 토스트로 보여주고 칸을 비운 뒤 상세를 다시 불러온다. 재설정도 운영자의 version을 올리므로 이후 수정 화면이 낡은 version으로 채워지지 않게 하기 위해서다. 실패는 등록·수정 폼처럼 400 칸 오류는 칸 아래, 그 밖은 오류 토스트다.
    - 사용 중이면 '비활성화', 사용 안 함이면 '다시 활성화' 버튼이다. 누르면 라이브러리나 `window.confirm` 없이 화면 안에서 확인 문구와 확인·'취소' 버튼으로 한 번 더 묻는다. 비활성화 확인 문구에는 로그인할 수 없고 로그인해 둔 세션도 끊긴다는 내용을 담는다. 확인 단계가 열리면 '취소'에 초점을 두고, 취소하거나 요청이 끝나면 버튼에 초점을 돌린다.
    - 사용 여부를 바꾸면 상세를 다시 불러오고 목록을 무효화한 뒤 서버 문구를 토스트로 보여준다. 다시 불러올 때까지 확인 버튼을 로딩 상태로 둔다. 실패는 객실 상태 바꾸기처럼 오류 토스트로 보여주고(본문을 쓸 수 없으면 일반 오류 문구), 401은 사용 중 로그인 만료 처리를 따른다.

- 월별 정산은 호텔 마스터만 본다(`docs/domain.md`의 '월별 정산'). 화면은 `/settlements`(`?month=YYYY-MM&page=`) 하나다. 운영자에게는 메뉴가 없고, 직접 들어오면 권한 없음 카드를 보여주며 정산 요청을 보내지 않는다.
  - 위쪽에 '이전 달'·'다음 달' 버튼과 그 사이에 달 제목('YYYY년 M월')을 둔다. 버튼은 URL의 `month`만 바꾸고 페이지는 1페이지로 돌린다. 달에 위아래 제한은 없다.
  - 처음 들어오면 브라우저 날짜의 이번 달이다. URL의 `month`는 생성된 정산 파라미터 스키마(`YYYY-MM`, 월 01~12)를 통과할 때만 쓰고, 없거나 잘못되면 이번 달로 바꾼다. 페이지와 달리 `month`는 이번 달이어도 URL에 남긴다. 기본값이 날짜에 따라 바뀌므로, 주소를 공유하거나 다음 달에 다시 열어도 같은 달을 보여주기 위해서다.
  - 요약(`GET /settlements?month`)은 카드 안의 항목 목록으로 정산 금액(`totalAmount`, `formatWon`)·이용 건수(`stayCount`)·취소 건수(`canceledCount`)를 보여준다. 계산은 서버가 한다. 카드 아래에 '체크인 날짜가 이 달인 이용 기준이며 취소한 이용은 금액에서 뺍니다.'를 둔다(불러오는 중·실패에도 보인다). 달을 바꾸면 요약은 이전 달 값을 남기지 않고 불러오는 중을 보여준다. 실패는 오류 문구와 '다시 시도'다.
  - 요약 아래의 이 달 이용 표(`GET /settlements/stays?month&page&size`)는 취소한 이용까지 체크인 날짜 오름차순(서버)으로 보여준다. 열은 객실·유형·이용객(이름)·체크인 날짜·체크아웃 날짜·박 수·금액(취소해도 그대로)·취소 여부(취소한 이용만 '취소됨')·상세('보기' → `/stays/$stayId`)다. 항목 이름은 `entities/stay`의 `STAY_FIELD_LABELS`·`STAY_CANCELED_LABELS`와 `entities/room`의 `ROOM_FIELD_LABELS.roomType`이다.
  - 표의 페이지 이동·이전 목록 흐리게 보여주기·마지막 페이지를 넘으면 바꿔 이동·불러오는 중·실패는 이용 목록과 같다. 비면 '이 달에 체크인한 이용이 없습니다.'다.
  - 운영자의 권한 없음 사례는 pages 사이 import를 피하려고 `pages/master-access`의 테스트(it.each: 운영자·정산)에 둔다.

## 구조

- 라우트 파일은 `src/app/routes`에 두고, `src/pages`의 페이지를 가져와 연결만 한다.
- `__root.tsx`에는 자체 UI를 두지 않는다. 탭 제목(`head`)과 `<HeadContent />`, `<Outlet />`, 오류 화면(`errorComponent`: `<HeadContent />`와 `ErrorPage`)만 둔다.
- 로그인 확인·로그인 화면 진입·사용 중 401 처리는 `src/app/auth`의 함수로 두고, 라우트 파일과 라우터는 이 함수를 연결만 한다. 내 정보 조회와 캐시는 `entities/account`의 함수(`ensureMe`, `isPendingMeQuery`, `forgetMe`)로 한다.
- QueryClient와 라우터는 `src/app/router/router.ts`에서 함께 만든다. 라우터 context에 QueryClient를 넣고, QueryClient의 오류 처리기에 라우터를 넘기기 위해서다. `QueryProvider`도 여기서 만든 QueryClient를 쓴다.
- 라우터의 URL search 직렬화는 `src/shared/lib/search-params`의 `parseSearch`·`stringifySearch`를 쓴다(일반 쿼리 문자열). 테스트용 memory 라우터도 같은 함수를 넣는다.
- 도메인과 무관한 폼 도우미, 토스트 상태, 화면 이동 링크, 요청·응답 검증과 서버와 같은 입력 검증 문구는 `@repo/admin-kit`의 것을 쓴다(`frontend/docs/admin-app.md`의 'packages/admin-kit를 쓰는 법').
- 서버 상태는 `frontend/CLAUDE.md`의 '서버 상태'를 따른다.
  - `shared/api`: 검증을 거친 요청 함수(`fetchMe`, 로그인·로그아웃, 객실 목록·조회·생성·수정·상태 변경, 객실 상태 이력 조회, 객실 유형 목록·조회·생성·수정, 이용객 목록·조회·수정, 이용 목록·조회·취소, 운영자 목록·조회·등록·수정·비밀번호 재설정·사용 여부 변경)와 쿼리 키 함수(`meQueryKey`, `roomListQueryKey`, `roomQueryKey`, `roomStatusHistoriesQueryKey`, `roomTypeListQueryKey`, `roomTypeQueryKey`, `guestListQueryKey`, `guestQueryKey`, `stayListQueryKey`, `stayQueryKey`, `operatorListQueryKey`, `operatorQueryKey`), 객실 상세 쿼리 키 판별(`isRoomQueryKey`: 객실 상세 키는 객실마다 경로가 달라 공통 접두어가 없으므로 무효화 조건에 쓴다), 서버 오류 정보 읽기(`getApiError`)와 오류 코드(`API_ERROR_CODES`)
  - `entities/account/api`: 내 정보 조회(`useMe`, `ensureMe`)와 로그인 상태 캐시 규칙(`startSession`, `endSession`, `forgetMe`, `isPendingMeQuery`). 마스터 판단(`isMaster`)은 `entities/account/lib`에 둔다
  - `entities/room/api`: 객실 목록 조회(`useRoomListQuery`), 객실 조회(`useRoomQuery`)와 새로 조회(`useRefetchRoom`), 객실 상태 이력 조회(`useRoomStatusHistoryQuery`), 저장한 객실 캐시 규칙(`cacheSavedRoom`), 상태를 바꾼 뒤 다시 불러오기(`refreshRoomStatus`: 객실 상세·상태 이력을 다시 불러오고 목록을 무효화한다), 객실 목록·모든 객실 상세 무효화(`invalidateRooms`)
  - `entities/room-type/api`: 객실 유형 목록 조회(`useRoomTypeListQuery`), 유형 조회(`useRoomTypeQuery`)와 새로 조회(`useRefetchRoomType`), 저장한 유형 캐시 규칙(`cacheSavedRoomType`: 목록을 무효화하고 상세 캐시에 넣는다)
  - `entities/guest/api`: 이용객 목록 조회(`useGuestListQuery`), 이용객 조회(`useGuestQuery`)와 새로 조회(`useRefetchGuest`), 저장한 이용객 캐시 규칙(`cacheSavedGuest`)
  - `entities/stay/api`: 이용 목록 조회(`useStayListQuery`), 이용 조회(`useStayQuery`, `useStay`가 쓴다), 취소한 뒤 다시 불러오기(`refreshStay`)
  - `entities/operator/api`: 운영자 목록 조회(`useOperatorListQuery`), 운영자 조회(`useOperatorQuery`)와 새로 조회(`useRefetchOperator`), 저장한 운영자 캐시 규칙(`cacheSavedOperator`), 계정을 바꾼 뒤 다시 불러오기(`refreshOperator`: 운영자 상세를 다시 불러오고 목록을 무효화한다)
  - `features/<동작>/api`: `auth-login`(`useLogin`), `auth-logout`(`useLogout`), `room-create`(`useCreateRoom`), `room-update`(`useUpdateRoom`), `room-type-create`(`useCreateRoomType`), `room-type-update`(`useUpdateRoomType`: 성공하면 `cacheSavedRoomType`과 `invalidateRooms`), `room-status-change`(`useChangeRoomStatus`: 성공과 상태 409 두 가지면 `refreshRoomStatus`가 끝날 때까지 요청 중으로 둔다), `guest-update`(`useUpdateGuest`), `operator-create`(`useCreateOperator`), `operator-update`(`useUpdateOperator`), `operator-password-reset`(`useResetOperatorPassword`), `operator-active-change`(`useChangeOperatorActive`), `stay-cancel`(`useCancelStay`: 성공과 취소할 수 없다는 409 두 가지면 `refreshStay`·`refreshRoomStatus`가 끝날 때까지 요청 중으로 둔다). 운영자의 뒤 둘은 성공하면 `refreshOperator`가 끝날 때까지 요청 중으로 둔다
- 라우트 트리는 `src/app/router/route-tree.gen.ts`에 생성된다. 직접 수정하지 않고 커밋한다.
- 라우트 생성 설정은 `tsr.config.json`에만 둔다.

```
apps/hotel-admin/
├─ .env.local          # API_BASE_URL (proxy가 넘길 백엔드 주소)
├─ index.html          # 진입점: /src/app/entrypoint/main.tsx
├─ orval.config.ts     # API 코드 생성 설정
├─ tsr.config.json     # 라우트 생성 설정
├─ vitest.config.mts   # 테스트 설정. vite.config.ts와 따로 둬서 라우터 플러그인·proxy를 읽지 않는다
├─ vitest-setup.ts     # jest-dom 매처 등록, 테스트마다 cleanup
└─ src/
   ├─ app/
   │  ├─ auth/         # 로그인 연결
   │  │  ├─ login-guard.ts          # 로그인 확인, 로그인 화면 진입 (beforeLoad에서 부른다)
   │  │  ├─ master-guard.ts         # 마스터인지 캐시된 내 정보로 확인해 route context에 넣는다 (/rooms·/room-types·/operators·/settlements의 beforeLoad)
   │  │  ├─ login-redirect.ts       # /login의 search 스키마, redirect 경로 검사
   │  │  └─ unauthorized-handler.ts # 사용 중 401이면 /login으로 보낸다
   │  ├─ entrypoint/   # main.tsx, app-providers.tsx (Provider 조합)
   │  ├─ query/        # QueryClient 생성(재시도 규칙, 오류 처리기), QueryProvider (Devtools 포함)
   │  ├─ toast/        # ToastProvider (라우터 바깥에서 토스트 영역을 그린다)
   │  ├─ router/       # QueryClient·라우터 생성, route-tree.gen.ts, index-redirect.ts(/ → /rooms)
   │  ├─ routes/       # TanStack Router 라우트 파일
   │  │  ├─ __root.tsx           # 탭 제목, 오류 화면
   │  │  ├─ _authenticated.tsx   # 로그인이 필요한 화면의 레이아웃, 로그인 확인
   │  │  ├─ _authenticated/      # 로그인이 필요한 화면
   │  │  │  ├─ index.tsx         # / (객실 목록으로 보낸다)
   │  │  │  ├─ rooms/            # route.tsx(마스터 확인), index.tsx(목록, search 스키마 연결), new.tsx(생성), $roomId/route.tsx(id 파싱), $roomId/index.tsx(상세), $roomId/edit.tsx(수정)
   │  │  │  ├─ room-types/       # route.tsx(마스터 확인, 권한 없음), index.tsx(목록), new.tsx(생성), $roomTypeId/route.tsx(id 파싱), $roomTypeId/index.tsx(상세), $roomTypeId/edit.tsx(수정)
   │  │  │  ├─ guests/           # index.tsx(목록, search 스키마 연결), $guestId/route.tsx(id 파싱), $guestId/index.tsx(상세), $guestId/edit.tsx(수정)
   │  │  │  ├─ stays/            # index.tsx(목록, search 스키마 연결), $stayId/route.tsx(id 파싱), $stayId/index.tsx(상세)
   │  │  │  ├─ settlements/      # route.tsx(마스터 확인, 권한 없음), index.tsx(정산, search 스키마 연결)
   │  │  │  └─ operators/        # route.tsx(마스터 확인, 권한 없음), index.tsx(목록, search 스키마 연결), new.tsx(등록), $operatorId/route.tsx(id 파싱), $operatorId/index.tsx(상세), $operatorId/edit.tsx(수정)
   │  │  └─ login.tsx            # /login (?redirect=)
   │  └─ styles/
   ├─ pages/           # error(화면 오류), login(로그인 화면 틀), room-list(검색 폼·마스터에게만 생성 버튼·목록 배치, URL search 스키마), operator-list(검색 폼·등록 버튼·목록 배치, URL search 스키마), room-type-list(생성 버튼·목록 배치), guest-list(검색 폼·목록 배치, URL search 스키마), stay-list(거르기 폼·이용객 거르기·목록 배치, URL search 스키마), room-detail·room-create·room-edit·room-type-detail·room-type-create·room-type-edit·guest-detail·guest-edit·stay-detail·operator-detail·operator-create·operator-edit(경로의 id를 읽어 배치. 잘못된 id는 찾을 수 없음. room-create·room-edit는 마스터가 아니면 권한 없음 카드, room-detail은 마스터에게만 수정 버튼), settlement(달 바꾸기·요약·이 달 이용 배치, URL search 스키마: month·page), master-access(route context의 isMaster로 하위 화면 또는 권한 없음 카드)
   ├─ widgets/
   │  ├─ admin-layout/ # 사이드바 메뉴(config/menu.ts: 객실·객실 유형(마스터만)·이용객·이용·운영자(마스터만)·정산(마스터만)), 위쪽 영역. model: useAdminMenu(역할에 맞는 메뉴), useAdminHeader(화면 제목·호텔 이름·계정 이름·역할 문구·로그아웃 상태). ui: AdminSidebar(연결)·AdminSidebarNav(표현), AdminHeader(연결)·AdminHeaderBar(표현)
   │  ├─ room-list/    # 객실 목록. model: useRoomList(상태별 내용, 마지막 페이지를 넘으면 바꿔 이동, 페이지 이동). ui: RoomList(연결)·표·빈 상태·불러오기 실패·페이지 이동
   │  ├─ room-detail/  # 객실 상세. 상태별 내용(유형의 값은 RoomTypeTerms)과 '목록으로'·'이용 보기'·'수정'(마스터만) 링크 줄, 내용 아래의 상태 바꾸기·상태 이력. model: useRoomStatusHistory(불러오는 중·실패·빈 상태·내용, 화면 상태의 페이지 이동). ui: RoomDetail(연결)·RoomStatusHistory(이력 연결)·이력 표·빈 상태·불러오기 실패·페이지 이동
   │  ├─ settlement-summary/ # 월별 정산 요약. model: useSettlementSummary(불러오는 중·실패·내용). ui: SettlementSummary(연결, 기준 안내 문구)·요약 내용·불러오기 실패
   │  ├─ settlement-stay-list/ # 이 달 이용 표. model: useSettlementStayList(상태별 내용, 마지막 페이지를 넘으면 바꿔 이동, 페이지 이동). ui: SettlementStayList(연결)·표·빈 상태·불러오기 실패·페이지 이동
   │  ├─ room-type-list/ # 객실 유형 목록. model: useRoomTypeList(불러오는 중·실패·빈 상태·내용). ui: RoomTypeList(연결)·표·빈 상태·불러오기 실패
   │  ├─ room-type-detail/ # 객실 유형 상세. 상태별 내용과 '목록으로'·'수정' 링크 줄
   │  ├─ guest-list/   # 이용객 목록. model: useGuestList(상태별 내용, 마지막 페이지를 넘으면 바꿔 이동, 페이지 이동). ui: GuestList(연결)·표·빈 상태·불러오기 실패·페이지 이동
   │  ├─ guest-detail/ # 이용객 상세. 상태별 내용과 '목록으로'·'이용 보기'·'수정' 링크 줄, 내용 아래의 '지금 이용' 카드(GuestCurrentStay)
   │  ├─ stay-list/    # 이용 목록. model: useStayList(상태별 내용, 마지막 페이지를 넘으면 바꿔 이동, 페이지 이동). ui: StayList(연결)·표·빈 상태·불러오기 실패·페이지 이동
   │  ├─ stay-detail/  # 이용 상세. 상태별 내용, '목록으로' 링크 줄, 취소했으면 취소 정보, 취소할 수 있으면 이용 취소
   │  ├─ operator-list/ # 운영자 목록. model: useOperatorList(상태별 내용, 마지막 페이지를 넘으면 바꿔 이동, 페이지 이동). ui: OperatorList(연결)·표·빈 상태·불러오기 실패·페이지 이동
   │  └─ operator-detail/ # 운영자 상세. 상태별 내용과 '목록으로'·'수정' 링크 줄, 내용 아래의 비밀번호 재설정·사용 여부 바꾸기
   ├─ features/
   │  ├─ auth-login/   # 로그인 폼. api: 로그인(성공하면 로그인 상태 시작). model: 폼 스키마, useLoginForm(react-hook-form, 성공하면 redirect로 이동). ui: LoginForm(연결)·LoginFormView(표현)
   │  ├─ auth-logout/  # api: 로그아웃. 성공하거나 401이면 로그인 상태를 끝낸다
   │  ├─ room-search/  # 객실 목록 검색(이름 검색어·상태·유형). model: useRoomSearchForm(유형 선택지, 제출하면 1페이지로 이동). ui: RoomSearchForm(연결)·RoomSearchFormView(표현)
   │  ├─ room-create/  # 객실 생성. api: useCreateRoom. model: 폼 스키마, useRoomCreateForm(유형 선택지·유형 없음 여부, 이름 중복은 이름 칸 오류, 성공하면 상세로 이동). ui: 연결·표현(유형이 없으면 RoomTypeEmptyGuide)
   │  ├─ room-status-change/ # 객실 상태 바꾸기. api: useChangeRoomStatus. model: useRoomStatusChange(갈 수 있는 상태, 요청 중 막기, 성공·실패 토스트). ui: RoomStatusChange(연결)·RoomStatusChangeView(표현)
   │  ├─ room-update/  # 객실 수정. api: useUpdateRoom. model: 폼 스키마·값 채우기, useRoomUpdateForm(지금 유형을 넣은 유형 선택지, 수정 충돌이면 최신 내용 불러오기). ui: RoomUpdate(불러오기 상태)·RoomUpdateForm(연결)·표현
   │  ├─ room-type-create/ # 객실 유형 생성. api: useCreateRoomType. model: 폼 스키마, useRoomTypeCreateForm(이름 중복은 이름 칸 오류, 성공하면 상세로 이동). ui: 연결·표현
   │  ├─ room-type-update/ # 객실 유형 수정. api: useUpdateRoomType(성공하면 유형 캐시와 객실 목록·상세 캐시 갱신). model: 폼 스키마·값 채우기, useRoomTypeUpdateForm(수정 충돌이면 최신 내용 불러오기). ui: RoomTypeUpdate(불러오기 상태)·RoomTypeUpdateForm(연결)·표현
   │  ├─ guest-search/ # 이용객 목록 검색(이름 또는 전화번호). model: useGuestSearchForm(제출하면 1페이지로 이동). ui: GuestSearchForm(연결)·GuestSearchFormView(표현)
   │  ├─ stay-search/  # 이용 목록 거르기(이용객 검색어·체크인 기간·객실·취소 여부, 이용객 거르기 표시와 풀기 링크). model: useStaySearchForm(체크인 기간 순서 검사, 목록 쿼리의 400 칸 오류 표시, 제출하면 이용객 거르기를 두고 1페이지로 이동), useStayGuestFilter(이용객 이름 문구). ui: StaySearchForm·StayGuestFilter(연결)와 표현
   │  ├─ stay-cancel/  # 이용 취소. api: useCancelStay(성공·409면 이용·객실 캐시 다시 불러오기). model: 사유 폼 스키마, useStayCancel(취소할 수 없음·닫힘·입력 중·제출 중, 닫으면 버튼에 초점). ui: StayCancel(연결)·StayCancelView(표현)
   │  ├─ guest-update/ # 이용객 수정. api: useUpdateGuest. model: 폼 스키마·값 채우기, useGuestUpdateForm(수정 충돌이면 최신 내용 불러오기). ui: GuestUpdate(불러오기 상태)·GuestUpdateForm(연결)·표현
   │  ├─ operator-search/ # 운영자 목록 검색(이름 또는 아이디·사용 여부). model: useOperatorSearchForm(제출하면 1페이지로 이동). ui: OperatorSearchForm(연결)·OperatorSearchFormView(표현)
   │  ├─ operator-create/ # 운영자 등록. api: useCreateOperator. model: 폼 스키마, useOperatorCreateForm(아이디 중복은 아이디 칸 오류, 성공하면 상세로 이동). ui: 연결·표현
   │  ├─ operator-update/ # 운영자 수정. api: useUpdateOperator. model: 폼 스키마·값 채우기, useOperatorUpdateForm(수정 충돌이면 최신 내용 불러오기). ui: OperatorUpdate(불러오기 상태)·OperatorUpdateForm(연결)·표현
   │  ├─ operator-password-reset/ # 운영자 비밀번호 재설정. api: useResetOperatorPassword. model: useOperatorPasswordResetForm(성공하면 토스트·칸 비우기). ui: OperatorPasswordReset(연결)·OperatorPasswordResetView(표현)
   │  └─ operator-active-change/ # 운영자 비활성화·다시 활성화. api: useChangeOperatorActive. model: useOperatorActiveChange(버튼·확인 단계·요청 중, 초점 돌리기, 성공·실패 토스트). ui: OperatorActiveChange(연결)·OperatorActiveChangeView(표현)
   ├─ entities/
   │  ├─ account/      # api: 내 정보 조회, 로그인 상태 캐시 규칙. config: 역할 문구(ACCOUNT_ROLE_LABELS). lib: 마스터 판단(isMaster)
   │  ├─ room/         # api: 목록·상세·상태 이력 조회, 새로 조회, 캐시 규칙, 목록·상세 무효화. config: 항목 이름·상태 문구(ROOM_STATUS_LABELS)·화면 문구. lib: 검색어·상태·유형 거르기 값·페이지 검사, 상태 전이 표(ROOM_STATUS_TRANSITIONS). model: 경로 파라미터 검사, useRoom(불러오는 중·실패·찾을 수 없음·내용), 생성·수정이 함께 쓰는 폼 스키마 조각. ui: 객실 정보 입력 칸(유형 선택지는 props로 받는다), 상세 내용(유형의 값은 슬롯), 층 표시, 상태별 카드
   │  ├─ room-type/    # api: 목록·상세 조회, 새로 조회, 캐시 규칙. config: 항목 이름·선택지·화면 문구. model: 경로 파라미터 검사, useRoomType(불러오는 중·실패·찾을 수 없음·내용), useRoomTypeOptions(객실 폼·거르기의 유형 선택지(빈 값 문구, 지금 유형 넣기), 불러오기 실패 안내, 유형 없음 여부), 생성·수정이 함께 쓰는 폼 스키마 조각. ui: 유형 정보 입력 칸, 상세 내용, 유형의 값 항목(RoomTypeTerms), 상태별 카드, 유형 없음 안내(RoomTypeEmptyGuide)
   │  ├─ guest/        # api: 목록·상세 조회, 새로 조회, 캐시 규칙. config: 항목 이름·화면 문구. lib: 검색어·페이지 검사. model: 경로 파라미터 검사, useGuest(불러오는 중·실패·찾을 수 없음·내용), 수정 폼이 쓰는 폼 스키마 조각. ui: 이용객 정보 입력 칸, 상세 내용, 상태별 카드
   │  ├─ stay/         # api: 목록·상세 조회, 취소한 뒤 다시 불러오기. config: 항목 이름·취소 여부·취소 정보·화면 문구. lib: 거르기 값(객실·이용객·취소 여부·이용객 검색어·체크인 날짜)·페이지 검사, 체크인 기간 순서, 목록 요청 파라미터(toStayListParams), 취소할 수 있는지(isStayCancelable), 거르기용 객실 선택지. model: 경로 파라미터 검사, useStay(불러오는 중·실패·찾을 수 없음·내용). ui: 상세 내용, 취소 정보, 상태별 카드, '이용 보기' 링크(StayListLink)
   │  ├─ settlement/   # api: 월별 정산·이 달 이용 조회(이전 목록은 placeholderData). config: 요약 항목 이름(SETTLEMENT_FIELD_LABELS)·달 제목 문구. lib: 달 검사·이번 달·달 옮기기·달 제목(formatSettlementMonth), 페이지 검사. ui: 불러오는 중 카드
   │  └─ operator/     # api: 목록·상세 조회, 새로 조회, 캐시 규칙, 바꾼 뒤 다시 불러오기. config: 항목 이름·사용 여부 문구(OPERATOR_ACTIVE_LABELS)·화면 문구. lib: 검색어·사용 여부·페이지 검사, 비밀번호 길이. model: 경로 파라미터 검사, useOperator(불러오는 중·실패·찾을 수 없음·내용), 등록·수정이 함께 쓰는 폼 스키마 조각과 비밀번호 검사. ui: 운영자 계정 입력 칸, 비밀번호 칸, 상세 내용, 사용 여부 표시, 상태별 카드
   └─ shared/
      ├─ api/          # 검증된 API만 index.ts로 내보낸다. TanStack Query를 쓰지 않는다
      │  ├─ account.ts          # 내 정보 조회와 쿼리 키, 로그인, 로그아웃, 로그인 요청 스키마
      │  ├─ room-type.ts        # 객실 유형 목록·조회·생성·수정과 쿼리 키, 요청 스키마, 유형 타입
      │  ├─ room.ts             # 객실 목록·조회·생성·수정·상태 변경, 상태 이력 조회와 쿼리 키, 객실 상세 쿼리 키 판별, 요청 스키마, 객실·상태 이력 타입
      │  ├─ guest.ts            # 이용객 목록·조회·수정과 쿼리 키, 요청 스키마, 이용객·이용객 상세(지금 이용 포함) 타입
      │  ├─ settlement.ts       # 월별 정산·이 달 이용 조회와 쿼리 키(settlementQueryKey, settlementStayListQueryKey), 파라미터 스키마, 정산·정산 이용 타입
      │  ├─ operator.ts         # 운영자 목록·조회·등록·수정·비밀번호 재설정·사용 여부 변경과 쿼리 키, 요청 스키마, 운영자 타입
      │  ├─ stay.ts             # 이용 목록·조회·취소와 쿼리 키, 목록 파라미터·취소 요청 스키마, 이용 타입
      │  ├─ api-error.ts        # 서버 오류 정보 읽기 (getApiError), 오류 코드 (API_ERROR_CODES: 공통 코드와 ROOM_NOT_FOUND·ROOM_DUPLICATED·ROOM_MODIFIED·ROOM_STATUS_CHANGED·ROOM_STATUS_TRANSITION_NOT_ALLOWED·ROOM_TYPE_NOT_FOUND·ROOM_TYPE_DUPLICATED·ROOM_TYPE_MODIFIED·GUEST_NOT_FOUND·GUEST_PHONE_DUPLICATED·GUEST_MODIFIED·HOTEL_OPERATOR_NOT_FOUND·HOTEL_ADMIN_MODIFIED·LOGIN_ID_DUPLICATED·STAY_NOT_FOUND·STAY_ALREADY_CANCELED·STAY_ALREADY_ENDED)
      │  ├─ http.ts             # orval mutator
      │  └─ generated/ # orval 생성 코드. 직접 수정하지 않고 shared/api 밖에서 import하지 않는다
      │     └─ zod/    # orval 생성 zod 스키마
      ├─ config/       # APP_INFO (앱 이름), COMMON_MESSAGES (여러 화면이 함께 쓰는 문구), ACCESS_MESSAGES (권한 없음 카드 문구), TOAST_MESSAGES (토스트 영역·닫기 버튼 이름)
      ├─ ui/
      │  └─ master-forbidden/ # 마스터 전용 화면의 권한 없음 카드('객실 목록으로' 버튼)
      └─ lib/
         ├─ money/         # 금액을 천 단위 쉼표와 '원'으로 보여주기(formatWon)
         ├─ date-time/     # 서버의 UTC 시각을 한국 시간 `YYYY-MM-DD HH:mm`으로 보여주기(formatKoreanDateTime), 한국 시간 오늘 `YYYY-MM-DD`(getKoreanToday)
         └─ search-params/ # URL search 직렬화(일반 쿼리 문자열). 라우터와 테스트용 라우터가 쓴다
```

## 라우트 파일 이름

TanStack Router 파일 기반 라우팅이 정한 이름은 kebab-case 규칙의 예외로 둔다.

- `__root.tsx`: 루트 라우트. 이름이 고정이다.
- `_` 접두어: 경로를 만들지 않는 레이아웃 라우트(pathless). 예: `_authenticated.tsx`
- `$` 접두어: 경로 파라미터. 이름이 JS 식별자여야 하므로 여러 단어면 camelCase로 쓴다. 예: `$roomId.tsx` (`$room-id`는 쓸 수 없다)
- 라우트 파일은 `export const Route`(named export)로 내보낸다.

## 린트

- ESLint는 Vite 공식 React-TS 템플릿 구성(`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)에 `@tanstack/eslint-plugin-router` 권장 설정을 더해 쓴다.
- `src/shared/api` 밖의 파일은 `no-restricted-imports`로 `shared/api/generated` import를 막는다.
- `@tanstack/react-query`는 `src/app`, `src/entities/*/api`, `src/features/*/api`, 테스트 파일, `vitest-setup.ts`에서만 import한다. 그 밖의 파일(생성 코드를 뺀 `src/shared/api` 포함)은 `no-restricted-imports`로 막는다.
  - 두 제한은 파일 묶음마다 합친 설정 하나로 둔다. 같은 규칙을 두 설정에 두면 뒤 설정이 앞 설정을 덮기 때문이다.
- Steiger는 `fsd.configs.recommended`에서 `fsd/insignificant-slice`(`frontend/CLAUDE.md`의 '레이어')와 `fsd/excessive-slicing`을 끈다. 화면마다 pages slice를 하나씩 두는 규칙이라 pages slice가 화면 수만큼 늘어나고, 정산 화면을 더하면서 권장 한도(20개)를 넘었다. 묶음 폴더로 나누면 다른 화면 파일까지 옮겨야 해서 규칙을 끄는 쪽을 골랐다(사용자 결정).

## 명령어 (`frontend/`에서 실행)

- 개발 서버: `pnpm --filter hotel-admin dev`
- 빌드: `pnpm --filter hotel-admin build` (`tsr generate` → `tsc --noEmit` → `vite build`)
- 린트: `pnpm --filter hotel-admin lint` (ESLint + Steiger)
- 타입 검사: `pnpm --filter hotel-admin typecheck` (`tsc --noEmit`)
- 테스트: `pnpm --filter hotel-admin test` (한 번 실행)
- 테스트 감시 모드: `pnpm --filter hotel-admin test:watch`
- API 코드 생성: `pnpm --filter hotel-admin codegen`. 백엔드가 실행 중이어야 한다. TanStack Query·axios 코드(`generated`)와 zod 스키마(`generated/zod`)를 함께 만든다.
- 라우트 트리만 다시 만들기: `pnpm --filter hotel-admin exec tsr generate`. 개발 서버와 빌드는 라우트 트리를 자동으로 다시 만든다.
