import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  FileCode,
  GraduationCap,
  HelpCircle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Zap,
  CheckCircle2,
  Layers,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: string;
  course?: string;
  citedDocTitle?: string;
  retrievedChunks?: { id: number; score: number; preview: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  courseName: string;
  updatedAt: string;
  messages: TutorMessage[];
}

export const AITutorView: React.FC = () => {
  const {
    documents,
    courses,
    currentUser,
    addQuiz,
    addFlashcard,
    logStudySession,
    addNotification,
  } = useApp();

  const activeCourseName = courses[0]?.name || 'Database Management Systems';

  // Persistent Chat Sessions Storage
  const storageKey = `scholarmate_tutor_sessions_${currentUser?.uid || 'guest'}`;

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved sessions:', e);
    }

    const defaultWelcome: TutorMessage = {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello ${currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Scholar'}! I am your ScholarMate AI Academic Tutor powered by Google Gemini.

I behave as your personal university lecturer: breaking down difficult concepts, solving step-by-step math and algorithm derivations, and connecting abstract theory to practical Ugandan examples (such as MTN/Airtel Mobile Money protocols, Kampala logistics, or regional agriculture).

To get started:
1. Select your target course syllabus above.
2. Choose your preferred pedagogical depth (Beginner, Intermediate, Advanced, Step-by-Step, or Exam Prep).
3. Optionally ground my responses in one of your uploaded lecture notes or PDF documents!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    return [
      {
        id: 'session-default',
        title: 'Foundations & Academic Orientation',
        courseName: activeCourseName,
        updatedAt: new Date().toISOString(),
        messages: [defaultWelcome],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0]?.id || 'session-default');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  const [inputQuestion, setInputQuestion] = useState('');
  const [learningMode, setLearningMode] = useState<
    'beginner' | 'intermediate' | 'advanced' | 'exam_prep' | 'step_by_step' | 'code_tutor'
  >('intermediate');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedDocId, setSelectedDocId] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Storage quota error:', e);
    }
  }, [sessions, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const currentDoc = documents.find((d) => d.id === selectedDocId);

  const handleCreateNewChat = () => {
    const newSessionId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newSessionId,
      title: `Study Session on ${currentCourse?.code || 'Course'}`,
      courseName: currentCourse?.name || 'General Course',
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: `New study session started for **${currentCourse?.code} - ${currentCourse?.name}**.\n\nWhat topic, lecture theorem, or assignment problem would you like to explore?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleClearSession();
      return;
    }
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleClearSession = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [
                {
                  id: 'reset-' + Date.now(),
                  role: 'assistant',
                  content: 'Conversation cleared. How can I assist you with your studies today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ],
            }
          : s
      )
    );
    setShowClearConfirm(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputQuestion;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: TutorMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: learningMode,
      course: currentCourse?.code,
    };

    // Update active session messages immediately
    const updatedMessages = [...messages, userMsg];
    const newTitle =
      messages.length <= 1 && textToSend.length > 5
        ? textToSend.slice(0, 38) + (textToSend.length > 38 ? '...' : '')
        : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: newTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : s
      )
    );

    if (!customPrompt) setInputQuestion('');
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend.trim(),
          learningMode,
          subject: `${currentCourse?.code || ''} ${currentCourse?.name || 'General Subject'}`,
          contextDoc: currentDoc ? currentDoc.textContent : undefined,
          docTitle: currentDoc ? currentDoc.title : undefined,
          conversationHistory: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Tutor request failed');

      const assistantMsg: TutorMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.answer || 'I could not generate an explanation at this time.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: learningMode,
        citedDocTitle: currentDoc?.title,
        retrievedChunks: data.retrievedChunks,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [...updatedMessages, assistantMsg],
              }
            : s
        )
      );
    } catch (err: any) {
      const errorMsg: TutorMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `Error connecting to Gemini AI: ${err.message}. Please check your connection and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...updatedMessages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Convert tutor answer to Quiz
  const handleGenerateQuizFromAnswer = async (content: string) => {
    setActionNotice('Generating quiz from tutor explanation...');
    try {
      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: currentCourse?.name || 'Academic Course',
          topic: activeSession.title,
          numQuestions: 4,
          sourceMaterial: content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quiz generation failed');

      if (data.quiz && data.quiz.questions) {
        await addQuiz({
          courseId: currentCourse?.id,
          courseName: currentCourse?.name || 'Class Subject',
          title: data.quiz.title || `Quick Quiz: ${activeSession.title}`,
          subject: currentCourse?.name || 'Course',
          topic: activeSession.title,
          questions: data.quiz.questions,
        });
        setActionNotice('Added 4-question practice quiz to your Quiz Centre!');
        addNotification('Quiz Generated', `Created practice quiz for ${activeSession.title}`, 'exam');
      }
    } catch (e: any) {
      alert(`Quiz creation failed: ${e.message}`);
      setActionNotice(null);
    }
  };

  // Convert concept to Flashcard
  const handleCreateFlashcardFromAnswer = async (content: string) => {
    setActionNotice('Creating revision flashcard...');
    try {
      const lines = content.split('\n').filter((l) => l.trim().length > 15);
      const front = lines[0]?.replace(/[#*_-]/g, '').trim() || `Core Concept in ${currentCourse?.code}`;
      const back = lines.slice(1, 4).join(' ').replace(/[#*_-]/g, '').trim().slice(0, 280) || content.slice(0, 200);

      await addFlashcard({
        courseId: currentCourse?.id,
        subject: currentCourse?.name || 'General',
        topic: activeSession.title,
        front: front.length > 120 ? front.slice(0, 120) + '...' : front,
        back: back,
        difficulty: 'intermediate',
        status: 'needs_revision',
      });

      setActionNotice('Saved spaced-repetition card to your Flashcard Deck!');
      addNotification('Flashcard Saved', `Added concept card for ${activeSession.title}`, 'resource');
    } catch (e: any) {
      alert(`Flashcard error: ${e.message}`);
      setActionNotice(null);
    }
  };

  // Log to revision session
  const handleLogRevisionSession = () => {
    logStudySession({
      courseName: currentCourse?.name || 'Academic Course',
      topic: activeSession.title,
      durationMinutes: 30,
      date: new Date().toISOString().split('T')[0],
      completed: true,
    });
    setActionNotice('Logged 30-min revision session in your Academic Analytics!');
    addNotification('Study Session Logged', `Logged 30m on ${activeSession.title}`, 'reminder');
  };

  // Course-specific suggested prompts
  const getSuggestedPrompts = () => {
    const code = currentCourse?.code || 'CSC';
    if (code.includes('2100') || code.includes('DBMS') || currentCourse?.name.toLowerCase().includes('database')) {
      return [
        'Explain BCNF decomposition step-by-step using a university student enrolment table.',
        'What is the difference between Optimistic and Pessimistic Concurrency Control in ACID?',
        'How do clustered indexes vs unclustered indexes affect query latency?',
      ];
    }
    if (code.includes('2102') || code.includes('NET') || currentCourse?.name.toLowerCase().includes('network')) {
      return [
        'Calculate subnet masks and usable host IP ranges for 192.168.1.0/27 step-by-step.',
        'Explain TCP 3-way handshake and how congestion window scaling works.',
        'What happens when an ARP request is broadcast on a local Ethernet segment?',
      ];
    }
    if (code.includes('2103') || currentCourse?.name.toLowerCase().includes('data structure')) {
      return [
        'Write an in-order traversal of an AVL Tree in Python and explain the self-balancing rotations.',
        'Compare Dijkstra’s Shortest Path vs Bellman-Ford algorithm with time complexity.',
        'How do hash tables resolve collisions using open addressing vs separate chaining?',
      ];
    }
    return [
      `Explain the core foundational concepts of ${currentCourse?.name || 'this course'} with a practical Ugandan example.`,
      `What are the most common exam mistakes students make in ${currentCourse?.code || 'this subject'}?`,
      `Provide a step-by-step breakdown of a challenging derivation or problem in this topic.`,
    ];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-4.5rem)] flex flex-col space-y-3">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container: Sidebar + Chat Area */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Sidebar: Saved Tutor Sessions */}
        <aside
          className={`${
            sidebarOpen ? 'w-64 sm:w-72' : 'w-0 hidden'
          } shrink-0 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden transition-all duration-200`}
        >
          {/* Sidebar Top: New Chat Button */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={handleCreateNewChat}
              className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Tutor Session</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Saved Conversations ({sessions.length})
            </div>

            {sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`group p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate block">{sess.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    title="Delete session"
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sidebar Bottom: Stats */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Powered by Gemini 3.8</span>
            <span className="text-emerald-700 font-semibold">Active Tutor</span>
          </div>
        </aside>

        {/* Right Workspace: Chat, Config Bar & Inputs */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Configuration Toolbar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title={sidebarOpen ? 'Collapse sidebar' : 'Open conversations'}
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">
                    ScholarMate AI Tutor
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Socratic & Grounded Lecturer Assistant
                  </span>
                </div>
              </div>
            </div>

            {/* Course & Grounding Document Selectors */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Course Selector */}
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 outline-hidden"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Course: {c.code}
                  </option>
                ))}
              </select>

              {/* Learning Mode Selector */}
              <select
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold focus:border-blue-600 outline-hidden"
              >
                <option value="beginner">1. Beginner (Analogy & Plain Language)</option>
                <option value="intermediate">2. Intermediate (Collegiate Standard)</option>
                <option value="advanced">3. Advanced (Proofs & Big-O)</option>
                <option value="step_by_step">4. Step-by-Step Problem Solving</option>
                <option value="code_tutor">5. Code & Algorithm Instructor</option>
                <option value="exam_prep">6. UNEB / University Exam Prep</option>
              </select>

              {/* Document Grounding Selector */}
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 outline-hidden max-w-[150px] sm:max-w-[200px] truncate"
              >
                <option value="none">No Document Attached</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    Attach: {d.title}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Clear current session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Document Grounding Notification Strip */}
          {currentDoc && (
            <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-xs text-indigo-900 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  <strong>Grounded in:</strong> {currentDoc.title} ({currentDoc.courseName})
                </span>
              </div>
              <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-bold shrink-0">
                Chunk-Indexed Retrieval Active
              </span>
            </div>
          )}

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 shadow-2xs space-y-2.5 ${
                      isAssistant
                        ? 'bg-slate-50 border border-slate-200 text-slate-800'
                        : 'bg-blue-600 text-white rounded-br-xs'
                    }`}
                  >
                    {/* Assistant Metadata / Citations Header */}
                    {isAssistant && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700 uppercase tracking-wider text-[10px]">
                            {m.mode ? m.mode.replace('_', ' ') : 'Lecturer Tutor'}
                          </span>
                          {m.citedDocTitle && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold border border-indigo-200">
                              Citing: {m.citedDocTitle}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px]">{m.timestamp}</span>
                      </div>
                    )}

                    {/* Content Body */}
                    <div className="whitespace-pre-wrap leading-relaxed text-xs">
                      {m.content}
                    </div>

                    {/* Retrieved Chunk Previews if Available */}
                    {isAssistant && m.retrievedChunks && m.retrievedChunks.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-indigo-900 block uppercase tracking-wider">
                          Referenced Document Passages:
                        </span>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {m.retrievedChunks.map((rc) => (
                            <div
                              key={rc.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-600"
                            >
                              <span className="font-bold text-indigo-600 block">Chunk #{rc.id}</span>
                              <p className="line-clamp-2 mt-0.5">{rc.preview}...</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assistant Action Buttons Toolbar */}
                    {isAssistant && m.id !== 'welcome-msg' && (
                      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(m.content, m.id)}
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-600 flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => handleSend(messages[messages.indexOf(m) - 1]?.content || 'Explain further')}
                            disabled={isLoading}
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-600 flex items-center gap-1 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>
                        </div>

                        {/* Interactive Bridge Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleGenerateQuizFromAnswer(m.content)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <HelpCircle className="w-3 h-3 text-indigo-600" />
                            <span>Turn to Quiz</span>
                          </button>

                          <button
                            onClick={() => handleCreateFlashcardFromAnswer(m.content)}
                            className="px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-800 font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>Make Flashcard</span>
                          </button>

                          <button
                            onClick={handleLogRevisionSession}
                            className="px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Calendar className="w-3 h-3 text-sky-600" />
                            <span>Log 30m Study</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 text-xs justify-start">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                    <span className="font-semibold text-xs text-slate-700">
                      Lecturer AI is analyzing concepts & retrieving curriculum examples...
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Applying {learningMode.replace('_', ' ')} pedagogical framework
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Course Prompts */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
            <span className="text-slate-400 font-bold uppercase text-[9px] shrink-0">Quick Topics:</span>
            {getSuggestedPrompts().map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium whitespace-nowrap transition cursor-pointer shrink-0 truncate max-w-[280px]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Chat Box */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder={`Ask an academic question in ${currentCourse?.code || 'your course'} (or paste a problem)...`}
                disabled={isLoading}
                className="flex-1 text-xs p-3 rounded-xl border border-slate-300 focus:border-blue-600 outline-hidden"
              />
              <button
                type="submit"
                disabled={isLoading || !inputQuestion.trim()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask Tutor</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog to Clear Conversation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Clear Current Conversation?</span>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to clear the messages in "{activeSession.title}"? Your past notes and uploaded documents will remain safe.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearSession}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
