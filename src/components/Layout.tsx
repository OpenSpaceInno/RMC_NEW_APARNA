import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRightLeft, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  Building,
  User as UserIcon,
  Factory
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, role, logout, switchRole, activePlant, plants, switchPlant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // On login route, render standalone without sidebar & header
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const roleColor = user?.roleColor || role?.color || '#8b5cf6';
  const roleName = user?.roleName || role?.name || 'Operator';
  const activeRoleId = user?.roleId || role?.id || 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoleId = e.target.value;
    if (newRoleId && newRoleId !== activeRoleId) {
      await switchRole(newRoleId);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-card/90 backdrop-blur-md flex items-center px-4 sticky top-0 z-20">
            <SidebarTrigger className="mr-3" />
            
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  RMC Operations
                </h1>
                
                {/* Multi-Plant Selector for Admin or Plant Badge for Operator */}
                {activeRoleId === 'admin' ? (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-xs text-amber-300 border border-amber-500/30">
                    <Factory className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-amber-200 hidden md:inline">Plant:</span>
                    <select
                      value={activePlant?.id || 'PL01'}
                      onChange={(e) => switchPlant(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer pr-1"
                      title="Admin: Switch Monitored Plant Terminal"
                    >
                      {plants.map((p) => (
                        <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-foreground border border-border/60">
                    <Factory className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium truncate max-w-[200px]">{activePlant?.name || 'Plant 01 • Shamshabad'}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-emerald-500/40 text-emerald-400">
                      Assigned
                    </Badge>
                  </div>
                )}
              </div>

              {/* Right User Bar */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {user ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex flex-col items-end text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                          {user.name}
                        </span>
                        <Badge 
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border leading-none font-medium"
                          style={{ borderColor: `${roleColor}60`, color: roleColor, backgroundColor: `${roleColor}15` }}
                        >
                          {roleName}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {user.shift || user.department || 'Operations'}
                      </span>
                    </div>

                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ring-1 ring-border"
                      style={{ backgroundColor: roleColor }}
                      title={`${user.name} (${roleName})`}
                    >
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
                    </div>

                    {/* Quick Interactive Role Switcher Dropdown */}
                    <div className="flex items-center gap-1.5 bg-muted/70 hover:bg-muted px-2 py-1 rounded-md border border-border/80 transition-colors">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[11px] text-muted-foreground hidden lg:inline font-medium">Active:</span>
                      <select
                        value={activeRoleId}
                        onChange={handleRoleSelect}
                        className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
                        title="Switch Active Operational Role (Admin / Plant Manager, Weighbridge In-charge)"
                      >
                        <option value="admin" className="bg-popover text-popover-foreground">👑 Admin / Plant Manager</option>
                        <option value="weighbridge_operator" className="bg-popover text-popover-foreground">⚖️ Weighbridge In-charge</option>
                      </select>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/login')}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
                      title="Switch User / Login Portal"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
                      title="Sign Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="h-8 text-xs font-medium"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-background min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
