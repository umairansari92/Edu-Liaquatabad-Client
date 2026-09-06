import React, { useState, useEffect } from 'react';
import { Building2, XCircle, Save, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient.js';

export const EditSchoolModal = ({ isOpen, onClose, school, onSchoolUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolCode: '',
    emisCode: '',
    schoolType: 'SECONDARY',
    genderType: 'BOYS',
    address: '',
    contactPhone: '',
    contactEmail: '',
    status: 'ACTIVE',
    reason: 'Municipal administrative update by Root Admin',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        schoolCode: school.schoolCode || '',
        emisCode: school.emisCode || '',
        schoolType: school.schoolType || 'SECONDARY',
        genderType: school.genderType || 'BOYS',
        address: school.address || '',
        contactPhone: school.contactPhone || '',
        contactEmail: school.contactEmail || '',
        status: school.status || 'ACTIVE',
        reason: 'Municipal administrative update by Root Admin',
      });
    }
  }, [school]);

  if (!isOpen || !school) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        schoolCode: formData.schoolCode ? formData.schoolCode.toUpperCase().trim() : undefined,
        emisCode: formData.emisCode ? formData.emisCode.trim() : undefined,
        schoolType: formData.schoolType,
        genderType: formData.genderType,
        address: formData.address.trim(),
        contactPhone: formData.contactPhone.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || '',
        status: formData.status,
        reason: formData.reason.trim() || 'Municipal administrative update by Root Admin',
      };

      const response = await apiClient.patch(`/schools/${school._id}`, payload);
      if (response.data?.success) {
        toast.success(`School "${formData.name}" updated successfully.`);
        if (onSchoolUpdated) onSchoolUpdated(response.data.data?.school);
        onClose();
      } else {
        toast.error(response.data?.message || 'Failed to update school record.');
      }
    } catch (error) {
      console.error('Error updating school:', error);
      toast.error(error.response?.data?.message || 'Server error while updating municipal school.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Edit Municipal School Record</h3>
              <p className="text-xs text-slate-400">Update institutional attributes, civil details, and lifecycle status</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer transition"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Readonly Jurisdiction Info */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">Jurisdictional Town (Read-Only):</span>
              <p className="text-white font-semibold mt-0.5">
                {school.townId?.name || 'Liaquatabad Town Centre'} ({school.townId?.code || 'TOWN_LIAQ'})
              </p>
            </div>
            <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-mono text-slate-400">
              ID: {school._id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300">School Official Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">School Code (Prefix for IDs)</label>
              <input
                type="text"
                value={formData.schoolCode}
                onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value.toUpperCase() })}
                placeholder="e.g. MMHA, GGSS"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-emerald-400 uppercase placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">EMIS Code</label>
              <input
                type="text"
                value={formData.emisCode}
                onChange={(e) => setFormData({ ...formData, emisCode: e.target.value })}
                placeholder="Provincial EMIS identifier"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Lifecycle Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-semibold focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Operational)</option>
                <option value="SUSPENDED">SUSPENDED (Temporarily Closed)</option>
                <option value="ARCHIVED">ARCHIVED (Soft-deleted / Inactive)</option>
                <option value="CLOSED">CLOSED (Permanently Decommissioned)</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300">School Type *</label>
              <select
                value={formData.schoolType}
                onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="PRIMARY">PRIMARY (Grades 1-5)</option>
                <option value="ELEMENTARY">ELEMENTARY (Grades 1-8)</option>
                <option value="SECONDARY">SECONDARY (Grades 6-10 / Matric)</option>
                <option value="HIGHER_SECONDARY">HIGHER_SECONDARY (Grades 11-12 / Inter)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Gender Category *</label>
              <select
                value={formData.genderType}
                onChange={(e) => setFormData({ ...formData, genderType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="BOYS">BOYS</option>
                <option value="GIRLS">GIRLS</option>
                <option value="CO_EDUCATION">CO-EDUCATION</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Contact Phone</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="e.g. 021-36612345"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="official@school.edu.pk"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300">Institutional Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300">Mandatory Justification / Reason *</label>
            <input
              type="text"
              required
              minLength={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason logged to immutable audit stream"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-amber-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500 transition shadow cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save School Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSchoolModal;
