import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import AcademicManagementTab from '../dashboard/components/AcademicManagementTab.jsx';
import apiClient from '../../services/apiClient.js';
import { GraduationCap, RefreshCw } from 'lucide-react';

export const AcademicPage = () => {
  const [schoolsList, setSchoolsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/schools');
      if (response.data?.success) {
        setSchoolsList(response.data.data?.schools || response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load schools for academic tab:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  return (
    <PageContainer
      title="Academic Management & Institutional Curriculum"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Grade levels, class rosters, sections, and subject allocations"
      actions={
        <button
          type="button"
          onClick={fetchSchools}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-[#526477] hover:text-[#102033] hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      <div className="space-y-6">
        <AcademicManagementTab schoolsList={schoolsList} />
      </div>
    </PageContainer>
  );
};

export default AcademicPage;
