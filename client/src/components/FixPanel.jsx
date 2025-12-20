import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, Wand2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

const FixPanel = ({ fix, onApply, onCancel, loading }) => {
  if (!fix) return null;

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-4">
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">AI Optimization</h2>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            {fix.section}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
        
        {/* The Issue */}
        <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-red-600 font-bold mb-3 text-sm uppercase tracking-wide">
            <XCircle size={16} /> Original Text
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed line-through decoration-red-300 decoration-2">
            {fix.original}
          </p>
        </div>

        {/* AI Reasoning (Optional) */}
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-1">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-gray-900 font-bold text-sm mb-1">Improvement Reason</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              This sentence can be optimized for better impact and ATS keyword matching.
            </p>
          </div>
        </div>

        {/* The Solution */}
        <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-md ring-1 ring-green-500/10">
          <h3 className="flex items-center gap-2 text-green-600 font-bold mb-3 text-sm uppercase tracking-wide">
            <CheckCircle size={16} /> Suggested Change
          </h3>
          <p className="text-gray-800 text-base leading-relaxed font-medium">
            {fix.suggestion}
          </p>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          className="flex-1 text-gray-500 hover:text-gray-700"
        >
          Ignore
        </Button>
        <Button 
          onClick={() => onApply(fix)} 
          disabled={loading}
          className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
        >
          {loading ? 'Applying...' : 'Apply Fix'} <Wand2 size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default FixPanel;