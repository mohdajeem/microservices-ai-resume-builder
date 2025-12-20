import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../lib/api';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button'; // Assuming you have this
import { useToast } from '../context/ToastContext';

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);

  const currentPlan = user?.subscription?.plan || 'free';

  const handleUpgrade = async (planName) => {
    const planKey = planName.toLowerCase();
    if (planKey === currentPlan) return;

    setLoading(true);
    try {
      const data = await subscriptionAPI.createCheckoutSession(planKey);
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      }
    } catch (error) {
      toast.error("Failed to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "0",
      desc: "Perfect for trying out the builder.",
      features: ["1 Resume", "Basic Templates", "TXT Export"],
      popular: false,
    },
    {
      name: "Pro",
      price: isAnnual ? "12" : "19",
      desc: "For serious job seekers.",
      features: ["Unlimited Resumes", "AI Content Writer", "Real-time ATS Score", "PDF Downloads"],
      popular: true,
    },
    {
      name: "Ultimate",
      price: isAnnual ? "29" : "39",
      desc: "Full career toolkit.",
      features: ["Everything in Pro", "LinkedIn Optimization", "Cover Letter Generator", "Priority Support"],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto mb-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} className="mr-2"/> Back to Dashboard
        </button>
      </div>

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Upgrade your Plan</h2>
        <p className="text-gray-500">Unlock the full potential of AI resume building.</p>
        
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => {
           const isCurrent = currentPlan === plan.name.toLowerCase();
           return (
            <div key={i} className={`bg-white rounded-2xl p-8 border ${plan.popular ? 'border-[#00c29f] shadow-xl scale-105 z-10' : 'border-gray-200 shadow-sm'}`}>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="my-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle size={16} className="text-[#00c29f]"/> {feat}
                        </li>
                    ))}
                </ul>
                <Button 
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={isCurrent || (plan.name === "Free")}
                    className={`w-full ${plan.popular ? 'bg-[#00c29f] hover:bg-[#00a085]' : 'bg-gray-900'}`}
                >
                    {loading && plan.popular ? <Loader2 className="animate-spin mr-2"/> : null}
                    {isCurrent ? "Current Plan" : plan.name === "Free" ? "Basic Plan" : `Upgrade to ${plan.name}`}
                </Button>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default PricingPage;