import React, { useState, useEffect, useCallback } from 'react';
import {
  School as SchoolIcon,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Layers,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';
import EditSchoolModal from '../dashboard/components/EditSchoolModal.jsx';
import SchoolTimingsModal from './components/SchoolTimingsModal.jsx';

export const SchoolsPage = () => {
  const [schoolsList, setSchoolsList] = useState([]);
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('');
  const [schoolGenderFilter, setSchoolGenderFilter] = useState('');

  // Register School Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit School Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState(null);

  // School Timings Modal State
  const [isTimingsModalOpen, setIsTimingsModalOpen] = useState(false);
  const [selectedSchoolForTimings, setSelectedSchoolForTimings] = useState(null);

  // Fetch Municipal Schools
  const fetchSchools = useCallback(async () => {
    setIsSchoolsLoading(true);
    try {
      const response = await apiClient.get('/schools');
      if (response.data?.success) {
        setSchoolsList(response.data.data?.schools || response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load schools:', error);
      toast.error(error.response?.data?.message || 'Unable to retrieve municipal schools directory.');
    } finally {
      setIsSchoolsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Handle Form Submission
  const handleRegisterSchool = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!formData.name.trim()) {
      toast.error('School name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/schools', {
        name: formData.name.trim(),
        schoolCode: formData.schoolCode.toUpperCase().trim() || undefined,
        emisCode: formData.emisCode.trim() || undefined,
        schoolType: formData.schoolType,
        genderType: formData.genderType,
        supportedMediums: formData.supportedMediums && formData.supportedMediums.length > 0 ? formData.supportedMediums : ['URDU', 'ENGLISH'],
        address: formData.address.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactEmail: formData.contactEmail.trim().toLowerCase(),
      });
      if (response.data?.success) {
        toast.success(`School "${formData.name}" registered successfully.`);
        setIsRegisterModalOpen(false);
        setFormData({
          name: '',
          schoolCode: '',
          emisCode: '',
          schoolType: 'SECONDARY',
          genderType: 'BOYS',
          supportedMediums: ['URDU', 'ENGLISH'],
          address: '',
          contactPhone: '',
          contactEmail: '',
        });
        fetchSchools();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register school.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Schools
  const filteredSchools = schoolsList.filter((school) => {
    const searchNormalized = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      school.name?.toLowerCase().includes(searchNormalized) ||
      school.schoolCode?.toLowerCase().includes(searchNormalized) ||
      school.emisCode?.toLowerCase().includes(searchNormalized) ||
      school.address?.toLowerCase().includes(searchNormalized);

    const matchesType = !schoolTypeFilter || school.schoolType === schoolTypeFilter;
    const matchesGender = !schoolGenderFilter || school.genderType === schoolGenderFilter;

    return matchesQuery && matchesType && matchesGender;
  });

  return (
    <PageContainer
      title="Municipal Schools & Classes"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Municipal institution directory, EMIS records, and academic infrastructure"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSchools}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSchoolsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#00529B] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Register School</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
                placeholder="Search by school name, code, EMIS, or address..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
              />
            </div>

            <select
              value={schoolTypeFilter}
              onChange={(selectChangeEvent) => setSchoolTypeFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="ECE">ECE (Nursery - KG-2)</option>
              <option value="PRIMARY">Primary (KG-1 - 5th)</option>
              <option value="ELEMENTARY">Elementary (KG-1 - 8th)</option>
              <option value="SECONDARY">Secondary (6th - 10th)</option>
            </select>

            <select
              value={schoolGenderFilter}
              onChange={(selectChangeEvent) => setSchoolGenderFilter(selectChangeEvent.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-[#526477] focus:border-[#006AC7] focus:bg-white focus:outline-none"
            >
              <option value="">All Orientations</option>
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
              <option value="CO_EDUCATION">Co-Education</option>
            </select>
          </div>

          <div className="text-xs text-[#526477] font-medium text-right">
            Showing <span className="font-bold text-[#102033]">{filteredSchools.length}</span> of {schoolsList.length} institutions
          </div>
        </div>

        {/* Schools Cards Grid */}
        {isSchoolsLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-16 text-[#526477] shadow-sm">
            <RefreshCw className="h-8 w-8 animate-spin text-[#006AC7] mb-3" />
            <p className="text-sm font-medium">Streaming municipal school directory...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-16 text-center text-[#526477] shadow-sm">
            <Building2 className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-[#102033]">No Municipal Schools Found</h3>
            <p className="mt-1 max-w-sm text-xs text-[#526477]">
              {searchQuery || schoolTypeFilter || schoolGenderFilter
                ? 'Try adjusting your search criteria or clear active filters.'
                : 'No schools are currently registered in Liaquatabad Town Centre. Register the first school to begin.'}
            </p>
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#00529B] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register New School</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredSchools.map((school) => (
              <div
                key={school._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-[#006AC7]/40 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#006AC7] border border-blue-100">
                        {school.schoolType || 'SECONDARY'} • {school.genderType || 'CO-ED'}
                      </span>
                      <h4 className="text-base font-bold text-[#102033] group-hover:text-[#006AC7] transition line-clamp-1">
                        {school.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolForTimings(school);
                          setIsTimingsModalOpen(true);
                        }}
                        className="rounded-xl p-2 text-[#006AC7] hover:bg-blue-50 transition"
                        title="Configure Operational Timings & Windows"
                      >
                        <Clock className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolForEdit(school);
                          setIsEditModalOpen(true);
                        }}
                        className="rounded-xl p-2 text-slate-400 hover:text-[#102033] hover:bg-slate-100 transition"
                        title="Edit School Details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-[#526477]">
                    <div className="flex items-center justify-between">
                      <span>School Code:</span>
                      <span className="font-mono font-bold text-[#102033]">{school.schoolCode || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SEMIS Code:</span>
                      <span className="font-mono font-bold text-[#006AC7]">{school.emisCode || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-[#4B7F3A]" />
                        Hours (Mon-Sat):
                      </span>
                      <span className="font-mono text-[#4B7F3A] font-bold">
                        {school.timings?.regular?.startTime || '08:00'} – {school.timings?.regular?.endTime || '13:30'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-[#006AC7]" />
                        Friday (Jummah):
                      </span>
                      <span className="font-mono text-[#006AC7] font-bold">
                        {school.timings?.friday?.startTime || '07:30'} – {school.timings?.friday?.endTime || '12:00'}
                      </span>
                    </div>
                    {school.contactPhone && (
                      <div className="flex items-center gap-2 text-[#526477]">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{school.contactPhone}</span>
                      </div>
                    )}
                    {school.contactEmail && (
                      <div className="flex items-center gap-2 text-[#526477] truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{school.contactEmail}</span>
                      </div>
                    )}
                    {school.address && (
                      <div className="flex items-start gap-2 text-[#526477]">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{school.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold border ${
                      school.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {school.status || 'ACTIVE'}
                  </span>
                  <span className="text-[#8094A8] font-medium">Liaquatabad Town DMC</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Register School */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-[#006AC7]">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#102033]">Register Municipal School</h3>
                    <p className="text-xs text-[#526477]">Add institutional record to Liaquatabad Town registry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#526477]">School Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(inputChangeEvent) => setFormData({ ...formData, name: inputChangeEvent.target.value })}
                    placeholder="e.g. Government Boys Secondary School Liaquatabad No. 4"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">School Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.schoolCode}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, schoolCode: inputChangeEvent.target.value })}
                      placeholder="e.g. LQT-SEC-004"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] uppercase focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">SEMIS / EMIS Code</label>
                    <input
                      type="text"
                      value={formData.emisCode}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, emisCode: inputChangeEvent.target.value })}
                      placeholder="e.g. 408010104"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Category *</label>
                    <select
                      value={formData.schoolType}
                      onChange={(selectChangeEvent) => setFormData({ ...formData, schoolType: selectChangeEvent.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none"
                    >
                      <option value="ECE">Early Childhood Education (ECE: Nursery - KG-2)</option>
                      <option value="PRIMARY">Primary (KG-1 - 5th)</option>
                      <option value="ELEMENTARY">Elementary (KG-1 - 8th)</option>
                      <option value="SECONDARY">Secondary (6th - 10th)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Orientation *</label>
                    <select
                      value={formData.genderType}
                      onChange={(selectChangeEvent) => setFormData({ ...formData, genderType: selectChangeEvent.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none"
                    >
                      <option value="BOYS">Boys</option>
                      <option value="GIRLS">Girls</option>
                      <option value="CO_EDUCATION">Co-Education</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526477] mb-1.5">Instruction Mediums Offered *</label>
                  <div className="flex items-center gap-4 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    {[
                      { id: 'URDU', label: 'Urdu Medium (اردو)' },
                      { id: 'ENGLISH', label: 'English Medium (انگلش)' },
                      { id: 'SINDHI', label: 'Sindhi Medium (سنڌي)' },
                    ].map((med) => {
                      const isChecked = formData.supportedMediums?.includes(med.id);
                      return (
                        <label key={med.id} className="inline-flex items-center gap-1.5 text-xs text-[#102033] cursor-pointer font-medium">
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
                  <label className="block text-xs font-bold text-[#526477]">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(inputChangeEvent) => setFormData({ ...formData, address: inputChangeEvent.target.value })}
                    placeholder="e.g. Block 4, Near Dak Khana, Liaquatabad, Karachi"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Contact Phone</label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, contactPhone: inputChangeEvent.target.value })}
                      placeholder="e.g. 021-99234567"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#526477]">Official Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, contactEmail: inputChangeEvent.target.value })}
                      placeholder="e.g. gbss4@schools.gov.pk"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#102033] focus:border-[#006AC7] focus:outline-none focus:ring-1 focus:ring-[#006AC7]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-[#526477] hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-[#006AC7] px-4 py-2 text-xs font-bold text-white hover:bg-[#00529B] disabled:opacity-50 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? 'Registering...' : 'Confirm Registration'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit School */}
        <EditSchoolModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          school={selectedSchoolForEdit}
          onSchoolUpdated={fetchSchools}
        />

        {/* Modal: School Timings & Windows */}
        <SchoolTimingsModal
          isOpen={isTimingsModalOpen}
          onClose={() => setIsTimingsModalOpen(false)}
          school={selectedSchoolForTimings}
          onTimingsUpdated={fetchSchools}
        />
      </div>
    </PageContainer>
  );
};

export default SchoolsPage;
