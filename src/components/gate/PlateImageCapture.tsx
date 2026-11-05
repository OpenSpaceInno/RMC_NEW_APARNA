import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlateImage {
  id: string;
  angle: 'front' | 'back';
  url: string;
  timestamp: string;
}

interface PlateImageCaptureProps {
  vehicleRegNo?: string;
  onCapture?: (images: PlateImage[]) => void;
  onPlateDetected?: (detectedRegNo: string) => void;
}

const PlateImageCapture = ({ vehicleRegNo, onCapture, onPlateDetected }: PlateImageCaptureProps) => {
  const [images, setImages] = useState<PlateImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PlateImage | null>(null);

  const captureImage = (angle: 'front' | 'back') => {
    // Simulate image capture
    const newImage: PlateImage = {
      id: `img-${Date.now()}`,
      angle,
      url: `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop`,
      timestamp: new Date().toISOString(),
    };

    const updatedImages = [...images.filter(img => img.angle !== angle), newImage];
    setImages(updatedImages);
    onCapture?.(updatedImages);

    // Simulate OCR detection for front plate
    if (angle === 'front' && onPlateDetected) {
      setTimeout(() => {
        const detectedRegNo = vehicleRegNo || generateMockRegNo();
        onPlateDetected(detectedRegNo);
      }, 1000);
    }
  };

  const captureBothPlates = () => {
    const timestamp = new Date().toISOString();
    const front: PlateImage = {
      id: `img-f-${Date.now()}`,
      angle: 'front',
      url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop',
      timestamp,
    };
    const back: PlateImage = {
      id: `img-b-${Date.now() + 1}`,
      angle: 'back',
      url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop',
      timestamp,
    };
    const both = [front, back];
    setImages(both);
    onCapture?.(both);
    if (onPlateDetected) {
      onPlateDetected(vehicleRegNo || generateMockRegNo());
    }
  };

  const generateMockRegNo = () => {
    const states = ['MH', 'DL', 'KA', 'TN', 'GJ'];
    const state = states[Math.floor(Math.random() * states.length)];
    const district = String(Math.floor(Math.random() * 50) + 1).padStart(2, '0');
    const series = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                   String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const number = String(Math.floor(Math.random() * 9000) + 1000);
    return `${state}${district}${series}${number}`;
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onCapture?.(updatedImages);
  };

  const frontImage = images.find(img => img.angle === 'front');
  const backImage = images.find(img => img.angle === 'back');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              License Plate Images
              {vehicleRegNo && (
                <Badge variant="outline">{vehicleRegNo}</Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={captureBothPlates}
              className="gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              Capture Both
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Front Plate */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Front Plate</div>
              {frontImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={frontImage.url}
                    alt="Front plate"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(frontImage)}
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(frontImage.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Badge className="absolute bottom-2 left-2 text-xs">
                    {new Date(frontImage.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full aspect-video flex flex-col gap-2"
                  onClick={() => captureImage('front')}
                >
                  <Camera className="h-8 w-8" />
                  <span className="text-xs">Capture Front</span>
                </Button>
              )}
            </div>

            {/* Back Plate */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Back Plate</div>
              {backImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={backImage.url}
                    alt="Back plate"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(backImage)}
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(backImage.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Badge className="absolute bottom-2 left-2 text-xs">
                    {new Date(backImage.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full aspect-video flex flex-col gap-2"
                  onClick={() => captureImage('back')}
                >
                  <Camera className="h-8 w-8" />
                  <span className="text-xs">Capture Back</span>
                </Button>
              )}
            </div>
          </div>

          {images.length === 2 && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success rounded-lg">
              <ImageIcon className="h-5 w-5 text-success" />
              <span className="text-sm text-success font-medium">
                Both plate images captured successfully
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedImage?.angle} Plate Image
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-2">
              <img
                src={selectedImage.url}
                alt={selectedImage.angle}
                className="w-full rounded-lg"
              />
              <div className="text-sm text-muted-foreground">
                Captured: {new Date(selectedImage.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlateImageCapture;
