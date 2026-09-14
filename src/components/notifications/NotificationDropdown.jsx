import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  respondToAccessRequest,
  setActiveCategory,
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
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'STAFF_PRIVACY', label: 'Privacy & Consents' },
  { id: 'ACADEMIC', label: 'Academics' },
  { id: 'GOVERNANCE', label: 'Governance' },
];

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    actionLoading,
    activeCategory,
  } = useSelector((state) => state.notifications);

  useEffect(() => {
    if (isOpen) {
      const params = activeCategory === 'ALL' ? {} : { category: activeCategory };
      dispatch(fetchNotifications(params));
    }
  }, [isOpen, activeCategory, dispatch]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark notifications read.');
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markNotificationAsRead(notification._id));
    }
  };

  const handleConsentResponse = async (notification, decision) => {
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
          decisionRemarks: decision === 'ALLOW' ? 'Approved by staff member via notification' : 'Denied by staff member via notification',
        })
      ).unwrap();

      toast.success(
        decision === 'ALLOW'
          ? 'Profile PDF download granted to requester.'
          : 'Profile PDF download denied.'
      );
    } catch (err) {
      toast.error(err || 'Failed to record consent response.');
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeCategory === 'ALL') return true;
    return item.category === activeCategory;
  });

  const getCategoryIcon = (notificationType, category) => {
    if (notificationType === 'PDF_ACCESS_REQUEST') return <FileText className="w-4 h-4 text-[#006AC7]" />;
    if (notificationType === 'PDF_ACCESS_APPROVED') return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    if (notificationType === 'PDF_ACCESS_DENIED') return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    if (notificationType === 'PDF_DOWNLOADED') return <FileText className="w-4 h-4 text-purple-600" />;
    if (category === 'ACADEMIC') return <BookOpen className="w-4 h-4 text-blue-600" />;
    if (category === 'GOVERNANCE') return <Calendar className="w-4 h-4 text-amber-600" />;
    return <Sparkles className="w-4 h-4 text-[#526477]" />;
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
    return date.toLocaleDateString();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#102033]">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#006AC7] text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-[#006AC7] hover:text-[#005299] flex items-center gap-1 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => dispatch(setActiveCategory(cat.id))}
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[#006AC7] text-white shadow-xs'
                : 'text-[#526477] hover:bg-slate-100 hover:text-[#102033]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notification Items List */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[420px]">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#006AC7]" />
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-500">No notifications in this category</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isAccessRequest = n.notificationType === 'PDF_ACCESS_REQUEST';
            const requestStatus = n.metadata?.status;

            return (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 transition-colors cursor-pointer text-left ${
                  !n.isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs flex-shrink-0 mt-0.5">
                    {getCategoryIcon(n.notificationType, n.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs font-bold leading-snug truncate ${
                          !n.isRead ? 'text-[#102033]' : 'text-slate-700'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[#526477] leading-relaxed line-clamp-2 mb-1.5">
                      {n.message}
                    </p>

                    {/* Metadata Context Badge */}
                    {n.metadata?.requesterName && (
                      <div className="text-[11px] text-slate-500 bg-slate-100/70 rounded-md px-2 py-0.5 inline-block mb-1.5 font-medium">
                        Requester: <span className="text-[#102033] font-semibold">{n.metadata.requesterName}</span> ({n.metadata.requesterRole || 'Official'})
                      </div>
                    )}

                    {/* PDF Access Request Inline Consent Buttons */}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConsentResponse(n, 'ALLOW');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              Allow Access
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConsentResponse(n, 'DENY');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-[11px] font-bold transition-colors disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-medium">
          DMC Liaquatabad Town Education Event Notification Service
        </p>
      </div>
    </div>
  );
};

export default NotificationDropdown;
