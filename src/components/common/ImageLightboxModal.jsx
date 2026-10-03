import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  FileImage,
} from 'lucide-react';

/**
 * Image Lightbox Modal
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * Fullscreen, high-performance image viewer for educational homework snaps.
 * Features:
 * - Touch & keyboard friendly (Esc to exit, Arrow keys for navigation)
 * - Zoom controls (Zoom In, Zoom Out, Reset)
 * - Accessible counters and navigation bounds
 * - Responsive backdrop with click-outside protection
 */
export const ImageLightboxModal = ({
  images = [],
  initialIndex = 0,
  isOpen = false,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync initialIndex when modal opens or index changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoomLevel(1);
    }
  }, [isOpen, initialIndex, images.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setZoomLevel(1);
    }
  }, [currentIndex, images.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setZoomLevel(1);
    }
  }, [currentIndex]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Keyboard navigation & Esc listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrev();
      } else if (event.key === '+' || event.key === '=') {
        handleZoomIn();
      } else if (event.key === '-') {
        handleZoomOut();
      } else if (event.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || images.length === 0) return null;

  const currentItem = images[currentIndex] || {};
  const currentImageUrl = currentItem.fileUrl || currentItem.previewUrl || '';
  const currentFileName = currentItem.fileName || `Attachment ${currentIndex + 1}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity select-none p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image attachment viewer"
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-slate-950/80 to-transparent text-white">
        <div className="flex items-center gap-2 max-w-[70%]">
          <FileImage className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold truncate text-slate-200">
            {currentFileName}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono flex-shrink-0">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Zoom */}
          {zoomLevel !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition text-xs font-mono"
              title="Reset Zoom (0)"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Download Original */}
          {currentImageUrl && (
            <a
              href={currentImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={currentFileName}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
              title="Open or Download"
              aria-label="Download image"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition ml-1"
            title="Close Viewer (Esc)"
            aria-label="Close image viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Display */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-auto p-4 sm:p-12"
        onClick={(clickEvent) => {
          // Close if clicking the backdrop area directly
          if (clickEvent.target === clickEvent.currentTarget) {
            onClose();
          }
        }}
      >
        <img
          src={currentImageUrl}
          alt={currentFileName}
          style={{
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.15s ease-out',
            maxWidth: '95vw',
            maxHeight: '85vh',
          }}
          className="object-contain rounded-lg shadow-2xl select-none"
          draggable={false}
        />
      </div>

      {/* Navigation Buttons: Previous */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition shadow-lg border border-white/10"
          title="Previous Image (Left Arrow)"
          aria-label="Previous Image"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Navigation Buttons: Next */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition shadow-lg border border-white/10"
          title="Next Image (Right Arrow)"
          aria-label="Next Image"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Bottom Thumbnails Strip (if multiple images) */}
      {images.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-2 rounded-2xl bg-slate-950/80 border border-white/10 max-w-[90vw] overflow-x-auto">
          {images.map((imageItem, index) => {
            const thumbnailSrc = imageItem.fileUrl || imageItem.previewUrl || '';
            const isSelected = index === currentIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setCurrentIndex(index);
                  setZoomLevel(1);
                }}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                  isSelected ? 'border-[#38bdf8] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={`Jump to image ${index + 1}`}
              >
                <img
                  src={thumbnailSrc}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageLightboxModal;
