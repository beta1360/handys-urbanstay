alter table stay
	add column canceled_at timestamptz,
	add column canceled_by_id bigint references hotel_admin (id),
	add column canceled_by_name varchar(50) check (canceled_by_name is null or (canceled_by_name <> '' and canceled_by_name = btrim(canceled_by_name))),
	add column cancel_reason varchar(200) check (cancel_reason is null or (cancel_reason <> '' and cancel_reason = btrim(cancel_reason))),
	add constraint stay_cancellation_check check (
		num_nulls(canceled_at, canceled_by_id, canceled_by_name) in (0, 3) and (cancel_reason is null or canceled_at is not null)
	);

alter table stay drop constraint stay_room_id_period_excl;
alter table stay add constraint stay_room_id_period_excl
	exclude using gist (room_id with =, daterange(check_in_date, check_out_date, '[)') with &&) where (canceled_at is null);

create index stay_room_id_check_in_date_id_idx on stay (room_id, check_in_date desc, id desc);
