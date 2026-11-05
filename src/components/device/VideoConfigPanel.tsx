import { useState } from 'react';
import { VideoConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Save, Loader2 } from 'lucide-react';

interface VideoConfigPanelProps {
  config: VideoConfig;
  onChange: (config: VideoConfig) => void;
  onSave: (config: VideoConfig) => Promise<void>;
  isLoading: boolean;
}

export function VideoConfigPanel({
  config,
  onChange,
  onSave,
  isLoading,
}: VideoConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleMainStreamChange = (field: keyof VideoConfig['mainStream'], value: string | number) => {
    const updated = {
      ...localConfig,
      mainStream: { ...localConfig.mainStream, [field]: value },
    };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleSubStreamChange = (field: keyof VideoConfig['subStream'], value: string | number) => {
    const updated = {
      ...localConfig,
      subStream: { ...localConfig.subStream, [field]: value },
    };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  const resolutionOptions = [
    '2880x1620',
    '2560x1440',
    '1920x1080',
    '1280x720',
    '640x480',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Configuration
        </CardTitle>
        <CardDescription>
          Configure video stream settings for optimal performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stream */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-foreground">Main Stream (High Quality)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select
                value={localConfig.mainStream.resolution}
                onValueChange={(value) => handleMainStreamChange('resolution', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutionOptions.map((res) => (
                    <SelectItem key={res} value={res}>{res}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Compression</Label>
              <Select
                value={localConfig.mainStream.compression}
                onValueChange={(value) => handleMainStreamChange('compression', value as 'H.264' | 'H.265')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H.264">H.264</SelectItem>
                  <SelectItem value="H.265">H.265 (HEVC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frame Rate (fps)</Label>
              <Input
                type="number"
                value={localConfig.mainStream.frameRate}
                onChange={(e) => handleMainStreamChange('frameRate', parseInt(e.target.value) || 0)}
                min={1}
                max={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Bitrate (Kbps)</Label>
              <Input
                type="number"
                value={localConfig.mainStream.bitrate}
                onChange={(e) => handleMainStreamChange('bitrate', parseInt(e.target.value) || 0)}
                min={256}
                max={16384}
              />
            </div>
          </div>
        </div>

        {/* Sub Stream */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-foreground">Sub Stream (Live View)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select
                value={localConfig.subStream.resolution}
                onValueChange={(value) => handleSubStreamChange('resolution', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutionOptions.map((res) => (
                    <SelectItem key={res} value={res}>{res}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Compression</Label>
              <Select
                value={localConfig.subStream.compression}
                onValueChange={(value) => handleSubStreamChange('compression', value as 'H.264' | 'H.265')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H.264">H.264</SelectItem>
                  <SelectItem value="H.265">H.265 (HEVC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frame Rate (fps)</Label>
              <Input
                type="number"
                value={localConfig.subStream.frameRate}
                onChange={(e) => handleSubStreamChange('frameRate', parseInt(e.target.value) || 0)}
                min={1}
                max={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Bitrate (Kbps)</Label>
              <Input
                type="number"
                value={localConfig.subStream.bitrate}
                onChange={(e) => handleSubStreamChange('bitrate', parseInt(e.target.value) || 0)}
                min={128}
                max={4096}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Video Settings
        </Button>
      </CardContent>
    </Card>
  );
}
