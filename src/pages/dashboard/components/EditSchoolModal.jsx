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
    supportedMediums: ['URDU', 'ENGLISH'],
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
        supportedMediums: school.supportedMediums && school.supportedMediums.length > 0 ? school.supportedMediums : ['URDU', 'ENGLISH'],
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
        supportedMediums: formData.supportedMediums && formData.supportedMediums.length > 0 ? formData.supportedMediums : ['URDU', 'ENGLISH'],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto animate-modal-backdrop">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 my-8 text-[#102033] animate-modal-card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[#4B7F3A]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#102033]">Edit Municipal School Record</h3>
              <p className="text-xs text-[#526477]">Update institutional attributes, civil details, and lifecycle status</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#102033] cursor-pointer transition"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Readonly Jurisdiction Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
            <div>
              <span className="text-[#526477] font-medium">Jurisdictional Town (Read-Only):</span>
              <p className="text-[#102033] font-semibold mt-0.5">
                {school.townId?.name || 'Liaquatabad Town Centre'} ({school.townId?.code || 'TOWN_LIAQ'})
              </p>
            </div>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-[#526477]">
              ID: {school._id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#526477]">School Official Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(inputChangeEvent) => setFormData({ ...formData, name: inputChangeEvent.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#526477]">School Code (Prefix for IDs)</label>
              <input
                type="text"
                value={formData.schoolCode}
                onChange={(inputChangeEvent) => setFormData({ ...formData, schoolCode: inputChangeEvent.target.value.toUpperCase() })}
                placeholder="e.g. MMHA, GGSS"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-[#006AC7] uppercase placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#526477]">EMIS Code</label>
              <input
                type="text"
                value={formData.emisCode}
                onChange={(inputChangeEvent) => setFormData({ ...formData, emisCode: inputChangeEvent.target.value })}
                placeholder="Provincial EMIS identifier"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#526477]">Lifecycle Status *</label>
              <select
                value={formData.status}
                onChange={(selectChangeEvent) => setFormData({ ...formData, status: selectChangeEvent.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] font-semibold focus:border-[#006AC7] focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Operational)</option>
                <option value="SUSPENDED">SUSPENDED (Temporarily Closed)</option>
                <option value="ARCHIVED">ARCHIVED (Soft-deleted / Inactive)</option>
                <option value="CLOSED">CLOSED (Permanently Decommissioned)</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#526477]">School Type *</label>
              <select
                value={formData.schoolType}
                onChange={(selectChangeEvent) => setFormData({ ...formData, schoolType: selectChangeEvent.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
              >
                <option value="ECE">ECE (Nursery - KG-2)</option>
                <option value="PRIMARY">PRIMARY (Grades KG-1 to 5)</option>
                <option value="MIDDLE">MIDDLE (Grades KG-1 to 8)</option>
                <option value="ELEMENTARY">ELEMENTARY (Grades KG-1 to 8)</option>
                <option value="SECONDARY">SECONDARY (Grades 6-10 / Matric)</option>
                <option value="HIGHER_SECONDARY">HIGHER_SECONDARY (Grades 11-12 / Inter)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#526477]">Gender Category *</label>
              <select
                value={formData.genderType}
                onChange={(selectChangeEvent) => setFormData({ ...formData, genderType: selectChangeEvent.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
              >
                <option value="BOYS">BOYS</option>
                <option value="GIRLS">GIRLS</option>
                <option value="CO_EDUCATION">CO-EDUCATION</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#526477] mb-1">Instruction Mediums Offered *</label>
              <div className="flex items-center gap-4 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                {[
                  { id: 'URDU', label: 'Urdu Medium' },
                  { id: 'ENGLISH', label: 'English Medium' },
                  { id: 'SINDHI', label: 'Sindhi Medium' },
                ].map((med) => {
                  const isChecked = formData.supportedMediums?.includes(med.id);
                  return (
                    <label key={med.id} className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(formData.supportedMediums || []), med.id]
                            : (formData.supportedMediums || []).filter((m) => m !== med.id);
                          setFormData({ ...formData, supportedMediums: next.length > 0 ? next : ['URDU'] });
                        }}
                        className="rounded border-slate-300 text-[#006AC7] focus:ring-[#006AC7]"
                      />
                      <span>{med.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#526477]">Contact Phone</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(inputChangeEvent) => setFormData({ ...formData, contactPhone: inputChangeEvent.target.value })}
                placeholder="e.g. 021-36612345"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#526477]">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(inputChangeEvent) => setFormData({ ...formData, contactEmail: inputChangeEvent.target.value })}
                placeholder="official@school.edu.pk"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#526477]">Institutional Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(inputChangeEvent) => setFormData({ ...formData, address: inputChangeEvent.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#526477]">Mandatory Justification / Reason *</label>
            <input
              type="text"
              required
              minLength={3}
              value={formData.reason}
              onChange={(inputChangeEvent) => setFormData({ ...formData, reason: inputChangeEvent.target.value })}
              placeholder="Reason logged to immutable audit stream"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-amber-700 placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-[#526477] hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[#4B7F3A] px-5 py-2 font-semibold text-white hover:bg-[#3d682f] transition shadow-sm cursor-pointer disabled:opacity-50"
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
