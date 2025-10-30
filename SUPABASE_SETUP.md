# Supabase Database Setup

This document provides instructions for setting up the required database schema for the Multilingual AI Personal Assistant.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get your project credentials:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anonymous/public API key

## Database Schema

### Table: `meetings`

Run the following SQL query in your Supabase SQL Editor to create the meetings table:

```sql
-- Create meetings table
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('english', 'hindi', 'gujarati', 'marathi')),
  processed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX idx_meetings_language ON meetings(language);
CREATE INDEX idx_meetings_title ON meetings USING gin(to_tsvector('english', title));

-- Enable Row Level Security (RLS)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anonymous users (for demo purposes)
-- NOTE: In production, you should implement proper authentication and policies
CREATE POLICY "Allow all operations for anonymous users" ON meetings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `title` | TEXT | Meeting title |
| `transcript` | TEXT | Full meeting transcript |
| `language` | TEXT | Language used (english, hindi, gujarati, marathi) |
| `processed_data` | JSONB | AI-processed meeting data including summary, tasks, financials, etc. |
| `created_at` | TIMESTAMPTZ | Timestamp when record was created |
| `updated_at` | TIMESTAMPTZ | Timestamp when record was last updated |

## Processed Data Structure

The `processed_data` JSONB field contains the following structure:

```json
{
  "executiveSummary": "Brief summary of the meeting",
  "keyPoints": {
    "english": ["Point 1", "Point 2", "..."],
    "native": ["Native language point 1", "Point 2", "..."]
  },
  "decisions": ["Decision 1", "Decision 2"],
  "risks": ["Risk 1", "Risk 2"],
  "tasks": [
    {
      "task": "Task description",
      "owner": "Person name",
      "priority": "High|Medium|Low",
      "type": "financial|administrative|hr|compliance|technical|general",
      "dueDate": "YYYY-MM-DD"
    }
  ],
  "financialHighlights": {
    "revenue": "₹50 lakhs",
    "expenses": "₹15 lakhs",
    "pendingPayments": "₹15 lakhs",
    "budgetApprovals": "₹10 lakhs"
  },
  "nextSteps": ["Step 1", "Step 2"],
  "attendees": ["Person 1", "Person 2"],
  "metadata": {
    "meetingTitle": "Meeting title",
    "language": "english",
    "processedAt": "2025-10-30T12:00:00Z",
    "transcriptLength": 1500,
    "aiModel": "gemini-1.5-flash-8b",
    "processingTime": "18.45s"
  },
  "rawTranscript": "Full transcript text...",
  "savedToDatabase": true,
  "meetingId": "uuid"
}
```

## Verification

After running the SQL commands, verify the table was created:

```sql
-- Check if table exists
SELECT * FROM meetings LIMIT 1;

-- View table structure
\d meetings
```

## Security Notes

⚠️ **IMPORTANT**: The default policy above allows anonymous access for demo purposes. For production use:

1. Implement proper authentication (e.g., Supabase Auth)
2. Update RLS policies to restrict access based on user authentication
3. Consider implementing role-based access control (RBAC)
4. Add data validation and sanitization

Example production policy:
```sql
-- Drop the permissive policy
DROP POLICY "Allow all operations for anonymous users" ON meetings;

-- Create authenticated user policies
CREATE POLICY "Users can view their own meetings" ON meetings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings" ON meetings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Troubleshooting

### Connection Issues
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check your Supabase project is active
- Ensure your IP is not blocked in Supabase settings

### Query Performance
- The table includes indexes for common queries
- For large datasets, consider adding pagination
- Use the `created_at` index for time-based queries

### RLS Issues
- If you get permission denied errors, check your RLS policies
- Verify the policies match your authentication setup
- Use Supabase dashboard to test policies

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
