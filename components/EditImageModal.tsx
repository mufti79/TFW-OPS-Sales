
import React, { useState, useEffect } from 'react';
import { Ride } from '../types';

interface EditImageModalProps {
  ride: Ride;
  onClose: () => void;
  onSave: (rideId: number, imageBase64: string) => void;
}

const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            if (!event.target?.result) {
                return reject(new Error("FileReader did not return a result."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob failed'));
                    }
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};


const EditImageModal: React.FC<EditImageModalProps> = ({ ride, onClose, onSave }) => {
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!newImageFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(newImageFile);
    setPreviewUrl(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [newImageFile]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File is too large. Please select an image under 10MB.');
        setNewImageFile(null);
        if (event.target) event.target.value = ''; // Clear the input
        return;
      }
      
      setError('');
      
      try {
        const resizedBlob = await resizeImage(file, 800, 600, 0.8);
        const resizedFile = new File([resizedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
        setNewImageFile(resizedFile);
      } catch (e) {
        console.error("Image resizing failed", e);
        setError("Could not process image. Please try a different one.");
        setNewImageFile(null);
      }
    }
  };

  const handleSave = () => {
    if (newImageFile && !error) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSave(ride.id, reader.result as string);
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      };
      reader.readAsDataURL(newImageFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-image-title">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700 animate-fade-in-up">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 id="edit-image-title" className="text-2xl font-bold text-gray-100">Change Image for</h2>
              <p className="text-purple-400 font-semibold">{ride.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Current Image:</p>
              <img src={ride.imageUrl} alt={ride.name} className="w-full h-48 object-cover rounded-md border border-gray-600" />
            </div>

            {previewUrl && !error && (
              <div>
                <p className="text-sm text-gray-400 mb-2">New Image Preview:</p>
                <img src={previewUrl} alt="New preview" className="w-full h-48 object-cover rounded-md border border-purple-500" />
              </div>
            )}
            
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload a new image (max 10MB)</label>
              <input 
                id="image-upload"
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-colors cursor-pointer"
                aria-describedby="file-error"
              />
              {error && <p id="file-error" className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={!newImageFile || !!error}
              className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 active:scale-95 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Save Change
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditImageModal;