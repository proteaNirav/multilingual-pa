// Multilingual AI Personal Assistant - Server
// Free Version using Gemini Pro AI
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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase
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

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Multilingual AI PA'
  });
});

// Process meeting transcript with AI
app.post('/api/process-meeting', async (req, res) => {
  try {
    const { transcript, language, meetingTitle } = req.body;

    if (!transcript || !language) {
      return res.status(400).json({ 
        success: false,
        error: 'Transcript and language are required' 
      });
    }

    console.log(`Processing meeting: "${meetingTitle}" in ${language}...`);
    console.log(`Transcript length: ${transcript.length} characters`);

    // Create AI prompt
    const prompt = `
You are an AI assistant specialized in processing business meeting transcripts in Indian languages.

MEETING LANGUAGE: ${language}
TRANSCRIPT:
${transcript}

Analyze this transcript and provide a JSON response with this EXACT structure:
{
  "executiveSummary": "A concise 2-3 sentence summary in English",
  "keyPoints": {
    "english": ["Point 1 in English", "Point 2 in English", "Point 3 in English"],
    "native": ["Point 1 in ${language}", "Point 2 in ${language}", "Point 3 in ${language}"]
  },
  "decisions": ["Decision 1", "Decision 2"],
  "risks": ["Risk 1", "Risk 2"],
  "tasks": [
    {
      "task": "Task description",
      "owner": "Person responsible",
      "priority": "High",
      "type": "financial",
      "dueDate": "2025-10-15"
    }
  ],
  "financialHighlights": {
    "revenue": "₹2.5 crores mentioned",
    "expenses": "₹45 lakhs pending",
    "pendingPayments": "₹45 lakhs due Oct 3rd",
    "budgetApprovals": "2 new hires approved"
  },
  "nextSteps": ["Next step 1", "Next step 2"],
  "attendees": ["Person 1", "Person 2"]
}

IMPORTANT:
1. Extract ALL financial figures in Indian Rupees (₹)
2. Identify specific deadlines and dates
3. Assign priority levels: High, Medium, or Low
4. Include both English and native language key points
5. Return ONLY valid JSON, no markdown, no explanation
`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let processedData;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      processedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('AI Response:', text);
      
      // Fallback structure
      processedData = {
        executiveSummary: "Meeting processed. AI response could not be parsed completely.",
        keyPoints: {
          english: [
            "Meeting transcript captured successfully",
            "Action items identified",
            "Follow-up required"
          ],
          native: [
            "मीटिंग ट्रांसक्रिप्ट सफलतापूर्वक कैप्चर किया गया",
            "कार्य आइटम पहचाने गए",
            "फॉलो-अप आवश्यक"
          ]
        },
        decisions: ["Please review transcript for details"],
        risks: [],
        tasks: [{
          task: "Review meeting transcript manually",
          owner: "Team Lead",
          priority: "Medium",
          type: "administrative",
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        }],
        financialHighlights: {
          revenue: "Not extracted",
          expenses: "Not extracted",
          pendingPayments: "Not extracted",
          budgetApprovals: "Not extracted"
        },
        nextSteps: ["Review raw transcript", "Extract action items"],
        attendees: []
      };
    }

    // Add metadata
    processedData.metadata = {
      meetingTitle: meetingTitle || 'Team Meeting',
      language: language,
      processedAt: new Date().toISOString(),
      transcriptLength: transcript.length,
      aiModel: 'gemini-pro'
    };

    // Save to Supabase database
    try {
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
        console.error('Database save error:', error);
        processedData.savedToDatabase = false;
      } else {
        console.log('Meeting saved to database with ID:', data[0]?.id);
        processedData.savedToDatabase = true;
        processedData.meetingId = data[0]?.id;
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      processedData.savedToDatabase = false;
    }

    console.log('Meeting processed successfully');
    
    res.json({
      success: true,
      data: processedData
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
      .select('id, title, language, created_at, processed_data')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      meetings: data || [],
      count: data?.length || 0
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
app.get('/api/meetings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      meeting: data
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
app.get('/api/financial-summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('processed_data')
      .not('processed_data', 'is', null);

    if (error) {
      throw error;
    }

    // Aggregate financial data
    let totalMeetings = 0;
    let meetingsWithFinancials = 0;
    let recentHighlights = [];

    if (data) {
      totalMeetings = data.length;
      data.forEach(meeting => {
        const financials = meeting.processed_data?.financialHighlights;
        if (financials && Object.values(financials).some(v => v && v !== "Not extracted")) {
          meetingsWithFinancials++;
          recentHighlights.push(financials);
        }
      });
    }

    res.json({ 
      success: true, 
      data: {
        totalMeetings,
        meetingsWithFinancials,
        recentHighlights: recentHighlights.slice(0, 5)
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
app.delete('/api/meetings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete meeting'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🤖 Multilingual AI Personal Assistant        ║
║  ✅ Server running on port ${PORT}              ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}         ║
║  🔗 URL: http://localhost:${PORT}               ║
║  🎤 Languages: English, हिंदी, ગુજરાતી, मराठी  ║
╚════════════════════════════════════════════════╝
  `);
  
  // Check if environment variables are set
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not set!');
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️  WARNING: Supabase credentials not set!');
  }
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
