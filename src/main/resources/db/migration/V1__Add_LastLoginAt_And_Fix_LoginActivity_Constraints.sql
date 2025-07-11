-- Migration script to add LastLoginAt column to Users table and fix LoginActivity constraints
-- Compatible with Microsoft SQL Server

-- Add LastLoginAt column to Users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'LastLoginAt')
BEGIN
    ALTER TABLE Users ADD LastLoginAt DATETIME2 NULL;
    PRINT 'Added LastLoginAt column to Users table';
END

-- Fix LoginActivity foreign key constraint to include proper ON DELETE/UPDATE actions
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__LoginActi__UserI__' + SUBSTRING(CAST(object_id AS VARCHAR(20)), 1, 8))
BEGIN
    -- Drop existing foreign key constraint
    DECLARE @constraint_name NVARCHAR(128);
    SELECT @constraint_name = name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('LoginActivity') 
    AND referenced_object_id = OBJECT_ID('Users');
    
    IF @constraint_name IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE LoginActivity DROP CONSTRAINT ' + @constraint_name);
        PRINT 'Dropped existing LoginActivity foreign key constraint';
    END
END

-- Add new foreign key constraint with proper ON DELETE/UPDATE actions
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_LoginActivity_UserID')
BEGIN
    ALTER TABLE LoginActivity 
    ADD CONSTRAINT FK_LoginActivity_UserID 
    FOREIGN KEY (UserID) REFERENCES Users(UserID) 
    ON DELETE SET NULL ON UPDATE CASCADE;
    PRINT 'Added new LoginActivity foreign key constraint with proper actions';
END

-- Add performance indexes for LoginActivity table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoginActivity_UserID_AttemptTime')
BEGIN
    CREATE INDEX IX_LoginActivity_UserID_AttemptTime 
    ON LoginActivity(UserID, AttemptTime DESC);
    PRINT 'Added index IX_LoginActivity_UserID_AttemptTime';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoginActivity_UsernameAttempted')
BEGIN
    CREATE INDEX IX_LoginActivity_UsernameAttempted 
    ON LoginActivity(UsernameAttempted);
    PRINT 'Added index IX_LoginActivity_UsernameAttempted';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoginActivity_IPAddress_AttemptTime')
BEGIN
    CREATE INDEX IX_LoginActivity_IPAddress_AttemptTime 
    ON LoginActivity(IPAddress, AttemptTime DESC);
    PRINT 'Added index IX_LoginActivity_IPAddress_AttemptTime';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoginActivity_IsSuccess_AttemptTime')
BEGIN
    CREATE INDEX IX_LoginActivity_IsSuccess_AttemptTime 
    ON LoginActivity(IsSuccess, AttemptTime DESC);
    PRINT 'Added index IX_LoginActivity_IsSuccess_AttemptTime';
END

-- Add index for Users LastLoginAt column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_LastLoginAt')
BEGIN
    CREATE INDEX IX_Users_LastLoginAt 
    ON Users(LastLoginAt DESC);
    PRINT 'Added index IX_Users_LastLoginAt';
END

PRINT 'Database migration completed successfully';