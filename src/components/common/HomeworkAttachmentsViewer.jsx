import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Download,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes } from '../../utils/imageCompressor.js';
import ImageLightboxModal from './ImageLightboxModal.jsx';
import apiClient from '../../services/apiClient.js';

/**
 * Homework Attachments Viewer Component
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Displays attachment thumbnails, handles PDF preview/download,
 * and launches the fullscreen ImageLightboxModal on image click.
 *
 * @param {Object} props
 * @param {Array} props.attachments - List of attachment objects
 * @param {string} [props.homeworkId] - Parent homework ID for authenticated attachment fetching
 * @param {boolean} [props.isCompact=false] - Compact view for dashboards
 */
export const HomeworkAttachmentsViewer = ({
  attachments = [],
  homeworkId = null,
  isCompact = false,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);

  if (!attachments || attachments.length === 0) return null;

  // Separate image attachments from PDF documents
  const imageAttachments = attachments.filter(
    (item) => item.fileType === 'IMAGE' || (item.mimeType && item.mimeType.startsWith('image/'))
  );
  const pdfAttachments = attachments.filter(
    (item) => item.fileType === 'PDF' || item.mimeType === 'application/pdf'
  );

  const handleOpenLightbox = (imageIndex) => {
    setActiveImageIndex(imageIndex);
    setLightboxOpen(true);
  };

  /**
   * Securely previews or downloads a PDF attachment via authenticated backend stream
   *
   * @param {Object} pdfItem
   * @param {boolean} shouldForceDownload
   */
  const handleDeliverPdf = async (pdfItem, shouldForceDownload = false) => {
    const targetAttachmentId = pdfItem._id || pdfItem.id;

    // Fallback if homeworkId is not wired
    if (!homeworkId || !targetAttachmentId) {
      if (pdfItem.fileUrl) {
        window.open(pdfItem.fileUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      setDownloadingAttachmentId(targetAttachmentId);

      const downloadEndpoint = `/homework/${homeworkId}/attachments/${targetAttachmentId}?download=${shouldForceDownload}`;
      const apiResponse = await apiClient.get(downloadEndpoint, {
        responseType: 'blob',
      });

      // Defensive check: If server delivered JSON error payload inside 200 blob
      if (apiResponse.data?.type === 'application/json') {
        const errorBlobText = await apiResponse.data.text();
        const parsedJson = JSON.parse(errorBlobText);
        throw new Error(parsedJson.message || 'Failed to download document.');
      }

      const documentBlob = new Blob([apiResponse.data], {
        type: pdfItem.mimeType || 'application/pdf',
      });
      const generatedBlobUrl = window.URL.createObjectURL(documentBlob);
      const targetFileName = pdfItem.fileName || 'homework_worksheet.pdf';

      if (shouldForceDownload) {
        const downloadAnchorElement = document.createElement('a');
        downloadAnchorElement.href = generatedBlobUrl;
        downloadAnchorElement.download = targetFileName;
        document.body.appendChild(downloadAnchorElement);
        downloadAnchorElement.click();
        downloadAnchorElement.remove();

        setTimeout(() => {
          window.URL.revokeObjectURL(generatedBlobUrl);
        }, 3000);

        toast.success(`Downloaded: ${targetFileName}`);
      } else {
        const previewWindow = window.open(generatedBlobUrl, '_blank');
        if (!previewWindow) {
          // If popup is blocked by browser, trigger download as reliable fallback
          const fallbackAnchor = document.createElement('a');
          fallbackAnchor.href = generatedBlobUrl;
          fallbackAnchor.download = targetFileName;
          document.body.appendChild(fallbackAnchor);
          fallbackAnchor.click();
          fallbackAnchor.remove();
          toast.success('Popup blocked: Document downloaded directly.');
        }

        setTimeout(() => {
          window.URL.revokeObjectURL(generatedBlobUrl);
        }, 120000); // 2 minute lifetime for viewing tab
      }
    } catch (deliveryError) {
      console.error('[Homework Attachment Delivery Failed]', deliveryError);
      let descriptiveMessage = 'Could not retrieve study material.';

      if (deliveryError.response?.data instanceof Blob) {
        try {
          const rawBlobErrorText = await deliveryError.response.data.text();
          const parsedBlobJson = JSON.parse(rawBlobErrorText);
          if (parsedBlobJson.message) {
            descriptiveMessage = parsedBlobJson.message;
          }
        } catch {
          // Keep default message
        }
      } else if (deliveryError.message) {
        descriptiveMessage = deliveryError.message;
      }

      toast.error(descriptiveMessage);
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-[#8094A8] uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#006AC7]" />
          Learning Materials ({attachments.length}):
        </span>

        {/* 7-Day Temporary Retention Indicator */}
        <span className="text-[10px] text-[#8094A8] font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>7-Day Temporary Study Material</span>
        </span>
      </div>

      {/* ── Image Thumbnails Strip ────────────────────────────────────────── */}
      {imageAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {imageAttachments.map((imageItem, imageIdx) => {
            const imageUrl = imageItem.fileUrl || imageItem.previewUrl;
            return (
              <button
                key={imageItem._id || imageIdx}
                type="button"
                onClick={() => handleOpenLightbox(imageIdx)}
                className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-[#006AC7] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#006AC7]/40 flex-shrink-0 cursor-pointer"
                title={`Click to enlarge: ${imageItem.fileName || 'Homework Photo'}`}
              >
                <img
                  src={imageUrl}
                  alt={imageItem.fileName || 'Homework Attachment'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-4 h-4" />
                </div>
                {imageItem.sizeBytes > 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 text-white text-[9px] font-mono text-center py-0.5 truncate">
                    {formatBytes(imageItem.sizeBytes)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── PDF Documents List ────────────────────────────────────────────── */}
      {pdfAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {pdfAttachments.map((pdfItem, pdfIdx) => {
            const isCurrentlyFetching =
              downloadingAttachmentId === (pdfItem._id || pdfItem.id);

            return (
              <div
                key={pdfItem._id || pdfIdx}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-xs text-[#102033] transition-colors shadow-2xs"
              >
                {isCurrentlyFetching ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#006AC7] animate-spin flex-shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                )}
                <span className="font-semibold truncate max-w-[160px] sm:max-w-[220px]">
                  {pdfItem.fileName || 'Worksheet Document'}
                </span>
                {pdfItem.sizeBytes > 0 && (
                  <span className="text-[10px] text-[#8094A8] font-mono">
                    ({formatBytes(pdfItem.sizeBytes)})
                  </span>
                )}
                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => handleDeliverPdf(pdfItem, false)}
                    disabled={isCurrentlyFetching}
                    className="p-1 rounded-md hover:bg-white text-[#006AC7] hover:text-[#00529B] transition disabled:opacity-50 cursor-pointer"
                    title="View PDF"
                    aria-label="View PDF Document"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeliverPdf(pdfItem, true)}
                    disabled={isCurrentlyFetching}
                    className="p-1 rounded-md hover:bg-white text-slate-500 hover:text-slate-800 transition disabled:opacity-50 cursor-pointer"
                    title="Download PDF"
                    aria-label="Download PDF Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        images={imageAttachments}
        initialIndex={activeImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default HomeworkAttachmentsViewer;
