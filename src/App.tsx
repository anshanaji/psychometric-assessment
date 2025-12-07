import React, { useState } from 'react';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import Wizard from './components/Wizard/Wizard';
import ResultsDashboard from './components/Results/ResultsDashboard';
import LandingPage from './components/Landing/LandingPage';

const AppContent: React.FC = () => {
  const { isComplete } = useAssessment();
  const [hasStarted, setHasStarted] = useState(isComplete);

  if (!hasStarted) {
    return <LandingPage onStart={() => setHasStarted(true)} />;
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

function App() {
  return (
    <AssessmentProvider>
      <AppContent />
    </AssessmentProvider>
  );
}

export default App;
