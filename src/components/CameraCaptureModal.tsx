import React, { useRef, useState, useEffect } from 'react';
import { ImageCropModal } from './ImageCropModal';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
  documentTypeHint?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Take Document Photo',
  documentTypeHint = 'Position prescription, lab report, or medical bill within frame',
}) => {
  if (!isOpen) return null;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false);

  // Start Camera
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop current stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setIsInitializing(false);
      setCameraError(
        err?.message?.includes('Permission')
          ? 'Camera permission was denied. Please allow camera access in your browser settings, or upload an image file directly.'
          : 'Unable to connect to camera device. You can capture or select a photo using the file picker below.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    // Trigger visual flash
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If user facing mode, flip horizontally for natural mirror image
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedPreview(dataUrl);

      // Stop camera while reviewing
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      handleClose();
    }
  };

  const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCapturedPreview(null);
    setCameraError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-surface-container relative">
        {/* Hidden Canvas for snapshot drawing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for native camera / gallery fallback */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileFallback}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                {title}
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium truncate max-w-[220px] sm:max-w-xs">
                {documentTypeHint}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
            type="button"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[320px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
          {/* Visual Flash effect */}
          {flashAnimation && (
            <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
          )}

          {capturedPreview ? (
            /* Review Captured Photo */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
              <img
                src={capturedPreview}
                alt="Captured Document"
                className="max-h-[360px] sm:max-h-[420px] w-auto max-w-full object-contain rounded-xl shadow-lg border border-white/20"
              />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md text-xs font-bold">
                <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
                Document Snapshot Ready
              </div>
            </div>
          ) : cameraError ? (
            /* Error & Alternative Fallback */
            <div className="p-6 text-center text-white space-y-3 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center text-amber-300">
                <span className="material-symbols-outlined text-2xl">videocam_off</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-medium">
                {cameraError}
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                  Take Photo via Device Camera
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">refresh</span>
                  Retry Live Camera
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[460px]"
              />

              {/* Document Framing Guidelines & Corner Brackets */}
              <div className="absolute inset-5 sm:inset-8 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                {/* 4 Corner Markers */}
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-md" />
                  <div className="w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-md" />
                </div>
                {/* Center scan line / document alignment text */}
                <div className="text-center">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-white/90 tracking-wide inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-primary">crop_free</span>
                    Align document edges inside frame
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  <div className="w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-md" />
                </div>
              </div>

              {/* Switch Camera Button (Front / Rear) */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Switch Camera"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
              </button>
            </div>
          )}
        </div>

        {/* Controls & Action Bar */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container">
          {capturedPreview ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="py-3 px-3.5 rounded-full bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">replay</span>
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCropping(true)}
                className="py-3 px-3.5 rounded-full bg-secondary-container text-on-secondary-container font-bold text-xs hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-1 shadow-2xs border border-secondary/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">crop</span>
                <span>Crop / Align</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-4 rounded-full bg-primary text-on-primary font-headline font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>Attach Photo</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Gallery / Files
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={isInitializing || !!cameraError}
                aria-label="Capture Document"
                className={`w-16 h-16 rounded-full border-4 border-primary p-1 flex items-center justify-center shadow-lg active:scale-90 transition-all ${
                  isInitializing || !!cameraError
                    ? 'opacity-40 cursor-not-allowed border-outline'
                    : 'hover:scale-105'
                }`}
              >
                <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-2xl">photo_camera</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-3.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Crop Modal */}
      {isCropping && capturedPreview && (
        <ImageCropModal
          isOpen={isCropping}
          onClose={() => setIsCropping(false)}
          imageUrl={capturedPreview}
          onCropComplete={(croppedData) => {
            setCapturedPreview(croppedData);
            setIsCropping(false);
          }}
          title="Crop Document Photo"
          initialAspectRatio="document"
        />
      )}
    </div>
  );
};
