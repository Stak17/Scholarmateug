import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FolderOpen,
  Search,
  FileText,
  Bookmark,
  Sparkles,
  Download,
  Trash2,
  Filter,
  Eye,
} from 'lucide-react';
import { DocumentItem } from '../types';

interface ResourceLibraryViewProps {
  onOpenDocInAnalyser: (docId: string) => void;
  onOpenDocInTutor: (docId: string) => void;
}

export const ResourceLibraryView: React.FC<ResourceLibraryViewProps> = ({
  onOpenDocInAnalyser,
  onOpenDocInTutor,
}) => {
  const { documents, courses, deleteDocument } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const filteredDocs = documents.filter((docItem) => {
    const matchesSearch =
      docItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docItem.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (docItem.courseName && docItem.courseName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCourse =
      selectedCourseFilter === 'all' || docItem.courseId === selectedCourseFilter;

    return matchesSearch && matchesCourse;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-amber-600" />
            Academic Resource Library & Search
          </h1>
          <p className="text-xs text-slate-500">
            Search, preview, and organise all your uploaded lecture notes, slides, and AI study sheets
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords across documents, notes, algorithms, laws..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-hidden bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-amber-600 outline-hidden"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((docItem) => (
          <div
            key={docItem.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {docItem.courseName?.split('-')[0] || 'General'}
                </span>
                <span className="text-slate-400 font-medium">{docItem.uploadDate}</span>
              </div>

              <h3 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">{docItem.title}</h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {docItem.summary || docItem.textContent.slice(0, 120)}
              </p>

              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                <span>{(docItem.fileSize / 1024).toFixed(0)} KB</span>
                <span>•</span>
                <span>{docItem.textContent.length} characters</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPreviewDoc(docItem)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenDocInAnalyser(docItem.id)}
                  title="Analyse with Gemini"
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this document?')) deleteDocument(docItem.id);
                  }}
                  title="Delete Document"
                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
          <FolderOpen className="w-8 h-8 mx-auto text-slate-300" />
          <p>No study materials match your search query.</p>
        </div>
      )}

      {/* Document Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate">{previewDoc.title}</h3>
                <span className="text-[10px] text-slate-400">{previewDoc.courseName}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {previewDoc.textContent}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  const blob = new Blob([previewDoc.textContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${previewDoc.title}.txt`;
                  a.click();
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Extracted Text</span>
              </button>

              <button
                onClick={() => {
                  const id = previewDoc.id;
                  setPreviewDoc(null);
                  onOpenDocInAnalyser(id);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Open in Analyser</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
