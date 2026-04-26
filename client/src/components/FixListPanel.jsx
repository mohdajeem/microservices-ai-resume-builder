import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Wand2, Copy, Loader2, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

const FixListPanel = ({ auditReport, onApplyFix, loading, activeJdTitle, lineTrade, onRecalculate, recalculating }) => {
  // Local state to track which items were successfully fixed
  // Structure: { 0: true, 1: true, ... }
  const [fixedItems, setFixedItems] = useState({});

  const handleApply = async (fix, index) => {
    // 1. Call the parent function to update state & backend
    const success = await onApplyFix(fix);
    
    // 2. If successful (returned ID or true), mark visually as done
    // Note: In ResumeEditor.jsx, return 'targetId' on success, null on fail
    if (success) {
        setFixedItems(prev => ({ ...prev, [index]: true }));
    }
  };

  const appliedCount = Object.keys(fixedItems).length;

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border-t border-gray-100">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20 scale-150"></div>
            <div className="relative bg-white p-4 rounded-full shadow-lg">
                <Sparkles className="text-indigo-600 animate-pulse" size={40} />
            </div>
            <Loader2 className="absolute -bottom-2 -right-2 text-indigo-400 animate-spin" size={24} />
        </div>
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter italic">AI is Auditing...</h3>
        <p className="text-[11px] text-gray-400 mt-2 font-bold uppercase tracking-widest max-w-[200px]">
            Generating high-impact rewrite suggestions for {activeJdTitle || 'your resume'}
        </p>
      </div>
    );
  }

  // Pre-process suggestions to show Line Trades prominently
  const tradeSuggestions = auditReport?.filter(f => f.isLineTrade) || [];
  const contentUpdates = auditReport?.filter(f => !f.isLineTrade) || [];

  if (!auditReport || auditReport.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <CheckCircle size={48} className="text-green-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Analysis Complete</h3>
        {activeJdTitle ? (
            <p className="text-sm">No specific fixes for <b className="text-indigo-600 truncate max-w-[150px] inline-block align-bottom">{activeJdTitle}</b>.</p>
        ) : (
            <p className="text-sm">Run the Audit to see detailed suggestions.</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Wand2 className="text-indigo-600" size={20} /> AI Improvements
        </h2>
        {lineTrade?.spaceSavingSuggestions?.length > 0 && (
            <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div className="flex items-center gap-2 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Sparkles size={14} /> Line-Trade Strategy Active
                </div>
                <p className="text-[11px] text-indigo-600/80 leading-relaxed font-medium">
                    To maintain a 1-page layout with a new Summary, we've identified <b>{lineTrade.spaceSavingSuggestions.length} low-impact bullets</b> to merge/remove.
                </p>
            </div>
        )}
        <p className="text-xs text-gray-500 mt-1 pl-1">
          {activeJdTitle ? (
              <span>Targeting: <b className="text-indigo-600 font-bold tracking-tight">{activeJdTitle}</b></span>
          ) : (
              <span>{auditReport.length} structural fixes found.</span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pt-6">
        
        {/* Layout Maintenance Section */}
        {tradeSuggestions.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 px-2 mb-3 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-80">
                     <Trash2 size={12} strokeWidth={3} /> Layout Maintenance
                </div>
                {tradeSuggestions.map((fix, idx) => {
                    const actualIdx = auditReport.indexOf(fix);
                    const isFixed = fixedItems[actualIdx];

                    if (isFixed) return null; // Simple trade-offs disappear once handled

                    return (
                        <div key={`trade-${idx}`} className="mb-3 bg-white rounded-xl border-l-4 border-l-indigo-400 border-gray-200 border p-4 shadow-sm hover:shadow-md transition-all">
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                    Space Optimization
                                </span>
                            </div>
                            <div className="text-[12px] leading-relaxed font-bold text-gray-900 mb-2">
                                {fix.suggestion ? "Merge into one line" : "Recommendation: Remove Bullet"}
                            </div>
                            <div className="text-[11px] text-gray-400 opacity-60 line-through mb-3 italic leading-relaxed">
                                "{fix.original}"
                            </div>
                            <Button 
                                onClick={() => handleApply(fix, actualIdx)}
                                variant="outline"
                                className="w-full h-8 text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300"
                            >
                                {fix.suggestion ? "Merge Bullets" : "Discard to save space"}
                            </Button>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Standard Suggestions */}
        {contentUpdates.map((fix, index) => {
            const actualIdx = auditReport.indexOf(fix);
            const isFixed = fixedItems[actualIdx];

            // SUCCESS STATE (Render Green Card)
            if (isFixed) {
                return (
                    <div key={actualIdx} className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between animate-fade-in-up transition-all duration-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 text-green-600 p-2 rounded-full shrink-0">
                                <CheckCircle size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-green-800">Fix Applied!</h4>
                                <p className="text-xs text-green-600 mt-0.5">Updated {fix.context}</p>
                            </div>
                        </div>
                    </div>
                );
            }

            // STANDARD STATE (Render Suggestion Card)
            return (
              <div key={actualIdx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                
                {/* Header: Section & Context */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {fix.section}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">
                        {fix.context}
                    </span>
                </div>

                {/* The Reason */}
                <div className="mb-3 flex gap-2 items-start bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-800 leading-relaxed font-medium">{fix.reason}</p>
                </div>

                {/* Comparison */}
                <div className="space-y-2 mb-4">
                    <div className="text-xs text-red-300 line-through opacity-70 pl-2 border-l-2 border-red-100 italic">
                        {fix.original}
                    </div>
                    <div className="text-sm text-gray-800 font-bold pl-2 border-l-2 border-indigo-400 tracking-tight leading-snug">
                        {fix.suggestion}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-gray-50">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-xs h-8 font-bold border-gray-200 text-gray-500"
                    onClick={() => navigator.clipboard.writeText(fix.suggestion)}
                  >
                    <Copy size={12} className="mr-2" /> Copy
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 border-none font-bold"
                    onClick={() => handleApply(fix, actualIdx)}
                    disabled={loading}
                  >
                    <Wand2 size={12} className="mr-2" /> Apply Fix
                  </Button>
                </div>
              </div>
            );
        })}
      </div>

      {/* Recalculate Score Sticky Footer */}
      {(appliedCount > 0 || auditReport.length > 0) && (
        <div className="p-4 bg-white z-10">
          <Button 
            onClick={onRecalculate}
            disabled={recalculating}
            className={`w-full ${recalculating ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold h-11 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group relative overflow-hidden`}
          >
            {recalculating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Scanning Resume...</span>
              </>
            ) : (
              <>
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                <span>Check New ATS Score</span>
              </>
            )}
            
            {/* Progress bar overlay for effect */}
            {recalculating && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
            )}
          </Button>
          <p className="text-[10px] text-gray-400 text-center mt-2 font-medium uppercase tracking-tight">
            Force a fresh scan to see how your changes improved the score
          </p>
        </div>
      )}
    </div>
  );
};

export default FixListPanel;