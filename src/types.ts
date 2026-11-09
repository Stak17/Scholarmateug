export type UserRole = 'student' | 'lecturer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  institution?: string;
  educationLevel?: string; // University, Tertiary, Secondary
  program?: string; // e.g. B.Sc. Computer Science
  academicYear?: string; // e.g. Year 2
  semester?: string; // e.g. Semester 1
  subjects?: string[];
  preferredLanguage?: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface Course {
  id: string;
  userId: string;
  code: string;
  name: string;
  description: string;
  lecturerName?: string;
  institution?: string;
  semester?: string;
  academicYear?: string;
  topics?: string[];
  documentCount?: number;
  quizCount?: number;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  courseId?: string;
  courseName?: string;
  title: string;
  fileType: string;
  fileSize: number;
  textContent: string;
  summary?: string;
  concepts?: string;
  uploadDate: string;
  folder?: string;
  bookmarked?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizItem {
  id: string;
  userId: string;
  courseId?: string;
  courseName?: string;
  title: string;
  subject: string;
  topic: string;
  questions: QuizQuestion[];
  createdAt: string;
  lastScore?: number;
  totalAttempts?: number;
}

export interface ExamQuestion {
  id: number;
  type: 'mcq' | 'true_false' | 'short_answer' | 'essay' | 'programming' | 'fill_blank';
  question: string;
  options?: string[];
  marks: number;
  suggestedTimeMinutes?: number;
  correctAnswer?: string;
  explanation: string;
  rubric?: string;
}

export interface ExamItem {
  id: string;
  userId: string;
  courseId?: string;
  courseName?: string;
  title: string;
  subject: string;
  topic: string;
  instructions: string;
  durationMinutes: number;
  difficulty: 'easy' | 'intermediate' | 'difficult' | 'mixed';
  totalMarks: number;
  questions: ExamQuestion[];
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  userId: string;
  answers: Record<number, string>;
  score: number;
  totalMarks: number;
  percentage: number;
  feedback: string;
  completedAt: string;
  subject?: string;
  correctCount?: number;
  incorrectCount?: number;
  weakTopics?: string[];
  suggestedActions?: string[];
  questionResults?: Array<{
    questionId: number;
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    marksEarned: number;
    maxMarks: number;
    isCorrect: boolean;
    feedback?: string;
    explanation?: string;
    type: string;
  }>;
}

export interface FlashcardItem {
  id: string;
  userId: string;
  courseId?: string;
  subject: string;
  topic: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'intermediate' | 'difficult';
  status: 'easy' | 'needs_revision' | 'difficult';
  createdAt: string;
}

export interface RevisionSessionSlot {
  timeSlot: string;
  course: string;
  topic: string;
  activityType: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface RevisionDaySchedule {
  day: string;
  focusCourse: string;
  sessions: RevisionSessionSlot[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  examDate: string;
  dailyTargetHours: number;
  summary: string;
  weeklySchedule: RevisionDaySchedule[];
  milestones: { week: string; goal: string }[];
  tips: string[];
  updatedAt: string;
}

export interface StudySessionLog {
  id: string;
  userId: string;
  courseName: string;
  topic: string;
  durationMinutes: number;
  date: string;
  completed: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'exam' | 'reminder' | 'resource' | 'system';
  read: boolean;
  createdAt: string;
}

export interface PerformanceAnalyticsReport {
  overallAssessment: string;
  averageMasteryPercentage: number;
  strongTopics: string[];
  weakTopics: string[];
  atRiskSubjects: string[];
  personalizedRecommendations: {
    subject: string;
    topic: string;
    recommendedAction: string;
    suggestedQuizQuestions?: number;
    priority: string;
  }[];
  studyHabitInsights: string;
}
