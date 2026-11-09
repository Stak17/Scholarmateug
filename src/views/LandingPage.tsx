import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  FileCheck,
  Brain,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  School,
  FileSpreadsheet,
  Zap,
  ChevronDown,
  Layers,
  Clock,
  TrendingUp,
  BarChart3,
  Check,
  HelpCircle,
  Menu,
  X,
  Play,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
  onSelectRole: (role: 'student' | 'lecturer' | 'admin') => void;
  onLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreFeatures,
  onSelectRole,
  onLogin,
}) => {
  const { loginAsGuest, lowBandwidthMode, setLowBandwidthMode } = useApp();

  // Mobile navigation state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Product Demo State (Section 5)
  const [activeDemoAction, setActiveDemoAction] = useState<
    'simplify' | 'quiz' | 'notes' | 'examples'
  >('simplify');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoQuery, setDemoQuery] = useState('Explain database normalisation in simple terms.');
  const [demoAnswer, setDemoAnswer] = useState(
    `Database normalisation is the process of organising information into related tables to reduce duplication and improve data consistency.\n\nLet's explore it using a university student registration example:\n• 1NF: Eliminates repeated groups (e.g., student course codes are kept in individual rows).\n• 2NF: Eliminates partial dependencies (every non-key column depends fully on the primary registration number).\n• 3NF: Eliminates transitive dependencies (e.g., department phone numbers are stored in a Department table rather than repeated on every student's record).`
  );

  const demoActionTemplates: Record<
    'simplify' | 'quiz' | 'notes' | 'examples',
    { prompt: string; answer: string }
  > = {
    simplify: {
      prompt: 'Explain database normalisation in simple terms.',
      answer: `Database normalisation is the process of organising information into related tables to reduce duplication and improve data consistency.\n\nLet's explore it using a university student registration example:\n• 1NF: Eliminates repeated groups (e.g., student course codes are kept in individual rows).\n• 2NF: Eliminates partial dependencies (every non-key column depends fully on the primary registration number).\n• 3NF: Eliminates transitive dependencies (e.g., department phone numbers are stored in a Department table rather than repeated on every student's record).`,
    },
    quiz: {
      prompt: 'Generate a 3-question quick quiz on Normalisation.',
      answer: `Here is a practice quiz based on relational database theory:\n\n1. Which normal form addresses repeating columns in a single row?\n   A) 1NF   B) 2NF   C) 3NF   D) BCNF\n   [Answer: A — First Normal Form ensures all attributes contain atomic values.]\n\n2. A table where a non-key attribute depends on another non-key attribute violates:\n   A) 1NF   B) 2NF   C) 3NF   D) 4NF\n   [Answer: C — Third Normal Form removes transitive dependencies.]\n\n3. Can a table be in 3NF without being in 2NF?\n   A) Yes   B) No\n   [Answer: B — Normal forms are strictly cumulative.]`,
    },
    notes: {
      prompt: 'Create high-yield revision notes for exam preparation.',
      answer: `HIGH-YIELD REVISION SHEET: Normalisation\n\nKey Concepts for University Exams:\n• Functional Dependency: X → Y means attribute X uniquely determines attribute Y.\n• Candidate Key: Minimal superkey that uniquely identifies a record.\n• Lossless-Join Decomposition: Preserves relationships without introducing phantom tuples.\n• Dependency Preservation: Allows database engine to verify constraints without joins.\n\nExaminer's Checklist: Always identify the Primary Key first before testing 2NF or 3NF!`,
    },
    examples: {
      prompt: 'Explain normalisation using a Ugandan mobile money transaction example.',
      answer: `Ugandan Everyday Context: Mobile Money Agent Ledger\n\nImagine a mobile money agent recording every float withdrawal in one giant notebook:\n• Unnormalized: Every row writes Agent Name, Agent NIN, Phone Number, Customer Name, and Transaction Amount.\n• Why this fails: If the agent changes their phone number, you have to update 10,000 past receipt rows!\n• Normalised Solution:\n  1. Agents Table (Agent_ID, Name, NIN, Contact)\n  2. Customers Table (Customer_Phone, Name)\n  3. Transactions Table (Transaction_ID, Agent_ID, Customer_Phone, Amount, Timestamp)\n\nResult: Clean data, zero duplication, and lightning-fast query lookups.`,
    },
  };

  const handleSelectDemoAction = (action: 'simplify' | 'quiz' | 'notes' | 'examples') => {
    setActiveDemoAction(action);
    setDemoLoading(true);
    setTimeout(() => {
      setDemoQuery(demoActionTemplates[action].prompt);
      setDemoAnswer(demoActionTemplates[action].answer);
      setDemoLoading(false);
    }, 300);
  };

  // FAQ Accordion State (Section 9)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is ScholarMate Uganda?',
      a: 'ScholarMate Uganda is an intelligent academic learning and examination preparation platform. It combines Google Gemini AI models with authentic Ugandan university syllabi and secondary curricula to provide personalised tutoring, document analysis, timed practice examinations, and adaptive revision schedules.',
    },
    {
      q: 'How does the AI tutor work?',
      a: 'The AI tutor acts like an experienced, patient university lecturer. It breaks down complex concepts step-by-step, solves mathematical derivations, provides well-commented coding explanations, and illustrates theoretical topics using relatable Ugandan life examples (such as mobile money networks, local commerce, and agriculture).',
    },
    {
      q: 'Can I upload my lecture notes?',
      a: 'Yes! You can upload lecture notes in PDF, Word (DOCX), PowerPoint (PPTX), plain text, or even photos of blackboard/whiteboard notes. Gemini AI transcribes and indexes the materials so you can ask questions directly grounded in your specific class notes.',
    },
    {
      q: 'Can ScholarMate generate practice examinations?',
      a: 'Yes. ScholarMate features a dedicated Exam Generator that produces realistic examination papers adhering to authentic Ugandan university and UNEB grading structures. You can take them in a timed Exam Room with autosave and receive formative evaluation with marking rubrics.',
    },
    {
      q: 'Does it support Ugandan university courses?',
      a: 'Yes. ScholarMate comes pre-configured with courses from major Ugandan institutions—including Makerere University (MAK), Kyambogo University (KYU), Makerere University Business School (MUBS), Mbarara University (MUST), and Uganda Christian University (UCU)—and allows you to add custom syllabi.',
    },
    {
      q: 'Can I use it on my smartphone?',
      a: 'Yes. The entire platform is mobile-responsive and functions as a Progressive Web App (PWA). It includes a Low-Bandwidth Data Saver mode specifically designed for students studying on mobile bundles.',
    },
    {
      q: 'Is my academic information private?',
      a: 'Absolutely. We enforce strict Attribute-Based Access Control (ABAC) through Google Cloud Firestore security rules. Your uploaded documents, exam attempts, study plans, and profile data are accessible exclusively to your authenticated account.',
    },
    {
      q: 'Is there a free plan?',
      a: 'Yes. The Free tier includes a daily AI tutoring allowance, lecture note uploads, practice quizzes, and full access to your personal study dashboard. You can begin learning without any upfront commitment.',
    },
  ];

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen selection:bg-blue-100 selection:text-blue-900">
      {/* =========================================================================
          SECTION 1: NAVIGATION BAR
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: ScholarMate Logo and Brand Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                    ScholarMate
                  </span>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Uganda
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Personal AI Academic Assistant
                </span>
              </div>
            </div>

            {/* Middle: Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
              <button
                onClick={() => scrollToSection('hero')}
                className="hover:text-blue-700 transition cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-blue-700 transition cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-blue-700 transition cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('built-for-students')}
                className="hover:text-blue-700 transition cursor-pointer"
              >
                For Students
              </button>
              <button
                onClick={() => {
                  onSelectRole('lecturer');
                }}
                className="hover:text-blue-700 transition cursor-pointer"
              >
                For Institutions
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="hover:text-blue-700 transition cursor-pointer"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="hover:text-blue-700 transition cursor-pointer"
              >
                About
              </button>
            </nav>

            {/* Right: Login & Get Started Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={onLogin || onGetStarted}
                className="text-xs font-bold text-slate-700 hover:text-blue-700 px-3 py-2 transition cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={onGetStarted}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('built-for-students')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                For Students
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectRole('lecturer');
                }}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                For Institutions
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                About & FAQ
              </button>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogin) onLogin();
                  else onGetStarted();
                }}
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full text-center py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECTION 2: HERO SECTION
      ========================================================================= */}
      <section id="hero" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column (6 cols) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Your Personal AI Academic Assistant</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-500 font-medium">Built for Uganda</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Your Academic Success,{' '}
                <span className="text-blue-700">Powered by AI.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 font-semibold max-w-xl mx-auto lg:mx-0">
                Study smarter. Understand better. Achieve more.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Meet your personal AI academic assistant. Turn lecture notes into simplified study materials,
                generate practice examinations, understand difficult concepts and create personalised revision plans
                — all in one place.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Start Learning for Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs transition-all cursor-pointer"
                >
                  Explore Features
                </button>
              </div>

              {/* Trust message */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Built to make quality academic support more accessible to students in Uganda.</span>
              </div>
            </div>

            {/* Right Product Showcase: Realistic ScholarMate Student Dashboard Mockup (6 cols) */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Soft backdrop glow */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-teal-500 rounded-3xl blur-lg opacity-20"></div>

                {/* Dashboard Frame */}
                <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden text-xs">
                  {/* Window Bar */}
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-300 ml-2">
                        app.scholarmate.ug/student
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Live AI Tutor Active
                    </span>
                  </div>

                  {/* Mockup Body Content */}
                  <div className="p-4 sm:p-5 bg-slate-50/70 space-y-3.5">
                    {/* Top Row: Course Progress & Quiz Score */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                          <span>CSC 2100 Database Systems</span>
                          <span className="text-blue-700 font-bold">78%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-600 h-1.5 rounded-full w-[78%]"></div>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Syllabus Mastery</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                          <span>Practice Quiz Average</span>
                          <span className="text-emerald-700 font-bold">84%</span>
                        </div>
                        <div className="text-base font-extrabold text-slate-900">14 Quizzes Taken</div>
                        <span className="text-[10px] text-emerald-600 font-semibold">First Class Standing</span>
                      </div>
                    </div>

                    {/* AI Tutor Active Conversation Card */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                            AI
                          </div>
                          <span className="font-bold text-slate-900 text-[11px]">
                            ScholarMate AI Tutor
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                          Step-by-Step Mode
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
                          <strong>Student:</strong> Explain BCNF decomposition step-by-step.
                        </div>
                        <div className="bg-blue-50/70 p-2.5 rounded-lg text-slate-800 border border-blue-100 leading-relaxed">
                          <strong>Lecturer AI:</strong> In Boyce-Codd Normal Form, every determinant must be a candidate key. Let's decompose using Makerere's student-advisor relation:
                          <span className="block mt-1 font-mono text-[10px] text-blue-900 bg-white p-1 rounded border border-blue-100">
                            R(Student, Advisor, Department) → R1(Advisor, Dept), R2(Student, Advisor)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Upcoming Revision & Document Analyser Preview */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-sky-800 font-bold">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          <span>Today's Revision</span>
                        </div>
                        <div className="font-semibold text-slate-800">14:00 - 15:30 (45m Pomodoro)</div>
                        <span className="text-[10px] text-slate-500">Subnetting & ACID Drills</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                          <span>Grounded Document</span>
                        </div>
                        <div className="font-semibold text-slate-800 truncate">CSC 2100 Lecture 4.pdf</div>
                        <span className="text-[10px] text-purple-700 font-semibold">18 Concepts Indexed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: VALUE PROPOSITION (6 Feature Cards)
      ========================================================================= */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Comprehensive Academic Toolset
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Study Smarter.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Designed specifically around the curriculum demands and examination standards of Ugandan higher education.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: AI Personal Tutor */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">1. AI Personal Tutor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understand difficult topics through personalised AI explanations. Choose from Beginner analogies,
                standard collegiate depth, or advanced proofs with practical Ugandan examples.
              </p>
            </div>

            {/* Card 2: Smart Notes */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">2. Smart Notes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload lecture materials (PDF, Word, PPTX, or blackboard photos) and transform them into simplified
                summaries, key concept glossaries, and chunk-grounded Q&A.
              </p>
            </div>

            {/* Card 3: AI Exam Generator */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">3. AI Exam Generator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create practice examinations based on your actual learning materials. Take timed mock exams in our
                Exam Room with autosave and formative essay marking.
              </p>
            </div>

            {/* Card 4: Smart Revision Planner */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">4. Smart Revision Planner</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate personalised study schedules around your academic goals. Features an embedded Pomodoro focus
                timer (45m study / 15m rest) and session tracking.
              </p>
            </div>

            {/* Card 5: Performance Insights */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">5. Performance Insights</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discover your strengths and identify topics requiring improvement with real SVG trend charts,
                mastery percentages, and prescriptive study diagnostics.
              </p>
            </div>

            {/* Card 6: Interactive Quizzes */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">6. Interactive Quizzes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Test your understanding with AI-generated assessments and 3D flip spaced-repetition flashcards.
                Receive instant pedagogical feedback on every choice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: HOW IT WORKS (4-Step Visual Process)
      ========================================================================= */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Step-by-Step Learning Method
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Your Journey to Better Academic Performance Starts Here.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Four simple steps from unorganised lecture slides to confident exam mastery.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="relative space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md mx-auto sm:mx-0">
                1
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                STEP 1: Registration
              </span>
              <h3 className="text-base font-bold text-slate-900">Create Your Account</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register and add your academic information (university, faculty, program, and current semester subjects).
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md mx-auto sm:mx-0">
                2
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                STEP 2: Materials
              </span>
              <h3 className="text-base font-bold text-slate-900">Upload Learning Materials</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your lecture notes, syllabus PDFs, PowerPoint presentations, or mobile photos of handwritten notes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md mx-auto sm:mx-0">
                3
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                STEP 3: Intelligence
              </span>
              <h3 className="text-base font-bold text-slate-900">Learn with Gemini AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate high-yield summaries, ask Socratic questions, drill flashcards, and practise authentic examination questions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md mx-auto sm:mx-0">
                4
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                STEP 4: Mastery
              </span>
              <h3 className="text-base font-bold text-slate-900">Track Your Progress</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitor your academic performance, uncover weak topics with diagnostic analytics, and follow adaptive revision schedules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PRODUCT DEMONSTRATION (Interactive Live Preview)
      ========================================================================= */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Soft background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Interactive Product Preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Meet Your Personal AI Study Partner.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Experience how ScholarMate AI breaks down collegiate questions in real time. Click any action below to test.
            </p>
          </div>

          {/* Interactive Demo Terminal */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-5">
            {/* Action Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/80 pb-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">
                Sample Action:
              </span>
              <button
                onClick={() => handleSelectDemoAction('simplify')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeDemoAction === 'simplify'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                1. Simplify this topic
              </button>
              <button
                onClick={() => handleSelectDemoAction('quiz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeDemoAction === 'quiz'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                2. Generate a quiz
              </button>
              <button
                onClick={() => handleSelectDemoAction('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeDemoAction === 'notes'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                3. Create revision notes
              </button>
              <button
                onClick={() => handleSelectDemoAction('examples')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeDemoAction === 'examples'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                4. Explain with examples
              </button>
            </div>

            {/* Conversation Preview */}
            <div className="space-y-3.5 text-xs">
              {/* Student Question */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-blue-600/90 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-xl shadow-xs">
                  <span className="font-bold text-[10px] text-blue-200 block mb-0.5">Student Prompt:</span>
                  <p>{demoQuery}</p>
                </div>
              </div>

              {/* ScholarMate AI Response */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                  AI
                </div>
                <div className="flex-1 bg-slate-900/80 border border-slate-700 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-bold text-blue-400 uppercase tracking-wider">
                      ScholarMate AI Tutor (Gemini 3.8 Flash)
                    </span>
                    <span>Pedagogical University Standard</span>
                  </div>

                  {demoLoading ? (
                    <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                      <span>Simulating lecturer explanation...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-xs text-slate-200 font-sans">
                      {demoAnswer}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center pt-2 text-[11px] text-slate-400">
              * Live interactive demonstration. Full platform supports multi-turn audio, PDF chunk grounding, and LaTeX formulas.
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: BUILT FOR STUDENTS (Ugandan Educational Reality)
      ========================================================================= */}
      <section id="built-for-students" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Student-Centered Design
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for the Way Students Learn.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Built for university and secondary students in Uganda who balance lecture schedules, transport logistics, and mobile data constraints.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-blue-700 font-extrabold text-xs uppercase tracking-wider block">
                01. Personalised Learning
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Adaptive Pedagogical Depth</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Switch explanation styles freely from intuitive everyday language to rigorous proofs depending on how confident you feel with the subject.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-teal-700 font-extrabold text-xs uppercase tracking-wider block">
                02. Flexible Study Schedules
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Adaptive Timetables & Pomodoros</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate weekly revision timetables calibrated to your available hours per day, with integrated 45-minute focus blocks and rest intervals.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-purple-700 font-extrabold text-xs uppercase tracking-wider block">
                03. Smartphone-Friendly
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Low-Bandwidth Data Saver Mode</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Toggle data-saver mode to suppress heavy animations and reduce cellular bundle consumption when studying via MTN or Airtel Uganda.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-amber-700 font-extrabold text-xs uppercase tracking-wider block">
                04. Accessible Academic Support
              </span>
              <h3 className="font-bold text-slate-900 text-sm">24/7 Lecturer Assistance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive clear, patient academic explanations late at night or during revision week without waiting for office tutorial hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-sky-700 font-extrabold text-xs uppercase tracking-wider block">
                05. Organised Learning Materials
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Centralized Course Binder</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Keep lecture PDFs, presentation decks, flashcard decks, and practice tests organized by course code (e.g. CSC 2100, BBA 1102).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-emerald-700 font-extrabold text-xs uppercase tracking-wider block">
                06. Continuous Tracking
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Objective Weak-Area Diagnosis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instead of guessing whether you are prepared, review real score averages and specific misunderstood syllabus topics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FEATURES SHOWCASE (Alternating Detailed Layout)
      ========================================================================= */}
      <section className="py-20 bg-white space-y-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Feature Deep Dive
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built with Authentic Academic Rigour.
            </h2>
          </div>

          {/* Feature 1: Document Analyser */}
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Module 01: Lecture Materials
              </span>
              <h3 className="text-2xl font-bold text-slate-900">
                Smart Document Analyser & Chunked Retrieval Q&A
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Upload your course handouts, PDFs, or photos of lecture notes. ScholarMate breaks long materials into
                indexed chunks, extracts key definitions and formulas, and answers student questions with precise citations.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Supports PDF, DOCX, PPTX, text notes, and whiteboard photos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Cites specific document chunks [Chunk #X] for transparent fact verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Instant 1-click transformation of any lecture file into an interactive quiz</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-md space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900">Document Analyser: Database Normalisation.pdf</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    Indexed (8 Chunks)
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-mono leading-relaxed">
                  [Chunk #2: Functional Dependencies & Keys]<br />
                  {"Given relation R(A, B, C, D) with FD set {A -> B, B -> C}, attribute A is the determinant. Transitive dependency exists between A and C."}
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold">
                    Executive Summary Generated
                  </span>
                  <span className="bg-purple-50 text-purple-800 px-2.5 py-1 rounded-lg font-bold">
                    6 Formulas Extracted
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Examination Generator & Timed Exam Room */}
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 lg:order-2 space-y-4">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                Module 02: Assessment Engine
              </span>
              <h3 className="text-2xl font-bold text-slate-900">
                Examination Generator & Proctored Timed Exam Room
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prepare under authentic examination conditions. Configure multi-format questions (MCQ, short answer,
                code writing, and essay), manage your time with live countdown clocks, and get formative evaluation.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Timed countdown timer with auto-submit protection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Answer keys strictly hidden until submission to prevent early cheating</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Formative AI essay grading with criteria-based marking rubrics</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6 lg:order-1">
              <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-100">Exam Room: CSC 2100 Final Practice Paper</span>
                  <span className="font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded text-[11px]">
                    42:15 Remaining
                  </span>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-slate-200 space-y-2">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">Question 3 of 8 (15 Marks)</span>
                  <p className="text-xs">
                    "Write an SQL statement demonstrating an outer join between Students and CourseEnrollments, and explain why a natural join would lose unmatched students."
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Autosaved 10 seconds ago</span>
                  <span className="text-emerald-400">Answer recorded</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: PRICING (3 Configurable Cards)
      ========================================================================= */}
      <section id="pricing" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Transparent & Accessible Access
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Learning Experience.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Start completely free today. Upgrade as your semester intensity and examination preparation demands grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Plan 1: Free */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Free Student Tier
                </span>
                <div className="text-3xl font-extrabold text-slate-900">Free</div>
                <p className="text-xs text-slate-600">
                  Ideal for students starting their semester looking for personalized homework and tutoring assistance.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic AI tutoring allowance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Lecture notes & PDF uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic academic summaries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Topic practice quizzes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Personal study dashboard</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 font-bold text-xs transition cursor-pointer"
              >
                Get Started Free
              </button>
            </div>

            {/* Plan 2: Student Plus */}
            <div className="p-6 rounded-2xl bg-white border-2 border-blue-600 shadow-lg flex flex-col justify-between space-y-6 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                    Student Plus
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Most Popular
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  Academic Pro
                </div>
                <p className="text-xs text-slate-600">
                  For university students preparing for intensive semester tests and final national examinations.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Higher AI tutoring request limits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Advanced document analysis & OCR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Unlimited practice exam papers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Personalised revision plans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Detailed performance insights & weak-topic radar</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Start Plus Experience
              </button>
            </div>

            {/* Plan 3: Institution */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                  Institution
                </span>
                <div className="text-3xl font-extrabold text-slate-900">
                  University / School
                </div>
                <p className="text-xs text-slate-600">
                  For lecturers, faculties, and academic departments monitoring class-wide curriculum comprehension.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Dedicated Lecturer Dashboards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Enrolled student roster management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Publish custom assessments & tests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Class weak-topic comprehension heatmaps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Academic registrar marks CSV export</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectRole('lecturer')}
                className="w-full py-2.5 rounded-xl border border-purple-600 text-purple-700 hover:bg-purple-50 font-bold text-xs transition cursor-pointer"
              >
                Access Educator Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: FAQ (Accordion)
      ========================================================================= */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Got Questions? We’ve Got Answers.
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm sm:text-base text-slate-900 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: FINAL CALL TO ACTION
      ========================================================================= */}
      <section className="py-20 bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>ScholarMate Uganda · Academic Excellence</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Your Next Academic Breakthrough Starts Today.
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Don't just study harder. Study smarter with an AI academic assistant that helps you understand,
            practise and improve.
          </p>

          <div className="pt-3">
            <button
              onClick={onGetStarted}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 11: FOOTER
      ========================================================================= */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1 & 2: Brand & Tagline */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-white">
                  ScholarMate Uganda
                </span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                Learn Smarter. Prepare Better. Achieve More.
                Empowering Ugandan students with personalized AI academic assistance.
              </p>
              <div className="pt-2 text-[10px] text-slate-500">
                Verified with Ugandan tertiary and secondary curricula.
              </div>
            </div>

            {/* Col 3: Product Links */}
            <div className="space-y-2.5">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Product
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                    AI Personal Tutor
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                    Document Analyser
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                    Exam Generator
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                    Revision Planner
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                    Performance Analytics
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Institution & Support */}
            <div className="space-y-2.5">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Educators & Help
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => onSelectRole('lecturer')} className="hover:text-white cursor-pointer">
                    Lecturer Command Center
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectRole('admin')} className="hover:text-white cursor-pointer">
                    Institutional Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('faq')} className="hover:text-white cursor-pointer">
                    Help Centre & FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-white cursor-pointer">
                    Pricing Plans
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Legal & Ethics */}
            <div className="space-y-2.5">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Trust & Security
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer">Terms of Service</span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer">Academic Integrity Policy</span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer">Contact Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
            <span>© {new Date().getFullYear()} ScholarMate Uganda. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>Cloud Firestore ABAC Secured</span>
              <span>·</span>
              <span>Google Gemini 3.8 Flash</span>
              <span>·</span>
              <span>Uganda EdTech</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
