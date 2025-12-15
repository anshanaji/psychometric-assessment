import React from 'react';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import Wizard from './components/Wizard/Wizard';
import ResultsDashboard from './components/Results/ResultsDashboard';
import LandingPage from './components/Landing/LandingPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import UserDashboard from './components/Dashboard/UserDashboard';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navigation/Navbar';
import Terms from './components/Legal/Terms';
import RefundPolicy from './components/Legal/RefundPolicy';
import ShippingPolicy from './components/Legal/ShippingPolicy';
import ContactUs from './components/Shared/ContactUs';
import PaymentCallback from './components/Payment/PaymentCallback';

// Guard Component for Test (Wizard)
const TestRoute: React.FC = () => {
  const { isComplete } = useAssessment();
  // If complete, redirect to results
  if (isComplete) {
    return <Navigate to="/results" replace />;
  }
  return <Wizard />;
};

// Guard Component for Results
const ResultsRoute: React.FC = () => {
  const { results } = useAssessment();
  // If no results, redirect to home
  if (!results) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="container">
      <main>
        <div className="card" style={{ textAlign: 'center', background: 'transparent', boxShadow: 'none', border: 'none' }}>
          <ResultsDashboard />
        </div>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AssessmentProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<LandingPage />} />

            <Route path="/test" element={
              <div className="container">
                <main>
                  <TestRoute />
                </main>
              </div>
            } />

            <Route path="/results" element={<ResultsRoute />} />

            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<UserDashboard />} />

            {/* Legal Pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/contact" element={<ContactUs />} />

            {/* Payment Callback */}
            <Route path="/payment/callback" element={<PaymentCallback />} />
          </Routes>
        </Router>
      </AuthProvider>
    </AssessmentProvider>
  );
}

export default App;
