import React, { useState, useEffect } from 'react';
import { SubmissionMedia } from '../types/panel';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';

interface MediaGalleryViewerProps {
  media: SubmissionMedia[];
}

export const MediaGalleryViewer: React.FC<MediaGalleryViewerProps> = ({ media }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeVideo, setActiveVideo] = useState<SubmissionMedia | null>(null);

  const photos = media.filter((m) => m.media_type === 'photo');
  const videos = media.filter((m) => m.media_type === 'video');

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, photos.length]);

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => ((prev! + 1) % photos.length));
    setZoomLevel(1);
  };

  const handlePrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => ((prev! - 1 + photos.length) % photos.length));
    setZoomLevel(1);
  };

  if (media.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
        <div className="text-xs font-semibold text-slate-600">No media attached</div>
        <div className="text-[11px] text-slate-400">The owner did not submit any photos or videos.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4 text-brand-600" />
              <span>Property Photos ({photos.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">Click any photo to open full-screen viewer</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {photos.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => {
                  setLightboxIndex(idx);
                  setZoomLevel(1);
                }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-brand-500 transition-all cursor-pointer shadow-sm"
              >
                <img
                  src={item.public_url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-1.5 rounded-full bg-white/90 text-slate-800 text-xs font-semibold shadow">
                    <ZoomIn className="w-4 h-4" />
                  </span>
                </div>
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono font-bold text-white">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <VideoIcon className="w-4 h-4 text-emerald-600" />
              <span>Property Videos & Walkthroughs ({videos.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">Click to play video with controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((vid, idx) => (
              <div
                key={vid.id || idx}
                onClick={() => setActiveVideo(vid)}
                className="group relative aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 hover:border-emerald-500 cursor-pointer transition-all shadow-sm flex flex-col justify-between p-4"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">Video Walkthrough #{idx + 1}</span>
                  {vid.file_size && (
                    <span className="text-[10px] font-mono">
                      {(vid.file_size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>

                <div className="self-center w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  {vid.original_name || `Walkthrough video ${idx + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen Lightbox Image Viewer */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Lightbox Top Bar */}
          <div className="w-full flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wider font-mono">
                Photo {lightboxIndex + 1} of {photos.length}
              </span>
              <a
                href={photos[lightboxIndex].public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Original</span>
              </a>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1 hover:text-brand-400 text-slate-400 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium text-slate-300 w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1 hover:text-brand-400 text-slate-400 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:text-brand-400 text-slate-400 transition-colors ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Photo Display */}
          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-4">
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all z-10"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={photos[lightboxIndex].public_url}
              alt={`Photo ${lightboxIndex + 1}`}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl transition-transform duration-150 select-none shadow-2xl"
            />

            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all z-10"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Bottom Info */}
          <div className="text-center text-xs text-slate-400 shrink-0">
            {photos[lightboxIndex].original_name || `Property Photo #${lightboxIndex + 1}`}
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold truncate max-w-md">
                  {activeVideo.original_name || 'Property Walkthrough Video'}
                </span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black aspect-video flex items-center justify-center">
              <video
                src={activeVideo.public_url}
                controls
                autoPlay
                className="w-full h-full max-h-[70vh] object-contain"
              >
                Your browser does not support HTML video playback.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
