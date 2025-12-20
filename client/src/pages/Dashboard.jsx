import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resumeAPI, authAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, FileText, Calendar, Trash2, Loader2, 
    UploadCloud, Settings, Zap, Crown, CheckCircle 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, login, logout } = useAuth();
  const toast = useToast(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Helper to safely get plan
  const userPlan = user?.subscription?.plan || 'free'; 
  const isFree = userPlan === 'free';

  useEffect(() => {
    refreshUserProfile(); // 1. Get fresh data immediately on load
    fetchResumes();       // 2. Get resumes
  }, []);

  // FIXED FUNCTION: Matches your backend response structure { user: ... }
  const refreshUserProfile = async () => {
    try {
        const res = await authAPI.getMe();
        
        // DETECT DATA STRUCTURE: Check all possible places the user object might be hiding
        const freshUser = res.data.data || res.data.user || (res.data.email ? res.data : null);

        if (freshUser && freshUser.email) {
            // Keep the existing token, just update user details
            const currentToken = localStorage.getItem('token');
            login(freshUser, currentToken);
        }
    } catch (error) {
        // User profile refresh failed silently
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await resumeAPI.list();
      setResumes(res.data.data); 
    } catch (error) {
      console.error("Failed to fetch resumes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    if(window.confirm("Are you sure you want to delete this resume?")) {
        try {
            await resumeAPI.delete(id);
            setResumes(resumes.filter(r => r._id !== id));
            toast.success("Resume deleted successfully.");
        } catch (error) {
            toast.error("Failed to delete resume.");
        }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Dashboard Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 rounded-full border-2 border-[#00c29f] flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#00c29f] rounded-full"></div>
                </div>
                <span className="font-bold text-lg tracking-tight">NexusJob</span>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
                
                {/* --- PLAN BADGE --- */}
                {/* Logic to change color based on plan */}
                <div className={`hidden md:flex items-center px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                    userPlan === 'ultimate' 
                    ? 'bg-purple-50 border-purple-200 text-purple-600'
                    : userPlan === 'pro'
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}>
                    {userPlan === 'ultimate' && <Crown size={12} className="mr-1" />}
                    {userPlan} Plan
                </div>

                {/* --- UPGRADE BUTTON --- */}
                {userPlan !== 'ultimate' && (
                    <Link 
                        to="/pricing" 
                        className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        <Zap size={14} fill="currentColor" /> 
                        {isFree ? 'Upgrade to Pro' : 'Upgrade Plan'}
                    </Link>
                )}

                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.name?.split(' ')[0]}
                </span>
                
                <Link to="/settings" className="text-gray-400 hover:text-gray-600 transition-colors relative group">
                    <Settings size={20} />
                </Link>

                <button onClick={logout} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
                    Sign out
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Success Message if returning from Payment */}
        {searchParams.get('payment') === 'success' && (
             <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-center gap-3 animate-fade-in-down">
                <CheckCircle className="text-green-500" />
                <div>
                    <h3 className="font-bold">Payment Successful!</h3>
                    <p className="text-sm">Your account has been upgraded to {userPlan.toUpperCase()}.</p>
                </div>
             </div>
        )}

        {/* Upgrade Banner (Only if Free) */}
        {isFree && (
            <div className="mb-8 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl text-white flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Crown size={24} className="text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold">Unlock Premium Features</h3>
                        <p className="text-sm text-gray-400">Get unlimited AI scans and premium templates.</p>
                    </div>
                </div>
                <Link to="/pricing" className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
                    Upgrade
                </Link>
            </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div 
                onClick={() => navigate('/ats-check')}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-1">ATS Scanner</h3>
                    <p className="text-white/80 text-sm">Check compatibility score with any JD</p>
                </div>
            </div>

            <div 
                onClick={() => navigate('/ai-audit')}
                className="bg-gradient-to-br from-[#00c29f] to-teal-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-1">AI Auditor</h3>
                    <p className="text-white/80 text-sm">Deep analysis & line-by-line rewrite suggestions</p>
                </div>
            </div>
        </div>

        {/* Header Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 font-display">My Resumes</h1>
                <p className="text-gray-500 mt-1">Manage and track your resume versions</p>
            </div>
            
            <div className="flex gap-3">
                <Link 
                    to="/import-resume" 
                    className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                    <UploadCloud size={20} /> Import
                </Link>
                <Link 
                    to="/create-profile" 
                    className="inline-flex items-center gap-2 bg-[#00c29f] hover:bg-[#00a88a] text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-[#00c29f]/20 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} /> New Resume
                </Link>
            </div>
        </div>

        {/* Resume List */}
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00c29f]" size={40}/></div>
        ) : resumes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FileText size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No resumes yet</h3>
                <p className="text-gray-500 mb-6">Create your first ATS-optimized resume to get started.</p>
                <Link to="/create-profile" className="text-[#00c29f] font-bold hover:underline">Create Resume &rarr;</Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes.map((resume) => (
                    <div 
                        key={resume._id}
                        onClick={() => navigate(`/editor/${resume._id}`)}
                        className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.1)] hover:border-[#00c29f]/30 transition-all cursor-pointer relative"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div className="px-2 py-1 rounded-md bg-gray-50 text-xs font-mono text-gray-500 border border-gray-100 flex items-center gap-1">
                                {resume.atsScore > 75 && <CheckCircle size={12} className="text-green-500"/>}
                                ATS Score: <span className={`font-bold ${resume.atsScore > 75 ? 'text-green-500' : 'text-orange-500'}`}>{resume.atsScore || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#00c29f] transition-colors line-clamp-1">
                            {resume.versionName || 'Untitled Resume'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 line-clamp-1">
                            {resume.jobDescription ? 'Tailored for specific JD' : 'General Application'}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                <span>{new Date(resume.updatedAt).toLocaleDateString()}</span>
                            </div>
                            
                            <button 
                                onClick={(e) => handleDelete(resume._id, e)}
                                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors z-10"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;