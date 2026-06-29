import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  FiSearch, FiCalendar, FiTrash2, FiEye, FiDownload, 
  FiX, FiChevronLeft, FiChevronRight, FiCheckCircle, FiCopy, FiPrinter
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

const History = ({ selectedFeedbackId, setSelectedFeedbackId }) => {
  const { apiBaseUrl } = useAuth();
  const showToast = useToast();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected feedback for viewing modal
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch history list
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${apiBaseUrl}/feedback/history?page=${currentPage}&limit=8&search=${search}&month=${month}`
      );
      setFeedbacks(res.data.data);
      setTotalPages(res.data.pagination.pages);
      setTotalCount(res.data.pagination.total);
    } catch (err) {
      console.error('Error fetching history logs:', err);
      showToast('Error loading history logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [apiBaseUrl, currentPage, search, month]);

  // Handle viewing specific ID redirect from dashboard
  useEffect(() => {
    const fetchAndOpenFeedback = async () => {
      if (selectedFeedbackId) {
        try {
          const res = await axios.get(`${apiBaseUrl}/feedback/history/${selectedFeedbackId}`);
          setActiveFeedback(res.data);
          setShowModal(true);
        } catch (err) {
          console.error(err);
          showToast('Could not load target script.', 'error');
        } finally {
          setSelectedFeedbackId(null); // Clear once processed
        }
      }
    };
    fetchAndOpenFeedback();
  }, [selectedFeedbackId, apiBaseUrl, setSelectedFeedbackId]);

  // Delete feedback item
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this feedback script from history?')) {
      try {
        await axios.delete(`${apiBaseUrl}/feedback/history/${id}`);
        showToast('Feedback log deleted successfully.', 'success');
        
        // Refresh list
        if (feedbacks.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchHistory();
        }
      } catch (err) {
        showToast('Failed to delete history record.', 'error');
      }
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Script copied to clipboard!', 'success');
  };

  // Exporters
  const handleDownloadTxt = (fb) => {
    const element = document.createElement("a");
    const file = new Blob([fb.aiFeedbackScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Feedback_${fb.driverName.replace(/\s+/g, '_')}_${fb.reviewMonth.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Downloaded TXT file.', 'success');
  };

  const handleDownloadPdf = (fb) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("Outfit", "bold");
    doc.text("MANIVTHA TOURS & TRAVELS", 14, 20);
    doc.setFontSize(11);
    doc.setFont("Inter", "normal");
    doc.text("Driver Performance Feedback Talking Script", 14, 26);
    doc.line(14, 30, 196, 30);

    doc.setFont("Inter", "bold");
    doc.text(`Driver: ${fb.driverName} (${fb.driverId})`, 14, 38);
    doc.text(`Review Month: ${fb.reviewMonth}`, 14, 44);
    doc.text(`Route: ${fb.route} | Vehicle: ${fb.vehicleNumber}`, 14, 50);
    doc.line(14, 54, 196, 54);

    doc.setFont("Inter", "normal");
    doc.setFontSize(9.5);
    const splitText = doc.splitTextToSize(fb.aiFeedbackScript, 180);
    
    let y = 62;
    splitText.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    });

    doc.save(`Feedback_${fb.driverName.replace(/\s+/g, '_')}_${fb.reviewMonth.replace(/\s+/g, '_')}.pdf`);
    showToast('Downloaded PDF file.', 'success');
  };

  const monthsList = [
    'January 2026', 'February 2026', 'March 2026', 'April 2026',
    'May 2026', 'June 2026', 'July 2026', 'August 2026'
  ];

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Header */}
      <div className="glass-panel p-4 md:p-5 bg-white/70 dark:bg-slate-900/60 flex flex-col md:flex-row gap-4 items-center justify-between border-slate-200/40 dark:border-slate-800/40">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 dark:text-slate-500">
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search driver name or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-800 dark:text-white"
          />
        </div>

        {/* Filter Month */}
        <div className="relative w-full md:w-56">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 dark:text-slate-500">
            <FiCalendar className="w-4 h-4" />
          </span>
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 focus:border-primary focus:outline-none text-xs text-slate-800 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">All Review Months</option>
            {monthsList.map((m, idx) => (
              <option key={idx} value={m}>{m}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Table List */}
      <div className="glass-panel bg-white/70 dark:bg-slate-900/60 overflow-hidden border-slate-200/40 dark:border-slate-800/40">
        {loading ? (
          <div className="space-y-4 p-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 w-full glass-panel skeleton-loading"></div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📂</span>
            <h4 className="font-bold text-slate-800 dark:text-white text-base">No history records found</h4>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search term or select another review month filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/40 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-extrabold uppercase text-slate-450 dark:text-slate-400">
                  <th className="px-6 py-4">Driver Details</th>
                  <th className="px-6 py-4">Review Month</th>
                  <th className="px-6 py-4">On-Time %</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Generated By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/30 dark:divide-slate-850">
                {feedbacks.map((fb) => (
                  <tr key={fb._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-xs text-slate-650 dark:text-slate-200">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-extrabold text-slate-800 dark:text-white text-sm">{fb.driverName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{fb.driverId} • {fb.vehicleNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{fb.reviewMonth}</td>
                    <td className="px-6 py-4 font-bold">{fb.onTimePercentage}%</td>
                    <td className="px-6 py-4 font-bold text-amber-500">⭐ {fb.customerRating.toFixed(1)}</td>
                    <td className="px-6 py-4 text-slate-450 dark:text-slate-400">{fb.managerName}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setActiveFeedback(fb);
                            setShowModal(true);
                          }}
                          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                          title="Open Script Viewer"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(fb)}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Download PDF File"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fb._id)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                          title="Delete Generation Log"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200/40 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Showing page <span className="font-semibold text-slate-500 dark:text-slate-200">{currentPage}</span> of {totalPages} ({totalCount} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-250 dark:border-slate-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-250 dark:border-slate-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SCRIPT PREVIEW MODAL */}
      <AnimatePresence>
        {showModal && activeFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Modal Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl glass-panel bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden rounded-2xl flex flex-col max-h-[85vh] z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200/40 dark:border-slate-850 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-850 dark:text-white">
                    Driver Performance Script
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Driver: {activeFeedback.driverName} ({activeFeedback.driverId}) • Month: {activeFeedback.reviewMonth}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-700 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 text-slate-700 dark:text-slate-200 prose dark:prose-invert max-w-none text-sm leading-relaxed">
                {/* Visual Metadata Summary Block */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 mb-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Assigned Route</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200 truncate block mt-0.5">{activeFeedback.route}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Vehicle number</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200 mt-0.5 block">{activeFeedback.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">On-time delivery</span>
                    <span className="font-extrabold text-slate-750 dark:text-slate-200 mt-0.5 block">{activeFeedback.onTimePercentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Customer score</span>
                    <span className="font-extrabold text-amber-500 mt-0.5 block">⭐ {activeFeedback.customerRating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="whitespace-pre-wrap font-sans font-medium">
                  {activeFeedback.aiFeedbackScript}
                </div>
              </div>

              {/* Footer Control Panel */}
              <div className="p-4 border-t border-slate-200/40 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => handleCopy(activeFeedback.aiFeedbackScript)}
                  className="px-4 py-2 rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FiCopy /> Copy Text
                </button>
                <button
                  onClick={() => handleDownloadTxt(activeFeedback)}
                  className="px-4 py-2 rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FiDownload /> TXT
                </button>
                <button
                  onClick={() => handleDownloadPdf(activeFeedback)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FiDownload /> PDF
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default History;
