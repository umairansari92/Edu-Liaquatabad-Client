import React from 'react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import ReportingHealthTab from '../dashboard/components/ReportingHealthTab.jsx';
import { FileText } from 'lucide-react';

export const DocumentsPage = () => {
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
