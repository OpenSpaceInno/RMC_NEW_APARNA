import { useEffect, useState } from 'react';
import { Driver } from '@/types/driver';
import { differenceInDays, format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Bell, AlertTriangle, XCircle, User, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface LicenseExpiryNotificationsProps {
  drivers: Driver[];
  onViewDriver?: (driver: Driver) => void;
}

interface ExpiryNotification {
  driver: Driver;
  daysUntilExpiry: number;
  status: 'expired' | 'critical' | 'warning';
}

export function LicenseExpiryNotifications({ drivers, onViewDriver }: LicenseExpiryNotificationsProps) {
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([]);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    const now = new Date();
    const expiryNotifications: ExpiryNotification[] = [];

    drivers.forEach((driver) => {
      const expiryDate = new Date(driver.license.expiryDate);
      const daysUntil = differenceInDays(expiryDate, now);

      if (daysUntil <= 30) {
        let status: ExpiryNotification['status'];
        if (daysUntil < 0) {
          status = 'expired';
        } else if (daysUntil <= 7) {
          status = 'critical';
        } else {
          status = 'warning';
        }

        expiryNotifications.push({
          driver,
          daysUntilExpiry: daysUntil,
          status,
        });
      }
    });

    // Sort by urgency (expired first, then by days remaining)
    expiryNotifications.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    setNotifications(expiryNotifications);

    // Show toast notification on initial load
    if (!hasShownToast && expiryNotifications.length > 0) {
      const expired = expiryNotifications.filter(n => n.status === 'expired').length;
      const critical = expiryNotifications.filter(n => n.status === 'critical').length;
      
      if (expired > 0) {
        toast.error(`${expired} driver license(s) have expired!`, {
          description: 'Immediate action required',
          duration: 5000,
        });
      } else if (critical > 0) {
        toast.warning(`${critical} driver license(s) expiring within 7 days`, {
          description: 'Please renew soon',
          duration: 5000,
        });
      }
      setHasShownToast(true);
    }
  }, [drivers, hasShownToast]);

  const getStatusConfig = (status: ExpiryNotification['status']) => {
    switch (status) {
      case 'expired':
        return {
          bgColor: 'bg-destructive/10',
          textColor: 'text-destructive',
          borderColor: 'border-destructive/20',
          badgeVariant: 'destructive' as const,
          icon: XCircle,
          label: 'Expired',
        };
      case 'critical':
        return {
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-500',
          borderColor: 'border-red-500/20',
          badgeVariant: 'destructive' as const,
          icon: AlertTriangle,
          label: 'Critical',
        };
      case 'warning':
        return {
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-500',
          borderColor: 'border-amber-500/20',
          badgeVariant: 'outline' as const,
          icon: AlertTriangle,
          label: 'Warning',
        };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  const expiredCount = notifications.filter(n => n.status === 'expired').length;
  const criticalCount = notifications.filter(n => n.status === 'critical').length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Bell className="h-4 w-4 mr-2" />
          License Alerts
          {notifications.length > 0 && (
            <Badge 
              variant={expiredCount > 0 ? 'destructive' : 'default'} 
              className="ml-2"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            License Expiry Notifications
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-destructive/10 text-center">
              <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-center">
              <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical (&lt;7 days)</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
              <p className="text-2xl font-bold text-amber-500">
                {notifications.length - expiredCount - criticalCount}
              </p>
              <p className="text-xs text-muted-foreground">Warning (&lt;30 days)</p>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3 pr-4">
              {notifications.map((notification) => {
                const config = getStatusConfig(notification.status);
                const StatusIcon = config.icon;

                return (
                  <div
                    key={notification.driver.id}
                    className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${config.bgColor}`}>
                          <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{notification.driver.name}</p>
                            <Badge variant={config.badgeVariant} className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.driver.employeeId}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Expires: {format(new Date(notification.driver.license.expiryDate), 'dd MMM yyyy')}
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm font-medium mt-1 ${config.textColor}`}>
                            {notification.daysUntilExpiry < 0
                              ? `Expired ${Math.abs(notification.daysUntilExpiry)} days ago`
                              : notification.daysUntilExpiry === 0
                              ? 'Expires today!'
                              : `${notification.daysUntilExpiry} days remaining`}
                          </p>
                        </div>
                      </div>
                      {onViewDriver && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDriver(notification.driver)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Inline alert component for dashboard/page headers
export function LicenseExpiryAlert({ drivers }: { drivers: Driver[] }) {
  const now = new Date();
  const expiredLicenses = drivers.filter(d => {
    const expiry = new Date(d.license.expiryDate);
    return expiry < now;
  });

  const expiringLicenses = drivers.filter(d => {
    const expiry = new Date(d.license.expiryDate);
    const daysUntil = differenceInDays(expiry, now);
    return daysUntil >= 0 && daysUntil <= 7;
  });

  if (expiredLicenses.length === 0 && expiringLicenses.length === 0) {
    return null;
  }

  return (
    <Alert variant={expiredLicenses.length > 0 ? 'destructive' : 'default'} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>License Expiry Warning</AlertTitle>
      <AlertDescription>
        {expiredLicenses.length > 0 && (
          <span className="block">
            {expiredLicenses.length} driver(s) have expired licenses: {' '}
            {expiredLicenses.map(d => d.name).join(', ')}
          </span>
        )}
        {expiringLicenses.length > 0 && (
          <span className="block">
            {expiringLicenses.length} driver(s) have licenses expiring within 7 days: {' '}
            {expiringLicenses.map(d => d.name).join(', ')}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
