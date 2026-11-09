import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UGANDAN_INSTITUTIONS, EDUCATION_LEVELS } from '../data/sampleUgandaData';
import {
  User,
  School,
  BookOpen,
  Calendar,
  Languages,
  CheckCircle2,
  Save,
  LogOut,
  Shield,
  Briefcase,
  Smartphone,
  Trash2,
} from 'lucide-react';

export const ProfileSettingsView: React.FC = () => {
  const { currentUser, updateProfile, logout, role, setRole, lowBandwidthMode, setLowBandwidthMode } =
    useApp();

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    institution: currentUser?.institution || UGANDAN_INSTITUTIONS[0],
    educationLevel: currentUser?.educationLevel || EDUCATION_LEVELS[0],
    program: currentUser?.program || '',
    academicYear: currentUser?.academicYear || 'Year 2',
    semester: currentUser?.semester || 'Semester 1',
    preferredLanguage: currentUser?.preferredLanguage || 'English',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          Academic Profile & Settings
        </h1>
        <p className="text-xs text-slate-500">
          Manage your personal details, academic institution, and learning preferences
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-hidden cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institution in Uganda
              </label>
              <select
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 outline-hidden"
              >
                {UGANDAN_INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Education Level
              </label>
              <select
                value={formData.educationLevel}
                onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 outline-hidden"
              >
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Programme of Study
              </label>
              <input
                type="text"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                placeholder="e.g. B.Sc. Computer Science"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 outline-hidden"
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
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 outline-hidden"
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Recess Term">Recess Term</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Learning Context / Language Style
            </label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 outline-hidden"
            >
              <option value="English">Academic English</option>
              <option value="English with Luganda Context">English with Luganda Context Examples</option>
              <option value="English with Swahili Context">English with Swahili Context Examples</option>
              <option value="Step-by-Step Simplified">Step-by-Step Simplified Everyday Analogies</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Profile updated successfully!
              </span>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Network & Connectivity Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-600" />
          Network & Data Optimization (Uganda Bandwidth Saver)
        </h3>
        <p className="text-xs text-slate-500">
          Reduces image and heavy network requests to conserve mobile data when studying on Airtel or MTN networks.
        </p>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-800">Low Bandwidth Mode</span>
            <span className="block text-[11px] text-slate-500">
              Caches revision notes and limits large downloads
            </span>
          </div>
          <button
            onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              lowBandwidthMode
                ? 'bg-amber-500 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {lowBandwidthMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Account Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-900 block">Sign Out</span>
          <span className="text-[11px] text-slate-500">End your current session on this device</span>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
