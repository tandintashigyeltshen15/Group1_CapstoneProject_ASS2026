-- =====================================================================
-- CST Alumni Portal - MySQL 8.0+ schema
-- IDE201 Software Engineering Capstone Project
-- Source: Relational Design + Physical Database Design v3
-- Run with:  mysql -u root -p < database/schema.sql
-- WARNING: DROP statements below wipe existing data. Dev use only.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cst_alumni_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE cst_alumni_portal;

-- ---------------------------------------------------------------------
-- Reset (children first, parents last) so the script can be re-run
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS NOTIFICATION, EVENT_REGISTRATION, `EVENT`, APPLICATION,
  OPPORTUNITY, MENTORSHIP_REQUEST, CONTRIBUTION, PROJECT, PUBLICATION,
  CAREER_HISTORY, ALUMNI, STAFF, STUDENT, PROGRAMME, DEPARTMENT, `USER`, `ROLE`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. ROLE
-- ---------------------------------------------------------------------
CREATE TABLE `ROLE` (
  RoleID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  RoleName VARCHAR(30) NOT NULL UNIQUE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 2. USER
-- ---------------------------------------------------------------------
CREATE TABLE `USER` (
  UserID        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  RoleID        INT UNSIGNED NOT NULL,
  Username      VARCHAR(50)  NOT NULL UNIQUE,      -- college-issued ID
  Password      VARCHAR(255) NOT NULL,             -- store a HASH only (bcrypt/argon2)
  Name          VARCHAR(50)  NOT NULL,
  Email         VARCHAR(254) NOT NULL UNIQUE,
  AccountStatus VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  CreatedAt     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_role
    FOREIGN KEY (RoleID) REFERENCES `ROLE`(RoleID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_user_status
    CHECK (AccountStatus IN ('Pending','Active','Rejected','Suspended'))
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 3. DEPARTMENT
-- ---------------------------------------------------------------------
CREATE TABLE DEPARTMENT (
  DepartmentID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  DepartmentName VARCHAR(50) NOT NULL UNIQUE,
  HOD            VARCHAR(50)                         -- Head of Department (name)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 4. PROGRAMME
-- ---------------------------------------------------------------------
CREATE TABLE PROGRAMME (
  ProgrammeID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ProgrammeName VARCHAR(100) NOT NULL,
  DepartmentID  INT UNSIGNED NOT NULL,
  CONSTRAINT fk_programme_department
    FOREIGN KEY (DepartmentID) REFERENCES DEPARTMENT(DepartmentID)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 5. STUDENT  (PK = StudentID; UserID is FK only, one-to-one)
-- ---------------------------------------------------------------------
CREATE TABLE STUDENT (
  StudentID       VARCHAR(20)  PRIMARY KEY,          -- college-issued student ID
  UserID          INT UNSIGNED NOT NULL UNIQUE,
  ProgrammeID     INT UNSIGNED NOT NULL,
  JoinYear        YEAR         NOT NULL,
  PhoneNo         VARCHAR(8)   UNIQUE,
  Dzongkhag       VARCHAR(20),
  Gewog           VARCHAR(20),
  Projects        TEXT,
  TechnicalSkills TEXT,
  SoftSkills      TEXT,
  CONSTRAINT fk_student_user
    FOREIGN KEY (UserID) REFERENCES `USER`(UserID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_student_programme
    FOREIGN KEY (ProgrammeID) REFERENCES PROGRAMME(ProgrammeID)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 6. STAFF  (PK = StaffID; UserID is FK only, one-to-one)
-- ---------------------------------------------------------------------
CREATE TABLE STAFF (
  StaffID         VARCHAR(10)  PRIMARY KEY,          -- college-issued staff ID
  UserID          INT UNSIGNED NOT NULL UNIQUE,
  PhoneNo         VARCHAR(8)   UNIQUE,
  DepartmentID    INT UNSIGNED NOT NULL,
  Qualifications  VARCHAR(100),
  Designation     VARCHAR(100),
  AreaOfExpertise TEXT,
  CONSTRAINT fk_staff_user
    FOREIGN KEY (UserID) REFERENCES `USER`(UserID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_staff_department
    FOREIGN KEY (DepartmentID) REFERENCES DEPARTMENT(DepartmentID)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 7. ALUMNI  (PK = AlumniID auto-generated; UserID is FK only)
-- ---------------------------------------------------------------------
CREATE TABLE ALUMNI (
  AlumniID               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  UserID                 INT UNSIGNED NOT NULL UNIQUE,
  ProgrammeID            INT UNSIGNED NOT NULL,
  GraduationYear         INT          NOT NULL,
  ProfessionalBackground TEXT,
  ExpertiseArea          VARCHAR(255),
  MentorshipAvailable    BOOLEAN      NOT NULL DEFAULT FALSE,
  IsProfilePublic        BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_alumni_user
    FOREIGN KEY (UserID) REFERENCES `USER`(UserID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_alumni_programme
    FOREIGN KEY (ProgrammeID) REFERENCES PROGRAMME(ProgrammeID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_alumni_grad_programme (GraduationYear, ProgrammeID)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 8. CAREER_HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE CAREER_HISTORY (
  CareerID     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  AlumniID     INT UNSIGNED NOT NULL,
  Organization VARCHAR(100) NOT NULL,
  `Position`   VARCHAR(30)  NOT NULL,
  StartDate    DATE         NOT NULL,
  EndDate      DATE,                                  -- NULL = current position
  CONSTRAINT fk_career_alumni
    FOREIGN KEY (AlumniID) REFERENCES ALUMNI(AlumniID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_career_dates CHECK (EndDate IS NULL OR EndDate >= StartDate),
  INDEX idx_career_alumni (AlumniID)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 9. PUBLICATION
-- ---------------------------------------------------------------------
CREATE TABLE PUBLICATION (
  PublicationID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  AlumniID        INT UNSIGNED NOT NULL,
  Title           VARCHAR(100) NOT NULL,
  PublicationType VARCHAR(50)  NOT NULL,
  PublicationDate DATE,
  CONSTRAINT fk_publication_alumni
    FOREIGN KEY (AlumniID) REFERENCES ALUMNI(AlumniID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_publication_alumni (AlumniID)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 10. PROJECT
-- ---------------------------------------------------------------------
CREATE TABLE PROJECT (
  ProjectID     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  AlumniID      INT UNSIGNED NOT NULL,
  Title         VARCHAR(100) NOT NULL,
  Description   TEXT,
  StartDate     DATE,
  EndDate       DATE,
  FundingAgency VARCHAR(150),
  CONSTRAINT fk_project_alumni
    FOREIGN KEY (AlumniID) REFERENCES ALUMNI(AlumniID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_project_dates
    CHECK (StartDate IS NULL OR EndDate IS NULL OR EndDate >= StartDate),
  INDEX idx_project_alumni (AlumniID)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 11. CONTRIBUTION
-- ---------------------------------------------------------------------
CREATE TABLE CONTRIBUTION (
  ContributionID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  AlumniID         INT UNSIGNED NOT NULL,
  CategoryType     VARCHAR(50)  NOT NULL,
  Description      TEXT         NOT NULL,
  ContributionDate DATE,
  CONSTRAINT fk_contribution_alumni
    FOREIGN KEY (AlumniID) REFERENCES ALUMNI(AlumniID)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 12. MENTORSHIP_REQUEST
-- ---------------------------------------------------------------------
CREATE TABLE MENTORSHIP_REQUEST (
  RequestID      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  StudentID      VARCHAR(20)  NOT NULL,
  AlumniID       INT UNSIGNED NOT NULL,
  RequestSubject VARCHAR(50)  NOT NULL,
  RequestDetail  TEXT         NOT NULL,
  Duration       VARCHAR(50),
  RequestDate    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status         VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_mentorship_student
    FOREIGN KEY (StudentID) REFERENCES STUDENT(StudentID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mentorship_alumni
    FOREIGN KEY (AlumniID) REFERENCES ALUMNI(AlumniID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_mentorship_status
    CHECK (Status IN ('Pending','Accepted','Declined')),
  INDEX idx_mentorship_alumni_status (AlumniID, Status)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 13. OPPORTUNITY
-- (Title is in the relational diagram; Organization is in the physical
--  design doc. Both are kept - delete whichever your team drops.)
-- ---------------------------------------------------------------------
CREATE TABLE OPPORTUNITY (
  OpportunityID           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  CreatorID               INT UNSIGNED NOT NULL,
  Title                   VARCHAR(150) NOT NULL,
  Organization            VARCHAR(100) NOT NULL,
  OpportunityType         VARCHAR(30)  NOT NULL,
  Description             TEXT         NOT NULL,
  Deadline                DATETIME,
  StartDate               DATE,
  Duration                VARCHAR(50),
  EligibilityRequirements TEXT,
  Status                  VARCHAR(20)  NOT NULL DEFAULT 'Open',
  CONSTRAINT fk_opportunity_creator
    FOREIGN KEY (CreatorID) REFERENCES `USER`(UserID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_opportunity_status CHECK (Status IN ('Open','Filled'))
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 14. APPLICATION
-- ---------------------------------------------------------------------
CREATE TABLE APPLICATION (
  ApplicationID     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  StudentID         VARCHAR(20)  NOT NULL,
  OpportunityID     INT UNSIGNED NOT NULL,
  SubmissionDate    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ApplicationStatus VARCHAR(20)  NOT NULL DEFAULT 'Under Review',
  CONSTRAINT fk_application_student
    FOREIGN KEY (StudentID) REFERENCES STUDENT(StudentID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_application_opportunity
    FOREIGN KEY (OpportunityID) REFERENCES OPPORTUNITY(OpportunityID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT uq_application_student_opportunity UNIQUE (StudentID, OpportunityID),
  CONSTRAINT chk_application_status
    CHECK (ApplicationStatus IN ('Under Review','Shortlisted','Accepted','Not Selected')),
  INDEX idx_application_student_date (StudentID, SubmissionDate),
  INDEX idx_application_opp_status (OpportunityID, ApplicationStatus)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 15. EVENT
-- ---------------------------------------------------------------------
CREATE TABLE `EVENT` (
  EventID     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  CreatorID   INT UNSIGNED NOT NULL,
  Title       VARCHAR(200) NOT NULL,
  Description TEXT,
  `DateTime`  DATETIME     NOT NULL,
  Duration    VARCHAR(50),
  Venue       VARCHAR(200),
  Status      VARCHAR(20)  NOT NULL DEFAULT 'Published',
  CONSTRAINT fk_event_creator
    FOREIGN KEY (CreatorID) REFERENCES `USER`(UserID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_event_status
    CHECK (Status IN ('Published','Cancelled','Completed'))
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 16. EVENT_REGISTRATION
-- ---------------------------------------------------------------------
CREATE TABLE EVENT_REGISTRATION (
  RegistrationID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  UserID           INT UNSIGNED NOT NULL,
  EventID          INT UNSIGNED NOT NULL,
  RegistrationDate DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventreg_user
    FOREIGN KEY (UserID) REFERENCES `USER`(UserID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eventreg_event
    FOREIGN KEY (EventID) REFERENCES `EVENT`(EventID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_eventreg_user_event UNIQUE (UserID, EventID)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 17. NOTIFICATION
-- ---------------------------------------------------------------------
CREATE TABLE NOTIFICATION (
  NotificationID   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  UserID           INT UNSIGNED NOT NULL,
  NotificationType VARCHAR(50)  NOT NULL,
  Message          VARCHAR(200) NOT NULL,
  CreatedAt        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsRead           BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_notification_user
    FOREIGN KEY (UserID) REFERENCES `USER`(UserID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notification_user_read (UserID, IsRead, CreatedAt)
) ENGINE = InnoDB;
