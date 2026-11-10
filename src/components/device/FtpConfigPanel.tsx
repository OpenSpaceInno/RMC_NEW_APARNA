import React, { useState, useEffect } from 'react';
import { FtpConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FolderSync, 
  Save, 
  TestTube, 
  Loader2, 
  Server, 
  Key, 
  Globe, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  HardDrive,
  Camera,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface FtpConfigPanelProps {
  config: FtpConfig;
  onChange: (config: FtpConfig) => void;
  onSave: (config: FtpConfig) => Promise<void>;
  onTest: (config?: FtpConfig) => Promise<any>;
  isLoading: boolean;
  isTesting: boolean;
}

export function FtpConfigPanel({
  config,
  onChange,
  onSave,
  onTest,
  isLoading,
  isTesting,
}: FtpConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<FtpConfig>(config);
  const [showPassword, setShowPassword] = useState(false);
  const [showCameraPassword, setShowCameraPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
    testedAt?: string;
  } | null>(null);

  // Synchronize when parent config changes
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleChange = (field: keyof FtpConfig, value: string | number) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await onTest(localConfig);
      if (res) {
        setTestResult({
          success: Boolean(res.success),
          latencyMs: res.latencyMs,
          message: res.message || (res.success ? 'Connected successfully' : res.error),
          error: res.error,
          testedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || 'Connection test failed',
        testedAt: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleResetDefaults = () => {
    const defaults: FtpConfig = {
      host: '213.210.37.249',
      apiUrl: 'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/api/v2',
      ftpPort: 2121,
      sftpPort: 2222,
      username: 'aparna_rmc',
      password: 'Rmc@Aparna#2026',
      cameraUser: 'sarath',
      cameraPassword: 'Password@123',
      adminUser: 'ftpsuperadmin',
      adminPassword: 'Demo#Test@2026',
      remoteFolder: '/weighbridge',
      webAdminUrl: 'http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users',
    };
    setLocalConfig(defaults);
    onChange(defaults);
  };

  return (
    <Card className="border-slate-800 shadow-xl bg-slate-900/40">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <FolderSync className="h-5 w-5 text-amber-400" />
              FTP / SFTP Remote Storage & Camera Credentials
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Maintain remote SFTPGo endpoint URLs, server ports, and storage credentials for vehicle snapshot uploads and ANPR plate ingestion.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {testResult?.success ? (
              <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-xs py-1 px-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Online ({testResult.latencyMs}ms)</span>
              </Badge>
            ) : testResult?.error ? (
              <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-300 text-xs py-1 px-2.5 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                <span>Offline</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-300 text-xs py-1 px-2.5 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-amber-400" />
                <span>SFTPGo v2 Protocol</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Test Connection Banner (if tested) */}
        {testResult && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
            testResult.success 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
              : 'bg-red-950/30 border-red-500/40 text-red-200'
          }`}>
            <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              testResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="font-semibold flex items-center justify-between">
                <span>{testResult.success ? 'SFTPGo Connection Verified' : 'Connection Test Failed'}</span>
                {testResult.testedAt && (
                  <span className="text-[10px] text-slate-400 font-mono">Tested at {testResult.testedAt}</span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {testResult.message || testResult.error}
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Server URL & Host Endpoints */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Globe className="h-4 w-4" />
            <span>1. Server Host & API Endpoint URLs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ftp-host" className="text-xs font-semibold text-slate-300">
                FTP / SFTP Server Host or IP
              </Label>
              <div className="relative">
                <Input
                  id="ftp-host"
                  value={localConfig.host || ''}
                  onChange={(e) => handleChange('host', e.target.value)}
                  placeholder="213.210.37.249"
                  className="font-mono text-xs pl-9 bg-slate-950/80 border-slate-800 focus:border-amber-500"
                />
                <Server className="h-4 w-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-500">Hostname or public IP address of remote SFTPGo server</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ftp-api-url" className="text-xs font-semibold text-slate-300">
                SFTPGo REST API URL
              </Label>
              <div className="relative">
                <Input
                  id="ftp-api-url"
                  value={localConfig.apiUrl || ''}
                  onChange={(e) => handleChange('apiUrl', e.target.value)}
                  placeholder="http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/api/v2"
                  className="font-mono text-xs pl-9 bg-slate-950/80 border-slate-800 focus:border-amber-500"
                />
                <Globe className="h-4 w-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-500">REST API v2 endpoint used for auth tokens and file uploads</p>
            </div>
          </div>

          {/* Web Admin Portal Link */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ftp-web-admin" className="text-xs font-semibold text-slate-300">
                SFTPGo Web Admin URL
              </Label>
              {localConfig.webAdminUrl && (
                <a
                  href={localConfig.webAdminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <span>Launch Web Admin Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <Input
              id="ftp-web-admin"
              value={localConfig.webAdminUrl || ''}
              onChange={(e) => handleChange('webAdminUrl', e.target.value)}
              placeholder="http://sftpgo-zkiu7thmtlpwpdojnucvhahr.213.210.37.249.sslip.io/web/admin/users"
              className="font-mono text-xs bg-slate-950/80 border-slate-800 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Section 2: Ports & Target Directory */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <HardDrive className="h-4 w-4" />
            <span>2. Ports & Remote Storage Directory</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ftp-port" className="text-xs font-semibold text-slate-300">
                FTP Port
              </Label>
              <Input
                id="ftp-port"
                type="number"
                value={localConfig.ftpPort || 2121}
                onChange={(e) => handleChange('ftpPort', Number(e.target.value))}
                placeholder="2121"
                className="font-mono text-xs bg-slate-950/80 border-slate-800 focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500">Standard: 21 or 2121</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sftp-port" className="text-xs font-semibold text-slate-300">
                SFTP (SSH) Port
              </Label>
              <Input
                id="sftp-port"
                type="number"
                value={localConfig.sftpPort || 2222}
                onChange={(e) => handleChange('sftpPort', Number(e.target.value))}
                placeholder="2222"
                className="font-mono text-xs bg-slate-950/80 border-slate-800 focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500">Standard: 22 or 2222</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ftp-folder" className="text-xs font-semibold text-slate-300">
                Remote Storage Folder
              </Label>
              <Input
                id="ftp-folder"
                value={localConfig.remoteFolder || '/weighbridge'}
                onChange={(e) => handleChange('remoteFolder', e.target.value)}
                placeholder="/weighbridge"
                className="font-mono text-xs bg-slate-950/80 border-slate-800 focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500">Destination folder for weighbridge snapshots</p>
            </div>
          </div>
        </div>

        {/* Section 3: Credentials */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Key className="h-4 w-4" />
            <span>3. Account Credentials & Camera User</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Weighbridge FTP Account */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Primary FTP Account (aparna_rmc)</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ftp-username" className="text-xs text-slate-400">
                  Username
                </Label>
                <Input
                  id="ftp-username"
                  value={localConfig.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="aparna_rmc"
                  className="font-mono text-xs bg-slate-900 border-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ftp-password" className="text-xs text-slate-400">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <Input
                  id="ftp-password"
                  type={showPassword ? 'text' : 'password'}
                  value={localConfig.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-xs bg-slate-900 border-slate-800"
                />
              </div>
            </div>

            {/* Camera Ingestion Account (Sarath) */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Camera className="h-4 w-4 text-amber-400" />
                <span>ANPR Camera FTP Account (sarath)</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="camera-username" className="text-xs text-slate-400">
                  Camera Ingestion Username
                </Label>
                <Input
                  id="camera-username"
                  value={localConfig.cameraUser || ''}
                  onChange={(e) => handleChange('cameraUser', e.target.value)}
                  placeholder="sarath"
                  className="font-mono text-xs bg-slate-900 border-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="camera-password" className="text-xs text-slate-400">
                    Camera Ingestion Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowCameraPassword(!showCameraPassword)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showCameraPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showCameraPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <Input
                  id="camera-password"
                  type={showCameraPassword ? 'text' : 'password'}
                  value={localConfig.cameraPassword || ''}
                  onChange={(e) => handleChange('cameraPassword', e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-xs bg-slate-900 border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: SFTPGo Superadmin (Collapsed / Optional) */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              4. SFTPGo Superadmin Account (Optional)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-user" className="text-xs text-slate-400">
                Superadmin User
              </Label>
              <Input
                id="admin-user"
                value={localConfig.adminUser || ''}
                onChange={(e) => handleChange('adminUser', e.target.value)}
                placeholder="ftpsuperadmin"
                className="font-mono text-xs bg-slate-950/80 border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-pass" className="text-xs text-slate-400">
                  Superadmin Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showAdminPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showAdminPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <Input
                id="admin-pass"
                type={showAdminPassword ? 'text' : 'password'}
                value={localConfig.adminPassword || ''}
                onChange={(e) => handleChange('adminPassword', e.target.value)}
                placeholder="••••••••"
                className="font-mono text-xs bg-slate-950/80 border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetDefaults}
            disabled={isLoading || isTesting}
            className="text-xs border-slate-700 hover:bg-slate-800 w-full sm:w-auto flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </Button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isLoading}
              className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 flex-1 sm:flex-initial flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span>Probing SFTPGo...</span>
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 text-amber-400" />
                  <span>Test Connection</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isTesting}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex-1 sm:flex-initial flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Saving Details...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-slate-950" />
                  <span>Save FTP Details</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default FtpConfigPanel;
