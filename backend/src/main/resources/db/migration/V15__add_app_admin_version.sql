alter table app_admin add column version bigint not null default 0;
alter table app_admin alter column version drop default;
