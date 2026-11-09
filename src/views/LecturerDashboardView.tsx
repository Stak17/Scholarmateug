import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Users,
  BookOpen,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  Download,
  PlusCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const LecturerDashboardView: React.FC = () => {
  const { courses, quizzes, examinations, publishAssessment } = useApp();

  const [selectedCourse, setSelectedCourse] = useState(courses[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assessmentType, setAssessmentType] = useState<'exam' | 'quiz'>('exam');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDuration, setAssessmentDuration] = useState(60);
  const [assessmentMarks, setAssessmentMarks] = useState(50);
  const [isPublishing, setIsPublishing] = useState(false);
  const [rosterFilter, setRosterFilter] = useState('');

  // Class analytics simulation based on real syllabus data
  const classStats = {
    enrolledStudents: 142,
    quizzesCompleted: 384,
    classAverage: 73,
    misunderstoodTopics: [
      { topic: 'BCNF Functional Dependencies', failureRate: '58% struggle', priority: 'High' },
      { topic: 'CIDR Subnetting Calculations', failureRate: '46% struggle', priority: 'Medium' },
      { topic: 'Deadlock Detection in ACID Transactions', failureRate: '41% struggle', priority: 'Medium' },
    ],
    studentRoster: [
      { id: '1', name: 'Kato Emmanuel', regNo: '24/U/10293', quizAvg: '84%', attendance: '96%', status: 'Excellent' },
      { id: '2', name: 'Namatovu Sarah', regNo: '24/U/10482', quizAvg: '78%', attendance: '90%', status: 'Good' },
      { id: '3', name: 'Mugisha Brian', regNo: '24/U/10921', quizAvg: '54%', attendance: '72%', status: 'At Risk' },
      { id: '4', name: 'Ainembabazi Faith', regNo: '24/U/10114', quizAvg: '91%', attendance: '98%', status: 'First Class' },
      { id: '5', name: 'Okello Joseph', regNo: '24/U/10552', quizAvg: '68%', attendance: '85%', status: 'Good' },
      { id: '6', name: 'Atuhaire Rebecca', regNo: '24/U/10899', quizAvg: '89%', attendance: '95%', status: 'First Class' },
    ],
  };

  const filteredRoster = classStats.studentRoster.filter(
    (s) =>
      s.name.toLowerCase().includes(rosterFilter.toLowerCase()) ||
      s.regNo.toLowerCase().includes(rosterFilter.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Registration No', 'Course', 'Quiz Average', 'Attendance', 'Academic Standing'];
    const rows = classStats.studentRoster.map((s) => [
      `"${s.name}"`,
      `"${s.regNo}"`,
      `"${selectedCourse?.code || 'CSC 2100'}"`,
      `"${s.quizAvg}"`,
      `"${s.attendance}"`,
      `"${s.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ScholarMate_Marks_${selectedCourse?.code || 'CSC2100'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublishAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentTitle.trim() || !selectedCourse) return;

    setIsPublishing(true);
    try {
      const sampleQuestions =
        assessmentType === 'exam'
          ? [
              {
                id: 1,
                type: 'mcq',
                question: `In ${selectedCourse.code}, what is the primary role of indexing?`,
                options: ['Reduce write latency', 'Speed up retrieval queries', 'Normalize data into 3NF', 'Prevent deadlocks'],
                marks: 5,
                suggestedTimeMinutes: 3,
                correctAnswer: 'Speed up retrieval queries',
                explanation: 'Database indexes optimize read query performance at the cost of slight write overhead.',
              },
              {
                id: 2,
                type: 'essay',
                question: `Explain the ACID transactional properties with real-world examples from mobile money banking systems in Uganda.`,
                marks: 20,
                suggestedTimeMinutes: 15,
                correctAnswer: 'Detailed explanation of Atomicity, Consistency, Isolation, and Durability.',
                explanation: 'Must cover complete rollback upon failure and persistent storage.',
              },
            ]
          : [
              {
                id: 1,
                question: `Which normal form eliminates partial functional dependencies?`,
                options: ['1NF', '2NF', '3NF', 'BCNF'],
                correctIndex: 1,
                explanation: 'Second Normal Form (2NF) ensures all non-key attributes are fully functionally dependent on primary key.',
              },
            ];

      await publishAssessment({
        title: assessmentTitle.trim(),
        courseId: selectedCourse.id,
        courseName: `${selectedCourse.code} - ${selectedCourse.name}`,
        type: assessmentType,
        durationMinutes: assessmentDuration,
        totalMarks: assessmentMarks,
        questions: sampleQuestions,
      });

      setShowCreateModal(false);
      setAssessmentTitle('');
    } catch (err: any) {
      alert(`Publishing failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-600" />
            Educator & Lecturer Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Monitor class comprehension, identify misunderstood topics, and publish syllabus assessments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCourse?.id || ''}
            onChange={(e) => setSelectedCourse(courses.find((c) => c.id === e.target.value) || courses[0])}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:border-purple-600 outline-hidden"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                Class: {c.code} ({c.name.slice(0, 25)}...)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish Assessment</span>
          </button>
        </div>
      </div>

      {/* Assessment Publisher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Publish Class Assessment</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishAssessment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedCourse?.code} - ${selectedCourse?.name}`}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assessment Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssessmentType('exam')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                      assessmentType === 'exam'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Timed Examination Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssessmentType('quiz')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                      assessmentType === 'quiz'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Quick Topic Practice Quiz
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="e.g. Test 1: Relational Algebra & Normalization"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-purple-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={assessmentDuration}
                    onChange={(e) => setAssessmentDuration(parseInt(e.target.value) || 45)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-purple-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={assessmentMarks}
                    onChange={(e) => setAssessmentMarks(parseInt(e.target.value) || 50)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-purple-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isPublishing ? 'Publishing...' : 'Publish to Students'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{classStats.enrolledStudents}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Active this semester</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Class Quiz Average</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{classStats.classAverage}%</div>
          <span className="text-[10px] text-slate-400">Target: &gt;70%</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Quiz Submissions</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">{classStats.quizzesCompleted}</div>
          <span className="text-[10px] text-slate-400">Practice drills completed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Critical Misunderstood Areas</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {classStats.misunderstoodTopics.length}
          </div>
          <span className="text-[10px] text-rose-500 font-semibold">Needs Tutorial Review</span>
        </div>
      </div>

      {/* Class Level Misunderstood Topics Radar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Aggregated Class Weak-Topic Heatmap ({selectedCourse?.code})
            </h2>
            <p className="text-[11px] text-slate-500">
              AI aggregated from student quiz mistakes across all submitted assessments
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3.5">
          {classStats.misunderstoodTopics.map((topicItem, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 text-xs">{topicItem.topic}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                  {topicItem.priority}
                </span>
              </div>
              <div className="text-[11px] text-rose-700 font-semibold">
                Frequency: {topicItem.failureRate}
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                Recommendation: Dedicate a 30-minute tutorial on decomposition algorithms before mid-semester tests.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Enrolled Students Performance Roster</h2>
            <p className="text-[11px] text-slate-500">Official student assessment logs for {selectedCourse?.code}</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rosterFilter}
              onChange={(e) => setRosterFilter(e.target.value)}
              placeholder="Search student or reg no..."
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:border-purple-600 outline-hidden bg-slate-50"
            />
            <button
              onClick={handleExportCSV}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Marks CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Registration No.</th>
                <th className="px-5 py-3">Quiz Average</th>
                <th className="px-5 py-3">Attendance</th>
                <th className="px-5 py-3">Academic Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{student.name}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-mono">{student.regNo}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{student.quizAvg}</td>
                  <td className="px-5 py-3.5 text-slate-600">{student.attendance}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        student.status === 'First Class' || student.status === 'Excellent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : student.status === 'Good'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
