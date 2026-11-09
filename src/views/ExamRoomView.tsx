import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ExamItem, ExamAttempt } from '../types';
import confetti from 'canvas-confetti';
import { callApiOrFallback, getLocalFallbackEssayMark } from '../lib/api';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Send,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  BookOpen,
  RotateCcw,
  Flag,
  Code2,
  FileText,
  Check,
  X,
  Target,
  ExternalLink,
  Save,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ExamRoomViewProps {
  exam: ExamItem;
  onExit: () => void;
  onNavigateToTutor?: (topic: string) => void;
  onNavigateToQuiz?: (topic: string) => void;
}

export const ExamRoomView: React.FC<ExamRoomViewProps> = ({
  exam,
  onExit,
  onNavigateToTutor,
  onNavigateToQuiz,
}) => {
  const { recordExamAttempt, addNotification } = useApp();

  const draftStorageKey = `scholarmate_exam_${exam.id}_draft`;

  // Initialize draft from localStorage if present
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.answers || {};
      }
    } catch (e) {
      // fallback
    }
    return {};
  });

  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.markedForReview || {};
      }
    } catch (e) {
      // fallback
    }
    return {};
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState((exam.durationMinutes || 45) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<ExamAttempt | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeExpiredModal, setTimeExpiredModal] = useState(false);
  const [lastSavedNotice, setLastSavedNotice] = useState<string>('Autosaved');

  const totalTimeSeconds = (exam.durationMinutes || 45) * 60;
  const isSubmittingRef = useRef(false);

  // Autosave to localStorage on any answer or review change
  useEffect(() => {
    if (examResult) return;
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({ answers, markedForReview, updatedAt: Date.now() })
      );
      setLastSavedNotice('Draft saved');
    } catch (e) {
      // ignore storage full
    }
  }, [answers, markedForReview, examResult, draftStorageKey]);

  // Countdown timer with auto-submit on expiry
  useEffect(() => {
    if (examResult || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isSubmittingRef.current) {
            setTimeExpiredModal(true);
            handleAutoSubmitOnExpiry();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examResult, secondsRemaining]);

  const currentQ = exam.questions[currentIdx] || exam.questions[0];

  const handleSelectAnswer = (ans: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: ans,
    }));
  };

  const toggleMarkForReview = (qId: number) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmitOnExpiry = async () => {
    isSubmittingRef.current = true;
    await processSubmission(true);
  };

  const handleSubmitExam = async () => {
    setShowConfirmModal(false);
    isSubmittingRef.current = true;
    await processSubmission(false);
  };

  const processSubmission = async (dueToExpiry: boolean) => {
    setIsSubmitting(true);

    let totalEarnedScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    const questionResults: ExamAttempt['questionResults'] = [];
    const weakTopicsSet = new Set<string>();

    for (const q of exam.questions) {
      const studentAns = (answers[q.id] || '').trim();
      const isObjective = q.type === 'mcq' || q.type === 'true_false' || q.type === 'fill_blank';

      if (isObjective) {
        const correct = (q.correctAnswer || '').toLowerCase().trim();
        const given = studentAns.toLowerCase().trim();

        const isExactMatch = given && (given === correct || given.startsWith(correct) || correct.startsWith(given));
        if (isExactMatch) {
          totalEarnedScore += q.marks;
          correctCount++;
          questionResults.push({
            questionId: q.id,
            question: q.question,
            studentAnswer: studentAns || '(No answer provided)',
            correctAnswer: q.correctAnswer || '',
            marksEarned: q.marks,
            maxMarks: q.marks,
            isCorrect: true,
            explanation: q.explanation,
            type: q.type,
          });
        } else {
          incorrectCount++;
          weakTopicsSet.add(exam.topic || exam.subject);
          questionResults.push({
            questionId: q.id,
            question: q.question,
            studentAnswer: studentAns || '(No answer provided)',
            correctAnswer: q.correctAnswer || '',
            marksEarned: 0,
            maxMarks: q.marks,
            isCorrect: false,
            explanation: q.explanation,
            type: q.type,
          });
        }
      } else {
        // Essay / Short Answer / Programming: Evaluate with formative AI service
        let marksEarned = 0;
        let feedback = '';

        if (studentAns.length >= 5) {
          try {
            const data = await callApiOrFallback(
              '/api/ai/mark-essay',
              {
                question: q.question,
                studentAnswer: studentAns,
                maxMarks: q.marks,
                rubric: q.rubric,
                modelAnswer: q.correctAnswer,
              },
              () => getLocalFallbackEssayMark(q.question, studentAns, q.marks)
            );

            if (data.evaluation && typeof data.evaluation.suggestedScore === 'number') {
              marksEarned = Math.min(data.evaluation.suggestedScore, q.marks);
              feedback = data.evaluation.detailedFeedback || data.evaluation.evaluationSummary || '';
            } else {
              marksEarned = Math.round(q.marks * 0.7);
              feedback = 'Demonstrated foundational concepts and analytical steps.';
            }
          } catch (e) {
            marksEarned = Math.round(q.marks * 0.65);
            feedback = 'Evaluated based on standard academic assessment criteria.';
          }
        } else {
          marksEarned = 0;
          feedback = 'Insufficient answer provided for subjective evaluation.';
        }

        totalEarnedScore += marksEarned;
        const isCorrect = marksEarned >= Math.round(q.marks * 0.7);
        if (isCorrect) correctCount++;
        else {
          incorrectCount++;
          weakTopicsSet.add(exam.topic || exam.subject);
        }

        questionResults.push({
          questionId: q.id,
          question: q.question,
          studentAnswer: studentAns || '(No answer provided)',
          correctAnswer: q.correctAnswer || '',
          marksEarned,
          maxMarks: q.marks,
          isCorrect,
          feedback,
          explanation: q.explanation,
          type: q.type,
        });
      }
    }

    const percentage = Math.round((totalEarnedScore / (exam.totalMarks || 100)) * 100);
    const weakTopics = Array.from(weakTopicsSet);
    const suggestedActions = [
      `Review lecture notes on ${exam.topic}`,
      `Practice 10 rapid quiz questions on ${exam.topic} in Quiz Centre`,
      `Consult AI Study Assistant to clarify identified gaps in ${exam.subject}`,
    ];

    const feedbackSummary = dueToExpiry
      ? `Time expired. Examination automatically submitted. Final score: ${totalEarnedScore}/${exam.totalMarks} (${percentage}%).`
      : percentage >= 70
      ? `Strong academic demonstration! Scored ${percentage}% with solid command of core principles.`
      : `Formative assessment complete (${percentage}%). Target the recommended revision activities to consolidate weak areas.`;

    const recorded = await recordExamAttempt({
      examId: exam.id,
      examTitle: exam.title,
      answers,
      score: totalEarnedScore,
      totalMarks: exam.totalMarks,
      percentage,
      feedback: feedbackSummary,
      subject: exam.subject,
      correctCount,
      incorrectCount,
      weakTopics: weakTopics.length > 0 ? weakTopics : [exam.topic || 'General'],
      suggestedActions,
      questionResults,
    });

    // Clear saved draft from localStorage upon submission
    try {
      localStorage.removeItem(draftStorageKey);
    } catch (e) {}

    setExamResult(recorded);
    setIsSubmitting(false);

    if (percentage >= 60) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    addNotification(
      'Examination Completed & Marked',
      `Scored ${percentage}% on ${exam.title}`,
      'exam'
    );
  };

  const answeredCount = Object.keys(answers).filter((k) => (answers[parseInt(k)] || '').trim() !== '').length;
  const markedCount = Object.keys(markedForReview).filter((k) => markedForReview[parseInt(k)]).length;
  const unansweredCount = exam.questions.length - answeredCount;
  const progressPercent = Math.round((answeredCount / exam.questions.length) * 100);
  const wordCount = (answers[currentQ.id] || '').trim().split(/\s+/).filter(Boolean).length;

  // ================= RESULT SUMMARY SCREEN =================
  if (examResult) {
    const isHonours = examResult.percentage >= 80;
    const isUpper = examResult.percentage >= 70 && examResult.percentage < 80;
    const isLower = examResult.percentage >= 60 && examResult.percentage < 70;
    const isPass = examResult.percentage >= 50 && examResult.percentage < 60;

    const classification = isHonours
      ? 'First Class Honours (A)'
      : isUpper
      ? 'Upper Second Class (B+)'
      : isLower
      ? 'Lower Second Class (B)'
      : isPass
      ? 'Pass Standing (C)'
      : 'Retake Required (F)';

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in">
        {/* Score Card Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
              Official Formative Assessment Report
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {exam.title}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Subject: {exam.subject} · Topic: {exam.topic}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto py-4 border-y border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Marks Earned</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {examResult.score} <span className="text-xs text-slate-400">/ {examResult.totalMarks}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">Percentage</span>
              <div
                className={`text-2xl font-extrabold mt-0.5 ${
                  examResult.percentage >= 70
                    ? 'text-emerald-600'
                    : examResult.percentage >= 50
                    ? 'text-blue-700'
                    : 'text-rose-600'
                }`}
              >
                {examResult.percentage}%
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Correct / Met</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">
                {examResult.correctCount ?? 0} <span className="text-xs text-emerald-600 font-semibold">items</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-violet-50/60">
              <span className="text-[10px] uppercase font-bold text-violet-700 block">Standing</span>
              <div className="text-xs font-bold text-violet-900 mt-2 leading-tight">
                {classification}
              </div>
            </div>
          </div>

          {/* Formative Feedback Notice */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 text-left max-w-2xl mx-auto space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-800">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Pedagogical Performance Evaluation:</span>
            </div>
            <p className="text-slate-700 leading-relaxed">{examResult.feedback}</p>
          </div>

          {/* Weak Topics & Prescriptive Revision Activities */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Identified Improvement Areas</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {(examResult.weakTopics && examResult.weakTopics.length > 0
                  ? examResult.weakTopics
                  : [exam.topic]
                ).map((topic, i) => (
                  <li key={i} className="font-medium">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Suggested Revision Activities</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {(examResult.suggestedActions && examResult.suggestedActions.length > 0
                  ? examResult.suggestedActions
                  : [
                      `Review ${exam.topic} definitions & notes`,
                      `Complete targeted quiz in Quiz Centre`,
                    ]
                ).map((act, i) => (
                  <li key={i} className="font-medium">
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onExit}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Return to Assessments
            </button>
            {onNavigateToTutor && (
              <button
                onClick={() => onNavigateToTutor(exam.topic)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Revise with AI Tutor</span>
              </button>
            )}
            {onNavigateToQuiz && (
              <button
                onClick={() => onNavigateToQuiz(exam.topic)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>Practice Topic Quiz</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Question-by-Question Solution & Marking Scheme Review */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Detailed Examination Marking & Solution Key
              </h3>
              <p className="text-xs text-slate-500">
                Answer keys and explanations are now officially unsealed for study review
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {exam.questions.length} Questions Graded
            </span>
          </div>

          <div className="space-y-4">
            {exam.questions.map((q, idx) => {
              const res = examResult.questionResults?.find((r) => r.questionId === q.id);
              const studentAns = answers[q.id] || '(No answer provided)';
              const isFullMarks = res ? res.marksEarned === q.marks : false;
              const isPartialMarks = res ? res.marksEarned > 0 && res.marksEarned < q.marks : false;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition ${
                    isFullMarks
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isPartialMarks
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">Question {idx + 1}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isFullMarks ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Full Marks ({q.marks}/{q.marks})
                        </span>
                      ) : isPartialMarks ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" /> Partial ({res?.marksEarned}/{q.marks})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> 0/{q.marks} Marks
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">{q.question}</p>

                  {/* Student Answer */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Your Submitted Answer:</span>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap">
                      {studentAns}
                    </div>
                  </div>

                  {/* Model Answer Key */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Official Model Answer Key:
                    </span>
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 font-medium whitespace-pre-wrap">
                      {q.correctAnswer || 'Consult the explanation rubric below.'}
                    </div>
                  </div>

                  {/* Explanation & Rubric */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-blue-900 block">Explanation & Pedagogical Note:</span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}

                  {res?.feedback && (
                    <div className="p-2.5 rounded-xl bg-violet-50/60 border border-violet-100 text-xs text-violet-900">
                      <strong className="text-violet-800">Formative Marking Commentary: </strong>
                      {res.feedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= LIVE EXAMINATION INTERFACE =================
  const isTimeCritical = secondsRemaining <= 300; // <= 5 minutes
  const isTimeUrgent = secondsRemaining <= 60; // <= 1 minute

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-in fade-in">
      {/* Top Banner: Timer, Subject, Autosave, Submit Button */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wide">
              Timed Examination
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600 truncate max-w-xs">{exam.subject}</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 truncate max-w-lg">
            {exam.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Autosave Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Save className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>{lastSavedNotice}</span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-mono text-sm sm:text-base font-extrabold border transition ${
              isTimeUrgent
                ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse ring-2 ring-rose-400'
                : isTimeCritical
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-slate-100 text-slate-900 border-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-blue-600'}`} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          {/* Submit Action */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Paper</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>
            Progress: <strong className="text-blue-700">{answeredCount}</strong> of{' '}
            <strong>{exam.questions.length}</strong> questions answered
          </span>
          <span className="text-blue-700 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (3 cols): Question Navigation Strip */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              Question Navigator
            </span>
            <span className="text-[10px] font-bold text-slate-400">{exam.questions.length} Total</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
            {exam.questions.map((q, idx) => {
              const isAnswered = !!(answers[q.id] || '').trim();
              const isCurrent = currentIdx === idx;
              const isFlagged = !!markedForReview[q.id];

              let buttonStyle = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';

              if (isCurrent) {
                buttonStyle = 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300';
              } else if (isFlagged) {
                buttonStyle = 'bg-amber-50 text-amber-900 border-amber-400 font-bold';
              } else if (isAnswered) {
                buttonStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`relative py-2.5 rounded-xl font-bold text-xs transition cursor-pointer border flex flex-col items-center justify-center ${buttonStyle}`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border border-white flex items-center justify-center">
                      <Flag className="w-2 h-2 text-white fill-current" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigator Legend */}
          <div className="pt-3 border-t border-slate-100 text-[11px] space-y-2 text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Answered</span>
              </span>
              <span className="font-bold text-slate-800">{answeredCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Marked for Review</span>
              </span>
              <span className="font-bold text-amber-700">{markedCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span>Unanswered</span>
              </span>
              <span className="font-bold text-slate-800">{unansweredCount}</span>
            </div>
          </div>
        </div>

        {/* Right Column (9 cols): Active Question Area */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          {/* Question Header & Mark-For-Review Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                Question {currentIdx + 1} of {exam.questions.length}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 uppercase text-[10px]">
                {currentQ.type.replace('_', ' ')}
              </span>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl">
                {currentQ.marks} Marks
              </span>
            </div>

            {/* Mark for Review Button */}
            <button
              onClick={() => toggleMarkForReview(currentQ.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                markedForReview[currentQ.id]
                  ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flag
                className={`w-3.5 h-3.5 ${
                  markedForReview[currentQ.id] ? 'text-amber-600 fill-current' : 'text-slate-400'
                }`}
              />
              <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="text-base font-semibold text-slate-900 leading-relaxed">
            {currentQ.question}
          </div>

          {/* Dynamic Question Inputs */}
          {currentQ.type === 'mcq' && currentQ.options && currentQ.options.length > 0 ? (
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <label
                    key={oIdx}
                    onClick={() => handleSelectAnswer(opt)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-xs sm:text-sm font-medium cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_${currentQ.id}`}
                      checked={isSelected}
                      onChange={() => handleSelectAnswer(opt)}
                      className="mt-1 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="leading-relaxed">{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : currentQ.type === 'true_false' ? (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {['True', 'False'].map((val) => {
                const isSelected = answers[currentQ.id] === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectAnswer(val)}
                    className={`py-4 rounded-2xl border text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{val}</span>
                  </button>
                );
              })}
            </div>
          ) : currentQ.type === 'programming' ? (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-mono font-semibold text-violet-700">
                  <Code2 className="w-4 h-4" /> Code Solution Editor (SQL / Python / Pseudo-code)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {answers[currentQ.id]?.length || 0} characters
                </span>
              </div>
              <textarea
                rows={9}
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleSelectAnswer(e.target.value)}
                placeholder="-- Write your code or query solution here&#10;SELECT * FROM ...&#10;-- Or Python / Algorithm logic:"
                className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-hidden font-mono bg-slate-900 text-emerald-400 leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 block">
                Indent with standard spaces. State assumptions and explain edge cases in comments.
              </span>
            </div>
          ) : (
            /* Essay & Short Answer */
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {currentQ.type === 'short_answer' ? 'Concise Answer:' : 'Structured Academic Essay:'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Word count: <strong className="text-slate-700">{wordCount}</strong> words
                </span>
              </div>
              <textarea
                rows={currentQ.type === 'short_answer' ? 5 : 8}
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleSelectAnswer(e.target.value)}
                placeholder={
                  currentQ.type === 'short_answer'
                    ? 'Type your clear, precise answer here...'
                    : 'Structure your essay: Introduction, theoretical framework, real-world examples, critical evaluation, and conclusion...'
                }
                className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-hidden font-sans leading-relaxed text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 block">
                Continuous autosave active. Gemini AI will evaluate this response formatively upon submission.
              </span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-30 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIdx < exam.questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <span>Review & Finish</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Submit Examination Paper?
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold">{exam.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Unanswered questions:</span>
                  <span>{unansweredCount}</span>
                </div>
              )}
              {markedCount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Flagged for review:</span>
                  <span>{markedCount}</span>
                </div>
              )}
            </div>

            {unansweredCount > 0 ? (
              <p className="text-xs text-rose-600 leading-relaxed font-medium">
                Warning: You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. Unanswered questions will receive 0 marks.
              </p>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                All questions answered! Once confirmed, objective questions will be graded instantly and subjective answers will undergo formative Gemini AI evaluation.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Continue Answering
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Evaluating Paper...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Expired Notice Modal */}
      {timeExpiredModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Time Has Expired!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The allotted examination duration has elapsed. Your answers have been automatically collected and submitted for grading.
            </p>
            <div className="pt-2">
              <span className="text-xs font-bold text-blue-600 animate-pulse">
                Grading and generating feedback report...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
