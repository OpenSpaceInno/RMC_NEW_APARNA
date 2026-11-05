import { useState } from 'react';
import { ImageConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Save, Loader2, Sun, Contrast, Palette } from 'lucide-react';

interface ImageConfigPanelProps {
  config: ImageConfig;
  onChange: (config: ImageConfig) => void;
  onSave: (config: ImageConfig) => Promise<void>;
  isLoading: boolean;
}

export function ImageConfigPanel({
  config,
  onChange,
  onSave,
  isLoading,
}: ImageConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (field: keyof ImageConfig, value: number | boolean | string) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Image Enhancement
        </CardTitle>
        <CardDescription>
          Adjust image quality settings for optimal plate recognition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Image Settings */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Brightness
              </Label>
              <span className="text-sm text-muted-foreground">{localConfig.brightness}</span>
            </div>
            <Slider
              value={[localConfig.brightness]}
              onValueChange={([value]) => handleChange('brightness', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Contrast className="h-4 w-4" />
                Contrast
              </Label>
              <span className="text-sm text-muted-foreground">{localConfig.contrast}</span>
            </div>
            <Slider
              value={[localConfig.contrast]}
              onValueChange={([value]) => handleChange('contrast', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Saturation
              </Label>
              <span className="text-sm text-muted-foreground">{localConfig.saturation}</span>
            </div>
            <Slider
              value={[localConfig.saturation]}
              onValueChange={([value]) => handleChange('saturation', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sharpness</Label>
              <span className="text-sm text-muted-foreground">{localConfig.sharpness}</span>
            </div>
            <Slider
              value={[localConfig.sharpness]}
              onValueChange={([value]) => handleChange('sharpness', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>

        {/* WDR Settings */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-foreground">Wide Dynamic Range (WDR)</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="wdr">Enable WDR</Label>
            <Switch
              id="wdr"
              checked={localConfig.wdrEnabled}
              onCheckedChange={(checked) => handleChange('wdrEnabled', checked)}
            />
          </div>
          {localConfig.wdrEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>WDR Level (dB)</Label>
                <span className="text-sm text-muted-foreground">{localConfig.wdrLevel}dB</span>
              </div>
              <Slider
                value={[localConfig.wdrLevel]}
                onValueChange={([value]) => handleChange('wdrLevel', value)}
                min={60}
                max={140}
                step={10}
              />
            </div>
          )}
        </div>

        {/* DNR Settings */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-foreground">3D Digital Noise Reduction</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="dnr">Enable 3D DNR</Label>
            <Switch
              id="dnr"
              checked={localConfig.dnrEnabled}
              onCheckedChange={(checked) => handleChange('dnrEnabled', checked)}
            />
          </div>
          {localConfig.dnrEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>DNR Level</Label>
                <span className="text-sm text-muted-foreground">Level {localConfig.dnrLevel}</span>
              </div>
              <Slider
                value={[localConfig.dnrLevel]}
                onValueChange={([value]) => handleChange('dnrLevel', value)}
                min={1}
                max={10}
                step={1}
              />
            </div>
          )}
        </div>

        {/* IR Settings */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-foreground">Infrared (IR) Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IR Mode</Label>
              <Select
                value={localConfig.irMode}
                onValueChange={(value) => handleChange('irMode', value as 'auto' | 'on' | 'off')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="on">Always On</SelectItem>
                  <SelectItem value="off">Always Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IR Distance (m)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[localConfig.irDistance]}
                  onValueChange={([value]) => handleChange('irDistance', value)}
                  min={10}
                  max={50}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-right">{localConfig.irDistance}m</span>
              </div>
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
          Save Image Settings
        </Button>
      </CardContent>
    </Card>
  );
}
