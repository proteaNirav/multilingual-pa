# Phase 1: Productivity Suite Architecture
## Add Documents + AI Writing + Task Management + AI Chat

**Timeline**: 2-3 weeks
**Approach**: Extend current app, keep meeting assistant intact

---

## 🎯 Phase 1 Goals

1. **Document Management** - Create, edit, save notes
2. **AI Writing Assistant** - Improve, continue, change tone, summarize
3. **Task Management** - Todo lists with due dates and priorities
4. **AI Chat** - Ask AI anything, get instant help

**Result**: Productivity suite that works alongside meeting assistant

---

## 🏗️ Architecture Overview

```
multilingual-pa/
├── server.js (existing - extend)
├── package.json (add dependencies)
├── public/
│   ├── index.html (existing - add navigation)
│   ├── app.html (NEW - main productivity app)
│   ├── css/
│   │   └── app.css (NEW - productivity UI styles)
│   └── js/
│       ├── editor.js (NEW - document editor)
│       ├── ai-assistant.js (NEW - AI writing tools)
│       ├── tasks.js (NEW - task management)
│       └── chat.js (NEW - AI chat)
└── SUPABASE_SETUP.md (update with new tables)
```

---

## 📊 Database Schema (New Tables)

### 1. Documents Table
```sql
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content JSONB NOT NULL,  -- Tiptap JSON format
  plain_text TEXT,          -- For search
  folder_id UUID REFERENCES folders(id),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_search ON documents USING gin(to_tsvector('english', plain_text));
```

### 2. Folders Table
```sql
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_folders_user ON folders(user_id);
```

### 3. Tasks Table
```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES documents(id),
  meeting_id UUID REFERENCES meetings(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### 4. AI Chat History Table
```sql
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  conversation_id UUID NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_history(user_id);
CREATE INDEX idx_chat_conversation ON chat_history(conversation_id);
```

---

## 🔌 New API Endpoints

### Documents API

```javascript
// Create document
POST /api/documents
Body: { title, content, folderId }
Response: { id, title, content, createdAt }

// Get all documents
GET /api/documents?folder=<id>&search=<query>&limit=50
Response: { documents: [...] }

// Get single document
GET /api/documents/:id
Response: { id, title, content, ... }

// Update document
PUT /api/documents/:id
Body: { title, content }
Response: { success: true }

// Delete document
DELETE /api/documents/:id
Response: { success: true }
```

### AI Writing Assistant API

```javascript
// Improve writing
POST /api/ai/improve
Body: { text }
Response: { improved: "better version" }

// Continue writing
POST /api/ai/continue
Body: { text, context }
Response: { continuation: "..." }

// Change tone
POST /api/ai/tone
Body: { text, tone: "professional|casual|friendly|formal" }
Response: { result: "..." }

// Summarize
POST /api/ai/summarize
Body: { text, length: "short|medium|long" }
Response: { summary: "..." }

// Translate
POST /api/ai/translate
Body: { text, targetLanguage }
Response: { translation: "..." }

// Fix grammar
POST /api/ai/grammar
Body: { text }
Response: { fixed: "..." }

// Generate content
POST /api/ai/generate
Body: { prompt, type: "email|blog|social|list|etc" }
Response: { content: "..." }
```

### Tasks API

```javascript
// Create task
POST /api/tasks
Body: { title, description, dueDate, priority, status }
Response: { id, title, ... }

// Get all tasks
GET /api/tasks?status=<status>&priority=<priority>&sort=dueDate
Response: { tasks: [...] }

// Update task
PUT /api/tasks/:id
Body: { title, status, priority, dueDate }
Response: { success: true }

// Delete task
DELETE /api/tasks/:id
Response: { success: true }

// Get task statistics
GET /api/tasks/stats
Response: { total, completed, overdue, byPriority: {...} }
```

### AI Chat API

```javascript
// Send chat message
POST /api/chat
Body: { message, conversationId?, context? }
Response: { reply, conversationId }

// Get chat history
GET /api/chat/:conversationId
Response: { messages: [...] }

// Start new conversation
POST /api/chat/new
Response: { conversationId }
```

---

## 🎨 Frontend Architecture

### Main App Layout (app.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>ProteaHRMS Productivity Suite</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <!-- Sidebar Navigation -->
  <aside class="sidebar">
    <div class="logo">ProteaHRMS</div>
    <nav>
      <a href="#documents">📄 Documents</a>
      <a href="#tasks">✅ Tasks</a>
      <a href="#meetings">🎤 Meetings</a>
      <a href="#chat">💬 AI Chat</a>
    </nav>
  </aside>

  <!-- Main Content Area -->
  <main class="main-content">
    <div id="app">
      <!-- Content loaded dynamically -->
    </div>
  </main>

  <!-- Scripts -->
  <script src="/js/editor.js"></script>
  <script src="/js/ai-assistant.js"></script>
  <script src="/js/tasks.js"></script>
  <script src="/js/chat.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>
```

### Document Editor (editor.js)

```javascript
// Use Tiptap for rich text editing
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

class DocumentEditor {
  constructor() {
    this.editor = new Editor({
      element: document.querySelector('#editor'),
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: 'Start writing...'
        })
      ],
      content: '',
      onUpdate: ({ editor }) => {
        this.saveDocument(editor.getJSON())
      }
    })
    
    this.setupAIAssistant()
  }

  setupAIAssistant() {
    // Add AI toolbar
    const toolbar = document.createElement('div')
    toolbar.className = 'ai-toolbar'
    toolbar.innerHTML = `
      <button onclick="improveSelection()">✨ Improve</button>
      <button onclick="continueWriting()">➡️ Continue</button>
      <button onclick="summarizeSelection()">📝 Summarize</button>
      <button onclick="changeTone()">🎭 Change Tone</button>
    `
    document.querySelector('#editor-container').prepend(toolbar)
  }

  async saveDocument(content) {
    const response = await fetch('/api/documents/' + this.documentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content,
        plainText: this.editor.getText()
      })
    })
  }
}
```

### AI Assistant (ai-assistant.js)

```javascript
class AIAssistant {
  async improveText(text) {
    const response = await fetch('/api/ai/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    return await response.json()
  }

  async continueWriting(text, context) {
    const response = await fetch('/api/ai/continue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context })
    })
    return await response.json()
  }

  async changeTone(text, tone) {
    const response = await fetch('/api/ai/tone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tone })
    })
    return await response.json()
  }

  async summarize(text, length = 'medium') {
    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, length })
    })
    return await response.json()
  }

  showLoadingIndicator() {
    // Show spinner while AI processes
  }

  insertResult(result) {
    // Insert AI response into editor
  }
}
```

### Task Management (tasks.js)

```javascript
class TaskManager {
  constructor() {
    this.tasks = []
    this.filter = { status: 'all', priority: 'all' }
    this.render()
  }

  async loadTasks() {
    const response = await fetch('/api/tasks')
    const data = await response.json()
    this.tasks = data.tasks
    this.render()
  }

  async createTask(taskData) {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
    const newTask = await response.json()
    this.tasks.push(newTask)
    this.render()
  }

  async updateTask(id, updates) {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    // Update local state
    const index = this.tasks.findIndex(t => t.id === id)
    this.tasks[index] = { ...this.tasks[index], ...updates }
    this.render()
  }

  render() {
    const container = document.getElementById('tasks-container')
    container.innerHTML = `
      <div class="tasks-header">
        <h2>Tasks</h2>
        <button onclick="createTask()">+ New Task</button>
      </div>
      <div class="tasks-filters">
        <select onchange="filterByStatus(this.value)">
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select onchange="filterByPriority(this.value)">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="tasks-list">
        ${this.renderTasks()}
      </div>
    `
  }

  renderTasks() {
    return this.tasks
      .filter(t => this.matchesFilter(t))
      .map(task => `
        <div class="task-card priority-${task.priority} status-${task.status}">
          <div class="task-header">
            <input type="checkbox" 
                   ${task.status === 'done' ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}')">
            <h3>${task.title}</h3>
            <span class="priority-badge">${task.priority}</span>
          </div>
          <p>${task.description || ''}</p>
          <div class="task-footer">
            <span class="due-date">${task.dueDate || 'No due date'}</span>
            <button onclick="editTask('${task.id}')">Edit</button>
            <button onclick="deleteTask('${task.id}')">Delete</button>
          </div>
        </div>
      `).join('')
  }
}
```

### AI Chat (chat.js)

```javascript
class AIChat {
  constructor() {
    this.conversationId = null
    this.messages = []
    this.render()
  }

  async startNewConversation() {
    const response = await fetch('/api/chat/new', { method: 'POST' })
    const data = await response.json()
    this.conversationId = data.conversationId
    this.messages = []
    this.render()
  }

  async sendMessage(message) {
    // Add user message
    this.messages.push({ role: 'user', message, timestamp: new Date() })
    this.render()

    // Get AI response
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId: this.conversationId
      })
    })

    const data = await response.json()
    this.conversationId = data.conversationId

    // Add AI response
    this.messages.push({ 
      role: 'assistant', 
      message: data.reply, 
      timestamp: new Date() 
    })
    this.render()
  }

  render() {
    const container = document.getElementById('chat-container')
    container.innerHTML = `
      <div class="chat-header">
        <h2>💬 AI Assistant</h2>
        <button onclick="chat.startNewConversation()">New Chat</button>
      </div>
      <div class="chat-messages">
        ${this.renderMessages()}
      </div>
      <div class="chat-input">
        <textarea id="chat-input" 
                  placeholder="Ask AI anything..." 
                  onkeydown="handleChatKeydown(event)"></textarea>
        <button onclick="sendChatMessage()">Send</button>
      </div>
    `
  }

  renderMessages() {
    return this.messages.map(msg => `
      <div class="message ${msg.role}">
        <div class="message-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
          <div class="message-text">${this.formatMessage(msg.message)}</div>
          <div class="message-time">${this.formatTime(msg.timestamp)}</div>
        </div>
      </div>
    `).join('')
  }

  formatMessage(text) {
    // Convert markdown to HTML
    return text.replace(/\n/g, '<br>')
  }
}
```

---

## 🔧 Implementation Steps

### Week 1: Foundation
**Days 1-2: Database & Auth**
- [ ] Add new tables to Supabase
- [ ] Implement authentication (Supabase Auth)
- [ ] Add user session management
- [ ] Test auth flow

**Days 3-5: Document Editor**
- [ ] Install Tiptap dependencies
- [ ] Build basic editor UI
- [ ] Implement save/load functionality
- [ ] Add folder structure
- [ ] Test editor

### Week 2: AI Features
**Days 6-8: AI Writing Assistant**
- [ ] Create AI assistant API endpoints
- [ ] Integrate Gemini for text improvements
- [ ] Add toolbar to editor
- [ ] Implement each AI function (improve, continue, summarize, etc.)
- [ ] Test all AI features

**Days 9-10: Task Management**
- [ ] Build task UI
- [ ] Implement CRUD operations
- [ ] Add filtering and sorting
- [ ] Connect tasks to documents/meetings
- [ ] Test task management

### Week 3: Polish & Integration
**Days 11-12: AI Chat**
- [ ] Build chat interface
- [ ] Implement conversation history
- [ ] Add context awareness
- [ ] Test chat functionality

**Days 13-15: Integration & Testing**
- [ ] Create unified navigation
- [ ] Link meetings to documents/tasks
- [ ] Add search across all content
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] Documentation

---

## 📦 New Dependencies

```json
{
  "dependencies": {
    // Existing
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@google/generative-ai": "^0.2.1",
    "@supabase/supabase-js": "^2.38.5",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2",
    
    // New for Phase 1
    "express-rate-limit": "^7.1.5",
    "validator": "^13.11.0",
    "xss": "^1.0.14",
    "marked": "^11.1.0",
    "dompurify": "^3.0.6"
  },
  "devDependencies": {
    // For frontend (if using build step)
    "@tiptap/core": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-placeholder": "^2.1.13"
  }
}
```

---

## 🚀 Deployment Plan

### Development
```bash
npm install
npm run dev
```

### Production (Vercel)
- No changes needed to `vercel.json`
- Add new environment variables in Vercel dashboard
- Deploy as usual

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Document CRUD operations | < 200ms |
| AI writing assistance | < 5s |
| Task operations | < 100ms |
| AI chat response | < 3s |
| Editor auto-save | Every 2s |
| Search results | < 500ms |

---

## 🔄 Integration with Meeting Assistant

The meeting assistant stays separate but connected:

1. **Navigation**: Add "Meetings" tab in new UI
2. **Task Integration**: Tasks from meetings appear in task list
3. **Document Links**: Link meeting notes to documents
4. **AI Context**: AI chat can reference meeting summaries

---

## 📝 Next Steps After Phase 1

**Phase 2** (Weeks 4-7):
- Kanban board view for tasks
- Calendar integration
- Database tables (spreadsheet-like)
- Templates system

**Phase 3** (Weeks 8-10):
- Real-time collaboration
- Advanced search
- Mobile responsiveness
- Integrations (Google, Slack, etc.)

---

## ✅ Phase 1 Deliverables

1. ✅ Document editor with rich text
2. ✅ AI writing assistant (7 functions)
3. ✅ Task management system
4. ✅ AI chat interface
5. ✅ Unified navigation
6. ✅ All integrated with existing meeting assistant

**Total: 2-3 weeks for complete Phase 1**
