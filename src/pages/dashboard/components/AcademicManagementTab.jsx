import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Layers,
  BookOpen,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Search,
  School,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Users,
  ChevronRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient.js';

export const AcademicManagementTab = ({ schoolsList = [] }) => {
  // Cascading Selection State
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Active subtab: 'classes' | 'sections' | 'subjects'
  const [subTab, setSubTab] = useState('classes');

  // Data states
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search queries
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', code: '', gradeLevel: 1, schoolId: '' });

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ name: '', classId: '', capacity: 40, roomNumber: '' });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', schoolId: '', classId: '', isElective: false });

  // Initialize selected school if available
  useEffect(() => {
    if (schoolsList.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(schoolsList[0]._id);
    }
  }, [schoolsList, selectedSchoolId]);

  // Fetch Classes
  const fetchClasses = useCallback(async () => {
    if (!selectedSchoolId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/academic/classes?schoolId=${selectedSchoolId}`);
      if (response.data?.success) {
        setClasses(response.data.data?.classes || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSchoolId]);

  // Fetch Sections
  const fetchSections = useCallback(async () => {
    if (!selectedSchoolId) return;
    try {
      const url = selectedClassId 
        ? `/academic/sections?classId=${selectedClassId}`
        : `/academic/sections?schoolId=${selectedSchoolId}`;
      const response = await apiClient.get(url);
      if (response.data?.success) {
        setSections(response.data.data?.sections || []);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  }, [selectedSchoolId, selectedClassId]);

  // Fetch Subjects
  const fetchSubjects = useCallback(async () => {
    if (!selectedSchoolId) return;
    try {
      const url = selectedClassId
        ? `/academic/subjects?classId=${selectedClassId}`
        : `/academic/subjects?schoolId=${selectedSchoolId}`;
      const response = await apiClient.get(url);
      if (response.data?.success) {
        setSubjects(response.data.data?.subjects || []);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  }, [selectedSchoolId, selectedClassId]);

  // Reload when selection changes
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Handle Cascading School Change
  const handleSchoolChange = (newSchoolId) => {
    setSelectedSchoolId(newSchoolId);
    setSelectedClassId('');
    setSelectedSectionId('');
  };

  // Handle Cascading Class Change
  const handleClassChange = (newClassId) => {
    setSelectedClassId(newClassId);
    setSelectedSectionId('');
  };

  // --- Class Operations ---
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassForm({ name: '', code: '', gradeLevel: 1, schoolId: selectedSchoolId });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls) => {
    setEditingClass(cls);
    setClassForm({ name: cls.name, code: cls.code, gradeLevel: cls.gradeLevel, schoolId: cls.schoolId?._id || cls.schoolId });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (submitEvent) => {
    submitEvent.preventDefault();
    try {
      if (editingClass) {
        await apiClient.patch(`/academic/classes/${editingClass._id}`, classForm);
        toast.success(`Class ${classForm.name} updated successfully.`);
      } else {
        await apiClient.post('/academic/classes', { ...classForm, schoolId: selectedSchoolId });
        toast.success(`Class ${classForm.name} created successfully.`);
      }
      setIsClassModalOpen(false);
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save class.');
    }
  };

  const handleArchiveClass = async (cls) => {
    if (!window.confirm(`Are you sure you want to archive "${cls.name}"? This is a soft-delete.`)) return;
    try {
      await apiClient.patch(`/academic/classes/${cls._id}`, { status: 'ARCHIVED' });
      toast.success(`Class "${cls.name}" archived.`);
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive class.');
    }
  };

  // --- Section Operations ---
  const handleOpenCreateSection = () => {
    setEditingSection(null);
    setSectionForm({ name: '', classId: selectedClassId || (classes[0]?._id || ''), capacity: 40, roomNumber: '' });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec) => {
    setEditingSection(sec);
    setSectionForm({ name: sec.name, classId: sec.classId?._id || sec.classId, capacity: sec.capacity || 40, roomNumber: sec.roomNumber || '' });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (submitEvent) => {
    submitEvent.preventDefault();
    try {
      if (editingSection) {
        await apiClient.patch(`/academic/sections/${editingSection._id}`, sectionForm);
        toast.success(`Section ${sectionForm.name} updated successfully.`);
      } else {
        await apiClient.post('/academic/sections', sectionForm);
        toast.success(`Section ${sectionForm.name} created successfully.`);
      }
      setIsSectionModalOpen(false);
      fetchSections();
      fetchClasses(); // Update section count badge
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save section.');
    }
  };

  const handleArchiveSection = async (sec) => {
    if (!window.confirm(`Are you sure you want to archive section "${sec.name}"?`)) return;
    try {
      await apiClient.patch(`/academic/sections/${sec._id}`, { status: 'ARCHIVED' });
      toast.success(`Section "${sec.name}" archived.`);
      fetchSections();
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive section.');
    }
  };

  // --- Subject Operations ---
  const handleOpenCreateSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      name: '',
      code: '',
      schoolId: selectedSchoolId,
      classId: selectedClassId || '',
      isElective: false,
    });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub) => {
    setEditingSubject(sub);
    setSubjectForm({
      name: sub.name,
      code: sub.code,
      schoolId: sub.schoolId?._id || sub.schoolId,
      classId: sub.classId?._id || sub.classId || '',
      isElective: !!sub.isElective,
    });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (submitEvent) => {
    submitEvent.preventDefault();
    try {
      if (editingSubject) {
        await apiClient.patch(`/academic/subjects/${editingSubject._id}`, subjectForm);
        toast.success(`Subject ${subjectForm.name} updated successfully.`);
      } else {
        await apiClient.post('/academic/subjects', { ...subjectForm, schoolId: selectedSchoolId });
        toast.success(`Subject ${subjectForm.name} created successfully.`);
      }
      setIsSubjectModalOpen(false);
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subject.');
    }
  };

  const handleArchiveSubject = async (sub) => {
    if (!window.confirm(`Are you sure you want to archive subject "${sub.name}"?`)) return;
    try {
      await apiClient.patch(`/academic/subjects/${sub._id}`, { status: 'ARCHIVED' });
      toast.success(`Subject "${sub.name}" archived.`);
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive subject.');
    }
  };

  // Filter lists based on search
  const filteredClasses = classes.filter((classItem) =>
    classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSections = sections.filter((sectionItem) =>
    sectionItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sectionItem.roomNumber && sectionItem.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSubjects = subjects.filter((subjectItem) =>
    subjectItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subjectItem.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map of classes to section count
  const classSectionCounts = sections.reduce((acc, sec) => {
    const cid = sec.classId?._id || sec.classId;
    if (cid && sec.status !== 'ARCHIVED') {
      acc[cid] = (acc[cid] || 0) + 1;
    }
    return acc;
  }, {});

  const currentSchool = schoolsList.find((schoolItem) => schoolItem._id === selectedSchoolId);

  return (
    <div className="space-y-5">
      {/* Cascading Navigation Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#006AC7]" />
            <h3 className="text-sm font-bold text-[#102033]">Hierarchical Academic Control Matrix</h3>
          </div>
          <span className="text-xs text-[#006AC7] font-semibold">
            Cascading Scope: School → Class → Section
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. School Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#526477] mb-1">
              1. Select Municipal School
            </label>
            <select
              value={selectedSchoolId}
              onChange={(selectChangeEvent) => handleSchoolChange(selectChangeEvent.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:outline-none"
            >
              {schoolsList.map((school) => (
                <option key={school._id} value={school._id}>
                  {school.name} ({school.schoolCode || 'NO-CODE'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Class Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#526477] mb-1">
              2. Filter by Class (Optional)
            </label>
            <select
              value={selectedClassId}
              onChange={(selectChangeEvent) => handleClassChange(selectChangeEvent.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:outline-none"
            >
              <option value="">All Classes in School ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} (Grade {cls.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Section Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#526477] mb-1">
              3. Filter by Section (Optional)
            </label>
            <select
              value={selectedSectionId}
              onChange={(selectChangeEvent) => setSelectedSectionId(selectChangeEvent.target.value)}
              disabled={!selectedClassId}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#102033] focus:border-[#006AC7] focus:outline-none disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {sections
                .filter((sec) => !selectedClassId || (sec.classId?._id || sec.classId) === selectedClassId)
                .map((sec) => (
                  <option key={sec._id} value={sec._id}>
                    Section {sec.name} {sec.roomNumber ? `(Room: ${sec.roomNumber})` : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subtab Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        {/* Navigation Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('classes')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              subTab === 'classes'
                ? 'bg-[#006AC7] text-white shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-[#F0F8FF]'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Classes ({classes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('sections')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              subTab === 'sections'
                ? 'bg-[#006AC7] text-white shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-[#F0F8FF]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Sections ({sections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('subjects')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              subTab === 'subjects'
                ? 'bg-[#006AC7] text-white shadow-sm'
                : 'text-[#526477] hover:text-[#102033] hover:bg-[#F0F8FF]'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Subjects ({subjects.length})</span>
          </button>
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8094A8]" />
            <input
              type="text"
              placeholder={`Search ${subTab}...`}
              value={searchQuery}
              onChange={(inputChangeEvent) => setSearchQuery(inputChangeEvent.target.value)}
              className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-[#102033] placeholder-slate-400 focus:border-[#006AC7] focus:outline-none"
            />
          </div>

          {subTab === 'classes' && (
            <button
              type="button"
              onClick={handleOpenCreateClass}
              className="flex items-center gap-1.5 rounded-lg bg-[#006AC7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#00529B] transition shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Class</span>
            </button>
          )}

          {subTab === 'sections' && (
            <button
              type="button"
              onClick={handleOpenCreateSection}
              disabled={classes.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-[#006AC7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#00529B] transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Section</span>
            </button>
          )}

          {subTab === 'subjects' && (
            <button
              type="button"
              onClick={handleOpenCreateSubject}
              className="flex items-center gap-1.5 rounded-lg bg-[#006AC7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#00529B] transition shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Subject</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              fetchClasses();
              fetchSections();
              fetchSubjects();
            }}
            className="rounded-lg border border-slate-300 bg-white p-1.5 text-[#526477] hover:text-[#102033] hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Academic Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── TAB 1 CONTENT: CLASSES OVERVIEW ─── */}
      {subTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
              <GraduationCap className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-[#102033]">No classes found</p>
              <p className="text-xs text-[#8094A8] mt-1">
                {currentSchool ? `Add classes to ${currentSchool.name}` : 'Select a school to view classes'}
              </p>
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const secCount = classSectionCounts[cls._id] || 0;
              const isArchived = cls.status === 'ARCHIVED';

              return (
                <div
                  key={cls._id}
                  className={`rounded-xl border p-4 shadow-sm transition flex flex-col justify-between ${
                    isArchived
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : secCount === 0
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200/80 bg-white hover:shadow-md hover:border-blue-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold text-[#006AC7]">
                          {cls.code}
                        </span>
                        <span className="text-xs font-bold text-[#102033]">{cls.name}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isArchived
                            ? 'bg-slate-100 text-slate-600'
                            : cls.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {cls.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-[#526477]">
                      <div className="flex justify-between">
                        <span className="text-[#8094A8]">Grade Level:</span>
                        <span className="font-semibold text-[#102033]">Grade {cls.gradeLevel}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#8094A8]">Active Sections:</span>
                        {secCount === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <AlertCircle className="h-3 w-3" />
                            No Sections Assigned
                          </span>
                        ) : (
                          <span className="font-bold text-[#4B7F3A]">{secCount} Sections</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClassId(cls._id);
                        setSubTab('sections');
                      }}
                      className="text-[#006AC7] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      View Sections <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditClass(cls)}
                        className="rounded p-1.5 text-slate-500 hover:text-[#102033] hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Class"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {!isArchived && (
                        <button
                          type="button"
                          onClick={() => handleArchiveClass(cls)}
                          className="rounded p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          title="Archive Class (Soft Delete)"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 2 CONTENT: SECTIONS DIRECTORY ─── */}
      {subTab === 'sections' && (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-[#F0F8FF]/80 text-[11px] uppercase font-bold text-[#526477] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Section Name</th>
                <th className="px-4 py-3.5">Associated Class</th>
                <th className="px-4 py-3.5">Assigned Room</th>
                <th className="px-4 py-3.5">Student Capacity</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Layers className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-[#102033]">No sections found</p>
                    <p className="text-xs text-[#8094A8] mt-1">Create a new section for this class or school.</p>
                  </td>
                </tr>
              ) : (
                filteredSections.map((sec) => (
                  <tr key={sec._id} className="transition hover:bg-blue-50/40">
                    <td className="px-5 py-4 font-bold text-[#102033]">
                      Section {sec.name}
                    </td>
                    <td className="px-4 py-4 text-[#006AC7] font-medium">
                      {sec.classId?.name || 'Class Record'}
                    </td>
                    <td className="px-4 py-4 text-[#526477] font-mono">
                      {sec.roomNumber || 'Unspecified'}
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#4B7F3A]">
                      {sec.capacity || 40} Seats
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          sec.status === 'ARCHIVED'
                            ? 'bg-slate-100 text-slate-500'
                            : sec.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sec.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSection(sec)}
                          className="rounded p-1.5 text-slate-500 hover:text-[#102033] hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {sec.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleArchiveSection(sec)}
                            className="rounded p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 3 CONTENT: SUBJECTS DIRECTORY ─── */}
      {subTab === 'subjects' && (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-[#526477]">
            <thead className="border-b border-slate-200/80 bg-[#F0F8FF]/80 text-[11px] uppercase font-bold text-[#526477] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Subject Details</th>
                <th className="px-4 py-3.5">Course Code</th>
                <th className="px-4 py-3.5">Associated Class</th>
                <th className="px-4 py-3.5">Curriculum Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-[#102033]">No subjects registered</p>
                    <p className="text-xs text-[#8094A8] mt-1">Add courses to the municipal academic curriculum.</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => (
                  <tr key={sub._id} className="transition hover:bg-blue-50/40">
                    <td className="px-5 py-4 font-bold text-[#102033]">
                      {sub.name}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-[#006AC7]">
                      {sub.code}
                    </td>
                    <td className="px-4 py-4 text-[#526477]">
                      {sub.classId?.name || 'All Classes'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          sub.isElective
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-[#006AC7] border border-blue-200'
                        }`}
                      >
                        {sub.isElective ? 'Elective Course' : 'Core Compulsory'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          sub.status === 'ARCHIVED'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-[#4B7F3A] border border-emerald-200'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubject(sub)}
                          className="rounded p-1.5 text-slate-500 hover:text-[#102033] hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {sub.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleArchiveSubject(sub)}
                            className="rounded p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL: CREATE / EDIT CLASS --- */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-[#102033]">
                {editingClass ? 'Edit Academic Class' : 'Create New Academic Class'}
              </h4>
              <button
                type="button"
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-[#102033]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#526477]">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10, Grade 8, Kindergarten"
                  value={classForm.name}
                  onChange={(inputChangeEvent) => setClassForm({ ...classForm, name: inputChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#526477]">Class Identifier Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CL-10, GR-08"
                  value={classForm.code}
                  onChange={(inputChangeEvent) => setClassForm({ ...classForm, code: inputChangeEvent.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono uppercase text-[#006AC7] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#526477]">Grade Level (1 - 12) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={12}
                  value={classForm.gradeLevel}
                  onChange={(inputChangeEvent) => setClassForm({ ...classForm, gradeLevel: parseInt(inputChangeEvent.target.value, 10) || 1 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[#526477] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#006AC7] px-5 py-2 font-semibold text-white hover:bg-[#00529B] shadow-sm"
                >
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE / EDIT SECTION --- */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-[#102033]">
                {editingSection ? 'Edit Section Record' : 'Create New Section'}
              </h4>
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="text-slate-400 hover:text-[#102033]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSection} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#526477]">Target Class *</label>
                <select
                  required
                  value={sectionForm.classId}
                  onChange={(selectChangeEvent) => setSectionForm({ ...sectionForm, classId: selectChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} (Grade {cls.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#526477]">Section Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, Blue, Red, Science"
                  value={sectionForm.name}
                  onChange={(inputChangeEvent) => setSectionForm({ ...sectionForm, name: inputChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#526477]">Student Capacity</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={sectionForm.capacity}
                  onChange={(inputChangeEvent) => setSectionForm({ ...sectionForm, capacity: parseInt(inputChangeEvent.target.value, 10) || 40 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#526477]">Classroom Number / Hall</label>
                <input
                  type="text"
                  placeholder="e.g. Room 104, West Wing Lab"
                  value={sectionForm.roomNumber}
                  onChange={(inputChangeEvent) => setSectionForm({ ...sectionForm, roomNumber: inputChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[#526477] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#006AC7] px-5 py-2 font-semibold text-white hover:bg-[#00529B] shadow-sm"
                >
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE / EDIT SUBJECT --- */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#102033]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-[#102033]">
                {editingSubject ? 'Edit Subject Details' : 'Register New Subject'}
              </h4>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-[#102033]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#526477]">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Physics, English Literature"
                  value={subjectForm.name}
                  onChange={(inputChangeEvent) => setSubjectForm({ ...subjectForm, name: inputChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#526477]">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH-101, PHY-201"
                  value={subjectForm.code}
                  onChange={(inputChangeEvent) => setSubjectForm({ ...subjectForm, code: inputChangeEvent.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono uppercase text-[#006AC7] focus:border-[#006AC7] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#526477]">Class (Optional - leave empty for global)</label>
                <select
                  value={subjectForm.classId}
                  onChange={(selectChangeEvent) => setSubjectForm({ ...subjectForm, classId: selectChangeEvent.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[#102033] focus:border-[#006AC7] focus:outline-none"
                >
                  <option value="">Applicable to All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} (Grade {cls.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="electiveCheckbox"
                  checked={subjectForm.isElective}
                  onChange={(checkboxChangeEvent) => setSubjectForm({ ...subjectForm, isElective: checkboxChangeEvent.target.checked })}
                  className="rounded border-slate-300 text-[#006AC7] focus:ring-[#006AC7]"
                />
                <label htmlFor="electiveCheckbox" className="font-semibold text-[#526477]">
                  Elective Course (Optional curriculum)
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[#526477] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#006AC7] px-5 py-2 font-semibold text-white hover:bg-[#00529B] shadow-sm"
                >
                  {editingSubject ? 'Update Subject' : 'Register Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicManagementTab;
