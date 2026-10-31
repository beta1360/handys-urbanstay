alter table guest add column member_id bigint references member (id);

create index guest_member_id_idx on guest (member_id);
