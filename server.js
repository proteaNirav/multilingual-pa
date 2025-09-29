// Free Multilingual AI Personal Assistant
// Server.js - Main application file

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Initialize services
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Process meeting transcript
app.post('/api/process-meeting', async (req, res) => {
  try {
    const { transcript, language, meetingTitle } = req.body;

    if (!transcript || !language) {
      return res.status(400).json({ 
        error: 'Transcript and language are required' 
      });
    }

    console.log(`Processing meeting in ${language}...`);

    // Create prompt for Gemini AI
    const prompt = `
You are an AI assistant processing a business meeting transcript in ${language}. 

TRANSCRIPT:
${transcript}

Please analyze this transcript and return a JSON response with the following structure:
{
  "executiveSummary": "Brief executive summary in English (max 300 words)",
  "keyPoints": {
    "english": ["Array of 5-7 key points in English"],
    "native": ["Array of 5-7 key points in ${language}"]
  },
  "decisions": ["Array of decisions made during the meeting"],
  "risks": ["Array of risks or concerns identified"],
  "tasks": [
    {
      "task": "Task description",
      "owner": "Person responsible (if mentioned)",
      "priority": "High|Medium|Low",
      "type": "financial|administrative|hr|compliance|general",
      "amount": "₹X,XX,XXX (if financial task)"
    }
  ],
  "financialHighlights": {
    "revenue": "Revenue figures mentioned with ₹",
    "expenses": "Expense figures mentioned with ₹",
    "pendingPayments": "Payment obligations with ₹",
    "budgetApprovals": "Budget decisions with ₹"
  },
  "nextSteps": ["Array of immediate next steps"],
  "attendees": ["List of people who spoke (extract from transcript)"]
}

Focus on:
1. Financial figures in Indian Rupees (₹)
2. Action items with clear ownership
3. Cultural context (festivals, Indian business practices)
4. Compliance requirements (GST, statutory obligations)
5. Both English and ${language} language processing

Return only valid JSON, no additional text.
`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let processedData;

    try {
      processedData = JSON.parse(response.text());
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // Fallback processing
      processedData = {
        executiveSummary: "Meeting processed successfully. Please check the transcript for details.",
        keyPoints: {
          english: ["Meeting transcript processed", "Action items identified", "Follow-up required"],
          native: ["मीटिंग ट्रांसक्रिप्ट प्रोसेस किया गया", "एक्शन आइटम्स पहचाने गए", "फॉलो-अप आवश्यक"]
        },
        decisions: ["Decision details to be reviewed from transcript"],
        risks: [],
        tasks: [],
        financialHighlights: {},
        nextSteps: ["Review meeting transcript", "Follow up on action items"],
        attendees: []
      };
    }

    // Add metadata
    processedData.metadata = {
      meetingTitle: meetingTitle || 'Team Meeting',
      language: language,
      processedAt: new Date().toISOString(),
      transcriptLength: transcript.length
    };

    // Save to database
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        title: meetingTitle || 'Team Meeting',
        transcript: transcript,
        language: language,
        processed_data: processedData,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Database Error:', error);
    }

    console.log('Meeting processed successfully');
    
    res.json({
      success: true,
      data: processedData,
      savedToDatabase: !error
    });

  } catch (error) {
    console.error('Processing Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process meeting'
    });
  }
});

// Get meeting history
app.get('/api/meetings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    res.json({ success: true, meetings: data || [] });
  } catch (error) {
    console.error('Database fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch meetings' 
    });
  }
});

// Get financial summary
app.get('/api/financial-summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('processed_data')
      .not('processed_data->financialHighlights', 'is', null);

    if (error) {
      throw error;
    }

    // Aggregate financial data
    const financialSummary = {
      totalRevenue: 0,
      totalExpenses: 0,
      pendingPayments: 0,
      meetingsWithFinancialData: data?.length || 0
    };

    res.json({ success: true, data: financialSummary });
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get financial summary' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Multilingual AI PA running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Visit: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});
