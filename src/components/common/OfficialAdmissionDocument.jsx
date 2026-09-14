import React, { useRef } from 'react';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';
import './OfficialAdmissionDocument.css';

/**
 * Town Municipal Corporation Liaquatabad Crest / Insignia SVG
 */
export const TmcInsignia = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="56" stroke="#0f172a" strokeWidth="3" />
    <circle cx="60" cy="60" r="50" stroke="#0f172a" strokeWidth="1" strokeDasharray="2 2" />
    <circle cx="60" cy="60" r="46" stroke="#0f172a" strokeWidth="1.5" />
    {/* Inner Decorative Laurel */}
    <path
      d="M32 60 C32 75, 44 88, 60 88 C76 88, 88 75, 88 60"
      stroke="#1e293b"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Open Book of Education */}
    <path
      d="M44 58 Q60 52 60 68 Q60 52 76 58 L76 72 Q60 66 60 80 Q60 66 44 72 Z"
      fill="#f1f5f9"
      stroke="#0f172a"
      strokeWidth="1.5"
    />
    {/* Star & Crescent */}
    <circle cx="60" cy="40" r="10" stroke="#0f172a" strokeWidth="1.5" fill="none" />
    <circle cx="63" cy="38" r="8" fill="#ffffff" />
    <polygon points="63,33 65,38 70,38 66,41 67,46 63,43 59,46 60,41 56,38 61,38" fill="#0f172a" />
    {/* Text around circle */}
    <text x="60" y="24" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0f172a" letterSpacing="0.5">
      TOWN MUNICIPAL CORPORATION
    </text>
    <text x="60" y="102" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0f172a" letterSpacing="1">
      LIAQUATABAD
    </text>
  </svg>
);

/**
 * Segmented Paper Digits renderer (13 digits formatted as 5 - 7 - 1)
 */
export const PaperSegmentedCnic = ({ value = '' }) => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 13);
  const chars = digits.padEnd(13, ' ').split('');

  const renderCells = (indices) =>
    indices.map((idx) => (
      <span key={idx} className="cnic-paper-cell">
        {chars[idx] && chars[idx] !== ' ' ? chars[idx] : ''}
      </span>
    ));

  return (
    <div className="cnic-paper-row">
      {renderCells([0, 1, 2, 3, 4])}
      <span className="cnic-paper-divider">-</span>
      {renderCells([5, 6, 7, 8, 9, 10, 11])}
      <span className="cnic-paper-divider">-</span>
      {renderCells([12])}
    </div>
  );
};

/**
 * OfficialAdmissionDocument
 * Exact printable and screen representation of the Town Municipal Corporation
 * Liaquatabad Education Department Admission Form.
 */
export const OfficialAdmissionDocument = ({
  data = {},
  school = null,
  onClose,
  showActions = true,
}) => {
  const printSheetRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const schoolName = school?.name || data?.schoolName || 'GOVT. ELEMENTARY & SECONDARY';
  const schoolCode = school?.schoolCode || school?.code || data?.schoolCode || 'LTC';

  const mediumLabel = {
    URDU: 'Urdu Medium (اردو میڈیم)',
    ENGLISH: 'English Medium (انگلش میڈیم)',
    SINDHI: 'Sindhi Medium (سنڌي ميڊيم)',
  }[data.mediumRequested || data.mediumOfInstruction] || (data.mediumRequested || 'Urdu Medium (اردو میڈیم)');

  return (
    <div className="official-admission-wrapper py-6 px-2 sm:px-4 bg-slate-100 min-h-screen">
      {/* Top Action Bar for screen view */}
      {showActions && (
        <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-[#006AC7]" />
            <span>Official Government Paper Preview (A4 Printable)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006AC7] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#005299] transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Form (پرنٹ فارم)
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* The Printable A4 Sheet */}
      <div
        ref={printSheetRef}
        className="official-admission-sheet official-admission-printable bg-white"
      >
        <div className="official-ornamental-frame">
          {/* ════ TOP HEADER & EMBLEM ════ */}
          <div>
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-2">
              {/* Left Insignia */}
              <div className="w-20 flex-shrink-0 flex items-center justify-center pt-1">
                <TmcInsignia className="w-18 h-18" />
              </div>

              {/* Centered Institutional Titles */}
              <div className="text-center flex-1 px-2">
                <h1 className="official-header-title-1">Town Municipal Corporation</h1>
                <h2 className="official-header-title-2">Liaquatabad</h2>
                <h3 className="official-header-title-3">Education Department</h3>
                <div className="mt-1">
                  <span className="official-school-line">
                    {schoolName} SCHOOL
                  </span>
                </div>
              </div>

              {/* Top Right Photo Frame */}
              <div className="w-24 flex-shrink-0 flex flex-col items-end">
                <div className="photo-affix-box">
                  {data.studentPhotoUrl ? (
                    <img
                      src={data.studentPhotoUrl}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <span>Affix Passport</span>
                      <span>Photograph</span>
                      <span>Here</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1 w-full text-center">
                  Date: <span className="border-b border-slate-600 inline-block min-w-[45px] text-left">{formatDate(data.admissionDate) || '__________'}</span>
                </div>
              </div>
            </div>

            {/* Banner Title & Registration Records */}
            <div className="text-center mt-2.5 mb-1.5">
              <span className="admission-form-banner">Admission Form</span>
            </div>

            {/* S.No. & G.R. No. Row */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold py-1.5 border-b border-slate-300">
              <div className="space-y-1">
                <div>
                  <span className="field-label">S.no.</span>{' '}
                  <span className="field-underline min-w-[120px]">
                    {data.serialNumber || data.applicationNumber || ''}
                  </span>
                </div>
                <div>
                  <span className="field-label">Date:</span>{' '}
                  <span className="field-underline min-w-[120px]">
                    {formatDate(data.admissionDate) || formatDate(new Date())}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-right sm:text-left">
                <div>
                  <span className="field-label">G.R. no.</span>{' '}
                  <span className="field-underline min-w-[120px] font-mono">
                    {data.grNumber || data.admissionRegisterNumber || ''}
                  </span>
                </div>
                <div>
                  <span className="field-label">Date of Admission:</span>{' '}
                  <span className="field-underline min-w-[100px]">
                    {formatDate(data.admissionDate) || ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ════ 16 NUMBERED OFFICIAL FIELDS ════ */}
          <div className="space-y-1.5 py-2 text-[12.5px] leading-tight">
            {/* 1. Student's Name */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">1. Student's Name:</span>
              <span className="field-underline flex-1 uppercase">
                {data.studentFullName || data.fullName || ''}
              </span>
            </div>

            {/* 2. Father's Name */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">2. Father's Name:</span>
              <span className="field-underline flex-1 uppercase">
                {data.fatherFullName || data.fatherName || ''}
              </span>
            </div>

            {/* 3. CNIC NO. (Guardian) */}
            <div className="flex items-center">
              <span className="field-label min-w-[165px]">3. CNIC NO. (Guardian):</span>
              <div className="flex items-center gap-2">
                <PaperSegmentedCnic value={data.guardianCnicNumber || data.cnicNumber || ''} />
              </div>
            </div>

            {/* 4. Student B-Form / CRC NO. */}
            <div className="flex items-center">
              <span className="field-label min-w-[165px]">
                4. Student B-Form # <span className="font-urdu text-[11px] font-normal">(ب فارم نمبر)</span>:
              </span>
              <div className="flex items-center gap-2">
                <PaperSegmentedCnic value={data.bFormNumber || ''} />
                <span className="text-[10px] text-slate-500 font-sans">(NADRA CRC)</span>
              </div>
            </div>

            {/* 5. Mother's Name */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">5. Mother's Name:</span>
              <span className="field-underline flex-1 uppercase">
                {data.motherFullName || data.motherName || ''}
              </span>
            </div>

            {/* 6. Religion | Place of Birth | Gender */}
            <div className="grid grid-cols-12 gap-2 items-baseline">
              <div className="col-span-4 flex items-baseline">
                <span className="field-label">6. Religion:</span>
                <span className="field-underline flex-1 ml-1.5">
                  {data.religion || 'ISLAM'}
                </span>
              </div>
              <div className="col-span-4 flex items-baseline">
                <span className="field-label">Place of Birth:</span>
                <span className="field-underline flex-1 ml-1.5">
                  {data.placeOfBirth || 'Karachi'}
                </span>
              </div>
              <div className="col-span-4 flex items-baseline">
                <span className="field-label">Gender:</span>
                <span className="field-underline flex-1 ml-1.5 uppercase">
                  {data.gender === 'MALE' ? 'MALE (طالب علم)' : data.gender === 'FEMALE' ? 'FEMALE (طالبہ)' : data.gender || ''}
                </span>
              </div>
            </div>

            {/* 7. Date of Birth (in figures) & (in words) */}
            <div className="grid grid-cols-12 gap-2 items-baseline">
              <div className="col-span-5 flex items-baseline">
                <span className="field-label">7. Date of Birth (in figures):</span>
                <span className="field-underline flex-1 ml-1.5 font-mono">
                  {formatDate(data.dateOfBirth) || ''}
                </span>
              </div>
              <div className="col-span-7 flex items-baseline">
                <span className="field-label">(in words):</span>
                <span className="field-underline flex-1 ml-1.5 capitalize text-[11.5px]">
                  {data.dateOfBirthInWords || ''}
                </span>
              </div>
            </div>

            {/* 8. Father's Qualification | Mother's Qualification */}
            <div className="grid grid-cols-12 gap-2 items-baseline">
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">8. Father's Qualification:</span>
                <span className="field-underline flex-1 ml-1.5">
                  {data.fatherQualification || ''}
                </span>
              </div>
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">Mother's Qualification:</span>
                <span className="field-underline flex-1 ml-1.5">
                  {data.motherQualification || ''}
                </span>
              </div>
            </div>

            {/* 9. Father's Occupation */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">9. Father's Occupation:</span>
              <span className="field-underline flex-1">
                {data.fatherOccupation || ''}
              </span>
            </div>

            {/* 10. Last School Attended */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">10. Last School Attended:</span>
              <span className="field-underline flex-1">
                {data.lastSchoolAttended || 'N/A (New Admission)'}
              </span>
            </div>

            {/* 11. Class Required & Medium of Instruction */}
            <div className="grid grid-cols-12 gap-2 items-baseline">
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">11. Class required:</span>
                <span className="field-underline flex-1 ml-1.5 font-bold">
                  {data.admissionClassRequested || data.grade || ''}
                </span>
              </div>
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">Medium of Instruction:</span>
                <span className="field-underline flex-1 ml-1.5 font-bold">
                  {mediumLabel}
                </span>
              </div>
            </div>

            {/* 12. Permanent Residential Address */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">12. Permanent Res. Address:</span>
              <span className="field-underline flex-1">
                {data.permanentResidentialAddress || data.residentialAddress || ''}
              </span>
            </div>

            {/* 13. Office Address */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">13. Office Address:</span>
              <span className="field-underline flex-1">
                {data.parentOfficeAddress || data.officeAddress || ''}
              </span>
            </div>

            {/* 14. Phone No. (Residence) | Phone No. (Business) */}
            <div className="grid grid-cols-12 gap-2 items-baseline">
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">14. Phone (Residence):</span>
                <span className="field-underline flex-1 ml-1.5 font-mono">
                  {data.residencePhoneNumber || ''}
                </span>
              </div>
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">Phone (Business):</span>
                <span className="field-underline flex-1 ml-1.5 font-mono">
                  {data.businessPhoneNumber || ''}
                </span>
              </div>
            </div>

            {/* 15. Cell No. | Email */}
            <div className="grid grid-cols-12 gap-2 items-baseline">
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">15. Cell No.:</span>
                <span className="field-underline flex-1 ml-1.5 font-mono font-bold">
                  {data.guardianCellNumber || data.cellNumber || ''}
                </span>
              </div>
              <div className="col-span-6 flex items-baseline">
                <span className="field-label">Email:</span>
                <span className="field-underline flex-1 ml-1.5 font-mono text-[11px]">
                  {data.guardianEmail || data.email || ''}
                </span>
              </div>
            </div>

            {/* 16. Remarks */}
            <div className="flex items-baseline">
              <span className="field-label min-w-[165px]">16. Remarks:</span>
              <span className="field-underline flex-1">
                {data.admissionRemarks || data.remarks || ''}
              </span>
            </div>
          </div>

          {/* ════ OFFICIAL VALIDATION / SIGNATURE ROW ════ */}
          <div className="pt-8 pb-3 border-t border-slate-300">
            <div className="flex justify-between items-end px-4 text-xs font-bold text-slate-800">
              <div className="text-center w-60">
                <div className="border-b-2 border-slate-800 pb-1 mb-1 min-h-[30px]" />
                <span>Parents Signature</span>
              </div>

              <div className="text-center w-64">
                <div className="border-b-2 border-slate-800 pb-1 mb-1 min-h-[30px]">
                  <span className="text-[10px] text-slate-400 block italic">Official Seal & Signature</span>
                </div>
                <span>Principal Signature with Seal</span>
              </div>
            </div>

            {/* Document Verification Footer */}
            <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-500 tracking-wider uppercase">
              Town Municipal Corporation Liaquatabad • Directorate of Education • Official Admission Record
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialAdmissionDocument;
