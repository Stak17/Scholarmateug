import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Bell,
  Wifi,
  WifiOff,
  Zap,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  BookOpen,
  Shield,
  Briefcase,
  Menu,
  X,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
  activeView: string;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate, activeView, onOpenAuth }) => {
  const {
    currentUser,
    role,
    setRole,
    loginWithGoogle,
    loginAsGuest,
    logout,
    notifications,
    markNotificationRead,
    isOnline,
    lowBandwidthMode,
    setLowBandwidthMode,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setShowRoleMenu(false);
    if (newRole === 'lecturer') onNavigate('lecturer-dashboard');
    else if (newRole === 'admin') onNavigate('admin-dashboard');
    else onNavigate('dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-600/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                  ScholarMate
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Uganda
                  </span>
                </span>
                <span className="hidden sm:block text-[10px] tracking-wider text-slate-500 font-medium uppercase">
                  Learn Smarter · Achieve More
                </span>
              </div>
            </button>
          </div>

          {/* Center: System Status & Low-Bandwidth indicator */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
              title="Toggle Low Bandwidth Mode (optimizes data consumption for mobile networks)"
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                lowBandwidthMode
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${lowBandwidthMode ? 'text-amber-600 fill-amber-500' : 'text-slate-500'}`} />
              <span>{lowBandwidthMode ? 'Data Saver Active' : 'Data Saver'}</span>
            </button>

            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>
          </div>

          {/* Right: Role Switcher, Notifications, Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              >
                {role === 'student' && <BookOpen className="w-3.5 h-3.5 text-blue-600" />}
                {role === 'lecturer' && <Briefcase className="w-3.5 h-3.5 text-purple-600" />}
                {role === 'admin' && <Shield className="w-3.5 h-3.5 text-emerald-600" />}
                <span className="capitalize hidden sm:inline">{role} View</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Workspace
                  </div>
                  <button
                    onClick={() => handleRoleChange('student')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-blue-50 transition ${
                      role === 'student' ? 'font-bold text-blue-700 bg-blue-50/60' : 'text-slate-700'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Student Portal</div>
                      <div className="text-[10px] text-slate-500">AI Tutor, Notes & Exams</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleChange('lecturer')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-purple-50 transition ${
                      role === 'lecturer' ? 'font-bold text-purple-700 bg-purple-50/60' : 'text-slate-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <div>
                      <div>Lecturer / Educator</div>
                      <div className="text-[10px] text-slate-500">Course & Class Analytics</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleChange('admin')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-emerald-50 transition ${
                      role === 'admin' ? 'font-bold text-emerald-700 bg-emerald-50/60' : 'text-slate-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Institution Admin</div>
                      <div className="text-[10px] text-slate-500">Curriculum & User Controls</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Academic Alerts</span>
                    <span className="text-[11px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No new alerts</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                            !n.read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1.5 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Sign-in */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.displayName.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {currentUser.institution?.split('(')[0] || 'Uganda Scholar'}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {currentUser.program || 'Student'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Academic Profile & Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('onboarding');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Re-run Onboarding Wizard
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        onNavigate('landing');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loginAsGuest('student')}
                  className="hidden sm:inline-flex text-xs font-medium px-3 py-1.5 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Quick Demo
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition shadow-xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
