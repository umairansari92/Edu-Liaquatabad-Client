import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Download,
  Image as ImageIcon,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatBytes } from '../../utils/imageCompressor.js';
import ImageLightboxModal from './ImageLightboxModal.jsx';

/**
 * Homework Attachments Viewer Component
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Displays attachment thumbnails, handles PDF preview/download,
 * and launches the fullscreen ImageLightboxModal on image click.
 *
 * @param {Object} props
 * @param {Array} props.attachments - List of attachment objects
 * @param {boolean} [props.isCompact=false] - Compact view for dashboards
 */
export const HomeworkAttachmentsViewer = ({ attachments = [], isCompact = false }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
                className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-[#006AC7] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#006AC7]/40 flex-shrink-0"
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
            const pdfUrl = pdfItem.fileUrl || pdfItem.previewUrl;
            return (
              <div
                key={pdfItem._id || pdfIdx}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-xs text-[#102033] transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span className="font-semibold truncate max-w-[160px] sm:max-w-[220px]">
                  {pdfItem.fileName || 'Worksheet Document'}
                </span>
                {pdfItem.sizeBytes > 0 && (
                  <span className="text-[10px] text-[#8094A8] font-mono">
                    ({formatBytes(pdfItem.sizeBytes)})
                  </span>
                )}
                <div className="flex items-center gap-1 ml-1">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-white text-[#006AC7] transition"
                    title="View PDF"
                    aria-label="View PDF Document"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={pdfUrl}
                    download={pdfItem.fileName || 'homework_document.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800 transition"
                    title="Download PDF"
                    aria-label="Download PDF Document"
                  >
                    <Download className="w-3 h-3" />
                  </a>
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
