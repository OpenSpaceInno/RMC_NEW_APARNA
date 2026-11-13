import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRightLeft, 
  LogOut, 
  Factory
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, role, isSuperAdmin, logout, activePlant, plants, switchPlant, refreshPlants } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // On login route, render standalone without sidebar & header
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const roleColor = user?.roleColor || role?.color || '#8b5cf6';
  const roleName = user?.roleName || role?.name || 'Operator';

  const handleLogout = () => {
    logout();
    navigate('/login');
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
                
                {/* Plant Dropdown (All Plants + DB Plants) for Super Admin, Locked Badge for Plant Users */}
                {isSuperAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={activePlant?.id || 'all'}
                      onValueChange={switchPlant}
                      onOpenChange={(open) => {
                        if (open) refreshPlants();
                      }}
                    >
                      <SelectTrigger
                        className="h-8 min-w-[190px] max-w-[300px] bg-amber-500/10 border-amber-500/30 text-amber-200 text-xs font-semibold gap-1.5"
                        title="Select Plant (All Plants or specific plant from database)"
                      >
                        <Factory className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <SelectValue placeholder="All Plants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Plants (Default)
                        </SelectItem>
                        {plants.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
