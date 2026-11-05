import { useState, useEffect } from 'react';
import { RTSPConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Save, Loader2, Play, Eye, EyeOff, Copy, Check, Link, Settings2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RTSPConfigPanelProps {
  config: RTSPConfig;
  onChange: (config: RTSPConfig) => void;
  onSave: (config: RTSPConfig) => Promise<void>;
  onTestStream: () => Promise<boolean>;
  isLoading: boolean;
  isTesting: boolean;
  deviceIp: string;
}

export function RTSPConfigPanel({
  config,
  onChange,
  onSave,
  onTestStream,
  isLoading,
  isTesting,
  deviceIp,
}: RTSPConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlMode, setUrlMode] = useState<'direct' | 'manual'>(config.useDirectUrl ? 'direct' : 'manual');

  useEffect(() => {
    setLocalConfig(config);
    setUrlMode(config.useDirectUrl ? 'direct' : 'manual');
  }, [config]);

  const handleChange = (field: keyof RTSPConfig, value: string | number | boolean) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleUrlModeChange = (mode: 'direct' | 'manual') => {
    setUrlMode(mode);
    handleChange('useDirectUrl', mode === 'direct');
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  const getFullRtspUrl = () => {
    if (localConfig.useDirectUrl && localConfig.directUrl) {
      return localConfig.directUrl;
    }
    const auth = localConfig.username && localConfig.password 
      ? `${localConfig.username}:${localConfig.password}@` 
      : '';
    return `rtsp://${auth}${deviceIp}:${localConfig.port}${localConfig.streamPath}`;
  };

  const parseDirectUrl = (url: string) => {
    try {
      // Parse RTSP URL: rtsp://[user:pass@]host:port/path
      const rtspRegex = /^rtsp:\/\/(?:([^:]+):([^@]+)@)?([^:/]+):?(\d+)?(.*)$/;
      const match = url.match(rtspRegex);
      if (match) {
        const [, username, password, host, port, path] = match;
        return {
          username: username || '',
          password: password || '',
          host,
          port: parseInt(port) || 554,
          path: path || '/stream'
        };
      }
    } catch (e) {
      console.error('Failed to parse RTSP URL:', e);
    }
    return null;
  };

  const copyRtspUrl = () => {
    navigator.clipboard.writeText(getFullRtspUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedUrl = localConfig.directUrl ? parseDirectUrl(localConfig.directUrl) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          RTSP Stream Configuration
        </CardTitle>
        <CardDescription>
          Configure real-time streaming protocol settings for live camera access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable RTSP */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base">Enable RTSP Streaming</Label>
            <p className="text-sm text-muted-foreground">
              Allow live video streaming via RTSP protocol
            </p>
          </div>
          <Switch
            checked={localConfig.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        {localConfig.enabled && (
          <>
            {/* URL Configuration Mode */}
            <Tabs value={urlMode} onValueChange={(v) => handleUrlModeChange(v as 'direct' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct" className="gap-2">
                  <Link className="h-4 w-4" />
                  Direct URL
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Manual Config
                </TabsTrigger>
              </TabsList>

              <TabsContent value="direct" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>RTSP Stream URL</Label>
                  <Input
                    value={localConfig.directUrl}
                    onChange={(e) => handleChange('directUrl', e.target.value)}
                    placeholder="rtsp://192.168.0.168:554/rtsp/streaming?channel=01&subtype=0"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the complete RTSP URL from your camera
                  </p>
                </div>

                {parsedUrl && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Parsed URL Components:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Host:</span> {parsedUrl.host}</div>
                      <div><span className="text-muted-foreground">Port:</span> {parsedUrl.port}</div>
                      <div className="col-span-2"><span className="text-muted-foreground">Path:</span> {parsedUrl.path}</div>
                      {parsedUrl.username && (
                        <div><span className="text-muted-foreground">User:</span> {parsedUrl.username}</div>
                      )}
                    </div>
                  </div>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Browsers cannot play RTSP directly. For live preview, configure an HLS proxy URL below or use VLC/FFplay for external viewing.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>HLS Proxy URL (Optional)</Label>
                  <Input
                    value={localConfig.hlsProxyUrl || ''}
                    onChange={(e) => handleChange('hlsProxyUrl', e.target.value)}
                    placeholder="http://your-server:8080/hls/stream.m3u8"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    If you have an RTSP-to-HLS converter (like nginx-rtmp, MediaMTX, or go2rtc), enter the HLS URL here for browser playback
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-4">
                {/* Connection Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground">Connection Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>RTSP Port</Label>
                      <Input
                        type="number"
                        value={localConfig.port}
                        onChange={(e) => handleChange('port', parseInt(e.target.value) || 554)}
                        min={1}
                        max={65535}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Transport Protocol</Label>
                      <Select
                        value={localConfig.transport}
                        onValueChange={(value) => handleChange('transport', value as 'tcp' | 'udp')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tcp">TCP (Reliable)</SelectItem>
                          <SelectItem value="udp">UDP (Low Latency)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stream Path</Label>
                    <Input
                      value={localConfig.streamPath}
                      onChange={(e) => handleChange('streamPath', e.target.value)}
                      placeholder="/rtsp/streaming?channel=01&subtype=0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Common paths: /live/main, /stream1, /rtsp/streaming?channel=01
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Authentication */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="font-medium text-sm text-foreground">Authentication</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={localConfig.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={localConfig.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Settings */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="font-medium text-sm text-foreground">Performance</h4>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Latency Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduces buffering for real-time monitoring
                  </p>
                </div>
                <Switch
                  checked={localConfig.lowLatencyMode}
                  onCheckedChange={(checked) => handleChange('lowLatencyMode', checked)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Buffer Size</Label>
                  <span className="text-sm text-muted-foreground">{localConfig.bufferSize} KB</span>
                </div>
                <Slider
                  value={[localConfig.bufferSize]}
                  onValueChange={([value]) => handleChange('bufferSize', value)}
                  min={128}
                  max={4096}
                  step={128}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Reconnect Interval</Label>
                  <span className="text-sm text-muted-foreground">{localConfig.reconnectInterval}s</span>
                </div>
                <Slider
                  value={[localConfig.reconnectInterval]}
                  onValueChange={([value]) => handleChange('reconnectInterval', value)}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>
            </div>

            {/* RTSP URL Preview */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Label>Full RTSP URL</Label>
              <div className="flex gap-2">
                <Input
                  value={getFullRtspUrl()}
                  readOnly
                  className="font-mono text-sm bg-muted"
                />
                <Button variant="outline" size="icon" onClick={copyRtspUrl}>
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this URL in VLC, FFplay, or other RTSP-compatible players
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onTestStream}
            disabled={isTesting || !localConfig.enabled}
            variant="outline"
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Stream
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
            Save RTSP Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
