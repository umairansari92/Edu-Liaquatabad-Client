import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Megaphone,
  Calendar,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Radio,
  FileText,
  AlertTriangle,
  Download,
  Info,
} from 'lucide-react';
import announcementService from '../../services/announcementService.js';

const formatPKTDateTime = (isoDateString) => {
  if (!isoDateString) return 'Recent Notice';
  try {
    return new Date(isoDateString).toLocaleString('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' PKT';
  } catch (_) {
    return 'Recent Notice';
  }
};

const formatPKTDate = (isoDateString) => {
  if (!isoDateString) return 'As specified';
  try {
    return new Date(isoDateString).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (_) {
    return 'As specified';
  }
};

/**
 * 📣 OfficialAnnouncementHero
 *
 * Prominent, attractive official announcement hero card for staff dashboards.
 * Replaces oversized operational banners with authoritative institutional announcements:
 * - Gazetted School Holidays & Emergency Closures
 * - Executive Town Education Directives (Admins / TMC)
 * - School Circulars & Pinned Notices (Head Masters)
 *
 * Features multi-item carousel, priority-based ranking, and neutral operational standby mode.
 */
export const OfficialAnnouncementHero = ({
  todayClosure = null,
  circulars = [],
  schoolName = 'Assigned Campus',
  onViewAllNotices = null,
}) => {
  const [executiveAnnouncement, setExecutiveAnnouncement] = useState(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch live active executive announcement on mount
  useEffect(() => {
    let isSubscribed = true;
    const loadExecutiveNotice = async () => {
      const activeData = await announcementService.getActiveAnnouncement();
      if (isSubscribed && activeData) {
        setExecutiveAnnouncement(activeData);
      }
    };
    loadExecutiveNotice();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Aggregate announcements from multiple authoritative streams
  const aggregatedAnnouncements = useMemo(() => {
    const announcementList = [];

    // Stream 1: School Holiday or Emergency Closure (Highest Operational Precedence)
    if (todayClosure && (todayClosure.isClosed || todayClosure.holiday)) {
      const isEmergencyClosure = todayClosure.type === 'EMERGENCY_CLOSURE';
      const closureTitle = todayClosure.title || (isEmergencyClosure ? 'Emergency Campus Closure Directive' : 'Official School Holiday Announcement');
      const closureReason = todayClosure.reason || 'All schools under the relevant administrative jurisdiction will remain closed on the announced date due to official departmental orders.';
      const holidayEffective = todayClosure.holiday?.startDate
        ? `${formatPKTDate(todayClosure.holiday.startDate)}${todayClosure.holiday.endDate ? ` to ${formatPKTDate(todayClosure.holiday.endDate)}` : ''}`
        : 'Effective Today';

      announcementList.push({
        id: 'system-today-closure',
        categoryTag: isEmergencyClosure ? 'EMERGENCY DIRECTIVE · TMC EDUCATION' : 'OFFICIAL ANNOUNCEMENT · TMC EDUCATION',
        priorityBadge: isEmergencyClosure ? 'Urgent' : 'Important',
        badgeVariant: isEmergencyClosure ? 'urgent' : 'important',
        title: closureTitle,
        message: closureReason,
        effectiveDate: holidayEffective,
        issuedBy: 'Education Department · TMC Liaquatabad',
        publishedAt: todayClosure.holiday?.createdAt || new Date().toISOString(),
        priorityWeight: 100,
        actionType: 'CALENDAR',
      });
    }

    // Stream 2: Executive Town Announcements (Admin / Super Admin / Root Admin)
    if (executiveAnnouncement && executiveAnnouncement.status === 'ACTIVE') {
      const isCritical = executiveAnnouncement.type === 'CRITICAL';
      const isHoliday = executiveAnnouncement.type === 'HOLIDAY';

      announcementList.push({
        id: `exec-${executiveAnnouncement._id}`,
        categoryTag: 'OFFICIAL ANNOUNCEMENT · TMC EDUCATION',
        priorityBadge: isCritical ? 'Urgent' : isHoliday ? 'Important' : 'Official',
        badgeVariant: isCritical ? 'urgent' : isHoliday ? 'important' : 'normal',
        title: executiveAnnouncement.title,
        message: executiveAnnouncement.message,
        effectiveDate: executiveAnnouncement.eventDate ? formatPKTDate(executiveAnnouncement.eventDate) : 'Immediate Effect',
        issuedBy: `${executiveAnnouncement.announcerName} (${executiveAnnouncement.announcerDesignation})`,
        publishedAt: executiveAnnouncement.createdAt,
        priorityWeight: isCritical ? 90 : isHoliday ? 85 : 70,
        actionType: 'EXECUTIVE',
      });
    }

    // Stream 3: School Circulars & Head Master Directives (Document System)
    if (Array.isArray(circulars) && circulars.length > 0) {
      circulars.slice(0, 5).forEach((circularItem) => {
        const isUrgent = circularItem.priority === 'URGENT';
        const isPinned = Boolean(circularItem.isPinned);

        // Include all urgent or pinned circulars, or top 2 general notices
        if (isUrgent || isPinned || announcementList.length < 2) {
          announcementList.push({
            id: `circular-${circularItem._id}`,
            categoryTag: `OFFICIAL CIRCULAR · ${(schoolName || 'SCHOOL CAMPUS').toUpperCase()}`,
            priorityBadge: isUrgent ? 'Urgent' : isPinned ? 'Important' : 'Notice',
            badgeVariant: isUrgent ? 'urgent' : isPinned ? 'important' : 'normal',
            title: circularItem.title,
            message: circularItem.description || 'Official circular published by the school administration for teaching faculty.',
            effectiveDate: formatPKTDate(circularItem.createdAt),
            issuedBy: circularItem.publisherRole === 'HM' ? 'Office of the Head Master' : 'Authorized Administration',
            publishedAt: circularItem.createdAt,
            fileUrl: circularItem.fileUrl,
            priorityWeight: isUrgent ? 80 : isPinned ? 60 : 40,
            actionType: 'DOCUMENT',
          });
        }
      });
    }

    // Sort announcements by priority weight descending, then publication time descending
    return announcementList.sort((firstItem, secondItem) => {
      if (secondItem.priorityWeight !== firstItem.priorityWeight) {
        return secondItem.priorityWeight - firstItem.priorityWeight;
      }
      return new Date(secondItem.publishedAt) - new Date(firstItem.publishedAt);
    });
  }, [todayClosure, executiveAnnouncement, circulars, schoolName]);

  const totalAnnouncementCount = aggregatedAnnouncements.length;

  // Auto-cycle carousel every 8 seconds if not hovered and multiple items exist
  useEffect(() => {
    if (totalAnnouncementCount <= 1 || isPaused) return;

    const intervalTimer = setInterval(() => {
      setActiveItemIndex((previousIndex) => (previousIndex + 1) % totalAnnouncementCount);
    }, 8000);

    return () => clearInterval(intervalTimer);
  }, [totalAnnouncementCount, isPaused]);

  // Safe clamp for active index
  const safeItemIndex = activeItemIndex < totalAnnouncementCount ? activeItemIndex : 0;
  const currentAnnouncement = aggregatedAnnouncements[safeItemIndex] || null;

  const handleNextAnnouncement = useCallback(() => {
    setActiveItemIndex((previousIndex) => (previousIndex + 1) % totalAnnouncementCount);
  }, [totalAnnouncementCount]);

  const handlePreviousAnnouncement = useCallback(() => {
    setActiveItemIndex((previousIndex) => (previousIndex - 1 + totalAnnouncementCount) % totalAnnouncementCount);
  }, [totalAnnouncementCount]);

  // ─── STATE A: NEUTRAL OPERATIONAL STANDBY (When no active announcements exist) ───
  if (!currentAnnouncement) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#142d1f] via-[#173826] to-[#1c432d] text-white p-5 sm:p-6 mb-6 shadow-sm border border-[#224f35]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300/90">
                TMC EDUCATION NETWORK · {schoolName.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Campus Operational · Regular Academic Schedule Active
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-2xl">
              No emergency closures or critical notices currently active. School faculties and academic periods are operating under standard official timetable.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> All Systems Normal
            </span>
            {onViewAllNotices && (
              <button
                type="button"
                onClick={onViewAllNotices}
                className="px-3 py-1 rounded-xl text-xs font-bold text-emerald-200 hover:text-white hover:bg-white/10 transition border border-white/10 cursor-pointer"
              >
                Notice Board
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── STATE B: ACTIVE ATTRACTIVE OFFICIAL ANNOUNCEMENT HERO ───────────────────
  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-2xl bg-[#183925] text-white p-5 sm:p-6 mb-6 shadow-md border border-[#255234] transition-all duration-300"
      style={{
        backgroundImage: 'radial-gradient(ellipse at top right, rgba(46, 110, 69, 0.35), transparent 70%), linear-gradient(to bottom, #183925, #142f1f)',
      }}
    >
      {/* ─── Header: Megaphone Icon, Tag, & Priority Pill Badge ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-800/50 border border-emerald-600/30 text-emerald-300">
            <Megaphone className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-emerald-200/90">
            {currentAnnouncement.categoryTag}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Pill Badge */}
          {currentAnnouncement.badgeVariant === 'urgent' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-rose-900/70 text-rose-200 border border-rose-500/40">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
              {currentAnnouncement.priorityBadge}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide bg-[#225736] text-[#69dc8f] border border-[#2d6f46]">
              {currentAnnouncement.priorityBadge}
            </span>
          )}

          {/* Multi-Item Carousel Navigation Controls */}
          {totalAnnouncementCount > 1 && (
            <div className="flex items-center gap-1 ml-2 bg-black/25 px-2 py-0.5 rounded-full border border-white/10 text-xs">
              <button
                type="button"
                onClick={handlePreviousAnnouncement}
                className="p-1 text-emerald-200 hover:text-white transition cursor-pointer"
                title="Previous announcement"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-emerald-200/90 px-1">
                {safeItemIndex + 1}/{totalAnnouncementCount}
              </span>
              <button
                type="button"
                onClick={handleNextAnnouncement}
                className="p-1 text-emerald-200 hover:text-white transition cursor-pointer"
                title="Next announcement"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Body: Announcement Headline & Detailed Instructions ─── */}
      <div className="mt-3.5 space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          {currentAnnouncement.title}
        </h2>
        <p className="text-xs sm:text-sm text-[#c3dac9] font-normal leading-relaxed max-w-4xl line-clamp-3 sm:line-clamp-none">
          {currentAnnouncement.message}
        </p>
      </div>

      {/* ─── Metadata Strip: Effective Date & Issuing Official ─── */}
      <div className="mt-4 pt-3 border-t border-emerald-800/40 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#95b89e]">
        <div className="flex items-center gap-1.5 font-medium text-emerald-100">
          <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
          <span>Effective date: <strong className="font-bold text-white">{currentAnnouncement.effectiveDate}</strong></span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5 font-medium text-emerald-100">
          <span>Issued by: <strong className="font-bold text-white">{currentAnnouncement.issuedBy}</strong></span>
        </div>
      </div>

      {/* ─── Footer: Publication Timestamp & Contextual Action Link ─── */}
      <div className="mt-3 flex items-center justify-between text-xs text-[#95b89e] pt-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Published: {formatPKTDateTime(currentAnnouncement.publishedAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {currentAnnouncement.fileUrl ? (
            <a
              href={currentAnnouncement.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-100 font-bold text-xs transition border border-emerald-600/40"
            >
              <Download className="w-3.5 h-3.5" /> Download Order PDF
            </a>
          ) : onViewAllNotices ? (
            <button
              type="button"
              onClick={onViewAllNotices}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-white transition cursor-pointer group"
            >
              <span>View Notice Board</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Subtle indicator dots for multiple items */}
      {totalAnnouncementCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-2">
          {aggregatedAnnouncements.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveItemIndex(index)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                index === safeItemIndex ? 'w-6 bg-emerald-400' : 'w-1.5 bg-emerald-800/80 hover:bg-emerald-600'
              }`}
              aria-label={`Go to announcement ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficialAnnouncementHero;

