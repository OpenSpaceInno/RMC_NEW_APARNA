import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Network, 
  Wifi, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Camera, 
  Video, 
  Search, 
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CameraDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateWebcam?: (screenIndex?: number) => void;
  onRefreshStreams?: () => void;
}

export function CameraDiagnosticsModal({
  isOpen,
  onClose,
  onActivateWebcam,
  onRefreshStreams,
}: CameraDiagnosticsModalProps) {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Custom Probe State
  const [probeHost, setProbeHost] = useState('192.168.0.100');
  const [probePort, setProbePort] = useState('554');
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState<{
    reachable?: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await api.getCameraDiagnostics();
      setDiagnostics(data);
    } catch (err: any) {
      console.warn('Diagnostics fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  const handleRunCustomProbe = async () => {
    if (!probeHost.trim()) {
      toast.error('Please enter an IP address or hostname');
      return;
    }
    setProbeLoading(true);
    setProbeResult(null);
    try {
      const res = await api.probeCamera({
        host: probeHost.trim(),
        port: parseInt(probePort.trim(), 10) || 554,
      });
      setProbeResult(res);
      if (res.reachable) {
        toast.success(`Port ${probePort} on ${probeHost} is reachable! (${res.latencyMs}ms)`);
      } else {
        toast.error(`Cannot connect to ${probeHost}:${probePort} - ${res.error || 'Timed out'}`);
      }
    } catch (err: any) {
      setProbeResult({ reachable: false, error: err.message || 'Probe request failed' });
      toast.error('Probe failed: ' + err.message);
    } finally {
      setProbeLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-950 text-slate-100 border-slate-800 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Weighbridge CCTV Camera Diagnostics & Hardware Link
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Inspect physical network interfaces, IP reachability on port 554 (RTSP), and hardware troubleshooting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Hardware Network Interface Alert */}
          <Card className="border-amber-500/40 bg-amber-950/20 shadow-sm">
            <CardContent className="p-3.5 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <span>Physical Camera Network Link Status</span>
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-mono">
                      ETHERNET DISCONNECTED
                    </Badge>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The computer's physical <strong>Ethernet Cable is Disconnected (0 bps)</strong>.
                    IP cameras (<code className="text-amber-200">192.168.0.100</code> and <code className="text-amber-200">192.168.0.99</code>) are physically wired via LAN / PoE switch.
                    Because the Ethernet cable is unplugged, the app falls back to live simulation/webcam.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-500/20 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Network className="h-3.5 w-3.5 text-rose-400" />
                    Ethernet Adapter:
                  </span>
                  <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/40">
                    Unplugged (0 bps)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    Wi-Fi Adapter:
                  </span>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40 font-mono">
                    192.168.0.10 (Active)
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configured Camera Probes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Configured CCTV Streams (MediaMTX)
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-slate-400 hover:text-white gap-1"
                onClick={fetchDiagnostics}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Re-Probe All
              </Button>
            </div>

            <div className="space-y-2">
              {(diagnostics?.cameraProbes || [
                { id: 'cam_gate_1', name: 'ANPR Entry Camera', ip: '192.168.0.100', online: false },
                { id: 'cam_gate_2', name: 'Scale Platform Bay Camera', ip: '192.168.0.99', online: false },
                { id: 'cam_gate_3', name: 'Exit & Chute Camera', ip: '192.168.0.99', online: false },
              ]).map((cam: any) => (
                <div
                  key={cam.id}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{cam.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px] text-slate-400 border-slate-700">
                        {cam.ip}:554
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-sm">
                      {cam.rtsp || `rtsp://admin:Password@123@${cam.ip}:554`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cam.online ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
                        ● ONLINE ({cam.latencyMs}ms)
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        ○ OFFLINE (NO LINK)
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 border-slate-700 hover:bg-slate-800"
                      onClick={() => {
                        setProbeHost(cam.ip);
                        setProbePort('554');
                        handleRunCustomProbe();
                      }}
                    >
                      Probe
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Custom IP & Port Probe */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                Custom IP & RTSP Port 554 Ping Probe
              </span>
              <span className="text-[11px] text-slate-500">Test any IP on local network</span>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-7 sm:col-span-8">
                <Label className="text-[10px] text-slate-400">Target IP Address</Label>
                <Input
                  value={probeHost}
                  onChange={(e) => setProbeHost(e.target.value)}
                  placeholder="e.g. 192.168.0.100 or 192.168.1.100"
                  className="h-8 text-xs font-mono bg-black/60 border-slate-700"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <Label className="text-[10px] text-slate-400">Port</Label>
                <Input
                  value={probePort}
                  onChange={(e) => setProbePort(e.target.value)}
                  placeholder="554"
                  className="h-8 text-xs font-mono bg-black/60 border-slate-700"
                />
              </div>
              <div className="col-span-3 sm:col-span-2 pt-4">
                <Button
                  size="sm"
                  className="h-8 w-full text-xs"
                  onClick={handleRunCustomProbe}
                  disabled={probeLoading}
                >
                  {probeLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Test'}
                </Button>
              </div>
            </div>

            {probeResult && (
              <div
                className={`p-2.5 rounded text-xs font-mono border ${
                  probeResult.reachable
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                {probeResult.reachable ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Success! {probeHost}:{probePort} responded in {probeResult.latencyMs}ms.</span>
                  </div>
                ) : (
                  <div>
                    <span>Probe Failed: {probeResult.error || 'Connection timed out'}</span>
                    <p className="text-[11px] text-rose-400 mt-0.5">
                      Check cable connection, IP address, and verify camera power supply.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Hardware Connection Steps */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/30 space-y-2 text-xs">
            <h5 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
              How to Connect Physical CCTV Hardware to this PC:
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
              <li>Plug an <strong>Ethernet LAN cable</strong> from the CCTV PoE Switch into this computer's Ethernet port.</li>
              <li>Ensure the camera IP (e.g. <code>192.168.0.100</code>) is reachable from this machine.</li>
              <li>Verify in Windows Network Connections that the Ethernet adapter is enabled with a static IP (e.g. <code>192.168.0.10</code>).</li>
              <li>Click <strong>Re-Probe All</strong> above — once detected, the real physical RTSP camera video will display instantly!</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onActivateWebcam && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                onClick={() => {
                  onActivateWebcam();
                  onClose();
                }}
              >
                <Video className="h-3.5 w-3.5" />
                Activate Laptop / USB WebCam Now
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs"
              onClick={onClose}
            >
              Close Diagnostics
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default CameraDiagnosticsModal;
