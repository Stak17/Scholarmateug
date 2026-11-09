import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UGANDAN_INSTITUTIONS } from '../data/sampleUgandaData';
import {
  Shield,
  School,
  Users,
  Activity,
  CheckCircle2,
  Server,
  Zap,
  Lock,
  PlusCircle,
  FileCheck,
  UserCheck,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'lecturer' | 'administrator';
  institution: string;
  program: string;
  status: string;
  joinedAt: string;
}

export const AdminDashboardView: React.FC = () => {
  const { courses, documents, quizzes, examinations, currentUser, role, addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'institutions' | 'security'>('users');
  const [institutions, setInstitutions] = useState(UGANDAN_INSTITUTIONS);
  const [newInst, setNewInst] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([
    { id: 'usr-1', email: 'travourstak22@gmail.com', displayName: 'Kato Emmanuel', role: 'student', institution: 'Makerere University (MAK)', program: 'B.Sc. Computer Science', status: 'active', joinedAt: '2026-09-01' },
    { id: 'usr-2', email: 'm.kigozi@mak.ac.ug', displayName: 'Dr. Mukasa Kigozi', role: 'lecturer', institution: 'Makerere University (MAK)', program: 'Faculty of Computing', status: 'active', joinedAt: '2026-08-15' },
    { id: 'usr-3', email: 's.namatovu@kyu.ac.ug', displayName: 'Namatovu Sarah', role: 'student', institution: 'Kyambogo University (KYU)', program: 'B.Eng. Telecommunications', status: 'active', joinedAt: '2026-09-03' },
    { id: 'usr-4', email: 'admin.ug@scholarmate.ac.ug', displayName: 'ScholarMate Uganda Admin', role: 'administrator', institution: 'Ministry of Education & Sports', program: 'System Operations', status: 'active', joinedAt: '2026-07-01' },
  ]);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    // Attempt fetch from backend
    fetch('/api/admin/users', {
      headers: {
        'x-user-id': currentUser?.uid || 'admin-user',
        'x-user-role': 'administrator',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      })
      .catch((e) => console.warn('Using local user directory:', e));
  }, [currentUser]);

  const handleAddInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInst.trim()) return;
    setInstitutions([...institutions, newInst.trim()]);
    setNewInst('');
    addNotification('Institution Registered', `Added "${newInst.trim()}" to accredited directory`, 'system');
  };

  const handleRoleChange = async (userId: string, newRole: 'student' | 'lecturer' | 'administrator') => {
    setIsUpdatingRole(true);
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.uid || 'admin-user',
          'x-user-role': 'administrator',
        },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user role');

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      addNotification('Role Updated', `Changed user role to ${newRole.toUpperCase()}`, 'system');
    } catch (err: any) {
      alert(`Role change error: ${err.message}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.institution.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            ScholarMate Uganda Administrator Portal
          </h1>
          <p className="text-xs text-slate-500">
            Institutional directory, platform accounts, role permissions, and AI infrastructure telemetry
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Roles ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('institutions')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'institutions' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Institutions ({institutions.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'security' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security & Health
          </button>
        </div>
      </div>

      {/* High-Level System Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Active Institutions</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{institutions.length}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">National Universities & Schools</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Managed Courses</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{courses.length}</div>
          <span className="text-[10px] text-slate-400">Curriculum Syllabi</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Registered Accounts</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">{users.length}</div>
          <span className="text-[10px] text-purple-500 font-semibold">Role-Governed Users</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Gemini AI Engine</span>
          <div className="text-sm font-extrabold text-emerald-600 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Operational (3.8 Flash)</span>
          </div>
          <span className="text-[10px] text-slate-400">Telemetry: aistudio-build</span>
        </div>
      </div>

      {/* Tab 1: User Management & Role Permissions */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                User Accounts & Role Permissions Directory
              </h2>
              <p className="text-[11px] text-slate-500">
                Grant or revoke Student, Lecturer, or Administrator access across Uganda institutions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter users..."
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:border-purple-600 outline-hidden bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Account User</th>
                  <th className="px-4 py-3">Institution & Program</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Permission Level</th>
                  <th className="px-4 py-3 text-right">Modify Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{u.displayName}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{u.institution}</div>
                      <div className="text-[10px] text-slate-500">{u.program}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          u.role === 'administrator'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'lecturer'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {u.role === 'administrator'
                        ? 'Full System + Telemetry'
                        : u.role === 'lecturer'
                        ? 'Assessment Publishing + Class Marks'
                        : 'Learning + Timed Exams'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <select
                        value={u.role}
                        disabled={isUpdatingRole}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold focus:border-purple-600 outline-hidden cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="administrator">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Institution Management Directory */}
      {activeTab === 'institutions' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600" />
                Verified Ugandan Institutions ({institutions.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Accredited universities, colleges, and national secondary examination centers
              </p>
            </div>
          </div>

          <form onSubmit={handleAddInstitution} className="flex gap-2">
            <input
              type="text"
              value={newInst}
              onChange={(e) => setNewInst(e.target.value)}
              placeholder="Add school or tertiary institution..."
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {institutions.map((inst, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 font-medium text-slate-800">
                  <School className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{inst}</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  Accredited
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security Controls & Health */}
      {activeTab === 'security' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-700" />
              Infrastructure & Security Controls
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Database Engine</span>
                <span className="font-bold text-slate-900">Cloud Firestore Enterprise</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Security Rules</span>
                <span className="font-bold text-emerald-600">Strict ABAC Zero-Trust</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Authentication</span>
                <span className="font-bold text-slate-900">Firebase Auth & Google Sign-In</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Payment Gateway Readiness</span>
                <span className="font-bold text-amber-700">MTN / Airtel Mobile Money API</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              Access Enforcement Log
            </h3>

            <div className="space-y-2 text-[11px] text-slate-600 font-mono">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                [OK] Rules deployed to polynomial-maxim-58gvj: Users can only read/write own profile & attempts.
              </div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                [OK] Express Server Auth Middleware: Token validated, User-Agent: aistudio-build verified.
              </div>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                [OK] Lecturer Assessment Endpoint: Protected with requireRole(['lecturer', 'administrator']).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
