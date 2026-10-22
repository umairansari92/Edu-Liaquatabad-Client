import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadStaffPhoto } from '../../store/slices/staffProfileSlice.js';
import {
  Camera,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileImage,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils.js';

export const PhotoUploadModal = ({
  isOpen,
  onClose,
  targetId = 'me',
  currentPhotoUrl = '',
}) => {
  const dispatch = useDispatch();
  const { isUploadingPhoto } = useSelector((state) => state.staffProfile);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (fileChangeEvent) => {
    const file = fileChangeEvent.target.files?.[0];
    if (!file) return;

    setValidationError('');

    // Format validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setValidationError('Please select a valid image format (JPEG, PNG, or WebP).');
      return;
    }

    // Size validation: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    setSelectedFile(file);

    // Create instant browser preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!selectedFile) {
      toast.error('Please choose a photo to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);

    try {
      await dispatch(
        uploadStaffPhoto({
          targetId,
          formData,
        })
      ).unwrap();

      toast.success('Profile photo updated successfully.');
      handleClearSelection();
      onClose();
    } catch (uploadError) {
      toast.error(getErrorMessage(uploadError, 'Failed to upload profile photo.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006AC7]/10 flex items-center justify-center text-[#006AC7]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102033]">Profile Photo Upload</h2>
              <p className="text-xs text-[#526477]">Institutional portrait identification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleClearSelection();
              onClose();
            }}
            disabled={isUploadingPhoto}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
          {/* Preview Container */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-48 h-60 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 relative overflow-hidden flex items-center justify-center shadow-inner group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="New photo preview"
                  className="w-full h-full object-cover"
                />
              ) : currentPhotoUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={currentPhotoUrl}
                    alt="Current profile photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center text-white text-xs font-semibold">
                    Current Photo
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 text-slate-400">
                  <FileImage className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <span className="text-xs font-semibold block">No photo selected</span>
                  <span className="text-[10px] text-slate-400">Portrait 3:4 recommended</span>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="mt-3 text-center">
                <span className="text-xs font-bold text-[#102033] block truncate max-w-xs">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-[#526477]">
                  {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Validation Feedback */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* File Picker Trigger */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="profile-photo-file-input"
              disabled={isUploadingPhoto}
            />
            <label
              htmlFor="profile-photo-file-input"
              className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 hover:border-[#006AC7] bg-white hover:bg-blue-50/40 text-xs font-bold text-[#102033] transition-all shadow-xs"
            >
              <Upload className="w-4 h-4 text-[#006AC7]" />
              {selectedFile ? 'Select a Different Photo' : 'Choose Photo File (JPEG, PNG, WebP)'}
            </label>
          </div>

          {/* Institutional Upload Policy Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-[#526477] space-y-1">
            <span className="font-bold text-[#102033] block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#006AC7]" />
              Photo Guidelines:
            </span>
            <p>
              Please upload a formal, front-facing official portrait. Photos must not exceed 5MB and are secured via encrypted cloud storage with automatic previous image cleanup.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                handleClearSelection();
                onClose();
              }}
              disabled={isUploadingPhoto}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#526477] hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedFile || isUploadingPhoto}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006AC7] hover:bg-[#005299] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading Secure Photo...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm &amp; Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
