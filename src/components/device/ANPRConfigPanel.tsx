import { useState } from 'react';
import { ANPRConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanLine, Save, Loader2 } from 'lucide-react';

interface ANPRConfigPanelProps {
  config: ANPRConfig;
  onChange: (config: ANPRConfig) => void;
  onSave: (config: ANPRConfig) => Promise<void>;
  isLoading: boolean;
}

export function ANPRConfigPanel({
  config,
  onChange,
  onSave,
  isLoading,
}: ANPRConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (field: keyof ANPRConfig, value: number | boolean | string) => {
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
          <ScanLine className="h-5 w-5" />
          License Plate Recognition
        </CardTitle>
        <CardDescription>
          Configure ANPR detection settings and capture parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable ANPR */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
          <div>
            <Label htmlFor="anpr-enable" className="font-medium">Enable LPR</Label>
            <p className="text-sm text-muted-foreground">
              Activate license plate recognition
            </p>
          </div>
          <Switch
            id="anpr-enable"
            checked={localConfig.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        {/* Detection Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-foreground">Detection Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Detection Mode</Label>
              <Select
                value={localConfig.detectionMode}
                onValueChange={(value) => handleChange('detectionMode', value as 'continuous' | 'triggered')}
                disabled={!localConfig.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">Continuous</SelectItem>
                  <SelectItem value="triggered">Triggered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plate Type</Label>
              <Select
                value={localConfig.plateType}
                onValueChange={(value) => handleChange('plateType', value as 'white' | 'black' | 'both')}
                disabled={!localConfig.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White Only</SelectItem>
                  <SelectItem value="black">Black Only</SelectItem>
                  <SelectItem value="both">Both (White & Black)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Minimum Confidence (%)</Label>
              <span className="text-sm text-muted-foreground">{localConfig.minConfidence}%</span>
            </div>
            <Slider
              value={[localConfig.minConfidence]}
              onValueChange={([value]) => handleChange('minConfidence', value)}
              min={50}
              max={99}
              step={1}
              disabled={!localConfig.enabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Plate Width (px)</Label>
              <Input
                type="number"
                value={localConfig.minPlateWidth}
                onChange={(e) => handleChange('minPlateWidth', parseInt(e.target.value) || 0)}
                min={40}
                max={200}
                disabled={!localConfig.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Plate Width (px)</Label>
              <Input
                type="number"
                value={localConfig.maxPlateWidth}
                onChange={(e) => handleChange('maxPlateWidth', parseInt(e.target.value) || 0)}
                min={100}
                max={600}
                disabled={!localConfig.enabled}
              />
            </div>
          </div>
        </div>

        {/* Capture Settings */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-foreground">Capture Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capture Mode</Label>
              <Select
                value={localConfig.captureMode}
                onValueChange={(value) => handleChange('captureMode', value as 'best_shot' | 'all')}
                disabled={!localConfig.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best_shot">Best Shot</SelectItem>
                  <SelectItem value="all">All Frames</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capture Count</Label>
              <Input
                type="number"
                value={localConfig.captureCount}
                onChange={(e) => handleChange('captureCount', parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                disabled={!localConfig.enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capture Interval (ms)</Label>
            <Input
              type="number"
              value={localConfig.captureInterval}
              onChange={(e) => handleChange('captureInterval', parseInt(e.target.value) || 100)}
              min={100}
              max={5000}
              step={100}
              disabled={!localConfig.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="overlay">Overlay Plate Number on Image</Label>
            <Switch
              id="overlay"
              checked={localConfig.overlayPlateNumber}
              onCheckedChange={(checked) => handleChange('overlayPlateNumber', checked)}
              disabled={!localConfig.enabled}
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading || !localConfig.enabled}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save ANPR Settings
        </Button>
      </CardContent>
    </Card>
  );
}
