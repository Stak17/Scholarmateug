import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Sparkles,
  Clock,
  PlayCircle,
  Award,
  Layers,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ListOrdered,
  Eye,
  FileText,
  RotateCcw,
  Target,
  Code2,
  HelpCircle,
  History,
} from 'lucide-react';
import { ExamItem } from '../types';

interface ExamGeneratorViewProps {
  onStartExam: (exam: ExamItem) => void;
  onNavigate: (view: string) => void;
}

export const ExamGeneratorView: React.FC<ExamGeneratorViewProps> = ({ onStartExam, onNavigate }) => {
  const { courses, documents, examinations, examAttempts, addExam, addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'create' | 'papers' | 'history'>('create');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [topic, setTopic] = useState('Relational Normalization & SQL Queries');
  const [difficulty, setDifficulty] = useState<'easy' | 'intermediate' | 'difficult' | 'mixed'>('intermediate');
  const [questionFormat, setQuestionFormat] = useState('mixed');
  const [numQuestions, setNumQuestions] = useState(8);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedDocId, setSelectedDocId] = useState('none');

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const sourceDoc = documents.find((d) => d.id === selectedDocId);

      const res = await fetch('/api/ai/exam-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedCourse?.name || 'Academic Subject',
          topic,
          difficulty,
          questionFormat,
          numQuestions,
          durationMinutes,
          sourceMaterial: sourceDoc ? sourceDoc.textContent : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate exam');

      const generated = data.exam;

      // Save to database/state
      const savedExam = await addExam({
        courseId: selectedCourse?.id,
        courseName: `${selectedCourse?.code} - ${selectedCourse?.name}`,
        title: generated.title || `${selectedCourse?.name}: ${topic} Examination`,
        subject: selectedCourse?.name || 'General',
        topic,
        instructions: generated.instructions || 'Answer all questions clearly. Time allowed as indicated.',
        durationMinutes: generated.durationMinutes || durationMinutes,
        difficulty,
        totalMarks: generated.totalMarks || 100,
        questions: generated.questions || [],
      });

      setPreviewExam(savedExam);
      addNotification('Examination Paper Ready', `Created "${savedExam.title}"`, 'exam');
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-violet-600" />
            AI Examination Board & Assessment Centre
          </h1>
          <p className="text-xs text-slate-500">
            Generate syllabus-aligned mock examination papers with automated marking schemes and timing
          </p>
        </div>

        {/* Action Header Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('quiz')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Open Quick Quiz Centre</span>
          </button>
          {examinations.length > 0 && (
            <button
              onClick={() => onStartExam(examinations[0])}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Take Recent Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'create'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Generate New Examination
        </button>
        <button
          onClick={() => setActiveTab('papers')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'papers'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Available Papers ({examinations.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>My Attempt History ({examAttempts.length})</span>
        </button>
      </div>

      {/* Tab 1: Create & Generate */}
      {activeTab === 'create' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): Configuration Form */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Configure Examination Parameters
            </h2>

            {/* Target Course */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-violet-600 outline-hidden"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topic / Syllabus Focus
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Relational Normalization, OSI Layers, Microeconomics"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-violet-600 outline-hidden"
              />
            </div>

            {/* Source Document Grounding */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base on Uploaded Study Material (Optional)
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-violet-600 outline-hidden"
              >
                <option value="none">Standard Syllabus Knowledge</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    Lecture Note: {d.title} ({d.fileType})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Select uploaded PDF/Word notes to set questions directly from your class handouts.
              </span>
            </div>

            {/* Difficulty & Format */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-violet-600 outline-hidden"
                >
                  <option value="easy">Easy (Fundamentals)</option>
                  <option value="intermediate">Intermediate (Standard)</option>
                  <option value="difficult">Difficult (Advanced)</option>
                  <option value="mixed">Mixed (Multi-Tier)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Style</label>
                <select
                  value={questionFormat}
                  onChange={(e) => setQuestionFormat(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-violet-600 outline-hidden"
                >
                  <option value="mixed">Mixed (All Formats)</option>
                  <option value="mcq">Multiple Choice Only (MCQ)</option>
                  <option value="true_false">True / False Only</option>
                  <option value="short_answer">Short Answer Only</option>
                  <option value="essay">Essay & Case Studies</option>
                  <option value="programming">Programming & Practical</option>
                </select>
              </div>
            </div>

            {/* Questions & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Quantity</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-violet-600 outline-hidden"
                >
                  <option value={5}>5 Questions (Quick Test)</option>
                  <option value={8}>8 Questions (Standard)</option>
                  <option value={10}>10 Questions (Full Paper)</option>
                  <option value={15}>15 Questions (Intensive)</option>
                  <option value={20}>20 Questions (Final Mock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-violet-600 outline-hidden"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={90}>90 Minutes (1.5 Hours)</option>
                  <option value={120}>120 Minutes (2 Hours)</option>
                  <option value={180}>180 Minutes (3 Hours)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isGenerating ? 'Gemini AI Setting Paper...' : 'Generate Official Exam Paper'}</span>
            </button>
          </div>

          {/* Right Column (7 cols): Exam Preview or Examination Archive */}
          <div className="lg:col-span-7 space-y-4">
            {previewExam ? (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-violet-300 shadow-md space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 uppercase tracking-wide">
                      New Paper Ready
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">
                      {previewExam.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{previewExam.instructions}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-violet-700 block">
                      {previewExam.totalMarks} Marks
                    </span>
                    <span className="text-[11px] text-slate-500">{previewExam.durationMinutes} Minutes</span>
                  </div>
                </div>

                {/* Sample Questions Preview */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {previewExam.questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-500 font-semibold text-[10px]">
                        <span className="font-bold text-slate-800">
                          Question {idx + 1} ({q.type.toUpperCase().replace('_', ' ')})
                        </span>
                        <span className="font-bold text-violet-700">{q.marks} Marks</span>
                      </div>
                      <p className="font-medium text-slate-900 leading-relaxed">{q.question}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {previewExam.questions.length} questions prepared
                  </span>
                  <button
                    onClick={() => onStartExam(previewExam)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Enter Timed Exam Room</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Recently Prepared Mock Papers</h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {examinations.length} available
                  </span>
                </div>

                <div className="space-y-3">
                  {examinations.slice(0, 4).map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-violet-50/40 hover:border-violet-300 transition flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {exam.subject}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{exam.durationMinutes} mins</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-violet-700">{exam.totalMarks} marks</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mt-1 truncate">{exam.title}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{exam.instructions}</p>
                      </div>

                      <button
                        onClick={() => onStartExam(exam)}
                        className="shrink-0 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Take Exam</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Available Papers Archive */}
      {activeTab === 'papers' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {examinations.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-violet-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {exam.subject}
                  </span>
                  <span className="font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                    {exam.totalMarks} Marks
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{exam.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Topic: {exam.topic}</p>

                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {exam.durationMinutes} mins
                  </span>
                  <span>•</span>
                  <span>{exam.questions.length} questions</span>
                  <span>•</span>
                  <span className="capitalize text-violet-600 font-semibold">{exam.difficulty}</span>
                </div>
              </div>

              <button
                onClick={() => onStartExam(exam)}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Begin Examination</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: My Attempt History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Student Examination History</h3>
              <p className="text-xs text-slate-500">
                All submitted attempts are recorded permanently in Firestore
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {examAttempts.length} attempts completed
            </span>
          </div>

          {examAttempts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No examination attempts yet.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs"
              >
                Take Your First Exam
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {examAttempts.map((att) => {
                const matchedExam = examinations.find((e) => e.id === att.examId);
                return (
                  <div
                    key={att.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {att.subject || 'Academic'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">
                          {new Date(att.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1">
                        {att.examTitle}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{att.feedback}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-lg font-extrabold ${
                            att.percentage >= 70
                              ? 'text-emerald-600'
                              : att.percentage >= 50
                              ? 'text-blue-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {att.percentage}%
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {att.score} / {att.totalMarks} Marks
                        </span>
                      </div>

                      {matchedExam && (
                        <button
                          onClick={() => onStartExam(matchedExam)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Paper</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
