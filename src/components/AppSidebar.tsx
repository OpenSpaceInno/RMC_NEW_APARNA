import { 
  LogIn, 
  Scale, 
  Settings,
  LogOut, 
  ArrowRightLeft,
  Factory,
  Users
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const operationsItems = [
  { title: "Gate Monitor", url: "/gate-monitor", icon: LogIn },
  { title: "Weighbridge", url: "/weighbridge", icon: Scale },
];

const adminItems = [
  { title: "Plant Management", url: "/plants", icon: Factory },
  { title: "User Management", url: "/users", icon: Users },
  { title: "Device Config", url: "/device-config", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, hasAccess, activePlant } = useAuth();
  const currentPath = location.pathname;

  // Filter items by role access
  const visibleOperations = operationsItems.filter(item => hasAccess(item.url));
  const visibleAdmin = adminItems.filter(item => hasAccess(item.url));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = user?.roleColor || role?.color || '#3b82f6';
  const roleName = user?.roleName || role?.name || 'Operator';

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <NavLink to="/gate-monitor" className="block focus:outline-none">
          {open ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow">
                <span className="text-white font-bold text-sm">RMC</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-sidebar-foreground truncate">Aparna RMC</h2>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                </div>
                <p className="text-xs text-sidebar-foreground/70 truncate">{activePlant?.code || 'PLANT_001'} • {activePlant?.name.split('•')[1]?.trim() || 'Shamshabad'}</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow">
              <span className="text-white font-bold text-sm">R</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {/* Operations Group */}
        {visibleOperations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={!open ? "sr-only" : ""}>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleOperations.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        className="hover:bg-sidebar-accent transition-colors" 
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {open && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administration Group */}
        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={!open ? "sr-only" : ""}>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        className="hover:bg-sidebar-accent transition-colors" 
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {open && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Session Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3 bg-sidebar/50">
        {open ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: roleColor }}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-sidebar-foreground truncate">
                  {user?.name || 'Operator'}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-1.5 py-0 h-4 border leading-none font-medium truncate max-w-[140px]"
                    style={{ borderColor: `${roleColor}60`, color: roleColor }}
                  >
                    {roleName}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2 flex items-center justify-center gap-1 bg-sidebar-accent/50 hover:bg-sidebar-accent"
                onClick={() => navigate('/login')}
                title="Switch Operational Role"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>Switch</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 flex items-center justify-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                onClick={handleLogout}
                title="Sign Out"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <button 
              onClick={() => navigate('/login')}
              title={`Logged in as ${user?.name} (${roleName}). Click to switch.`}
              className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-primary/40 hover:scale-105 transition-transform"
              style={{ backgroundColor: roleColor }}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
