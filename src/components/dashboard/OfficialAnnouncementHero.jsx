import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Megaphone,
  Calendar,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Download,
  Users,
} from 'lucide-react';
import announcementService from '../../services/announcementService.js';
import { isAnnouncementActiveAndEligible } from '../../utils/announcementValidator.js';

export { isAnnouncementActiveAndEligible };

const formatPKTDate = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  }
  const dateObj = new Date(dateValue);
  if (isNaN(dateObj.getTime())) return String(dateValue);
  return dateObj.toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatPKTDateTime = (dateValue) => {
  if (!dateValue) return '';
  const dateObj = new Date(dateValue);
  if (isNaN(dateObj.getTime())) return String(dateValue);
  return dateObj.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * 📣 OfficialAnnouncementHero
 *
 * Modern 2026 SaaS Institutional Announcement Hero.
 *
 * Dynamic Layout Swapping Behavior:
 * - When at least one eligible active announcement exists:
 *   Renders the prominent announcement hero card at the top of the dashboard.
 * - When NO eligible active announcements exist (all expired, cancelled, or none active):
 *   Returns `null`. This allows the section beneath it (e.g. Live Schedule & Period Status HUD)
 *   to naturally occupy the prominent top hero position without DOM duplication or empty gaps.
 */
export const OfficialAnnouncementHero = ({
  todayClosure = null,
  circulars = [],
  schoolName = 'Assigned Campus',
  userRole = 'TEACHER',
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

  // Aggregate announcements from multiple authoritative streams with strict expiry & audience gating
  const aggregatedAnnouncements = useMemo(() => {
    const announcementList = [];
    const nowMoment = new Date();

    // Stream 1: School Holiday or Emergency Closure (Authoritative Single Source of Truth: HolidayCalendar)
    if (todayClosure && (todayClosure.isClosed || todayClosure.holiday)) {
      const holidayItem = todayClosure.holiday;
      const holidayTypeUpper = String(todayClosure.type || holidayItem?.holidayType || '').toUpperCase();
      const isEmergencyClosure = holidayTypeUpper === 'EMERGENCY_CLOSURE' || holidayTypeUpper === 'RAIN_EMERGENCY';
      const isGazetted = holidayTypeUpper === 'GAZETTED';
      const isBreak = ['SUMMER_BREAK', 'WINTER_BREAK'].includes(holidayTypeUpper);

      const closureTitle = todayClosure.title || (isEmergencyClosure ? 'Emergency Campus Closure Directive' : 'Official School Holiday Announcement');
      const closureReason = todayClosure.reason || 'All schools under the relevant administrative jurisdiction will remain closed on the announced date due to official departmental orders.';
      const holidayEffective = holidayItem?.startDate
        ? `${formatPKTDate(holidayItem.startDate)}${holidayItem.endDate ? ` to ${formatPKTDate(holidayItem.endDate)}` : ''}`
        : 'Effective Today';

      const priorityBadgeLabel = isEmergencyClosure ? 'Urgent' : isGazetted ? 'Gazetted' : isBreak ? 'Break' : 'Important';
      const issuingAuthorityLabel = holidayItem?.scopeType === 'TOWN' ? 'Municipal Authority · TMC Education' : (schoolName || 'Office of the Head Master');

      announcementList.push({
        id: `system-today-closure-${holidayItem?._id || 'active'}`,
        categoryTag: isEmergencyClosure ? 'EMERGENCY DIRECTIVE · TMC EDUCATION' : 'OFFICIAL ANNOUNCEMENT · TMC EDUCATION',
        priorityBadge: priorityBadgeLabel,
        badgeVariant: isEmergencyClosure ? 'urgent' : 'important',
        semanticTheme: isEmergencyClosure ? 'urgent' : 'important',
        title: closureTitle,
        message: closureReason,
        effectiveDate: holidayEffective,
        issuedBy: issuingAuthorityLabel,
        publishedAt: holidayItem?.createdAt || nowMoment.toISOString(),
        expiresAt: holidayItem?.endDate || null,
        priorityWeight: isEmergencyClosure ? 100 : 95,
        actionType: 'CALENDAR',
      });
    }

    // Stream 2: Executive Town Announcements (Admin / Super Admin / Root Admin)
    if (executiveAnnouncement && isAnnouncementActiveAndEligible(executiveAnnouncement, userRole, nowMoment)) {
      const isCritical = executiveAnnouncement.type === 'CRITICAL' || executiveAnnouncement.priority === 'URGENT';
      const isHoliday = executiveAnnouncement.type === 'HOLIDAY';

      announcementList.push({
        id: `exec-${executiveAnnouncement._id}`,
        categoryTag: 'OFFICIAL ANNOUNCEMENT · TMC EDUCATION',
        priorityBadge: isCritical ? 'Urgent' : isHoliday ? 'Important' : 'Official',
        badgeVariant: isCritical ? 'urgent' : isHoliday ? 'important' : 'normal',
        semanticTheme: isCritical ? 'urgent' : isHoliday ? 'important' : 'normal',
        title: executiveAnnouncement.title,
        message: executiveAnnouncement.message,
        effectiveDate: executiveAnnouncement.eventDate ? formatPKTDate(executiveAnnouncement.eventDate) : 'Immediate Effect',
        issuedBy: `${executiveAnnouncement.announcerName} (${executiveAnnouncement.announcerDesignation})`,
        publishedAt: executiveAnnouncement.createdAt,
        expiresAt: executiveAnnouncement.expiresAt || null,
        priorityWeight: isCritical ? 90 : isHoliday ? 85 : 70,
        actionType: 'EXECUTIVE',
      });
    }

    // Stream 3: School Circulars & Head Master Directives (Document System)
    if (Array.isArray(circulars) && circulars.length > 0) {
      circulars.forEach((circularItem) => {
        // Enforce strict publication window, audience targeting, and expiry
        if (!isAnnouncementActiveAndEligible(circularItem, userRole, nowMoment)) {
          return;
        }

        const isUrgent = circularItem.priority === 'URGENT';
        const isPinned = Boolean(circularItem.isPinned);

        announcementList.push({
          id: `circular-${circularItem._id}`,
          categoryTag: `OFFICIAL CIRCULAR · ${(schoolName || 'SCHOOL CAMPUS').toUpperCase()}`,
          priorityBadge: isUrgent ? 'Urgent' : isPinned ? 'Important' : 'Notice',
          badgeVariant: isUrgent ? 'urgent' : isPinned ? 'important' : 'normal',
          semanticTheme: isUrgent ? 'urgent' : isPinned ? 'important' : 'normal',
          title: circularItem.title,
          message: circularItem.description || 'Official circular published by the school administration for authorized faculty.',
          effectiveDate: circularItem.effectiveDate ? formatPKTDate(circularItem.effectiveDate) : formatPKTDate(circularItem.createdAt),
          issuedBy: circularItem.publisherRole === 'HM' ? 'Office of the Head Master' : 'Authorized Administration',
          publishedAt: circularItem.createdAt,
          expiresAt: circularItem.expiresAt || null,
          fileUrl: circularItem.fileUrl,
          priorityWeight: isUrgent ? 80 : isPinned ? 60 : 40,
          actionType: 'DOCUMENT',
        });
      });
    }

    // Sort announcements by priority weight descending, then publication time descending
    return announcementList.sort((firstItem, secondItem) => {
      if (secondItem.priorityWeight !== firstItem.priorityWeight) {
        return secondItem.priorityWeight - firstItem.priorityWeight;
      }
      return new Date(secondItem.publishedAt) - new Date(firstItem.publishedAt);
    });
  }, [todayClosure, executiveAnnouncement, circulars, schoolName, userRole]);

  const totalAnnouncementCount = aggregatedAnnouncements.length;

  // Auto-cycle carousel every 8 seconds if not paused and multiple items exist
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

  // Keyboard navigation support
  const handleKeyDown = useCallback((keyboardEvent) => {
    if (totalAnnouncementCount <= 1) return;
    if (keyboardEvent.key === 'ArrowLeft') {
      handlePreviousAnnouncement();
    } else if (keyboardEvent.key === 'ArrowRight') {
      handleNextAnnouncement();
    }
  }, [totalAnnouncementCount, handlePreviousAnnouncement, handleNextAnnouncement]);

  // ─── STATE A: NO ELIGIBLE ACTIVE ANNOUNCEMENTS ─────────────────────────────
  // Per Phase 3 & Screenshot 2 Layout Swapping:
  // When no eligible announcement exists, this component returns null so that
  // the section directly beneath it (Live Schedule & Period Status HUD)
  // naturally occupies the prominent top hero position without DOM duplication.
  if (!currentAnnouncement) {
    return null;
  }

  // ─── STATE B: ACTIVE ATTRACTIVE OFFICIAL ANNOUNCEMENT HERO ───────────────────
  // Semantic theme styling mapping
  const themeStyles = {
    urgent: {
      cardBg: 'bg-[#2b1014]',
      cardBorder: 'border-[#5c1c24]',
      glowGradient: 'radial-gradient(ellipse at top right, rgba(168, 40, 56, 0.35), transparent 70%), linear-gradient(to bottom, #2b1014, #210c0f)',
      categoryColor: 'text-rose-200/90',
      iconBoxBg: 'bg-rose-900/60 border-rose-600/40 text-rose-300',
      badge: 'bg-rose-950 text-rose-200 border-rose-500/50',
      textColor: 'text-[#ecd2d5]',
      metaBorder: 'border-rose-900/50',
      metaColor: 'text-[#d9a8ae]',
      navActive: 'bg-rose-400',
      navInactive: 'bg-rose-900/80 hover:bg-rose-700',
    },
    important: {
      cardBg: 'bg-[#183925]',
      cardBorder: 'border-[#255234]',
      glowGradient: 'radial-gradient(ellipse at top right, rgba(46, 110, 69, 0.35), transparent 70%), linear-gradient(to bottom, #183925, #142f1f)',
      categoryColor: 'text-emerald-200/90',
      iconBoxBg: 'bg-emerald-800/50 border-emerald-600/30 text-emerald-300',
      badge: 'bg-[#225736] text-[#69dc8f] border-[#2d6f46]',
      textColor: 'text-[#c3dac9]',
      metaBorder: 'border-emerald-800/40',
      metaColor: 'text-[#95b89e]',
      navActive: 'bg-emerald-400',
      navInactive: 'bg-emerald-800/80 hover:bg-emerald-600',
    },
    normal: {
      cardBg: 'bg-[#112338]',
      cardBorder: 'border-[#1e3b5e]',
      glowGradient: 'radial-gradient(ellipse at top right, rgba(30, 80, 130, 0.35), transparent 70%), linear-gradient(to bottom, #112338, #0e1c2d)',
      categoryColor: 'text-sky-200/90',
      iconBoxBg: 'bg-sky-900/50 border-sky-600/30 text-sky-300',
      badge: 'bg-[#183654] text-[#7ec2f5] border-[#295480]',
      textColor: 'text-[#c0d4e8]',
      metaBorder: 'border-sky-800/40',
      metaColor: 'text-[#96b7d6]',
      navActive: 'bg-sky-400',
      navInactive: 'bg-sky-900/80 hover:bg-sky-600',
    },
  };

  const currentTheme = themeStyles[currentAnnouncement.semanticTheme] || themeStyles.important;

  return (
    <div
      role="region"
      aria-label="Official announcements"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={`relative overflow-hidden rounded-2xl ${currentTheme.cardBg} text-white p-5 sm:p-6 mb-6 shadow-md border ${currentTheme.cardBorder} transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-white/30`}
      style={{ backgroundImage: currentTheme.glowGradient }}
    >
      {/* ─── Header: Megaphone Icon, Category Tag, & Priority Pill Badge ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg border ${currentTheme.iconBoxBg}`}>
            {currentAnnouncement.semanticTheme === 'urgent' ? (
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            ) : (
              <Megaphone className="w-4 h-4" />
            )}
          </div>
          <span className={`text-xs sm:text-[13px] font-black uppercase tracking-wider ${currentTheme.categoryColor}`}>
            {currentAnnouncement.categoryTag}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Pill Badge */}
          {currentAnnouncement.badgeVariant === 'urgent' ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-2xs ${currentTheme.badge}`}>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
              {currentAnnouncement.priorityBadge}
            </span>
          ) : (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide border ${currentTheme.badge}`}>
              {currentAnnouncement.priorityBadge}
            </span>
          )}

          {/* Multi-Item Carousel Navigation Controls */}
          {totalAnnouncementCount > 1 && (
            <div className="flex items-center gap-1 ml-2 bg-black/30 px-2 py-0.5 rounded-full border border-white/10 text-xs">
              <button
                type="button"
                onClick={handlePreviousAnnouncement}
                className="p-1 text-white/80 hover:text-white transition cursor-pointer"
                title="Previous announcement (Left Arrow)"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-white/90 px-1">
                {safeItemIndex + 1}/{totalAnnouncementCount}
              </span>
              <button
                type="button"
                onClick={handleNextAnnouncement}
                className="p-1 text-white/80 hover:text-white transition cursor-pointer"
                title="Next announcement (Right Arrow)"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Body: Headline & Message Preview ─── */}
      <div className="mt-3.5 space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          {currentAnnouncement.title}
        </h2>
        <p className={`text-xs sm:text-sm ${currentTheme.textColor} font-normal leading-relaxed max-w-4xl line-clamp-3 sm:line-clamp-none`}>
          {currentAnnouncement.message}
        </p>
      </div>

      {/* ─── Metadata Strip: Effective Date & Issuing Official ─── */}
      <div className={`mt-4 pt-3 border-t ${currentTheme.metaBorder} flex flex-wrap items-center gap-x-3 gap-y-2 text-xs ${currentTheme.metaColor}`}>
        <div className="flex items-center gap-1.5 font-medium text-white/90">
          <CalendarDays className="w-3.5 h-3.5 text-white/70" />
          <span>Effective date: <strong className="font-bold text-white">{currentAnnouncement.effectiveDate}</strong></span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5 font-medium text-white/90">
          <span>Issued by: <strong className="font-bold text-white">{currentAnnouncement.issuedBy}</strong></span>
        </div>
        {currentAnnouncement.expiresAt && (
          <>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-medium text-white/80">
              <Clock className="w-3.5 h-3.5 text-white/60" />
              <span>Valid until: <strong>{formatPKTDate(currentAnnouncement.expiresAt)}</strong></span>
            </div>
          </>
        )}
      </div>

      {/* ─── Footer: Publication Timestamp & Action ─── */}
      <div className={`mt-3 flex items-center justify-between text-xs ${currentTheme.metaColor} pt-1`}>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-white/70" />
          <span>Published: {formatPKTDateTime(currentAnnouncement.publishedAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {currentAnnouncement.fileUrl ? (
            <a
              href={currentAnnouncement.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Download Order PDF
            </a>
          ) : onViewAllNotices ? (
            <button
              type="button"
              onClick={onViewAllNotices}
              className="inline-flex items-center gap-1 text-xs font-bold text-white/90 hover:text-white transition cursor-pointer group"
            >
              <span>View Notice Board</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Carousel progress dots */}
      {totalAnnouncementCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-2">
          {aggregatedAnnouncements.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveItemIndex(index)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                index === safeItemIndex ? `w-6 ${currentTheme.navActive}` : `w-1.5 ${currentTheme.navInactive}`
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
