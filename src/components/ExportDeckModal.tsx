import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  FileText,
  Download,
  Copy,
  Check,
  Scissors,
  Table as TableIcon,
  Sparkles,
  Layers,
  HelpCircle,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { StudyDeck } from '../types/study';
import {
  exportDeckToCSV,
  exportDeckToPDF,
  printFlashcardsDocument,
  CSVExportOptions,
  PDFExportOptions,
} from '../utils/exportUtils';
import { useStreak } from '../context/StreakContext';

interface ExportDeckModalProps {
  deck: StudyDeck;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDeckModal: React.FC<ExportDeckModalProps> = ({ deck, isOpen, onClose }) => {
  const { recordInteraction } = useStreak();
  const [activeTab, setActiveTab] = useState<'csv' | 'pdf'>('pdf');

  // CSV options state
  const [csvFormat, setCsvFormat] = useState<'standard' | 'anki' | 'quizlet'>('standard');
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [copiedCSV, setCopiedCSV] = useState(false);

  // PDF options state
  const [pdfLayout, setPdfLayout] = useState<'sheet' | 'cutout'>('sheet');
  const [includeHints, setIncludeHints] = useState<boolean>(true);
  const [includeCategory, setIncludeCategory] = useState<boolean>(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  if (!isOpen) return null;

  // Handle CSV Download
  const handleDownloadCSV = () => {
    exportDeckToCSV(deck, { format: csvFormat, includeHeaders });
    recordInteraction(
      'note_view',
      `Exported ${deck.flashcards.length} cards as CSV from "${deck.title}"`
    );
  };

  // Handle Copy CSV to Clipboard (handy for Quizlet / Anki web import)
  const handleCopyCSV = () => {
    let rawContent = '';
    if (csvFormat === 'anki' || csvFormat === 'quizlet') {
      const rows = deck.flashcards.map((c) => {
        const hintPart = c.hint ? ` (Hint: ${c.hint})` : '';
        return `"${c.front.replace(/"/g, '""')}","${(c.back + hintPart).replace(/"/g, '""')}"`;
      });
      rawContent = (includeHeaders ? '"Front","Back"\n' : '') + rows.join('\n');
    } else {
      const rows = deck.flashcards.map((c) => {
        return `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}","${(c.category || deck.topic).replace(/"/g, '""')}","${(c.hint || '').replace(/"/g, '""')}","${c.masteryStatus || 'new'}"`;
      });
      rawContent =
        (includeHeaders ? '"Front","Back","Category","Hint","Status"\n' : '') + rows.join('\n');
    }

    navigator.clipboard.writeText(rawContent).then(() => {
      setCopiedCSV(true);
      recordInteraction('note_view', `Copied flashcards CSV data for "${deck.title}"`);
      setTimeout(() => setCopiedCSV(false), 2500);
    });
  };

  // Handle PDF Download
  const handleDownloadPDF = () => {
    setIsExportingPDF(true);
    try {
      exportDeckToPDF(deck, {
        layout: pdfLayout,
        includeHints,
        includeCategory,
      });
      recordInteraction(
        'note_view',
        `Downloaded printable PDF (${pdfLayout}) for "${deck.title}"`
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handle Print Dialog
  const handlePrint = () => {
    printFlashcardsDocument(deck, {
      layout: pdfLayout,
      includeHints,
      includeCategory,
    });
    recordInteraction(
      'note_view',
      `Opened print preview for "${deck.title}" (${deck.flashcards.length} cards)`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {deck.topic}
                </span>
                <span className="text-xs text-slate-400">
                  {deck.flashcards.length} Flashcards
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Export & Print Flashcards
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Printable PDF & Study Sheets</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
              Offline
            </span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV / Spreadsheet / Anki / Quizlet</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: PRINTABLE PDF & STUDY SHEETS */}
          {/* ========================================================================= */}
          {activeTab === 'pdf' && (
            <div className="space-y-6">
              {/* Layout Selection Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  1. Choose Printable Layout Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Study Sheet Table */}
                  <div
                    onClick={() => setPdfLayout('sheet')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      pdfLayout === 'sheet'
                        ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          pdfLayout === 'sheet'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <TableIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">Study Reference Sheet</h4>
                          <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Clean multi-column table layout with questions, answers, and hints. Perfect for binders, cramming, and fast review.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Cut & Fold Flashcards */}
                  <div
                    onClick={() => setPdfLayout('cutout')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      pdfLayout === 'cutout'
                        ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          pdfLayout === 'cutout'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">Cut & Fold Flashcards</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          2-column cards with dashed scissor lines and center folding spine. Fold along line to create physical 2-sided cards!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Content Options */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  2. Content Customization
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHints}
                      onChange={(e) => setIncludeHints(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Include Hints</span>
                      <p className="text-[11px] text-slate-400">Shows memory hints under answers</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCategory}
                      onChange={(e) => setIncludeCategory(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Include Categories</span>
                      <p className="text-[11px] text-slate-400">Prints category tags on each card</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Print Preview Container */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Print Preview Sample (First 3 of {deck.flashcards.length} cards)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    A4 Portrait • Standard 12mm margins
                  </span>
                </div>

                <div className="bg-white text-slate-900 rounded-xl p-4 shadow-inner border border-slate-300 text-xs select-none">
                  {/* Top document mock banner */}
                  <div className="border-b-2 border-indigo-600 pb-2 mb-3">
                    <div className="font-extrabold text-sm text-slate-900">{deck.title}</div>
                    <div className="text-[10px] text-slate-500 flex gap-3 mt-0.5">
                      <span>Subject: {deck.topic}</span>
                      <span>•</span>
                      <span>Difficulty: {deck.difficulty.toUpperCase()}</span>
                      <span>•</span>
                      <span>{deck.flashcards.length} Total Cards</span>
                    </div>
                  </div>

                  {pdfLayout === 'sheet' ? (
                    <div className="border border-slate-200 rounded divide-y divide-slate-200 overflow-hidden text-[11px]">
                      <div className="grid grid-cols-12 bg-slate-100 font-bold text-slate-700 px-2 py-1.5 text-[10px] uppercase">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Prompt / Concept (Front)</div>
                        <div className="col-span-6">Answer / Explanation (Back)</div>
                      </div>
                      {deck.flashcards.slice(0, 3).map((card, i) => (
                        <div key={card.id} className="grid grid-cols-12 px-2 py-2 gap-2">
                          <div className="col-span-1 font-bold text-indigo-600">#{i + 1}</div>
                          <div className="col-span-5">
                            <p className="font-semibold text-slate-900">{card.front}</p>
                            {includeCategory && card.category && (
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5">
                                [{card.category}]
                              </span>
                            )}
                          </div>
                          <div className="col-span-6">
                            <p className="text-slate-800">{card.back}</p>
                            {includeHints && card.hint && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">
                                Hint: {card.hint}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {deck.flashcards.slice(0, 2).map((card, i) => (
                        <div
                          key={card.id}
                          className="border border-dashed border-slate-400 rounded p-2 text-[10px] bg-slate-50/50 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-center text-[9px] font-bold text-indigo-600 border-b border-slate-200 pb-1 mb-1">
                            <span>CARD #{i + 1}</span>
                            {includeCategory && card.category && (
                              <span className="text-slate-500 font-normal">{card.category}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-bold text-slate-400 block">
                              FRONT
                            </span>
                            <div className="font-bold text-slate-900">{card.front}</div>
                          </div>
                          <div className="border-t border-dashed border-slate-300 my-1.5 text-center text-[7px] text-slate-400">
                            - - - FOLD HERE - - -
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-bold text-slate-400 block">
                              BACK
                            </span>
                            <div className="text-slate-700">{card.back}</div>
                            {includeHints && card.hint && (
                              <span className="text-[8px] text-slate-500 italic block mt-0.5">
                                Hint: {card.hint}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isExportingPDF}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .PDF File</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print / Save as PDF in Browser</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CSV SPREADSHEET & FLASHCARD PLATFORMS */}
          {/* ========================================================================= */}
          {activeTab === 'csv' && (
            <div className="space-y-6">
              {/* Preset Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  1. Choose CSV Format & Platform Compatibility
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setCsvFormat('standard')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      csvFormat === 'standard'
                        ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-1">Standard Full CSV</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      All columns: Front, Back, Category, Hint, Mastery Status. For Excel & Google Sheets.
                    </div>
                  </div>

                  <div
                    onClick={() => setCsvFormat('quizlet')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      csvFormat === 'quizlet'
                        ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-1">Quizlet Compatible</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      2-Column Term & Definition. Ready for direct import into Quizlet study sets.
                    </div>
                  </div>

                  <div
                    onClick={() => setCsvFormat('anki')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      csvFormat === 'anki'
                        ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-1">Anki / RemNote</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      Standard Front/Back format for spaced-repetition software like Anki desktop/web.
                    </div>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      Include Header Row in CSV
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Includes column names on the very first row
                    </p>
                  </div>
                </label>

                <button
                  onClick={handleCopyCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedCSV ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>

              {/* CSV Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    CSV Data Preview ({deck.flashcards.length} Total Cards)
                  </label>
                  <span className="text-[11px] text-slate-500">RFC 4180 Escaped • UTF-8 BOM</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 font-mono">
                          <th className="p-2.5">Front / Question</th>
                          <th className="p-2.5">Back / Answer</th>
                          {csvFormat === 'standard' && (
                            <>
                              <th className="p-2.5">Category</th>
                              <th className="p-2.5">Hint</th>
                              <th className="p-2.5">Status</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                        {deck.flashcards.slice(0, 4).map((card) => (
                          <tr key={card.id} className="hover:bg-slate-900/40">
                            <td className="p-2.5 truncate max-w-[200px] text-white">
                              "{card.front}"
                            </td>
                            <td className="p-2.5 truncate max-w-[240px]">"{card.back}"</td>
                            {csvFormat === 'standard' && (
                              <>
                                <td className="p-2.5 text-slate-400">
                                  "{card.category || deck.topic}"
                                </td>
                                <td className="p-2.5 text-slate-400">"{card.hint || ''}"</td>
                                <td className="p-2.5 text-slate-400">"{card.masteryStatus}"</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {deck.flashcards.length > 4 && (
                    <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-950 border-t border-slate-800">
                      + {deck.flashcards.length - 4} more cards included in export
                    </div>
                  )}
                </div>
              </div>

              {/* Download CSV Action */}
              <div className="pt-2">
                <button
                  onClick={handleDownloadCSV}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .CSV File ({deck.flashcards.length} cards)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Files work offline on all mobile & desktop devices</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
