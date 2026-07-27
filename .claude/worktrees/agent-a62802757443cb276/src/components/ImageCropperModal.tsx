import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { X, RotateCw, Check, SkipForward } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedFile: File) => void;
  onSkip: () => void;
  fileName: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  onSkip,
  fileName
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        fileName
      );
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
      // Fallback to skip if cropping fails
      onSkip();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Edit Photo</h3>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="relative w-full h-[400px] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
              <span>Rotation</span>
              <button 
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="text-primary-500 flex items-center gap-1 hover:text-primary-600"
              >
                <RotateCw size={14} /> Rotate 90°
              </button>
            </div>
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>

          <div className="flex items-center gap-3 mt-2 pt-4 border-t border-gray-100">
            <button
              onClick={onSkip}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
            >
              <SkipForward size={18} /> Skip
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-primary-500 hover:bg-primary-600 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-primary-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : <><Check size={18} /> Save Photo</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
