import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  respondToAccessRequest,
  setActiveCategory,
  setActiveTab,
} from '../../store/slices/notificationSlice.js';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  FileText,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Calendar,
  Sparkles,
  Loader2,
  X,
  RefreshCw,
  ExternalLink,
  UserCheck,
  UserX,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRightLeft,
  Mail,
  MailOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils.js';

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'ATTENDANCE', label: 'Attendance & Leaves' },
  { id: 'GOVERNANCE', label: 'Governance & Closures' },
  { id: 'ACADEMIC', label: 'Academics' },
  { id: 'STAFF_PRIVACY', label: 'Privacy & Consents' },
  { id: 'SECURITY', label: 'Security & System' },
];

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    actionLoading,
    activeTab,
    activeCategory,
    error,
  } = useSelector((state) => state.notifications);

  // Fetch when opened
  useEffect(() => {
    if (isOpen) {
      const params = { limit: 30 };
      if (activeCategory !== 'ALL') {
        params.category = activeCategory;
      }
      if (activeTab === 'UNREAD') {
        params.unreadOnly = 'true';
      }
      dispatch(fetchNotifications(params));
    }
  }, [isOpen, activeTab, activeCategory, dispatch]);

  // Click outside and Escape key listeners
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const params = { limit: 30 };
      if (activeCategory !== 'ALL') params.category = activeCategory;
      if (activeTab === 'UNREAD') params.unreadOnly = 'true';
      await dispatch(fetchNotifications(params)).unwrap();
    } catch {
      toast.error('Failed to refresh notifications');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark notifications as read.');
    }
  };

  const handleToggleRead = async (event, notification) => {
    event.stopPropagation();
    try {
      await dispatch(
        markNotificationAsRead({
          notificationId: notification._id,
          isRead: !notification.isRead,
        })
      ).unwrap();
    } catch (toggleError) {
      toast.error(getErrorMessage(toggleError, 'Failed to update notification state.'));
    }
  };

  const handleNotificationClick = (notification) => {
    // If unread, mark it as read
    if (!notification.isRead) {
      dispatch(markNotificationAsRead({ notificationId: notification._id, isRead: true }));
    }

    // If an action link exists, navigate to it and close the panel
    if (notification.actionLink) {
      onClose();
      navigate(notification.actionLink);
    }
  };

  const handleConsentResponse = async (event, notification, decision) => {
    event.stopPropagation();
    const accessRequestId = notification.metadata?.accessRequestId;
    if (!accessRequestId) {
      toast.error('Missing access request identifier.');
      return;
    }

    try {
      await dispatch(
        respondToAccessRequest({
          requestId: accessRequestId,
          decision,
          decisionRemarks:
            decision === 'ALLOW'
              ? 'Approved by staff member via notification'
              : 'Denied by staff member via notification',
        })
      ).unwrap();

      toast.success(
        decision === 'ALLOW'
          ? 'Profile PDF download granted to requester.'
          : 'Profile PDF download denied.'
      );
    } catch (consentError) {
      toast.error(getErrorMessage(consentError, 'Failed to record consent response.'));
    }
  };

  // Filtered notifications
  const displayedNotifications = (notifications || []).filter((item) => {
    // Tab filter
    if (activeTab === 'UNREAD' && item.isRead) return false;

    // Category filter
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'SECURITY') {
      return item.category === 'SECURITY' || item.category === 'SYSTEM';
    }
    return item.category === activeCategory;
  });

  const getNotificationIcon = (notificationType, category) => {
    switch (notificationType) {
      case 'PDF_ACCESS_REQUEST':
        return <FileText className="w-4 h-4 text-[#006AC7]" />;
      case 'PDF_ACCESS_APPROVED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'PDF_ACCESS_DENIED':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'PDF_DOWNLOADED':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'STAFF_ATTENDANCE_APPROVED':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'STAFF_ATTENDANCE_REJECTED':
        return <UserX className="w-4 h-4 text-rose-600" />;
      case 'LEAVE_REQUEST':
        return <CalendarCheck className="w-4 h-4 text-amber-600" />;
      case 'LEAVE_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'LEAVE_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'SCHOOL_CLOSURE':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'CLOSURE_CANCELLED':
        return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'TRANSFER':
      case 'TRANSFER_STATUS':
        return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
      case 'HOMEWORK_CREATED':
      case 'EXAM_RESULT':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      default:
        if (category === 'ATTENDANCE') return <Clock className="w-4 h-4 text-emerald-600" />;
        if (category === 'GOVERNANCE') return <Building2 className="w-4 h-4 text-amber-600" />;
        if (category === 'ACADEMIC') return <BookOpen className="w-4 h-4 text-blue-600" />;
        if (category === 'STAFF_PRIVACY') return <ShieldCheck className="w-4 h-4 text-purple-600" />;
        if (category === 'SECURITY') return <ShieldAlert className="w-4 h-4 text-rose-600" />;
        return <Sparkles className="w-4 h-4 text-[#006AC7]" />;
    }
  };

  const getEventTypeLabel = (notificationType, category) => {
    switch (notificationType) {
      case 'PDF_ACCESS_REQUEST':
        return 'Consent Request';
      case 'PDF_ACCESS_APPROVED':
        return 'Consent Approved';
      case 'PDF_ACCESS_DENIED':
        return 'Consent Declined';
      case 'PDF_DOWNLOADED':
        return 'Profile Download';
      case 'STAFF_ATTENDANCE_APPROVED':
        return 'Attendance Approved';
      case 'STAFF_ATTENDANCE_REJECTED':
        return 'Attendance Rejected';
      case 'APPROVAL_REQUIRED':
        return 'Approval Required';
      case 'LEAVE_REQUEST':
        return 'Leave Submitted';
      case 'LEAVE_APPROVED':
        return 'Leave Approved';
      case 'LEAVE_REJECTED':
        return 'Leave Rejected';
      case 'SCHOOL_CLOSURE':
        return 'School Closure';
      case 'CLOSURE_CANCELLED':
        return 'Closure Rescinded';
      case 'TRANSFER':
      case 'TRANSFER_STATUS':
        return 'Staff Transfer';
      case 'HOMEWORK_CREATED':
        return 'Homework';
      case 'SECURITY_ALERT':
        return 'Security Alert';
      default:
        return category || 'Notification';
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications Center"
      className="absolute right-0 top-12 w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-[#102033] tracking-tight">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#006AC7] text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-[#006AC7] hover:text-[#005299] px-2 py-1 rounded-lg hover:bg-blue-50/60 flex items-center gap-1 transition-colors"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#006AC7]' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close notifications panel"
            aria-label="Close notifications panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Primary View Tabs (All vs Unread) ────────────────────────────────── */}
      <div className="flex items-center px-4 pt-2 bg-slate-50/70 border-b border-slate-100 gap-2">
        <button
          onClick={() => dispatch(setActiveTab('ALL'))}
          className={`pb-2 px-1 text-xs font-bold transition-all relative ${
            activeTab === 'ALL'
              ? 'text-[#006AC7] border-b-2 border-[#006AC7]'
              : 'text-[#526477] hover:text-[#102033]'
          }`}
        >
          All
        </button>

        <button
          onClick={() => dispatch(setActiveTab('UNREAD'))}
          className={`pb-2 px-1 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'UNREAD'
              ? 'text-[#006AC7] border-b-2 border-[#006AC7]'
              : 'text-[#526477] hover:text-[#102033]'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'UNREAD' ? 'bg-[#006AC7] text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── Category Filter Chips ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => dispatch(setActiveCategory(cat.id))}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[#006AC7] text-white shadow-xs'
                : 'text-[#526477] bg-slate-50 hover:bg-slate-100 hover:text-[#102033] border border-slate-200/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── Notification Items List ───────────────────────────────────────── */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[460px] bg-slate-50/30">
        {isLoading && (!notifications || notifications.length === 0) ? (
          <div className="p-10 text-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-[#006AC7]" />
            <p className="text-xs font-semibold text-slate-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <div>
              <p className="text-xs font-bold text-[#102033]">Failed to load notifications</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{error}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#006AC7] text-white hover:bg-[#005299] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-[#006AC7]">
              <Bell className="w-6 h-6 stroke-[1.75]" />
            </div>
            <p className="text-xs font-bold text-[#102033]">
              {activeTab === 'UNREAD' ? 'You are all caught up!' : 'No notifications found'}
            </p>
            <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto">
              {activeTab === 'UNREAD'
                ? 'There are no unread notifications in this category.'
                : 'No notification records have been dispatched to your account yet.'}
            </p>
          </div>
        ) : (
          displayedNotifications.map((notificationItem) => {
            const isAccessRequest = notificationItem.notificationType === 'PDF_ACCESS_REQUEST';
            const requestStatus = notificationItem.metadata?.status;
            const hasActionLink = Boolean(notificationItem.actionLink);

            return (
              <div
                key={notificationItem._id}
                onClick={() => handleNotificationClick(notificationItem)}
                className={`p-3.5 transition-all text-left relative group ${
                  hasActionLink ? 'cursor-pointer' : 'cursor-default'
                } ${
                  !notificationItem.isRead
                    ? 'bg-blue-50/45 hover:bg-blue-50/70 border-l-[3.5px] border-[#006AC7]'
                    : 'bg-white hover:bg-slate-50 border-l-[3.5px] border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Category / Event Icon Avatar */}
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notificationItem.notificationType, notificationItem.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header Row: Type Badge + Timestamp + Actions */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60 uppercase tracking-wider">
                          {getEventTypeLabel(notificationItem.notificationType, notificationItem.category)}
                        </span>
                        {!notificationItem.isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#006AC7] shrink-0"
                            title="Unread"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notificationItem.createdAt)}
                        </span>

                        {/* Individual Toggle Read Action */}
                        <button
                          onClick={(clickEvent) => handleToggleRead(clickEvent, notificationItem)}
                          className="p-1 rounded-md text-slate-400 hover:text-[#006AC7] hover:bg-white transition-colors"
                          title={notificationItem.isRead ? 'Mark as unread' : 'Mark as read'}
                          aria-label={notificationItem.isRead ? 'Mark as unread' : 'Mark as read'}
                        >
                          {notificationItem.isRead ? (
                            <Mail className="w-3.5 h-3.5" />
                          ) : (
                            <MailOpen className="w-3.5 h-3.5 text-[#006AC7]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-xs font-bold leading-snug mb-1 ${
                        !notificationItem.isRead ? 'text-[#102033]' : 'text-slate-700'
                      }`}
                    >
                      {notificationItem.title}
                    </h3>

                    {/* Message Body */}
                    <p className="text-xs text-[#526477] leading-relaxed line-clamp-2 mb-2">
                      {notificationItem.message}
                    </p>

                    {/* Metadata Context Badges */}
                    {notificationItem.metadata?.requesterName && (
                      <div className="text-[11px] text-slate-500 bg-slate-100/80 rounded-md px-2 py-0.5 inline-block mb-1.5 font-medium">
                        Requester: <span className="text-[#102033] font-semibold">{notificationItem.metadata.requesterName}</span> ({notificationItem.metadata.requesterRole || 'Official'})
                      </div>
                    )}
                    {notificationItem.metadata?.attendanceDate && (
                      <div className="text-[11px] text-slate-500 bg-slate-100/80 rounded-md px-2 py-0.5 inline-block mb-1.5 font-medium mr-1.5">
                        Date: <span className="text-[#102033] font-semibold">{notificationItem.metadata.attendanceDate}</span>
                      </div>
                    )}

                    {/* PDF Access Request Inline Consent Actions */}
                    {isAccessRequest && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                        {requestStatus === 'APPROVED' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Approved
                          </span>
                        ) : requestStatus === 'DENIED' ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-0.5 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Denied
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={actionLoading}
                              onClick={(clickEvent) =>
                                handleConsentResponse(clickEvent, notificationItem, 'ALLOW')
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              Allow Access
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={(clickEvent) =>
                                handleConsentResponse(clickEvent, notificationItem, 'DENY')
                              }
                              className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-[11px] font-bold transition-colors disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Destination Link Cue */}
                    {hasActionLink && !isAccessRequest && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#006AC7] group-hover:underline">
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-4">
        <span className="text-[10px] text-slate-400 font-medium">
          DMC Education Notifications
        </span>
        {displayedNotifications.length > 0 && (
          <span className="text-[10px] text-slate-400 font-semibold">
            {displayedNotifications.length} {displayedNotifications.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
