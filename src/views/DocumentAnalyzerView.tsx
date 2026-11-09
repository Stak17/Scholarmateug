import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  UploadCloud,
  Sparkles,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Layers,
  BookOpen,
  Brain,
  Copy,
  Check,
  AlertCircle,
  FileCode,
  Image,
  GraduationCap,
  HelpCircle,
  Zap,
} from 'lucide-react';

export const DocumentAnalyzerView: React.FC = () => {
  const { documents, courses, addDocument, addFlashcard, addNotification, addQuiz, addExam } = useApp();

  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [activeTab, setActiveTab] = useState<
    'summarize' | 'concepts' | 'revision_notes' | 'definitions_formulas' | 'flashcards' | 'chunk_qa'
  >('summarize');

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState<'quiz' | 'exam' | null>(null);
  const [assessmentNotice, setAssessmentNotice] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [qaQuery, setQaQuery] = useState('');
  const [retrievedPassages, setRetrievedPassages] = useState<{ id: number; score: number; preview: string }[]>([]);

  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleCreateAssessmentFromDoc = async (type: 'quiz' | 'exam') => {
    if (!activeDoc) return;
    setIsGeneratingAssessment(type);
    setAssessmentNotice(null);

    try {
      const res = await fetch('/api/ai/document-to-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: activeDoc.textContent,
          assessmentType: type,
          subject: activeDoc.courseName || 'General Subject',
          topic: activeDoc.title,
          numQuestions: type === 'quiz' ? 5 : 8,
          durationMinutes: type === 'quiz' ? 15 : 45,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate assessment');

      if (type === 'quiz' && data.quiz) {
        await addQuiz({
          courseId: activeDoc.courseId,
          courseName: activeDoc.courseName || 'Course Notes',
          title: data.quiz.title || `Quick Quiz: ${activeDoc.title}`,
          subject: activeDoc.courseName || 'Course Material',
          topic: activeDoc.title,
          questions: data.quiz.questions,
        });
        setAssessmentNotice(`5-Question practice quiz generated and added to Quiz Centre!`);
        addNotification('Quiz Ready', `Generated quiz from "${activeDoc.title}"`, 'exam');
      } else if (type === 'exam' && data.exam) {
        await addExam({
          courseId: activeDoc.courseId,
          courseName: activeDoc.courseName,
          subject: activeDoc.courseName || 'General Course',
          title: data.exam.title || `Course Exam: ${activeDoc.title}`,
          topic: activeDoc.title,
          instructions: data.exam.instructions || 'Answer all questions in the allotted time.',
          durationMinutes: data.exam.durationMinutes || 45,
          difficulty: 'intermediate',
          totalMarks: data.exam.totalMarks || 50,
          questions: data.exam.questions || [],
        });
        setAssessmentNotice(`Formal exam paper generated and added to your Exam Room!`);
        addNotification('Exam Generated', `Generated exam paper from "${activeDoc.title}"`, 'exam');
      }
    } catch (err: any) {
      alert(`Assessment creation failed: ${err.message}`);
    } finally {
      setIsGeneratingAssessment(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document');

      const matchedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

      // Add to context & database
      const newDoc = await addDocument({
        courseId: matchedCourse?.id,
        courseName: `${matchedCourse?.code} - ${matchedCourse?.name}`,
        title: file.name,
        fileType: file.type || 'text/plain',
        fileSize: file.size,
        textContent: data.fullText || 'Extracted content...',
        summary: 'Extracted from file upload.',
      });

      setSelectedDocId(newDoc.id);
      addNotification('Material Uploaded', `Successfully processed "${file.name}"`, 'resource');
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRunAnalysis = async (type = activeTab) => {
    if (!activeDoc) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/document-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: activeDoc.textContent,
          analysisType: type,
          title: activeDoc.title,
          subject: activeDoc.courseName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAnalysisResult(data.result);

      // If flashcards, optionally parse and add
      if (type === 'flashcards') {
        try {
          const parsed = JSON.parse(data.result);
          if (Array.isArray(parsed)) {
            for (const item of parsed.slice(0, 5)) {
              await addFlashcard({
                courseId: activeDoc.courseId,
                subject: activeDoc.courseName || 'General',
                topic: item.topic || 'Document Concepts',
                front: item.front,
                back: item.back,
                difficulty: item.difficulty || 'intermediate',
                status: 'needs_revision',
              });
            }
            addNotification(
              'Flashcards Saved',
              `Saved 5 spaced-repetition cards from ${activeDoc.title} to your deck!`,
              'resource'
            );
          }
        } catch (e) {
          // not raw JSON, plain text
        }
      }
    } catch (err: any) {
      setAnalysisResult(`Error during analysis: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunChunkQA = async () => {
    if (!activeDoc || !qaQuery.trim()) return;
    setIsAnalyzing(true);
    setRetrievedPassages([]);
    try {
      const res = await fetch('/api/ai/document-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: activeDoc.textContent,
          query: qaQuery.trim(),
          title: activeDoc.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Q&A failed');
      setAnalysisResult(data.answer);
      if (Array.isArray(data.retrievedChunks)) {
        setRetrievedPassages(data.retrievedChunks);
      }
    } catch (err: any) {
      setAnalysisResult(`Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Smart Document Analyser
          </h1>
          <p className="text-xs text-slate-500">
            Extract notes, summaries, concepts, and flashcards from PDF, DOCX, PPTX, and lecture photos
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                Target: {c.code}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Extracting...' : 'Upload Notes / PDF'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Grid: Document List on Left, Analysis Workspace on Right */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Uploaded Documents List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">My Study Materials</span>
              <span className="text-[11px] text-slate-400 font-semibold">{documents.length} files</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {documents.map((docItem) => {
                const isSelected = docItem.id === activeDoc?.id;
                return (
                  <div
                    key={docItem.id}
                    onClick={() => {
                      setSelectedDocId(docItem.id);
                      setAnalysisResult('');
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{docItem.title}</h4>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {docItem.courseName || 'General Subject'}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-medium">
                          <span>{(docItem.fileSize / 1024).toFixed(0)} KB</span>
                          <span>•</span>
                          <span>Uploaded {docItem.uploadDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Document Workspace & Gemini Analysis */}
        <div className="lg:col-span-8 space-y-4">
          {activeDoc ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Active Document Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {activeDoc.courseName || 'CSC 2100'}
                    </span>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      {activeDoc.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 shrink-0 self-start sm:self-auto">
                      ✓ Text Extracted & Grounded
                    </span>
                    <button
                      onClick={() => handleCreateAssessmentFromDoc('quiz')}
                      disabled={isGeneratingAssessment !== null}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isGeneratingAssessment === 'quiz' ? 'Generating Quiz...' : 'Turn into Quiz'}</span>
                    </button>
                    <button
                      onClick={() => handleCreateAssessmentFromDoc('exam')}
                      disabled={isGeneratingAssessment !== null}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isGeneratingAssessment === 'exam' ? 'Generating Exam...' : 'Turn into Exam'}</span>
                    </button>
                  </div>
                </div>

                {assessmentNotice && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{assessmentNotice}</span>
                    </div>
                    <button
                      onClick={() => setAssessmentNotice(null)}
                      className="text-[11px] font-bold text-emerald-700 underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Analysis Action Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-4 text-xs">
                  <button
                    onClick={() => {
                      setActiveTab('summarize');
                      handleRunAnalysis('summarize');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                      activeTab === 'summarize'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    1. Executive Summary
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('concepts');
                      handleRunAnalysis('concepts');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                      activeTab === 'concepts'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    2. Important Concepts
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('revision_notes');
                      handleRunAnalysis('revision_notes');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                      activeTab === 'revision_notes'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    3. High-Yield Revision Notes
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('definitions_formulas');
                      handleRunAnalysis('definitions_formulas');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                      activeTab === 'definitions_formulas'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    4. Formulas & Definitions
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('flashcards');
                      handleRunAnalysis('flashcards');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                      activeTab === 'flashcards'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    5. Generate Flashcards
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('chunk_qa');
                      setAnalysisResult('');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                      activeTab === 'chunk_qa'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    6. Grounded Q&A (Chunked Retrieval)
                  </button>
                </div>
              </div>

              {/* Analysis Content Output */}
              <div className="p-5">
                {isAnalyzing ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="inline-block w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin"></div>
                    <p className="text-xs font-semibold text-slate-600">
                      Gemini is performing deep academic analysis on "{activeDoc.title}"...
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Extracting concepts, formulas, and revision hierarchies
                    </span>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Analysis Output: {activeTab.replace('_', ' ')}
                        </span>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Output'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                      {analysisResult}
                    </div>
                  </div>
                ) : activeTab === 'chunk_qa' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-900">
                          Retrieval-Augmented Q&A for "{activeDoc.title}"
                        </h4>
                        <p className="text-[11px] text-indigo-700">
                          Gemini will partition this material into indexed sections, locate the most relevant passages, and provide a cited answer.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={qaQuery}
                          onChange={(e) => setQaQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRunChunkQA();
                          }}
                          placeholder="e.g. What is the difference between 3NF and BCNF according to this document?"
                          className="flex-1 text-xs p-2.5 rounded-xl border border-indigo-200 bg-white focus:border-indigo-600 outline-hidden"
                        />
                        <button
                          onClick={handleRunChunkQA}
                          disabled={isAnalyzing || !qaQuery.trim()}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <span>Ask Document</span>
                        </button>
                      </div>
                    </div>

                    {retrievedPassages.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Retrieved Document Sections:
                        </span>
                        <div className="grid sm:grid-cols-3 gap-2">
                          {retrievedPassages.map((p) => (
                            <div key={p.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px]">
                              <span className="font-bold text-indigo-700 block">Chunk #{p.id}</span>
                              <p className="text-slate-600 line-clamp-3 mt-1 font-mono">{p.preview}...</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-blue-900">Ready for Gemini Intelligence</h4>
                        <p className="text-[11px] text-blue-700">
                          Click any analysis tab above or press below to generate formatted revision notes.
                        </p>
                      </div>
                      <button
                        onClick={() => handleRunAnalysis(activeTab)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Run Analyser</span>
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-2">Source Document Preview:</h4>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 max-h-64 overflow-y-auto font-mono whitespace-pre-wrap">
                        {activeDoc.textContent.slice(0, 1500)}...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No documents selected. Upload lecture notes to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
