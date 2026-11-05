import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

import Dashboard from "./pages/Dashboard";
import GateMonitor from "./pages/GateMonitor";
import Weighbridge from "./pages/Weighbridge";
import LoadingConsole from "./pages/LoadingConsole";
import DispatchApproval from "./pages/DispatchApproval";
import TripManagement from "./pages/TripManagement";
import TripTracking from "./pages/TripTracking";
import ExitVerification from "./pages/ExitVerification";
import IncidentManagement from "./pages/IncidentManagement";
import CustomerPortal from "./pages/CustomerPortal";
import DeviceConfig from "./pages/DeviceConfig";
import DatabaseSetup from "./pages/DatabaseSetup";
import VehicleManagement from "./pages/VehicleManagement";
import DriverManagement from "./pages/DriverManagement";
import TripAnalytics from "./pages/TripAnalytics";
import FuelManagement from "./pages/FuelManagement";
import MaintenanceScheduler from "./pages/MaintenanceScheduler";
import Billing from "./pages/Billing";
import InventoryManagement from "./pages/InventoryManagement";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import PlantManagement from "./pages/PlantManagement";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary fallbackTitle="Application Error">
            <Layout>
              <ErrorBoundary fallbackTitle="View Error">
                <Routes>
              {/* Standalone Login Page */}
              <Route path="/login" element={<Login />} />

              {/* Default navigation to Gate Monitor */}
              <Route 
                path="/" 
                element={<Navigate to="/gate-monitor" replace />} 
              />
              <Route 
                path="/dashboard" 
                element={<ProtectedRoute requiredPath="/"><Dashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/gate-monitor" 
                element={<ProtectedRoute requiredPath="/gate-monitor"><GateMonitor /></ProtectedRoute>} 
              />
              <Route 
                path="/weighbridge" 
                element={<ProtectedRoute requiredPath="/weighbridge"><Weighbridge /></ProtectedRoute>} 
              />
              <Route 
                path="/loading" 
                element={<ProtectedRoute requiredPath="/loading"><LoadingConsole /></ProtectedRoute>} 
              />
              <Route 
                path="/dispatch" 
                element={<ProtectedRoute requiredPath="/dispatch"><DispatchApproval /></ProtectedRoute>} 
              />

              {/* Tracking & Incidents Routes */}
              <Route 
                path="/trips" 
                element={<ProtectedRoute requiredPath="/trips"><TripManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/trip-tracking" 
                element={<ProtectedRoute requiredPath="/trip-tracking"><TripTracking /></ProtectedRoute>} 
              />
              <Route 
                path="/trip-analytics" 
                element={<ProtectedRoute requiredPath="/trip-analytics"><TripAnalytics /></ProtectedRoute>} 
              />
              <Route 
                path="/exit-verification" 
                element={<ProtectedRoute requiredPath="/exit-verification"><ExitVerification /></ProtectedRoute>} 
              />
              <Route 
                path="/incidents" 
                element={<ProtectedRoute requiredPath="/incidents"><IncidentManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/audit-logs" 
                element={<ProtectedRoute requiredPath="/audit-logs"><AuditLogs /></ProtectedRoute>} 
              />

              {/* Fleet Management Routes */}
              <Route 
                path="/vehicles" 
                element={<ProtectedRoute requiredPath="/vehicles"><VehicleManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/drivers" 
                element={<ProtectedRoute requiredPath="/drivers"><DriverManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/fuel" 
                element={<ProtectedRoute requiredPath="/fuel"><FuelManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/maintenance" 
                element={<ProtectedRoute requiredPath="/maintenance"><MaintenanceScheduler /></ProtectedRoute>} 
              />

              {/* Commercial & Stores Routes */}
              <Route 
                path="/customer-portal" 
                element={<ProtectedRoute requiredPath="/customer-portal"><CustomerPortal /></ProtectedRoute>} 
              />
              <Route 
                path="/billing" 
                element={<ProtectedRoute requiredPath="/billing"><Billing /></ProtectedRoute>} 
              />
              <Route 
                path="/inventory" 
                element={<ProtectedRoute requiredPath="/inventory"><InventoryManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/reports" 
                element={<ProtectedRoute requiredPath="/reports"><Reports /></ProtectedRoute>} 
              />

              {/* Administration & Configuration Routes */}
              <Route 
                path="/plants" 
                element={<ProtectedRoute requiredPath="/plants"><PlantManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/plant-management" 
                element={<Navigate to="/plants" replace />} 
              />
              <Route 
                path="/users" 
                element={<ProtectedRoute requiredPath="/users"><UserManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/roles" 
                element={<ProtectedRoute requiredPath="/roles"><RoleManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/device-config" 
                element={<ProtectedRoute requiredPath="/device-config"><DeviceConfig /></ProtectedRoute>} 
              />
              <Route 
                path="/database-setup" 
                element={<ProtectedRoute requiredPath="/database-setup"><DatabaseSetup /></ProtectedRoute>} 
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
