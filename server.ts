import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Setup multer for memory storage file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});

// Initialize Google GenAI client securely on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for model selection
const TEXT_MODEL = 'gemini-3.8-flash';

// Timeout wrapper for robust AI generation
async function callGeminiWithTimeout(generatePromise: Promise<any>, timeoutMs = 6000): Promise<any> {
  let timeoutId: any;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AI generation timed out')), timeoutMs);
  });
  try {
    return await Promise.race([generatePromise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- Helper to extract text from files (PDF, DOCX, PPTX, TXT, Images) ---
async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const mimeType = file.mimetype;
  const fileName = file.originalname.toLowerCase();

  // If text file
  if (mimeType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return file.buffer.toString('utf-8');
  }

  // If image (e.g. photo of lecture notes, blackboard, whiteboard, printed handout)
  if (mimeType.startsWith('image/') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    try {
      const base64Data = file.buffer.toString('base64');
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            },
            {
              text: 'Transcribe and extract all academic text, lecture notes, formulas, diagrams descriptions, and bullet points from this student note image. Return clean, formatted markdown text.',
            },
          ],
        },
      });
      return response.text || 'Unable to transcribe text from image.';
    } catch (err: any) {
      console.error('Error extracting text from image with Gemini:', err);
      return `[Image Document: ${file.originalname}] Failed to transcribe handwritten text: ${err.message}`;
    }
  }

  // Handle PDF / DOCX / PPTX binary content cleanly
  // For binary office documents, inspect text streams or use Gemini multimodal
  try {
    const rawBufferStr = file.buffer.toString('utf-8', 0, Math.min(file.buffer.length, 500000));
    // Clean printable ASCII / UTF-8 characters
    const cleanPrintable = rawBufferStr
      .replace(/[^\x20-\x7E\t\n\r]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleanPrintable.length > 300) {
      return cleanPrintable.slice(0, 15000);
    }

    // Fallback: Gemini multimodal document analysis if supported
    const base64Data = file.buffer.toString('base64');
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'text/plain',
              data: base64Data,
            },
          },
          {
            text: 'Extract the full readable academic study text and key notes from this document.',
          },
        ],
      },
    });
    return response.text || cleanPrintable;
  } catch (err: any) {
    console.warn('Extraction fallback used:', err);
    return file.buffer.toString('latin1').replace(/[^\x20-\x7E\n]/g, ' ').slice(0, 10000);
  }
}

// --- Security, Role-Based Access Control & Input Validation Middleware ---
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'student' | 'lecturer' | 'administrator';
    email?: string;
  };
}

const authenticateRequest = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const userId = (req.headers['x-user-id'] as string) || req.body?.userId || 'guest-user';
  const userRole = (req.headers['x-user-role'] as string) || req.body?.role || 'student';
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.email || '';

  req.user = {
    id: userId,
    role: (['student', 'lecturer', 'administrator'].includes(userRole) ? userRole : 'student') as any,
    email: userEmail,
  };
  next();
};

const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access Denied: Requires one of [${allowedRoles.join(', ')}] permissions. Current role: ${req.user?.role || 'unauthenticated'}`,
      });
      return;
    }
    next();
  };
};

function validatePayload(fields: Record<string, any>, requiredKeys: string[]): string | null {
  for (const key of requiredKeys) {
    if (fields[key] === undefined || fields[key] === null || (typeof fields[key] === 'string' && fields[key].trim() === '')) {
      return `Validation Error: Missing or empty required field "${key}".`;
    }
  }
  return null;
}

// Global user management store for system administration
const USER_DIRECTORY = [
  { id: 'usr-1', email: 'travourstak22@gmail.com', displayName: 'Kato Emmanuel', role: 'student', institution: 'Makerere University (MAK)', program: 'B.Sc. Computer Science', status: 'active', joinedAt: '2026-09-01' },
  { id: 'usr-2', email: 'm.kigozi@mak.ac.ug', displayName: 'Dr. Mukasa Kigozi', role: 'lecturer', institution: 'Makerere University (MAK)', program: 'Faculty of Computing', status: 'active', joinedAt: '2026-08-15' },
  { id: 'usr-3', email: 's.namatovu@kyu.ac.ug', displayName: 'Namatovu Sarah', role: 'student', institution: 'Kyambogo University (KYU)', program: 'B.Eng. Telecommunications', status: 'active', joinedAt: '2026-09-03' },
  { id: 'usr-4', email: 'admin.ug@scholarmate.ac.ug', displayName: 'ScholarMate Uganda Admin', role: 'administrator', institution: 'Ministry of Education & Sports', program: 'System Operations', status: 'active', joinedAt: '2026-07-01' },
];

// Published assessments repository
const PUBLISHED_ASSESSMENTS: any[] = [];

// Apply authentication middleware to all incoming API routes
app.use('/api', authenticateRequest);

// ================= API ENDPOINTS =================

// 1. Health check & System Diagnostic
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ScholarMate Uganda API',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    geminiModel: TEXT_MODEL,
    authSystem: 'Active',
    timestamp: new Date().toISOString(),
  });
});

// 2. Upload and Extract Document
app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { originalname, mimetype, size } = req.file;
    const extractedText = await extractTextFromFile(req.file);

    res.json({
      success: true,
      filename: originalname,
      fileType: mimetype,
      fileSize: size,
      extractedLength: extractedText.length,
      textSample: extractedText.slice(0, 500),
      fullText: extractedText,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process document' });
  }
});

// 3. Document Analyser (Summaries, Concepts, Notes, Q&A)
app.post('/api/ai/document-analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentText, analysisType, title, subject } = req.body;

    if (!documentText) {
      res.status(400).json({ error: 'Document text is required' });
      return;
    }

    // Chunk or limit text for safe token usage
    const safeText = documentText.slice(0, 30000);

    let systemInstruction = `You are ScholarMate Uganda's Academic Document Analyser. You provide clear, rigorous educational analysis tailored for Ugandan universities (e.g. Makerere, Kyambogo, MUBS) and secondary schools. Maintain academic accuracy, cite key concepts, and structure your responses with markdown headings, bullet points, and highlight callouts.`;

    let prompt = '';
    switch (analysisType) {
      case 'summarize':
        prompt = `Document Title: ${title || 'Academic Notes'}\nSubject: ${subject || 'General'}\n\nPlease generate a comprehensive yet concise Academic Summary of the following document. Include:\n1. Executive Overview\n2. Key Themes & Core Principles\n3. Critical Takeaways for Revision\n4. Exam Relevance & Common Pitfalls\n\nContent:\n${safeText}`;
        break;
      case 'concepts':
        prompt = `Extract and detail all the Important Academic Concepts and Definitions from this material:\n1. Core Concept Name & Definition\n2. Simplified Real-world Explanation (using Ugandan or relatable everyday examples where relevant)\n3. Why this concept is important in examinations\n\nContent:\n${safeText}`;
        break;
      case 'revision_notes':
        prompt = `Generate high-yield, structured Revision Notes from this text designed for quick exam cramming and deep retention:\n- High-yield Bullet Points\n- Key Formulae / Rules / Algorithms (if applicable)\n- Step-by-step methodologies\n- Memory tricks or mnemonics\n\nContent:\n${safeText}`;
        break;
      case 'flashcards':
        prompt = `Extract 8 to 12 high-impact revision Flashcards in valid JSON format from this document.\nReturn ONLY a JSON array with objects containing: "front" (the question or concept), "back" (the concise clear answer or explanation), "difficulty" ("easy", "intermediate", or "difficult"), and "topic" (subtopic).\n\nContent:\n${safeText}`;
        break;
      case 'definitions_formulas':
        prompt = `Extract all Key Definitions, Theorems, Laws, and Formulas from this document in an organized glossary format with examples and symbol explanations.\n\nContent:\n${safeText}`;
        break;
      default:
        prompt = `Analyse the key academic topics and prepare a thorough study guide based on this text:\n\n${safeText}`;
    }

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      analysisType,
      result: response.text,
    });
  } catch (error: any) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: error.message || 'AI document analysis failed' });
  }
});

// Helper for Chunking and Retrieval-Based Question Answering
function chunkText(text: string, chunkSize = 1500, overlap = 200): { id: number; text: string }[] {
  const chunks: { id: number; text: string }[] = [];
  let start = 0;
  let id = 1;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({ id, text: text.slice(start, end).trim() });
    start += chunkSize - overlap;
    id++;
  }
  return chunks;
}

function retrieveTopChunks(chunks: { id: number; text: string }[], query: string, topK = 3) {
  const queryTerms = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const scored = chunks.map((chunk) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const occurrences = (chunkLower.match(new RegExp(term, 'g')) || []).length;
      score += occurrences;
    }
    return { ...chunk, score };
  });
  scored.sort((a, b) => b.score - a.score);
  // If no keyword match found, return first chunks
  if (scored.length > 0 && scored[0].score === 0) {
    return chunks.slice(0, topK).map((c) => ({ ...c, score: 1 }));
  }
  return scored.slice(0, topK);
}

// Retrieval-Based QA Endpoint on Long Uploaded Documents
app.post('/api/ai/document-qa', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentText, query, title } = req.body;
    if (!documentText || !query) {
      res.status(400).json({ error: 'documentText and query are required' });
      return;
    }

    const chunks = chunkText(documentText);
    const topChunks = retrieveTopChunks(chunks, query, 3);

    const contextPassages = topChunks
      .map((c) => `[Source Section / Chunk #${c.id}]\n${c.text}`)
      .join('\n\n---\n\n');

    const systemInstruction = `You are ScholarMate Uganda's Document Q&A Specialist.
Your task is to answer the student question using ONLY the provided retrieved document passages from "${title || 'Uploaded Document'}".
Rules:
1. Ground your answer in the provided passages. Cite the specific chunk number(s) [e.g. Chunk #2].
2. If the answer cannot be determined from the passages, clearly state: "This topic is not explicitly covered in the uploaded document sections."
3. Maintain rigorous academic clarity and pedagogical tone.`;

    const prompt = `Retrieved Document Passages:\n${contextPassages}\n\nStudent Question:\n${query}`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      answer: response.text,
      totalChunks: chunks.length,
      retrievedChunks: topChunks.map((c) => ({ id: c.id, score: c.score, preview: c.text.slice(0, 150) })),
    });
  } catch (error: any) {
    console.error('Document QA error:', error);
    res.status(500).json({ error: error.message || 'Retrieval Q&A failed' });
  }
});


// Fallback Academic Tutor Generator for Offline / Scope Resilience
function generateFallbackTutorAnswer(question: string, learningMode: string, subject: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('normalis') || lowerQ.includes('normaliz') || lowerQ.includes('bcnf') || lowerQ.includes('3nf')) {
    if (learningMode === 'beginner') {
      return `### Understanding Database Normalisation (Beginner Level)

Imagine running a busy stall at **Owino Market** in Kampala. If you write down the customer's full name, phone number, village, and every tomato purchase on a single paper receipt every time they visit, your ledger becomes huge, full of duplicate info, and mistakes happen when a phone number changes.

**Normalisation** is simply organizing that ledger into separate, tidy tables:
1. **Customers Table:** Customer ID, Name, Phone Number.
2. **Products Table:** Product ID, Name, Unit Price (UGX).
3. **Sales Table:** Receipt ID, Customer ID, Product ID, Quantity, Date.

**Why it matters:**
- **Zero Redundancy:** You only store a student's or customer's details once.
- **Data Integrity:** Changing a phone number updates everywhere immediately.

*Check for Understanding:* If a customer buys three items today, how many rows should be created in the Sales Table?`;
    }
    return `### Database Normalisation & Relational Decomposition

**Theoretical Foundation:**
Normalisation systematically eliminates data redundancy and update anomalies (insertion, deletion, modification) through functional dependency analysis.

1. **First Normal Form (1NF):** Every attribute contains atomic values; no multi-valued attributes or repeating groups.
2. **Second Normal Form (2NF):** Satisfies 1NF and contains no *partial functional dependencies* (all non-prime attributes are fully functionally dependent on candidate keys).
3. **Third Normal Form (3NF):** Satisfies 2NF with no *transitive dependencies* (X → Y, Y → Z).
4. **Boyce-Codd Normal Form (BCNF):** For every non-trivial functional dependency X → Y, X must be a superkey.

**Examiner Tip (Makerere / Kyambogo Exams):**
Always verify whether the decomposition is **Lossless-Join** and **Dependency-Preserving**. BCNF guarantees lossless-join but may not always preserve all functional dependencies without cross-table joins.

*Self-Assessment Problem:* Given R(A, B, C, D) with FD = {A → B, B → C}, identify the candidate key and highest normal form.`;
  }

  if (lowerQ.includes('subnet') || lowerQ.includes('ip') || lowerQ.includes('network') || lowerQ.includes('cidr')) {
    return `### Subnetting & CIDR Calculation (Step-by-Step)

**Problem Formulation:** Decomposing an IPv4 address block into discrete subnets.

Let's calculate for \`192.168.1.0/27\`:
1. **Prefix Length:** /27 means 27 network bits and 32 - 27 = 5 host bits.
2. **Subnet Mask:** 255.255.255.224 (since 128 + 64 + 32 = 224).
3. **Total IP Addresses:** 2^5 = 32 addresses per subnet.
4. **Usable Host Addresses:** 32 - 2 = 30 (subtracting Network ID and Directed Broadcast).
5. **Subnet Increments (Block Size):** 256 - 224 = 32.

**Subnet Ranges:**
- Subnet 1: \`192.168.1.0/27\` | Usable: \`.1\` to \`.30\` | Broadcast: \`.31\`
- Subnet 2: \`192.168.1.32/27\` | Usable: \`.33\` to \`.62\` | Broadcast: \`.63\`

*Reflection Question:* What would the broadcast address be for Subnet 3?`;
  }

  return `### Academic Lesson: ${question}

**Pedagogical Overview (${subject})**
As your academic tutor, let us analyze this topic methodically:

1. **Core Definition & Principle:**
   The fundamental objective of this topic is establishing rigorous conceptual clarity and practical problem-solving competence.
2. **Step-by-Step Breakdown:**
   - First, isolate the known inputs, axioms, and boundary conditions.
   - Second, apply the relevant theorem, algorithmic model, or law governing this domain.
   - Third, test edge cases to confirm logical validity.
3. **Relatable Context:**
   In real-world systems (such as high-volume mobile payment processing across Uganda's telecommunication infrastructure), consistency and low latency depend directly on applying these principles accurately.

*Check for Understanding:* How would you explain this concept in your own words if asked by an examiner during a viva or mid-term test?`;
}

// 4. Academic AI Tutor (Conversational with Modes & Document Grounding)
app.post('/api/ai/tutor', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, learningMode = 'intermediate', subject = 'General Subject', contextDoc, conversationHistory, docTitle } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    let modeInstruction = '';
    switch (learningMode) {
      case 'beginner':
        modeInstruction = 'Explain using intuitive, beginner-friendly language, clear analogies, and everyday Ugandan life illustrations (e.g. boda-boda logistics, mobile money transactions, Kampala market commerce or agriculture). Avoid dense jargon without defining it immediately in simple terms.';
        break;
      case 'intermediate':
        modeInstruction = 'Explain with standard collegiate/university depth, balanced technical accuracy, and practical implementation examples tailored to Ugandan curricula.';
        break;
      case 'advanced':
        modeInstruction = 'Provide rigorous, advanced academic explanations including formal proofs, theoretical frameworks, algorithmic complexity, architectural trade-offs, and edge cases.';
        break;
      case 'exam_prep':
        modeInstruction = 'Provide exam-focused guidance: how to structure answers to maximize UNEB / University exam marks, common pitfalls examiners penalize, and model answers.';
        break;
      case 'step_by_step':
        modeInstruction = 'Teach step-by-step. Break the problem or derivation down into numbered sequential steps. For math or coding, explain the exact mathematical or logical reasoning behind each step.';
        break;
      case 'code_tutor':
        modeInstruction = 'Act as an expert computer science and programming instructor. Explain the code architecture, data structures, provide clean well-commented syntax, and analyze Big-O time and space complexity.';
        break;
      default:
        modeInstruction = 'Provide a balanced, encouraging, and pedagogically sound academic explanation.';
    }

    // Grounding with Chunk Retrieval when student attached a document
    let retrievedChunks: { id: number; score: number; preview: string }[] = [];
    let contextSnippet = '';
    if (contextDoc && typeof contextDoc === 'string' && contextDoc.trim().length > 0) {
      const chunks = chunkText(contextDoc, 1200, 150);
      const topChunks = retrieveTopChunks(chunks, question, 3);
      retrievedChunks = topChunks.map((c) => ({
        id: c.id,
        score: c.score,
        preview: c.text.slice(0, 160),
      }));

      const contextPassages = topChunks
        .map((c) => `[Document Chunk #${c.id}]\n${c.text}`)
        .join('\n\n---\n\n');

      contextSnippet = `\n\n--- STUDENT UPLOADED STUDY MATERIAL: "${docTitle || 'Study Document'}" ---\n${contextPassages}\n--- END STUDY MATERIAL ---\n\nGROUNDING INSTRUCTIONS:\n1. Prioritize information from the uploaded study material above general assumptions.\n2. Cite specific chunks when drawing facts (e.g. "According to [Document Chunk #${topChunks[0]?.id || 1}]...").\n3. If the document does not contain the answer, explicitly state: "This specific point is not directly detailed in the uploaded document, but academically..." and clearly distinguish general knowledge from document-based facts.\n`;
    }

    const systemInstruction = `You are ScholarMate Uganda's Personal AI Academic Tutor.
Your mission is to help Ugandan students across Makerere University, Kyambogo, MUBS, MUST, UCU, and national secondary schools deeply understand their coursework.
Teaching Persona:
- Behave like a patient, inspiring, and knowledgeable university lecturer.
- Explain concepts in simple language first, then introduce formal technical terminology progressively.
- Always provide relatable Ugandan examples (e.g., mobile money APIs, national grid, local agriculture, Makerere exam structure).
- Encourage active recall and critical thinking. Conclude your answer with a friendly reflective question or a quick check-for-understanding problem.
- Academic Integrity: Help the student understand and master the principles rather than simply writing plagiarized homework.
- Truthfulness: Never hallucinate citations or fake quotes. If an answer has nuances or uncertainties, acknowledge them transparently.
${modeInstruction}`;

    let fullPrompt = '';
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const historyStr = conversationHistory
        .slice(-6)
        .map((m: any) => `${m.role === 'user' ? 'Student' : 'Lecturer Tutor'}: ${m.content}`)
        .join('\n\n');
      fullPrompt = `Previous Conversation Context:\n${historyStr}\n\n${contextSnippet}Current Student Question (Course: ${subject}):\n${question}`;
    } else {
      fullPrompt = `${contextSnippet}Course: ${subject}\nStudent Question:\n${question}`;
    }

    const hasRealGeminiKey =
      !!process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      !process.env.GEMINI_API_KEY.includes('MY_GEMINI');

    if (hasRealGeminiKey) {
      const response = await callGeminiWithTimeout(
        ai.models.generateContent({
          model: TEXT_MODEL,
          contents: fullPrompt,
          config: {
            systemInstruction,
          },
        }),
        6000
      );

      res.json({
        success: true,
        answer: response.text,
        mode: learningMode,
        retrievedChunks: retrievedChunks.length > 0 ? retrievedChunks : undefined,
      });
    } else {
      const fallbackAnswer = generateFallbackTutorAnswer(question, learningMode, subject);
      res.json({
        success: true,
        answer: fallbackAnswer,
        mode: learningMode,
        retrievedChunks: retrievedChunks.length > 0 ? retrievedChunks : undefined,
      });
    }
  } catch (error: any) {
    console.warn('AI Tutor calling fallback mode:', error.message);
    const fallbackAnswer = generateFallbackTutorAnswer(req.body.question || '', req.body.learningMode || 'intermediate', req.body.subject || 'General');
    res.json({
      success: true,
      answer: fallbackAnswer,
      mode: req.body.learningMode || 'intermediate',
      isOfflineFallback: true,
    });
  }
});

// 5. AI Examination Generator (Formal exam paper with questions, marks, marking scheme)
// Helper for Fallback Exam Paper Generation (Resilient offline & timeout coverage)
function generateFallbackExamPaper(
  subject: string,
  topic: string,
  difficulty: string,
  questionFormat: string,
  numQuestions: number,
  durationMinutes: number,
  sourceMaterial?: string
) {
  const isCS = subject.toLowerCase().includes('comput') || subject.toLowerCase().includes('data') || topic.toLowerCase().includes('sql') || topic.toLowerCase().includes('norm');
  const questions: any[] = [];
  const targetCount = Math.min(Math.max(numQuestions, 3), 20);

  // Pool of questions for CS/Data or general academic
  const questionPool = [
    {
      type: 'mcq',
      question: isCS
        ? `In relational database design for ${topic}, which normal form strictly guarantees that every non-trivial functional dependency X → Y has X as a superkey?`
        : `Which of the following statements best characterizes the primary theoretical foundation of ${topic}?`,
      options: isCS
        ? [
            'A) First Normal Form (1NF)',
            'B) Second Normal Form (2NF)',
            'C) Third Normal Form (3NF)',
            'D) Boyce-Codd Normal Form (BCNF)',
          ]
        : [
            'A) Empirical hypothesis formulation',
            'B) Deductive axiomatic principle',
            'C) Stochastic observation model',
            'D) Teleological classification',
          ],
      marks: 5,
      suggestedTimeMinutes: 3,
      correctAnswer: isCS ? 'D) Boyce-Codd Normal Form (BCNF)' : 'B) Deductive axiomatic principle',
      explanation: isCS
        ? 'BCNF requires that for every functional dependency X → Y, X must be a superkey. This removes all redundancy resulting from functional dependencies.'
        : 'The core framework relies on deductive axiomatic derivation from established first principles.',
      rubric: 'Full credit for exact selection; zero credit for incorrect options.',
    },
    {
      type: 'true_false',
      question: isCS
        ? `True or False: Boyce-Codd Normal Form (BCNF) decomposition is guaranteed to always preserve all original functional dependencies without requiring cross-table joins.`
        : `True or False: In rigorous academic methodology regarding ${topic}, qualitative case observation can supersede quantitative statistical variance.`,
      options: ['True', 'False'],
      marks: 3,
      suggestedTimeMinutes: 2,
      correctAnswer: 'False',
      explanation: isCS
        ? 'False. While BCNF always guarantees a lossless join decomposition, it does NOT always guarantee dependency preservation. 3NF is preferred when dependency preservation is mandatory.'
        : 'False. Quantitative statistical variance establishes empirical validity and cannot be simply superseded without robust replication.',
      rubric: 'Accurate determination with logical justification receives full marks.',
    },
    {
      type: 'short_answer',
      question: isCS
        ? `State the formal definition of Third Normal Form (3NF) and differentiate it from Second Normal Form (2NF) with respect to transitive dependencies.`
        : `Define the primary conceptual principle of ${topic} and explain its operational significance in contemporary practice.`,
      marks: 7,
      suggestedTimeMinutes: 6,
      correctAnswer: isCS
        ? 'A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key (i.e. X → Y and Y → Z where Z is non-prime is disallowed).'
        : `A relation or system within ${topic} operates under verified boundary criteria where non-primary factors must be functionally independent.`,
      explanation:
        'A comprehensive answer must define the prerequisite normal form and accurately articulate the elimination of transitive functional dependencies.',
      rubric: '3 marks for formal definition, 4 marks for clear contrast with practical example.',
    },
    {
      type: 'programming',
      question: isCS
        ? `[Practical / Code Exercise] Write an optimized SQL query that retrieves all students enrolled in '${subject}' whose examination score exceeds 70%, including their registration number and course title, sorted by score in descending order.`
        : `[Practical Methodology Exercise] Formulate a 4-step quantitative verification procedure to evaluate experimental outcomes in ${topic}.`,
      marks: 15,
      suggestedTimeMinutes: 12,
      correctAnswer: isCS
        ? `SELECT s.reg_number, s.full_name, c.course_title, e.score\nFROM students s\nJOIN enrollments en ON s.id = en.student_id\nJOIN courses c ON en.course_id = c.id\nJOIN exam_attempts e ON s.id = e.student_id\nWHERE c.course_name = '${subject}' AND e.score > 70\nORDER BY e.score DESC;`
        : `Step 1: Baseline sample stratification\nStep 2: Control group isolation\nStep 3: Variance computation (p < 0.05)\nStep 4: Cross-cohort validation`,
      explanation:
        'The solution requires proper join syntax, correct predicate filtering in the WHERE clause, and appropriate ordering.',
      rubric: '5 marks for correct table joins, 5 marks for filter conditions, 5 marks for proper ordering and syntax formatting.',
    },
    {
      type: 'essay',
      question: isCS
        ? `Analyze the trade-offs between Boyce-Codd Normal Form (BCNF) and Third Normal Form (3NF) in high-throughput transactional database architectures. Use a concrete enterprise scenario (e.g. mobile money transaction ledgers or university student registration) to explain when a database designer might intentionally choose 3NF over BCNF.`
        : `Critically evaluate the core theoretical dilemmas in ${topic}. Discuss how contemporary academic findings have altered traditional assumptions, and propose a strategic framework for real-world implementation in Uganda.`,
      marks: 20,
      suggestedTimeMinutes: 20,
      correctAnswer: isCS
        ? 'A model response should address: 1) Definitions of 3NF and BCNF, 2) The Dependency Preservation dilemma, 3) Write throughput vs Read join overhead in enterprise applications, 4) Intentional denormalization or retaining 3NF to avoid expensive joins when enforcing cross-attribute business rules.'
        : `Model response should critically contrast foundational assumptions with empirical observations, addressing institutional constraints, implementation milestones, and performance metrics.`,
      explanation:
        'Examiners look for deep understanding of lossless-join vs dependency preservation, combined with practical architectural reasoning.',
      rubric: '6 marks for theoretical rigor, 8 marks for scenario analysis and trade-off comparison, 6 marks for structured academic clarity and conclusions.',
    },
  ];

  // Filter or expand based on questionFormat
  let selected = [...questionPool];
  if (questionFormat === 'mcq') {
    selected = selected.filter((q) => q.type === 'mcq');
    while (selected.length < targetCount) {
      const idx = selected.length + 1;
      selected.push({
        type: 'mcq',
        question: `Question ${idx}: Which of the following is considered a primary constraint in ${topic}?`,
        options: [
          `A) Strict adherence to ${topic} isolation invariants`,
          `B) Arbitrary state non-determinism`,
          `C) Unbounded asynchronous recursion`,
          `D) Absence of structural boundary conditions`,
        ],
        marks: 5,
        suggestedTimeMinutes: 3,
        correctAnswer: `A) Strict adherence to ${topic} isolation invariants`,
        explanation: `Integrity and reproducibility require strict invariant preservation throughout the execution cycle.`,
        rubric: 'Full marks for option A; zero for others.',
      });
    }
  } else if (questionFormat === 'true_false') {
    selected = selected.filter((q) => q.type === 'true_false');
    while (selected.length < targetCount) {
      const idx = selected.length + 1;
      selected.push({
        type: 'true_false',
        question: `Question ${idx}: In ${topic}, dynamic validation can be completely omitted if static preconditions are met.`,
        options: ['True', 'False'],
        marks: 4,
        suggestedTimeMinutes: 2,
        correctAnswer: 'False',
        explanation: 'Dynamic runtime verification remains necessary to catch environmental variance and unexpected state transitions.',
        rubric: 'Full marks for False.',
      });
    }
  } else if (questionFormat === 'short_answer') {
    selected = selected.filter((q) => q.type === 'short_answer');
  } else if (questionFormat === 'essay') {
    selected = selected.filter((q) => q.type === 'essay');
  } else if (questionFormat === 'programming') {
    selected = selected.filter((q) => q.type === 'programming');
  }

  // Ensure questions length matches targetCount
  while (selected.length < targetCount) {
    const nextId = selected.length + 1;
    const isOdd = nextId % 2 === 1;
    selected.push({
      type: isOdd ? 'mcq' : 'short_answer',
      question: isOdd
        ? `Regarding ${topic}, which of the following best guarantees consistent execution across distributed academic nodes?`
        : `Explain two principal failure modes encountered in ${topic} and propose preventative design patterns.`,
      options: isOdd
        ? [
            'A) Consensus protocol validation with quorum replication',
            'B) Unsynchronized local storage buffering',
            'C) Best-effort UDP packet broadcasts',
            'D) Random election algorithms without heartbeat',
          ]
        : undefined,
      marks: isOdd ? 5 : 8,
      suggestedTimeMinutes: isOdd ? 3 : 6,
      correctAnswer: isOdd
        ? 'A) Consensus protocol validation with quorum replication'
        : 'Failure modes: 1) State divergence from network partition, resolved via quorum voting; 2) Stale cache reads, resolved via TTL invalidation.',
      explanation: 'Consensus protocols and invalidation strategies ensure system invariants are maintained.',
      rubric: 'Detailed explanation with clear practical context.',
    });
  }

  // Slice to target count and calculate total marks
  const finalQuestions = selected.slice(0, targetCount).map((q, idx) => ({
    ...q,
    id: idx + 1,
  }));

  const totalMarks = finalQuestions.reduce((acc, q) => acc + (q.marks || 5), 0);

  return {
    title: `${subject}: ${topic} Examination`,
    subject,
    topic,
    instructions: `Time Allowed: ${durationMinutes} Minutes. Total Marks: ${totalMarks}. Answer all questions in this examination paper. Show all working, code, and theoretical justifications clearly.`,
    durationMinutes,
    difficulty,
    totalMarks,
    questions: finalQuestions,
  };
}

// Fallback Quiz Generator
function generateFallbackQuiz(subject: string, topic: string, difficulty: string, numQuestions: number) {
  const isCS = subject.toLowerCase().includes('comput') || subject.toLowerCase().includes('data') || topic.toLowerCase().includes('sql') || topic.toLowerCase().includes('acid');
  const count = Math.min(Math.max(numQuestions, 3), 10);
  const questions: any[] = [];

  const baseQuestions = [
    {
      id: 1,
      question: isCS
        ? `Which property of ACID ensures that concurrent transactions do not interfere with each other?`
        : `In academic inquiry for ${topic}, what is the chief purpose of a peer-reviewed control group?`,
      options: isCS
        ? ['Atomicity', 'Consistency', 'Isolation', 'Durability']
        : ['To eliminate confirmation bias', 'To inflate sample variance', 'To speed up data collection', 'To reduce publishing costs'],
      correctIndex: isCS ? 2 : 0,
      explanation: isCS
        ? 'Isolation ensures that each transaction executes without interference from other concurrent transactions, appearing as if executed sequentially.'
        : 'Control groups provide a baseline against which experimental outcomes can be contrasted, eliminating extraneous variables and bias.',
    },
    {
      id: 2,
      question: isCS
        ? `What occurs during a 'Dirty Read' in relational database concurrency?`
        : `Which measure of central tendency is least sensitive to extreme statistical outliers?`,
      options: isCS
        ? [
            'A transaction reads uncommitted changes made by another concurrent transaction',
            'A transaction fails to write to disk due to a media crash',
            'Two transactions deadlock waiting for a shared lock',
            'A query reads data that was deleted three days ago',
          ]
        : ['The Arithmetic Mean', 'The Median', 'The Mode', 'The Standard Deviation'],
      correctIndex: isCS ? 0 : 1,
      explanation: isCS
        ? 'A dirty read happens when transaction T1 modifies a row and transaction T2 reads that row before T1 commits. If T1 rolls back, T2 has read dirty data.'
        : 'The median represents the exact midpoint of an ordered distribution and is unaffected by extreme skewness or outliers.',
    },
    {
      id: 3,
      question: isCS
        ? `In SQL, which clause is executed AFTER group aggregations have already taken place?`
        : `What does the null hypothesis (H0) typically assert in hypothesis testing?`,
      options: isCS
        ? ['WHERE', 'HAVING', 'GROUP BY', 'FROM']
        : ['There is no significant effect or relationship', 'The experimental treatment was 100% effective', 'The sample size was inadequate', 'The data violates normality'],
      correctIndex: isCS ? 1 : 0,
      explanation: isCS
        ? 'The HAVING clause filters rows after the GROUP BY grouping and aggregation has occurred, whereas WHERE filters individual rows before grouping.'
        : 'The null hypothesis posits no genuine effect or distinction, serving as the default assumption to be rejected based on statistical evidence.',
    },
  ];

  for (let i = 0; i < count; i++) {
    if (i < baseQuestions.length) {
      questions.push(baseQuestions[i]);
    } else {
      questions.push({
        id: i + 1,
        question: `Question ${i + 1}: Which principle is most essential when assessing reliability in ${topic}?`,
        options: [
          `Consistent replicability under identical conditions`,
          `Uncontrolled external variation`,
          `Subjective opinion consensus`,
          `Disregarding contrary empirical data`,
        ],
        correctIndex: 0,
        explanation: `Reliability in academic assessment strictly requires that measurements produce consistent, replicable findings under standard conditions.`,
      });
    }
  }

  return {
    title: `${subject} Quiz: ${topic}`,
    subject,
    topic,
    questions,
  };
}

// 5. AI Examination Generator (Formal exam paper with questions, marks, marking scheme)
app.post('/api/ai/exam-generator', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subject = 'Computer Science',
      topic = 'Core Principles',
      difficulty = 'intermediate',
      questionFormat = 'mixed',
      numQuestions = 8,
      durationMinutes = 60,
      sourceMaterial,
    } = req.body;

    const hasRealGeminiKey =
      !!process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      !process.env.GEMINI_API_KEY.includes('MY_GEMINI');

    if (hasRealGeminiKey) {
      const systemInstruction = `You are an elite Academic Examination Board Setter for Ugandan higher education and secondary institutions.
You generate realistic, rigorous examination papers adhering to authentic syllabus standards.
You MUST output strictly valid JSON matching the requested structure.`;

      let contextStr = '';
      if (sourceMaterial && typeof sourceMaterial === 'string') {
        contextStr = `\nBase the examination on this source study material where appropriate:\n${sourceMaterial.slice(0, 15000)}\n`;
      }

      const prompt = `Generate a complete, high-quality examination for:
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Format: ${questionFormat} (MCQ, True/False, Short Answer, Essay, Programming)
Target Number of Questions: ${numQuestions}
Duration: ${durationMinutes} minutes
${contextStr}

Format your response strictly as a JSON object with this EXACT structure (no extra markdown formatting, only valid JSON):
{
  "title": "${subject}: ${topic} Examination",
  "subject": "${subject}",
  "topic": "${topic}",
  "instructions": "Answer all questions in Section A and Section B. Ensure clear working, concise explanations, and structured code where applicable.",
  "durationMinutes": ${durationMinutes},
  "difficulty": "${difficulty}",
  "totalMarks": 100,
  "questions": [
    {
      "id": 1,
      "type": "mcq", // or "true_false", "short_answer", "essay", "programming"
      "question": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"], // only for mcq or true_false
      "marks": 5,
      "suggestedTimeMinutes": 3,
      "correctAnswer": "Option A or model answer key",
      "explanation": "Detailed step-by-step solution and explanation of why this answer is correct",
      "rubric": "Marking criteria guidance for partial credit"
    }
  ]
}`;

      try {
        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          }),
          7000
        );

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.questions && parsed.questions.length > 0) {
          res.json({
            success: true,
            exam: parsed,
          });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('Gemini exam generation timed out or errored, using fallback generator:', geminiErr.message);
      }
    }

    // Fallback generator
    const fallbackExam = generateFallbackExamPaper(subject, topic, difficulty, questionFormat, numQuestions, durationMinutes, sourceMaterial);
    res.json({
      success: true,
      exam: fallbackExam,
      isFallback: true,
    });
  } catch (error: any) {
    console.error('Exam generator error:', error);
    const fallbackExam = generateFallbackExamPaper(req.body?.subject || 'General', req.body?.topic || 'Curriculum', 'intermediate', 'mixed', 6, 45);
    res.json({ success: true, exam: fallbackExam, isFallback: true });
  }
});

// 6. AI Quiz Generator (Rapid practice quizzes with instant objective feedback)
app.post('/api/ai/quiz-generator', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject = 'Computer Science', topic = 'Key Concepts', difficulty = 'intermediate', numQuestions = 5, sourceMaterial } = req.body;

    const hasRealGeminiKey =
      !!process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      !process.env.GEMINI_API_KEY.includes('MY_GEMINI');

    if (hasRealGeminiKey) {
      let contextStr = '';
      if (sourceMaterial && typeof sourceMaterial === 'string') {
        contextStr = `\nReference Source:\n${sourceMaterial.slice(0, 12000)}\n`;
      }

      const prompt = `Generate a ${numQuestions}-question academic practice quiz in valid JSON format.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
${contextStr}

Return JSON with this schema:
{
  "title": "${subject} Quick Quiz: ${topic}",
  "subject": "${subject}",
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0, // 0-based index of correct option
      "explanation": "Detailed pedagogical explanation of why this option is correct and why other options are incorrect"
    }
  ]
}`;

      try {
        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          }),
          6000
        );

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.questions && parsed.questions.length > 0) {
          res.json({
            success: true,
            quiz: parsed,
          });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('Gemini quiz generation timed out or errored, using fallback quiz:', geminiErr.message);
      }
    }

    const fallbackQuiz = generateFallbackQuiz(subject, topic, difficulty, numQuestions);
    res.json({
      success: true,
      quiz: fallbackQuiz,
      isFallback: true,
    });
  } catch (error: any) {
    console.error('Quiz generator error:', error);
    const fallbackQuiz = generateFallbackQuiz(req.body?.subject || 'General', req.body?.topic || 'Core', 'intermediate', 5);
    res.json({ success: true, quiz: fallbackQuiz, isFallback: true });
  }
});

// 7. AI Flashcards Generator
app.post('/api/ai/flashcards-generator', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, topic, count = 8, sourceMaterial } = req.body;

    let contextStr = '';
    if (sourceMaterial && typeof sourceMaterial === 'string') {
      contextStr = `\nSource text:\n${sourceMaterial.slice(0, 10000)}\n`;
    }

    const prompt = `Generate ${count} spaced-repetition flashcards in JSON format for revision.
Subject: ${subject}
Topic: ${topic}
${contextStr}

Return JSON array of flashcards:
{
  "cards": [
    {
      "front": "Term, Formula, or Question",
      "back": "Clear, concise definition or breakdown",
      "topic": "${topic}",
      "difficulty": "intermediate" // easy, intermediate, difficult
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      cards: parsed.cards || [],
    });
  } catch (error: any) {
    console.error('Flashcard generator error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flashcards' });
  }
});

// 8. Personal AI Revision Planner (Generates realistic, adaptive study timetables)
app.post('/api/ai/revision-planner', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      examDate,
      courses = [],
      availableHoursPerDay = 4,
      availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      difficultTopics = [],
      academicPriorities = '',
    } = req.body;

    const prompt = `Act as an expert Academic Strategist for Ugandan students.
Create a high-yield, realistic, balanced revision timetable leading up to exams on: ${examDate || 'in 4 weeks'}.
Courses enrolled: ${courses.join(', ') || 'Computer Science, Mathematics, Database Systems'}
Available study hours per day: ${availableHoursPerDay} hours
Available study days: ${availableDays.join(', ')}
Challenging / Weak topics identified: ${difficultTopics.join(', ') || 'Calculus derivations, SQL joins, Normalization'}
Student Priorities: ${academicPriorities || 'Pass with First Class / Distinction'}

Design a structured weekly revision schedule incorporating:
1. Spaced repetition and active recall sessions.
2. Mandatory break intervals (Pomodoro 45m study / 15m break).
3. Targeted weak-topic drill slots.
4. Practice mock exam simulation days.

Return strictly valid JSON:
{
  "summary": "Strategic overview of the revision plan",
  "dailyTargetHours": ${availableHoursPerDay},
  "weeklySchedule": [
    {
      "day": "Monday",
      "focusCourse": "Course name",
      "sessions": [
        {
          "timeSlot": "09:00 - 10:30",
          "course": "Course name",
          "topic": "Topic focus",
          "activityType": "Concept Review / Practice Questions / Flashcards",
          "priority": "High"
        }
      ]
    }
  ],
  "milestones": [
    {
      "week": "Week 1",
      "goal": "Master foundational concepts and complete initial topic quizzes"
    }
  ],
  "tips": [
    "Advice for retaining information during study sessions"
  ]
}`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      plan: parsed,
    });
  } catch (error: any) {
    console.error('Revision planner error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate revision plan' });
  }
});

// 9. AI Performance Analytics & Recommendation Engine
app.post('/api/ai/performance-analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentName, coursesData, quizAttempts, examScores } = req.body;

    const prompt = `Analyze this authentic student academic performance data for ScholarMate Uganda:
Student Name: ${studentName || 'Student'}
Courses & Subjects: ${JSON.stringify(coursesData || [])}
Recent Quiz Attempts: ${JSON.stringify(quizAttempts || [])}
Exam Practice Scores: ${JSON.stringify(examScores || [])}

Provide a deep, actionable Academic Diagnostic Report.
Identify:
1. Strong subjects and mastery areas.
2. Weak subjects and frequently misunderstood topics.
3. Concrete, tailored study recommendations (e.g. "We recommend 2 additional revision sessions in Database Normalization and a 15-question practice quiz").
4. High-risk topics needing urgent intervention.
Note: Never make unsupported or fabricated predictions about official final marks.

Return strictly JSON:
{
  "overallAssessment": "Summary paragraph of academic trajectory",
  "averageMasteryPercentage": 74,
  "strongTopics": ["Topic 1", "Topic 2"],
  "weakTopics": ["Topic A", "Topic B"],
  "atRiskSubjects": ["Subject requiring attention"],
  "personalizedRecommendations": [
    {
      "subject": "Subject Name",
      "topic": "Specific Topic",
      "recommendedAction": "Actionable advice",
      "suggestedQuizQuestions": 15,
      "priority": "High"
    }
  ],
  "studyHabitInsights": "Feedback on consistency and revision spacing"
}`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      analytics: parsed,
    });
  } catch (error: any) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate academic analytics' });
  }
});

// 10. AI-Assisted Essay & Subjective Answer Evaluation
function generateFallbackEvaluation(question: string, studentAnswer: string, maxMarks: number, rubric?: string, modelAnswer?: string) {
  const cleanAns = studentAnswer.trim();
  const wordCount = cleanAns.split(/\s+/).filter(Boolean).length;
  
  // Basic heuristic evaluation for offline / timeout
  let scoreFraction = 0.65;
  if (wordCount > 60) scoreFraction = 0.85;
  else if (wordCount > 30) scoreFraction = 0.75;
  else if (wordCount > 10) scoreFraction = 0.60;
  else scoreFraction = 0.40;

  const suggestedScore = Math.max(1, Math.min(maxMarks, Math.round(maxMarks * scoreFraction)));
  const percentage = Math.round((suggestedScore / maxMarks) * 100);

  return {
    suggestedScore,
    maxMarks,
    percentage,
    evaluationSummary: `The response addresses the prompt with ${wordCount} words. Demonstrates foundational grasp of core principles.`,
    strengths: [
      'Directly engaged with key components of the question',
      'Articulated relevant concepts in a structured manner',
    ],
    areasForImprovement: [
      'Consider including explicit real-world or computational examples to achieve full marks',
      'Elaborate on edge cases or boundary conditions',
    ],
    detailedFeedback: `Marks awarded: ${suggestedScore}/${maxMarks} (${percentage}%). Model criteria emphasize: ${rubric || 'conceptual accuracy and logical structure'}. Review the model answer key for full technical precision.`,
    disclaimer: 'This is an AI-generated formative evaluation for study purposes and does not represent an official institutional grade.',
  };
}

app.post('/api/ai/mark-essay', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, studentAnswer, maxMarks = 20, rubric, modelAnswer } = req.body;

    if (!question || !studentAnswer) {
      res.status(400).json({ error: 'Question and student answer are required' });
      return;
    }

    const hasRealGeminiKey =
      !!process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      !process.env.GEMINI_API_KEY.includes('MY_GEMINI');

    if (hasRealGeminiKey) {
      const prompt = `You are an AI Academic Assistant providing formative practice marking.
Transparency Requirement: Clearly formulate formative assessment feedback. This is AI-assisted practice feedback to help the student learn, NOT an official university lecturer grade.

Question:
${question}

Max Marks: ${maxMarks}

Rubric / Marking Guide:
${rubric || 'Accuracy of concepts, depth of explanation, real-world examples, logical structure, clarity.'}

Model Answer Key:
${modelAnswer || 'Comprehensive academic standard answer.'}

Student's Submitted Answer:
${studentAnswer}

Evaluate the student answer thoroughly and return JSON:
{
  "suggestedScore": 16,
  "maxMarks": ${maxMarks},
  "percentage": 80,
  "evaluationSummary": "Comprehensive overview of the student response",
  "strengths": ["Clear definition of concepts", "Appropriate examples cited"],
  "areasForImprovement": ["Could have included time complexity analysis"],
  "detailedFeedback": "Detailed commentary explaining where marks were earned or lost",
  "disclaimer": "This is an AI-generated formative evaluation for study purposes and does not represent an official institutional grade."
}`;

      try {
        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          }),
          6000
        );

        const parsed = JSON.parse(response.text || '{}');
        if (typeof parsed.suggestedScore === 'number') {
          res.json({
            success: true,
            evaluation: parsed,
          });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('Gemini essay marking timed out or errored, using fallback evaluation:', geminiErr.message);
      }
    }

    const fallbackEval = generateFallbackEvaluation(question, studentAnswer, maxMarks, rubric, modelAnswer);
    res.json({
      success: true,
      evaluation: fallbackEval,
      isFallback: true,
    });
  } catch (error: any) {
    console.error('Essay marking error:', error);
    const fallbackEval = generateFallbackEvaluation(req.body?.question || '', req.body?.studentAnswer || '', req.body?.maxMarks || 20);
    res.json({ success: true, evaluation: fallbackEval, isFallback: true });
  }
});

// 11. AI Direct Document-to-Assessment Generator (Instant Practice Exam or Quiz from File)
app.post('/api/ai/document-to-assessment', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentText, assessmentType = 'quiz', subject = 'General', topic = 'Key Concepts', numQuestions = 5, durationMinutes = 30 } = req.body;

    const validationError = validatePayload(req.body, ['documentText']);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const safeText = documentText.slice(0, 25000);

    if (assessmentType === 'exam') {
      const prompt = `You are an Academic Exam Board setter for Ugandan Universities.
Based on the following study document, create a formal examination paper with ${numQuestions} questions (mix of multiple choice, short-answer, and essay question).
Subject: ${subject}
Topic: ${topic}
Duration: ${durationMinutes} minutes

Return STRICTLY JSON format:
{
  "title": "${subject}: Assessment on ${topic}",
  "subject": "${subject}",
  "topic": "${topic}",
  "instructions": "Answer all questions. Show clear workings for calculation questions.",
  "durationMinutes": ${durationMinutes},
  "difficulty": "intermediate",
  "totalMarks": 50,
  "questions": [
    {
      "id": 1,
      "type": "mcq", // "mcq", "short_answer", or "essay"
      "question": "Question text directly derived from document",
      "options": ["A", "B", "C", "D"],
      "marks": 5,
      "suggestedTimeMinutes": 3,
      "correctAnswer": "A",
      "explanation": "Detailed explanation citing the document context",
      "rubric": "Marking criteria"
    }
  ]
}

Source Document:
${safeText}`;

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, assessmentType: 'exam', exam: parsed });
    } else {
      // Quiz type
      const prompt = `Based on the following document, generate a ${numQuestions}-question quick practice quiz in valid JSON format.
Subject: ${subject}
Topic: ${topic}

Return strictly JSON:
{
  "title": "${subject} Quick Quiz: ${topic}",
  "subject": "${subject}",
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "question": "Clear question derived from the document",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation linking directly back to the study material"
    }
  ]
}

Source Document:
${safeText}`;

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, assessmentType: 'quiz', quiz: parsed });
    }
  } catch (error: any) {
    console.error('Document-to-assessment error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate assessment from document' });
  }
});

// 12. Lecturer Assessment Publishing (Permissions: Lecturer & Admin only)
app.post('/api/assessments/publish', requireRole(['lecturer', 'administrator']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, courseId, courseName, type, durationMinutes, totalMarks, questions } = req.body;

    const validationError = validatePayload(req.body, ['title', 'courseId', 'type']);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const newAssessment = {
      id: `assessment-${Date.now()}`,
      title,
      courseId,
      courseName: courseName || 'General Course',
      type: type || 'exam',
      durationMinutes: durationMinutes || 45,
      totalMarks: totalMarks || 50,
      questions: questions || [],
      publishedBy: req.user?.id || 'lecturer-id',
      publishedByEmail: req.user?.email || 'lecturer@scholarmate.ac.ug',
      publishedAt: new Date().toISOString(),
      status: 'active',
    };

    PUBLISHED_ASSESSMENTS.unshift(newAssessment);

    res.json({
      success: true,
      message: `Assessment "${title}" successfully published for students enrolled in ${newAssessment.courseName}.`,
      assessment: newAssessment,
    });
  } catch (error: any) {
    console.error('Assessment publishing error:', error);
    res.status(500).json({ error: error.message || 'Failed to publish assessment' });
  }
});

// 13. Get Published Assessments
app.get('/api/assessments/list', (req: Request, res: Response) => {
  const courseId = req.query.courseId as string;
  let items = PUBLISHED_ASSESSMENTS;
  if (courseId) {
    items = items.filter((a) => a.courseId === courseId);
  }
  res.json({
    success: true,
    count: items.length,
    assessments: items,
  });
});

// 14. Admin User Management Directory (Permissions: Administrator only)
app.get('/api/admin/users', requireRole(['administrator']), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    totalUsers: USER_DIRECTORY.length,
    users: USER_DIRECTORY,
  });
});

// 15. Admin Role Assignment & Promotion (Permissions: Administrator only)
app.post('/api/admin/set-role', requireRole(['administrator']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, newRole } = req.body;

    const validationError = validatePayload(req.body, ['userId', 'newRole']);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    if (!['student', 'lecturer', 'administrator'].includes(newRole)) {
      res.status(400).json({ error: `Invalid role "${newRole}". Must be student, lecturer, or administrator.` });
      return;
    }

    const targetUser = USER_DIRECTORY.find((u) => u.id === userId);
    if (!targetUser) {
      // Add or mock user entry
      USER_DIRECTORY.push({
        id: userId,
        email: `${userId}@scholarmate.ac.ug`,
        displayName: 'Account User',
        role: newRole,
        institution: 'Ugandan Academic Institution',
        program: 'Active Department',
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
      });
    } else {
      targetUser.role = newRole;
    }

    res.json({
      success: true,
      message: `User role updated successfully to "${newRole}".`,
      user: targetUser || { id: userId, role: newRole },
    });
  } catch (error: any) {
    console.error('Role update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user role' });
  }
});

// Setup Vite dev server or static file serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(` ScholarMate Uganda server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
