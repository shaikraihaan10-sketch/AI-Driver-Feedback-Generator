import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, FiUsers, FiTruck, FiDownload, FiUpload, 
  FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiMapPin, FiStar
} from 'react-icons/fi';

const AdminPanel = () => {
  const { apiBaseUrl } = useAuth();
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers', 'managers', 'database'
  const [loading, setLoading] = useState(false);

  // Data lists
  const [drivers, setDrivers] = useState([]);
  const [managers, setManagers] = useState([]);

  // Driver CRUD modal states
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null); // null for create, driver object for edit
  const [driverForm, setDriverForm] = useState({
    driverId: '',
    name: '',
    vehicleNumber: '',
    route: '',
    rating: '5.0'
  });

  useEffect(() => {
    fetchDrivers();
    fetchManagers();
  }, [apiBaseUrl]);

  // --- FETCH DATA ---
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}/drivers`);
      setDrivers(res.data);
    } catch (err) {
      showToast('Error loading drivers directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/auth/managers`);
      setManagers(res.data);
    } catch (err) {
      console.log('Not an admin or manager load failed.');
    }
  };

  // --- DRIVER ACTIONS ---
  const openDriverCreate = () => {
    setEditingDriver(null);
    setDriverForm({
      driverId: '',
      name: '',
      vehicleNumber: '',
      route: '',
      rating: '5.0'
    });
    setShowDriverModal(true);
  };

  const openDriverEdit = (drv) => {
    setEditingDriver(drv);
    setDriverForm({
      driverId: drv.driverId,
      name: drv.name,
      vehicleNumber: drv.vehicleNumber,
      route: drv.route,
      rating: drv.rating.toString()
    });
    setShowDriverModal(true);
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    const { driverId, name, vehicleNumber, route, rating } = driverForm;

    if (!driverId || !name || !vehicleNumber || !route) {
      showToast('Please fill out all driver fields.', 'warning');
      return;
    }

    try {
      if (editingDriver) {
        // Update
        await axios.put(`${apiBaseUrl}/drivers/${editingDriver._id}`, {
          name, vehicleNumber, route, rating: Number(rating)
        });
        showToast('Driver profile updated successfully.', 'success');
      } else {
        // Create
        await axios.post(`${apiBaseUrl}/drivers`, {
          driverId, name, vehicleNumber, route, rating: Number(rating)
        });
        showToast('New driver profile registered.', 'success');
      }
      setShowDriverModal(false);
      fetchDrivers();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to save driver details.';
      showToast(errMsg, 'error');
    }
  };

  const handleDriverDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this driver profile?')) {
      try {
        await axios.delete(`${apiBaseUrl}/drivers/${id}`);
        showToast('Driver profile deleted.', 'success');
        fetchDrivers();
      } catch (err) {
        showToast('Failed to delete driver.', 'error');
      }
    }
  };

  // --- MANAGER ACTIONS ---
  const handleManagerDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this manager account? They will lose dashboard access.')) {
      try {
        await axios.delete(`${apiBaseUrl}/auth/managers/${id}`);
        showToast('Manager account deleted successfully.', 'success');
        fetchManagers();
      } catch (err) {
        showToast('Failed to delete manager.', 'error');
      }
    }
  };

  // --- DATABASE BACKUP & RESTORE ---
  const triggerBackup = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/admin/backup`);
      const { backup } = res.data;

      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
      element.href = URL.createObjectURL(file);
      element.download = `Manivtha_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('Database backup file downloaded.', 'success');
    } catch (err) {
      showToast('Database backup failed.', 'error');
    }
  };

  const triggerRestore = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];

    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsedBackup = JSON.parse(event.target.result);
        
        if (window.confirm('WARNING: Restoring will overwrite existing driver profiles, manager history, and configurations. Proceed?')) {
          await axios.post(`${apiBaseUrl}/admin/restore`, { backup: parsedBackup });
          showToast('Database restored successfully! Reloading...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (error) {
        showToast('Invalid backup file formatting.', 'error');
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Tab Header Buttons */}
      <div className="glass-panel p-2 bg-white/70 dark:bg-slate-900/60 flex border-slate-200/40 dark:border-slate-800/40 w-fit">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5
            ${activeTab === 'drivers' 
              ? 'bg-primary text-white shadow-md shadow-primary/10' 
              : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
            }`}
        >
          <FiTruck /> Manage Drivers
        </button>
        <button
          onClick={() => setActiveTab('managers')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5
            ${activeTab === 'managers' 
              ? 'bg-primary text-white shadow-md shadow-primary/10' 
              : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
            }`}
        >
          <FiUsers /> Manage Managers
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5
            ${activeTab === 'database' 
              ? 'bg-primary text-white shadow-md shadow-primary/10' 
              : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
            }`}
        >
          <FiShield /> Database Backup
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* DRIVERS TAB */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            
            {/* Create Actions */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-slate-850 dark:text-white">Active Driver Registry</h3>
                <p className="text-xs text-slate-400">Manage vehicle details and standard routes for monthly review templates.</p>
              </div>
              <button
                onClick={openDriverCreate}
                className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-primary/10"
              >
                <FiPlus /> Register Driver
              </button>
            </div>

            {/* Drivers list */}
            <div className="glass-panel bg-white/70 dark:bg-slate-900/60 overflow-hidden border-slate-200/40 dark:border-slate-800/40">
              {loading ? (
                <div className="space-y-3 p-5">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-12 w-full skeleton-loading rounded-xl"></div>)}
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-sm font-medium">No drivers registered yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/40 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-450">
                        <th className="px-6 py-4">Driver Name</th>
                        <th className="px-6 py-4">Driver ID</th>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">Default Route</th>
                        <th className="px-6 py-4">Running Rating</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 dark:divide-slate-850">
                      {drivers.map((drv) => (
                        <tr key={drv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors text-xs text-slate-650 dark:text-slate-200">
                          <td className="px-6 py-4 font-bold text-slate-850 dark:text-white">{drv.name}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[10px]">{drv.driverId}</td>
                          <td className="px-6 py-4 font-semibold">{drv.vehicleNumber}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate">{drv.route}</td>
                          <td className="px-6 py-4 font-bold text-amber-500">⭐ {drv.rating.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openDriverEdit(drv)}
                                className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-primary transition-colors"
                                title="Edit Driver Details"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDriverDelete(drv._id)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                                title="Delete Driver"
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
            </div>
          </div>
        )}

        {/* MANAGERS TAB */}
        {activeTab === 'managers' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-850 dark:text-white">System Managers List</h3>
              <p className="text-xs text-slate-400">View and manage portal accounts. Manager deletion will restrict access immediately.</p>
            </div>

            <div className="glass-panel bg-white/70 dark:bg-slate-900/60 overflow-hidden border-slate-200/40 dark:border-slate-800/40">
              {managers.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-sm font-medium">No managers registered besides you.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/40 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-extrabold uppercase text-slate-450">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 dark:divide-slate-850">
                      {managers.map((m) => (
                        <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors text-xs text-slate-650 dark:text-slate-250">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{m.name}</td>
                          <td className="px-6 py-4">{m.email}</td>
                          <td className="px-6 py-4 capitalize font-semibold">{m.role}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleManagerDelete(m._id)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                              title="Delete Manager Account"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DATABASE BACKUP TAB */}
        {activeTab === 'database' && (
          <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60 max-w-xl space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-850 dark:text-white flex items-center gap-2">
                🔒 System Backup Utility
              </h3>
              <p className="text-xs text-slate-400 mt-1">Export or restore all driver records, manager accounts, and generated review history.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Backup Card */}
              <div className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FiDownload className="text-primary" /> Download Database Backup
                </div>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal">
                  Saves all system collections as a single JSON file. Helpful for local backups and migrations.
                </p>
                <button
                  onClick={triggerBackup}
                  className="w-full py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  Download Backup JSON
                </button>
              </div>

              {/* Restore Card */}
              <div className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FiUpload className="text-accent" /> Upload Database Backup
                </div>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal">
                  Select a previously downloaded backup JSON file to restore the database. Existing collections will be overwritten.
                </p>
                <label className="w-full py-2 bg-accent hover:bg-accent-dark text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer text-center">
                  Select Backup File
                  <input
                    type="file"
                    accept=".json"
                    onChange={triggerRestore}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* DRIVER ADD/EDIT MODAL */}
      <AnimatePresence>
        {showDriverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDriverModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-6 rounded-2xl z-10"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-extrabold text-base text-slate-850 dark:text-white">
                  {editingDriver ? 'Modify Driver Details' : 'Register New Driver Profile'}
                </h3>
                <button
                  onClick={() => setShowDriverModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDriverSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-350">Driver ID</label>
                  <input
                    type="text"
                    placeholder="DRV-106"
                    disabled={!!editingDriver}
                    value={driverForm.driverId}
                    onChange={(e) => setDriverForm({ ...driverForm, driverId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 disabled:opacity-50 text-xs text-slate-800 dark:text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Driver Full Name</label>
                  <input
                    type="text"
                    placeholder="Devendra Singh"
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Vehicle Plate Number</label>
                  <input
                    type="text"
                    placeholder="KA-01-MF-9901"
                    value={driverForm.vehicleNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicleNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Assigned Default Route</label>
                  <input
                    type="text"
                    placeholder="Bengaluru Shuttles (Local Route)"
                    value={driverForm.route}
                    onChange={(e) => setDriverForm({ ...driverForm, route: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Starting Rating (out of 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={driverForm.rating}
                    onChange={(e) => setDriverForm({ ...driverForm, rating: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                  >
                    {editingDriver ? 'Save Changes' : 'Register Driver Profile'}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminPanel;
