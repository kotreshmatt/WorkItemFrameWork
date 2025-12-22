
1

 Export

Cost: 11ms

1

Total 4

create_statement
CREATE TABLE user_positions (id uuid NOT NULL, user_id uuid NOT NULL, structure_id uuid NOT NULL, title character varying(255) NOT NULL, is_primary boolean, reports_to uuid, start_date date NOT NULL, end_date date);

CREATE TABLE users (id uuid NOT NULL, ldap_id character varying(255), name character varying(255) NOT NULL, email character varying(255), title character varying(255), roles character varying, groups ARRAY, is_active boolean, last_sync_at timestamp without time zone, created_at timestamp without time zone, updated_at timestamp without time zone);

CREATE TABLE work_items (id integer NOT NULL, workflow_id character varying(255) NOT NULL, run_id character varying(255), task_type character varying(100) NOT NULL, task_name character varying(255) NOT NULL, state character varying(50) NOT NULL, offered_user_ids ARRAY, offered_roles ARRAY, offered_groups ARRAY, claimed_by text, context_data jsonb, result_data jsonb, created_at timestamp without time zone, claimed_at timestamp without time zone, completed_at timestamp without time zone, due_date timestamp without time zone, completed_by text, description character varying(255), parameters jsonb, priority character varying(20));

create_statement	CREATE TABLE org_models (id uuid NOT NULL, name character varying(255) NOT NULL, description text, structures jsonb, role_definitions jsonb, group_definitions jsonb, ldap_config jsonb, created_at timestamp without time zone, updated_at timestamp without time zone);
create_statement	CREATE TABLE user_positions (id uuid NOT NULL, user_id uuid NOT NULL, structure_id uuid NOT NULL, title character varying(255) NOT NULL, is_primary boolean, reports_to uuid, start_date date NOT NULL, end_date date);
create_statement	CREATE TABLE users (id uuid NOT NULL, ldap_id character varying(255), name character varying(255) NOT NULL, email character varying(255), title character varying(255), roles character varying, groups ARRAY, is_active boolean, last_sync_at timestamp without time zone, created_at timestamp without time zone, updated_at timestamp without time zone);
create_statement	CREATE TABLE work_items (id integer NOT NULL, workflow_id character varying(255) NOT NULL, run_id character varying(255), task_type character varying(100) NOT NULL, task_name character varying(255) NOT NULL, state character varying(50) NOT NULL, offered_user_ids ARRAY, offered_roles ARRAY, offered_groups ARRAY, claimed_by text, context_data jsonb, result_data jsonb, created_at timestamp without time zone, claimed_at timestamp without time zone, completed_at timestamp without time zone, due_date timestamp without time zone, completed_by text, description character varying(255), parameters jsonb, priority character varying(20));
Copy
Toggle Developer Tools