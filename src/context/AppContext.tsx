import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  Course,
  DocumentItem,
  QuizItem,
  ExamItem,
  ExamAttempt,
  FlashcardItem,
  StudyPlan,
  StudySessionLog,
  NotificationItem,
} from '../types';

import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FbUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface AppContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  courses: Course[];
  documents: DocumentItem[];
  quizzes: QuizItem[];
  examinations: ExamItem[];
  examAttempts: ExamAttempt[];
  flashcards: FlashcardItem[];
  studyPlan: StudyPlan | null;
  studySessions: StudySessionLog[];
  notifications: NotificationItem[];
  isOnline: boolean;
  lowBandwidthMode: boolean;
  setLowBandwidthMode: (val: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, role?: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsGuest: (asRole?: UserRole) => void;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'userId'>) => Promise<Course>;
  deleteCourse: (id: string) => void;
  addDocument: (docItem: Omit<DocumentItem, 'id' | 'userId' | 'uploadDate'>) => Promise<DocumentItem>;
  deleteDocument: (id: string) => void;
  addQuiz: (quiz: Omit<QuizItem, 'id' | 'userId' | 'createdAt'>) => Promise<QuizItem>;
  recordQuizScore: (quizId: string, score: number) => void;
  addExam: (exam: Omit<ExamItem, 'id' | 'userId' | 'createdAt'>) => Promise<ExamItem>;
  recordExamAttempt: (attempt: Omit<ExamAttempt, 'id' | 'userId' | 'completedAt'>) => Promise<ExamAttempt>;
  addFlashcard: (fc: Omit<FlashcardItem, 'id' | 'userId' | 'createdAt'>) => Promise<FlashcardItem>;
  updateFlashcardStatus: (id: string, status: 'easy' | 'needs_revision' | 'difficult') => void;
  saveStudyPlan: (plan: Omit<StudyPlan, 'id' | 'userId' | 'updatedAt'>) => Promise<void>;
  logStudySession: (session: Omit<StudySessionLog, 'id' | 'userId'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotification: (id: string) => void;
  addNotification: (title: string, message: string, type: 'exam' | 'reminder' | 'resource' | 'system') => void;
  publishAssessment: (assessment: {
    title: string;
    courseId: string;
    courseName: string;
    type: 'exam' | 'quiz';
    durationMinutes: number;
    totalMarks: number;
    questions: any[];
  }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state (Clean slate for new users)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('scholarmate_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(currentUser?.role || 'student');
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('scholarmate_courses');
    return saved ? JSON.parse(saved) : [];
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('scholarmate_docs');
    return saved ? JSON.parse(saved) : [];
  });

  const [quizzes, setQuizzes] = useState<QuizItem[]>(() => {
    const saved = localStorage.getItem('scholarmate_quizzes');
    return saved ? JSON.parse(saved) : [];
  });

  const [examinations, setExaminations] = useState<ExamItem[]>(() => {
    const saved = localStorage.getItem('scholarmate_exams');
    return saved ? JSON.parse(saved) : [];
  });

  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => {
    const saved = localStorage.getItem('scholarmate_attempts');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(() => {
    const saved = localStorage.getItem('scholarmate_flashcards');
    return saved ? JSON.parse(saved) : [];
  });

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(() => {
    const saved = localStorage.getItem('scholarmate_studyplan');
    if (saved) return JSON.parse(saved);
    return {
      id: 'plan-default',
      userId: 'demo-student-ug',
      examDate: '2026-12-05',
      dailyTargetHours: 3.5,
      summary: 'High-yield 4-week preparation plan focusing on strengthening Database Normalisation and Computer Networks protocols.',
      weeklySchedule: [
        {
          day: 'Monday',
          focusCourse: 'CSC 2100 - Database Systems',
          sessions: [
            { timeSlot: '08:30 - 10:00', course: 'Database Systems', topic: 'Normalisation: 2NF, 3NF & BCNF', activityType: 'Active Recall & Notes', priority: 'High' },
            { timeSlot: '17:00 - 18:30', course: 'Database Systems', topic: 'SQL Joins & Group By Clauses', activityType: 'Practice Problems', priority: 'Medium' },
          ],
        },
        {
          day: 'Tuesday',
          focusCourse: 'BIT 2201 - Computer Networks',
          sessions: [
            { timeSlot: '09:00 - 10:30', course: 'Computer Networks', topic: 'OSI 7 Layers & TCP vs UDP', activityType: 'Flashcards Drill', priority: 'High' },
            { timeSlot: '15:00 - 16:30', course: 'Computer Networks', topic: 'IPv4 Subnetting & CIDR', activityType: 'Calculation Exercises', priority: 'High' },
          ],
        },
        {
          day: 'Wednesday',
          focusCourse: 'CSC 2202 - Data Structures',
          sessions: [
            { timeSlot: '10:00 - 11:30', course: 'Data Structures', topic: 'BST Traversals & Big-O', activityType: 'Algorithm Tracing', priority: 'Medium' },
          ],
        },
        {
          day: 'Thursday',
          focusCourse: 'SWE 3101 - Software Engineering',
          sessions: [
            { timeSlot: '09:00 - 10:30', course: 'Software Engineering', topic: 'Agile vs Waterfall & UML', activityType: 'Revision Notes', priority: 'Medium' },
          ],
        },
        {
          day: 'Friday',
          focusCourse: 'Review & Quizzes',
          sessions: [
            { timeSlot: '14:00 - 16:00', course: 'All Subjects', topic: 'Full Topic Practice Quiz Run', activityType: 'Mock Assessment', priority: 'High' },
          ],
        },
        {
          day: 'Saturday',
          focusCourse: 'Past Examination Practice',
          sessions: [
            { timeSlot: '10:00 - 12:00', course: 'Database Systems', topic: 'Timed Mock Examination Paper', activityType: 'Exam Simulation', priority: 'High' },
          ],
        },
      ],
      milestones: [
        { week: 'Week 1', goal: 'Consolidate all database normalization notes and achieve >85% in practice quiz.' },
        { week: 'Week 2', goal: 'Master OSI layer mappings and complete 20 subnetting calculation problems.' },
        { week: 'Week 3', goal: 'Complete BST and graph traversal code implementations without reference notes.' },
        { week: 'Week 4', goal: 'Attempt two full-length timed mock exams under simulated exam room conditions.' },
      ],
      tips: [
        'Utilize active recall rather than passive rereading of lecture slides.',
        'Apply the Pomodoro technique (45 min study, 10 min break) to combat mental fatigue in hot afternoons.',
        'Group revision sessions with peers to explain concepts aloud in your own words.',
      ],
      updatedAt: new Date().toISOString(),
    };
  });

  const [studySessions, setStudySessions] = useState<StudySessionLog[]>(() => {
    const saved = localStorage.getItem('scholarmate_sessions');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'sess-1', userId: 'demo-student-ug', courseName: 'Database Management Systems', topic: '1NF to BCNF Normalisation', durationMinutes: 75, date: '2026-11-06', completed: true },
      { id: 'sess-2', userId: 'demo-student-ug', courseName: 'Computer Networks', topic: 'OSI 7 Layers', durationMinutes: 60, date: '2026-11-07', completed: true },
      { id: 'sess-3', userId: 'demo-student-ug', courseName: 'Data Structures', topic: 'Binary Search Trees', durationMinutes: 90, date: '2026-11-08', completed: true },
    ];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      userId: 'demo-student-ug',
      title: 'Upcoming Mock Examination',
      message: 'Database Systems Mid-Term simulation scheduled for Saturday at 10:00 AM.',
      type: 'exam',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'demo-student-ug',
      title: 'Spaced Repetition Alert',
      message: 'You have 3 flashcards in "Normalisation" due for review today.',
      type: 'reminder',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'notif-3',
      userId: 'demo-student-ug',
      title: 'New Study Resource',
      message: 'Dr. Arthur Mukasa published Lecture 4 notes on BCNF decomposition.',
      type: 'resource',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lowBandwidthMode, setLowBandwidthMode] = useState<boolean>(() => {
    return localStorage.getItem('scholarmate_low_bandwidth') === 'true';
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to localStorage for offline cache
  useEffect(() => {
    if (currentUser) localStorage.setItem('scholarmate_user', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('scholarmate_courses', JSON.stringify(courses));
  }, [courses]);
  useEffect(() => {
    localStorage.setItem('scholarmate_docs', JSON.stringify(documents));
  }, [documents]);
  useEffect(() => {
    localStorage.setItem('scholarmate_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);
  useEffect(() => {
    localStorage.setItem('scholarmate_exams', JSON.stringify(examinations));
  }, [examinations]);
  useEffect(() => {
    localStorage.setItem('scholarmate_attempts', JSON.stringify(examAttempts));
  }, [examAttempts]);
  useEffect(() => {
    localStorage.setItem('scholarmate_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);
  useEffect(() => {
    if (studyPlan) localStorage.setItem('scholarmate_studyplan', JSON.stringify(studyPlan));
  }, [studyPlan]);
  useEffect(() => {
    localStorage.setItem('scholarmate_sessions', JSON.stringify(studySessions));
  }, [studySessions]);
  useEffect(() => {
    localStorage.setItem('scholarmate_low_bandwidth', String(lowBandwidthMode));
  }, [lowBandwidthMode]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FbUser | null) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setCurrentUser(data);
            setRole(data.role || 'student');
          } else {
            // New user profile
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Ugandan Scholar',
              role: 'student',
              institution: 'Makerere University (MAK)',
              educationLevel: 'Undergraduate Degree',
              program: 'B.Sc. Computer Science',
              academicYear: 'Year 2',
              semester: 'Semester 1',
              subjects: ['Database Systems', 'Computer Networks', 'Software Engineering'],
              preferredLanguage: 'English',
              createdAt: new Date().toISOString(),
              isGuest: false,
            };
            await setDoc(userDocRef, newProfile);
            setCurrentUser(newProfile);
            setRole('student');
          }
        } catch (err) {
          console.warn('Could not load user from Firestore, continuing with cached session:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setCurrentUser(data);
        setRole(data.role);
        localStorage.setItem('scholarmate_user', JSON.stringify(data));
      } else {
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Ugandan Scholar',
          role: 'student',
          institution: 'Makerere University (MAK)',
          educationLevel: 'Undergraduate Degree',
          program: 'B.Sc. Computer Science',
          academicYear: 'Year 2',
          semester: 'Semester 1',
          subjects: ['Database Systems', 'Computer Networks', 'Data Structures'],
          preferredLanguage: 'English',
          createdAt: new Date().toISOString(),
          isGuest: false,
        };
        await setDoc(userDocRef, newProfile).catch(() => {});
        setCurrentUser(newProfile);
        setRole('student');
        localStorage.setItem('scholarmate_user', JSON.stringify(newProfile));
      }
    } catch (err: any) {
      console.warn('Firebase Google sign-in fallback activated:', err.message);
      // Fallback local session
      const localProfile: UserProfile = {
        uid: 'user-' + Date.now(),
        email: 'scholar@university.ac.ug',
        displayName: 'Ugandan Scholar',
        role: 'student',
        institution: 'Makerere University (MAK)',
        educationLevel: 'Undergraduate Degree',
        program: 'B.Sc. Computer Science',
        academicYear: 'Year 2',
        semester: 'Semester 1',
        subjects: ['Database Systems', 'Computer Networks'],
        preferredLanguage: 'English',
        createdAt: new Date().toISOString(),
        isGuest: false,
      };
      setCurrentUser(localProfile);
      setRole('student');
      localStorage.setItem('scholarmate_user', JSON.stringify(localProfile));
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setCurrentUser(data);
        setRole(data.role || 'student');
        localStorage.setItem('scholarmate_user', JSON.stringify(data));
      } else {
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: fbUser.displayName || email.split('@')[0],
          role: 'student',
          institution: 'Makerere University (MAK)',
          educationLevel: 'Undergraduate Degree',
          program: 'B.Sc. Computer Science',
          academicYear: 'Year 2',
          semester: 'Semester 1',
          subjects: ['Database Systems', 'Computer Networks'],
          preferredLanguage: 'English',
          createdAt: new Date().toISOString(),
          isGuest: false,
        };
        await setDoc(userDocRef, newProfile).catch(() => {});
        setCurrentUser(newProfile);
        setRole('student');
        localStorage.setItem('scholarmate_user', JSON.stringify(newProfile));
      }
    } catch (err: any) {
      console.warn('Firebase email login fallback activated:', err.message);
      // Fallback local session for seamless Netlify experience
      const localProfile: UserProfile = {
        uid: 'user-' + Date.now(),
        email: email,
        displayName: email.split('@')[0],
        role: 'student',
        institution: 'Makerere University (MAK)',
        educationLevel: 'Undergraduate Degree',
        program: 'B.Sc. Computer Science',
        academicYear: 'Year 2',
        semester: 'Semester 1',
        subjects: ['Database Systems', 'Computer Networks'],
        preferredLanguage: 'English',
        createdAt: new Date().toISOString(),
        isGuest: false,
      };
      setCurrentUser(localProfile);
      setRole('student');
      localStorage.setItem('scholarmate_user', JSON.stringify(localProfile));
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string, assignedRole: UserRole = 'student') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = cred.user;
      try {
        await sendEmailVerification(fbUser);
      } catch (e) {
        // non-blocking
      }
      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        displayName: name,
        role: assignedRole,
        institution: assignedRole === 'lecturer' ? 'Kyambogo University (KYU)' : 'Makerere University (MAK)',
        educationLevel: 'Undergraduate Degree',
        program: 'B.Sc. Computer Science',
        academicYear: 'Year 2',
        semester: 'Semester 1',
        subjects: ['Database Management Systems', 'Computer Networks'],
        preferredLanguage: 'English',
        createdAt: new Date().toISOString(),
        isGuest: false,
      };
      await setDoc(doc(db, 'users', fbUser.uid), newProfile).catch(() => {});
      setCurrentUser(newProfile);
      setRole(assignedRole);
      localStorage.setItem('scholarmate_user', JSON.stringify(newProfile));
    } catch (err: any) {
      console.warn('Firebase registration fallback activated:', err.message);
      const localProfile: UserProfile = {
        uid: 'user-' + Date.now(),
        email: email,
        displayName: name,
        role: assignedRole,
        institution: assignedRole === 'lecturer' ? 'Kyambogo University (KYU)' : 'Makerere University (MAK)',
        educationLevel: 'Undergraduate Degree',
        program: 'B.Sc. Computer Science',
        academicYear: 'Year 2',
        semester: 'Semester 1',
        subjects: ['Database Management Systems', 'Computer Networks'],
        preferredLanguage: 'English',
        createdAt: new Date().toISOString(),
        isGuest: false,
      };
      setCurrentUser(localProfile);
      setRole(assignedRole);
      localStorage.setItem('scholarmate_user', JSON.stringify(localProfile));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw err;
    }
  };

  const loginAsGuest = (asRole: UserRole = 'student') => {
    const guestUser: UserProfile = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: asRole === 'lecturer' ? 'dr.mukasa@kyambogo.ac.ug' : 'scholar.guest@gmail.com',
      displayName: asRole === 'lecturer' ? 'Dr. Arthur Mukasa (Lecturer)' : asRole === 'admin' ? 'Academic Registrar (Admin)' : 'Mukasa Brian (Student)',
      role: asRole,
      institution: asRole === 'lecturer' ? 'Kyambogo University (KYU)' : 'Makerere University (MAK)',
      educationLevel: 'Undergraduate Degree',
      program: 'B.Sc. Computer Science',
      academicYear: 'Year 2',
      semester: 'Semester 1',
      subjects: ['Database Management Systems', 'Computer Networks', 'Software Engineering'],
      preferredLanguage: 'English',
      createdAt: new Date().toISOString(),
      isGuest: true,
    };
    setCurrentUser(guestUser);
    setRole(asRole);
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('scholarmate_user');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    if (updates.role) setRole(updates.role);

    if (!currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    }
  };

  const addCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'userId'>): Promise<Course> => {
    const newCourse: Course = {
      ...courseData,
      id: 'course-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      createdAt: new Date().toISOString(),
      documentCount: 0,
      quizCount: 0,
    };
    setCourses((prev) => [newCourse, ...prev]);

    if (currentUser && !currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'courses', newCourse.id), newCourse);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `courses/${newCourse.id}`);
      }
    }
    return newCourse;
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const addDocument = async (docItem: Omit<DocumentItem, 'id' | 'userId' | 'uploadDate'>): Promise<DocumentItem> => {
    const newDoc: DocumentItem = {
      ...docItem,
      id: 'doc-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // Update course documentCount
    if (docItem.courseId) {
      setCourses((prev) =>
        prev.map((c) => (c.id === docItem.courseId ? { ...c, documentCount: (c.documentCount || 0) + 1 } : c))
      );
    }

    if (currentUser && !currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'documents', newDoc.id), newDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `documents/${newDoc.id}`);
      }
    }
    return newDoc;
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const addQuiz = async (quizData: Omit<QuizItem, 'id' | 'userId' | 'createdAt'>): Promise<QuizItem> => {
    const newQuiz: QuizItem = {
      ...quizData,
      id: 'quiz-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      createdAt: new Date().toISOString().split('T')[0],
      totalAttempts: 0,
    };
    setQuizzes((prev) => [newQuiz, ...prev]);

    if (quizData.courseId) {
      setCourses((prev) =>
        prev.map((c) => (c.id === quizData.courseId ? { ...c, quizCount: (c.quizCount || 0) + 1 } : c))
      );
    }

    if (currentUser && !currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'quizzes', newQuiz.id), newQuiz);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `quizzes/${newQuiz.id}`);
      }
    }
    return newQuiz;
  };

  const recordQuizScore = (quizId: string, score: number) => {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quizId
          ? {
              ...q,
              lastScore: score,
              totalAttempts: (q.totalAttempts || 0) + 1,
            }
          : q
      )
    );
  };

  const addExam = async (examData: Omit<ExamItem, 'id' | 'userId' | 'createdAt'>): Promise<ExamItem> => {
    const newExam: ExamItem = {
      ...examData,
      id: 'exam-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExaminations((prev) => [newExam, ...prev]);

    if (currentUser && !currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'examinations', newExam.id), newExam);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `examinations/${newExam.id}`);
      }
    }
    return newExam;
  };

  const recordExamAttempt = async (attemptData: Omit<ExamAttempt, 'id' | 'userId' | 'completedAt'>): Promise<ExamAttempt> => {
    const attempt: ExamAttempt = {
      ...attemptData,
      id: 'attempt-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      completedAt: new Date().toISOString(),
    };
    setExamAttempts((prev) => [attempt, ...prev]);

    if (currentUser && !currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'exam_attempts', attempt.id), attempt);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `exam_attempts/${attempt.id}`);
      }
    }
    return attempt;
  };

  const addFlashcard = async (fcData: Omit<FlashcardItem, 'id' | 'userId' | 'createdAt'>): Promise<FlashcardItem> => {
    const newFc: FlashcardItem = {
      ...fcData,
      id: 'fc-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setFlashcards((prev) => [newFc, ...prev]);

    if (currentUser && !currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'flashcards', newFc.id), newFc);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `flashcards/${newFc.id}`);
      }
    }
    return newFc;
  };

  const updateFlashcardStatus = (id: string, status: 'easy' | 'needs_revision' | 'difficult') => {
    setFlashcards((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  };

  const saveStudyPlan = async (planData: Omit<StudyPlan, 'id' | 'userId' | 'updatedAt'>) => {
    const newPlan: StudyPlan = {
      ...planData,
      id: 'plan-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      updatedAt: new Date().toISOString(),
    };
    setStudyPlan(newPlan);

    if (currentUser && !currentUser.isGuest) {
      try {
        await setDoc(doc(db, 'study_plans', newPlan.id), newPlan);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `study_plans/${newPlan.id}`);
      }
    }
  };

  const logStudySession = (sessionData: Omit<StudySessionLog, 'id' | 'userId'>) => {
    const newSess: StudySessionLog = {
      ...sessionData,
      id: 'sess-' + Date.now(),
      userId: currentUser?.uid || 'guest',
    };
    setStudySessions((prev) => [newSess, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (title: string, message: string, type: 'exam' | 'reminder' | 'resource' | 'system') => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      userId: currentUser?.uid || 'guest',
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const publishAssessment = async (assessment: {
    title: string;
    courseId: string;
    courseName: string;
    type: 'exam' | 'quiz';
    durationMinutes: number;
    totalMarks: number;
    questions: any[];
  }) => {
    try {
      await fetch('/api/assessments/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.uid || 'lecturer-id',
          'x-user-role': role,
          'x-user-email': currentUser?.email || '',
        },
        body: JSON.stringify(assessment),
      });
    } catch (e: any) {
      console.warn('Backend publish notification:', e);
    }

    if (assessment.type === 'exam') {
      await addExam({
        courseId: assessment.courseId,
        courseName: assessment.courseName,
        subject: assessment.courseName,
        title: assessment.title,
        topic: 'Class Assessment',
        instructions: 'Answer all questions. Provide clear working for mathematical and programming solutions.',
        durationMinutes: assessment.durationMinutes,
        difficulty: 'intermediate',
        totalMarks: assessment.totalMarks,
        questions: assessment.questions,
      });
    } else {
      await addQuiz({
        courseId: assessment.courseId,
        courseName: assessment.courseName,
        title: assessment.title,
        subject: assessment.courseName,
        topic: 'Class Assessment',
        questions: assessment.questions,
      });
    }

    addNotification(
      'Assessment Published',
      `"${assessment.title}" has been published to student coursework.`,
      'exam'
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role,
        setRole,
        courses,
        documents,
        quizzes,
        examinations,
        examAttempts,
        flashcards,
        studyPlan,
        studySessions,
        notifications,
        isOnline,
        lowBandwidthMode,
        setLowBandwidthMode,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        loginAsGuest,
        logout,
        updateProfile,
        addCourse,
        deleteCourse,
        addDocument,
        deleteDocument,
        addQuiz,
        recordQuizScore,
        addExam,
        recordExamAttempt,
        addFlashcard,
        updateFlashcardStatus,
        saveStudyPlan,
        logStudySession,
        markNotificationRead,
        clearNotification,
        addNotification,
        publishAssessment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
