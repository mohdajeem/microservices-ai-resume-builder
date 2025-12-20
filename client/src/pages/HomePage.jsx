import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Import Auth Context
import { 
  ChevronDown, Menu, X, ArrowRight, Sparkles, CheckCircle, 
  UploadCloud, FileText, Zap, Shield, Star, MousePointer2, LayoutDashboard 
} from 'lucide-react';

// --- Utility for Scroll Animations ---
const useElementOnScreen = (options) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(containerRef.current); // Only trigger once
      }
    }, options);

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [containerRef, options]);

  return [containerRef, isVisible];
};

// --- Shared Components ---

const SectionBadge = ({ children, className = "" }) => (
  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 mb-6 ${className}`}>
    <span className="flex items-center justify-center w-5 h-5 bg-[#00c29f] text-white rounded-full text-[10px]">
      <Sparkles size={10} fill="currentColor" />
    </span>
    <span className="text-xs font-bold text-[#00c29f] uppercase tracking-widest">{children}</span>
  </div>
);

// --- Sections ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth(); // ✅ Check Login Status

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm py-2' : 'bg-transparent border-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group pl-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00c29f] to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20 group-hover:rotate-12 transition-transform duration-300">
                N
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight font-display">Nexus<span className="text-[#00c29f]">Job</span></span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {['Features', 'How it Works', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-sm font-medium text-gray-600 hover:text-[#00c29f] transition-colors relative group relative overflow-hidden">
                {item}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00c29f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
                // ✅ LOGGED IN VIEW
                <Link 
                  to="/dashboard" 
                  className="bg-[#00c29f] hover:bg-[#00a082] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(0,194,159,0.39)] hover:shadow-[0_6px_20px_rgba(0,194,159,0.23)] hover:-translate-y-0.5 relative overflow-hidden group flex items-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  <span className="relative z-10">Dashboard</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </Link>
            ) : (
                // ❌ GUEST VIEW
                <>
                    <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-black px-4 py-2 transition-colors">
                    Sign in
                    </Link>
                    <Link 
                    to="/register" 
                    className="bg-[#00c29f] hover:bg-[#00a082] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(0,194,159,0.39)] hover:shadow-[0_6px_20px_rgba(0,194,159,0.23)] hover:-translate-y-0.5 relative overflow-hidden group"
                    >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </Link>
                </>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 p-2">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl p-4 flex flex-col gap-4 lg:hidden animate-fade-in-down">
            {user ? (
                <Link to="/dashboard" className="w-full text-center py-3 font-bold text-white bg-[#00c29f] rounded-xl flex items-center justify-center gap-2">
                    <LayoutDashboard size={18} /> Go to Dashboard
                </Link>
            ) : (
                <>
                    <Link to="/login" className="w-full text-center py-3 font-medium text-gray-600 bg-gray-50 rounded-xl">Sign In</Link>
                    <Link to="/register" className="w-full text-center py-3 font-bold text-white bg-[#00c29f] rounded-xl">Get Started</Link>
                </>
            )}
        </div>
      )}
    </nav>
  );
};

// --- New Component: Pure CSS Scanner Animation ---
const ScannerAnimation = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[3/4] md:aspect-[4/3] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 select-none">
      {/* Mock Resume Content */}
      <div className="p-8 space-y-6 opacity-30">
        {/* Header */}
        <div className="flex gap-4 items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gray-300"></div>
            <div className="space-y-3 flex-1">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
        </div>
        {/* Body Lines */}
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
        <div className="space-y-3 pt-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
        <div className="flex gap-4 pt-4">
             <div className="h-32 bg-gray-100 rounded w-1/3"></div>
             <div className="h-32 bg-gray-100 rounded w-1/3"></div>
             <div className="h-32 bg-gray-100 rounded w-1/3"></div>
        </div>
      </div>

      {/* Scanning Overlay Effect */}
      <div className="absolute inset-0 z-10 animate-scan pointer-events-none">
         {/* The Glowing Line */}
         <div className="h-2 w-full bg-[#00c29f] shadow-[0_0_20px_rgba(0,194,159,0.8)]"></div>
         {/* The Gradient Trail */}
         <div className="h-40 w-full bg-gradient-to-t from-[#00c29f]/20 to-transparent"></div>
      </div>

      {/* Success Badge (Pops up) */}
      <div className="absolute bottom-6 right-6 bg-white px-4 py-2 rounded-lg shadow-lg border border-green-100 flex items-center gap-2 animate-bounce-in">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-bold text-gray-700">ATS Score: 98%</span>
      </div>
    </div>
  );
};

// --- Updated Hero Section ---
const Hero = () => {
  const { user } = useAuth(); // ✅ Check Login Status

  return (
    <div className="relative pt-36 pb-24 lg:pt-44 lg:pb-36 overflow-hidden bg-[#FAFAFA]">
      {/* Background Elements */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-gray-50/20 to-transparent pointer-events-none"></div>
      
      {/* CSS Animations Styles */}
      <style jsx="true">{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          50.01% { transform: translateY(-100%); } /* Instant reset for loop effect */
          100% { transform: translateY(100%); }
        }
        .animate-scan { animation: scan 4s linear infinite; }
        
        @keyframes bounceIn {
          0%, 100% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
        }
        .animate-bounce-in { animation: bounceIn 2s ease-in-out infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="text-center lg:text-left">
                <div className="animate-fade-in-up">
                  <SectionBadge>AI-Powered Resume Builder</SectionBadge>
                </div>
                
                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1] mb-8 tracking-tight font-display animate-fade-in-up animation-delay-200">
                  Build a Resume That <br/>
                  <span className="relative inline-block text-[#00c29f]">
                    Beats the ATS
                  </span>
                </h1>
                
                <p className="text-xl text-gray-500 mb-10 leading-relaxed animate-fade-in-up animation-delay-400">
                  Our AI analyzes job descriptions and optimizes your keywords in real-time. Increase your interview chances by 3x.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-600">
                  {user ? (
                      // ✅ LOGGED IN BUTTONS
                      <Link 
                        to="/dashboard"
                        className="group bg-[#00c29f] hover:bg-[#00a082] text-white text-lg px-8 py-4 rounded-full font-bold transition-all shadow-[0_10px_20px_rgba(0,194,159,0.3)] hover:-translate-y-1 flex items-center gap-2"
                      >
                        <LayoutDashboard size={20} />
                        <span>Go to Dashboard</span> 
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                  ) : (
                      // ❌ GUEST BUTTONS
                      <>
                        <Link 
                            to="/register"
                            className="group bg-[#00c29f] hover:bg-[#00a082] text-white text-lg px-8 py-4 rounded-full font-bold transition-all shadow-[0_10px_20px_rgba(0,194,159,0.3)] hover:-translate-y-1 flex items-center gap-2"
                        >
                            <span>Create My Resume</span> 
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/login" className="px-8 py-4 rounded-full font-bold text-gray-600 hover:bg-gray-100 transition-all">
                            Existing User?
                        </Link>
                      </>
                  )}
                </div>
            </div>

            {/* Right Animation (Replaces the broken image) */}
            <div className="relative animate-fade-in-up animation-delay-800">
                {/* Background Blob for depth */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-100/50 rounded-full blur-3xl -z-10"></div>
                
                {/* The New Scanner Component */}
                <ScannerAnimation />
            </div>
        </div>
      </div>
    </div>
  );
};

const Stats = () => {
  const [ref, isVisible] = useElementOnScreen({ threshold: 0.1 });

  return (
    <div ref={ref} className={`border-y border-gray-100 bg-white transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Resumes Created', value: '15,000+', icon: FileText },
            { label: 'Interview Rate', value: '+65%', icon: Zap },
            { label: 'Time Saved', value: '5 Hrs', icon: Sparkles },
            { label: 'User Rating', value: '4.9/5', icon: Star },
          ].map((stat, idx) => (
            <div key={idx} className="p-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-center items-center w-12 h-12 mx-auto mb-4 bg-teal-50 text-[#00c29f] rounded-full">
                <stat.icon size={24} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-display">{stat.value}</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Features = () => {
  const [ref, isVisible] = useElementOnScreen({ threshold: 0.1 });

  const features = [
    {
      icon: <Zap className="text-amber-500" />,
      title: "Real-time ATS Scoring",
      desc: "Instant feedback on how well your resume matches the job description before you apply.",
      color: "amber"
    },
    {
      icon: <MousePointer2 className="text-[#00c29f]" />,
      title: "Smart Editor",
      desc: "Drag, drop, and edit sections easily. Our AI suggests bullet points that highlight your impact.",
      color: "teal"
    },
    {
      icon: <FileText className="text-blue-500" />,
      title: "PDF Extraction",
      desc: "Don't start from scratch. Upload your old PDF and let our parser structure it for you.",
      color: "blue"
    },
    {
      icon: <Shield className="text-purple-500" />,
      title: "AI Audit",
      desc: "Get line-by-line suggestions to improve grammar, impact, and keyword density.",
      color: "purple"
    }
  ];

  return (
    <div id="features" className="py-28 bg-gray-50 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      <div ref={ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <SectionBadge className="mb-4">Powerful Features</SectionBadge>
          <h2 className="text-4xl font-bold text-gray-900 mb-6 font-display">Everything you need to get hired</h2>
          <p className="text-gray-500 text-lg leading-relaxed">We've simplified the entire process of creating a job-winning resume.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className={`bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-100/50 hover:-translate-y-3 hover:shadow-[0_20px_40px_-10px_rgba(0,194,159,0.15)] transition-all duration-500 group relative overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br from-${f.color}-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <div className={`w-16 h-16 bg-${f.color}-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm`}>
                    {React.cloneElement(f.icon, { size: 30 })}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-display">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const [ref, isVisible] = useElementOnScreen({ threshold: 0.1 });

  return (
    <div id="how-it-works" className="py-28 bg-white relative">
      <div ref={ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center mb-20">
          <SectionBadge className="mb-4">Simple Process</SectionBadge>
          <h2 className="text-4xl font-bold text-gray-900 font-display">How NexusJob Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
           {/* Connecting Line (Desktop) */}
           <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-[#00c29f]/20 to-transparent border-t-2 border-dashed border-[#00c29f]/30 -z-0"></div>

           {[
             { title: "Upload or Create", desc: "Import your old PDF or start fresh with our professional templates.", icon: UploadCloud, delay: 0 },
             { title: "Optimize with AI", desc: "Paste the job description and let AI fix your keywords and grammar.", icon: Sparkles, delay: 200 },
             { title: "Download & Apply", desc: "Export a perfectly formatted PDF that beats the ATS bots.", icon: FileText, delay: 400 },
           ].map((step, i) => (
             <div key={i} className={`relative z-10 flex flex-col items-center text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: `${step.delay}ms` }}>
                <div className="w-32 h-32 bg-white border-[6px] border-teal-50 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-teal-100/50 group hover:scale-105 transition-transform duration-500 relative">
                    <div className="absolute inset-0 bg-[#00c29f]/5 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                    <div className="w-20 h-20 bg-gradient-to-br from-[#00c29f] to-teal-600 rounded-full flex items-center justify-center text-white shadow-inner relative z-10">
                         <step.icon size={36} />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 font-display">{step.title}</h3>
                <p className="text-gray-500 max-w-xs text-lg leading-relaxed">{step.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const Pricing = () => {
  const [ref, isVisible] = useElementOnScreen({ threshold: 0.1 });
  const [isAnnual, setIsAnnual] = useState(true);
  const { user } = useAuth(); // ✅ Check Login Status for redirect logic

  const plans = [
    {
      name: "Free",
      price: "0",
      desc: "Perfect for trying out the builder.",
      features: ["1 Resume", "Basic Templates", "TXT Export", "Manual Entry"],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: isAnnual ? "12" : "19",
      desc: "For serious job seekers.",
      features: ["Unlimited Resumes", "AI Content Writer", "Real-time ATS Score", "PDF Downloads", "Email Support"],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Ultimate",
      price: isAnnual ? "29" : "39",
      desc: "Full career toolkit.",
      features: ["Everything in Pro", "LinkedIn Optimization", "Cover Letter Generator", "1-on-1 Resume Review", "Priority Support"],
      cta: "Go Ultimate",
      popular: false,
    },
  ];

  return (
    <div id="pricing" className="py-28 bg-gray-50 relative overflow-hidden">
      <div ref={ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionBadge>Simple Pricing</SectionBadge>
          <h2 className="text-4xl font-bold text-gray-900 mb-6 font-display">Invest in your career</h2>
          <p className="text-gray-500 text-lg">Transparent pricing. No hidden fees. Cancel anytime.</p>
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-8 bg-[#00c29f] rounded-full relative shadow-inner transition-colors focus:outline-none"
            >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isAnnual ? 'left-7' : 'left-1'}`}></div>
            </button>
            <span className={`text-sm font-bold ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly <span className="text-[#00c29f] text-xs bg-teal-50 px-2 py-0.5 rounded-full ml-1">-30%</span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div 
                key={i} 
                className={`relative p-8 rounded-[2rem] border transition-all duration-300 hover:-translate-y-2 ${
                    plan.popular 
                    ? 'bg-white border-[#00c29f] shadow-2xl shadow-[#00c29f]/10 z-10 scale-105' 
                    : 'bg-white border-gray-100 shadow-xl shadow-gray-100/50'
                }`}
            >
                {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00c29f] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                        MOST POPULAR
                    </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-6 h-10">{plan.desc}</p>
                
                <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-400 font-medium">/mo</span>
                </div>

                <ul className="space-y-4 mb-8">
                    {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                            <CheckCircle size={18} className={`flex-shrink-0 ${plan.popular ? 'text-[#00c29f]' : 'text-gray-400'}`} />
                            <span>{feat}</span>
                        </li>
                    ))}
                </ul>

                <Link 
                    to={user ? "/dashboard" : "/register"} 
                    className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${
                        plan.popular 
                        ? 'bg-[#00c29f] text-white hover:bg-[#00a082] shadow-lg hover:shadow-xl' 
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    {user ? "Go to Dashboard" : plan.cta}
                </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CTA = () => {
  const [ref, isVisible] = useElementOnScreen({ threshold: 0.1 });
  const { user } = useAuth(); // ✅ Check Login Status

  return (
    <div className="py-28 px-4 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
      <div ref={ref} className={`max-w-6xl mx-auto bg-gradient-to-br from-[#00c29f] to-teal-700 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-[#00c29f]/30 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} group`}>
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-900 opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 font-display tracking-tight">Ready to land your <br/>dream job?</h2>
          <p className="text-teal-50 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">Stop guessing keywords. Start using data to get hired faster. Join thousands of users today.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link 
              to={user ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-3 bg-white text-[#00c29f] px-10 py-5 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:bg-gray-50 transition-all relative overflow-hidden group/btn"
            >
              <span className="relative z-10">{user ? "Go to Dashboard" : "Build Your Resume Free"}</span> <ArrowRight className="relative z-10 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </div>
          <p className="mt-8 text-teal-100 text-sm font-medium opacity-80 tracking-wide">No credit card required • Free plan available</p>
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00c29f] to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20">N</div>
                    <span className="text-2xl font-bold text-gray-900 font-display">Nexus<span className="text-[#00c29f]">Job</span></span>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
                    The smartest way to build resumes. AI-powered, ATS-friendly, and designed to get you hired.
                </p>
            </div>
            <div>
                <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Product</h4>
                <ul className="space-y-4 text-gray-500 font-medium">
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">Resume Builder</a></li>
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">ATS Scanner</a></li>
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">Resume Examples</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Company</h4>
                <ul className="space-y-4 text-gray-500 font-medium">
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">Blog</a></li>
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">Contact</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Legal</h4>
                <ul className="space-y-4 text-gray-500 font-medium">
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-[#00c29f] transition-colors">Terms of Service</a></li>
                </ul>
            </div>
        </div>
        <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} NexusJob Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0 font-medium">
                <a href="#" className="hover:text-[#00c29f] transition-colors">Twitter</a>
                <a href="#" className="hover:text-[#00c29f] transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-[#00c29f] transition-colors">Facebook</a>
            </div>
        </div>
      </div>
    </footer>
  );
};

const HomePage = () => {
  return (
    <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-[#00c29f]/30 selection:text-[#00c29f] overflow-x-hidden">
      {/* Advanced Animations Styles */}
      <style jsx="true">{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite cubic-bezier(0.4, 0, 0.2, 1); }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; opacity: 0; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
      `}</style>
      
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default HomePage;