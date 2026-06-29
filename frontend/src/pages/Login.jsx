import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const { login, register } = useAuth();
  const showToast = useToast();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        if (!name) {
          showToast('Please enter your full name.', 'warning');
          setLoading(false);
          return;
        }
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      showToast('Authentication failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative p-4 bg-slate-900 overflow-hidden">
      {/* Dynamic Animated background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full filter blur-[120px] opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full filter blur-[120px] opacity-15 animate-pulse pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 glass-panel border border-slate-700/50 bg-slate-950/70 text-slate-100 relative z-10"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent items-center justify-center text-white text-3xl shadow-xl shadow-primary/20 mb-4 animate-bounce">
            🚌
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
            MANIVTHA TOURS
          </h2>
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-1">
            Driver Performance portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1.5"
            >
              <label className="text-xs font-bold text-slate-300">Manager Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rohan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-750 bg-slate-900/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors text-sm"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <FiMail />
              </span>
              <input
                type="email"
                placeholder="manager@manivtha.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-750 bg-slate-900/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300">Password</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => showToast('Password recovery is handled by IT support. Contact admin@manivtha.com', 'info')}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <FiLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-750 bg-slate-900/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors text-sm text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          {!isRegister && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary w-4 h-4"
                />
                Remember Me
              </label>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isRegister ? 'Register Account' : 'Log In'
            )}
          </button>
        </form>

        {/* Toggle sign in / register */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsRegister(false)} className="text-primary font-bold hover:underline">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New manager?{' '}
              <button onClick={() => setIsRegister(true)} className="text-primary font-bold hover:underline">
                Register here
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
