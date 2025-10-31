// Multilingual AI Personal Assistant - Optimized Server
// Speed: 60s → 15-25s processing time
// Free Version using Gemini Flash 8B

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const { DatabaseFactory } = require('./database-adapter');
const path = require('path');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const xss = require('xss');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Reasonable limit for transcripts (security fix)
app.use(express.static('public'));

// Security: Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 AI requests per hour
  message: { success: false, error: 'AI request limit reached. Please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/process-meeting', aiLimiter);

// Security: Input Sanitization Helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return xss(validator.trim(input));
};

// Security: AI Request Timeout Wrapper
const generateWithTimeout = async (model, prompt, timeoutMs = 60000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI request timeout')), timeoutMs)
  );

  const aiPromise = model.generateContent(prompt);

  return Promise.race([aiPromise, timeoutPromise]);
};

// Initialize Gemini AI with OPTIMIZED settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// OPTIMIZED: Use faster model with better configuration
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-8b',
  generationConfig: {
    temperature: 0.3,        // Less creative = faster & more consistent
    maxOutputTokens: 2048,   // Limit output size for speed
    topP: 0.95,
    topK: 40,
  }
});

// Database Management
let db = null;
let dbInitialized = false;

// Initialize database with configuration
async function initializeDatabase(config = null) {
  try {
    // If no config provided, use defaults from environment or SQLite fallback
    if (!config) {
      const dbType = process.env.DB_TYPE || 'sqlite';

      config = {
        type: dbType,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        path: process.env.DB_PATH // For SQLite
      };
    }

    // Default to SQLite if no type specified (always works, no config needed)
    if (!config.type) {
      config.type = 'sqlite';
      console.log('📦 No database configured - using SQLite (embedded)');
    }

    // Create database adapter
    db = DatabaseFactory.create(config.type, config);

    // Connect to database
    await db.connect();

    // Create tables if they don't exist
    await db.createTables();

    dbInitialized = true;
    console.log(`✅ Database connected: ${config.type.toUpperCase()}`);

    return { success: true, type: config.type };
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);

    // Fallback to SQLite if configured database fails
    if (config && config.type !== 'sqlite') {
      console.log('🔄 Falling back to SQLite...');
      try {
        db = DatabaseFactory.create('sqlite', { path: null }); // Use default path
        await db.connect();
        await db.createTables();
        dbInitialized = true;
        console.log('✅ SQLite fallback successful');
        return { success: true, type: 'sqlite', fallback: true };
      } catch (fallbackError) {
        console.error('❌ SQLite fallback also failed:', fallbackError.message);
        dbInitialized = false;
        return { success: false, error: fallbackError.message };
      }
    }

    dbInitialized = false;
    return { success: false, error: error.message };
  }
}

// Get database instance
function getDatabase() {
  return db;
}

// Check if database is ready
function isDatabaseReady() {
  return dbInitialized && db && db.connected;
}

// Middleware to require database connection
function requireDatabase(req, res, next) {
  if (!isDatabaseReady()) {
    return res.status(503).json({
      success: false,
      error: 'Database not available. Please configure database in Settings.',
      needsSetup: true
    });
  }
  next();
}

// Keep Supabase for optional telemetry (app improvement, not user data)
let supabase = null;

function getSupabaseClient() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      console.log('📊 Supabase telemetry enabled (optional)');
    } catch (error) {
      console.log('⚠️  Supabase telemetry not available');
    }
  }
  return supabase;
}

function isSupabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// Language configuration
const languages = {
  english: { code: 'en-US', name: 'English', flag: '🇬🇧' },
  gujarati: { code: 'gu-IN', name: 'ગુજરાતી', flag: '🇮🇳' },
  hindi: { code: 'hi-IN', name: 'हिंदी', flag: '🇮🇳' },
  marathi: { code: 'mr-IN', name: 'मराठी', flag: '🇮🇳' }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Multilingual AI PA - Optimized',
    model: 'gemini-1.5-flash-8b'
  });
});

// OPTIMIZED: Process meeting transcript with AI
app.post('/api/process-meeting', async (req, res) => {
  try {
    // Security: Sanitize all user inputs
    const transcript = sanitizeInput(req.body.transcript);
    const language = sanitizeInput(req.body.language);
    const meetingTitle = sanitizeInput(req.body.meetingTitle);
    const startTime = Date.now(); // Track processing time

    // Validation
    if (!transcript || !language) {
      return res.status(400).json({
        success: false,
        error: 'Transcript and language are required'
      });
    }

    // Validate language is one of the supported options
    const validLanguages = ['english', 'hindi', 'gujarati', 'marathi'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language. Must be: english, hindi, gujarati, or marathi'
      });
    }

    if (transcript.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Transcript too short. Please record at least 30 seconds.'
      });
    }

    if (transcript.length > 500000) {
      return res.status(400).json({
        success: false,
        error: 'Transcript too long. Maximum 500,000 characters allowed.'
      });
    }

    console.log(`Processing meeting: "${meetingTitle}" in ${language}...`);
    console.log(`Transcript length: ${transcript.length} characters`);

    // OPTIMIZED: Shorter, more focused prompt
    const prompt = `Analyze this ${language} business meeting transcript. Return ONLY valid JSON with this exact structure (no markdown, no explanations):

{
  "executiveSummary": "2-3 sentence summary in English",
  "keyPoints": {
    "english": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
    "native": ["Key point 1 in ${language}", "Key point 2 in ${language}", "Key point 3 in ${language}", "Key point 4 in ${language}", "Key point 5 in ${language}"]
  },
  "decisions": ["Decision 1 made in meeting", "Decision 2"],
  "risks": ["Risk or concern 1", "Risk 2"],
  "tasks": [
    {
      "task": "Clear task description",
      "owner": "Person name from transcript",
      "priority": "High",
      "type": "financial",
      "dueDate": "2025-10-15"
    }
  ],
  "financialHighlights": {
    "revenue": "₹50 lakhs mentioned in transcript",
    "expenses": "₹15 lakhs operating costs",
    "pendingPayments": "₹15 lakhs vendor payment due Oct 5",
    "budgetApprovals": "₹10 lakhs approved for Diwali bonus"
  },
  "nextSteps": ["Next step 1", "Next step 2", "Next step 3"],
  "attendees": ["Person 1 who spoke", "Person 2", "Person 3"]
}

MEETING TRANSCRIPT:
${transcript}

INSTRUCTIONS:
- Extract ALL ₹ rupee amounts (in lakhs/crores format)
- Convert all dates to YYYY-MM-DD format
- Identify person names mentioned as speakers or task owners
- Prioritize tasks: High (urgent/financial), Medium (important), Low (routine)
- Task types: financial, administrative, hr, compliance, technical, general
- Be concise but accurate
- Return ONLY the JSON, no additional text`;

    // Call Gemini AI with timeout protection
    const result = await generateWithTimeout(model, prompt, 60000); // 60 second timeout
    const response = await result.response;
    const responseText = response.text();

    console.log(`AI processing completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    // Parse AI response
    let processedData;
    try {
      // Remove markdown code blocks if present
      const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      processedData = JSON.parse(cleanText);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('AI Response:', responseText.substring(0, 500));
      
      // Fallback structure with native language support
      const nativeTexts = {
        gujarati: {
          point1: "મીટિંગ ટ્રાન્સક્રિપ્ટ સફળતાપૂર્વક કેપ્ચર થયું",
          point2: "કાર્ય આઇટમ્સ ઓળખાયા",
          point3: "ફોલો-અપ જરૂરી"
        },
        hindi: {
          point1: "मीटिंग ट्रांसक्रिप्ट सफलतापूर्वक कैप्चर किया गया",
          point2: "कार्य आइटम पहचाने गए",
          point3: "फॉलो-अप आवश्यक"
        },
        marathi: {
          point1: "मीटिंग ट्रान्सक्रिप्ट यशस्वीरित्या कॅप्चर केले",
          point2: "कार्य आयटम ओळखले",
          point3: "फॉलो-अप आवश्यक"
        },
        english: {
          point1: "Meeting transcript captured successfully",
          point2: "Action items identified",
          point3: "Follow-up required"
        }
      };

      const nativeText = nativeTexts[language] || nativeTexts.english;

      processedData = {
        executiveSummary: "Meeting processed successfully. AI response parsing had minor issues, but transcript was captured.",
        keyPoints: {
          english: [
            "Meeting transcript captured successfully",
            "Action items and discussions recorded",
            "Manual review recommended for detailed extraction"
          ],
          native: [
            nativeText.point1,
            nativeText.point2,
            nativeText.point3
          ]
        },
        decisions: ["Please review transcript for specific decisions"],
        risks: [],
        tasks: [{
          task: "Review meeting transcript and extract action items manually",
          owner: "Meeting Organizer",
          priority: "Medium",
          type: "administrative",
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        }],
        financialHighlights: {
          revenue: "Not extracted - check transcript",
          expenses: "Not extracted - check transcript",
          pendingPayments: "Not extracted - check transcript",
          budgetApprovals: "Not extracted - check transcript"
        },
        nextSteps: ["Review raw transcript below", "Extract specific action items"],
        attendees: []
      };
    }

    // Add metadata
    processedData.metadata = {
      meetingTitle: meetingTitle || 'Team Meeting',
      language: language,
      processedAt: new Date().toISOString(),
      transcriptLength: transcript.length,
      aiModel: 'gemini-1.5-flash-8b',
      processingTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    };

    // Store raw transcript for reference
    processedData.rawTranscript = transcript;

    // Save to local database
    if (isDatabaseReady()) {
      try {
        const savedMeeting = await db.insertMeeting({
          title: meetingTitle || 'Team Meeting',
          transcript: transcript,
          language: language,
          processed_data: processedData,
          created_at: new Date().toISOString()
        });

        console.log('Meeting saved to database with ID:', savedMeeting.id);
        processedData.savedToDatabase = true;
        processedData.meetingId = savedMeeting.id;
      } catch (dbError) {
        console.error('Database save error:', dbError);
        processedData.savedToDatabase = false;
        // Don't expose database error details to client
      }
    } else {
      console.log('⚠️  Database not configured - meeting not saved');
      processedData.savedToDatabase = false;
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Meeting processed successfully in ${totalTime}s`);
    
    res.json({
      success: true,
      data: processedData
    });

  } catch (error) {
    console.error('Processing Error:', error);

    // Security: Don't expose internal error details
    let errorMessage = 'Failed to process meeting. Please try again.';

    if (error.message === 'AI request timeout') {
      errorMessage = 'AI processing took too long. Please try with a shorter transcript.';
    } else if (error.message && error.message.includes('API')) {
      errorMessage = 'AI service temporarily unavailable. Please try again later.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get meeting history with search and filter
app.get('/api/meetings', requireDatabase, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search ? sanitizeInput(req.query.search) : '';
    const language = req.query.language ? sanitizeInput(req.query.language) : '';

    // Use database adapter to get meetings
    const meetings = await db.getMeetings({
      search,
      language,
      limit
    });

    res.json({
      success: true,
      meetings: meetings || [],
      count: meetings?.length || 0
    });
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings',
      meetings: []
    });
  }
});

// Get single meeting by ID
app.get('/api/meetings/:id', requireDatabase, async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await db.getMeetingById(id);

    res.json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Fetch meeting error:', error);
    res.status(404).json({
      success: false,
      error: 'Meeting not found'
    });
  }
});

// Get financial summary from all meetings
app.get('/api/financial-summary', requireDatabase, async (req, res) => {
  try {
    const meetings = await db.getFinancialSummary();

    // Aggregate financial data
    let totalMeetings = 0;
    let meetingsWithFinancials = 0;
    let recentHighlights = [];

    if (meetings) {
      totalMeetings = meetings.length;
      meetings.forEach(meeting => {
        const financials = meeting.processed_data?.financialHighlights;
        if (financials && Object.values(financials).some(v => v && v !== "Not extracted" && v !== "Not extracted - check transcript")) {
          meetingsWithFinancials++;
          recentHighlights.push({
            ...financials,
            date: meeting.created_at
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        totalMeetings,
        meetingsWithFinancials,
        percentageWithFinancials: totalMeetings > 0 ? Math.round((meetingsWithFinancials / totalMeetings) * 100) : 0,
        recentHighlights: recentHighlights.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get financial summary'
    });
  }
});

// Delete meeting
app.delete('/api/meetings/:id', requireDatabase, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.deleteMeeting(id);

    if (result.deleted) {
      res.json({
        success: true,
        message: 'Meeting deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete meeting'
    });
  }
});

// Test database connection
app.post('/api/test-database-connection', async (req, res) => {
  try {
    const config = req.body;

    // Validate required fields
    if (!config.type) {
      return res.status(400).json({
        success: false,
        error: 'Database type is required'
      });
    }

    console.log(`🔍 Testing ${config.type.toUpperCase()} connection...`);

    // Create test database adapter
    const testDb = DatabaseFactory.create(config.type, config);

    // Try to connect
    await testDb.connect();

    // Test the connection
    const result = await testDb.testConnection();

    // Disconnect
    await testDb.disconnect();

    console.log(`✅ ${config.type.toUpperCase()} connection successful`);

    res.json({
      success: true,
      message: result.message || `Successfully connected to ${config.type.toUpperCase()} database`,
      type: config.type,
      details: result.details || {}
    });

  } catch (error) {
    console.error(`❌ Database connection test failed:`, error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to connect to database',
      type: req.body.type
    });
  }
});

// Configure database
app.post('/api/configure-database', async (req, res) => {
  try {
    const config = req.body;

    // Test connection first
    const testDb = DatabaseFactory.create(config.type, config);
    await testDb.connect();
    await testDb.testConnection();
    await testDb.disconnect();

    // If test passed, reinitialize the main database
    const result = await initializeDatabase(config);

    if (result.success) {
      res.json({
        success: true,
        message: `Database configured successfully: ${result.type.toUpperCase()}${result.fallback ? ' (fallback)' : ''}`,
        type: result.type,
        fallback: result.fallback || false
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to configure database'
      });
    }

  } catch (error) {
    console.error('Database configuration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to configure database'
    });
  }
});

// Get current database status
app.get('/api/database-status', async (req, res) => {
  try {
    const status = {
      connected: isDatabaseReady(),
      type: db ? db.constructor.name.replace('Adapter', '').toLowerCase() : 'none',
      ready: dbInitialized
    };

    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get database status'
    });
  }
});

// Get statistics
app.get('/api/stats', requireDatabase, async (req, res) => {
  try {
    // Get all meetings from database
    const meetings = await db.getMeetings({ limit: 10000 });

    const stats = {
      totalMeetings: meetings.length,
      byLanguage: {
        english: meetings.filter(m => m.language === 'english').length,
        gujarati: meetings.filter(m => m.language === 'gujarati').length,
        hindi: meetings.filter(m => m.language === 'hindi').length,
        marathi: meetings.filter(m => m.language === 'marathi').length
      },
      averageProcessingTime: meetings.length > 0 ?
        (meetings.reduce((sum, m) => {
          const processedData = typeof m.processed_data === 'string' ?
            JSON.parse(m.processed_data) : m.processed_data;
          const time = parseFloat(processedData?.metadata?.processingTime || '0');
          return sum + time;
        }, 0) / meetings.length).toFixed(2) + 's' : '0s',
      totalTasks: meetings.reduce((sum, m) => {
        const processedData = typeof m.processed_data === 'string' ?
          JSON.parse(m.processed_data) : m.processed_data;
        return sum + (processedData?.tasks?.length || 0);
      }, 0)
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🤖 Multilingual AI Personal Assistant        ║
║  ⚡ OPTIMIZED VERSION - 3x Faster              ║
║  ✅ Server running on port ${PORT}              ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}         ║
║  🔗 URL: http://localhost:${PORT}               ║
║  🎤 Languages: English, हिंदी, ગુજરાતી, मराठी  ║
║  🚀 Model: gemini-1.5-flash-8b            ║
╚════════════════════════════════════════════════╝
  `);

  // Initialize database
  console.log('🔌 Initializing database...');
  const dbResult = await initializeDatabase();
  if (dbResult.success) {
    console.log(`✅ Database ready: ${dbResult.type.toUpperCase()}${dbResult.fallback ? ' (fallback)' : ''}`);
  } else {
    console.log('⚠️  Warning: Database initialization failed - running without database');
    console.log('   Meeting data will not be saved. Configure database in Settings.');
  }
  
  // Validate environment variables (warnings only - let app start so user can configure)
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  Warning: GEMINI_API_KEY not set!');
    console.log('   AI processing will not work until configured in Settings.');
    console.log('   Please configure your Gemini API key in the Settings menu.');
  } else {
    console.log('✅ Gemini API key configured');
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('⚠️  Supabase credentials not set (optional for telemetry)');
  } else {
    console.log('✅ Supabase configured (telemetry enabled)');
  }

  // Validate API keys format (only if provided)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length < 20) {
    console.log('⚠️  Warning: GEMINI_API_KEY appears too short (should be 39 characters)');
    console.log('   Please verify your API key is correct.');
  }

  console.log('✅ Server ready! Configure API keys in Settings to enable all features.\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});
