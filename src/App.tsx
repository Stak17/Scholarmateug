/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './views/LandingPage';
import { OnboardingWizard } from './views/OnboardingWizard';
import { StudentDashboard } from './views/StudentDashboard';
import { AITutorView } from './views/AITutorView';
import { DocumentAnalyzerView } from './views/DocumentAnalyzerView';
import { CourseManagementView } from './views/CourseManagementView';
import { ResourceLibraryView } from './views/ResourceLibraryView';
import { ExamGeneratorView } from './views/ExamGeneratorView';
import { ExamRoomView } from './views/ExamRoomView';
import { QuizCentreView } from './views/QuizCentreView';
import { FlashcardsView } from './views/FlashcardsView';
import { RevisionPlannerView } from './views/RevisionPlannerView';
import { PerformanceAnalyticsView } from './views/PerformanceAnalyticsView';
import { LecturerDashboardView } from './views/LecturerDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ProfileSettingsView } from './views/ProfileSettingsView';
import { AuthModal } from './components/AuthModal';
import { ExamItem, UserRole } from './types';

const MainLayout: React.FC = () => {
  const { currentUser, role, setRole, loginAsGuest } = useApp();

  const [activeView, setActiveView] = useState<string>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentActiveExam, setCurrentActiveExam] = useState<ExamItem | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleStartExam = (exam: ExamItem) => {
    setCurrentActiveExam(exam);
    setActiveView('exam-room');
  };

  const handleExitExam = () => {
    setCurrentActiveExam(null);
    setActiveView('dashboard');
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const handleSelectRoleFromLanding = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'lecturer') setActiveView('lecturer-dashboard');
    else if (selectedRole === 'admin') setActiveView('admin-dashboard');
    else setActiveView('dashboard');
  };

  // If in landing view and not explicitly requesting app view
  if (activeView === 'landing') {
    return (
      <div className="min-h-screen bg-white">
        <LandingPage
          onGetStarted={() => {
            if (!currentUser) {
              handleOpenAuth('register');
            } else {
              setActiveView('onboarding');
            }
          }}
          onLogin={() => {
            if (!currentUser) {
              handleOpenAuth('login');
            } else {
              setActiveView('dashboard');
            }
          }}
          onExploreFeatures={() => {
            if (!currentUser) loginAsGuest('student');
            setActiveView('dashboard');
          }}
          onSelectRole={handleSelectRoleFromLanding}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
          onSuccess={() => setActiveView('dashboard')}
        />
      </div>
    );
  }

  // If in Onboarding view
  if (activeView === 'onboarding') {
    return <OnboardingWizard onComplete={() => setActiveView('dashboard')} />;
  }

  // If taking an active timed examination
  if (activeView === 'exam-room' && currentActiveExam) {
    return (
      <ExamRoomView
        exam={currentActiveExam}
        onExit={handleExitExam}
        onNavigateToTutor={(topic) => {
          handleExitExam();
          handleNavigate('ai-tutor');
        }}
        onNavigateToQuiz={(topic) => {
          handleExitExam();
          handleNavigate('quiz-centre');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={handleNavigate}
        activeView={activeView}
        onOpenAuth={handleOpenAuth}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeView={activeView}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' && <StudentDashboard onNavigate={handleNavigate} />}
          {activeView === 'ai-tutor' && <AITutorView />}
          {activeView === 'document-analyser' && <DocumentAnalyzerView />}
          {activeView === 'courses' && (
            <CourseManagementView
              onNavigateToTutor={(subj) => handleNavigate('ai-tutor')}
              onNavigateToAnalyser={(cid) => handleNavigate('document-analyser')}
            />
          )}
          {activeView === 'library' && (
            <ResourceLibraryView
              onOpenDocInAnalyser={(did) => handleNavigate('document-analyser')}
              onOpenDocInTutor={(did) => handleNavigate('ai-tutor')}
            />
          )}
          {activeView === 'exam-generator' && (
            <ExamGeneratorView onStartExam={handleStartExam} onNavigate={handleNavigate} />
          )}
          {activeView === 'quiz-centre' && (
            <QuizCentreView onNavigateToTutor={(topic) => handleNavigate('ai-tutor')} />
          )}
          {activeView === 'flashcards' && <FlashcardsView />}
          {activeView === 'revision-planner' && <RevisionPlannerView />}
          {activeView === 'performance-analytics' && <PerformanceAnalyticsView />}
          {activeView === 'lecturer-dashboard' && <LecturerDashboardView />}
          {activeView === 'admin-dashboard' && <AdminDashboardView />}
          {activeView === 'profile' && <ProfileSettingsView />}
        </main>
      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onSuccess={() => setActiveView('dashboard')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
