-- Create a function to execute dynamic SQL with parameters
create or replace function execute_sql(query_text text, query_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  execute format('select json_agg(t) from (%s) t', query_text)
    using query_params
    into result;
  return coalesce(result, '[]'::jsonb);
end;
$$; 