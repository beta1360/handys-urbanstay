alter table hotel_admin add column version bigint not null default 0;
alter table hotel_admin alter column version drop default;
