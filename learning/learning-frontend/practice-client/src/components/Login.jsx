import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex relative overflow-hidden">
        {/* Background blobs from Home */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#00c29f]/10 rounded-full blur-[120px] pointer-events-none"/>
        
        <div className="w-full max-w-md m-auto p-6 relative z-10">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
                <ArrowLeft size={16} className="mr-2"/> Back to Home
            </Link>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/50 p-8 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00c29f]/10 text-[#00c29f] mb-4">
                        <Sparkles size={20} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 font-display">Welcome Back</h1>
                    <p className="text-gray-500 mt-2">Sign in to access your resume dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">{error}</div>}
                    
                    <Input 
                        label="Email Address" 
                        type="email" 
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                    <Input 
                        label="Password" 
                        type="password" 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                    
                    <Button type="submit" loading={loading} className="w-full mt-2">Sign In</Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="text-[#00c29f] font-bold hover:underline">Create one</Link>
                </div>
            </div>
        </div>
    </div>
  );
};