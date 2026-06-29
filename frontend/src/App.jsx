import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GenerateFeedback from './pages/GenerateFeedback';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';

function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);

  // Full Screen Loader for Session Checks
  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#0B0F19] text-slate-100">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-accent border-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xl">🚌</div>
        </div>
        <h3 className="text-sm font-extrabold tracking-widest text-slate-400 uppercase animate-pulse">
          MANIVTHA TOURS PORTAL
        </h3>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return <Login />;
  }

  // Page Routing Swapper
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard 
            setActivePage={setActivePage} 
            setSelectedFeedbackId={setSelectedFeedbackId} 
          />
        );
      case 'generate':
        return <GenerateFeedback />;
      case 'history':
        return (
          <History 
            selectedFeedbackId={selectedFeedbackId} 
            setSelectedFeedbackId={setSelectedFeedbackId} 
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return <AdminPanel />;
      default:
        return (
          <Dashboard 
            setActivePage={setActivePage} 
            setSelectedFeedbackId={setSelectedFeedbackId} 
          />
        );
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
