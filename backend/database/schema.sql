-- Create database
CREATE DATABASE IF NOT EXISTS cst_alumni_portal;

-- Select database
USE cst_alumni_portal;


-- 1. ROLE TABLE

CREATE TABLE IF NOT EXISTS Role (
    Role_id INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);


-- Insert default roles
INSERT IGNORE INTO Role (RoleName)
VALUES
    ('Student'),
    ('Alumni'),
    ('Staff'),
    ('Administrator');


-- 2. USER TABLE

CREATE TABLE IF NOT EXISTS User (
    User_id INT AUTO_INCREMENT PRIMARY KEY,
    Role_id INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,

    FOREIGN KEY (Role_id)
        REFERENCES Role(Role_id)
);


-- 3. STUDENT PROFILE TABLE

CREATE TABLE IF NOT EXISTS Student_Profile (
    UserID INT PRIMARY KEY,
    Programme VARCHAR(100) NOT NULL,
    YearOfStudy INT NOT NULL,

    FOREIGN KEY (UserID)
        REFERENCES User(User_id)
);


-- 4. ALUMNI PROFILE TABLE

CREATE TABLE IF NOT EXISTS Alumni_Profile (
    UserID INT PRIMARY KEY,
    Programme VARCHAR(100) NOT NULL,
    GraduationYear INT NOT NULL,
    ProfessionalBackground TEXT,
    AreaOfExpertise VARCHAR(255),

    FOREIGN KEY (UserID)
        REFERENCES User(User_id)
);


-- 5. STAFF PROFILE TABLE

CREATE TABLE IF NOT EXISTS Staff_Profile (
    UserID INT PRIMARY KEY,
    Department VARCHAR(100) NOT NULL,
    Designation VARCHAR(100) NOT NULL,

    FOREIGN KEY (UserID)
        REFERENCES User(User_id)
);
