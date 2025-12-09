import React from 'react';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import Wizard from './components/Wizard/Wizard';
import ResultsDashboard from './components/Results/ResultsDashboard';
import LandingPage from './components/Landing/LandingPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import UserDashboard from './components/Dashboard/UserDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
const AppContent: React.FC = () => {
  const { isComplete, isStarted, results } = useAssessment();
  const { loading } = useAuth();

  // Backward compatibility: If we have results but isStarted is false (legacy session), treat as started
  const showContent = isStarted || !!results;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  if (!showContent) {
    return <LandingPage />;
  }

  return (
    <div className="container">
      <main>
        {!isComplete ? (
          <Wizard />
        ) : (
          <div className="card" style={{ textAlign: 'center', background: 'transparent', boxShadow: 'none', border: 'none' }}>
            <ResultsDashboard />
          </div>
        )}
      </main>
    </div>
  );
};

import Navbar from './components/Navigation/Navbar';

function App() {
  return (
    <AssessmentProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<UserDashboard />} />
          </Routes>
        </Router>
      </AuthProvider>
    </AssessmentProvider>
  );
}

export default App;
