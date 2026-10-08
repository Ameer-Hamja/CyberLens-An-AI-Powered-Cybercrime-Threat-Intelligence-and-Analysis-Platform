CREATE TABLE citizen_reports (
 id UUID PRIMARY KEY,
 url VARCHAR(2048) NOT NULL,
 title VARCHAR(200) NOT NULL,
 description TEXT NOT NULL,
 category VARCHAR(50) NOT NULL,
 state VARCHAR(100),
 contact_email VARCHAR(254),
 submitted_by VARCHAR(100) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX citizen_reports_created_at_idx ON citizen_reports(created_at DESC);
