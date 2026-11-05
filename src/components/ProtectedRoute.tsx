import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, ArrowRightLeft, Home, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPath?: string;
  requiredRole?: string;
  requiredPermission?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPath, 
  requiredRole, 
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, role, isAuthenticated, isLoading, hasAccess, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If loading auth state, show a clean skeleton or spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying terminal authorization...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check path access
  const checkPath = requiredPath || location.pathname;
  const authorizedByPath = hasAccess(checkPath);

  // Check specific role requirement if specified
  const authorizedByRole = requiredRole ? (user.roleId === requiredRole || user.roleId === 'admin') : true;

  // Check specific permission if specified
  const authorizedByPermission = requiredPermission ? hasPermission(requiredPermission) : true;

  const isAuthorized = authorizedByPath && authorizedByRole && authorizedByPermission;

  if (!isAuthorized) {
    const roleName = user.roleName || role?.name || 'Operator';
    const roleColor = user.roleColor || role?.color || '#3b82f6';

    return (
      <div className="flex items-center justify-center min-h-[500px] p-4">
        <Card className="max-w-md w-full border-red-500/30 bg-card/95 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-2">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Your operational role does not have permission to view or manage this terminal module.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Logged in as:</span>
                <span className="font-semibold text-foreground">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assigned Role:</span>
                <Badge 
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                  style={{ borderColor: `${roleColor}80`, color: roleColor }}
                >
                  {roleName}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Attempted Route:</span>
                <span className="font-mono text-muted-foreground">{location.pathname}</span>
              </div>
            </div>

            <p className="text-muted-foreground text-center">
              To perform actions in this module, switch to an authorized operational role or contact your System Administrator.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button 
              className="w-full gap-2 text-xs" 
              onClick={() => navigate('/login')}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Switch Operational Role
            </Button>
            <Button 
              variant="outline" 
              className="w-full gap-2 text-xs"
              onClick={() => navigate('/gate-monitor')}
            >
              <Home className="h-3.5 w-3.5" />
              Return to Gate Monitor
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
