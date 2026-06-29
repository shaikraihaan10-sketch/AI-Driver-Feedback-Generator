import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { FiUser, FiKey, FiSun, FiMoon, FiBriefcase, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const showToast = useToast();

  // Profile data
  const [profileName, setProfileName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Password data
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local API Key Override config
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');

  // Brand settings
  const [companyName, setCompanyName] = useState('Manivtha Tours & Travels');
  const [logoInput, setLogoInput] = useState('🚌');

  // Load local settings overrides
  useEffect(() => {
    const savedKey = localStorage.getItem('user_openai_api_key') || '';
    const savedModel = localStorage.getItem('user_openai_model') || 'gpt-4o';
    const savedCompany = localStorage.getItem('user_company_name') || 'Manivtha Tours & Travels';
    const savedLogo = localStorage.getItem('user_company_logo') || '🚌';

    setOpenaiKey(savedKey);
    setOpenaiModel(savedModel);
    setCompanyName(savedCompany);
    setLogoInput(savedLogo);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName) {
      showToast('Name cannot be empty.', 'warning');
      return;
    }
    const success = await updateProfile({ name: profileName, avatarUrl });
    if (success) {
      showToast('Profile details updated successfully.', 'success');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('Please enter both old and new passwords.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    const success = await updateProfile({ oldPassword, newPassword });
    if (success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully.', 'success');
    }
  };

  const handleSaveAPIOverrides = (e) => {
    e.preventDefault();
    localStorage.setItem('user_openai_api_key', openaiKey);
    localStorage.setItem('user_openai_model', openaiModel);
    showToast('OpenAI settings saved locally in your browser.', 'success');
  };

  const handleSaveBranding = (e) => {
    e.preventDefault();
    localStorage.setItem('user_company_name', companyName);
    localStorage.setItem('user_company_logo', logoInput);
    showToast('Branding changes saved. Reload window to reflect.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
      
      {/* 1. General Profile Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60 space-y-5"
      >
        <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FiUser className="text-primary" /> Profile Settings
        </h3>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-350">Manager Email</label>
            <input
              type="email"
              disabled
              value={user?.email || 'manager@manivtha.com'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-slate-400 text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Full Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Avatar Image URL</label>
            <input
              type="text"
              placeholder="https://image-link.com/photo.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all"
          >
            Save Profile
          </button>
        </form>
      </motion.div>

      {/* 2. Change Password Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60 space-y-5"
      >
        <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FiKey className="text-accent" /> Change Password
        </h3>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-all"
          >
            Update Password
          </button>
        </form>
      </motion.div>

      {/* 3. OpenAI Custom Override API settings */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60 space-y-5"
      >
        <div>
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
            🤖 OpenAI API Credentials
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Provide your own key to override the server's default configuration.</p>
        </div>
        
        <form onSubmit={handleSaveAPIOverrides} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">OpenAI API Key (Local override)</label>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">AI Model Configuration</label>
            <select
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="gpt-4o">GPT-4o (Premium Balanced)</option>
              <option value="gpt-3.5-turbo">GPT-3.5-Turbo (Fast/Light)</option>
              <option value="gpt-4-turbo">GPT-4-Turbo</option>
              <option value="gpt-5">GPT-5 (Future Ready)</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all"
          >
            Save Credentials
          </button>
        </form>
      </motion.div>

      {/* 4. Brand settings & Customizing portal */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60 space-y-5"
      >
        <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FiBriefcase className="text-primary" /> Branding Customization
        </h3>
        
        <form onSubmit={handleSaveBranding} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Brand Icon/Emoji</label>
            <input
              type="text"
              value={logoInput}
              onChange={(e) => setLogoInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-850 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 font-sans">Toggle Portal Theme</label>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-850 hover:bg-slate-150 dark:hover:bg-slate-800 text-xs font-semibold"
            >
              <span>{isDarkMode ? 'Dark Theme' : 'Light Theme'}</span>
              {isDarkMode ? <FiMoon className="text-indigo-400" /> : <FiSun className="text-amber-500" />}
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all"
          >
            Save Brand Variables
          </button>
        </form>
      </motion.div>

    </div>
  );
};

export default Settings;
