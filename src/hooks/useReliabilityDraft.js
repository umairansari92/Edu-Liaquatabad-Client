import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  saveFormDraft,
  loadFormDraft,
  clearFormDraft,
} from '../services/reliability/draftManager.js';

/**
 * Custom React Hook for form autosave and recovery
 * @param {string} module Module category ('attendance', 'homework', 'marks', etc.)
 * @param {string} [entityId='primary'] Specific entity or section identifier
 * @param {Object} [options={}] Optional configuration (e.g. debounceMs)
 * @returns {Object}
 */
export const useReliabilityDraft = (module, entityId = 'primary', options = {}) => {
  const { user } = useSelector((state) => state.auth);
  const userSessionBinding = user?._id || user?.userId || 'anonymous';
  const customDebounceMs = options?.debounceMs;

  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const isMountedRef = useRef(true);

  // Check for existing draft on component mount or entity change
  useEffect(() => {
    isMountedRef.current = true;
    let isCancelled = false;

    const checkDraft = async () => {
      if (!userSessionBinding || userSessionBinding === 'anonymous' || !module || !entityId) {
        if (!isCancelled && isMountedRef.current) {
          setHasDraft(false);
          setDraftData(null);
          setDraftTimestamp(null);
        }
        return;
      }

      try {
        const existingDraft = await loadFormDraft(userSessionBinding, module, entityId);
        if (!isCancelled && isMountedRef.current) {
          if (existingDraft && existingDraft.payload) {
            setHasDraft(true);
            setDraftData(existingDraft.payload);
            setDraftTimestamp(existingDraft.updatedAt || existingDraft.clientUpdatedAt || Date.now());
          } else {
            setHasDraft(false);
            setDraftData(null);
            setDraftTimestamp(null);
          }
        }
      } catch (draftLoadError) {
        console.warn('[useReliabilityDraft] Error checking draft:', draftLoadError);
      }
    };

    checkDraft();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
    };
  }, [userSessionBinding, module, entityId]);

  // Debounced Save Form Draft
  const saveDraft = useCallback(
    async (payload) => {
      if (!userSessionBinding || userSessionBinding === 'anonymous' || !module || !payload) {
        return false;
      }

      setSaveStatus('saving');
      const savePayload = {
        userSessionBinding,
        module,
        entityId: entityId || 'primary',
        payload,
      };
      if (typeof customDebounceMs === 'number') {
        savePayload.debounceMs = customDebounceMs;
      }

      const isSaveSuccessful = await saveFormDraft(savePayload);

      if (isMountedRef.current) {
        setSaveStatus(isSaveSuccessful ? 'saved' : 'idle');
        if (isSaveSuccessful) {
          setHasDraft(true);
          setDraftData(payload);
          setDraftTimestamp(Date.now());
        }
      }
      return isSaveSuccessful;
    },
    [userSessionBinding, module, entityId, customDebounceMs]
  );

  // Discard / Clear Draft
  const discardDraft = useCallback(async () => {
    if (!userSessionBinding || !module) return false;

    // Immediately clear in-memory draft state so recovery banners dismiss instantly
    if (isMountedRef.current) {
      setHasDraft(false);
      setDraftData(null);
      setDraftTimestamp(null);
      setSaveStatus('idle');
    }

    try {
      await clearFormDraft(userSessionBinding, module, entityId || 'primary');
      return true;
    } catch (clearDraftError) {
      console.warn('[useReliabilityDraft] Error discarding draft from storage:', clearDraftError);
      return false;
    }
  }, [userSessionBinding, module, entityId]);

  // Restore Draft: returns the current draft payload synchronously to consumer
  const restoreDraft = useCallback(() => {
    return draftData;
  }, [draftData]);

  return {
    // Canonical consumer contract
    draft: draftData,
    hasDraft,
    isAutosaving: saveStatus === 'saving',
    lastSavedAt: draftTimestamp,
    saveDraft,
    discardDraft,
    restoreDraft,

    // Backward-compatible aliases
    draftData,
    draftTimestamp,
    saveStatus,
    clearDraft: discardDraft,
  };
};

export default useReliabilityDraft;
