import React from 'react';
import {
  GraduationCap,
  Mail,
  School,
  BookOpen,
  UserCheck,
  UserX,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const StudentsTable = ({
  studentsList = [],
  isLoading = false,
  onProcessLifecycle,
  actionProcessingUserId,
  onOpenProfileDrawer,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#526477]">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-[#526477]">
            <tr>
              <th className="px-4 py-3.5">Student Identity</th>
              <th className="px-4 py-3.5">GR / Roll No.</th>
              <th className="px-4 py-3.5">Enrolled School</th>
              <th className="px-4 py-3.5">Class & Section</th>
              <th className="px-4 py-3.5">Enrollment Status</th>
              <th className="px-4 py-3.5">Portal Account</th>
              <th className="px-4 py-3.5 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#526477]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#006AC7]" />
                  <p className="mt-2 font-medium">Retrieving student enrollment roster...</p>
                </td>
              </tr>
            ) : studentsList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#526477]">
                  <GraduationCap className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-bold text-[#102033]">No student records found</p>
                  <p className="mt-1 text-xs text-[#8094A8]">
                    No enrolled students match active search or school filters.
                  </p>
                </td>
              </tr>
            ) : (
              studentsList.map((student) => {
                const profile = student.studentProfile || {};
                const isProcessing = actionProcessingUserId === student._id;

                const grNo =
                  profile.grNumber ||
                  profile.admissionRegisterNumber ||
                  `GR-${student._id?.slice(-4).toUpperCase()}`;

                const className = profile.classId?.name || 'Class Assigned';
                const sectionName = profile.sectionId?.name ? `Sec ${profile.sectionId.name}` : '';

                return (
                  <tr key={student._id} className="transition hover:bg-blue-50/40">
                    {/* Student Identity */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#102033]">{student.fullName}</div>
                      <div className="text-[11px] text-[#526477] font-medium flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{student.email}</span>
                      </div>
                      {profile.bFormNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          CRC: {profile.bFormNumber}
                        </div>
                      )}
                    </td>

                    {/* GR / Student ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-[#006AC7] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                        {grNo}
                      </span>
                    </td>

                    {/* School */}
                    <td className="px-4 py-3.5">
                      {student.schoolId ? (
                        <div>
                          <div className="font-bold text-[#102033]">{student.schoolId.name}</div>
                          {student.schoolId.schoolCode && (
                            <div className="text-[10px] font-mono text-[#526477]">
                              {student.schoolId.schoolCode}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-700 font-medium">Unassigned</span>
                      )}
                    </td>

                    {/* Class & Section */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-[#102033]">
                          {className} {sectionName}
                        </span>
                      </div>
                    </td>

                    {/* Enrollment Status */}
                    <td className="px-4 py-3.5">
                      <span className="rounded-full px-2.5 py-0.5 font-bold text-[10px] border bg-emerald-50 text-[#4B7F3A] border-emerald-200">
                        ENROLLED
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] border ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#4B7F3A] border-emerald-200'
                            : student.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    {/* Operations */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenProfileDrawer(student)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-[#006AC7] hover:bg-blue-50 transition"
                          title="View Student Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {student.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              onProcessLifecycle(
                                student._id,
                                'ACTIVE',
                                'Student onboarding approval'
                              )
                            }
                            className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                            title="Approve Student Account"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}

                        {student.status === 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              onProcessLifecycle(
                                student._id,
                                'SUSPENDED',
                                'Student account suspension'
                              )
                            }
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Suspend Account"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}

                        {student.status === 'SUSPENDED' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              onProcessLifecycle(
                                student._id,
                                'ACTIVE',
                                'Reactivated by administrator'
                              )
                            }
                            className="rounded-lg p-1.5 text-[#4B7F3A] hover:bg-emerald-50"
                            title="Reactivate Account"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
