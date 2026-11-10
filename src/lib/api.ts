// API client for MySQL backend
import type { AuthResponse, User, Role, DemoUser, LoginCredentials } from '../types/auth';
import type { Plant } from '../types/plant';
import type { FtpConfig } from '../types/deviceConfig';
import type { 
  SapPurchaseOrder, 
  SapStatus, 
  SapSyncRequest, 
  SapSyncResponse, 
  SapWeighbridgeTransaction,
  SapOutboundDelivery,
  SapExitSyncRequest,
  SapExitSyncResponse,
  SapExitTransaction,
  SapConnectionConfig,
  SapConnectionTestResult,
  SapBillingSyncRequest,
  SapBillingSyncResponse,
  SapBillingTransaction,
  SapSyncQueueItem,
  SapUserData,
  SapUserAuthCheckRequest,
  SapUserAuthCheckResponse,
  SapRfcCheckPoRequest,
  SapRfcCheckPoResponse,
  SapRfcCheckVehicleRequest,
  SapRfcCheckVehicleResponse,
  SapRfcConsumePoRequest,
  SapRfcConsumePoResponse,
  SapRfcExecuteRequest,
  SapRfcExecuteResponse,
  SapWeighbridgeGateInRequest,
  SapWeighbridgeGateInResponse,
  SapWeighbridgeGateOutRequest,
  SapWeighbridgeGateOutResponse,
  SapActiveTicket,
  SapTicketDetails
} from '../types/sap';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('rmc_auth_token') : null;
    let userId = '';
    try {
      const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('rmc_auth_user') : null;
      if (storedUser) userId = JSON.parse(storedUser).id;
    } catch (e) {}

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { 'x-user-id': userId } : {}),
      ...(options?.headers as any),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; message: string }>('/health');
  }

  // Database initialization
  async initDatabase() {
    return this.request<{ success: boolean; message: string }>('/init-db', {
      method: 'POST',
    });
  }

  async checkDatabaseStatus() {
    return this.request<{ initialized: boolean; tables: string[]; message: string }>('/db-status');
  }

  // Camera devices
  async getCameras() {
    return this.request<any[]>('/cameras');
  }

  async getCamera(deviceId: string) {
    return this.request<any>(`/cameras/${encodeURIComponent(deviceId)}`);
  }

  async createCamera(data: any) {
    return this.request<{ success: boolean; device_id: string }>('/cameras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCamera(deviceId: string, data: any) {
    return this.request<{ success: boolean }>(`/cameras/${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCamera(deviceId: string) {
    return this.request<{ success: boolean }>(`/cameras/${encodeURIComponent(deviceId)}`, {
      method: 'DELETE',
    });
  }

  async toggleCameraDashboard(deviceId: string, showOnDashboard: boolean) {
    return this.request<{ success: boolean; device_id: string; show_on_dashboard: boolean }>(`/cameras/${encodeURIComponent(deviceId)}/dashboard`, {
      method: 'PUT',
      body: JSON.stringify({ show_on_dashboard: showOnDashboard }),
    });
  }

  async checkCameraDiagnostic(ip: string) {
    return this.request<{
      ip: string;
      reachable: boolean;
      ports: { '554': boolean; '80': boolean; '8000': boolean };
      status: string;
      message: string;
    }>(`/cameras/diagnostic/${ip}`);
  }

  async testProbe(host: string, port: number = 554) {
    return this.request<{
      host: string;
      port: number;
      reachable: boolean;
      latencyMs?: number;
      error?: string;
    }>('/cameras/test-probe', {
      method: 'POST',
      body: JSON.stringify({ host, port }),
    });
  }

  // RTSP configuration
  async getRTSPConfig(deviceId: string) {
    return this.request<any>(`/rtsp-config/${encodeURIComponent(deviceId)}`);
  }

  async saveRTSPConfig(data: any) {
    return this.request<{ success: boolean }>('/rtsp-config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Network configuration
  async getNetworkConfig(deviceId: string) {
    return this.request<any>(`/network-config/${encodeURIComponent(deviceId)}`);
  }

  async saveNetworkConfig(data: any) {
    return this.request<{ success: boolean }>('/network-config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ANPR endpoints
  async getANPREvents(params?: { status?: string; limit?: number; offset?: number }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/anpr/events${queryString}`);
  }

  async getANPREvent(eventId: string) {
    return this.request<any>(`/anpr/events/${eventId}`);
  }

  async createANPREvent(event: any) {
    return this.request<{ success: boolean; event_id: string }>('/anpr/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateANPREvent(eventId: string, updates: any) {
    return this.request<{ success: boolean }>(`/anpr/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async detectPlate(formData: FormData) {
    const url = `${this.baseUrl}/anpr/detect`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Detection failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getANPRConfig(cameraId: string) {
    return this.request<any>(`/anpr/config/${encodeURIComponent(cameraId)}`);
  }

  async updateANPRConfig(cameraId: string, config: any) {
    return this.request<{ success: boolean }>(`/anpr/config/${encodeURIComponent(cameraId)}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // ==================== VEHICLES ====================
  async getVehicles(params?: { status?: string; type?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/vehicles${qs}`);
  }

  async getVehicle(id: string) {
    return this.request<any>(`/vehicles/${id}`);
  }

  async createVehicle(data: any) {
    return this.request<any>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVehicle(id: string, data: any) {
    return this.request<any>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVehicle(id: string) {
    return this.request<{ success: boolean }>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  async assignVehicleDriver(id: string, driverName: string, driverPhone: string) {
    return this.request<{ success: boolean }>(`/vehicles/${id}/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ driverName, driverPhone }),
    });
  }

  async unassignVehicleDriver(id: string) {
    return this.request<{ success: boolean }>(`/vehicles/${id}/unassign-driver`, {
      method: 'POST',
    });
  }

  // ==================== DRIVERS ====================
  async getDrivers(params?: { status?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/drivers${qs}`);
  }

  async getDriver(id: string) {
    return this.request<any>(`/drivers/${id}`);
  }

  async createDriver(data: any) {
    return this.request<any>('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDriver(id: string, data: any) {
    return this.request<any>(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDriver(id: string) {
    return this.request<{ success: boolean }>(`/drivers/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== WEIGHBRIDGE ====================
  async getWeighbridgeSessions(params?: { status?: string; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/weighbridge/sessions${qs}`);
  }

  async startWeighbridgeSession(data: any) {
    return this.request<any>('/weighbridge/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async captureWeighbridgeTare(sessionId: string, tareWeight: number, evidence?: any[]) {
    return this.request<any>(`/weighbridge/sessions/${sessionId}/tare`, {
      method: 'POST',
      body: JSON.stringify({ tareWeight, evidence }),
    });
  }

  async captureWeighbridgeGross(sessionId: string, grossWeight: number, evidence?: any[], extra?: any) {
    return this.request<{ session: any; slipNumber: string }>(`/weighbridge/sessions/${sessionId}/gross`, {
      method: 'POST',
      body: JSON.stringify({ grossWeight, evidence, ...extra }),
    });
  }

  async getWeighSlip(slipNumber: string) {
    return this.request<any>(`/weighbridge/slips/${slipNumber}`);
  }

  // ==================== WEIGHBRIDGE INDICATOR (SERIAL / TCP / WS) ====================
  async getScaleStatus() {
    return this.request<any>('/scale/status');
  }

  async getScaleReading() {
    return this.request<any>('/scale/reading');
  }

  async zeroScale() {
    return this.request<{ success: boolean; message: string }>('/scale/zero', {
      method: 'POST',
    });
  }

  async tareScale() {
    return this.request<{ success: boolean; message: string; tareWeight: number }>('/scale/tare', {
      method: 'POST',
    });
  }

  async injectScaleWeight(weight: number, instant = false) {
    return this.request<{ success: boolean; targetWeight: number }>('/scale/inject', {
      method: 'POST',
      body: JSON.stringify({ weight, instant }),
    });
  }

  async updateScaleConfig(config: any) {
    return this.request<{ success: boolean; config: any }>('/scale/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }



  // ==================== LOADING BAYS ====================
  async getLoadingBays() {
    return this.request<any[]>('/loading/bays');
  }

  async updateBayStatus(id: string, status: string) {
    return this.request<any>(`/loading/bays/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async startLoadingSession(data: any) {
    return this.request<any>('/loading/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLoadingProgress(sessionId: string, overallProgress: number, materials?: any[], status?: string) {
    return this.request<any>(`/loading/sessions/${sessionId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ overallProgress, materials, status }),
    });
  }

  async completeLoadingSession(sessionId: string) {
    return this.request<{ success: boolean }>(`/loading/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  // ==================== DISPATCH ====================
  async getPendingDispatches() {
    return this.request<any[]>('/dispatch/pending');
  }

  async getDispatches(params?: { status?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/dispatch${qs}`);
  }

  async createDispatch(data: any) {
    return this.request<any>('/dispatch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveDispatch(id: string, approvedBy?: string, route?: any) {
    return this.request<any>(`/dispatch/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy, route }),
    });
  }

  async rejectDispatch(id: string, reason: string, rejectedBy?: string) {
    return this.request<any>(`/dispatch/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, rejectedBy }),
    });
  }

  // ==================== TRIPS ====================
  async getTrips(params?: { status?: string; vehicleRegNo?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/trips${qs}`);
  }

  async getTrip(id: string) {
    return this.request<any>(`/trips/${id}`);
  }

  async createTrip(data: any) {
    return this.request<any>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTripStatus(id: string, status: string) {
    return this.request<any>(`/trips/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateTripLocation(id: string, telemetry: { latitude: number; longitude: number; speed?: number; distanceCovered?: number; distanceRemaining?: number }) {
    return this.request<{ success: boolean; location: any }>(`/trips/${id}/location`, {
      method: 'POST',
      body: JSON.stringify(telemetry),
    });
  }

  async deleteTrip(id: string) {
    return this.request<{ success: boolean }>(`/trips/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== EXIT VERIFICATION ====================
  async getExitVerifications(params?: { status?: string; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/exit-verifications${qs}`);
  }

  async createExitVerification(data: any) {
    return this.request<any>('/exit-verifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== INCIDENTS ====================
  async getIncidents(params?: { status?: string; severity?: string; type?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/incidents${qs}`);
  }

  async getIncident(id: string) {
    return this.request<any>(`/incidents/${id}`);
  }

  async createIncident(data: any) {
    return this.request<any>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIncident(id: string, data: any) {
    return this.request<any>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async assignIncident(id: string, assignedTo: string) {
    return this.request<any>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ assignedTo, status: 'investigating' }),
    });
  }

  async addIncidentEvidence(id: string, evidence: any) {
    try {
      const inc = await this.getIncident(id);
      const existing = (inc && Array.isArray(inc.evidence)) ? inc.evidence : [];
      return this.request<any>(`/incidents/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ evidence: [...existing, evidence] }),
      });
    } catch {
      return this.request<any>(`/incidents/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ evidence: [evidence] }),
      });
    }
  }

  async addIncidentComment(id: string, commentOrObj: any, userId?: string, userName?: string) {
    const comment = typeof commentOrObj === 'string' ? commentOrObj : commentOrObj?.comment;
    const uid = typeof commentOrObj === 'object' ? commentOrObj?.userId : userId;
    const uname = typeof commentOrObj === 'object' ? commentOrObj?.userName : userName;
    return this.request<any>(`/incidents/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment, userId: uid, userName: uname }),
    });
  }

  async resolveIncident(id: string, resolution: string) {
    return this.request<any>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved', resolution }),
    });
  }

  // ==================== FUEL RECORDS ====================
  async getFuelRecords(params?: { vehicleId?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/fuel/records${qs}`);
  }

  async createFuelRecord(data: any) {
    return this.request<any>('/fuel/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteFuelRecord(id: string) {
    return this.request<{ success: boolean }>(`/fuel/records/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== MAINTENANCE ====================
  async getMaintenanceTasks(params?: { status?: string; vehicleId?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/maintenance/tasks${qs}`);
  }

  async createMaintenanceTask(data: any) {
    return this.request<any>('/maintenance/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaintenanceTask(id: string, data: any) {
    return this.request<any>(`/maintenance/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMaintenanceTask(id: string) {
    return this.request<{ success: boolean }>(`/maintenance/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== BILLING ====================
  async getInvoices(params?: { status?: string; customerId?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/billing/invoices${qs}`);
  }

  async createInvoice(data: any) {
    return this.request<any>('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordPayment(data: any) {
    return this.request<{ success: boolean; paymentId: string }>('/billing/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== INVENTORY ====================
  async getInventoryItems(params?: { category?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/inventory/items${qs}`);
  }

  async createInventoryItem(data: any) {
    return this.request<any>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id: string, data: any) {
    return this.request<any>(`/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventoryItem(id: string) {
    return this.request<{ success: boolean }>(`/inventory/items/${id}`, {
      method: 'DELETE',
    });
  }

  async getStockMovements(params?: { itemId?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/inventory/movements${qs}`);
  }

  async recordStockMovement(data: any) {
    return this.request<{ success: boolean; movementId: string; newStock: number }>('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReorderAlerts() {
    return this.request<any[]>('/inventory/reorder-alerts');
  }

  // ==================== AUDIT LOGS ====================
  async getAuditLogs(params?: { module?: string; severity?: string; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/audit-logs${qs}`);
  }

  async createAuditLog(data: any) {
    return this.request<any>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== REPORTS ====================
  async getGeneratedReports() {
    return this.request<any[]>('/reports/generated');
  }

  async generateReport(data: any) {
    return this.request<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== AUTHENTICATION ====================
  async login(credentials: LoginCredentials) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.request<{ user: User }>('/auth/me');
  }

  async getDemoUsers() {
    return this.request<DemoUser[]>('/auth/demo-users');
  }

  // ==================== USER MANAGEMENT ====================
  async getUsers(params?: { roleId?: string; status?: string; search?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<User[]>(`/users${qs}`);
  }

  async getUser(id: string) {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: Partial<User> & { password?: string }) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
    return this.request<{ success: boolean }>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== ROLE MANAGEMENT ====================
  async getRoles() {
    return this.request<Role[]>('/roles');
  }

  async getRole(id: string) {
    return this.request<Role>(`/roles/${id}`);
  }

  async createRole(data: Partial<Role>) {
    return this.request<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: Partial<Role>) {
    return this.request<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string) {
    return this.request<{ success: boolean }>(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== PLANT MANAGEMENT ====================
  async getPlants(params?: { status?: string; search?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<Plant[]>(`/plants${qs}`);
  }

  async getPlant(id: string) {
    return this.request<Plant>(`/plants/${id}`);
  }

  async createPlant(data: Partial<Plant>) {
    return this.request<Plant>('/plants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlant(id: string, data: Partial<Plant>) {
    return this.request<Plant>(`/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlant(id: string) {
    return this.request<{ success: boolean }>(`/plants/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== SAP ERP INTEGRATION ====================
  async getSapStatus() {
    return this.request<SapStatus>('/sap/status');
  }

  async getSapPurchaseOrders(params?: { search?: string; category?: string; status?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<SapPurchaseOrder[]>(`/sap/pos${qs}`);
  }

  async getSapPurchaseOrder(poNumber: string) {
    return this.request<SapPurchaseOrder>(`/sap/po/${poNumber}`);
  }

  async syncSapWeighbridge(data: SapSyncRequest) {
    return this.request<SapSyncResponse>('/sap/weighbridge/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSapTransactions(params?: { syncType?: string; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<SapWeighbridgeTransaction[]>(`/sap/weighbridge/transactions${qs}`);
  }

  async getSapOutboundDeliveries(params?: { search?: string; status?: string }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<SapOutboundDelivery[]>(`/sap/outbound-deliveries${qs}`);
  }

  async syncSapExitVerification(data: SapExitSyncRequest) {
    return this.request<SapExitSyncResponse>('/sap/exit/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSapExitTransactions(params?: { syncType?: string; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<SapExitTransaction[]>(`/sap/exit/transactions${qs}`);
  }

  // ==================== SAP PRODUCTION CONNECTION & SYNC QUEUE ====================
  async getSapConnectionConfig() {
    return this.request<SapConnectionConfig>('/sap/connection/config');
  }

  async updateSapConnectionConfig(data: Partial<SapConnectionConfig>) {
    return this.request<{ success: boolean; config: SapConnectionConfig; message: string }>('/sap/connection/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async testSapConnection(config?: Partial<SapConnectionConfig>) {
    return this.request<SapConnectionTestResult>('/sap/connection/test', {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
  }

  async syncSapBilling(data: SapBillingSyncRequest) {
    return this.request<SapBillingSyncResponse>('/sap/billing/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSapBillingTransactions(params?: { status?: string; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<SapBillingTransaction[]>(`/sap/billing/transactions${qs}`);
  }

  async getSapSyncQueue(params?: { status?: string; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<SapSyncQueueItem[]>(`/sap/sync-queue${qs}`);
  }

  async retrySapSyncQueueItem(id: string) {
    return this.request<{ success: boolean; queueId: string; status: string; result?: any; error?: string }>(`/sap/sync-queue/${id}/retry`, {
      method: 'POST',
    });
  }


  // ==================== SAP USER DATA HELPER ====================
  getStoredUserData(): SapUserData {
    try {
      const stored = localStorage.getItem('rmc_auth_user') || localStorage.getItem('rmc_user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          userId: u.id || 'USR-003',
          username: u.username || 'weighbridge.op',
          name: u.name || 'Ramesh Kulkarni',
          operatorName: u.name || 'Ramesh Kulkarni',
          roleId: u.roleId || u.role?.id || 'weighbridge_operator',
          roleName: u.roleName || u.role?.name || 'Weighbridge Scale Operator',
          department: u.department || 'Weighbridge Operations',
          shift: u.shift || 'Morning Shift (06:00 - 14:00)',
          plantCode: 'PL01'
        };
      }
    } catch {
      // fallback
    }
    return {
      userId: 'USR-003',
      username: 'weighbridge.op',
      name: 'Ramesh Kulkarni',
      operatorName: 'Ramesh Kulkarni',
      roleId: 'weighbridge_operator',
      roleName: 'Weighbridge Scale Operator',
      department: 'Weighbridge Operations',
      shift: 'Morning Shift (06:00 - 14:00)',
      plantCode: 'PL01'
    };
  }

  // ==================== SAP RFC INTEGRATION FOR WEIGHBRIDGE ====================
  async checkSapUserAuth(data?: SapUserAuthCheckRequest) {
    const payload = {
      userData: data?.userData || this.getStoredUserData(),
      plantCode: data?.plantCode || 'PL01',
      tcode: data?.tcode || 'ZWB_GATEIN'
    };
    return this.request<SapUserAuthCheckResponse>('/sap/rfc/check-user', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async checkSapPoViaRfc(data: SapRfcCheckPoRequest) {
    const payload = {
      ...data,
      userData: data.userData || this.getStoredUserData()
    };
    return this.request<SapRfcCheckPoResponse>('/sap/rfc/check-po', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async checkSapVehicleViaRfc(data: SapRfcCheckVehicleRequest) {
    const payload = {
      ...data,
      userData: data.userData || this.getStoredUserData()
    };
    return this.request<SapRfcCheckVehicleResponse>('/sap/rfc/check-vehicle', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async consumeSapPoViaRfc(data: SapRfcConsumePoRequest) {
    const payload = {
      ...data,
      userData: data.userData || this.getStoredUserData()
    };
    return this.request<SapRfcConsumePoResponse>('/sap/rfc/consume-po', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async checkSapDeliveryViaRfc(deliveryNumber: string, userData?: SapUserData) {
    const payload = {
      deliveryNumber,
      userData: userData || this.getStoredUserData()
    };
    return this.request<any>('/sap/rfc/check-delivery', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async consumeSapDeliveryViaRfc(data: any, userData?: SapUserData) {
    const payload = {
      ...data,
      userData: userData || data.userData || this.getStoredUserData()
    };
    return this.request<any>('/sap/rfc/consume-delivery', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async executeSapRfc(data: SapRfcExecuteRequest) {
    const payload = {
      ...data,
      userData: data.userData || this.getStoredUserData()
    };
    return this.request<SapRfcExecuteResponse>('/sap/rfc/execute', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // ==================== WEIGHBRIDGE GATE IN & GATE OUT (SAP RFC) ====================
  async postWeighbridgeGateIn(data: SapWeighbridgeGateInRequest) {
    const payload = {
      ...data,
      userData: data.userData || this.getStoredUserData()
    };
    return this.request<SapWeighbridgeGateInResponse>('/sap/weighbridge/gate-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getWeighbridgeTicket(ticketNumber: string) {
    return this.request<SapTicketDetails>(`/sap/weighbridge/ticket/${encodeURIComponent(ticketNumber)}`);
  }

  async getActiveWeighbridgeTickets() {
    return this.request<{ success: boolean; count: number; tickets: SapActiveTicket[] }>('/sap/weighbridge/active-tickets');
  }

  async postWeighbridgeGateOut(data: SapWeighbridgeGateOutRequest) {
    const payload = {
      ...data,
      userData: data.userData || this.getStoredUserData()
    };
    return this.request<SapWeighbridgeGateOutResponse>('/sap/weighbridge/gate-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // ==================== CAMERAS & SURVEILLANCE ====================
  async getCameraStreamStatus() {
    return this.request<any>('/cameras/stream-status');
  }

  async getCameraDiagnostics() {
    return this.request<{
      timestamp: string;
      mediaServerActive: boolean;
      recommendation: string;
      cameraProbes: Array<{
        id: string;
        name: string;
        ip: string;
        rtsp: string;
        hlsProxy: string;
        online: boolean;
        latencyMs: number | null;
        probeError: string | null;
      }>;
      networkSummary: {
        allCamerasOffline: boolean;
        activeHlsUrls: Record<string, string>;
      };
    }>('/cameras/diagnostics');
  }

  async probeCamera(data: { host: string; port?: number }) {
    return this.request<{
      host: string;
      port: number;
      reachable: boolean;
      latencyMs?: number;
      error?: string;
    }>('/cameras/test-probe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== EDGE ANPR ====================
  async recognizeEdgePlate(image: string, cameraId?: string) {
    return this.request<{
      success: boolean;
      plate?: string;
      confidence?: number;
      engine?: string;
      vehicleType?: string;
      eventId?: string;
      error?: string;
    }>('/anpr/recognize-edge', {
      method: 'POST',
      body: JSON.stringify({ image, cameraId }),
    });
  }

  // ==================== FTP / SFTP STORAGE ====================
  async uploadToFtp(data: {
    image: string;
    filename?: string;
    vehicleRegNo?: string;
    angle?: string;
    weight?: number;
    sessionId?: string;
    cameraName?: string;
    cameraIp?: string;
    gateType?: string;
    targetUser?: string;
  }) {
    return this.request<{
      success: boolean;
      filename: string;
      remotePath: string;
      ftpUrl: string;
      sftpUrl: string;
      httpProxyUrl: string;
      webAdminUrl: string;
      targetUser?: string;
      sizeBytes: number;
      angle: string;
      vehicleRegNo: string;
      weight?: number;
      cameraName?: string;
      timestamp: string;
    }>('/ftp/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFtpStatus() {
    return this.request<{
      online: boolean;
      host: string;
      ftpPort: string;
      sftpPort: string;
      username: string;
      targetFolder: string;
      webAdminUrl: string;
      message: string;
      error?: string;
    }>('/ftp/status');
  }

  async getRecentFtpUploads(limit = 20) {
    return this.request<any[]>(`/ftp/recent?limit=${limit}`);
  }

  async getLatestFtpPlate() {
    return this.request<{
      success: boolean;
      plate?: string;
      filename?: string;
      imageUrl?: string;
      sizeBytes?: number;
      channel?: string;
      timestamp?: string;
      lastModified?: string;
      message?: string;
    }>('/ftp/latest-plate');
  }

  async getFtpPlates(limit = 20) {
    return this.request<Array<{
      plate: string;
      filename: string;
      sizeBytes: number;
      channel: string;
      timestamp: string;
      lastModified: string;
      imageUrl: string;
    }>>(`/ftp/plates?limit=${limit}`);
  }

  async getFtpConfig() {
    return this.request<{
      success: boolean;
      config: FtpConfig;
    }>('/ftp/config');
  }

  async updateFtpConfig(data: Partial<FtpConfig>) {
    return this.request<{
      success: boolean;
      message: string;
      config: FtpConfig;
    }>('/ftp/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async testFtpConnection(data?: Partial<FtpConfig>) {
    return this.request<{
      success: boolean;
      latencyMs?: number;
      tokenExpiry?: string;
      message?: string;
      error?: string;
      host?: string;
      user?: string;
    }>('/ftp/test', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }
}


export const api = new ApiClient(API_BASE_URL);

