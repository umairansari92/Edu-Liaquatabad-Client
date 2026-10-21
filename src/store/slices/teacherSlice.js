import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import teacherService from '../../services/teacherService.js';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchTeacherSummary = createAsyncThunk(
  'teacher/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await teacherService.getTeacherWorkspaceSummary();
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch teacher summary');
    }
  }
);

export const fetchTeachingAssignments = createAsyncThunk(
  'teacher/fetchTeachingAssignments',
  async (_, { rejectWithValue }) => {
    try {
      return await teacherService.getMyTeachingAssignments();
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch teaching assignments');
    }
  }
);

export const fetchSectionRoster = createAsyncThunk(
  'teacher/fetchSectionRoster',
  async (sectionId, { rejectWithValue }) => {
    try {
      return await teacherService.getSectionStudentRoster(sectionId);
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch student roster');
    }
  }
);

export const fetchAttendanceSheet = createAsyncThunk(
  'teacher/fetchAttendanceSheet',
  async ({ sectionId, date }, { rejectWithValue }) => {
    try {
      return await teacherService.getAttendanceSheet(sectionId, date);
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch attendance sheet');
    }
  }
);

export const submitStudentAttendance = createAsyncThunk(
  'teacher/submitAttendance',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await teacherService.submitStudentAttendance(payload);
      dispatch(fetchTeacherSummary());
      return response;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to submit attendance');
    }
  }
);

export const fetchAttendanceRegister = createAsyncThunk(
  'teacher/fetchAttendanceRegister',
  async ({ sectionId, month, year }, { rejectWithValue }) => {
    try {
      return await teacherService.getAttendanceRegister(sectionId, month, year);
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch attendance register');
    }
  }
);

export const clearMissedAttendance = createAsyncThunk(
  'teacher/clearMissedAttendance',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await teacherService.clearMissedAttendance(payload);
      dispatch(fetchTeacherSummary());
      return response;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to clear missed attendance');
    }
  }
);

export const requestLateAttendanceClearance = createAsyncThunk(
  'teacher/requestLateAttendanceClearance',
  async ({ sectionId, date, reason }, { rejectWithValue, dispatch }) => {
    try {
      const response = await teacherService.requestLateAttendanceClearance({ sectionId, date, reason });
      dispatch(fetchAttendanceSheet({ sectionId, date }));
      return response;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to submit late attendance clearance request');
    }
  }
);

export const fetchSchoolExams = createAsyncThunk(
  'teacher/fetchSchoolExams',
  async (_, { rejectWithValue }) => {
    try {
      return await teacherService.getSchoolExams();
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch exams list');
    }
  }
);

export const fetchExamMarksRoster = createAsyncThunk(
  'teacher/fetchExamMarksRoster',
  async ({ examId, classId, sectionId, subjectId }, { rejectWithValue }) => {
    try {
      return await teacherService.getExamMarksEntryRoster(examId, classId, sectionId, subjectId);
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch exam marks roster');
    }
  }
);

export const bulkSubmitExamMarks = createAsyncThunk(
  'teacher/bulkSubmitExamMarks',
  async ({ examId, payload, classId, sectionId, subjectId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await teacherService.bulkSubmitExamMarks(examId, payload);
      dispatch(fetchExamMarksRoster({ examId, classId, sectionId, subjectId }));
      return response;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to submit exam marks');
    }
  }
);

export const fetchMyHomework = createAsyncThunk(
  'teacher/fetchMyHomework',
  async (_, { rejectWithValue }) => {
    try {
      return await teacherService.getMyHomework();
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch homework');
    }
  }
);

export const createHomework = createAsyncThunk(
  'teacher/createHomework',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await teacherService.createHomework(payload);
      dispatch(fetchMyHomework());
      dispatch(fetchTeacherSummary());
      return response;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to create homework');
    }
  }
);

export const cancelHomework = createAsyncThunk(
  'teacher/cancelHomework',
  async (homeworkId, { rejectWithValue, dispatch }) => {
    try {
      const response = await teacherService.cancelHomework(homeworkId);
      dispatch(fetchMyHomework());
      dispatch(fetchTeacherSummary());
      return response;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to cancel homework');
    }
  }
);

export const fetchTeacherCirculars = createAsyncThunk(
  'teacher/fetchCirculars',
  async (_, { rejectWithValue }) => {
    try {
      return await teacherService.getTeacherCirculars();
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch circulars');
    }
  }
);

export const fetchTeacherSelfAttendance = createAsyncThunk(
  'teacher/fetchSelfAttendance',
  async ({ month, year } = {}, { rejectWithValue }) => {
    try {
      return await teacherService.getTeacherSelfAttendance(month, year);
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch attendance history');
    }
  }
);

export const fetchClBalance = createAsyncThunk(
  'teacher/fetchClBalance',
  async (year, { rejectWithValue }) => {
    try {
      return await teacherService.getClBalance(year);
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch CL balance');
    }
  }
);

export const fetchMyLeaveRequests = createAsyncThunk(
  'teacher/fetchMyLeaveRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await teacherService.getMyLeaveRequests(params);
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to fetch leave requests');
    }
  }
);

export const submitLeaveRequest = createAsyncThunk(
  'teacher/submitLeaveRequest',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await teacherService.submitLeaveRequest(payload);
      dispatch(fetchClBalance());
      dispatch(fetchMyLeaveRequests());
      return response;
    } catch (apiRequestError) {
      return rejectWithValue(apiRequestError.response?.data?.message || 'Failed to submit leave request');
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  // Workspace Summary
  summary: null,
  summaryLoading: false,
  summaryError: null,

  // Duties & Assignments
  assignments: [],
  assignmentsLoading: false,

  // Section Student Roster
  selectedSection: null,
  sectionRoster: [],
  rosterLoading: false,
  rosterError: null,

  // Daily Classroom Attendance
  attendanceSheet: null,
  attendanceLoading: false,
  attendanceSubmitting: false,
  attendanceError: null,
  attendanceSuccessMsg: null,

  // Monthly Smart Attendance Register
  attendanceRegister: null,
  attendanceRegisterLoading: false,
  attendanceRegisterError: null,
  clearMissedSubmitting: false,
  clearMissedError: null,

  // Late Attendance Clearance
  clearanceSubmitting: false,
  clearanceError: null,

  // Examination Marks
  examsList: [],
  examsLoading: false,
  examRoster: null,
  examRosterLoading: false,
  examMarksSubmitting: false,
  examMarksError: null,
  examMarksSuccessMsg: null,

  // Homework
  homeworkList: [],
  homeworkLoading: false,
  homeworkCreating: false,
  homeworkError: null,

  // Circulars
  circularsList: [],
  circularsLoading: false,

  // Self Attendance
  selfAttendance: null,
  selfAttendanceLoading: false,

  // Leave Management & Casual Leave (CL) Balance
  clBalance: null,
  clBalanceLoading: false,
  myLeaveRequests: [],
  leaveRequestsLoading: false,
  leaveSubmitting: false,
  leaveError: null,
};

// ─── Slice Definition ─────────────────────────────────────────────────────────

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    clearAttendanceStatus(state) {
      state.attendanceError = null;
      state.attendanceSuccessMsg = null;
    },
    clearExamMarksStatus(state) {
      state.examMarksError = null;
      state.examMarksSuccessMsg = null;
    },
    setSelectedSection(state, action) {
      state.selectedSection = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Teacher Summary
      .addCase(fetchTeacherSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchTeacherSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchTeacherSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      })

      // Teaching Assignments
      .addCase(fetchTeachingAssignments.pending, (state) => {
        state.assignmentsLoading = true;
      })
      .addCase(fetchTeachingAssignments.fulfilled, (state, action) => {
        state.assignmentsLoading = false;
        state.assignments = action.payload?.activeAssignments || [];
      })
      .addCase(fetchTeachingAssignments.rejected, (state) => {
        state.assignmentsLoading = false;
      })

      // Section Student Roster
      .addCase(fetchSectionRoster.pending, (state) => {
        state.rosterLoading = true;
        state.rosterError = null;
      })
      .addCase(fetchSectionRoster.fulfilled, (state, action) => {
        state.rosterLoading = false;
        state.sectionRoster = action.payload?.students || [];
      })
      .addCase(fetchSectionRoster.rejected, (state, action) => {
        state.rosterLoading = false;
        state.rosterError = action.payload;
      })

      // Attendance Sheet
      .addCase(fetchAttendanceSheet.pending, (state) => {
        state.attendanceLoading = true;
        state.attendanceError = null;
      })
      .addCase(fetchAttendanceSheet.fulfilled, (state, action) => {
        state.attendanceLoading = false;
        state.attendanceSheet = action.payload;
      })
      .addCase(fetchAttendanceSheet.rejected, (state, action) => {
        state.attendanceLoading = false;
        state.attendanceError = action.payload;
      })

      // Submit Attendance
      .addCase(submitStudentAttendance.pending, (state) => {
        state.attendanceSubmitting = true;
        state.attendanceError = null;
        state.attendanceSuccessMsg = null;
      })
      .addCase(submitStudentAttendance.fulfilled, (state, action) => {
        state.attendanceSubmitting = false;
        state.attendanceSuccessMsg = action.payload?.message || 'Attendance submitted successfully.';
      })
      .addCase(submitStudentAttendance.rejected, (state, action) => {
        state.attendanceSubmitting = false;
        state.attendanceError = action.payload;
      })

      // Monthly Attendance Register
      .addCase(fetchAttendanceRegister.pending, (state) => {
        state.attendanceRegisterLoading = true;
        state.attendanceRegisterError = null;
      })
      .addCase(fetchAttendanceRegister.fulfilled, (state, action) => {
        state.attendanceRegisterLoading = false;
        state.attendanceRegister = action.payload;
      })
      .addCase(fetchAttendanceRegister.rejected, (state, action) => {
        state.attendanceRegisterLoading = false;
        state.attendanceRegisterError = action.payload;
      })

      // Clear Missed Attendance
      .addCase(clearMissedAttendance.pending, (state) => {
        state.clearMissedSubmitting = true;
        state.clearMissedError = null;
      })
      .addCase(clearMissedAttendance.fulfilled, (state) => {
        state.clearMissedSubmitting = false;
      })
      .addCase(clearMissedAttendance.rejected, (state, action) => {
        state.clearMissedSubmitting = false;
        state.clearMissedError = action.payload;
      })

      // Request Late Attendance Clearance
      .addCase(requestLateAttendanceClearance.pending, (state) => {
        state.clearanceSubmitting = true;
        state.clearanceError = null;
      })
      .addCase(requestLateAttendanceClearance.fulfilled, (state) => {
        state.clearanceSubmitting = false;
      })
      .addCase(requestLateAttendanceClearance.rejected, (state, action) => {
        state.clearanceSubmitting = false;
        state.clearanceError = action.payload;
      })

      // School Exams List
      .addCase(fetchSchoolExams.pending, (state) => {
        state.examsLoading = true;
      })
      .addCase(fetchSchoolExams.fulfilled, (state, action) => {
        state.examsLoading = false;
        state.examsList = action.payload;
      })
      .addCase(fetchSchoolExams.rejected, (state) => {
        state.examsLoading = false;
      })

      // Exam Marks Entry Roster
      .addCase(fetchExamMarksRoster.pending, (state) => {
        state.examRosterLoading = true;
        state.examMarksError = null;
      })
      .addCase(fetchExamMarksRoster.fulfilled, (state, action) => {
        state.examRosterLoading = false;
        state.examRoster = action.payload;
      })
      .addCase(fetchExamMarksRoster.rejected, (state, action) => {
        state.examRosterLoading = false;
        state.examMarksError = action.payload;
      })

      // Bulk Submit Marks
      .addCase(bulkSubmitExamMarks.pending, (state) => {
        state.examMarksSubmitting = true;
        state.examMarksError = null;
        state.examMarksSuccessMsg = null;
      })
      .addCase(bulkSubmitExamMarks.fulfilled, (state, action) => {
        state.examMarksSubmitting = false;
        state.examMarksSuccessMsg = action.payload?.message || 'Marks submitted successfully.';
      })
      .addCase(bulkSubmitExamMarks.rejected, (state, action) => {
        state.examMarksSubmitting = false;
        state.examMarksError = action.payload;
      })

      // Homework List
      .addCase(fetchMyHomework.pending, (state) => {
        state.homeworkLoading = true;
        state.homeworkError = null;
      })
      .addCase(fetchMyHomework.fulfilled, (state, action) => {
        state.homeworkLoading = false;
        state.homeworkList = action.payload?.homework || [];
      })
      .addCase(fetchMyHomework.rejected, (state, action) => {
        state.homeworkLoading = false;
        state.homeworkError = action.payload;
      })

      // Create Homework
      .addCase(createHomework.pending, (state) => {
        state.homeworkCreating = true;
      })
      .addCase(createHomework.fulfilled, (state) => {
        state.homeworkCreating = false;
      })
      .addCase(createHomework.rejected, (state, action) => {
        state.homeworkCreating = false;
        state.homeworkError = action.payload;
      })

      // Circulars
      .addCase(fetchTeacherCirculars.pending, (state) => {
        state.circularsLoading = true;
      })
      .addCase(fetchTeacherCirculars.fulfilled, (state, action) => {
        state.circularsLoading = false;
        state.circularsList = action.payload;
      })
      .addCase(fetchTeacherCirculars.rejected, (state) => {
        state.circularsLoading = false;
      })

      // Self Attendance
      .addCase(fetchTeacherSelfAttendance.pending, (state) => {
        state.selfAttendanceLoading = true;
      })
      .addCase(fetchTeacherSelfAttendance.fulfilled, (state, action) => {
        state.selfAttendanceLoading = false;
        state.selfAttendance = action.payload;
      })
      .addCase(fetchTeacherSelfAttendance.rejected, (state) => {
        state.selfAttendanceLoading = false;
      })

      // CL Balance
      .addCase(fetchClBalance.pending, (state) => {
        state.clBalanceLoading = true;
      })
      .addCase(fetchClBalance.fulfilled, (state, action) => {
        state.clBalanceLoading = false;
        state.clBalance = action.payload;
      })
      .addCase(fetchClBalance.rejected, (state) => {
        state.clBalanceLoading = false;
      })

      // My Leave Requests
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.leaveRequestsLoading = true;
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action) => {
        state.leaveRequestsLoading = false;
        state.myLeaveRequests = action.payload;
      })
      .addCase(fetchMyLeaveRequests.rejected, (state) => {
        state.leaveRequestsLoading = false;
      })

      // Submit Leave Request
      .addCase(submitLeaveRequest.pending, (state) => {
        state.leaveSubmitting = true;
        state.leaveError = null;
      })
      .addCase(submitLeaveRequest.fulfilled, (state) => {
        state.leaveSubmitting = false;
      })
      .addCase(submitLeaveRequest.rejected, (state, action) => {
        state.leaveSubmitting = false;
        state.leaveError = action.payload;
      });
  },
});

export const {
  clearAttendanceStatus,
  clearExamMarksStatus,
  clearLeaveStatus,
  setSelectedSection,
} = teacherSlice.actions;

// ─── Narrow Selectors (Performance-Optimized) ─────────────────────────────────

export const selectTeacherSummary = (state) => state.teacher.summary;
export const selectTeacherSummaryLoading = (state) => state.teacher.summaryLoading;
export const selectTeacherSections = (state) => state.teacher.summary?.sections || [];
export const selectTeacherUniqueSubjectsCount = (state) => state.teacher.summary?.summary?.uniqueSubjectsCount || state.teacher.summary?.summary?.activeAssignmentsCount || 0;
export const selectTeacherTotalAssignmentsCount = (state) => state.teacher.summary?.summary?.totalAssignmentsCount || 0;
export const selectTeacherPendingAttendanceCount = (state) => state.teacher.summary?.summary?.pendingAttendanceCount || 0;
export const selectTeacherClassTeacherSectionCount = (state) => state.teacher.summary?.summary?.classTeacherSectionCount || 0;
export const selectTeacherAssignments = (state) => state.teacher.assignments;
export const selectAttendanceSheet = (state) => state.teacher.attendanceSheet;
export const selectAttendanceLoading = (state) => state.teacher.attendanceLoading;
export const selectAttendanceSubmitting = (state) => state.teacher.attendanceSubmitting;
export const selectAttendanceRegister = (state) => state.teacher.attendanceRegister;
export const selectAttendanceRegisterLoading = (state) => state.teacher.attendanceRegisterLoading;
export const selectAttendanceRegisterError = (state) => state.teacher.attendanceRegisterError;
export const selectClearMissedSubmitting = (state) => state.teacher.clearMissedSubmitting;
export const selectClearMissedError = (state) => state.teacher.clearMissedError;
export const selectClearanceSubmitting = (state) => state.teacher.clearanceSubmitting;
export const selectClearanceError = (state) => state.teacher.clearanceError;
export const selectSchoolExams = (state) => state.teacher.examsList;
export const selectExamRoster = (state) => state.teacher.examRoster;
export const selectExamRosterLoading = (state) => state.teacher.examRosterLoading;
export const selectExamMarksSubmitting = (state) => state.teacher.examMarksSubmitting;
export const selectTeacherHomework = (state) => state.teacher.homeworkList;
export const selectHomeworkLoading = (state) => state.teacher.homeworkLoading;
export const selectTeacherCirculars = (state) => state.teacher.circularsList;
export const selectTeacherSelfAttendance = (state) => state.teacher.selfAttendance;
export const selectTeacherSectionRoster = (state) => state.teacher.sectionRoster;
export const selectTeacherClBalance = (state) => state.teacher.clBalance;
export const selectTeacherClBalanceLoading = (state) => state.teacher.clBalanceLoading;
export const selectTeacherLeaveRequests = (state) => state.teacher.myLeaveRequests;
export const selectTeacherLeaveLoading = (state) => state.teacher.leaveRequestsLoading;
export const selectTeacherLeaveSubmitting = (state) => state.teacher.leaveSubmitting;
export const selectTeacherLeaveError = (state) => state.teacher.leaveError;

export default teacherSlice.reducer;
