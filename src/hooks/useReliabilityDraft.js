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
 * @returns {Object}
 */
export const useReliabilityDraft = (module, entityId = 'primary') => {
  const { user } = useSelector((state) => state.auth);
  const userSessionBinding = user?._id || user?.userId || 'anonymous';

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
      if (!userSessionBinding || userSessionBinding === 'anonymous' || !module) return;

      try {
        const existingDraft = await loadFormDraft(userSessionBinding, module, entityId);
        if (!isCancelled && existingDraft && existingDraft.payload) {
          setHasDraft(true);
          setDraftData(existingDraft.payload);
          setDraftTimestamp(existingDraft.updatedAt || existingDraft.clientUpdatedAt);
        }
      } catch (err) {
        console.warn('[useReliabilityDraft] Error checking draft:', err);
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
      const success = await saveFormDraft({
        userSessionBinding,
        module,
        entityId,
        payload,
      });

      if (isMountedRef.current) {
        setSaveStatus(success ? 'saved' : 'idle');
        if (success) {
          setHasDraft(true);
          setDraftTimestamp(Date.now());
        }
      }
      return success;
    },
    [userSessionBinding, module, entityId]
  );

  // Discard Draft
  const clearDraft = useCallback(async () => {
    if (!userSessionBinding || !module) return false;

    await clearFormDraft(userSessionBinding, module, entityId);
    if (isMountedRef.current) {
      setHasDraft(false);
      setDraftData(null);
      setDraftTimestamp(null);
      setSaveStatus('idle');
    }
    return true;
  }, [userSessionBinding, module, entityId]);

  return {
    hasDraft,
    draftData,
    draftTimestamp,
    saveStatus,
    saveDraft,
    clearDraft,
  };
};

export default useReliabilityDraft;
