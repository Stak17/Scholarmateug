import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  PlusCircle,
  FileText,
  Brain,
  Sparkles,
  Trash2,
  FolderOpen,
  User,
  School,
  ExternalLink,
} from 'lucide-react';
import { Course } from '../types';

interface CourseManagementViewProps {
  onNavigateToTutor: (subjectName: string) => void;
  onNavigateToAnalyser: (courseId: string) => void;
}

export const CourseManagementView: React.FC<CourseManagementViewProps> = ({
  onNavigateToTutor,
  onNavigateToAnalyser,
}) => {
  const { courses, documents, quizzes, addCourse, deleteCourse, addNotification } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [semester, setSemester] = useState('Semester 1');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [topicsStr, setTopicsStr] = useState('');

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(courses[0] || null);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const topics = topicsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newCourse = await addCourse({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      lecturerName: lecturerName.trim() || 'Department Faculty',
      semester,
      academicYear,
      topics: topics.length > 0 ? topics : ['Core Foundations', 'Practical Application'],
    });

    setSelectedCourse(newCourse);
    setShowAddModal(false);
    setCode('');
    setName('');
    setDescription('');
    setLecturerName('');
    setTopicsStr('');
    addNotification('Course Created', `Enrolled into ${newCourse.code}`, 'resource');
  };

  const courseDocs = documents.filter((d) => d.courseId === selectedCourse?.id);
  const courseQuizzes = quizzes.filter((q) => q.courseId === selectedCourse?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            Course & Subject Management
          </h1>
          <p className="text-xs text-slate-500">
            Organise registered syllabus modules, lecture materials, and dedicated AI tutors
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Courses List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span>Enrolled Courses ({courses.length})</span>
          </div>

          <div className="space-y-2.5">
            {courses.map((c) => {
              const isSelected = selectedCourse?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourse(c)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                      {c.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{c.semester}</span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">{c.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {c.lecturerName || 'Faculty Lecturer'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Course Detail (8 cols) */}
        <div className="lg:col-span-8">
          {selectedCourse ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800">
                      {selectedCourse.code}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedCourse.academicYear} · {selectedCourse.semester}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                    {selectedCourse.name}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    {selectedCourse.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lecturer: {selectedCourse.lecturerName || 'Department Faculty'}</span>
                  </div>
                </div>

                {/* Course AI Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateToTutor(selectedCourse.name)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ask Course Tutor</span>
                  </button>
                  <button
                    onClick={() => onNavigateToAnalyser(selectedCourse.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Upload Notes</span>
                  </button>
                </div>
              </div>

              {/* Syllabus Topics */}
              <div>
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  Syllabus Topics & Core Modules
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.topics && selectedCourse.topics.length > 0 ? (
                    selectedCourse.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No specific topics configured.</span>
                  )}
                </div>
              </div>

              {/* Linked Documents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Uploaded Notes & Resources ({courseDocs.length})
                  </h3>
                </div>

                {courseDocs.length > 0 ? (
                  <div className="space-y-2">
                    {courseDocs.map((docItem) => (
                      <div
                        key={docItem.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-900 truncate">{docItem.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {docItem.uploadDate}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No documents uploaded under this course yet.
                  </div>
                )}
              </div>

              {/* Delete Course */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    if (confirm(`Remove course ${selectedCourse.code}?`)) {
                      deleteCourse(selectedCourse.id);
                      setSelectedCourse(courses.filter((c) => c.id !== selectedCourse.id)[0] || null);
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Course from Semester</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              Select or add a course to view syllabus details.
            </div>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Add New Academic Course
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CSC 3105"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-600 outline-hidden uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-teal-600 outline-hidden"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Recess Term">Recess Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Distributed Computing & Cloud Architecture"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lecturer / Instructor Name
                </label>
                <input
                  type="text"
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Mukasa"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Syllabus Summary
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of modules covered..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Topics (Comma-separated)
                </label>
                <input
                  type="text"
                  value={topicsStr}
                  onChange={(e) => setTopicsStr(e.target.value)}
                  placeholder="e.g. Normalisation, Concurrency Control, Indexing"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-600 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
