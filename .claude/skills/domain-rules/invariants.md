# 핵심 불변식

규칙을 서버·DB·화면에서 어떻게 지키는지 모은 표다. 원본은 `docs/domain.md`(규칙), `backend/CLAUDE.md`(서버), `backend/src/main/resources/db/migration`(제약 이름), `frontend/apps/*/CLAUDE.md`(화면)다. 실패 응답은 서버 칸에 적었다. 화면 검증은 보조이고 최종 판단은 서버와 DB다.

## 예약·이용

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 같은 객실에 기간이 겹치는 이용은 하나만. 취소한 이용은 빼고, [체크인, 체크아웃)이라 1일~3일과 3일~5일은 겹치지 않는다 | 예약은 유형 객실을 잠근 뒤 `StayRepository.findOverlappedRoomIds`로 겹치지 않는 객실만 고른다. 제약 위반은 409 `STAY_PERIOD_OVERLAPPED` | `stay_room_id_period_excl`(`exclude using gist`, `daterange [)`, `where (canceled_at is null)`, V10에서 다시 만듦) | web의 '예약불가'가 클라이언트 검증이다. 409면 폼 알림 + 유형 목록 다시 조회 |
| 같은 유형에 예약이 동시에 와도 한 객실에 겹치는 이용이 생기지 않는다. 그사이 빈 객실이 없어졌으면 거절 | `RoomService.lockRoomsByType`(`RoomRepository.lockByRoomTypeId`, `PESSIMISTIC_WRITE` = `for no key update`, id 오름차순) 뒤 `findByIdIn`으로 다시 읽어 고른다. 없으면 409 `ROOM_TYPE_UNAVAILABLE` | 위 배제 제약이 안전망(잠금을 거치지 않은 INSERT) | 409 `ROOM_TYPE_UNAVAILABLE`도 폼 알림 + 유형 목록 다시 조회 |
| 예약할 수 있는 객실: 그 유형이고, 최대 인원 ≥ 인원이고, 그 기간에 취소하지 않은 이용과 겹치지 않는 객실. 객실 상태와 관계없다 | 유형 목록(`availableCount`)과 예약이 같은 계산 `StayService.availableRooms`를 쓴다 | - | web: `availableCount`가 0이면 '예약불가'로 보여주고 고를 수 없다 |
| 게스트는 호수를 고르지 않는다. 예약할 수 있는 객실 중 이름순 첫 객실 | `StayService.reserve`. 이름순은 `natural_sort`, 같으면 id | - | 완료 화면과 응답에 배정 호수가 없다 |
| 체크인은 오늘(한국 시간) 이후, 체크아웃은 체크인보다 뒤, 1~30박 | 서비스가 틀린 항목을 모아 400 `INVALID_INPUT`(`validation.today-or-later`·`after-check-in`·`max-nights`, `Stay.MAX_NIGHTS`) | `stay_period_check`(1~30박). 오늘 규칙은 DB가 막지 않는다 | web 폼이 서버와 같은 문구로 제출할 때 검사 |
| 인원은 1명 ~ 유형의 최대 인원 | 요청 `@Min(1)`. 최대 인원보다 크면 예약할 수 있는 객실이 없는 것이라 409 `ROOM_TYPE_UNAVAILABLE` | `stay.guest_count` CHECK 1~20(이름 없음) | 유형 목록이 인원으로 '예약불가'를 정한다 |
| 예약 요청 하나로 이용객과 이용이 함께 성공하거나 함께 실패 | `StayService.reserve` 한 트랜잭션. 이용 저장이 실패하면 새 이용객과 회원 연결도 남지 않는다 | - | - |
| 예약 비용은 예약할 때의 값으로 고정. 유형 요금을 바꿔도 지난 이용 금액은 그대로 | `Stay` 생성자에 1박 요금을 넘겨 박 수·기본·할인(0)·최종 금액을 계산해 저장 | `stay_amount_check`(금액 ≥ 0, 박 수 = 체크아웃 − 체크인, 기본 = 요금 × 박 수, 최종 = 기본 − 할인) | web 예약 내용의 최종 금액은 표시용(`estimateTotalAmount`), 완료 화면·hotel-admin 상세·정산은 저장값 |
| 이용 등록은 객실 상태와 관계없고 상태를 바꾸지 않는다 | `StayService.reserve`는 상태를 건드리지 않는다 | - | - |
| 이용은 수정하지 않는다 | 수정 API가 없고 `stay`에 `version`이 없다 | - | - |

## 취소

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 취소는 한 번만, 되돌릴 수 없다 | `StayRepository.cancel`이 `where id = :id and canceled_at is null`로 한 번에 쓴다. 0행이면 409 `STAY_ALREADY_CANCELED` | `stay_cancellation_check`(취소 시각·계정·이름이 함께 있거나 함께 없고, 사유는 취소한 이용에만) | hotel-admin: 409면 서버 문구 오류 토스트 + 다시 불러오기 |
| 끝나지 않은 이용만 취소. 체크아웃 날짜가 오늘(한국 시간)이거나 지났으면 끝난 이용 | 판단 순서: 404 `STAY_NOT_FOUND` → 409 `STAY_ALREADY_CANCELED` → 409 `STAY_ALREADY_ENDED` → 조건부 UPDATE | - | `isStayCancelable`(체크아웃 > `getKoreanToday`)일 때만 '이용 취소' 묶음 |
| 취소 때 객실이 예약됨이면 공실로. 이용중·정비중·공실이면 그대로 | 같은 트랜잭션에서 `RoomService.releaseReservation`(`RESERVED → VACANT` 조건부 UPDATE)과 상태 이력(취소한 계정). 0행이어도 취소는 성공 | - | 성공하면 `refreshRoomStatus`로 객실 상세·목록·이력도 무효화 |
| 취소 기록: 시각, 처리한 계정 id와 그때의 이름, 사유(선택, 200자) | 이름은 `HotelAdminService.getHotelAdmin`으로 읽은 지금 이름을 저장 | `stay_cancellation_check`, 이름·사유 CHECK | '취소 정보' 카드(사유 없으면 '사유 없음') |

## 객실 상태

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 바꿀 수 있는 방향은 여섯 가지뿐(공실 → 예약됨·정비중, 예약됨 → 이용중·공실, 이용중 → 정비중, 정비중 → 공실). 같은 상태로도 못 바꾼다 | `RoomStatus.canChangeTo`. 그 밖은 409 `ROOM_STATUS_TRANSITION_NOT_ALLOWED`(16조합을 `RoomStatusTest`로) | `room.status` CHECK 네 값(V7) | `ROOM_STATUS_TRANSITIONS`로 갈 수 있는 상태 버튼만 |
| 화면에서 본 상태일 때만 바꾼다 | `RoomRepository.updateStatus`가 `where ... status = :from`. 0행이면 409 `ROOM_STATUS_CHANGED`. `version`을 올리지 않는다 | - | `{ from, to }`를 보낸다. 409 두 가지는 오류 토스트 + 다시 불러오기 |
| 객실 수정이 상태를 덮어쓰지 않는다 | `Room.status`는 `@Column(updatable = false)` | - | - |
| 새 객실은 공실. 상태가 바뀔 때마다 이력(등록도 없음 → 공실) | 상태 변경·등록과 같은 트랜잭션에서 `room_status_history` 저장. 바꾼 사람은 계정 id와 그때의 이름 | `room_status_history` CHECK(네 값, 정리된 이름) | 상세의 상태 이력 표(최신순) |
| 자동 상태 변경은 없다(예외는 위 취소 하나) | - | - | 지금 이용과 상태는 따로 보인다 |

## 이름과 유일

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 이름과 주소가 모두 같은 호텔 금지(앞뒤 공백 제거, 대소문자 구분) | 사전 확인 + 위반을 409 `HOTEL_DUPLICATED`로(`Hotel.NAME_ADDRESS_UNIQUE_CONSTRAINT`) | `hotel_name_address_key` | app-admin: 오류 토스트 |
| 같은 호텔에 같은 이름의 객실 유형 금지 | 409 `ROOM_TYPE_DUPLICATED` | `room_type_hotel_id_name_key` | 이름 칸 오류 |
| 같은 호텔에 같은 이름의 객실 금지 | 409 `ROOM_DUPLICATED` | `room_hotel_id_name_key` | 이름 칸 오류 |
| 객실은 같은 호텔의 유형만 가리킨다 | `RoomTypeService.getRoomType(hotelId, ...)`. 없거나 다른 호텔이면 404 `ROOM_TYPE_NOT_FOUND` | `room_room_type_id_hotel_id_fkey` → `room_type_id_hotel_id_key` | 유형 칸 오류 |
| 같은 호텔에 전화번호(숫자만 비교)가 같은 이용객은 같은 사람. 이메일은 같아도 된다 | 수정: `GuestSpecifications.samePhone` + 409 `GUEST_PHONE_DUPLICATED`. 예약: 거절하지 않고 그 이용객으로, 없으면 `GuestRepository.insertIfPhoneAbsent`(`on conflict do nothing`) 뒤 다시 찾는다 | `guest_hotel_id_phone_digits_key`(식 유일 인덱스 `replace(phone, '-', '')`) | hotel-admin 수정: 전화번호 칸 오류 |
| 이용객은 한 회원에게만 연결. 연결할 때 이용객의 이름·이메일은 바꾸지 않는다 | `GuestRepository.linkMember`(`where member_id is null or member_id = 회원`). 0행이면 409 `GUEST_LINKED_TO_OTHER_MEMBER`. `Guest.member`는 `updatable = false`라 hotel-admin 수정이 못 바꾼다 | `guest.member_id` 외래 키(V14) | web: 폼 알림 |
| 회원 이메일은 모든 회원 중 유일(대소문자·앞뒤 공백 무시) | `existsByEmail` + 409 `MEMBER_EMAIL_DUPLICATED`. 소문자로 저장 | `member_email_key` | web 회원가입: 이메일 칸 오류 |
| 호텔 계정 아이디는 모든 호텔 계정 중 유일 | 409 `LOGIN_ID_DUPLICATED`. `LoginId.normalize`(소문자) | `hotel_admin_login_id_key` | 아이디 칸 오류 |
| 전체 어드민 아이디는 모든 전체 어드민 중 유일(대소문자·앞뒤 공백 무시). 호텔 계정과는 같아도 된다 | `existsByLoginId` + 409 `LOGIN_ID_DUPLICATED`(`AppAdmin.LOGIN_ID_UNIQUE_CONSTRAINT`). `LoginId.normalize`(소문자) | `app_admin_login_id_key`(V1 컬럼 `unique`에 PostgreSQL이 붙인 이름) | - |
| 호텔마다 마스터 하나. 호텔과 함께 만들어지거나 함께 실패 | `HotelService.create` 한 트랜잭션(호텔 → 마스터) | `hotel_admin_master_key`(`where role = 'MASTER'` 부분 유일 인덱스) | - |

## 낙관적 잠금

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 나중에 저장한 쪽이 먼저 저장된 변경을 덮어쓰지 않는다 | `@Version`. 수정 요청은 `version` 필수, 다르거나 flush 때 막히면 409: `Hotel` `HOTEL_MODIFIED`, `AppAdmin` `APP_ADMIN_MODIFIED`(V15), `HotelAdmin` `HOTEL_ADMIN_MODIFIED`, `Room` `ROOM_MODIFIED`, `RoomType` `ROOM_TYPE_MODIFIED`, `Guest` `GUEST_MODIFIED`. `Stay`·`Member`는 수정이 없어 version이 없다 | `version bigint not null` | '최신 내용 불러오기'와 함께 폼 안에 |

## 범위와 조회

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 호텔 계정은 자기 호텔만. 다른 호텔의 객실·유형·이용객·이용·운영자는 없는 것처럼 | 호텔 id는 `HotelAdminPrincipal.hotelId`. `findByIdAndHotelId` 등으로 찾아 404(`ROOM_NOT_FOUND`, `ROOM_TYPE_NOT_FOUND`, `GUEST_NOT_FOUND`, `STAY_NOT_FOUND`, `HOTEL_OPERATOR_NOT_FOUND`). 목록 거르기의 다른 호텔 id는 빈 목록 | - | - |
| 회원은 자기와 연결된 이용객(모든 호텔)의 이용만 | `MemberPrincipal` id로 `StayService.getMemberStays`. `period=UPCOMING`은 체크아웃 > 오늘(`Clock`, Asia/Seoul) 체크인 오름차순, `PAST`는 체크아웃 ≤ 오늘 체크인 내림차순(둘 다 취소 포함, 같으면 id 같은 방향), 없으면 전체 체크인 내림차순 | - | web '내 이용': 체크아웃 > 오늘이면 '지금·앞으로의 이용', 아니면 '지난 이용'. 10건씩 무한 스크롤, `UPCOMING`을 다 받은 뒤 `PAST` |
| 게스트 앱 호텔 목록은 모든 호텔. 객실이 있는 호텔을 앞에, 없는 호텔을 뒤에(각 묶음은 이름순, 같으면 id) | `HotelRepository.findAllWithRoomCountOrderByRoomPresenceAndName`(left join + group by, 정렬·페이지는 DB). 항목에 `roomCount` | - | web: `roomCount`가 0이면 비활성, 고를 수 없다 |
| 지금 이용: 오늘(한국 시간)이 [체크인, 체크아웃) 안, 취소 제외 | `Clock`(Asia/Seoul) 기준. 객실은 많아야 하나(`StayService.getCurrentStays`), 이용객은 체크인 오름차순 첫 하나(`getCurrentStayOfGuest`) | 인덱스 `stay_room_id_check_in_date_id_idx`, `stay_guest_id_check_in_date_id_idx` | 객실 목록·상세, 이용객 상세의 '지금 이용'. 객실 상태와 따로 |

## 정산

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 체크인 날짜가 그 달(1일~말일)인 이용이 그 달 정산. 다음 달로 이어져도 체크인 달 | `StaySettlementService`. `month`는 `YYYY-MM` 필수 | - | 처음 달은 한국 날짜의 이번 달(`getKoreanToday`) |
| 취소하지 않은 이용의 최종 금액 합계와 건수, 취소 건수는 따로 | `StayRepository.summarize` 쿼리 하나(`filter (where ...)`). 합계는 `Long`. 저장한 금액을 쓴다 | - | 계산은 서버. '체크인 날짜가 이 달인 이용 기준이며 취소한 이용은 금액에서 뺍니다.' |
| 그 달 이용 로그는 취소 포함, 금액과 취소 여부 함께 | 체크인 오름차순, 같으면 id 오름차순 페이지 | - | 취소한 이용도 금액 그대로, '취소됨' |

## 계정

| 규칙 | 서버(서비스) | DB 제약 이름 | 화면 |
|---|---|---|---|
| 비활성화·비밀번호 재설정·아이디 변경이면 그 계정의 기존 세션은 다음 요청에서 끊긴다. 이름 변경은 끊지 않는다 | 엔티티 메서드가 `credential_version`을 올리고 `HotelAdminSessionVerifier`가 요청마다 확인해 401 | `hotel_admin.credential_version` | 수정 화면 안내 문구, 비활성화 확인 문구 |
| 전체 어드민은 목록·상세·추가·이름 수정만. 아이디·비밀번호 변경, 비활성화·삭제는 없고 이름 변경은 세션을 끊지 않는다 | `AppAdminService`. 수정 요청은 `name`, `version`만 받는다. 어드민 세션은 요청마다 확인하지 않는다 | - | - |
| 비활성 계정의 로그인은 아이디·비밀번호가 틀렸을 때와 같은 응답 | `HotelAdminUserDetailsService`가 활성 계정만 읽는다. 401 `INVALID_CREDENTIALS` | - | - |
| 비밀번호: 8~64자, 영문과 숫자 모두, 영문 자판 글자(ASCII 0x20~0x7E)만, 앞뒤 공백도 비밀번호 | `@Password`. 계정을 만들거나 비밀번호를 바꾸는 모든 요청과 회원가입 | - | `passwordSchema`(어드민), 서버와 같은 문구 |
