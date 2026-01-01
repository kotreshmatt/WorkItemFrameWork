-- USERS
INSERT INTO users (id, username, status)
VALUES
  ('admin', 'admin', 'ACTIVE'),
  ('user1', 'user1', 'ACTIVE');

-- ORG UNITS
INSERT INTO org_units (id, name)
VALUES ('ou1', 'Organic 1');

-- POSITIONS
INSERT INTO positions (id, name, org_unit_id)
VALUES ('manager', 'Manager', 'ou1');

-- USER_POSITIONS (required)
CREATE TABLE IF NOT EXISTS user_positions (
  user_id varchar(64),
  position_id varchar(64),
  PRIMARY KEY (user_id, position_id)
);

INSERT INTO user_positions (user_id, position_id)
VALUES ('user1', 'manager');

-- GROUPS
INSERT INTO groups (id, name)
VALUES ('group1', 'Group 1');

INSERT INTO group_members (group_id, user_id)
VALUES ('group1', 'user1');
