import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BookOpen,
  Coffee,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';

export const RevisionPlannerView: React.FC = () => {
  const { studyPlan, courses, saveStudyPlan, logStudySession, addNotification } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [examDate, setExamDate] = useState(studyPlan?.examDate || '2026-12-05');
  const [dailyHours, setDailyHours] = useState(studyPlan?.dailyTargetHours || 4);
  const [difficultTopicsInput, setDifficultTopicsInput] = useState('BCNF Normalisation, CIDR Subnetting, AVL Trees');
  const [priorities, setPriorities] = useState('Pass with First Class Honors');
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>({});
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState('Monday');
  const [newSlotCourse, setNewSlotCourse] = useState(courses[0]?.name || 'Database Systems');
  const [newSlotTopic, setNewSlotTopic] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('14:00 - 15:30');
  const [newSlotActivity, setNewSlotActivity] = useState('Active Recall / Practice Questions');

  // Pomodoro Focus Timer State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(45 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');

  React.useEffect(() => {
    let interval: any = null;
    if (pomodoroRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0 && pomodoroRunning) {
      setPomodoroRunning(false);
      if (pomodoroMode === 'study') {
        logStudySession({
          courseName: newSlotCourse || 'Course Revision',
          topic: 'Pomodoro Focused Study Session',
          durationMinutes: 45,
          date: new Date().toISOString().split('T')[0],
          completed: true,
        });
        addNotification('Pomodoro Done!', 'Great work! Take a 15-minute rest.', 'reminder');
        setPomodoroMode('break');
        setPomodoroSeconds(15 * 60);
      } else {
        addNotification('Break Ended', 'Ready to begin your next study interval?', 'reminder');
        setPomodoroMode('study');
        setPomodoroSeconds(45 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroSeconds, pomodoroMode, newSlotCourse]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTopic.trim() || !studyPlan) return;

    const updatedSchedule = studyPlan.weeklySchedule.map((d) => {
      if (d.day === newSlotDay) {
        return {
          ...d,
          sessions: [
            ...d.sessions,
            {
              timeSlot: newSlotTime,
              course: newSlotCourse,
              topic: newSlotTopic.trim(),
              activityType: newSlotActivity,
              priority: 'High' as const,
            },
          ],
        };
      }
      return d;
    });

    saveStudyPlan({
      ...studyPlan,
      weeklySchedule: updatedSchedule,
    });

    setShowAddSlotModal(false);
    setNewSlotTopic('');
    addNotification('Study Slot Added', `Scheduled revision on ${newSlotDay}: ${newSlotTopic}`, 'reminder');
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/revision-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate,
          courses: courses.map((c) => c.name),
          availableHoursPerDay: dailyHours,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          difficultTopics: difficultTopicsInput.split(',').map((t) => t.trim()),
          academicPriorities: priorities,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate timetable');

      const planData = data.plan;

      await saveStudyPlan({
        examDate,
        dailyTargetHours: dailyHours,
        summary: planData.summary || 'Adaptive academic timetable.',
        weeklySchedule: planData.weeklySchedule || [],
        milestones: planData.milestones || [],
        tips: planData.tips || [],
      });

      addNotification('Revision Plan Updated', 'Your AI timetable is generated and synced', 'reminder');
    } catch (err: any) {
      alert(`Planner error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSessionCompleted = (key: string, course: string, topic: string) => {
    const isDone = !completedSessions[key];
    setCompletedSessions((prev) => ({ ...prev, [key]: isDone }));

    if (isDone) {
      logStudySession({
        courseName: course,
        topic,
        durationMinutes: 45,
        date: new Date().toISOString().split('T')[0],
        completed: true,
      });
      addNotification('Study Session Completed', `Logged 45 mins on ${topic}`, 'reminder');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-600" />
            Personal AI Revision Planner
          </h1>
          <p className="text-xs text-slate-500">
            Adaptive study timetable incorporating active recall, weak-topic drills, and mandatory break intervals
          </p>
        </div>
      </div>

      {/* Plan Configuration & Strategy Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800">Timetable Parameters</span>
          <span className="text-[10px] text-slate-400">Powered by Gemini Strategic Planner</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-sky-600 outline-hidden bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available Daily Hours
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value) || 3)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-sky-600 outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Weak / Difficult Topics to Prioritize
            </label>
            <input
              type="text"
              value={difficultTopicsInput}
              onChange={(e) => setDifficultTopicsInput(e.target.value)}
              placeholder="e.g. Normalisation, Subnetting, Dynamic Programming"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-sky-600 outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Includes 15-min Pomodoro break intervals automatically</span>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isGenerating ? 'Structuring Plan...' : 'Generate Adaptive Timetable'}</span>
          </button>
        </div>
      </div>

      {/* Add Custom Slot Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Add Custom Study Slot</h3>
              </div>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomSlot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Study Day</label>
                <select
                  value={newSlotDay}
                  onChange={(e) => setNewSlotDay(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-600 outline-hidden"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course</label>
                <select
                  value={newSlotCourse}
                  onChange={(e) => setNewSlotCourse(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-600 outline-hidden"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={`${c.code} - ${c.name}`}>
                      {c.code} ({c.name.slice(0, 25)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic / Revision Focus</label>
                <input
                  type="text"
                  required
                  value={newSlotTopic}
                  onChange={(e) => setNewSlotTopic(e.target.value)}
                  placeholder="e.g. Normalization Derivation Exercises"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sky-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    placeholder="14:00 - 15:30"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sky-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Activity Type</label>
                  <select
                    value={newSlotActivity}
                    onChange={(e) => setNewSlotActivity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:border-sky-600 outline-hidden text-[11px]"
                  >
                    <option value="Active Recall / Practice Questions">Practice Questions</option>
                    <option value="Deep Concept Notes Review">Concept Review</option>
                    <option value="Spaced-Repetition Flashcards">Flashcards Drill</option>
                    <option value="Past Paper Simulation">Mock Exam Simulation</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs transition cursor-pointer"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable Overview & Schedule */}
      {studyPlan ? (
        <div className="space-y-6">
          {/* Pomodoro Focus & Schedule Controls */}
          <div className="grid md:grid-cols-12 gap-4">
            {/* Pomodoro Focus Box (7 cols) */}
            <div className="md:col-span-7 p-4 rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-900 text-white shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                    Pomodoro Focus Interval
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      pomodoroMode === 'study' ? 'bg-sky-400/20 text-sky-300' : 'bg-emerald-400/20 text-emerald-300'
                    }`}
                  >
                    {pomodoroMode === 'study' ? '45m Study' : '15m Break'}
                  </span>
                </div>
                <div className="text-3xl font-extrabold font-mono tracking-tight">
                  {formatTimer(pomodoroSeconds)}
                </div>
                <p className="text-[11px] text-sky-200">
                  {pomodoroRunning
                    ? 'Interval active. Stay focused on your notes.'
                    : 'Press Start to begin a distraction-free revision block.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPomodoroRunning(!pomodoroRunning)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer ${
                    pomodoroRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-sky-400 hover:bg-sky-300 text-slate-900'
                  }`}
                >
                  {pomodoroRunning ? 'Pause' : 'Start Focus'}
                </button>
                <button
                  onClick={() => {
                    setPomodoroRunning(false);
                    setPomodoroSeconds(pomodoroMode === 'study' ? 45 * 60 : 15 * 60);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Quick Actions & Completion Metric (5 cols) */}
            <div className="md:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Weekly Progress</span>
                  <div className="text-xl font-extrabold text-sky-600 mt-0.5">
                    {Object.values(completedSessions).filter(Boolean).length} Sessions Done
                  </div>
                </div>
                <button
                  onClick={() => setShowAddSlotModal(true)}
                  className="px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-sky-600" />
                  <span>Add Study Slot</span>
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Log completed sessions to feed into your Academic Analytics and streak counter.
              </div>
            </div>
          </div>

          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-start gap-3">
            <Flame className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Academic Strategy Overview:</span>
              <p className="mt-0.5 leading-relaxed text-slate-700">{studyPlan.summary}</p>
            </div>
          </div>

          {/* Weekly Schedule Days Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyPlan.weeklySchedule.map((daySchedule, dIdx) => (
              <div
                key={dIdx}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-sm text-slate-900">{daySchedule.day}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 truncate max-w-[130px]">
                      {daySchedule.focusCourse}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {daySchedule.sessions.map((sess, sIdx) => {
                      const sessionKey = `${daySchedule.day}-${sIdx}`;
                      const isCompleted = !!completedSessions[sessionKey];

                      return (
                        <div
                          key={sIdx}
                          onClick={() =>
                            toggleSessionCompleted(sessionKey, sess.course, sess.topic)
                          }
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                            isCompleted
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                              : 'bg-slate-50 border-slate-200 hover:bg-sky-50/50 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold">
                            <span className="font-mono text-slate-600">{sess.timeSlot}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                                sess.priority === 'High'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {sess.priority}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                            {isCompleted ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className={isCompleted ? 'line-through text-slate-500' : ''}>
                              {sess.topic}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 mt-1 ml-5">
                            Activity: {sess.activityType}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 text-right">
                  Click a session to toggle completed
                </div>
              </div>
            ))}
          </div>

          {/* Milestones & Tips */}
          <div className="grid md:grid-cols-2 gap-4">
            {studyPlan.milestones && studyPlan.milestones.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Weekly Milestones</span>
                <div className="space-y-2">
                  {studyPlan.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] shrink-0">
                        {m.week}
                      </span>
                      <p className="text-slate-700">{m.goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {studyPlan.tips && studyPlan.tips.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Examiner & Study Habit Advice
                </span>
                <ul className="space-y-2 text-xs text-slate-600">
                  {studyPlan.tips.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            No study plan active. Click "Generate Adaptive Timetable" above to create one.
          </p>
        </div>
      )}
    </div>
  );
};
