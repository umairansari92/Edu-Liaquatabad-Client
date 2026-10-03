import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage, formatBytes, revokePreviewUrl } from '../../utils/imageCompressor.js';

const MAX_ATTACHMENTS_ALLOWED = 10;
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB limit for PDFs

/**
 * Homework Attachment Uploader Component
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Provides:
 * - Direct mobile camera snapshot (<input capture="environment">)
 * - Photo library / file selector
 * - PDF document selector
 * - Instant in-browser canvas resizing & compression (max 1600px, 0.78 quality WebP/JPEG)
 * - Compression stats badge (e.g. 5.1 MB -> 420 KB (-92%))
 * - Lightweight thumbnail strip with removal
 * - Proper Object URL memory cleanup
 */
export const HomeworkAttachmentUploader = ({
  attachments = [],
  onChange,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Clean up object URLs on component unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      attachments.forEach((item) => {
        if (item.previewUrl) {
          revokePreviewUrl(item.previewUrl);
        }
      });
    };
  }, []); // Run on unmount

  const handleProcessFiles = async (fileList, isCamera = false) => {
    if (!fileList || fileList.length === 0) return;

    const currentCount = attachments.length;
    const remainingSlots = MAX_ATTACHMENTS_ALLOWED - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_ATTACHMENTS_ALLOWED} attachments allowed per homework.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    if (fileList.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more attachment(s) can be added (limit 10).`);
    }

    setIsProcessing(true);
    const newAttachmentItems = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      setProcessingStatus(`Optimizing ${file.name || 'image'} (${i + 1}/${filesToProcess.length})...`);

      try {
        if (file.type === 'application/pdf') {
          if (file.size > MAX_PDF_BYTES) {
            toast.error(`PDF "${file.name}" exceeds 10MB limit (${formatBytes(file.size)}).`);
            continue;
          }
          const pdfPreviewUrl = URL.createObjectURL(file);
          newAttachmentItems.push({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            file,
            previewUrl: pdfPreviewUrl,
            fileName: file.name,
            fileType: 'PDF',
            originalSizeBytes: file.size,
            compressedSizeBytes: file.size,
            mimeType: 'application/pdf',
          });
        } else if (file.type.startsWith('image/')) {
          // Perform in-browser canvas resize and compression
          const compressionResult = await compressImage(file, {
            maxDimension: 1600,
            quality: 0.78,
          });

          newAttachmentItems.push({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            file: compressionResult.file,
            previewUrl: compressionResult.previewUrl,
            fileName: compressionResult.file.name,
            fileType: 'IMAGE',
            originalSizeBytes: compressionResult.originalSizeBytes,
            compressedSizeBytes: compressionResult.compressedSizeBytes,
            mimeType: compressionResult.mimeType,
            width: compressionResult.width,
            height: compressionResult.height,
          });
        } else {
          toast.error(`Unsupported file type: ${file.name}. Allowed: Images and PDFs.`);
        }
      } catch (compressionError) {
        console.error('[Attachment Error]', compressionError);
        toast.error(`Failed to process ${file.name}: ${compressionError.message}`);
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');

    if (newAttachmentItems.length > 0) {
      const updatedList = [...attachments, ...newAttachmentItems];
      onChange(updatedList);
      toast.success(
        `Added ${newAttachmentItems.length} file(s). Images compressed for fast mobile study.`
      );
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    const itemToRemove = attachments.find((item) => item.id === attachmentId);
    if (itemToRemove && itemToRemove.previewUrl) {
      revokePreviewUrl(itemToRemove.previewUrl);
    }
    const updatedList = attachments.filter((item) => item.id !== attachmentId);
    onChange(updatedList);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-[#526477] text-xs">
          Homework Attachments &amp; Learning Material
        </label>
        <span className="text-[11px] font-semibold text-[#8094A8]">
          {attachments.length} / {MAX_ATTACHMENTS_ALLOWED} files
        </span>
      </div>

      {/* Hidden File Inputs */}
      {/* 1. Mobile Camera Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          handleProcessFiles(event.target.files, true);
          event.target.value = ''; // Reset input so same file can be retaken
        }}
        disabled={disabled || isProcessing || attachments.length >= MAX_ATTACHMENTS_ALLOWED}
      />

      {/* 2. Photo Gallery Input */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          handleProcessFiles(event.target.files, false);
          event.target.value = '';
        }}
        disabled={disabled || isProcessing || attachments.length >= MAX_ATTACHMENTS_ALLOWED}
      />

      {/* 3. PDF Document Input */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(event) => {
          handleProcessFiles(event.target.files, false);
          event.target.value = '';
        }}
        disabled={disabled || isProcessing || attachments.length >= MAX_ATTACHMENTS_ALLOWED}
      />

      {/* Action Buttons Strip */}
      <div className="flex flex-wrap gap-2">
        {/* Take Photo Button */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isProcessing || attachments.length >= MAX_ATTACHMENTS_ALLOWED}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#006AC7] text-xs font-bold border border-blue-200 transition disabled:opacity-50"
          title="Take photo of blackboard or book page with camera"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Take Photo</span>
        </button>

        {/* Choose Photos Button */}
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={disabled || isProcessing || attachments.length >= MAX_ATTACHMENTS_ALLOWED}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#102033] text-xs font-bold border border-slate-200 transition disabled:opacity-50"
          title="Select images from storage"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>Choose Photos</span>
        </button>

        {/* Choose PDF Button */}
        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          disabled={disabled || isProcessing || attachments.length >= MAX_ATTACHMENTS_ALLOWED}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#102033] text-xs font-bold border border-slate-200 transition disabled:opacity-50"
          title="Select PDF worksheet or document"
        >
          <FileText className="w-3.5 h-3.5 text-rose-600" />
          <span>Attach PDF</span>
        </button>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-2 text-xs text-[#006AC7] font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{processingStatus || 'Compressing educational media for low-bandwidth devices...'}</span>
        </div>
      )}

      {/* Thumbnail Previews Strip */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {attachments.map((item) => {
            const isImage = item.fileType === 'IMAGE';
            const savingsPercent =
              item.originalSizeBytes && item.compressedSizeBytes && item.originalSizeBytes > item.compressedSizeBytes
                ? Math.round(
                    ((item.originalSizeBytes - item.compressedSizeBytes) / item.originalSizeBytes) * 100
                  )
                : 0;

            return (
              <div
                key={item.id}
                className="relative rounded-xl border border-slate-200 bg-white p-2 flex flex-col justify-between overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(item.id)}
                  disabled={disabled}
                  className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white transition shadow-xs"
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Preview Thumbnail */}
                <div className="w-full h-24 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center mb-1.5">
                  {isImage ? (
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-rose-600">
                      <FileText className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">PDF Doc</span>
                    </div>
                  )}
                </div>

                {/* File Information & Compression Stats */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-[#102033] truncate" title={item.fileName}>
                    {item.fileName}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#526477]">
                    <span>{formatBytes(item.compressedSizeBytes)}</span>
                    {savingsPercent > 0 && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded text-[9px]">
                        -{savingsPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Note */}
      <p className="text-[10px] text-[#8094A8] leading-tight">
        ⚡ <strong>Low Bandwidth Architecture:</strong> Camera photos are automatically compressed in your browser before upload. Attachments remain accessible to students for 7 days before automated lifecycle cleanup.
      </p>
    </div>
  );
};

export default HomeworkAttachmentUploader;
