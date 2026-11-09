import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Bot,
  FileText,
  FolderOpen,
  FileSpreadsheet,
  Brain,
  Layers,
  Calendar,
  LineChart,
  BookOpen,
  Users,
  Settings,
  Sparkles,
  HelpCircle,
  Shield,
  Briefcase,
  PlayCircle,
  FileUp,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeView, onNavigate }) => {
  const { role, currentUser } = useApp();

  const handleNav = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const navItemClass = (viewName: string) => {
    const isActive = activeView === viewName;
    return `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-50/95 lg:bg-transparent border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 lg:hidden border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">Navigation</span>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Student Learning Tools */}
          <div>
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Academic Hub
            </div>
            <div className="mt-2 space-y-1">
              <button onClick={() => handleNav('dashboard')} className={navItemClass('dashboard')}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>
              <button onClick={() => handleNav('ai-tutor')} className={navItemClass('ai-tutor')}>
                <Bot className="w-4 h-4 shrink-0 text-blue-500" />
                <span className="flex-1 text-left">AI Study Tutor</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                  Gemini
                </span>
              </button>
              <button onClick={() => handleNav('document-analyser')} className={navItemClass('document-analyser')}>
                <FileUp className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>Smart Document Analyser</span>
              </button>
              <button onClick={() => handleNav('library')} className={navItemClass('library')}>
                <FolderOpen className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Resource Library</span>
              </button>
              <button onClick={() => handleNav('courses')} className={navItemClass('courses')}>
                <BookOpen className="w-4 h-4 shrink-0 text-teal-600" />
                <span>My Courses & Notes</span>
              </button>
            </div>
          </div>

          {/* Assessments & Examination Module */}
          <div>
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Examinations & Practice
            </div>
            <div className="mt-2 space-y-1">
              <button onClick={() => handleNav('exam-generator')} className={navItemClass('exam-generator')}>
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-violet-500" />
                <span>AI Exam Generator</span>
              </button>
              <button onClick={() => handleNav('exam-room')} className={navItemClass('exam-room')}>
                <PlayCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Take Examination</span>
              </button>
              <button onClick={() => handleNav('quiz-centre')} className={navItemClass('quiz-centre')}>
                <Brain className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Smart Quiz Centre</span>
              </button>
              <button onClick={() => handleNav('flashcards')} className={navItemClass('flashcards')}>
                <Layers className="w-4 h-4 shrink-0 text-orange-500" />
                <span>Spaced Flashcards</span>
              </button>
            </div>
          </div>

          {/* Planning & Performance Analytics */}
          <div>
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Analytics & Strategy
            </div>
            <div className="mt-2 space-y-1">
              <button onClick={() => handleNav('revision-planner')} className={navItemClass('revision-planner')}>
                <Calendar className="w-4 h-4 shrink-0 text-sky-500" />
                <span>Revision Planner</span>
              </button>
              <button onClick={() => handleNav('performance-analytics')} className={navItemClass('performance-analytics')}>
                <LineChart className="w-4 h-4 shrink-0 text-green-600" />
                <span>Academic Analytics</span>
              </button>
            </div>
          </div>

          {/* Educator / Lecturer Workspace */}
          {(role === 'lecturer' || role === 'admin') && (
            <div>
              <div className="px-3 text-[11px] font-bold tracking-wider text-purple-600 uppercase flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Educator Portal
              </div>
              <div className="mt-2 space-y-1">
                <button onClick={() => handleNav('lecturer-dashboard')} className={navItemClass('lecturer-dashboard')}>
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>Lecturer Dashboard</span>
                </button>
              </div>
            </div>
          )}

          {/* Admin Workspace */}
          {role === 'admin' && (
            <div>
              <div className="px-3 text-[11px] font-bold tracking-wider text-emerald-600 uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Administration
              </div>
              <div className="mt-2 space-y-1">
                <button onClick={() => handleNav('admin-dashboard')} className={navItemClass('admin-dashboard')}>
                  <Users className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Admin & Institutions</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Profile settings */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          <button
            onClick={() => handleNav('profile')}
            className={navItemClass('profile')}
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Profile & Settings</span>
          </button>
          <div className="mt-2 px-3 text-[11px] text-slate-400">
            ScholarMate Uganda v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
