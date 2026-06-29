import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiTruck, FiMapPin, FiCalendar, FiArrowRight, FiArrowLeft,
  FiZap, FiTrash2, FiMic, FiMicOff, FiCopy, FiDownload, FiPrinter,
  FiShare2, FiRefreshCw, FiStar, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const GenerateFeedback = () => {
  const { user, apiBaseUrl } = useAuth();
  const showToast = useToast();

  // Wizard steps: 1 = Profile, 2 = KPIs, 3 = Notes, 4 = Result
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [drivers, setDrivers] = useState([]);
  const [recentDrivers, setRecentDrivers] = useState([]);
  
  // Form Fields
  const [formData, setFormData] = useState({
    managerName: user?.name || '',
    driverName: '',
    driverId: '',
    reviewMonth: '',
    vehicleNumber: '',
    route: '',
    tripsCompleted: '',
    tripsDelayed: '',
    onTimePercentage: '',
    customerRating: '',
    fuelEfficiency: '',
    attendance: '',
    safetyViolations: '0',
    complaints: '0',
    positiveFeedback: '',
    managerNotes: '',
    strengths: '',
    areasOfConcern: '',
    additionalRemarks: ''
  });

  // AI Output Result
  const [aiOutput, setAiOutput] = useState(null); // stores { _id, aiFeedbackScript }
  const [warningMessage, setWarningMessage] = useState(null);
  
  // Output rating state
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [isRated, setIsRated] = useState(false);

  // Speech-to-text state
  const [isListeningNotes, setIsListeningNotes] = useState(false);
  const recognitionRef = useRef(null);
  const resultRef = useRef(null);

  // Load registered drivers on mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/drivers`);
        setDrivers(res.data);
      } catch (err) {
        console.error('Error fetching driver directory:', err);
      }
    };
    fetchDrivers();

    // Set default review month to current month
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const d = new Date();
    const currentMonthYear = `${months[d.getMonth()]} ${d.getFullYear()}`;
    setFormData(prev => ({ ...prev, reviewMonth: currentMonthYear }));

    // Load auto-save draft if available
    const savedDraft = localStorage.getItem('driver_review_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
        showToast('Restored draft from auto-save.', 'info');
      } catch (e) {
        localStorage.removeItem('driver_review_draft');
      }
    }
  }, [apiBaseUrl]);

  // Auto-save draft whenever form fields change
  useEffect(() => {
    if (step < 4) {
      localStorage.setItem('driver_review_draft', JSON.stringify(formData));
    }
  }, [formData, step]);

  // Auto-calculate on-time percentage
  useEffect(() => {
    const completed = parseInt(formData.tripsCompleted);
    const delayed = parseInt(formData.tripsDelayed);
    
    if (!isNaN(completed) && !isNaN(delayed) && completed > 0) {
      const percentage = Math.max(0, Math.min(100, Math.round(((completed - delayed) / completed) * 100)));
      setFormData(prev => ({ ...prev, onTimePercentage: percentage.toString() }));
    }
  }, [formData.tripsCompleted, formData.tripsDelayed]);

  // Driver autocomplete handler
  const handleSelectDriver = (drv) => {
    setFormData(prev => ({
      ...prev,
      driverName: drv.name,
      driverId: drv.driverId,
      vehicleNumber: drv.vehicleNumber,
      route: drv.route
    }));
    
    // Add to recent selection
    if (!recentDrivers.find(d => d._id === drv._id)) {
      setRecentDrivers(prev => [drv, ...prev].slice(0, 3));
    }
    showToast(`Loaded profile for ${drv.name}.`, 'success');
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + Enter to navigate next or generate
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (step === 3) {
          handleGenerate();
        } else if (step < 3) {
          setStep(prev => prev + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, formData]);

  // Speech Recognition hook-up
  const toggleSpeechNotes = () => {
    if (isListeningNotes) {
      recognitionRef.current?.stop();
      setIsListeningNotes(false);
      return;
    }

    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please use Chrome.', 'warning');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListeningNotes(true);
      showToast('Voice input active. Speak now...', 'info');
    };

    rec.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setFormData(prev => ({
        ...prev,
        managerNotes: prev.managerNotes ? `${prev.managerNotes} ${transcript}` : transcript
      }));
    };

    rec.onerror = (e) => {
      console.error('Speech error', e);
      setIsListeningNotes(false);
    };

    rec.onend = () => {
      setIsListeningNotes(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Validation before submission
  const validateForm = () => {
    const { 
      managerName, driverName, driverId, reviewMonth, vehicleNumber, route,
      tripsCompleted, tripsDelayed, onTimePercentage, customerRating,
      fuelEfficiency, attendance, safetyViolations, complaints
    } = formData;

    if (!managerName || !driverName || !driverId || !reviewMonth || !vehicleNumber || !route) {
      showToast('Step 1 Profile details are incomplete.', 'warning');
      setStep(1);
      return false;
    }

    if (
      tripsCompleted === '' || tripsDelayed === '' || onTimePercentage === '' ||
      customerRating === '' || fuelEfficiency === '' || attendance === '' ||
      safetyViolations === '' || complaints === ''
    ) {
      showToast('Step 2 Performance KPIs are incomplete.', 'warning');
      setStep(2);
      return false;
    }

    // Number validation checks
    if (isNaN(tripsCompleted) || isNaN(tripsDelayed) || isNaN(onTimePercentage) || isNaN(customerRating) || isNaN(fuelEfficiency) || isNaN(attendance) || isNaN(safetyViolations) || isNaN(complaints)) {
      showToast('KPI inputs must be numeric.', 'warning');
      setStep(2);
      return false;
    }

    return true;
  };

  // Submit and Generate Feedback via OpenAI
  const handleGenerate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGenerationProgress(10);
    setStep(4);
    
    // Simulate progression bar
    const progressTimer = setInterval(() => {
      setGenerationProgress(p => {
        if (p >= 90) {
          clearInterval(progressTimer);
          return p;
        }
        return p + 15;
      });
    }, 800);

    try {
      // Retrieve key and model from local settings overrides if configured
      const settingsKey = localStorage.getItem('user_openai_api_key') || '';
      const settingsModel = localStorage.getItem('user_openai_model') || 'gpt-4o';

      const res = await axios.post(`${apiBaseUrl}/feedback/generate-feedback`, {
        ...formData,
        apiKey: settingsKey,
        model: settingsModel
      });

      setGenerationProgress(100);
      setAiOutput(res.data.feedback);
      setWarningMessage(res.data.warning);
      
      // Reset rating states
      setIsRated(false);
      setRating(0);
      setRatingFeedback('');
      
      // Clear draft on success
      localStorage.removeItem('driver_review_draft');
      showToast('Feedback script generated successfully!', 'success');

      // Autoscroll to target
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (err) {
      console.error(err);
      const errText = err.response?.data?.error || 'Failed to generate AI feedback script.';
      showToast(errText, 'error');
      setStep(3); // Go back to notes
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all form fields? This will delete the draft.')) {
      setFormData({
        managerName: user?.name || '',
        driverName: '',
        driverId: '',
        reviewMonth: formData.reviewMonth, // retain month
        vehicleNumber: '',
        route: '',
        tripsCompleted: '',
        tripsDelayed: '',
        onTimePercentage: '',
        customerRating: '',
        fuelEfficiency: '',
        attendance: '',
        safetyViolations: '0',
        complaints: '0',
        positiveFeedback: '',
        managerNotes: '',
        strengths: '',
        areasOfConcern: '',
        additionalRemarks: ''
      });
      localStorage.removeItem('driver_review_draft');
      showToast('Form fields cleared.', 'info');
      setStep(1);
    }
  };

  // Export Actions
  const handleCopy = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput.aiFeedbackScript);
    showToast('Feedback script copied to clipboard!', 'success');
  };

  const handleDownloadTxt = () => {
    if (!aiOutput) return;
    const element = document.createElement("a");
    const file = new Blob([aiOutput.aiFeedbackScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Feedback_${formData.driverName.replace(/\s+/g, '_')}_${formData.reviewMonth.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Downloaded as TXT file.', 'success');
  };

  const handleDownloadPdf = () => {
    if (!aiOutput) return;
    const doc = new jsPDF();
    
    doc.setFont("Outfit", "bold");
    doc.setFontSize(18);
    doc.text("MANIVTHA TOURS & TRAVELS", 14, 20);
    doc.setFontSize(12);
    doc.setFont("Inter", "normal");
    doc.text("Driver Review Meeting Feedback Script", 14, 28);
    doc.line(14, 32, 196, 32);

    // Metadata
    doc.setFont("Inter", "bold");
    doc.text(`Driver: ${formData.driverName} (${formData.driverId})`, 14, 40);
    doc.text(`Review Month: ${formData.reviewMonth}`, 14, 46);
    doc.text(`Route: ${formData.route} | Vehicle: ${formData.vehicleNumber}`, 14, 52);
    doc.line(14, 56, 196, 56);

    // Split script into page bounds
    doc.setFont("Inter", "normal");
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(aiOutput.aiFeedbackScript, 180);
    
    let y = 64;
    splitText.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    });

    doc.save(`Feedback_${formData.driverName.replace(/\s+/g, '_')}.pdf`);
    showToast('Downloaded as PDF file.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Driver Feedback - ${formData.driverName}`,
        text: aiOutput?.aiFeedbackScript,
      })
      .then(() => showToast('Shared successfully.', 'success'))
      .catch((e) => console.log('Share canceled'));
    } else {
      showToast('Sharing not supported on this browser/platform. Try Copying.', 'warning');
    }
  };

  // Submit Script Rating
  const submitRating = async () => {
    if (rating === 0) {
      showToast('Please select star rating count.', 'warning');
      return;
    }

    try {
      await axios.post(`${apiBaseUrl}/feedback/rating/${aiOutput._id}`, {
        rating,
        ratingFeedback
      });
      setIsRated(true);
      showToast('Thank you for rating this script!', 'success');
    } catch (err) {
      showToast('Failed to save rating.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Wizard Progress Stepper */}
      {step < 4 && (
        <div className="glass-panel p-4 bg-white/70 dark:bg-slate-900/60 flex items-center justify-between border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-1.5 md:gap-4 flex-1">
            
            {/* Step 1 */}
            <button 
              onClick={() => setStep(1)} 
              className={`flex items-center gap-2 text-xs font-extrabold ${step >= 1 ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 font-bold ${step >= 1 ? 'border-primary bg-primary/10' : 'border-slate-350'}`}>1</span>
              <span className="hidden sm:inline">Profile</span>
            </button>
            <div className={`h-0.5 flex-1 border-t-2 border-dashed ${step > 1 ? 'border-primary' : 'border-slate-250 dark:border-slate-800'}`}></div>
            
            {/* Step 2 */}
            <button 
              onClick={() => step >= 2 && setStep(2)} 
              disabled={step < 2}
              className={`flex items-center gap-2 text-xs font-extrabold ${step >= 2 ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 font-bold ${step >= 2 ? 'border-primary bg-primary/10' : 'border-slate-350'}`}>2</span>
              <span className="hidden sm:inline">Numerical KPIs</span>
            </button>
            <div className={`h-0.5 flex-1 border-t-2 border-dashed ${step > 2 ? 'border-primary' : 'border-slate-250 dark:border-slate-800'}`}></div>

            {/* Step 3 */}
            <button 
              onClick={() => step >= 3 && setStep(3)} 
              disabled={step < 3}
              className={`flex items-center gap-2 text-xs font-extrabold ${step >= 3 ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 font-bold ${step >= 3 ? 'border-primary bg-primary/10' : 'border-slate-350'}`}>3</span>
              <span className="hidden sm:inline">Observations</span>
            </button>

          </div>
          
          <button 
            onClick={handleClear}
            className="ml-6 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Clear Form Draft"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Form Steps */}
      <AnimatePresence mode="wait">
        
        {/* STEP 1: DRIVER PROFILE & ROUTE */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-6 md:p-8 bg-white/70 dark:bg-slate-900/60 space-y-6"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
                <FiUser className="text-primary" />
                Step 1: Driver Profile details
              </h3>
              <p className="text-xs text-slate-400 mt-1">Select an active driver to autocomplete details or enter manually.</p>
            </div>

            {/* Active Driver Quick Selection */}
            {drivers.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider">Quick Select Driver Profile</span>
                <div className="flex flex-wrap gap-2">
                  {drivers.map(drv => (
                    <button
                      key={drv._id}
                      type="button"
                      onClick={() => handleSelectDriver(drv)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 hover:border-primary/50 text-xs font-semibold text-slate-650 dark:text-slate-300 hover:text-primary transition-all active:scale-95"
                    >
                      {drv.name} ({drv.driverId})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Manager Name</label>
                <input
                  type="text"
                  placeholder="Rohan Sharma"
                  value={formData.managerName}
                  onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Driver Name</label>
                <input
                  type="text"
                  placeholder="Ramesh Kumar"
                  value={formData.driverName}
                  onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Driver ID</label>
                <input
                  type="text"
                  placeholder="DRV-101"
                  value={formData.driverId}
                  onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Review Month</label>
                <input
                  type="text"
                  placeholder="June 2026"
                  value={formData.reviewMonth}
                  onChange={(e) => setFormData({...formData, reviewMonth: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Vehicle Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 dark:text-slate-500">
                    <FiTruck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="KA-01-MF-7821"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Assigned Route</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 dark:text-slate-500">
                    <FiMapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Bengaluru - Mysore (National Highway)"
                    value={formData.route}
                    onChange={(e) => setFormData({...formData, route: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!formData.driverName || !formData.driverId || !formData.vehicleNumber || !formData.route) {
                    showToast('Please fill out all primary driver details.', 'warning');
                    return;
                  }
                  setStep(2);
                }}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center gap-1.5 shadow-lg shadow-primary/20"
              >
                Next Step <FiArrowRight />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: NUMERICAL KPI METRICS */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-6 md:p-8 bg-white/70 dark:bg-slate-900/60 space-y-6"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
                <FiZap className="text-accent" />
                Step 2: Monthly KPI performance numbers
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Please enter numerical scores for this driver's review month.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Trips Completed</label>
                <input
                  type="number"
                  placeholder="30"
                  value={formData.tripsCompleted}
                  onChange={(e) => setFormData({...formData, tripsCompleted: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Trips Delayed</label>
                <input
                  type="number"
                  placeholder="2"
                  value={formData.tripsDelayed}
                  onChange={(e) => setFormData({...formData, tripsDelayed: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">On-Time Percentage (%)</label>
                <input
                  type="number"
                  placeholder="93"
                  value={formData.onTimePercentage}
                  onChange={(e) => setFormData({...formData, onTimePercentage: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/35 dark:bg-slate-900/60 font-bold text-sm text-slate-850 dark:text-white focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Customer Rating (out of 5)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="4.6"
                  value={formData.customerRating}
                  onChange={(e) => setFormData({...formData, customerRating: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Fuel Efficiency (km/l)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="4.8"
                  value={formData.fuelEfficiency}
                  onChange={(e) => setFormData({...formData, fuelEfficiency: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Attendance Score (%)</label>
                <input
                  type="number"
                  placeholder="98"
                  value={formData.attendance}
                  onChange={(e) => setFormData({...formData, attendance: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Safety Violations</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.safetyViolations}
                  onChange={(e) => setFormData({...formData, safetyViolations: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Customer Complaints</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.complaints}
                  onChange={(e) => setFormData({...formData, complaints: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  required
                />
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold transition-all text-sm flex items-center gap-1.5 text-slate-650 dark:text-slate-300"
              >
                <FiArrowLeft /> Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const { tripsCompleted, tripsDelayed, customerRating, fuelEfficiency, attendance, safetyViolations, complaints } = formData;
                  if (tripsCompleted === '' || tripsDelayed === '' || customerRating === '' || fuelEfficiency === '' || attendance === '' || safetyViolations === '' || complaints === '') {
                    showToast('Please fill out all performance metrics.', 'warning');
                    return;
                  }
                  setStep(3);
                }}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center gap-1.5 shadow-lg shadow-primary/20"
              >
                Next Step <FiArrowRight />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: QUALITATIVE OBSERVATIONS */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-6 md:p-8 bg-white/70 dark:bg-slate-900/60 space-y-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
                  <FiFileText className="text-primary" />
                  Step 3: Manager Qualitative observations
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Provide qualitative strengths, concerns, or record dictation voice notes.</p>
              </div>
            </div>

            <div className="space-y-5">
              
              {/* Positive Customer Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Positive Customer Feedback (Optional)</label>
                <textarea
                  placeholder="Passengers commented that driver Ramesh was very helpful loading luggage and drove very smoothly."
                  rows={2}
                  value={formData.positiveFeedback}
                  onChange={(e) => setFormData({...formData, positiveFeedback: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white resize-y"
                />
              </div>

              {/* Manager Notes with Voice Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">Manager General Notes</label>
                  <button
                    type="button"
                    onClick={toggleSpeechNotes}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all
                      ${isListeningNotes 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                  >
                    {isListeningNotes ? <FiMicOff /> : <FiMic />}
                    {isListeningNotes ? 'Listening...' : 'Voice Dictate'}
                  </button>
                </div>
                <textarea
                  placeholder="Notes from riding along with Ramesh. He maintained speed limits carefully but got delayed by road works on highway."
                  rows={3}
                  value={formData.managerNotes}
                  onChange={(e) => setFormData({...formData, managerNotes: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Driver Core Strengths</label>
                  <input
                    type="text"
                    placeholder="Excellent safety record, good fuel rating, polite attitude"
                    value={formData.strengths}
                    onChange={(e) => setFormData({...formData, strengths: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Areas of Concern</label>
                  <input
                    type="text"
                    placeholder="3 trips delayed due to over-waiting at terminals"
                    value={formData.areasOfConcern}
                    onChange={(e) => setFormData({...formData, areasOfConcern: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                  />
                </div>

              </div>

              {/* Additional Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Additional Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="Needs encouragement. Ready for senior route placement next quarter."
                  value={formData.additionalRemarks}
                  onChange={(e) => setFormData({...formData, additionalRemarks: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none transition-colors text-sm text-slate-850 dark:text-white"
                />
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold transition-all text-sm flex items-center gap-1.5 text-slate-650 dark:text-slate-300"
              >
                <FiArrowLeft /> Back
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-7 py-3 bg-gradient-to-r from-primary to-accent hover:brightness-110 text-white font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <FiZap className="w-4 h-4 animate-bounce" /> Generate AI Feedback Script
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: AI OUTPUT SCRIPT DISPLAY & ACTIONS */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            ref={resultRef}
            className="space-y-6"
          >
            {/* Loading / Generating State */}
            {loading ? (
              <div className="glass-panel p-8 md:p-12 bg-white/70 dark:bg-slate-900/60 text-center space-y-6 flex flex-col items-center">
                
                {/* Loader Animation */}
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-250 dark:border-slate-800"></div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-t-primary border-r-accent border-transparent"
                  ></motion.div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
                </div>

                <div className="max-w-md">
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">AI Coach is drafting your Talking Script...</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-2 leading-relaxed">
                    Analyzing monthly trips, passenger feedback ratings, and manager ride-along logs to construct a constructive, motivational coaching meeting script.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-sm">
                  <div className="flex justify-between text-xs font-bold text-slate-450 mb-1">
                    <span>Processing details</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: '0%' }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    ></motion.div>
                  </div>
                </div>

                {/* Loader Skeletons */}
                <div className="w-full space-y-3 pt-6 border-t border-slate-200/40 dark:border-slate-800/40">
                  <div className="h-6 w-1/3 glass-panel skeleton-loading"></div>
                  <div className="h-4 w-full glass-panel skeleton-loading"></div>
                  <div className="h-4 w-5/6 glass-panel skeleton-loading"></div>
                  <div className="h-4 w-4/5 glass-panel skeleton-loading"></div>
                </div>

              </div>
            ) : (
              // AI Script Output Card
              <div className="space-y-6">
                
                {/* Warning message if offline fallback used */}
                {warningMessage && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs flex gap-2.5 items-start">
                    <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Offline Template Mode:</span> {warningMessage}
                    </div>
                  </div>
                )}

                <div className="glass-panel bg-white dark:bg-slate-900 overflow-hidden border-slate-200/50 dark:border-slate-800/50 shadow-xl">
                  
                  {/* Top Bar for Output Operations */}
                  <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20 flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">Generated Monthly Script</h4>
                      <p className="text-[10px] text-slate-400">Driver: {formData.driverName} • Month: {formData.reviewMonth}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all text-xs font-semibold flex items-center gap-1.5"
                        title="Copy Script Content"
                      >
                        <FiCopy /> Copy
                      </button>
                      
                      <button
                        onClick={handleDownloadPdf}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all text-xs font-semibold flex items-center gap-1.5"
                        title="Export to PDF"
                      >
                        <FiDownload /> PDF
                      </button>

                      <button
                        onClick={handleDownloadTxt}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all text-xs font-semibold flex items-center gap-1.5"
                        title="Export to Text File"
                      >
                        <FiDownload /> TXT
                      </button>

                      <button
                        onClick={handleShare}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all text-xs font-semibold flex items-center gap-1.5"
                        title="Share Content"
                      >
                        <FiShare2 /> Share
                      </button>

                      <button
                        onClick={handlePrint}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all text-xs font-semibold flex items-center gap-1.5"
                        title="Print Page"
                      >
                        <FiPrinter /> Print
                      </button>
                    </div>
                  </div>

                  {/* Rendered script display */}
                  <div className="p-6 md:p-8 text-slate-700 dark:text-slate-200 prose dark:prose-invert max-w-none text-sm leading-relaxed overflow-y-auto max-h-[500px]">
                    <div className="whitespace-pre-wrap font-sans font-medium">
                      {aiOutput?.aiFeedbackScript}
                    </div>
                  </div>
                </div>

                {/* Rate Output Action Card */}
                <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-sm text-slate-850 dark:text-white">Rate the script quality</h4>
                    <p className="text-xs text-slate-400">Help tune AI feedback algorithms for Manivtha Tours & Travels drivers.</p>
                    
                    {isRated ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold pt-2">
                        <FiCheck /> Rating submitted. Thanks for your support!
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 pt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="text-xl focus:outline-none transition-transform active:scale-125"
                          >
                            <FiStar className={star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-350 dark:text-slate-650'} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isRated && (
                    <div className="flex w-full md:w-auto items-center gap-3">
                      <input
                        type="text"
                        placeholder="Add feedback comment..."
                        value={ratingFeedback}
                        onChange={(e) => setRatingFeedback(e.target.value)}
                        className="flex-1 md:w-60 px-3.5 py-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-slate-850 dark:text-white"
                      />
                      <button
                        onClick={submitRating}
                        className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>

                {/* Regenerate or Back to Edit Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold transition-all text-xs text-slate-650 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <FiArrowLeft /> Edit Input Data
                  </button>

                  <button
                    onClick={handleGenerate}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition-all text-xs flex items-center gap-2"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" /> Re-Generate Script
                  </button>
                </div>

              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default GenerateFeedback;
