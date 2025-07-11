-- Create UserSessions table for session timeout management
CREATE TABLE UserSessions (
    SessionID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    SessionToken NVARCHAR(500) NOT NULL UNIQUE,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    LastActivityAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ExpiresAt DATETIME2 NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(MAX) NULL,
    SessionTimeoutMinutes INT NOT NULL DEFAULT 15,
    
    CONSTRAINT FK_UserSessions_Users FOREIGN KEY (UserID) 
        REFERENCES Users(UserID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IX_UserSessions_SessionToken ON UserSessions(SessionToken);
CREATE INDEX IX_UserSessions_UserID_IsActive ON UserSessions(UserID, IsActive);
CREATE INDEX IX_UserSessions_ExpiresAt_IsActive ON UserSessions(ExpiresAt, IsActive);
CREATE INDEX IX_UserSessions_LastActivityAt ON UserSessions(LastActivityAt);
CREATE INDEX IX_UserSessions_IPAddress ON UserSessions(IPAddress);