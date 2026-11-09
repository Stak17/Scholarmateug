import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Play,
  HelpCircle,
  PlusCircle,
  BookOpen,
  Target,
  FileText,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { QuizItem } from '../types';
import confetti from 'canvas-confetti';

interface QuizCentreViewProps {
  onNavigateToTutor?: (topic: string) => void;
}

export const QuizCentreView: React.FC<QuizCentreViewProps> = ({ onNavigateToTutor }) => {
  const { quizzes, courses, documents, addQuiz, recordQuizScore, addNotification } = useApp();

  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswersHistory, setUserAnswersHistory] = useState<
    Array<{ questionId: number; selectedOption: number; isCorrect: boolean }>
  >([]);

  // Filter state
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Generator Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState(courses[0]?.name || 'Database Management Systems');
  const [newTopic, setNewTopic] = useState('ACID Transaction Management');
  const [newDifficulty, setNewDifficulty] = useState('intermediate');
  const [newCount, setNewCount] = useState(5);
  const [selectedDocId, setSelectedDocId] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);

  const startQuiz = (quiz: QuizItem) => {
    setActiveQuiz(quiz);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setUserAnswersHistory([]);
    setQuizFinished(false);
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (selectedOption !== null || !activeQuiz) return;
    setSelectedOption(optionIdx);
    setShowExplanation(true);

    const isCorrect = optionIdx === activeQuiz.questions[currentQIndex].correctIndex;
    if (isCorrect) setScore((prev) => prev + 1);

    setUserAnswersHistory((prev) => [
      ...prev,
      {
        questionId: activeQuiz.questions[currentQIndex].id,
        selectedOption: optionIdx,
        isCorrect,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      const finalScoreCount = score + (selectedOption === activeQuiz.questions[currentQIndex].correctIndex ? 1 : 0);
      const finalScorePercentage = Math.round((finalScoreCount / activeQuiz.questions.length) * 100);
      recordQuizScore(activeQuiz.id, finalScorePercentage);
      setQuizFinished(true);

      if (finalScorePercentage >= 70) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      addNotification(
        'Quiz Finished',
        `Scored ${finalScorePercentage}% on ${activeQuiz.title}`,
        'reminder'
      );
    }
  };

  const handleGenerateNewQuiz = async () => {
    setIsGenerating(true);
    try {
      const sourceDoc = documents.find((d) => d.id === selectedDocId);

      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          topic: newTopic,
          difficulty: newDifficulty,
          numQuestions: newCount,
          sourceMaterial: sourceDoc ? sourceDoc.textContent : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');

      const saved = await addQuiz({
        title: data.quiz.title || `${newSubject}: ${newTopic} Quiz`,
        subject: newSubject,
        topic: newTopic,
        questions: data.quiz.questions || [],
      });

      setShowCreateModal(false);
      startQuiz(saved);
      addNotification('New Quiz Ready', `Generated quiz for ${newTopic}`, 'resource');
    } catch (err: any) {
      alert(`Quiz generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (filterSubject === 'all') return true;
    return q.subject === filterSubject;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-600" />
            Smart Academic Quiz Centre
          </h1>
          <p className="text-xs text-slate-500">
            Rapid active-recall assessments with instant objective feedback and pedagogical insights
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Generate Topic Quiz</span>
        </button>
      </div>

      {/* Active Quiz Taking Screen */}
      {activeQuiz && !quizFinished ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6 animate-in fade-in">
          {/* Progress Bar & Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  {activeQuiz.subject}
                </span>
                <h2 className="text-sm font-bold text-slate-900 mt-1">{activeQuiz.title}</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Question {currentQIndex + 1} of {activeQuiz.questions.length}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(((currentQIndex + 1) / activeQuiz.questions.length) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="text-base font-semibold text-slate-900 leading-relaxed">
            {activeQuiz.questions[currentQIndex]?.question}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {activeQuiz.questions[currentQIndex]?.options.map((opt, oIdx) => {
              const isSelected = selectedOption === oIdx;
              const isCorrect = oIdx === activeQuiz.questions[currentQIndex].correctIndex;

              let style = 'border-slate-200 hover:bg-slate-50 text-slate-800';
              if (selectedOption !== null) {
                if (isCorrect) style = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500';
                else if (isSelected) style = 'bg-rose-50 border-rose-500 text-rose-950 ring-1 ring-rose-500';
                else style = 'border-slate-100 opacity-50 text-slate-400';
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectAnswer(oIdx)}
                  disabled={selectedOption !== null}
                  className={`w-full p-4 rounded-2xl border text-xs sm:text-sm text-left transition flex items-center justify-between cursor-pointer leading-relaxed ${style}`}
                >
                  <span>{opt}</span>
                  {selectedOption !== null && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {selectedOption !== null && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-slate-800 space-y-1.5 animate-in fade-in">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Pedagogical Explanation:</span>
              </span>
              <p className="leading-relaxed">{activeQuiz.questions[currentQIndex]?.explanation}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Quit Quiz
            </button>

            {selectedOption !== null && (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentQIndex < activeQuiz.questions.length - 1 ? 'Next Question' : 'View Final Score'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : activeQuiz && quizFinished ? (
        /* Quiz Finished View */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-lg mx-auto text-center space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
              Practice Assessment Completed
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              {activeQuiz.title}
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {score} / {activeQuiz.questions.length}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Percentage</span>
              <div
                className={`text-2xl font-extrabold mt-0.5 ${
                  score / activeQuiz.questions.length >= 0.7
                    ? 'text-emerald-600'
                    : 'text-blue-700'
                }`}
              >
                {Math.round((score / activeQuiz.questions.length) * 100)}%
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            {score >= activeQuiz.questions.length * 0.8
              ? 'Outstanding performance! You have strong conceptual mastery on this syllabus topic.'
              : 'Good active recall practice! Review the missed questions or ask the AI Study Assistant for further clarification.'}
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
            {onNavigateToTutor && (
              <button
                onClick={() => onNavigateToTutor(activeQuiz.topic)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Revise with Tutor</span>
              </button>
            )}
            <button
              onClick={() => setActiveQuiz(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black cursor-pointer"
            >
              Back to Quiz List
            </button>
          </div>
        </div>
      ) : (
        /* Quizzes Archive List */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Course:
            </span>
            <button
              onClick={() => setFilterSubject('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                filterSubject === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Courses
            </button>
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterSubject(c.name)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  filterSubject === c.name
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQuizzes.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {q.subject}
                    </span>
                    {q.lastScore !== undefined && (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Best: {q.lastScore}%
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{q.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Topic: {q.topic}</p>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {q.questions.length} Objective Questions · Immediate Scoring
                  </div>
                </div>

                <button
                  onClick={() => startQuiz(q)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Practice Quiz</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Generate New Quiz */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-600" />
                Generate AI Topic Quiz
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-emerald-600 outline-hidden"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Transaction ACID properties, BST Balances"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base on Uploaded Notes (Optional)
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-emerald-600 outline-hidden"
                >
                  <option value="none">Standard Syllabus Knowledge</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      Lecture Note: {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-emerald-600 outline-hidden"
                  >
                    <option value="easy">Easy</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="difficult">Difficult</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Questions</label>
                  <select
                    value={newCount}
                    onChange={(e) => setNewCount(parseInt(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-emerald-600 outline-hidden"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={8}>8 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateNewQuiz}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isGenerating ? 'Building Quiz...' : 'Generate Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
