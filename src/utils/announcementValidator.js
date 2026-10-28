/**
 * 🛡️ Announcement Publication Window, Expiry & Audience Eligibility Validator
 *
 * Enforces authoritative rules across both client dashboards and backend lifecycle:
 * 1. Cancelled/Archived: Ineligible if status is 'ARCHIVED', 'DRAFT', or 'CANCELLED'.
 * 2. Scheduled: Ineligible if scheduledAt / publishAt is in the future.
 * 3. Explicit expiresAt: Ineligible if current time >= expiresAt.
 * 4. Effective / Event Date: Ineligible if eventDate or effectiveDate has concluded.
 * 5. Default Active Hero TTL (when expiresAt is omitted):
 *    - Urgent notices: Maximum 72 hours (3 days) from creation.
 *    - Normal notices: Maximum 7 days from creation.
 *    Older notices are excluded from the active hero and preserved in the Notice Board archive.
 * 6. Audience Matching: Confines display strictly to matching user role or 'ALL'.
 */
export const isAnnouncementActiveAndEligible = (item, currentUserRole = null, now = new Date()) => {
  if (!item) return false;

  // 1. Status Guard
  const status = String(item.status || 'PUBLISHED').toUpperCase();
  if (['ARCHIVED', 'DRAFT', 'CANCELLED', 'INACTIVE'].includes(status)) {
    return false;
  }

  const currentTime = now.getTime();

  // 2. Scheduled Publication Window Guard
  const scheduledTime = item.scheduledAt || item.publishAt;
  if (scheduledTime) {
    const scheduledDateMs = new Date(scheduledTime).getTime();
    if (!isNaN(scheduledDateMs) && scheduledDateMs > currentTime) {
      return false;
    }
  }

  // 3. Explicit Expiry Guard
  if (item.expiresAt) {
    const expiresDateMs = new Date(item.expiresAt).getTime();
    if (!isNaN(expiresDateMs) && currentTime >= expiresDateMs) {
      return false;
    }
  }

  // 4. Effective / Event Date Fallback Guard (When explicit expiresAt is not provided)
  if (!item.expiresAt) {
    const effectiveTime = item.effectiveDate || item.eventDate;
    if (effectiveTime) {
      const effectiveDate = new Date(effectiveTime);
      if (!isNaN(effectiveDate.getTime())) {
        // Set to end of day in PKT (23:59:59.999)
        const endOfEffectiveDay = new Date(effectiveDate);
        endOfEffectiveDay.setHours(23, 59, 59, 999);
        if (currentTime > endOfEffectiveDay.getTime()) {
          return false;
        }
      }
    }
  }

  // 5. Default Hero Display TTL Guard (When expiresAt is omitted)
  if (!item.expiresAt) {
    const createdDateMs = item.createdAt ? new Date(item.createdAt).getTime() : currentTime;
    const isUrgent = item.priority === 'URGENT' || item.type === 'CRITICAL';
    const maxTtlMs = isUrgent ? (3 * 24 * 60 * 60 * 1000) : (7 * 24 * 60 * 60 * 1000);
    if (currentTime - createdDateMs > maxTtlMs) {
      return false;
    }
  }

  // 6. Audience Targeting Guard
  if (currentUserRole && Array.isArray(item.targetAudience) && item.targetAudience.length > 0) {
    const normalizedAudiences = item.targetAudience.map((audienceGroup) => String(audienceGroup).toUpperCase());
    if (!normalizedAudiences.includes('ALL')) {
      const roleUpper = String(currentUserRole).toUpperCase();
      let isTargeted = false;
      if (roleUpper === 'TEACHER' && normalizedAudiences.includes('TEACHERS')) isTargeted = true;
      if (roleUpper === 'STUDENT' && normalizedAudiences.includes('STUDENTS')) isTargeted = true;
      if (roleUpper === 'PARENT' && normalizedAudiences.includes('PARENTS')) isTargeted = true;
      if (roleUpper === 'PEON' && (normalizedAudiences.includes('NON_TEACHING_STAFF') || normalizedAudiences.includes('PEON'))) isTargeted = true;
      if (roleUpper === 'HM' && normalizedAudiences.includes('HM')) isTargeted = true;
      if (['ADMIN', 'SUPERVISOR', 'SUPER_ADMIN', 'ROOT_ADMIN'].includes(roleUpper) &&
          (normalizedAudiences.includes('OFFICE_STAFF') || normalizedAudiences.includes('GOVERNMENT_OFFICERS') || normalizedAudiences.includes('ADMIN'))) {
        isTargeted = true;
      }
      if (!isTargeted) return false;
    }
  }

  return true;
};

export default isAnnouncementActiveAndEligible;

