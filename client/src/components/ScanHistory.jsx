import React, { useEffect, useState } from "react";
import { atsAPI } from "../lib/api";
import { 
  FileText, Calendar, Trash2, CheckCircle, AlertCircle, Loader2, 
  ChevronDown, ChevronUp, History, Zap, RefreshCw, Wand2, Target, BrainCircuit
} from "lucide-react";
import { useToast } from "../context/ToastContext";

const MatchGapBar = ({ label, percentage, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[8px] font-black uppercase text-gray-400 tracking-tighter">
      <span>{label}</span>
      <span>{percentage}%</span>
    </div>
    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">     
      <div
        className={`h-full transition-all duration-1000 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const KeywordTag = ({ text, type }) => (
  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all hover:scale-105 inline-block m-0.5 ${
    type === 'found' 
    ? "bg-green-50 border-green-100 text-green-600" 
    : "bg-gray-50 border-dashed border-gray-200 text-gray-400"
  }`}>
    {text}
  </span>
);

const ScanHistory = ({ resumeId, onSelectScan, onRecalculate, onGoToFix, calculatingId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (resumeId) fetchHistory();
  }, [resumeId, calculatingId]); 

  const fetchHistory = async () => {
    try {
      const res = await atsAPI.getHistory(resumeId);
      const sortedHistory = (res.data.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
      );
      setHistory(sortedHistory);
    } catch (error) {
      toast.error("Failed to load scan history");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (scan) => {
    setExpandedId(expandedId === scan._id ? null : scan._id);
    if (onSelectScan) {
        onSelectScan(scan);
    }
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (scanId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this scan record?")) {
      try {
        await atsAPI.deleteScan(scanId);
        setHistory(history.filter(s => s._id !== scanId));
        toast.success("Scan deleted");
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#00c29f]" /></div>;

  if (history.length === 0) return (
    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <History className="mx-auto mb-4 text-gray-300" size={32} />
      <p className="text-gray-500">No scan history for this resume.</p>
    </div>
  );

  return (
    <div className="space-y-3 px-1">
      {history.map((scan) => {
        const isExpanded = expandedId === scan._id;
        const isCalculating = calculatingId === scan._id;
        
        return (
          <div
            key={scan._id}
            className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? "border-indigo-200 shadow-md" : "border-gray-100 shadow-sm hover:border-gray-200"}`}
          >
            <div
              className={`p-4 flex items-center justify-between transition-colors ${isExpanded ? "bg-indigo-50/30" : "hover:bg-gray-50"}`}   
            >
              <div 
                onClick={() => onSelectScan && onSelectScan(scan)}
                className="flex items-center gap-3 cursor-pointer group flex-1"
              >
                <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                  scan.score >= 80 ? "bg-green-50 border-green-100 text-green-600" :
                  scan.score >= 50 ? "bg-amber-50 border-amber-100 text-amber-600" : 
                  "bg-red-50 border-red-100 text-red-600"
                }`}>
                  <span className="text-[10px] uppercase font-black tracking-tighter leading-none mb-0.5">Score</span>
                  <span className="text-sm font-black leading-none">{scan.score}%</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-[13px] line-clamp-1 leading-tight group-hover:text-indigo-600 transition-colors">
                      {scan.jdTitle || "Job Description Scan"}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 font-medium">
                    <Calendar size={10} />
                    <span>{new Date(scan.createdAt).toLocaleDateString()}</span>  
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => toggleExpand(e, scan._id)}
                  className={`p-2 rounded-lg transition-all ${isExpanded ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                  title={isExpanded ? "Collapse" : "View Details"}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  disabled={isCalculating}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRecalculate) onRecalculate(scan);
                  }}
                  className={`p-2 rounded-lg transition-all ${isCalculating ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                  title="Recalculate Score"
                >
                  <RefreshCw size={14} className={isCalculating ? "animate-spin" : ""} />
                </button>
                <button
                   onClick={(e) => handleDelete(scan._id, e)}
                   className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="px-5 pb-5 pt-2 space-y-5 animate-in slide-in-from-top-2 duration-300">
                {/* 1. Header Info: Match Gaps vs Keywords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Gap Analysis */}
                    <div className="space-y-3">
                        <h5 className="text-[10px] uppercase font-black text-indigo-600 tracking-widest flex items-center gap-1.5">
                            <Zap size={10} className="fill-indigo-600" /> Match Metrics
                        </h5>
                        <div className="bg-white/50 p-4 rounded-xl border border-indigo-50 grid grid-cols-2 gap-x-6 gap-y-3">
                            <MatchGapBar label="Skills" percentage={scan.match_gap?.skills || 0} color="bg-indigo-500" />
                            <MatchGapBar label="Exp Depth" percentage={scan.match_gap?.experience || 0} color="bg-indigo-400" />
                            <MatchGapBar label="Education" percentage={scan.match_gap?.education || 0} color="bg-indigo-300" />
                            <MatchGapBar label="Culture" percentage={scan.match_gap?.culture || 0} color="bg-indigo-200" />
                        </div>
                    </div>

                    {/* Right: Keywords */}
                    <div className="space-y-3">
                        <h5 className="text-[10px] uppercase font-black text-emerald-600 tracking-widest flex items-center gap-1.5">
                            <Target size={10} className="fill-emerald-600" /> Keywords Discovery
                        </h5>
                        <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-50 max-h-[100px] overflow-y-auto custom-scrollbar">
                            <div className="flex flex-wrap">
                                {(scan.analysis?.keywords_found || []).slice(0, 8).map((k, i) => (
                                    <KeywordTag key={`f-${i}`} text={k} type="found" />
                                ))}
                                {(scan.analysis?.keywords_missing || []).slice(0, 12).map((k, i) => (
                                    <KeywordTag key={`m-${i}`} text={k} type="missing" />
                                ))}
                                {(!scan.analysis?.keywords_found?.length && !scan.analysis?.keywords_missing?.length) && (
                                    <span className="text-[10px] text-gray-400 italic">No keywords processed.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Insights: Strengths vs Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 border-t border-gray-50">
                    <div className="space-y-2">
                        <h5 className="text-[9px] uppercase font-black text-green-600/60 tracking-widest leading-none">Top Strengths</h5>
                        <ul className="space-y-1.5">
                            {(scan.analysis?.strengths || []).slice(0, 2).map((s, i) => (
                                <li key={i} className="text-[11px] text-gray-700 flex items-start gap-1.5 leading-tight">
                                    <div className="w-1 h-1 rounded-full bg-green-400 mt-1 shrink-0" /> {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h5 className="text-[9px] uppercase font-black text-amber-600/60 tracking-widest leading-none">Priority Fixes</h5>
                        <ul className="space-y-1.5">
                            {(scan.analysis?.improvements || []).slice(0, 2).map((imp, i) => (
                                <li key={i} className="text-[11px] text-gray-700 flex items-start gap-1.5 leading-tight">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1 shrink-0" /> {imp}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 3. The Audit Summary Call-to-Action */}
                <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-indigo-200 shadow-xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <BrainCircuit size={60} />
                   </div>
                   <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-2 opacity-80">
                           <BrainCircuit size={12} />
                           <span className="text-[9px] font-black uppercase tracking-widest">AI Strategic Summary</span>
                       </div>
                       <p className="text-[12px] leading-relaxed font-medium mb-4 italic border-l-2 border-white/20 pl-3">
                          "{scan.analysis?.summary || "No summary available."}"
                       </p>
                       <button 
                         onClick={() => onGoToFix(scan)}
                         className="w-full bg-white text-indigo-700 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-indigo-50 border-none shadow-lg active:scale-95"
                       >
                          <Wand2 size={12} className="fill-indigo-700" />
                          Implement Recommended Fixes
                       </button>
                   </div>
                </div>

                {/* 4. JD Text Preview (Moved to bottom, collapsed) */}
                <details className="mt-2 group">
                    <summary className="text-[9px] uppercase font-black text-gray-400 tracking-widest cursor-pointer list-none flex items-center justify-center gap-1 hover:text-indigo-500 transition-colors">
                        View Original Job Description
                    </summary>
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
                        <p className="text-[11px] text-gray-600 leading-relaxed italic whitespace-pre-wrap">
                            {scan.jdText || "No JD text available."}
                        </p>
                    </div>
                </details>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ScanHistory;
