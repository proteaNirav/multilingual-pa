# Live Testing Guide - Recording and Logs

**Purpose:** Test meeting recording feature and capture everything to share with Claude

---

## 📸 **How to Share What You See**

### **Option 1: Screenshots (Quick)**

**Windows Screenshot Tools:**

1. **Snipping Tool** (Built-in)
   - Press `Windows Key + Shift + S`
   - Select area to capture
   - Screenshot copied to clipboard
   - Paste in chat with Ctrl+V

2. **Full Screen**
   - Press `Windows Key + PrtScn`
   - Saves to: `C:\Users\YourName\Pictures\Screenshots\`

3. **Active Window**
   - Press `Alt + PrtScn`
   - Copies active window to clipboard

### **Option 2: Screen Recording (Better)**

**Built-in Windows Game Bar:**

1. Press `Windows Key + G`
2. Click the record button (or `Windows Key + Alt + R`)
3. Stop recording when done
4. Video saved to: `C:\Users\YourName\Videos\Captures\`

**OR use:**
- OBS Studio (free, powerful)
- ShareX (free, easy)

---

## 📋 **What to Capture and Share**

### **1. Main App Interface**
- Screenshot of the full Electron window
- Show me the buttons, text areas, layout

### **2. Console Logs (F12)**
- Open DevTools (F12)
- Click "Console" tab
- Screenshot showing all messages
- Include health monitor messages

### **3. PowerShell Terminal**
- The terminal where you ran `npm run electron`
- Shows server logs
- Screenshot or copy/paste the text

### **4. Network Activity (F12)**
- Open DevTools (F12)
- Click "Network" tab
- Click "Process Meeting" button
- Screenshot showing the request/response

---

## 🎯 **Step-by-Step Test: Meeting Recording**

### **BEFORE YOU START:**

1. **Open PowerShell in project folder**
   ```powershell
   cd D:\Projects\multilingual-pa
   npm run electron
   ```

2. **Open DevTools immediately (F12)**
   - Console tab visible
   - Keep it open during testing

3. **Arrange windows side-by-side:**
   - Left: Electron app
   - Right: PowerShell terminal + DevTools

---

### **TEST 1: Check Current Interface**

**Step 1.1: Take screenshot of main app**

Show me:
- [ ] Can you see "Start Recording" button?
- [ ] Can you see transcript text area?
- [ ] Can you see language dropdown?
- [ ] Can you see "Process Meeting" button?
- [ ] What's the exact layout?

**Step 1.2: Console check**

In DevTools Console, type:
```javascript
// Check if recording features exist
console.log('RecordingManager exists:', typeof RecordingManager !== 'undefined');
console.log('Speech recognition available:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
```

**Screenshot the output**

---

### **TEST 2: Try Voice Recording**

**Step 2.1: Click "Start Recording" button**

Watch for:
- Button changes color/text?
- Microphone permission popup?
- Recording indicator appears?
- Any errors in console?

**Step 2.2: Speak some test words**

Say something like:
```
"This is a test meeting recording.
Action item: Review the project by Friday.
Budget approved: five thousand dollars."
```

**Step 2.3: Click "Stop Recording"**

Watch for:
- Recording stops?
- Transcript appears in text area?
- Any text captured?

**Screenshot:**
- [ ] The app showing any captured text
- [ ] Console showing any errors
- [ ] PowerShell showing server logs

---

### **TEST 3: Manual Text Input (Alternative)**

**Step 3.1: Clear any previous text**

**Step 3.2: Type directly in transcript area:**

```
Team Meeting - October 31, 2025

Attendees: John Smith, Sarah Johnson, Mike Chen

Discussion Points:
We reviewed the Q4 project timeline and budget allocation.

Action Items:
- John: Complete UI design mockups by Friday November 3rd
- Sarah: Review backend implementation by Monday November 6th
- Mike: Prepare client presentation for Wednesday November 8th
- Team: Conduct comprehensive user testing next week

Decisions Made:
- Approved new feature roadmap for Q1 2026
- Extended project deadline to November 15th
- Increased development budget by $5000 for additional resources
- Scheduled follow-up meeting for November 8th at 2:00 PM

Financial Information:
- Development budget increase: $5000
- Marketing budget: $3000
- Total Q4 budget allocation: $50,000
- Expected Q4 revenue: $75,000
- ROI target: 150%

Next Steps:
Schedule design review session and prepare budget report for stakeholders.
```

**Step 3.3: Select language**

Choose: **English**

**Step 3.4: Click "Process Meeting"**

---

### **TEST 4: Watch AI Processing**

**Step 4.1: When you click "Process Meeting", watch:**

**In the App:**
- [ ] Button shows "Processing..."?
- [ ] Progress bar appears?
- [ ] Status messages show?

**In Console (F12):**
- [ ] Any fetch requests?
- [ ] Any errors (red text)?
- [ ] Any health monitor messages?

**In PowerShell:**
- [ ] Server receives request?
- [ ] "Processing meeting transcript..." message?
- [ ] Any errors?

**Screenshot ALL THREE at the same time if possible!**

---

### **TEST 5: Check Results**

**Step 5.1: After processing completes, look for:**

- [ ] Summary section appears?
- [ ] Action items listed?
- [ ] Decisions listed?
- [ ] Participants shown?
- [ ] Financial data extracted?
- [ ] Success message?

**Screenshot the results display**

---

### **TEST 6: Check if Meeting Saved**

**Step 6.1: Look for "View Meetings" or similar**

Where is it located?
- Top menu?
- Side panel?
- Button somewhere?

**Screenshot showing where to find saved meetings**

**Step 6.2: Click to view saved meetings**

- [ ] Does your test meeting appear?
- [ ] Shows title, date, summary?

**Screenshot the meetings list**

---

### **TEST 7: Verify Database File**

**Step 7.1: Open File Explorer**

Navigate to:
```
C:\Users\Nirav\AppData\Roaming\multilingual-pa\
```

**Step 7.2: Check files present:**

- [ ] meetings.db exists?
- [ ] What's the file size?
- [ ] When was it last modified?

**Screenshot the folder contents**

---

## 📊 **Logs to Copy/Paste**

### **PowerShell Terminal Output**

After running the test, **copy ALL the text from PowerShell** and paste it.

Should include:
```
Application starting...
Database configured: sqlite
Express server started successfully
Server: ╔════════════════...
✅ Database connected: SQLITE
✅ Server ready!
[any other messages during testing]
```

### **Browser Console Output**

In DevTools Console:

1. Right-click anywhere in the console
2. Select "Save as..."
3. Save as `console-log.txt`

OR manually copy all text and paste it.

### **Network Request Details**

In DevTools Network tab:

1. Find the `process-meeting` request
2. Click on it
3. Click "Preview" or "Response" tab
4. Screenshot or copy the response

---

## 🎬 **Ideal Recording Approach**

**Best way to show me everything:**

1. **Start screen recording** (Windows Key + G)

2. **Do the entire test in one take:**
   - Open app
   - Show interface
   - Open DevTools (F12)
   - Arrange windows to show both
   - Type test transcript
   - Click Process
   - Show results
   - Show View Meetings
   - Show database file

3. **Stop recording**

4. **Share the video** OR take screenshots at key moments

---

## 📝 **What to Report**

After testing, tell me:

### **Interface Questions:**
1. Can you see a "Start Recording" button? (yes/no + screenshot)
2. Can you see a transcript text area? (yes/no + screenshot)
3. Can you see a "Process Meeting" button? (yes/no + screenshot)
4. What does the main interface look like? (screenshot)

### **Voice Recording Questions:**
5. Did "Start Recording" work? (yes/no + what happened)
6. Did it ask for microphone permission? (yes/no)
7. Did any text get transcribed? (yes/no + screenshot)
8. What errors appeared? (screenshot of console)

### **Text Processing Questions:**
9. Did "Process Meeting" start? (yes/no)
10. Did AI return results? (yes/no + screenshot)
11. What did the results look like? (screenshot)
12. Did meeting save? (yes/no)
13. Can you see it in "View Meetings"? (yes/no + screenshot)

### **Errors:**
14. Any red errors in console? (copy/paste or screenshot)
15. Any errors in PowerShell? (copy/paste)

### **Database:**
16. Does meetings.db exist? (yes/no + file size)
17. Screenshot of AppData folder showing the file

---

## 🚀 **Quick Start Command**

Open PowerShell and run this to start fresh:

```powershell
# Navigate to project
cd D:\Projects\multilingual-pa

# Pull latest code
git pull origin claude/complete-project-011CUd7up4hJDX7TaudtrhXY

# Start app
npm run electron
```

**Then follow the tests above and share screenshots/logs!**

---

## 💡 **Tips for Good Screenshots**

- **Full window** - show entire app, not cropped
- **Include window title** - so I know what app it is
- **Show console if errors** - F12 DevTools visible
- **High resolution** - not blurry
- **Multiple angles** - before/during/after

---

## 📁 **Files to Check**

If you want to share files with me:

1. **Console log** - Save from DevTools
2. **PowerShell output** - Copy/paste text
3. **meetings.db** - Check file size, don't need to share contents
4. **Screenshots** - Take at each step above

---

**Ready to start testing? Follow the steps above and share what you see!** 📸

