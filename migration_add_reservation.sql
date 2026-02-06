-- Migration to add reservation_details column to stock_units table

-- 1. Add the column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'stock_units' and column_name = 'reservation_details') then
        alter table stock_units add column reservation_details text;
    end if;
end $$;

-- 2. Update the comments/documentation (optional)
comment on column stock_units.reservation_details is 'Stores reservation info from Excel (Col S). If value is "Rezerwuj", it means Available. Otherwise it is Reserved.';
