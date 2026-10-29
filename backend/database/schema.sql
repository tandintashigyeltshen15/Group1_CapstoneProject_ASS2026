-- =====================================================================
--  CST Alumni Portal  -  Database schema (MySQL 8 / MariaDB 10.5+)
--  Based on the relational design diagram, extended to match the
--  frontend (alumni, student, staff and admin pages).
--
--  Run:   mysql -u root -p < schema.sql
--  Then:  mysql -u root -p cst_alumni_portal < seed.sql
--
--  WARNING: the DROP TABLE block below deletes existing data so the
--  script can be re-run during development. Remove it for production.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cst_alumni_portal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cst_alumni_portal;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS
  USER_SETTINGS, PASSWORD_RESET, COLLABORATION_REQUEST, ANNOUNCEMENT, NOTIFICATION,
  EVENT_REGISTRATION, EVENT, SAVED_OPPORTUNITY, APPLICATION, OPPORTUNITY,
  MENTORSHIP_REQUEST, INITIATIVE_PARTICIPANT, CONTRIBUTION, INITIATIVE,
  PROJECT, PUBLICATION, CAREER_HISTORY, VERIFICATION_REQUEST, ALUMNI, STAFF, STUDENT,
  PROGRAMME, DEPARTMENT, `USER`, ROLE;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Accounts
-- ---------------------------------------------------------------------
CREATE TABLE ROLE (
  RoleID    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  RoleName  VARCHAR(20) NOT NULL,
  PRIMARY KEY (RoleID),
  UNIQUE KEY uq_role_name (RoleName)
) ENGINE=InnoDB;

-- Username: Student ID for students, Staff ID for staff, email for alumni,
-- a plain username for admins. Password is stored as a bcrypt hash, never plain text.
CREATE TABLE `USER` (
  UserID        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  RoleID        TINYINT UNSIGNED NOT NULL,
  Username      VARCHAR(100) NOT NULL,
  PasswordHash  VARCHAR(255) NOT NULL,
  Name          VARCHAR(100) NOT NULL,
  Email         VARCHAR(150) NOT NULL,
  PhoneNo       VARCHAR(20)  NULL,
  AccountStatus ENUM('Pending','Active','Suspended') NOT NULL DEFAULT 'Pending',
  CreatedAt     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  LastLoginAt   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (UserID),
  UNIQUE KEY uq_user_username (Username),
  UNIQUE KEY uq_user_email (Email),
  KEY idx_user_role_status (RoleID, AccountStatus),
  CONSTRAINT fk_user_role FOREIGN KEY (RoleID) REFERENCES ROLE (RoleID)
) ENGINE=InnoDB;

CREATE TABLE PASSWORD_RESET (
  ResetID    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID     INT UNSIGNED NOT NULL,
  TokenHash  CHAR(64) NOT NULL,            -- SHA-256 of the emailed token
  ExpiresAt  DATETIME NOT NULL,
  UsedAt     DATETIME NULL,
  CreatedAt  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ResetID),
  UNIQUE KEY uq_reset_token (TokenHash),
  CONSTRAINT fk_reset_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- One row per user; Settings holds the notification toggles (JSON).
CREATE TABLE USER_SETTINGS (
  UserID    INT UNSIGNED NOT NULL,
  Settings  JSON NOT NULL,
  UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (UserID),
  CONSTRAINT fk_settings_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Departments and programmes
-- ---------------------------------------------------------------------
-- DepartmentType lets staff belong to administrative units
-- (Alumni Relations, Registrar's Office ...) as well as academic ones.
CREATE TABLE DEPARTMENT (
  DepartmentID   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  DepartmentName VARCHAR(100) NOT NULL,
  DepartmentType ENUM('Academic','Administrative') NOT NULL DEFAULT 'Academic',
  PRIMARY KEY (DepartmentID),
  UNIQUE KEY uq_department_name (DepartmentName)
) ENGINE=InnoDB;

CREATE TABLE PROGRAMME (
  ProgrammeID    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  DepartmentID   SMALLINT UNSIGNED NOT NULL,
  ProgrammeName  VARCHAR(120) NOT NULL,
  PRIMARY KEY (ProgrammeID),
  UNIQUE KEY uq_programme_name (ProgrammeName),
  CONSTRAINT fk_programme_department FOREIGN KEY (DepartmentID) REFERENCES DEPARTMENT (DepartmentID)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Profiles (one per role)
-- ---------------------------------------------------------------------
-- StudentID is the college-issued ID (e.g. 02210045).
-- Projects / TechnicalSkills / SoftSkills / Interests / Languages are JSON arrays.
CREATE TABLE STUDENT (
  StudentID        VARCHAR(20) NOT NULL,
  UserID           INT UNSIGNED NOT NULL,
  ProgrammeID      SMALLINT UNSIGNED NOT NULL,
  YearOfJoining    SMALLINT UNSIGNED NOT NULL,
  Dzongkhag        VARCHAR(50) NULL,
  Gewog            VARCHAR(50) NULL,
  Projects         JSON NULL,
  TechnicalSkills  JSON NULL,
  SoftSkills       JSON NULL,
  Photo            VARCHAR(255) NULL,
  About            TEXT NULL,
  Location         VARCHAR(100) NULL,
  Interests        JSON NULL,
  Languages        JSON NULL,
  Motto            VARCHAR(200) NULL,
  GitHub           VARCHAR(200) NULL,
  LinkedIn         VARCHAR(200) NULL,
  Website          VARCHAR(200) NULL,
  ShowEmail        BOOLEAN NOT NULL DEFAULT TRUE,
  ShowPhone        BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (StudentID),
  UNIQUE KEY uq_student_user (UserID),
  KEY idx_student_programme (ProgrammeID),
  CONSTRAINT fk_student_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE,
  CONSTRAINT fk_student_programme FOREIGN KEY (ProgrammeID) REFERENCES PROGRAMME (ProgrammeID)
) ENGINE=InnoDB;

CREATE TABLE STAFF (
  StaffID         VARCHAR(20) NOT NULL,
  UserID          INT UNSIGNED NOT NULL,
  DepartmentID    SMALLINT UNSIGNED NULL,
  Qualifications  VARCHAR(255) NULL,
  Designation     VARCHAR(100) NULL,
  AreaOfExpertise VARCHAR(255) NULL,
  PRIMARY KEY (StaffID),
  UNIQUE KEY uq_staff_user (UserID),
  CONSTRAINT fk_staff_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE,
  CONSTRAINT fk_staff_department FOREIGN KEY (DepartmentID) REFERENCES DEPARTMENT (DepartmentID)
) ENGINE=InnoDB;

-- Alumni accounts start as 'Pending' in USER.AccountStatus until staff
-- approve their VERIFICATION_REQUEST.
CREATE TABLE ALUMNI (
  AlumniID                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID                   INT UNSIGNED NOT NULL,
  ProgrammeID              SMALLINT UNSIGNED NOT NULL,
  GraduationYear           SMALLINT UNSIGNED NOT NULL,
  ProfessionalBackground   TEXT NULL,
  AreaOfExpertise          VARCHAR(255) NULL,
  CurrentDesignation       VARCHAR(100) NULL,
  Location                 VARCHAR(100) NULL,
  LinkedIn                 VARCHAR(200) NULL,
  GitHub                   VARCHAR(200) NULL,
  Website                  VARCHAR(200) NULL,
  IsAvailableForMentorship BOOLEAN NOT NULL DEFAULT FALSE,
  IsProfilePublic          BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (AlumniID),
  UNIQUE KEY uq_alumni_user (UserID),
  KEY idx_alumni_programme_year (ProgrammeID, GraduationYear),
  CONSTRAINT fk_alumni_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE,
  CONSTRAINT fk_alumni_programme FOREIGN KEY (ProgrammeID) REFERENCES PROGRAMME (ProgrammeID)
) ENGINE=InnoDB;

CREATE TABLE VERIFICATION_REQUEST (
  VerificationID    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  AlumniID          INT UNSIGNED NOT NULL,
  ProofDocumentPath VARCHAR(255) NOT NULL,
  SubmittedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status            ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  RejectionReason   VARCHAR(500) NULL,
  ReviewedBy        INT UNSIGNED NULL,       -- staff USER
  ReviewedAt        DATETIME NULL,
  PRIMARY KEY (VerificationID),
  KEY idx_verification_status (Status, SubmittedAt),
  CONSTRAINT fk_verification_alumni FOREIGN KEY (AlumniID) REFERENCES ALUMNI (AlumniID) ON DELETE CASCADE,
  CONSTRAINT fk_verification_reviewer FOREIGN KEY (ReviewedBy) REFERENCES `USER` (UserID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Alumni profile details
-- ---------------------------------------------------------------------
-- EndDate NULL = current position.
CREATE TABLE CAREER_HISTORY (
  CareerID     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  AlumniID     INT UNSIGNED NOT NULL,
  Organization VARCHAR(150) NOT NULL,
  Position     VARCHAR(100) NOT NULL,
  StartDate    DATE NOT NULL,
  EndDate      DATE NULL,
  PRIMARY KEY (CareerID),
  KEY idx_career_alumni (AlumniID, StartDate),
  CONSTRAINT fk_career_alumni FOREIGN KEY (AlumniID) REFERENCES ALUMNI (AlumniID) ON DELETE CASCADE,
  CONSTRAINT chk_career_dates CHECK (EndDate IS NULL OR EndDate >= StartDate)
) ENGINE=InnoDB;

CREATE TABLE PUBLICATION (
  PublicationID   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  AlumniID        INT UNSIGNED NOT NULL,
  Title           VARCHAR(255) NOT NULL,
  PublicationType VARCHAR(50)  NOT NULL,
  PublicationDate DATE NULL,
  PRIMARY KEY (PublicationID),
  KEY idx_publication_alumni (AlumniID),
  CONSTRAINT fk_publication_alumni FOREIGN KEY (AlumniID) REFERENCES ALUMNI (AlumniID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE PROJECT (
  ProjectID     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  AlumniID      INT UNSIGNED NOT NULL,
  Title         VARCHAR(255) NOT NULL,
  Description   TEXT NULL,
  StartDate     DATE NULL,
  EndDate       DATE NULL,
  FundingAgency VARCHAR(150) NULL,
  PRIMARY KEY (ProjectID),
  KEY idx_project_alumni (AlumniID),
  CONSTRAINT fk_project_alumni FOREIGN KEY (AlumniID) REFERENCES ALUMNI (AlumniID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Initiatives and contributions
-- ---------------------------------------------------------------------
CREATE TABLE INITIATIVE (
  InitiativeID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Title        VARCHAR(150) NOT NULL,
  Description  TEXT NULL,
  Goal         VARCHAR(255) NULL,
  Icon         VARCHAR(50) NULL,
  StartDate    DATE NULL,
  EndDate      DATE NULL,
  IsActive     BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedBy    INT UNSIGNED NULL,
  CreatedAt    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (InitiativeID),
  CONSTRAINT fk_initiative_creator FOREIGN KEY (CreatedBy) REFERENCES `USER` (UserID) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE INITIATIVE_PARTICIPANT (
  UserID       INT UNSIGNED NOT NULL,
  InitiativeID INT UNSIGNED NOT NULL,
  JoinedAt     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserID, InitiativeID),
  CONSTRAINT fk_ip_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE,
  CONSTRAINT fk_ip_initiative FOREIGN KEY (InitiativeID) REFERENCES INITIATIVE (InitiativeID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Alumni donors have AlumniID set. Organisations and anonymous donors
-- (recorded by admin) have AlumniID NULL and use DonorName / DonorEmail.
CREATE TABLE CONTRIBUTION (
  ContributionID   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  AlumniID         INT UNSIGNED NULL,
  DonorName        VARCHAR(150) NOT NULL,
  DonorType        ENUM('Alumni','Organization','Anonymous') NOT NULL DEFAULT 'Alumni',
  DonorEmail       VARCHAR(150) NULL,
  Batch            VARCHAR(20) NULL,
  CategoryType     VARCHAR(60) NOT NULL,
  Description      TEXT NULL,
  Value            DECIMAL(12,2) NULL,         -- Nu., optional
  ContributionDate DATE NOT NULL,
  Status           ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  RejectionReason  VARCHAR(500) NULL,
  Note             VARCHAR(500) NULL,
  InitiativeID     INT UNSIGNED NULL,
  VerifiedBy       INT UNSIGNED NULL,
  VerifiedAt       DATETIME NULL,
  PRIMARY KEY (ContributionID),
  KEY idx_contribution_status (Status, ContributionDate),
  CONSTRAINT fk_contribution_alumni FOREIGN KEY (AlumniID) REFERENCES ALUMNI (AlumniID),
  CONSTRAINT fk_contribution_initiative FOREIGN KEY (InitiativeID) REFERENCES INITIATIVE (InitiativeID),
  CONSTRAINT fk_contribution_verifier FOREIGN KEY (VerifiedBy) REFERENCES `USER` (UserID),
  CONSTRAINT chk_contribution_alumni CHECK (DonorType <> 'Alumni' OR AlumniID IS NOT NULL)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. Mentorship
-- ---------------------------------------------------------------------
-- A student requests mentorship from an alumnus. The student form sends
-- AreaOfInterest + a message (RequestDetail); Duration is optional.
CREATE TABLE MENTORSHIP_REQUEST (
  RequestID       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  StudentID       VARCHAR(20) NOT NULL,
  AlumniID        INT UNSIGNED NOT NULL,
  AreaOfInterest  VARCHAR(100) NULL,
  RequestSubject  VARCHAR(150) NOT NULL,
  RequestDetail   TEXT NULL,
  Duration        VARCHAR(50) NULL,
  RequestDate     DATE NOT NULL DEFAULT (CURRENT_DATE),
  Status          ENUM('Pending','Accepted','Declined','Cancelled') NOT NULL DEFAULT 'Pending',
  ResponseNote    VARCHAR(500) NULL,
  RespondedAt     DATETIME NULL,
  PRIMARY KEY (RequestID),
  KEY idx_mentorship_alumni_status (AlumniID, Status),
  KEY idx_mentorship_student (StudentID),
  CONSTRAINT fk_mentorship_student FOREIGN KEY (StudentID) REFERENCES STUDENT (StudentID) ON DELETE CASCADE,
  CONSTRAINT fk_mentorship_alumni FOREIGN KEY (AlumniID) REFERENCES ALUMNI (AlumniID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. Opportunities and applications
-- ---------------------------------------------------------------------
-- Alumni-posted opportunities start as 'Pending' and need admin approval.
-- Staff and admin postings can go straight to 'Approved'. Students only
-- see 'Approved' rows.
CREATE TABLE OPPORTUNITY (
  OpportunityID           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  CreatorID               INT UNSIGNED NOT NULL,
  Title                   VARCHAR(150) NOT NULL,
  OpportunityType         VARCHAR(30)  NOT NULL DEFAULT 'Internship',
  Organization            VARCHAR(150) NOT NULL,
  Location                VARCHAR(100) NULL,
  WorkType                ENUM('On-site','Remote','Hybrid') NULL,
  Category                VARCHAR(60) NULL,
  Description             TEXT NULL,
  Deadline                DATE NULL,
  StartDate               DATE NULL,
  Duration                VARCHAR(50) NULL,
  EligibilityRequirements TEXT NULL,
  Status                  ENUM('Draft','Pending','Approved','Rejected','Closed','Cancelled') NOT NULL DEFAULT 'Pending',
  RejectionReason         VARCHAR(500) NULL,
  PostedAt                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (OpportunityID),
  KEY idx_opportunity_status_deadline (Status, Deadline),
  KEY idx_opportunity_creator (CreatorID),
  CONSTRAINT fk_opportunity_creator FOREIGN KEY (CreatorID) REFERENCES `USER` (UserID)
) ENGINE=InnoDB;

CREATE TABLE APPLICATION (
  ApplicationID     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  StudentID         VARCHAR(20) NOT NULL,
  OpportunityID     INT UNSIGNED NOT NULL,
  SubmissionDate    DATE NOT NULL DEFAULT (CURRENT_DATE),
  ApplicationStatus ENUM('Submitted','UnderReview','Shortlisted','Accepted','Rejected','Withdrawn')
                    NOT NULL DEFAULT 'Submitted',
  PRIMARY KEY (ApplicationID),
  UNIQUE KEY uq_application_student_opportunity (StudentID, OpportunityID),
  KEY idx_application_opportunity_status (OpportunityID, ApplicationStatus),
  CONSTRAINT fk_application_student FOREIGN KEY (StudentID) REFERENCES STUDENT (StudentID) ON DELETE CASCADE,
  CONSTRAINT fk_application_opportunity FOREIGN KEY (OpportunityID) REFERENCES OPPORTUNITY (OpportunityID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE SAVED_OPPORTUNITY (
  StudentID     VARCHAR(20) NOT NULL,
  OpportunityID INT UNSIGNED NOT NULL,
  SavedAt       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (StudentID, OpportunityID),
  CONSTRAINT fk_saved_student FOREIGN KEY (StudentID) REFERENCES STUDENT (StudentID) ON DELETE CASCADE,
  CONSTRAINT fk_saved_opportunity FOREIGN KEY (OpportunityID) REFERENCES OPPORTUNITY (OpportunityID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. Events
-- ---------------------------------------------------------------------
-- Status: lifecycle (Published / Cancelled / Completed).
-- ApprovalStatus: admin approval for alumni-created events; staff events are 'Approved'.
-- "Upcoming / Ongoing / Past" shown to students is derived from EventDate + Duration.
CREATE TABLE EVENT (
  EventID              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  CreatorID            INT UNSIGNED NOT NULL,
  Title                VARCHAR(150) NOT NULL,
  Description          TEXT NULL,
  EventDate            DATETIME NOT NULL,
  Duration             VARCHAR(50) NULL,
  Venue                VARCHAR(150) NULL,
  Organizer            VARCHAR(150) NULL,
  ExpectedParticipants INT UNSIGNED NULL,
  Categories           JSON NULL,
  Status               ENUM('Published','Cancelled','Completed') NOT NULL DEFAULT 'Published',
  ApprovalStatus       ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Approved',
  CreatedAt            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (EventID),
  KEY idx_event_date (EventDate),
  KEY idx_event_status (Status, ApprovalStatus),
  CONSTRAINT fk_event_creator FOREIGN KEY (CreatorID) REFERENCES `USER` (UserID)
) ENGINE=InnoDB;

CREATE TABLE EVENT_REGISTRATION (
  RegistrationID   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID           INT UNSIGNED NOT NULL,
  EventID          INT UNSIGNED NOT NULL,
  RegistrationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (RegistrationID),
  UNIQUE KEY uq_registration_user_event (UserID, EventID),
  CONSTRAINT fk_registration_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE,
  CONSTRAINT fk_registration_event FOREIGN KEY (EventID) REFERENCES EVENT (EventID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. Communication
-- ---------------------------------------------------------------------
CREATE TABLE NOTIFICATION (
  NotificationID   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserID           INT UNSIGNED NOT NULL,
  NotificationType VARCHAR(40) NOT NULL,
  Title            VARCHAR(150) NULL,
  Message          VARCHAR(500) NOT NULL,
  Link             VARCHAR(200) NULL,
  CreatedAt        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsRead           BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (NotificationID),
  KEY idx_notification_user (UserID, IsRead, CreatedAt),
  CONSTRAINT fk_notification_user FOREIGN KEY (UserID) REFERENCES `USER` (UserID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ANNOUNCEMENT (
  AnnouncementID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  CreatedBy      INT UNSIGNED NOT NULL,
  Title          VARCHAR(150) NOT NULL,
  Message        TEXT NOT NULL,
  Audience       ENUM('Everyone','Students','Alumni','Staff') NOT NULL DEFAULT 'Everyone',
  CreatedAt      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (AnnouncementID),
  KEY idx_announcement_created (CreatedAt),
  CONSTRAINT fk_announcement_creator FOREIGN KEY (CreatedBy) REFERENCES `USER` (UserID)
) ENGINE=InnoDB;

-- Alumni propose a collaboration to the college; staff review it.
-- (Column list is a first draft: adjust it to match the collaboration page.)
CREATE TABLE COLLABORATION_REQUEST (
  CollaborationID   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  AlumniID          INT UNSIGNED NOT NULL,
  Title             VARCHAR(150) NOT NULL,
  CollaborationType VARCHAR(60) NULL,
  Description       TEXT NULL,
  ProposedDate      DATE NULL,
  Status            ENUM('Pending','Accepted','Declined') NOT NULL DEFAULT 'Pending',
  ResponseNote      VARCHAR(500) NULL,
  ReviewedBy        INT UNSIGNED NULL,
  CreatedAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CollaborationID),
  CONSTRAINT fk_collab_alumni FOREIGN KEY (AlumniID) REFERENCES ALUMNI (AlumniID) ON DELETE CASCADE,
  CONSTRAINT fk_collab_reviewer FOREIGN KEY (ReviewedBy) REFERENCES `USER` (UserID) ON DELETE SET NULL
) ENGINE=InnoDB;
