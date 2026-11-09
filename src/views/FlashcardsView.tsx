import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  PlusCircle,
  BookOpen,
} from 'lucide-react';

export const FlashcardsView: React.FC = () => {
  const { flashcards, courses, updateFlashcardStatus, addFlashcard, addNotification } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_revision' | 'difficult' | 'easy'>('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Flashcard Generator Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState(courses[0]?.name || 'Database Management Systems');
  const [topic, setTopic] = useState('Relational Normalization');
  const [count, setCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredCards = flashcards.filter((card) => {
    if (activeFilter === 'all') return true;
    return card.status === activeFilter;
  });

  const currentCard = filteredCards[currentIdx] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev + 1) % (filteredCards.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev - 1 + filteredCards.length) % (filteredCards.length || 1));
  };

  const handleStatusUpdate = (status: 'easy' | 'needs_revision' | 'difficult') => {
    if (!currentCard) return;
    updateFlashcardStatus(currentCard.id, status);
    handleNext();
  };

  const handleGenerateCards = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/flashcards-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate flashcards');

      for (const card of data.cards) {
        await addFlashcard({
          subject,
          topic: card.topic || topic,
          front: card.front,
          back: card.back,
          difficulty: card.difficulty || 'intermediate',
          status: 'needs_revision',
        });
      }

      setShowCreateModal(false);
      addNotification(
        'Flashcards Created',
        `Generated ${data.cards.length} flashcards for ${topic}`,
        'resource'
      );
    } catch (err: any) {
      alert(`Flashcard error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-600" />
            Spaced-Repetition Flashcards
          </h1>
          <p className="text-xs text-slate-500">
            Active recall intervals targeting difficult concepts for deep retention
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Generate Cards with AI</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => {
            setActiveFilter('all');
            setCurrentIdx(0);
            setIsFlipped(false);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Cards ({flashcards.length})
        </button>
        <button
          onClick={() => {
            setActiveFilter('needs_revision');
            setCurrentIdx(0);
            setIsFlipped(false);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'needs_revision'
              ? 'bg-amber-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Needs Revision ({flashcards.filter((f) => f.status === 'needs_revision').length})
        </button>
        <button
          onClick={() => {
            setActiveFilter('difficult');
            setCurrentIdx(0);
            setIsFlipped(false);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'difficult'
              ? 'bg-rose-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Difficult ({flashcards.filter((f) => f.status === 'difficult').length})
        </button>
        <button
          onClick={() => {
            setActiveFilter('easy');
            setCurrentIdx(0);
            setIsFlipped(false);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'easy'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Mastered / Easy ({flashcards.filter((f) => f.status === 'easy').length})
        </button>
      </div>

      {/* Main Flashcard Interactive Area */}
      {currentCard ? (
        <div className="space-y-4">
          <div className="text-center text-xs font-semibold text-slate-500">
            Card {currentIdx + 1} of {filteredCards.length}
          </div>

          {/* Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[260px] sm:min-h-[300px] bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-md flex flex-col justify-between hover:border-orange-400 transition cursor-pointer relative overflow-hidden"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {currentCard.subject}
              </span>
              <span className="text-slate-400 font-semibold">{currentCard.topic}</span>
            </div>

            {/* Card Content */}
            <div className="py-6 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isFlipped ? 'Answer & Explanation (Back)' : 'Concept / Question (Front)'}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 max-w-xl mx-auto whitespace-pre-line leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </div>
            </div>

            {/* Card Footer prompt */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-orange-600 font-bold">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card to {isFlipped ? 'see question' : 'reveal answer'}</span>
            </div>
          </div>

          {/* Spaced-Repetition Feedback Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs font-semibold text-slate-500 mr-2">Rate Your Recall:</span>
            <button
              onClick={() => handleStatusUpdate('difficult')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 font-bold text-xs hover:bg-rose-100 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Difficult (Revisit Soon)</span>
            </button>
            <button
              onClick={() => handleStatusUpdate('needs_revision')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-700 font-bold text-xs hover:bg-amber-100 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Needs Revision (2 Days)</span>
            </button>
            <button
              onClick={() => handleStatusUpdate('easy')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Easy / Mastered</span>
            </button>
          </div>

          {/* Prev/Next arrows */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handlePrev}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ← Previous Card
            </button>
            <button
              onClick={handleNext}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Next Card →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">No flashcards in this filter category.</p>
          <button
            onClick={() => setActiveFilter('all')}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            Show All Flashcards
          </button>
        </div>
      )}

      {/* Modal: Generate AI Flashcards */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Generate Flashcards with Gemini
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-orange-600 outline-hidden"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Relational Normalization, BSTs, OSI Model"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-orange-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Card Count</label>
                <input
                  type="number"
                  min={4}
                  max={15}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 6)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-orange-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCards}
                disabled={isGenerating}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Build Flashcards'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
