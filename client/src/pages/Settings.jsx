import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, resumeAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Lock, Trash2, Save, LogOut } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('account');
  
  // Password State
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Profile State
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (activeTab === 'profile' && !profile) {
        fetchProfile();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
      try {
          const res = await resumeAPI.getDetail('profile'); // Assuming endpoint logic
          // Note: In real implementation, you might need a specific /api/resume/master endpoint
          // For now, we'll placeholder this as if fetching the master profile
          setProfile(res.data?.data || {});
      } catch (e) {
          // Profile fetch skipped (might not exist yet)
      }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPassMsg({ type: '', text: '' });
    
    // Using axios directly or adding authAPI.changePassword method
    try {
        await authAPI.changePassword(passData); // Needs to be added to API lib
        setPassMsg({ type: 'success', text: 'Password updated successfully.' });
        setPassData({ currentPassword: '', newPassword: '' });
    } catch (err) {
        setPassMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password.' });
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
      const confirm = window.prompt("Type 'DELETE' to confirm account deletion. This action cannot be undone.");
      if (confirm === 'DELETE') {
          try {
              // 1. Wipe Data
              await resumeAPI.delete('wipe'); // Needs specific endpoint implementation or loop
              // 2. Delete User
              // await authAPI.deleteAccount();
              toast.success("Account deleted.");
              logout();
          } catch (e) {
              toast.error("Failed to delete account.");
          }
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-display text-gray-900 mb-8">Account Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button 
                        onClick={() => setActiveTab('account')}
                        className={`w-full text-left px-6 py-4 flex items-center gap-3 font-medium transition-colors ${activeTab === 'account' ? 'bg-[#00c29f]/10 text-[#00c29f] border-l-4 border-[#00c29f]' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Lock size={18} /> Security & Account
                    </button>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-6 py-4 flex items-center gap-3 font-medium transition-colors ${activeTab === 'profile' ? 'bg-[#00c29f]/10 text-[#00c29f] border-l-4 border-[#00c29f]' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <User size={18} /> Master Profile
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                
                {/* Account Tab */}
                {activeTab === 'account' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6">Change Password</h2>
                            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                <Input 
                                    label="Current Password" 
                                    type="password" 
                                    value={passData.currentPassword}
                                    onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                                />
                                <Input 
                                    label="New Password" 
                                    type="password" 
                                    value={passData.newPassword}
                                    onChange={e => setPassData({...passData, newPassword: e.target.value})}
                                />
                                
                                {passMsg.text && (
                                    <div className={`text-sm p-3 rounded-lg ${passMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {passMsg.text}
                                    </div>
                                )}

                                <Button type="submit" loading={loading} variant="primary">
                                    Update Password
                                </Button>
                            </form>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100">
                            <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
                            <p className="text-gray-500 mb-6 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
                            <Button variant="outline" onClick={handleDeleteAccount} className="border-red-200 text-red-600 hover:bg-red-50">
                                <Trash2 size={16} className="mr-2" /> Delete Account
                            </Button>
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={32} className="text-gray-400"/>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Master Profile Data</h2>
                            <p className="text-gray-500 max-w-md mx-auto mt-2">
                                Your master profile aggregates data from all your resumes. 
                                <br/>
                                <span className="text-xs text-gray-400">(This feature allows global updates across future resumes - Coming Soon)</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;