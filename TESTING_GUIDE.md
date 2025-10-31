# Testing Guide - Multilingual AI Personal Assistant

## 🚀 How to Run and Test the Application

### Prerequisites
- Node.js 22.x installed
- Google Gemini API key
- Supabase account (for database)
- Modern web browser (Chrome/Edge recommended for speech recognition)

---

## Step 1: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Then edit .env with your actual credentials
```

Your `.env` file should look like this:

```env
# Google Gemini AI Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Supabase Configuration  
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here

# Server Configuration (Optional)
PORT=3000
NODE_ENV=development
```

### How to Get API Keys:

**Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

**Supabase Credentials:**
1. Go to https://supabase.com/dashboard
2. Create a new project (or use existing)
3. Go to Settings → API
4. Copy the "Project URL" → This is your `SUPABASE_URL`
5. Copy the "anon public" key → This is your `SUPABASE_ANON_KEY`
6. Set up the database schema (see SUPABASE_SETUP.md)

---

## Step 2: Install Dependencies

```bash
cd /home/user/multilingual-pa
npm install
```

You should see:
```
added 95 packages, and audited 95 packages in 4s
found 0 vulnerabilities
```

---

## Step 3: Set Up Database

Run the SQL commands from `SUPABASE_SETUP.md` in your Supabase SQL Editor:

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

-- Create indexes
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX idx_meetings_language ON meetings(language);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for demo)
CREATE POLICY "Allow all operations for anonymous users" ON meetings
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Step 4: Start the Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════╗
║  🤖 Multilingual AI Personal Assistant        ║
║  ⚡ OPTIMIZED VERSION - 3x Faster              ║
║  ✅ Server running on port 3000                ║
║  🌍 Environment: development                   ║
║  🔗 URL: http://localhost:3000                 ║
║  🎤 Languages: English, हिंदी, ગુજરાતી, मराठी  ║
║  🚀 Model: gemini-1.5-flash-8b                 ║
╚════════════════════════════════════════════════╝

✅ All systems ready! Security enabled. Start recording meetings...
```

If you see errors about missing API keys, the server will exit with clear error messages.

---

## Step 5: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see the main interface with:
- 🤖 Multilingual AI Personal Assistant header
- Language selector dropdown
- "Start Recording" button
- Meeting title input
- Process button (disabled until you record)

---

## Step 6: Test All Features

### 🎤 Test 1: Speech Recording (5 minutes)

1. **Allow Microphone Access**
   - Browser will prompt for microphone permission
   - Click "Allow"

2. **Select Language**
   - Choose from: English, Hindi, Gujarati, or Marathi
   - Default is English

3. **Start Recording**
   - Click "🎤 Start Recording" button
   - Button changes to "⏹️ Stop Recording"
   - Timer starts counting (00:00, 00:01, etc.)
   - Recording status shows "⏱️ Recording: 00:00"

4. **Speak for at least 1-2 minutes**
   - Talk about a meeting topic
   - Example: "Today we discussed Q4 revenue targets. John mentioned we need to increase sales by 20%. Sarah will prepare the budget report by next Friday. We approved 10 lakhs for marketing campaign."

5. **Watch Transcript Appear**
   - Your speech appears in real-time in the transcript area
   - Text shows with timestamps like "[10:30:45] your text here"

6. **Stop Recording**
   - Click "⏹️ Stop Recording"
   - Button changes back to "🎤 Start Recording"
   - Timer stops
   - Process button becomes enabled (blue)

---

### 🧠 Test 2: AI Processing with Progress Bar (2 minutes)

1. **Enter Meeting Title**
   - Type a title like "Q4 Strategy Meeting"

2. **Click "🧠 Process Meeting with AI"**
   - Button shows spinner: "⏳ Processing with AI..."
   - **NEW**: Progress bar appears below!

3. **Watch Progress Steps** (NEW FEATURE!)
   - Progress bar animates from 0% to 100%
   - Step-by-step messages appear:
     * 🤖 Preparing to send to AI... (0-10%)
     * 📝 Analyzing transcript... (10-20%)
     * 🚀 Sending to AI service... (20-40%)
     * 🤖 AI is analyzing content... (40-60%)
     * ✅ Extracting tasks and key points... (60-80%)
     * 💰 Analyzing financial data... (80-90%)
     * ✨ Finalizing results... (90-100%)

4. **Processing Time**
   - Should take 15-25 seconds
   - Timeout protection at 60 seconds

5. **Success Toast** (NEW FEATURE!)
   - Green toast notification appears: "✅ Meeting processed successfully!"
   - Non-blocking, auto-dismisses after 3 seconds

---

### 📋 Test 3: Copy-to-Clipboard (1 minute)

**NEW FEATURE!**

1. **Copy All Results**
   - Look for "📋 Copy All Results" button at top
   - Click it
   - Toast shows: "All Results copied to clipboard!"

2. **Test the Copy**
   - Open a text editor (Notepad, etc.)
   - Paste (Ctrl+V or Cmd+V)
   - You should see formatted text with all sections

3. **Copy Individual Section**
   - Find "📋 Copy" button next to "Executive Summary"
   - Click it
   - Toast shows: "Executive Summary copied to clipboard!"
   - Paste to verify

**Expected Format:**
```
MEETING SUMMARY: Q4 Strategy Meeting
Language: english | Processed: 10/30/2025, 12:00:00 PM
Processing Time: 18.45s

EXECUTIVE SUMMARY
[Summary text here]

KEY POINTS (English)
1. Point 1
2. Point 2
...
```

---

### 🔍 Test 4: Search and Filter (2 minutes)

**NEW FEATURE!**

1. **View Meeting History**
   - Click "📚 Meeting History" button
   - Search and filter UI appears above the list

2. **Test Search**
   - Type in search box: "Q4"
   - Results filter in real-time as you type
   - Only meetings with "Q4" in title show

3. **Test Language Filter**
   - Select "🇬🇧 English" from dropdown
   - Only English meetings show
   - Meeting count updates

4. **Test Both Filters Together**
   - Keep "Q4" in search
   - Select "Hindi" from language filter
   - Only Hindi meetings with "Q4" show

5. **Clear Filters**
   - Click "🔄 Clear" button
   - All filters reset
   - All meetings show again

---

### 🗑️ Test 5: Delete with Toast (1 minute)

**IMPROVED FEATURE!**

1. **Delete a Meeting**
   - In meeting history, click "🗑️ Delete" button
   - Confirm dialog appears (still uses browser confirm)
   - Click "OK"

2. **Success Toast** (NEW!)
   - Green toast: "Meeting deleted successfully!"
   - Meeting disappears from list
   - Filters are maintained

---

### 🚨 Test 6: Security Features (2 minutes)

**Test Rate Limiting:**

1. **Normal Usage**
   - Process 1-2 meetings normally
   - Should work fine

2. **Hit Rate Limit** (requires many requests)
   - Try to process 11 meetings in 1 hour
   - After 10, you'll see error: "AI request limit reached. Please try again later"

**Test Input Validation:**

1. **Short Transcript**
   - Record for only 5 seconds
   - Try to process
   - Error toast: "⚠️ Transcript too short. Please record more content."

2. **Invalid Language** (requires manual API call)
   - Would be blocked by backend with error: "Invalid language"

---

### 📊 Test 7: Results Display (3 minutes)

After processing, verify all sections appear:

1. **📊 Executive Summary**
   - 2-3 sentence summary
   - Meeting metadata (title, language, time, processing time)

2. **🔑 Key Points**
   - Two columns: English and Native language
   - 5 points each side
   - Side-by-side grid layout

3. **💰 Financial Highlights** (if detected)
   - Revenue
   - Expenses
   - Pending Payments
   - Budget Approvals
   - Shows in green cards with ₹ symbol

4. **✅ Action Items & Tasks**
   - Each task shows:
     * Task description
     * Owner name
     * Priority badge (High/Medium/Low with colors)
     * Due date
     * Type
   - Color-coded by priority

5. **✔️ Decisions Made**
   - Bullet list of decisions
   - Green background boxes

6. **⚠️ Risks & Concerns**
   - Bullet list of risks
   - Orange background boxes

7. **➡️ Next Steps**
   - Numbered list
   - Blue background boxes

8. **👥 Attendees**
   - Pills/badges with names

---

## 🧪 Test Checklist

### Basic Functionality
- [ ] Server starts without errors
- [ ] Page loads at http://localhost:3000
- [ ] Microphone permission works
- [ ] Can select different languages
- [ ] Recording starts/stops correctly
- [ ] Transcript appears in real-time
- [ ] Timer counts correctly
- [ ] Process button enables after recording

### NEW: UX Improvements
- [ ] Toast notifications appear (not alert dialogs)
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Progress bar shows during processing
- [ ] Progress steps update (7 steps)
- [ ] Progress bar reaches 100%
- [ ] Copy All Results button works
- [ ] Copy to clipboard successful
- [ ] Pasted text is properly formatted
- [ ] Search box filters in real-time
- [ ] Language filter works
- [ ] Clear button resets filters
- [ ] Delete shows toast (not alert)

### AI Processing
- [ ] Processing completes in 15-25 seconds
- [ ] All result sections display
- [ ] Key points in both languages
- [ ] Tasks have owners and due dates
- [ ] Financial data extracted (if mentioned)
- [ ] Processing time shown

### Security
- [ ] API key validation on startup
- [ ] Rate limiting works (after 10 requests)
- [ ] Short transcripts rejected
- [ ] No error details exposed to client

### Database
- [ ] Meeting saved to database
- [ ] Meeting history loads
- [ ] Search works
- [ ] Filter works
- [ ] Delete works
- [ ] Statistics work

---

## 🐛 Common Issues and Solutions

### Issue 1: "GEMINI_API_KEY not set"
**Solution**: 
- Create `.env` file
- Add your Gemini API key
- Restart server

### Issue 2: "Database connection failed"
**Solution**:
- Check Supabase credentials in `.env`
- Verify Supabase project is active
- Run SQL schema from SUPABASE_SETUP.md

### Issue 3: "Microphone access denied"
**Solution**:
- Allow microphone in browser settings
- Chrome: Settings → Privacy → Site Settings → Microphone
- Reload page and try again

### Issue 4: "Speech recognition not supported"
**Solution**:
- Use Chrome or Edge browser
- Safari and Firefox have limited support

### Issue 5: No transcript appearing
**Solution**:
- Check microphone is working
- Speak louder and clearer
- Check browser console for errors

### Issue 6: Processing takes too long
**Solution**:
- Will timeout after 60 seconds
- Check your internet connection
- Check Gemini API status

### Issue 7: Toast notifications not appearing
**Solution**:
- Check browser console for errors
- Verify Toastify.js loaded (check Network tab)
- Hard refresh page (Ctrl+Shift+R)

---

## 📱 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Speech Recognition | ✅ Full | ✅ Full | ⚠️ Limited | ⚠️ Limited |
| Toast Notifications | ✅ | ✅ | ✅ | ✅ |
| Copy-to-Clipboard | ✅ | ✅ | ✅ | ✅ |
| Progress Bar | ✅ | ✅ | ✅ | ✅ |
| Search/Filter | ✅ | ✅ | ✅ | ✅ |

**Recommended**: Chrome or Edge for full speech recognition support

---

## 🎯 Expected Test Results

### Recording Test
- ✅ 1-2 minute recording captured
- ✅ Transcript shows in text area
- ✅ Timer accurate

### Processing Test
- ✅ 15-25 second processing time
- ✅ Progress bar animates smoothly
- ✅ 7 progress steps display
- ✅ Success toast appears

### Copy Test
- ✅ Copy All works
- ✅ Formatted text in clipboard
- ✅ Copy section works
- ✅ Toast feedback shows

### Search Test
- ✅ Real-time filtering
- ✅ Language filter works
- ✅ Clear button resets
- ✅ Count updates

### Results Quality
- ✅ Accurate summary (80-90% for English)
- ✅ Tasks extracted correctly
- ✅ Financial amounts captured (₹ format)
- ✅ Bilingual key points
- ✅ All sections populated

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check server logs in terminal
3. Verify all environment variables set
4. Check SUPABASE_SETUP.md for database schema
5. Review SECURITY_FIXES_APPLIED.md for security features
6. Review UX_IMPROVEMENTS_WEEK2.md for new features

---

## ✅ Test Completion Checklist

After testing, you should have verified:

**Week 1 - Security:**
- [x] Rate limiting active
- [x] Input sanitization working
- [x] Timeout protection functional
- [x] No sensitive data exposure
- [x] API key validation on startup

**Week 2 - UX:**
- [x] Toast notifications (no alerts)
- [x] Copy-to-clipboard functional
- [x] Search and filter working
- [x] Progress bar animating
- [x] Professional interface

**Core Features:**
- [x] 4-language speech recognition
- [x] AI processing (15-25s)
- [x] Bilingual output
- [x] Task extraction
- [x] Financial data extraction
- [x] Database storage
- [x] Meeting history

---

**Testing Guide created**: October 30, 2025
**Application Version**: v1.0 (Security + UX Improvements)
**Status**: ✅ READY FOR TESTING
