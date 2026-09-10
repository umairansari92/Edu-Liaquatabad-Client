import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import TeacherTransferTab from '../dashboard/components/TeacherTransferTab.jsx';
import apiClient from '../../services/apiClient.js';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';

export const TransfersPage = () => {
  const [schoolsList, setSchoolsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuxData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schoolsRes, teachersRes] = await Promise.all([
        apiClient.get('/schools'),
        apiClient.get('/users?role=TEACHER&limit=100'),
      ]);

      if (schoolsRes.data?.success) {
        setSchoolsList(schoolsRes.data.data?.schools || schoolsRes.data.data || []);
      }
      if (teachersRes.data?.success) {
        setTeachersList(teachersRes.data.data?.users || teachersRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load aux data for transfers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuxData();
  }, [fetchAuxData]);

  return (
    <PageContainer
      title="Teacher Transfers & Postings"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Municipal transfer rosters, deputations, and school reassignments"
      actions={
        <button
          type="button"
          onClick={fetchAuxData}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      <div className="space-y-6">
        <TeacherTransferTab
          schoolsList={schoolsList}
          teachersList={teachersList}
        />
      </div>
    </PageContainer>
  );
};

export default TransfersPage;
