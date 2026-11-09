import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UGANDAN_INSTITUTIONS, EDUCATION_LEVELS } from '../data/sampleUgandaData';
import {
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  Languages,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { currentUser, updateProfile } = useApp();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || 'Kato Emmanuel',
    email: currentUser?.email || 'scholar.ug@gmail.com',
    institution: currentUser?.institution || UGANDAN_INSTITUTIONS[0],
    educationLevel: currentUser?.educationLevel || EDUCATION_LEVELS[0],
    program: currentUser?.program || 'B.Sc. Computer Science',
    academicYear: currentUser?.academicYear || 'Year 2',
    semester: currentUser?.semester || 'Semester 1',
    subjects: currentUser?.subjects || ['Database Systems', 'Computer Networks', 'Software Engineering'],
    preferredLanguage: currentUser?.preferredLanguage || 'English',
  });

  const [customSubjectInput, setCustomSubjectInput] = useState('');

  const commonSubjects = [
    'Database Management Systems',
    'Computer Networks',
    'Data Structures and Algorithms',
    'Software Engineering',
    'Web Development',
    'Information Systems',
    'Engineering Mathematics',
    'Business Entrepreneurship',
    'Operating Systems',
    'Artificial Intelligence',
  ];

  const toggleSubject = (subject: string) => {
    if (formData.subjects.includes(subject)) {
      setFormData({
        ...formData,
        subjects: formData.subjects.filter((s) => s !== subject),
      });
    } else {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subject],
      });
    }
  };

  const handleAddCustomSubject = () => {
    if (customSubjectInput.trim() && !formData.subjects.includes(customSubjectInput.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, customSubjectInput.trim()],
      });
      setCustomSubjectInput('');
    }
  };

  const handleFinish = async () => {
    await updateProfile({
      displayName: formData.displayName,
      email: formData.email,
      institution: formData.institution,
      educationLevel: formData.educationLevel,
      program: formData.program,
      academicYear: formData.academicYear,
      semester: formData.semester,
      subjects: formData.subjects,
      preferredLanguage: formData.preferredLanguage,
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5 text-amber-300" />
              </div>
              <h2 className="text-base font-bold">ScholarMate Uganda Setup</h2>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
              Step {step} of 3
            </span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Basic Identity & Institution */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Academic Institution & Level</h3>
                <p className="text-xs text-slate-500">
                  Select your school or university to personalize exam syllabi and examples.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                  placeholder="e.g. Kato Emmanuel"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution in Uganda
                </label>
                <select
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                >
                  {UGANDAN_INSTITUTIONS.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                >
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Programme, Year & Semester */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Programme of Study</h3>
                <p className="text-xs text-slate-500">
                  Configure your current semester curriculum schedule.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Programme / Course Title
                </label>
                <input
                  type="text"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                  placeholder="e.g. B.Sc. Computer Science, B.Com, LLB"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Year 5">Year 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Recess Term">Recess Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Explanation Style / Language Assistance
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                >
                  <option value="English">Standard Academic English</option>
                  <option value="English with Luganda Context">English with Luganda Practical Context</option>
                  <option value="English with Swahili Context">English with Swahili Practical Context</option>
                  <option value="Step-by-Step Simplified">Step-by-Step Simplified Everyday Examples</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Enrolled Subjects Selection */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enrolled Subjects & Modules</h3>
                <p className="text-xs text-slate-500">
                  Select the subjects you are taking this semester for tailored AI practice:
                </p>
              </div>

              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {commonSubjects.map((sub) => {
                  const isSelected = formData.subjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Add Other Subject / Module
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="e.g. Distributed Computing"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubject();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Launch My Academic Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
