-- Starter data. Run AFTER schema.sql (run it once; schema.sql resets everything):
--   mysql -u root -p cst_alumni_portal < database/seed.sql
USE cst_alumni_portal;

-- ---------------------------------------------------------------------
-- ROLE
-- ---------------------------------------------------------------------
INSERT INTO `ROLE` (RoleName) VALUES
  ('Student'), ('Alumni'), ('Staff'), ('Administrator');

-- ---------------------------------------------------------------------
-- DEPARTMENT (6)
-- ---------------------------------------------------------------------
INSERT INTO DEPARTMENT (DepartmentName, HOD) VALUES
  ('Architecture', NULL),
  ('Civil & Environmental Engineering', NULL),
  ('Computing Technologies', NULL),
  ('Electrical & Electronic Engineering', NULL),
  ('Mechanical Engineering', NULL),
  ('Science & Humanities', NULL);

-- ---------------------------------------------------------------------
-- PROGRAMME (14) - department looked up by name, so IDs don't matter
-- ---------------------------------------------------------------------
INSERT INTO PROGRAMME (ProgrammeName, DepartmentID) VALUES
  -- Bachelor's (4-year BE, 5-year B.Arch)
  ('Bachelor of Architecture',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Architecture')),
  ('Bachelor of Engineering in Civil Engineering',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Civil & Environmental Engineering')),
  ('Bachelor of Engineering in Engineering Geology',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Civil & Environmental Engineering')),
  ('Bachelor of Engineering in Water Resource Engineering',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Civil & Environmental Engineering')),
  ('Bachelor of Engineering in Information Technology',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Computing Technologies')),
  ('Bachelor of Engineering in Software Engineering',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Computing Technologies')),
  ('Bachelor of Engineering in Electrical Engineering',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Electrical & Electronic Engineering')),
  ('Bachelor of Engineering in Electronics and Communication',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Electrical & Electronic Engineering')),
  ('Bachelor of Engineering in Instrumentation and Control Engineering',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Electrical & Electronic Engineering')),
  ('Bachelor of Engineering in Mechanical Engineering',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Mechanical Engineering')),
  -- Master's
  ('Master of Engineering in Renewable Energy',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Electrical & Electronic Engineering')),
  ('Master in Construction Management',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Civil & Environmental Engineering')),
  ('Master of Science in Engineering (MSc. Eng)',
     (SELECT DepartmentID FROM DEPARTMENT WHERE DepartmentName = 'Science & Humanities'));
