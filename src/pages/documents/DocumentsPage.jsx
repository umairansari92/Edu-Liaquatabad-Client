import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer.jsx';
import ReportingHealthTab from '../dashboard/components/ReportingHealthTab.jsx';
import { FileText } from 'lucide-react';

export const DocumentsPage = () => {
  const { user } = useSelector((state) => state.auth);

  // If user is STUDENT, redirect to dedicated student circulars tab
  if (user?.role === 'STUDENT') {
    return <Navigate to="/dashboard?tab=notices" replace />;
  }

  return (
    <PageContainer
      title="Municipal Circulars, Documents & Reporting Exports"
      subtitle="Education Department Liaquatabad Town Centre (DMC) — Official directives, personnel CSV exports, and infrastructure vitals"
    >
      <div className="space-y-6">
        <ReportingHealthTab />
      </div>
    </PageContainer>
  );
};

export default DocumentsPage;
