import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // Only get state updater
  const navigate = useNavigate();
  const toast = useToast(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Call API directly
      const res = await authAPI.login(formData);
      
      // 2. Check for success (Handle both backend formats)
      if (res.data.success || res.data.token) {
          const userData = res.data.data || res.data.user;
          const token = res.data.token;

          // 3. Update Global Context
          login(userData, token);
          
          // 4. UI Feedback
          toast.success("Welcome back! Successfully logged in.");
          navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex relative overflow-hidden">
        {/* Background blobs */}
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
                    
                    <Button type="submit" loading={loading} className="w-full mt-2 bg-[#00c29f] hover:bg-[#00a085]">Sign In</Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="text-[#00c29f] font-bold hover:underline">Create one</Link>
                </div>
            </div>
        </div>
    </div>
  );
};


export const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); 
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic Validation
    if (formData.password.length < 6) {
        setLoading(false);
        const msg = "Password must be at least 6 characters long";
        setError(msg);
        toast.error(msg);
        return;
    }

    try {
      // 1. Call Register API
      const res = await authAPI.register(formData);
      
      // 2. Check for Success (Status 201 Created or 200 OK)
      if (res.status === 201 || res.status === 200 || res.data.success) {
          
          const token = res.data.token;
          const userData = res.data.data || res.data.user;

          if (token && userData) {
              // SCENARIO A: Backend sent a token (Auto-Login)
              login(userData, token);
              toast.success("Account created! Welcome to NexusJob.");
              navigate('/dashboard');
          } else {
              // SCENARIO B: Backend created user but didn't send token (Redirect to Login)
              toast.success("Account created successfully! Please sign in.");
              navigate('/login');
          }
      } else {
          // SCENARIO C: API didn't fail, but success flag is missing
          throw new Error('Unexpected response from server');
      }

    } catch (err) {
      console.error("Registration Error:", err);
      const msg = err.response?.data?.message || 
                  err.response?.data?.error || 
                  'Registration failed. Try a different email.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex relative overflow-hidden">
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"/>
        
        <div className="w-full max-w-md m-auto p-6 relative z-10">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
                <ArrowLeft size={16} className="mr-2"/> Back to Home
            </Link>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/50 p-8 sm:p-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 font-display">Create Account</h1>
                    <p className="text-gray-500 mt-2">Start building your ATS-friendly resume</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Message Box */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}
                    
                    <Input 
                        label="Full Name" 
                        type="text" 
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
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
                    
                    <Button type="submit" loading={loading} className="w-full mt-2 bg-[#00c29f] hover:bg-[#00a085]">Get Started</Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-[#00c29f] font-bold hover:underline">Sign in</Link>
                </div>
            </div>
        </div>
    </div>
  );
};

//   const [formData, setFormData] = useState({ name: '', email: '', password: '' });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   const { login } = useAuth(); // We need login to auto-login the user
//   const navigate = useNavigate();
//   const toast = useToast();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);
//     try {
//       // 1. Call Register API
//       const res = await authAPI.register(formData);
      
//       // 2. Check Success
//       if (res.data.success || res.data.token) {
//           const userData = res.data.data || res.data.user;
//           const token = res.data.token;

//           // 3. Auto Login (Update Context)
//           login(userData, token);
          
//           toast.success("Account created! Welcome to NexusJob.");
//           navigate('/dashboard');
//       }
//     } catch (err) {
//       console.error(err);
//       const msg = err.response?.data?.message || 'Registration failed. Try a different email.';
//       toast.error(msg);
//       setError(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#FAFAFA] flex relative overflow-hidden">
//         <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"/>
        
//         <div className="w-full max-w-md m-auto p-6 relative z-10">
//             <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
//                 <ArrowLeft size={16} className="mr-2"/> Back to Home
//             </Link>
            
//             <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/50 p-8 sm:p-10">
//                 <div className="text-center mb-8">
//                     <h1 className="text-3xl font-bold text-gray-900 font-display">Create Account</h1>
//                     <p className="text-gray-500 mt-2">Start building your ATS-friendly resume</p>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">{error}</div>}
                    
//                     <Input 
//                         label="Full Name" 
//                         type="text" 
//                         placeholder="John Doe"
//                         value={formData.name}
//                         onChange={(e) => setFormData({...formData, name: e.target.value})}
//                         required
//                     />
//                     <Input 
//                         label="Email Address" 
//                         type="email" 
//                         placeholder="you@example.com"
//                         value={formData.email}
//                         onChange={(e) => setFormData({...formData, email: e.target.value})}
//                         required
//                     />
//                     <Input 
//                         label="Password" 
//                         type="password" 
//                         placeholder="••••••••"
//                         value={formData.password}
//                         onChange={(e) => setFormData({...formData, password: e.target.value})}
//                         required
//                     />
                    
//                     <Button type="submit" loading={loading} className="w-full mt-2 bg-[#00c29f] hover:bg-[#00a085]">Get Started</Button>
//                 </form>

//                 <div className="mt-6 text-center text-sm text-gray-500">
//                     Already have an account? <Link to="/login" className="text-[#00c29f] font-bold hover:underline">Sign in</Link>
//                 </div>
//             </div>
//         </div>
//     </div>
//   );
// };