import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedDataUrl: string) => void;
  title?: string;
  initialAspectRatio?: 'free' | 'document' | 'square' | '4:3' | '16:9';
}

type AspectRatioPreset = 'free' | 'document' | 'square' | '4:3' | '16:9';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
  title = 'Crop & Align Document',
  initialAspectRatio = 'document',
}) => {
  if (!isOpen || !imageUrl) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Transformations
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>(initialAspectRatio);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);

  // Image load state
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Display dimensions of the image inside container
  const [displayedRect, setDisplayedRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 0, top: 0, width: 0, height: 0 });

  // Crop rectangle in percentages of displayed image: [0..100]
  const [crop, setCrop] = useState<{
    x: number; // percentage left 0..100
    y: number; // percentage top 0..100
    width: number; // percentage width 0..100
    height: number; // percentage height 0..100
  }>({ x: 5, y: 5, width: 90, height: 90 });

  // Drag interaction state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null); // 'move' or 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'
  const dragStartRef = useRef<{ clientX: number; clientY: number; startCrop: typeof crop }>({
    clientX: 0,
    clientY: 0,
    startCrop: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Aspect ratio decimal helper
  const getAspectDecimal = useCallback(
    (preset: AspectRatioPreset): number | null => {
      switch (preset) {
        case 'document':
          return 3 / 4; // 0.75 portrait document
        case 'square':
          return 1;
        case '4:3':
          return 4 / 3;
        case '16:9':
          return 16 / 9;
        case 'free':
        default:
          return null;
      }
    },
    []
  );

  // Load image and get natural size
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setIsImageLoaded(true);
      resetCrop(aspectRatio, img.naturalWidth, img.naturalHeight, rotation);
    };
  }, [imageUrl]);

  // Calculate crop rectangle to fit aspect ratio
  const resetCrop = (
    preset: AspectRatioPreset,
    natW = naturalDimensions.width,
    natH = naturalDimensions.height,
    rot = rotation
  ) => {
    if (!natW || !natH) return;
    const isRotated90or270 = rot === 90 || rot === 270;
    const effectiveW = isRotated90or270 ? natH : natW;
    const effectiveH = isRotated90or270 ? natW : natH;
    const ratio = getAspectDecimal(preset);

    if (!ratio) {
      // Free crop: 90% centered
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
      return;
    }

    const imgAspect = effectiveW / effectiveH;
    let cropW = 85;
    let cropH = 85;

    if (ratio > imgAspect) {
      // Crop is wider than image
      cropW = 85;
      cropH = Math.min(90, (cropW / ratio) * imgAspect);
    } else {
      // Crop is taller than image
      cropH = 85;
      cropW = Math.min(90, cropH * ratio * (1 / imgAspect));
    }

    const cropX = (100 - cropW) / 2;
    const cropY = (100 - cropH) / 2;

    setCrop({
      x: Math.max(2, cropX),
      y: Math.max(2, cropY),
      width: Math.max(10, Math.min(96, cropW)),
      height: Math.max(10, Math.min(96, cropH)),
    });
  };

  // Re-calculate displayed image bounds when container or rotation changes
  const updateDisplayedRect = useCallback(() => {
    if (!containerRef.current || !naturalDimensions.width) return;
    const container = containerRef.current;
    const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;

    const isRotated = rotation === 90 || rotation === 270;
    const origW = isRotated ? naturalDimensions.height : naturalDimensions.width;
    const origH = isRotated ? naturalDimensions.width : naturalDimensions.height;

    const scale = Math.min((cWidth - 32) / origW, (cHeight - 32) / origH);
    const dispW = origW * scale;
    const dispH = origH * scale;

    const left = (cWidth - dispW) / 2;
    const top = (cHeight - dispH) / 2;

    setDisplayedRect({ left, top, width: dispW, height: dispH });
  }, [naturalDimensions, rotation]);

  useEffect(() => {
    updateDisplayedRect();
    window.addEventListener('resize', updateDisplayedRect);
    return () => window.removeEventListener('resize', updateDisplayedRect);
  }, [updateDisplayedRect]);

  // Handle aspect ratio change
  const handleSelectAspect = (preset: AspectRatioPreset) => {
    setAspectRatio(preset);
    resetCrop(preset);
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    resetCrop(aspectRatio, naturalDimensions.width, naturalDimensions.height, nextRot);
  };

  // Handle Pointer / Touch drag start
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startCrop: { ...crop },
    };
  };

  // Handle Pointer Move
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !dragHandle || displayedRect.width === 0 || displayedRect.height === 0) return;

      const deltaPixelX = e.clientX - dragStartRef.current.clientX;
      const deltaPixelY = e.clientY - dragStartRef.current.clientY;

      const deltaPercentX = (deltaPixelX / displayedRect.width) * 100;
      const deltaPercentY = (deltaPixelY / displayedRect.height) * 100;

      const start = dragStartRef.current.startCrop;

      if (dragHandle === 'move') {
        let newX = start.x + deltaPercentX;
        let newY = start.y + deltaPercentY;

        newX = Math.max(0, Math.min(100 - start.width, newX));
        newY = Math.max(0, Math.min(100 - start.height, newY));

        setCrop((prev) => ({ ...prev, x: newX, y: newY }));
        return;
      }

      // Handle corner and edge resizing
      let { x, y, width, height } = { ...start };
      const minSize = 10; // min 10%

      if (dragHandle.includes('r')) {
        width = Math.max(minSize, Math.min(100 - start.x, start.width + deltaPercentX));
      }
      if (dragHandle.includes('l')) {
        const potentialW = start.width - deltaPercentX;
        if (potentialW >= minSize && start.x + deltaPercentX >= 0) {
          x = start.x + deltaPercentX;
          width = potentialW;
        }
      }
      if (dragHandle.includes('b')) {
        height = Math.max(minSize, Math.min(100 - start.y, start.height + deltaPercentY));
      }
      if (dragHandle.includes('t')) {
        const potentialH = start.height - deltaPercentY;
        if (potentialH >= minSize && start.y + deltaPercentY >= 0) {
          y = start.y + deltaPercentY;
          height = potentialH;
        }
      }

      // If fixed aspect ratio is chosen, adjust dimensions proportionally
      const ratio = getAspectDecimal(aspectRatio);
      if (ratio && displayedRect.width && displayedRect.height) {
        const currentPixelW = (width / 100) * displayedRect.width;
        const currentPixelH = (height / 100) * displayedRect.height;
        const pixelRatio = currentPixelW / currentPixelH;

        if (dragHandle.includes('r') || dragHandle.includes('l')) {
          const targetPixelH = currentPixelW / ratio;
          height = (targetPixelH / displayedRect.height) * 100;
          if (y + height > 100) {
            height = 100 - y;
            width = ((height / 100) * displayedRect.height * ratio) / displayedRect.width * 100;
          }
        } else {
          const targetPixelW = currentPixelH * ratio;
          width = (targetPixelW / displayedRect.width) * 100;
          if (x + width > 100) {
            width = 100 - x;
            height = (((width / 100) * displayedRect.width) / ratio / displayedRect.height) * 100;
          }
        }
      }

      // Clamp bounds within [0, 100]
      x = Math.max(0, Math.min(100 - width, x));
      y = Math.max(0, Math.min(100 - height, y));
      width = Math.max(minSize, Math.min(100 - x, width));
      height = Math.max(minSize, Math.min(100 - y, height));

      setCrop({ x, y, width, height });
    },
    [isDragging, dragHandle, displayedRect, aspectRatio, getAspectDecimal]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Execute the Crop on an offscreen Canvas
  const handleConfirmCrop = () => {
    if (!naturalDimensions.width || !naturalDimensions.height) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      // 1. Create canvas for rotated & flipped image
      const isRotated90or270 = rotation === 90 || rotation === 270;
      const transW = isRotated90or270 ? naturalDimensions.height : naturalDimensions.width;
      const transH = isRotated90or270 ? naturalDimensions.width : naturalDimensions.height;

      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = transW;
      rotCanvas.height = transH;
      const rotCtx = rotCanvas.getContext('2d');
      if (!rotCtx) return;

      rotCtx.save();
      // Translate to center
      rotCtx.translate(transW / 2, transH / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      if (isFlippedH) {
        rotCtx.scale(-1, 1);
      }
      rotCtx.drawImage(
        img,
        -naturalDimensions.width / 2,
        -naturalDimensions.height / 2,
        naturalDimensions.width,
        naturalDimensions.height
      );
      rotCtx.restore();

      // 2. Crop from rotated canvas according to crop percentage
      const cropPxX = Math.round((crop.x / 100) * transW);
      const cropPxY = Math.round((crop.y / 100) * transH);
      const cropPxW = Math.round((crop.width / 100) * transW);
      const cropPxH = Math.round((crop.height / 100) * transH);

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = Math.max(1, cropPxW);
      finalCanvas.height = Math.max(1, cropPxH);
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;

      finalCtx.imageSmoothingEnabled = true;
      finalCtx.imageSmoothingQuality = 'high';

      finalCtx.drawImage(
        rotCanvas,
        cropPxX,
        cropPxY,
        cropPxW,
        cropPxH,
        0,
        0,
        cropPxW,
        cropPxH
      );

      const croppedDataUrl = finalCanvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedDataUrl);
      onClose();
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col h-[92vh] max-h-[820px] border border-surface-container">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">crop</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                {title}
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Drag corner handles or move box to frame document clearly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high/60 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Aspect Ratio & Transform Toolbar */}
        <div className="px-3 py-2 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-bold text-outline uppercase mr-1 hidden sm:inline">
              Ratio:
            </span>
            {(
              [
                { id: 'document', label: 'Document (3:4)', icon: 'article' },
                { id: 'free', label: 'Freeform', icon: 'crop_free' },
                { id: 'square', label: '1:1', icon: 'crop_square' },
                { id: '4:3', label: '4:3', icon: 'crop_portrait' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectAspect(preset.id)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                  aspectRatio === preset.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Rotate & Flip Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRotate}
              title="Rotate 90° Clockwise"
              className="p-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">rotate_right</span>
              <span className="hidden sm:inline">Rotate</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFlippedH(!isFlippedH)}
              title="Flip Horizontal"
              className="p-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">flip</span>
            </button>
            <button
              type="button"
              onClick={() => resetCrop(aspectRatio)}
              title="Reset Crop to Full View"
              className="p-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            </button>
          </div>
        </div>

        {/* Interactive Cropper Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-surface-container-highest/60 flex items-center justify-center p-3 select-none"
        >
          {displayedRect.width > 0 && (
            <div
              className="relative"
              style={{
                width: displayedRect.width,
                height: displayedRect.height,
              }}
            >
              {/* Underlying Image */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Document for cropping"
                className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-150"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${isFlippedH ? -1 : 1})`,
                }}
              />

              {/* Darkened Backdrop Overlay Outside Crop Box */}
              <div
                className="absolute inset-0 bg-black/55 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                    ${crop.x}% ${crop.y}%,
                    ${crop.x}% ${crop.y + crop.height}%,
                    ${crop.x + crop.width}% ${crop.y + crop.height}%,
                    ${crop.x + crop.width}% ${crop.y}%,
                    ${crop.x}% ${crop.y}%
                  )`,
                }}
              />

              {/* Crop Box Container */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'move')}
                className="absolute border-2 border-primary shadow-[0_0_0_1px_rgba(255,255,255,0.7)] cursor-move transition-shadow"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                }}
              >
                {/* Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-white/60" />
                  <div className="border-r border-white/60" />
                  <div />
                </div>

                {/* Corner Handles */}
                {/* Top-Left */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'tl')}
                  className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md cursor-nwse-resize z-20 flex items-center justify-center active:scale-125 transition-transform"
                />
                {/* Top-Right */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'tr')}
                  className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md cursor-nesw-resize z-20 flex items-center justify-center active:scale-125 transition-transform"
                />
                {/* Bottom-Left */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'bl')}
                  className="absolute -bottom-2.5 -left-2.5 w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md cursor-nesw-resize z-20 flex items-center justify-center active:scale-125 transition-transform"
                />
                {/* Bottom-Right */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'br')}
                  className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md cursor-nwse-resize z-20 flex items-center justify-center active:scale-125 transition-transform"
                />

                {/* Edge Handles */}
                {/* Top Edge */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 't')}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-white/90 border border-primary cursor-ns-resize z-10"
                />
                {/* Bottom Edge */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'b')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-white/90 border border-primary cursor-ns-resize z-10"
                />
                {/* Left Edge */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'l')}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-8 w-3 rounded-full bg-white/90 border border-primary cursor-ew-resize z-10"
                />
                {/* Right Edge */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'r')}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-8 w-3 rounded-full bg-white/90 border border-primary cursor-ew-resize z-10"
                />

                {/* Center Move Hint */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 hover:opacity-40 transition-opacity">
                  <span className="material-symbols-outlined text-white text-[32px]">drag_pan</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Keep Original
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmCrop}
              className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">crop</span>
              <span>Confirm & Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
