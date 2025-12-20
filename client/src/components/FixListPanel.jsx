import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Wand2, Copy } from 'lucide-react';
import { Button } from './ui/Button';

const FixListPanel = ({ auditReport, onApplyFix, loading }) => {
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

  if (!auditReport || auditReport.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <CheckCircle size={48} className="text-green-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Analysis Complete</h3>
        <p className="text-sm">Run the Audit to see detailed suggestions.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Wand2 className="text-[#00c29f]" size={20} /> AI Improvements
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {auditReport.length} structural fixes found.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {auditReport.map((fix, index) => {
            const isFixed = fixedItems[index];

            // ✅ SUCCESS STATE (Render Green Card)
            if (isFixed) {
                return (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between animate-fade-in-up transition-all duration-500">
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

            // ✅ STANDARD STATE (Render Suggestion Card)
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                
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
                    <p className="text-xs text-orange-800 leading-relaxed">{fix.reason}</p>
                </div>

                {/* Comparison */}
                <div className="space-y-2 mb-4">
                    <div className="text-xs text-red-400 line-through opacity-70 pl-2 border-l-2 border-red-200">
                        {fix.original}
                    </div>
                    <div className="text-sm text-green-700 font-medium pl-2 border-l-2 border-green-400">
                        {fix.suggestion}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-gray-50">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => navigator.clipboard.writeText(fix.suggestion)}
                  >
                    <Copy size={12} className="mr-2" /> Copy
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-[#00c29f] hover:bg-[#00a085] text-white text-xs h-8 border-none"
                    onClick={() => handleApply(fix, index)} // Use wrapper handler
                    disabled={loading}
                  >
                    <Wand2 size={12} className="mr-2" /> Apply Fix
                  </Button>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default FixListPanel;