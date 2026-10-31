alter table stay
	add column room_rate integer,
	add column nights integer,
	add column base_amount integer,
	add column discount_amount integer not null default 0,
	add column total_amount integer;

update stay s
set room_rate = t.room_rate,
	nights = s.check_out_date - s.check_in_date,
	base_amount = t.room_rate * (s.check_out_date - s.check_in_date),
	total_amount = t.room_rate * (s.check_out_date - s.check_in_date)
from room r
join room_type t on t.id = r.room_type_id
where r.id = s.room_id;

alter table stay
	alter column room_rate set not null,
	alter column nights set not null,
	alter column base_amount set not null,
	alter column total_amount set not null,
	alter column discount_amount drop default,
	add constraint stay_amount_check check (
		room_rate >= 0 and discount_amount >= 0 and total_amount >= 0
		and nights = check_out_date - check_in_date
		and base_amount = room_rate * nights
		and total_amount = base_amount - discount_amount
	);
