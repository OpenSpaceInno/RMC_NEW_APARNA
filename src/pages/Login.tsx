import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Factory, 
  Scale, 
  Lock, 
  UserCircle, 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Truck, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Camera,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function Login() {
  const { login, isLoading, plants, activePlant, switchPlant } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [selectedPlantId, setSelectedPlantId] = useState<string>(activePlant?.id || 'PL01');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with active plant if it changes
  useEffect(() => {
    if (activePlant?.id) {
      setSelectedPlantId(activePlant.id);
    }
  }, [activePlant]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const success = await login({ 
        username: username.trim(), 
        password, 
        plantId: selectedPlantId 
      });

      if (success) {
        navigate('/gate-monitor');
      } else {
        setErrorMessage('Invalid login details');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid login details');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickPreset = (userType: 'admin' | 'weigh_op' | 'miyapur_op') => {
    setErrorMessage(null);
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
      setSelectedPlantId('PL01');
      switchPlant('PL01');
    } else if (userType === 'weigh_op') {
      setUsername('weigh_op');
      setPassword('weigh123');
      setSelectedPlantId('PL01');
      switchPlant('PL01');
    } else {
      setUsername('op_miyapur');
      setPassword('plant123');
      setSelectedPlantId('PL02');
      switchPlant('PL02');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-orange-600/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40">
            <Factory className="h-5 w-5 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-white to-slate-200 bg-clip-text text-transparent">
                Aparna RMC
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-300 border-amber-500/30">
                Ready-Mix Concrete
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Aparna Enterprises Limited • Plant Operations & Telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">System Online • Toledo Scale Synchronized</span>
          </div>
          <Badge variant="secondary" className="bg-slate-900 text-slate-400 border border-slate-800 text-[11px] font-mono">
            v2.4.0-Enterprise
          </Badge>
        </div>
      </header>

      {/* Main Content: Split Hero & Login Console */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-black/80">
          
          {/* Left Hero & RMC Brand Showcase (Visible on Large Screens) */}
          <div className="lg:col-span-7 relative min-h-[420px] lg:min-h-[620px] p-8 lg:p-12 flex flex-col justify-between overflow-hidden bg-slate-950">
            {/* Cinematic RMC Plant Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
              style={{ backgroundImage: `url('/images/rmc-plant-hero.jpg')` }}
            />
            {/* Dual gradient overlay for high legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Top Brand Pill */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md text-amber-300 text-xs font-semibold mb-4 shadow-lg shadow-amber-500/10">
                <Truck className="h-3.5 w-3.5 text-amber-400" />
                Transit Mixer & Weighbridge Automation
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Precision RMC <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                  Plant Operations
                </span>
              </h1>
              <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-lg leading-relaxed font-normal drop-shadow">
                Real-time electronic weighbridge capture, multi-angle camera feeds, and automated gate security designed for zero-leakage concrete dispatch.
              </p>
            </div>

            {/* Live Operational Metrics & Telemetry Cards */}
            <div className="relative z-10 mt-8 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                    <Scale className="h-3.5 w-3.5" />
                    Scale Toledo
                  </div>
                  <div className="text-lg font-bold text-white mt-1">±0.05%</div>
                  <div className="text-[10px] text-slate-400 font-mono">Pitless Scale Precision</div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <Camera className="h-3.5 w-3.5" />
                    Edge ANPR
                  </div>
                  <div className="text-lg font-bold text-white mt-1">99.4%</div>
                  <div className="text-[10px] text-slate-400 font-mono">Vehicle Plate Accuracy</div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                    <Cpu className="h-3.5 w-3.5" />
                    Turnaround
                  </div>
                  <div className="text-lg font-bold text-white mt-1">&lt; 45s</div>
                  <div className="text-[10px] text-slate-400 font-mono">Gross Weight Velocity</div>
                </div>
              </div>

              {/* Security & Status Pill */}
              <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Encrypted Hardware Interfacing</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">ISO 9001:2015 Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Authentication Console */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-slate-900/90 relative">
            <div className="max-w-md w-full mx-auto space-y-6">
              
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Security Terminal
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                    Live Portal
                  </Badge>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Plant Operator Sign In
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Authenticate your credentials to access gate monitors, weighment capture, and telemetry controls.
                </p>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-lg shadow-red-950/40">
                  <div className="h-6 w-6 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <div className="font-semibold text-red-200">{errorMessage}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Plant Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="plant-select" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Operating Plant Terminal</span>
                    <span className="text-[10px] text-amber-400/90 font-mono">Multi-Plant Terminal</span>
                  </Label>
                  <div className="relative">
                    <select
                      id="plant-select"
                      value={selectedPlantId}
                      onChange={(e) => {
                        setSelectedPlantId(e.target.value);
                        switchPlant(e.target.value);
                      }}
                      className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all cursor-pointer shadow-inner"
                    >
                      {plants.map((p) => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white py-1">
                          {p.name} ({p.code}) • {p.city}
                        </option>
                      ))}
                    </select>
                    <Factory className="h-4 w-4 text-amber-400 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-semibold text-slate-300">
                    Operator ID / Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or weigh_op"
                      required
                      className="bg-slate-950/90 border-slate-800 hover:border-slate-700 text-white pl-10 rounded-xl text-xs h-10 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all shadow-inner"
                    />
                    <UserCircle className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                      Security Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="bg-slate-950/90 border-slate-800 hover:border-slate-700 text-white pl-10 pr-10 rounded-xl text-xs h-10 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all shadow-inner"
                    />
                    <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-slate-500" />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In Button */}
                <Button 
                  type="submit" 
                  disabled={submitting || isLoading}
                  className="w-full h-11 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Operator...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Sign In to Plant Console</span>
                      <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                    </>
                  )}
                </Button>

                {/* Quick Preset Selector with Designated Plant Terminals */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-medium text-slate-400">Quick Test Credentials (3-Way Verification):</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => fillQuickPreset('admin')}
                      className={`text-left p-2 rounded-xl border transition-all flex flex-col justify-between ${
                        username === 'admin' 
                          ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-md shadow-purple-950/50' 
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                        <span className="font-bold text-[11px] truncate">Admin</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 font-mono">admin123</div>
                      <Badge variant="outline" className="mt-1.5 text-[9px] px-1 py-0 bg-purple-500/10 border-purple-500/30 text-purple-300 w-fit">
                        Plant PL01
                      </Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillQuickPreset('weigh_op')}
                      className={`text-left p-2 rounded-xl border transition-all flex flex-col justify-between ${
                        username === 'weigh_op' 
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-md shadow-emerald-950/50' 
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-bold text-[11px] truncate">Weigh Op</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 font-mono">weigh123</div>
                      <Badge variant="outline" className="mt-1.5 text-[9px] px-1 py-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 w-fit">
                        Plant PL01
                      </Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillQuickPreset('miyapur_op')}
                      className={`text-left p-2 rounded-xl border transition-all flex flex-col justify-between ${
                        username === 'op_miyapur' 
                          ? 'bg-blue-950/40 border-blue-500/50 text-blue-200 shadow-md shadow-blue-950/50' 
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Factory className="h-3.5 w-3.5 text-blue-400" />
                        <span className="font-bold text-[11px] truncate">Miyapur</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 font-mono">plant123</div>
                      <Badge variant="outline" className="mt-1.5 text-[9px] px-1 py-0 bg-blue-500/10 border-blue-500/30 text-blue-300 w-fit">
                        Plant PL02
                      </Badge>
                    </button>
                  </div>
                </div>

              </form>

              {/* Bottom Security Note */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                  <Lock className="h-3 w-3 text-slate-500" />
                  Protected by Aparna 256-bit Gate & Scale Encryption Protocol
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 py-3.5 text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <div>
            © {new Date().getFullYear()} <span className="text-slate-400 font-medium">Aparna Enterprises Limited</span>. Ready Mix Concrete Division. All rights reserved.
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Toledo Scale Calibration: Active</span>
            <span>•</span>
            <span>ANPR Engine: Online</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono font-medium">TLS 1.3 Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
