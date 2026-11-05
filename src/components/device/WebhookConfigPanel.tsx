import { useState } from 'react';
import { WebhookConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Webhook, Save, TestTube, Loader2, Code } from 'lucide-react';

interface WebhookConfigPanelProps {
  config: WebhookConfig;
  onChange: (config: WebhookConfig) => void;
  onSave: (config: WebhookConfig) => Promise<void>;
  onTest: () => Promise<boolean>;
  isLoading: boolean;
  isTesting: boolean;
}

export function WebhookConfigPanel({
  config,
  onChange,
  onSave,
  onTest,
  isLoading,
  isTesting,
}: WebhookConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (field: keyof WebhookConfig, value: string | number) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  const samplePayload = `{
  "event": "license_plate_detected",
  "camera_id": "ANPR_GATE_ENTRY_1",
  "timestamp": "2025-01-15T10:30:00Z",
  "plate_number": "MH12AB1234",
  "confidence": 0.95,
  "image_url": "http://192.168.1.100/snapshot.jpg"
}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Event Notification (Webhook)
        </CardTitle>
        <CardDescription>
          Configure HTTP notifications for ANPR events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              value={localConfig.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="http://192.168.1.10:8080/api/anpr/webhook"
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={localConfig.method}
                onValueChange={(value) => handleChange('method', value as 'POST' | 'GET')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Authentication</Label>
              <Select
                value={localConfig.authType}
                onValueChange={(value) => handleChange('authType', value as 'none' | 'basic' | 'bearer')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {localConfig.authType === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={localConfig.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="rmc_backend"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={localConfig.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {localConfig.authType === 'bearer' && (
            <div className="space-y-2">
              <Label htmlFor="token">Bearer Token</Label>
              <Input
                id="token"
                type="password"
                value={localConfig.token || ''}
                onChange={(e) => handleChange('token', e.target.value)}
                placeholder="••••••••••••••••"
              />
            </div>
          )}
        </div>

        {/* Timeout & Retry */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-foreground">Connection Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Timeout (seconds)</Label>
              <Input
                type="number"
                value={localConfig.timeout}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value) || 10)}
                min={1}
                max={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Retry Count</Label>
              <Input
                type="number"
                value={localConfig.retryCount}
                onChange={(e) => handleChange('retryCount', parseInt(e.target.value) || 3)}
                min={0}
                max={10}
              />
            </div>
          </div>
        </div>

        {/* Sample Payload */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Label className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Sample JSON Payload
          </Label>
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto text-muted-foreground">
            {samplePayload}
          </pre>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onTest}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Send Test Event
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Webhook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
