// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import HomePage from './pages/HomePage';
// import { Login, Register } from './pages/AuthPages';
// import Dashboard from './pages/Dashboard';
// import CreateResume from './pages/CreateResume';
// import ResumeEditor from './pages/ResumeEditor';
// import ATSScanner from './pages/ATSScanner';
// import AIAudit from './pages/AIAudit';
// import ImportResume from './pages/ImportResume';
// import Settings from './pages/Settings';
// import { ToastProvider } from './context/ToastContext'; // <--- Import this
// // Protected Route Wrapper
// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   if (loading) return <div className="p-10 text-center">Loading...</div>;
//   if (!user) return <Navigate to="/login" />;
//   return children;
// };

// const App = () => {
//   return (
//     // <AuthProvider>
//       <ToastProvider>
//         {/* <Router> */}
//           <Routes>
//             <Route path="/" element={<HomePage />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
            
//             <Route path="/dashboard" element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             } />
            
//             <Route path="/create-profile" element={
//               <ProtectedRoute>
//                 <CreateResume />
//               </ProtectedRoute>
//             } />

//             <Route path="/editor/:id" element={
//               <ProtectedRoute>
//                 <ResumeEditor />
//               </ProtectedRoute>
//             } />
//             <Route path="/ats-check" element={
//               <ProtectedRoute>
//                 <ATSScanner />
//               </ProtectedRoute>
//             } />

//             <Route path="/ai-audit" element={
//               <ProtectedRoute>
//                 <AIAudit />
//               </ProtectedRoute>
//             } />
//             <Route path="/import-resume" element={
//               <ProtectedRoute>
//                 <ImportResume />
//               </ProtectedRoute>
//             } />

//             <Route path="/settings" element={
//               <ProtectedRoute>
//                 <Settings />
//               </ProtectedRoute>
//             } />
//           </Routes>
//         {/* </Router> */}
//       </ToastProvider>
//     // </AuthProvider>
//   );
// };

// export default App;

// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom'; // ❌ Remove BrowserRouter/Router
// import { useAuth } from './context/AuthContext'; // Keep useAuth for ProtectedRoute
// // ❌ Remove AuthProvider and ToastProvider imports from here

// import HomePage from './pages/HomePage';
// import { Login, Register } from './pages/AuthPages';
// import Dashboard from './pages/Dashboard';
// import CreateResume from './pages/CreateResume';
// import ResumeEditor from './pages/ResumeEditor';
// import ATSScanner from './pages/ATSScanner';
// import AIAudit from './pages/AIAudit';
// import ImportResume from './pages/ImportResume';
// import Settings from './pages/Settings';

// // Protected Route Wrapper
// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   if (loading) return <div className="p-10 text-center">Loading...</div>;
//   if (!user) return <Navigate to="/login" />;
//   return children;
// };

// const App = () => {
//   return (
//     // ❌ NO Router, NO AuthProvider here. Just Routes.
//     <Routes>
//       <Route path="/" element={<HomePage />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />
      
//       <Route path="/dashboard" element={
//         <ProtectedRoute>
//           <Dashboard />
//         </ProtectedRoute>
//       } />
      
//       <Route path="/create-profile" element={
//         <ProtectedRoute>
//           <CreateResume />
//         </ProtectedRoute>
//       } />

//       <Route path="/editor/:id" element={
//         <ProtectedRoute>
//           <ResumeEditor />
//         </ProtectedRoute>
//       } />
      
//       <Route path="/ats-check" element={
//         <ProtectedRoute>
//           <ATSScanner />
//         </ProtectedRoute>
//       } />

//       <Route path="/ai-audit" element={
//         <ProtectedRoute>
//           <AIAudit />
//         </ProtectedRoute>
//       } />
      
//       <Route path="/import-resume" element={
//         <ProtectedRoute>
//           <ImportResume />
//         </ProtectedRoute>
//       } />

//       <Route path="/settings" element={
//         <ProtectedRoute>
//           <Settings />
//         </ProtectedRoute>
//       } />
//     </Routes>
//   );
// };

// export default App;


import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import { Login, Register } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import CreateResume from './pages/CreateResume';
import ResumeEditor from './pages/ResumeEditor';
import ATSScanner from './pages/ATSScanner';
import AIAudit from './pages/AIAudit';
import ImportResume from './pages/ImportResume';
import Settings from './pages/Settings';
import PricingPage from './pages/PricingPage'; // ✅ 1. IMPORT THIS

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create-profile" element={<ProtectedRoute><CreateResume /></ProtectedRoute>} />
      <Route path="/editor/:id" element={<ProtectedRoute><ResumeEditor /></ProtectedRoute>} />
      <Route path="/ats-check" element={<ProtectedRoute><ATSScanner /></ProtectedRoute>} />
      <Route path="/ai-audit" element={<ProtectedRoute><AIAudit /></ProtectedRoute>} />
      <Route path="/import-resume" element={<ProtectedRoute><ImportResume /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* ✅ 2. ADD THIS ROUTE */}
      <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />

    </Routes>
  );
};

export default App;