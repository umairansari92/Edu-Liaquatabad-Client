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

  // Handle School Registration
  const handleRegisterSubmit = async (submissionEvent) => {
    submissionEvent.preventDefault();
    if (!formData.name.trim() || !formData.schoolCode.trim()) {
      toast.error('School name and code are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/schools', {
        name: formData.name.trim(),
        schoolCode: formData.schoolCode.trim().toUpperCase(),
        emisCode: formData.emisCode.trim(),
        schoolType: formData.schoolType,
        genderType: formData.genderType,
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
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSchoolsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Register School</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
                placeholder="Search by school name, code, EMIS, or address..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={schoolTypeFilter}
              onChange={(selectChangeEvent) => setSchoolTypeFilter(selectChangeEvent.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="SECONDARY">Secondary</option>
              <option value="PRIMARY">Primary</option>
              <option value="ELEMENTARY">Elementary</option>
              <option value="HIGHER_SECONDARY">Higher Secondary</option>
            </select>

            <select
              value={schoolGenderFilter}
              onChange={(selectChangeEvent) => setSchoolGenderFilter(selectChangeEvent.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Orientations</option>
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
              <option value="CO_EDUCATION">Co-Education</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono text-right">
            Showing <span className="font-bold text-white">{filteredSchools.length}</span> of {schoolsList.length} institutions
          </div>
        </div>

        {/* Schools Cards Grid */}
        {isSchoolsLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-medium">Streaming municipal school directory...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-16 text-center text-slate-400">
            <Building2 className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">No Municipal Schools Found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              {searchQuery || schoolTypeFilter || schoolGenderFilter
                ? 'Try adjusting your search criteria or clear active filters.'
                : 'No schools are currently registered in Liaquatabad Town Centre. Register the first school to begin.'}
            </p>
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register New School</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSchools.map((school) => (
              <div
                key={school._id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg backdrop-blur-md transition hover:border-emerald-500/50 hover:bg-slate-900/90"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        {school.schoolType || 'SECONDARY'} • {school.genderType || 'CO-ED'}
                      </span>
                      <h4 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition line-clamp-1">
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
                        className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-950/60 hover:text-emerald-300 transition"
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
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                        title="Edit School Details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>School Code:</span>
                      <span className="font-mono font-bold text-amber-400">{school.schoolCode || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>SEMIS Code:</span>
                      <span className="font-mono text-cyan-400">{school.emisCode || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-emerald-400" />
                        Hours (Mon-Sat):
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {school.timings?.regular?.startTime || '08:00'} – {school.timings?.regular?.endTime || '13:30'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        Friday (Jummah):
                      </span>
                      <span className="font-mono text-cyan-400 font-semibold">
                        {school.timings?.friday?.startTime || '07:30'} – {school.timings?.friday?.endTime || '12:00'}
                      </span>
                    </div>
                    {school.contactPhone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span>{school.contactPhone}</span>
                      </div>
                    )}
                    {school.contactEmail && (
                      <div className="flex items-center gap-2 text-slate-400 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span className="truncate">{school.contactEmail}</span>
                      </div>
                    )}
                    {school.address && (
                      <div className="flex items-start gap-2 text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{school.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px]">
                  <span
                    className={`rounded px-2 py-0.5 font-bold ${
                      school.status === 'ACTIVE'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                        : 'bg-red-950/80 text-red-400 border border-red-800/50'
                    }`}
                  >
                    {school.status || 'ACTIVE'}
                  </span>
                  <span className="text-slate-500">Liaquatabad Town DMC</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Register School */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Register Municipal School</h3>
                    <p className="text-xs text-slate-400">Add institutional record to Liaquatabad Town registry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">School Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(inputChangeEvent) => setFormData({ ...formData, name: inputChangeEvent.target.value })}
                    placeholder="e.g. Government Boys Secondary School Liaquatabad No. 4"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">School Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.schoolCode}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, schoolCode: inputChangeEvent.target.value })}
                      placeholder="e.g. LQT-SEC-004"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">SEMIS / EMIS Code</label>
                    <input
                      type="text"
                      value={formData.emisCode}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, emisCode: inputChangeEvent.target.value })}
                      placeholder="e.g. 408010104"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Category *</label>
                    <select
                      value={formData.schoolType}
                      onChange={(selectChangeEvent) => setFormData({ ...formData, schoolType: selectChangeEvent.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="SECONDARY">Secondary</option>
                      <option value="PRIMARY">Primary</option>
                      <option value="ELEMENTARY">Elementary</option>
                      <option value="HIGHER_SECONDARY">Higher Secondary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Orientation *</label>
                    <select
                      value={formData.genderType}
                      onChange={(selectChangeEvent) => setFormData({ ...formData, genderType: selectChangeEvent.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="BOYS">Boys</option>
                      <option value="GIRLS">Girls</option>
                      <option value="CO_EDUCATION">Co-Education</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(inputChangeEvent) => setFormData({ ...formData, address: inputChangeEvent.target.value })}
                    placeholder="e.g. Block 4, Near Dak Khana, Liaquatabad, Karachi"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Contact Phone</label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, contactPhone: inputChangeEvent.target.value })}
                      placeholder="e.g. 021-99234567"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Official Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(inputChangeEvent) => setFormData({ ...formData, contactEmail: inputChangeEvent.target.value })}
                      placeholder="e.g. gbss4@schools.gov.pk"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
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
