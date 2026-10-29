-- =====================================================================
--  CST Alumni Portal  -  Sample data (run AFTER schema.sql)
--  Based on the sample records in the frontend (store.js, adminData.js,
--  students.js). For development and demos only.
--
--  Every account uses the demo password:   Password@123
--  (stored as a bcrypt hash)
--
--  Demo logins
--    Admin    username: admin            (tashi.wangdi@cst.edu.bt)
--    Staff    username: ST002            (Dechen Pelden, Alumni Relations)
--    Student  username: 02210045         (Pema Choden)
--    Alumni   username: sonam.dorji@drukconnect.bt  (Sonam Dorji)
-- =====================================================================
USE cst_alumni_portal;

SET @pw = '$2b$10$Hi4hTn8zXDRk99KMH6dwney/w2ucMlqZAdMkPkJhSC0bINveg2Any';

-- ---------------------------------------------------------------------
-- Roles, departments, programmes
-- ---------------------------------------------------------------------
INSERT INTO ROLE (RoleID, RoleName) VALUES
  (1,'Student'), (2,'Alumni'), (3,'Staff'), (4,'Admin');

INSERT INTO DEPARTMENT (DepartmentID, DepartmentName, DepartmentType) VALUES
  (1,'Information Technology','Academic'),
  (2,'Computer Science','Academic'),
  (3,'Civil Engineering','Academic'),
  (4,'Electrical Engineering','Academic'),
  (5,'Electronics & Communication','Academic'),
  (6,'Architecture','Academic'),
  (7,'Software Engineering','Academic'),
  (8,'Alumni Relations','Administrative'),
  (9,'Registrar''s Office','Administrative'),
  (10,'Student Affairs','Administrative'),
  (11,'IT Services','Administrative');

INSERT INTO PROGRAMME (ProgrammeID, DepartmentID, ProgrammeName) VALUES
  (1,1,'B.E. in Information Technology'),
  (2,2,'B.E. in Computer Science'),
  (3,3,'B.E. in Civil Engineering'),
  (4,4,'B.E. in Electrical Engineering'),
  (5,5,'B.E. in Electronics & Communication'),
  (6,6,'B.Arch. in Architecture'),
  (7,7,'B.E. in Software Engineering');

-- ---------------------------------------------------------------------
-- Users   1 admin | 2-3 staff | 4-9 students | 10-21 alumni
-- ---------------------------------------------------------------------
INSERT INTO `USER` (UserID, RoleID, Username, PasswordHash, Name, Email, PhoneNo, AccountStatus, CreatedAt) VALUES
  (1, 4,'admin',        @pw,'Tashi Wangdi',  'tashi.wangdi@cst.edu.bt',  '17100001','Active','2024-01-10 09:00:00'),
  (2, 3,'ST002',        @pw,'Dechen Pelden', 'dechen.pelden@cst.edu.bt', '17100002','Active','2024-02-02 09:00:00'),
  (3, 3,'ST003',        @pw,'Pema Dema',     'pema.dema@cst.edu.bt',     '17100003','Active','2025-11-04 09:00:00'),
  (4, 1,'02210045',     @pw,'Pema Choden',   'pema.choden@cst.edu.bt',   '17200001','Active','2026-08-05 10:00:00'),
  (5, 1,'02210112',     @pw,'Tenzin Wangmo', 'tenzin.wangmo@cst.edu.bt', '17200002','Active','2026-08-06 10:00:00'),
  (6, 1,'02200078',     @pw,'Karma Jamtsho', 'karma.jamtsho@cst.edu.bt', '17200003','Active','2026-08-09 10:00:00'),
  (7, 1,'02210201',     @pw,'Dechen Yangzom','dechen.yangzom@cst.edu.bt','17200004','Active','2026-08-10 10:00:00'),
  (8, 1,'02210150',     @pw,'Sonam Pelden',  'sonam.pelden@cst.edu.bt',  '17200005','Suspended','2026-08-12 10:00:00'),
  (9, 1,'02200033',     @pw,'Ugyen Tshering','ugyen.tshering@cst.edu.bt','17200006','Active','2026-08-15 10:00:00'),
  (10,2,'sonam.dorji@drukconnect.bt',  @pw,'Sonam Dorji',   'sonam.dorji@drukconnect.bt',  '17123456','Active','2025-02-01 10:00:00'),
  (11,2,'test.alumni@example.com',     @pw,'Test Alumni',   'test.alumni@example.com',     '17300001','Active','2025-02-15 10:00:00'),
  (12,2,'sonam.choki@example.com',     @pw,'Sonam Choki',   'sonam.choki@example.com',     '17300002','Active','2025-06-02 10:00:00'),
  (13,2,'ugyen.dorji@example.com',     @pw,'Ugyen Dorji',   'ugyen.dorji@example.com',     '17300003','Active','2025-04-11 10:00:00'),
  (14,2,'kinley.zangmo@example.com',   @pw,'Kinley Zangmo', 'kinley.zangmo@example.com',   '17300004','Active','2025-07-19 10:00:00'),
  (15,2,'tenzin.rabgay@example.com',   @pw,'Tenzin Rabgay', 'tenzin.rabgay@example.com',   '17300005','Active','2025-08-01 10:00:00'),
  (16,2,'tandin.dorji@example.com',    @pw,'Tandin Dorji',  'tandin.dorji@example.com',    '17300006','Active','2025-03-14 10:00:00'),
  (17,2,'chimi.dema@example.com',      @pw,'Chimi Dema',    'chimi.dema@example.com',      '17300007','Active','2025-03-20 10:00:00'),
  (18,2,'karma.wangchuk@example.com',  @pw,'Karma Wangchuk','karma.wangchuk@example.com',  '17300008','Pending','2026-10-18 10:00:00'),
  (19,2,'tashi.lhamo@example.com',     @pw,'Tashi Lhamo',   'tashi.lhamo@example.com',     '17300009','Pending','2026-10-17 10:00:00'),
  (20,2,'jigme.namgyel@example.com',   @pw,'Jigme Namgyel', 'jigme.namgyel@example.com',   '17300010','Pending','2026-10-14 10:00:00'),
  (21,2,'dorji.wangmo@example.com',    @pw,'Dorji Wangmo',  'dorji.wangmo@example.com',    '17300011','Pending','2026-10-02 10:00:00');

-- ---------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------
INSERT INTO STAFF (StaffID, UserID, DepartmentID, Qualifications, Designation, AreaOfExpertise) VALUES
  ('ST002', 2, 8, 'MBA', 'Alumni Relations Officer', 'Alumni engagement'),
  ('ST003', 3, 9, 'B.Com',  'Registrar''s Assistant', 'Student records');

-- ---------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------
INSERT INTO STUDENT (StudentID, UserID, ProgrammeID, YearOfJoining, Dzongkhag, Gewog,
                     Projects, TechnicalSkills, SoftSkills, About, Location, Interests, Languages, Motto, GitHub) VALUES
  ('02210045', 4, 1, 2021, 'Thimphu', 'Chang',
   '[{"title":"Campus Event Finder","description":"Mobile-friendly site listing college events with reminders.","tech":["React","Firebase"],"link":"github.com/pema-choden/event-finder"},{"title":"Library Book Tracker","description":"Tracks borrowed books and due dates for the CST library.","tech":["HTML","CSS","JavaScript"],"link":""}]',
   '["JavaScript","React","HTML/CSS","Git"]', '["Teamwork","Communication","Time management"]',
   'Third-year IT student who enjoys building small web tools for campus life.', 'Phuntsholing',
   '["Web development","UI design"]', '["Dzongkha","English"]', 'Learn something new every day.', 'github.com/pema-choden'),
  ('02210112', 5, 1, 2021, 'Paro', 'Doteng',
   '[{"title":"Student Attendance System","description":"QR-code based attendance with a simple admin dashboard.","tech":["Node.js","MySQL"],"link":"github.com/tenzin-wangmo/attendance"}]',
   '["Node.js","MySQL","Python","REST APIs"]', '["Problem solving","Presentation","Leadership"]',
   NULL, 'Phuntsholing', '["Backend development"]', '["Dzongkha","English"]', NULL, 'github.com/tenzin-wangmo'),
  ('02200078', 6, 2, 2020, 'Punakha', 'Toedwang',
   '[{"title":"Cloud File Backup Tool","description":"Command-line tool that backs up folders to cloud storage.","tech":["Python","AWS S3"],"link":"github.com/karma-jamtsho/cloud-backup"},{"title":"Network Monitoring Dashboard","description":"Shows live status of lab computers on the campus network.","tech":["Python","Flask"],"link":""}]',
   '["Python","AWS","Linux","Networking"]', '["Adaptability","Self-learning","Teamwork"]',
   NULL, 'Phuntsholing', '["Cloud computing"]', '["Dzongkha","English"]', NULL, 'github.com/karma-jamtsho'),
  ('02210201', 7, 1, 2021, 'Wangdue Phodrang', 'Bjena',
   '[{"title":"Farmers'' Market Price App","description":"Lets farmers check daily vegetable prices in Thimphu.","tech":["React Native"],"link":""}]',
   '["React Native","JavaScript","UI design"]', '["Creativity","Communication"]',
   NULL, 'Phuntsholing', '["Mobile apps"]', '["Dzongkha","English"]', NULL, NULL),
  ('02210150', 8, 1, 2021, 'Trashigang', 'Bartsham',
   '[{"title":"Portfolio Website Builder","description":"Template-based site builder for student portfolios.","tech":["Next.js","Tailwind CSS"],"link":"github.com/sonam-pelden/portfolio-builder"},{"title":"Weather Dashboard","description":"Weather and rainfall charts for Bhutanese dzongkhags.","tech":["React","Chart.js"],"link":""}]',
   '["Next.js","React","Tailwind CSS","Git"]', '["Creativity","Teamwork","Attention to detail"]',
   NULL, 'Phuntsholing', '["Front-end development"]', '["Dzongkha","English"]', NULL, 'github.com/sonam-pelden'),
  ('02200033', 9, 2, 2020, 'Chukha', 'Bongo',
   '[{"title":"Inventory Management System","description":"Stock tracking for a small shop with sales reports.","tech":["Java","MySQL"],"link":""}]',
   '["Java","MySQL","Spring Boot"]', '["Responsibility","Communication","Problem solving"]',
   NULL, 'Phuntsholing', '["Enterprise software"]', '["Dzongkha","English"]', NULL, NULL);

-- ---------------------------------------------------------------------
-- Alumni   (AlumniID 1-12 follow UserID 10-21)
-- ---------------------------------------------------------------------
INSERT INTO ALUMNI (AlumniID, UserID, ProgrammeID, GraduationYear, ProfessionalBackground, AreaOfExpertise,
                    CurrentDesignation, Location, LinkedIn, GitHub, Website, IsAvailableForMentorship, IsProfilePublic) VALUES
  (1, 10, 1, 2021, 'Passionate software engineer and lifelong learner. Grateful to CST for the foundation and opportunities. Committed to giving back to the college community.',
      'Web Development, Cloud Computing, Mentoring', 'Software Engineer', 'Thimphu, Bhutan',
      'linkedin.com/in/sonam-dorji', 'github.com/sonam-dorji', NULL, TRUE, TRUE),
  (2, 11, 7, 2024, 'Happy to guide students.', 'Web Development', 'Developer', 'Thimphu', NULL, NULL, NULL, TRUE, TRUE),
  (3, 12, 5, 2018, NULL, 'Networking', 'Network Engineer', 'Thimphu', NULL, NULL, NULL, FALSE, TRUE),
  (4, 13, 4, 2020, NULL, 'Power systems', 'Electrical Engineer', 'Phuntsholing', NULL, NULL, NULL, TRUE, TRUE),
  (5, 14, 6, 2021, NULL, 'Sustainable design', 'Architect', 'Thimphu', NULL, NULL, NULL, FALSE, TRUE),
  (6, 15, 1, 2022, NULL, 'Data analysis', 'Data Analyst', 'Thimphu', NULL, NULL, NULL, TRUE, TRUE),
  (7, 16, 3, 2021, 'Glad to talk about site work and design.', 'Structural design', 'Structural Engineer', 'Paro', NULL, NULL, NULL, TRUE, TRUE),
  (8, 17, 4, 2019, NULL, 'Power systems', 'Power Systems Engineer', 'Thimphu', NULL, NULL, NULL, FALSE, TRUE),
  (9, 18, 3, 2021, NULL, NULL, 'Site Engineer', NULL, NULL, NULL, NULL, FALSE, TRUE),
  (10,19, 4, 2019, NULL, NULL, 'Power Systems Engineer', NULL, NULL, NULL, NULL, FALSE, TRUE),
  (11,20, 2, 2023, NULL, NULL, 'Software Developer', NULL, NULL, NULL, NULL, FALSE, TRUE),
  (12,21, 3, 2022, NULL, NULL, 'Surveyor', NULL, NULL, NULL, NULL, FALSE, TRUE);

INSERT INTO VERIFICATION_REQUEST (AlumniID, ProofDocumentPath, SubmittedAt, Status, RejectionReason, ReviewedBy, ReviewedAt) VALUES
  (9,  'uploads/proofs/degree-certificate-karma.pdf',  '2026-10-18 10:00:00', 'Pending',  NULL, NULL, NULL),
  (10, 'uploads/proofs/graduation-letter-tashi.pdf',   '2026-10-17 10:00:00', 'Pending',  NULL, NULL, NULL),
  (11, 'uploads/proofs/transcript-jigme.pdf',          '2026-10-14 10:00:00', 'Pending',  NULL, NULL, NULL),
  (3,  'uploads/proofs/degree-sonam.pdf',              '2026-10-05 10:00:00', 'Approved', NULL, 2, '2026-10-06 09:30:00'),
  (12, 'uploads/proofs/photo-id.jpg',                  '2026-10-02 10:00:00', 'Rejected',
       'The document does not match the alumni registry. Please upload your graduation certificate.', 2, '2026-10-03 11:00:00');

INSERT INTO CAREER_HISTORY (AlumniID, Organization, Position, StartDate, EndDate) VALUES
  (1,'DrukConnect','Software Engineer','2025-01-06',NULL),
  (1,'Bhutan Telecom','Junior Developer','2023-02-01','2024-12-31'),
  (1,'Druk Green Power Corporation','IT Intern','2021-07-01','2022-01-31'),
  (2,'ABC Tech','Developer','2024-09-01',NULL),
  (3,'Himal Telecom','Network Engineer','2018-08-01',NULL),
  (4,'PowerGrid Bhutan','Electrical Engineer','2020-08-01',NULL),
  (5,'Studio Dzong','Architect','2021-09-01',NULL),
  (6,'DataBridge','Data Analyst','2022-09-01',NULL),
  (7,'Druk Builders','Structural Engineer','2017-09-01',NULL),
  (8,'Bhutan Power Corporation','Power Systems Engineer','2019-09-01',NULL);

INSERT INTO PUBLICATION (AlumniID, Title, PublicationType, PublicationDate) VALUES
  (1,'Adoption of Digital Records in Bhutanese Public Offices','Journal Article','2023-05-12');

INSERT INTO PROJECT (AlumniID, Title, Description, StartDate, EndDate, FundingAgency) VALUES
  (1,'Hydropower Plant Monitoring Dashboard','Real-time dashboard for plant output and maintenance alerts.','2022-03-01','2023-01-31','Druk Green Power Corporation');

-- ---------------------------------------------------------------------
-- Initiatives and contributions
-- ---------------------------------------------------------------------
INSERT INTO INITIATIVE (InitiativeID, Title, Description, Goal, Icon, StartDate, EndDate, IsActive, CreatedBy) VALUES
  (1,'Scholarship Fund','Support for students who need financial help to complete their studies.','Raise Nu. 500,000','GraduationCap','2026-09-01','2026-12-31',TRUE,2),
  (2,'Computer Lab Upgrade','Replace ageing lab computers with new equipment.','Collect 30 computers','Monitor','2026-09-15','2027-01-31',TRUE,2),
  (3,'Alumni Guest Lecture Series','Alumni share industry experience with students each month.','12 lectures this year','Mic','2026-08-01','2027-06-30',TRUE,2);

INSERT INTO INITIATIVE_PARTICIPANT (UserID, InitiativeID, JoinedAt) VALUES
  (4,3,'2026-10-01 10:00:00'),
  (5,3,'2026-10-02 10:00:00'),
  (10,1,'2026-09-10 10:00:00'),
  (10,3,'2026-09-12 10:00:00');

INSERT INTO CONTRIBUTION (ContributionID, AlumniID, DonorName, DonorType, DonorEmail, Batch, CategoryType, Description,
                          Value, ContributionDate, Status, RejectionReason, Note, InitiativeID, VerifiedBy, VerifiedAt) VALUES
  (1, 1,    'Sonam Dorji',              'Alumni',       'sonam.dorji@drukconnect.bt', '2021', 'Financial Support',     'Contribution to the scholarship fund', 20000.00, '2026-10-08', 'Verified', NULL, NULL, 1, 2, '2026-10-09 10:00:00'),
  (2, NULL, 'Bhutan Power Corporation', 'Organization', 'csr@bpc.bt',                 NULL,   'Equipment & Resources', 'Laptops (5 units)',                    75000.00, '2026-10-12', 'Pending',  NULL, NULL, 2, NULL, NULL),
  (3, 3,    'Sonam Choki',              'Alumni',       'sonam.choki@example.com',    '2018', 'Guest Lecture',         'Talk on networking careers for 3rd-year students', NULL, '2026-10-03', 'Verified', NULL, NULL, 3, 2, '2026-10-04 10:00:00'),
  (4, NULL, 'Anonymous',                'Anonymous',    NULL,                         NULL,   'Financial Support',     'Donation received at Homecoming desk',  10000.00, '2026-10-15', 'Pending',  NULL, NULL, 1, NULL, NULL),
  (5, 4,    'Ugyen Dorji',              'Alumni',       'ugyen.dorji@example.com',    '2020', 'Equipment Donation',    'Used lab equipment for the electrical workshop', 15000.00, '2026-09-28', 'Rejected', 'Equipment does not meet the safety requirements of the workshop.', NULL, NULL, 2, '2026-09-30 10:00:00');

-- ---------------------------------------------------------------------
-- Mentorship requests
-- ---------------------------------------------------------------------
INSERT INTO MENTORSHIP_REQUEST (StudentID, AlumniID, AreaOfInterest, RequestSubject, RequestDetail, Duration, RequestDate, Status, ResponseNote, RespondedAt) VALUES
  ('02210045', 1, 'Web Development', 'Guidance on building a portfolio', 'I would like advice on which projects to show employers before graduation.', '3 months', '2026-10-10', 'Pending', NULL, NULL),
  ('02210112', 1, 'Backend Development', 'Preparing for backend internships', 'Could you review my attendance system project and suggest improvements?', NULL, '2026-10-05', 'Accepted', 'Happy to help. Let us start with a call next week.', '2026-10-06 09:00:00'),
  ('02200078', 6, 'Data Analysis', 'Moving into data roles', 'I am interested in a data career and would like to know what skills to focus on.', '2 months', '2026-10-01', 'Declined', 'Sorry, I am fully booked this term.', '2026-10-02 12:00:00'),
  ('02210201', 2, 'Mobile Apps', 'First steps in React Native', 'I have built one app and want to learn good practices.', NULL, '2026-10-12', 'Pending', NULL, NULL);

-- ---------------------------------------------------------------------
-- Opportunities and applications
-- ---------------------------------------------------------------------
INSERT INTO OPPORTUNITY (OpportunityID, CreatorID, Title, OpportunityType, Organization, Location, WorkType, Category, Description,
                         Deadline, StartDate, Duration, EligibilityRequirements, Status, RejectionReason, PostedAt) VALUES
  (1, 10, 'Web Development Intern', 'Internship', 'Druk Green Power Corporation', 'Thimphu', 'Hybrid', 'Software & IT',
      'Work with our team on internal dashboards using React and Node.js.', '2026-11-30', '2027-01-05', '3 months',
      '3rd/4th year IT or CS students with basic JavaScript knowledge.', 'Approved', NULL, '2026-10-01 09:00:00'),
  (2, 13, 'Electrical Maintenance Trainee', 'Internship', 'PowerGrid Bhutan', 'Phuntsholing', 'On-site', 'Engineering',
      'Hands-on training with the substation maintenance team.', '2026-12-10', '2027-01-15', '6 weeks',
      'Electrical or electronics students in year 3 or above.', 'Approved', NULL, '2026-10-05 09:00:00'),
  (3, 15, 'Junior Data Analyst', 'Job', 'DataBridge', 'Thimphu', 'On-site', 'Data & Analytics',
      'Clean and visualise data for client reports.', '2026-12-31', '2027-02-01', 'Full-time',
      'Recent graduates with SQL and Excel skills.', 'Approved', NULL, '2026-10-08 09:00:00'),
  (4, 2, 'CST Library Digitisation Assistant', 'Internship', 'CST Library', 'Phuntsholing', 'On-site', 'Administration',
      'Help scan and catalogue the college archives.', '2026-11-20', '2026-12-01', '2 months',
      'Any student with good attention to detail.', 'Approved', NULL, '2026-10-10 09:00:00'),
  (5, 14, 'Architecture Studio Intern', 'Internship', 'Studio Dzong', 'Thimphu', 'On-site', 'Design',
      'Assist with drawings and site visits.', '2026-12-15', '2027-01-10', '3 months',
      'Architecture students, portfolio required.', 'Pending', NULL, '2026-10-20 09:00:00'),
  (6, 11, 'Freelance Website Project', 'Job', 'ABC Tech', 'Remote', 'Remote', 'Software & IT',
      'Short contract to build a small business website.', '2026-11-05', '2026-11-15', '1 month',
      'Portfolio of at least two web projects.', 'Rejected', 'Please describe the payment terms before this can be published.', '2026-10-18 09:00:00');

INSERT INTO APPLICATION (StudentID, OpportunityID, SubmissionDate, ApplicationStatus) VALUES
  ('02210045', 1, '2026-10-12', 'UnderReview'),
  ('02210112', 1, '2026-10-11', 'Shortlisted'),
  ('02200078', 2, '2026-10-14', 'Submitted'),
  ('02210201', 3, '2026-10-15', 'Accepted'),
  ('02200033', 4, '2026-10-16', 'Rejected'),
  ('02210045', 4, '2026-10-17', 'Withdrawn');

INSERT INTO SAVED_OPPORTUNITY (StudentID, OpportunityID) VALUES
  ('02210045', 2), ('02210045', 3), ('02210112', 3);

-- ---------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------
INSERT INTO EVENT (EventID, CreatorID, Title, Description, EventDate, Duration, Venue, Organizer, ExpectedParticipants,
                   Categories, Status, ApprovalStatus) VALUES
  (1, 2, 'Career Fair 2026', 'Meet employers and alumni from across Bhutan.', '2026-11-03 09:00:00', '1 day', 'CST Campus', 'CST Alumni Relations', 300, '["Career"]', 'Published', 'Approved'),
  (2, 2, 'Alumni Homecoming', 'Annual gathering of CST alumni with talks and dinner.', '2026-11-21 16:00:00', '4 hours', 'CST Auditorium', 'CST Alumni Relations', 200, '["Networking","Social"]', 'Published', 'Approved'),
  (3, 2, 'Tech Talk: AI in Bhutan', 'Panel discussion on the future of AI in the region.', '2026-12-05 14:00:00', '2 hours', 'Seminar Hall', 'IT Department', 120, '["Technology"]', 'Published', 'Approved'),
  (4, 2, 'Freshers'' Welcome 2026', 'Welcome event for new students.', '2026-08-20 10:00:00', '3 hours', 'CST Ground', 'Student Affairs', 250, '["Social"]', 'Completed', 'Approved'),
  (5, 10, 'Intro to Cloud Workshop', 'Hands-on session on deploying a first web app to the cloud.', '2026-12-12 10:00:00', '3 hours', 'Computer Lab 2', 'Sonam Dorji', 40, '["Technology","Workshop"]', 'Published', 'Pending');

INSERT INTO EVENT_REGISTRATION (UserID, EventID, RegistrationDate) VALUES
  (4,1,'2026-10-20 10:00:00'),
  (4,2,'2026-10-21 10:00:00'),
  (5,1,'2026-10-20 11:00:00'),
  (6,3,'2026-10-22 10:00:00'),
  (10,2,'2026-10-18 10:00:00'),
  (12,2,'2026-10-19 10:00:00'),
  (13,2,'2026-10-19 11:00:00');

-- ---------------------------------------------------------------------
-- Notifications, announcements, collaboration, settings
-- ---------------------------------------------------------------------
INSERT INTO NOTIFICATION (UserID, NotificationType, Title, Message, Link, CreatedAt, IsRead) VALUES
  (4,  'application', 'Application update',   'Your application for Web Development Intern is under review.', '/applications', '2026-10-13 09:00:00', FALSE),
  (4,  'event',       'Event reminder',       'Career Fair 2026 starts on 3 November.', '/events', '2026-10-28 09:00:00', FALSE),
  (4,  'announcement','New announcement',     'Alumni Homecoming registration is open.', '/events', '2026-10-10 08:00:00', TRUE),
  (5,  'mentorship',  'Mentorship accepted',  'Sonam Dorji accepted your mentorship request.', '/mentorship', '2026-10-06 09:00:00', FALSE),
  (10, 'mentorship',  'New mentorship request','Pema Choden sent you a mentorship request.', NULL, '2026-10-10 09:00:00', FALSE),
  (2,  'verification','New verification request','Karma Wangchuk submitted documents for verification.', NULL, '2026-10-18 10:00:00', FALSE),
  (1,  'approval',    'Opportunity awaiting approval','Studio Dzong posted a new internship for review.', NULL, '2026-10-20 09:00:00', FALSE);

INSERT INTO ANNOUNCEMENT (CreatedBy, Title, Message, Audience, CreatedAt) VALUES
  (2,'Alumni Homecoming registration is open','Alumni and students can now register for the Homecoming event from the Events page.','Everyone','2026-10-10 08:00:00'),
  (2,'Career Fair preparation tips','Update your profile and CV before the Career Fair on 3 November.','Students','2026-10-20 08:00:00');

INSERT INTO COLLABORATION_REQUEST (AlumniID, Title, CollaborationType, Description, ProposedDate, Status, ResponseNote, ReviewedBy, CreatedAt) VALUES
  (1,'Cloud Computing Workshop Series','Workshop','Monthly cloud workshops for final-year IT students.','2026-12-12','Pending',NULL,NULL,'2026-10-15 10:00:00'),
  (4,'Electrical Workshop Visit','Industry Visit','Arrange a site visit to the PowerGrid Bhutan substation.','2027-01-20','Accepted','Approved. Please coordinate dates with the department.',2,'2026-10-08 10:00:00');

INSERT INTO USER_SETTINGS (UserID, Settings) VALUES
  (4,  '{"emailNotifications":true,"eventReminders":true,"mentorshipUpdates":true}'),
  (10, '{"emailNotifications":true,"newOpportunities":true,"mentorshipRequests":true}'),
  (2,  '{"emailNotifications":true,"newVerificationRequests":true}'),
  (1,  '{"emailNotifications":true,"approvalAlerts":true}');
