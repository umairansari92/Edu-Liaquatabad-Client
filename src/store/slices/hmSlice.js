import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import hmService from '../../services/hmService.js';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchHmSummary = createAsyncThunk(
  'hm/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hmService.getSchoolSummary();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch school summary');
    }
  }
);

export const fetchPendingApprovals = createAsyncThunk(
  'hm/fetchPendingApprovals',
  async (type = 'staff', { rejectWithValue }) => {
    try {
      const response = await hmService.getPendingApprovals(type);
      return { type, items: response.data?.items || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending approvals');
    }
  }
);

export const submitApprovalDecision = createAsyncThunk(
  'hm/submitApprovalDecision',
  async ({ userId, decision, remarks, type = 'staff' }, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.processApprovalDecision(userId, { decision, remarks });
      dispatch(fetchPendingApprovals(type));
      dispatch(fetchHmSummary());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process approval decision');
    }
  }
);

export const fetchAcademicClasses = createAsyncThunk(
  'hm/fetchAcademicClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hmService.getClasses();
      return response.data?.classes || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch classes');
    }
  }
);

export const createAcademicClass = createAsyncThunk(
  'hm/createAcademicClass',
  async (classData, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.createClass(classData);
      dispatch(fetchAcademicClasses());
      dispatch(fetchHmSummary());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create class');
    }
  }
);

export const fetchAcademicSections = createAsyncThunk(
  'hm/fetchAcademicSections',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await hmService.getSections(params);
      return response.data?.sections || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sections');
    }
  }
);

export const createAcademicSection = createAsyncThunk(
  'hm/createAcademicSection',
  async (sectionData, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.createSection(sectionData);
      dispatch(fetchAcademicSections());
      dispatch(fetchHmSummary());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create section');
    }
  }
);

export const fetchAcademicSubjects = createAsyncThunk(
  'hm/fetchAcademicSubjects',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await hmService.getSubjects(params);
      return response.data?.subjects || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subjects');
    }
  }
);

export const createAcademicSubject = createAsyncThunk(
  'hm/createAcademicSubject',
  async (subjectData, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.createSubject(subjectData);
      dispatch(fetchAcademicSubjects());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subject');
    }
  }
);

export const fetchTeachingAssignments = createAsyncThunk(
  'hm/fetchTeachingAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hmService.getSchoolTeachingAssignments();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teaching assignments');
    }
  }
);

export const assignTeachingDuty = createAsyncThunk(
  'hm/assignTeachingDuty',
  async (assignmentData, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.addTeachingAssignment(assignmentData);
      dispatch(fetchTeachingAssignments());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to allocate teaching assignment');
    }
  }
);

export const terminateTeachingDuty = createAsyncThunk(
  'hm/terminateTeachingDuty',
  async ({ id, reason }, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.endTeachingAssignment(id, reason);
      dispatch(fetchTeachingAssignments());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end teaching duty');
    }
  }
);

export const fetchAttendanceAnalytics = createAsyncThunk(
  'hm/fetchAttendanceAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hmService.getSchoolAttendanceAnalytics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance analytics');
    }
  }
);

export const verifyAttendanceRecord = createAsyncThunk(
  'hm/verifyAttendanceRecord',
  async ({ id, remarks }, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.verifyAttendance(id, remarks);
      dispatch(fetchHmSummary());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify attendance');
    }
  }
);

export const fetchExamsList = createAsyncThunk(
  'hm/fetchExamsList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hmService.getExams();
      return response.data?.exams || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch examinations');
    }
  }
);

export const scheduleExam = createAsyncThunk(
  'hm/scheduleExam',
  async (examData, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.createExam(examData);
      dispatch(fetchExamsList());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to schedule exam');
    }
  }
);

export const fetchExamResults = createAsyncThunk(
  'hm/fetchExamResults',
  async ({ examId, params }, { rejectWithValue }) => {
    try {
      const response = await hmService.getExamResults(examId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam results');
    }
  }
);

export const verifyStudentResult = createAsyncThunk(
  'hm/verifyStudentResult',
  async ({ resultId, examId, remarks }, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.verifyExamResult(resultId, remarks);
      if (examId) dispatch(fetchExamResults({ examId }));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify student result');
    }
  }
);

export const publishExamGazette = createAsyncThunk(
  'hm/publishExamGazette',
  async (examId, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.publishExamResults(examId);
      dispatch(fetchExamsList());
      dispatch(fetchExamResults({ examId }));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish exam gazette');
    }
  }
);

export const fetchIncomingTransfers = createAsyncThunk(
  'hm/fetchIncomingTransfers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await hmService.getTransfers(params);
      return response.data?.transfers || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch incoming transfers');
    }
  }
);

export const approveTransferJoining = createAsyncThunk(
  'hm/approveTransferJoining',
  async ({ id, joiningDate, remarks }, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.approveTransferJoining(id, { joiningDate, remarks });
      dispatch(fetchIncomingTransfers());
      dispatch(fetchHmSummary());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve transfer joining');
    }
  }
);

export const fetchSchoolNotices = createAsyncThunk(
  'hm/fetchSchoolNotices',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await hmService.getDocuments(params);
      return response.data?.documents || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch school circulars');
    }
  }
);

export const publishSchoolNotice = createAsyncThunk(
  'hm/publishSchoolNotice',
  async (noticeData, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.createDocument(noticeData);
      dispatch(fetchSchoolNotices());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish circular');
    }
  }
);

export const fetchSchoolStudents = createAsyncThunk(
  'hm/fetchSchoolStudents',
  async (params = {}, { rejectWithValue, signal }) => {
    try {
      const response = await hmService.getSchoolStudents(params, { signal });
      return response.data;
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return rejectWithValue('REQUEST_ABORTED');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch student directory');
    }
  }
);

export const updateSchoolCode = createAsyncThunk(
  'hm/updateSchoolCode',
  async ({ schoolId, schoolCode }, { rejectWithValue, dispatch }) => {
    try {
      const response = await hmService.setSchoolCode(schoolId, schoolCode);
      dispatch(fetchHmSummary());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update school code');
    }
  }
);

// ─── HM Redux Slice ───────────────────────────────────────────────────────────

const initialState = {
  summary: null,
  summaryLoading: false,

  staffApprovals: [],
  studentApprovals: [],
  approvalsLoading: false,

  students: [],
  studentsPagination: {
    currentPage: 1,
    pageSize: 20,
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  studentsLoading: false,

  classes: [],
  sections: [],
  subjects: [],
  academicsLoading: false,

  assignments: { activeAssignments: [], historicalAssignments: [] },
  assignmentsLoading: false,

  attendanceAnalytics: null,
  attendanceLoading: false,

  exams: [],
  activeExamResults: null,
  examsLoading: false,

  transfers: [],
  transfersLoading: false,

  notices: [],
  noticesLoading: false,

  actionError: null,
};

const hmSlice = createSlice({
  name: 'hm',
  initialState,
  reducers: {
    clearActionError: (state) => {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Summary
      .addCase(fetchHmSummary.pending, (state) => {
        state.summaryLoading = true;
      })
      .addCase(fetchHmSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchHmSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.actionError = action.payload;
      })

      // Approvals
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.approvalsLoading = true;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.approvalsLoading = false;
        if (action.payload.type === 'student') {
          state.studentApprovals = action.payload.items;
        } else {
          state.staffApprovals = action.payload.items;
        }
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.approvalsLoading = false;
        state.actionError = action.payload;
      })

      // Academics
      .addCase(fetchAcademicClasses.fulfilled, (state, action) => {
        state.classes = action.payload;
      })
      .addCase(fetchAcademicSections.fulfilled, (state, action) => {
        state.sections = action.payload;
      })
      .addCase(fetchAcademicSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
      })

      // Teaching Assignments
      .addCase(fetchTeachingAssignments.pending, (state) => {
        state.assignmentsLoading = true;
      })
      .addCase(fetchTeachingAssignments.fulfilled, (state, action) => {
        state.assignmentsLoading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchTeachingAssignments.rejected, (state, action) => {
        state.assignmentsLoading = false;
        state.actionError = action.payload;
      })

      // Attendance Analytics
      .addCase(fetchAttendanceAnalytics.pending, (state) => {
        state.attendanceLoading = true;
      })
      .addCase(fetchAttendanceAnalytics.fulfilled, (state, action) => {
        state.attendanceLoading = false;
        state.attendanceAnalytics = action.payload;
      })
      .addCase(fetchAttendanceAnalytics.rejected, (state, action) => {
        state.attendanceLoading = false;
        state.actionError = action.payload;
      })

      // Exams
      .addCase(fetchExamsList.pending, (state) => {
        state.examsLoading = true;
      })
      .addCase(fetchExamsList.fulfilled, (state, action) => {
        state.examsLoading = false;
        state.exams = action.payload;
      })
      .addCase(fetchExamsList.rejected, (state, action) => {
        state.examsLoading = false;
        state.actionError = action.payload;
      })
      .addCase(fetchExamResults.fulfilled, (state, action) => {
        state.activeExamResults = action.payload;
      })

      // Transfers
      .addCase(fetchIncomingTransfers.pending, (state) => {
        state.transfersLoading = true;
      })
      .addCase(fetchIncomingTransfers.fulfilled, (state, action) => {
        state.transfersLoading = false;
        state.transfers = action.payload;
      })
      .addCase(fetchIncomingTransfers.rejected, (state, action) => {
        state.transfersLoading = false;
        state.actionError = action.payload;
      })

      // Notices
      .addCase(fetchSchoolNotices.pending, (state) => {
        state.noticesLoading = true;
      })
      .addCase(fetchSchoolNotices.fulfilled, (state, action) => {
        state.noticesLoading = false;
        state.notices = action.payload;
      })
      .addCase(fetchSchoolNotices.rejected, (state, action) => {
        state.noticesLoading = false;
        state.actionError = action.payload;
      })

      // Student Directory
      .addCase(fetchSchoolStudents.pending, (state) => {
        state.studentsLoading = true;
      })
      .addCase(fetchSchoolStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.students = action.payload?.students || [];
        state.studentsPagination = action.payload?.pagination || state.studentsPagination;
      })
      .addCase(fetchSchoolStudents.rejected, (state, action) => {
        if (action.payload !== 'REQUEST_ABORTED') {
          state.studentsLoading = false;
          state.actionError = action.payload;
        }
      });
  },
});

export const { clearActionError } = hmSlice.actions;
export default hmSlice.reducer;
