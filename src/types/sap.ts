export interface SapPurchaseOrder {
  poNumber: string;
  vendorCode: string;
  vendorName: string;
  materialCode: string;
  materialName: string;
  category: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  unit: string;
  plantCode: string;
  storageLocation: string;
  defaultVehicle?: string;
  defaultDriver?: string;
  status: 'open' | 'completed' | 'cancelled';
  createdAt?: string;
}

export interface SapStatus {
  connected: boolean;
  systemId: string;
  systemName: string;
  host: string;
  client: string;
  plantCode: string;
  plantName: string;
  rfcStatus: string;
  pingLatencyMs: number;
  lastHeartbeat: string;
}

export interface SapUserData {
  userId?: string;
  username?: string;
  name?: string;
  operatorName?: string;
  roleId?: string;
  roleName?: string;
  department?: string;
  shift?: string;
  plantCode?: string;
}

export interface SapSyncRequest {
  sessionId?: string;
  slipNumber?: string;
  syncType: 'po_ref' | 'without_po' | 'others';
  poNumber?: string;
  itemNo?: string;
  vendorCode?: string;
  vendorName?: string;
  materialCode?: string;
  materialName?: string;
  vehicleRegNo?: string;
  driverName?: string;
  operatorId?: string;
  operatorName?: string;
  userData?: SapUserData;
  transport?: string;
  text?: string;
  challanNo?: string;
  challanWeight?: number;
  challanDate?: string;
  truckInDate?: string;
  truckInTime?: string;
  tareWeight?: number;
  grossWeight?: number;
  netWeight?: number;
  uom?: string;
  plantCode?: string;
  storageLocation?: string;
  notes?: string;
  evidenceImages?: string[];
}

export interface SapSyncResponse {
  success: boolean;
  syncId: string;
  sapDocNumber: string;
  poNumber?: string;
  movementType: string;
  status: string;
  message: string;
  payload?: any;
  response?: any;
}

export interface SapWeighbridgeTransaction {
  id: string;
  sessionId?: string;
  slipNumber?: string;
  syncType: 'po_ref' | 'without_po' | 'others';
  poNumber?: string;
  itemNo?: string;
  vendorCode?: string;
  vendorName?: string;
  materialCode?: string;
  materialName?: string;
  vehicleNo?: string;
  driverName?: string;
  operatorId?: string;
  operatorName?: string;
  transport?: string;
  text?: string;
  challanNo?: string;
  challanWeight?: number;
  challanDate?: string;
  truckInDate?: string;
  truckInTime?: string;
  tareWeight?: number;
  grossWeight?: number;
  netWeight?: number;
  uom?: string;
  sapDocNumber?: string;
  movementType: string;
  plantCode: string;
  storageLocation?: string;
  direction: string;
  status: string;
  notes?: string;
  payload?: any;
  syncedAt: string;
}

export interface SapOutboundDelivery {
  deliveryNumber: string;
  salesOrder: string;
  customerCode: string;
  customerName: string;
  destinationSite: string;
  concreteGrade: string;
  orderedVolumeM3: number;
  batchVolumeM3: number;
  expectedNetWeightKg: number;
  tolerancePercentage: number;
  vehicleNo: string;
  driverName: string;
  driverPhone?: string;
  mixerTareKg: number;
  slumpMm: string;
  waterCementRatio?: string;
  batchPlantBay?: string;
  qcStatus: 'approved' | 'pending' | 'rejected';
  sealNumber?: string;
  ewayBillNo?: string;
  taxInvoiceNo?: string;
  status: 'ready_for_exit' | 'exited' | 'held';
  pgiStatus: 'pending' | 'posted';
  createdAt?: string;
}

export interface SapExitSyncRequest {
  deliveryNumber?: string;
  salesOrder?: string;
  syncType: 'delivery_ref' | 'stock_transfer' | 'others';
  customerName?: string;
  destinationSite?: string;
  concreteGrade?: string;
  batchVolumeM3?: number;
  vehicleRegNo: string;
  driverName?: string;
  sealNumber?: string;
  challanNo?: string;
  ewayBillNo?: string;
  invoiceNo?: string;
  exitDate?: string;
  exitTime?: string;
  tareWeight: number; // in KG
  grossWeight: number; // in KG
  netWeight: number; // in KG
  toleranceVarianceKg?: number;
  toleranceVariancePct?: number;
  qcSlumpMm?: string;
  plantCode?: string;
  notes?: string;
  evidenceImages?: string[];
}

export interface SapExitSyncResponse {
  success: boolean;
  gatePassNumber: string;
  sapPgiDocNumber: string;
  deliveryNumber?: string;
  movementType: string;
  status: string;
  barrierCommand: 'OPEN' | 'HOLD';
  message: string;
  payload?: any;
  response?: any;
}

export interface SapExitTransaction {
  id: string;
  gatePassNumber: string;
  deliveryNumber?: string;
  salesOrder?: string;
  syncType: 'delivery_ref' | 'stock_transfer' | 'others';
  customerName?: string;
  destinationSite?: string;
  concreteGrade?: string;
  vehicleNo: string;
  driverName: string;
  operatorId?: string;
  operatorName?: string;
  tareWeight: number;
  grossWeight: number;
  netWeight: number;
  batchVolumeM3?: number;
  sapPgiDocNumber: string;
  movementType: string;
  plantCode: string;
  status: string;
  barrierStatus: string;
  notes?: string;
  syncedAt: string;
}

export interface SapConnectionConfig {
  id: string;
  connectionType: 'odata_cloud_connector' | 'rfc_netweaver' | 'simulation';
  systemId: string;
  systemName: string;
  host: string;
  port: number;
  client: string;
  sysnr: string;
  username: string;
  passwordMasked: string;
  btpDestinationUrl?: string;
  odataBaseUrl?: string;
  useCloudConnector: boolean;
  cloudConnectorLocationId?: string;
  timeoutMs: number;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestStatus?: string;
  lastTestLatencyMs?: number;
}

export interface SapConnectionTestResult {
  success: boolean;
  systemId: string;
  systemName: string;
  connectionType: string;
  host: string;
  port: number;
  client: string;
  latencyMs: number;
  csrfToken?: string;
  kernelRelease?: string;
  bapiCatalog: Array<{
    name: string;
    description: string;
    status: string;
  }>;
  cloudConnectorStatus?: string;
  timestamp: string;
  logs: string[];
}

export interface SapBillingSyncRequest {
  invoiceId?: string;
  invoiceNumber?: string;
  deliveryNumber?: string;
  salesOrder?: string;
  customerCode?: string;
  customerName?: string;
  concreteGrade?: string;
  batchVolumeM3: number;
  netWeightKg: number;
  subtotalAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  billingType?: string;
  paymentTerms?: string;
}

export interface SapBillingSyncResponse {
  success: boolean;
  syncId: string;
  sapBillingDoc: string;
  sapAccountingDoc: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  payload?: any;
  response?: any;
}

export interface SapBillingTransaction {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
  deliveryNumber?: string;
  salesOrder?: string;
  customerCode?: string;
  customerName?: string;
  concreteGrade?: string;
  batchVolumeM3: number;
  netWeightKg: number;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  sapBillingDoc: string;
  sapAccountingDoc: string;
  billingType: string;
  companyCode: string;
  status: string;
  payload?: any;
  response?: any;
  syncedAt: string;
}

export interface SapSyncQueueItem {
  id: string;
  syncCategory: 'GOODS_RECEIPT_MIGO' | 'GOODS_ISSUE_VL02N' | 'BILLING_VF01' | 'PURCHASE_ORDER_QUERY';
  referenceId?: string;
  targetEndpoint?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retry';
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  errorMessage?: string;
  payload?: any;
  response?: any;
  createdAt: string;
  updatedAt?: string;
}

// ==================== RFC OPERATION TYPES ====================

export interface SapUserAuthCheckRequest {
  userData?: SapUserData;
  plantCode?: string;
  tcode?: string;
}

export interface SapUserAuthCheckResponse {
  success: boolean;
  authorized: boolean;
  rfcFunction: string;
  systemId: string;
  client: string;
  connectionMode: string;
  user: {
    userId: string;
    username: string;
    operatorName: string;
    roleId: string;
    roleName: string;
    department?: string;
    shift?: string;
  };
  plant: {
    code: string;
    name: string;
    storageLocations: string[];
  };
  authProfile: string;
  allowedMovements: string[];
  authorizationObjects: Array<{
    object: string;
    field: string;
    value: string;
    status: string;
    description: string;
  }>;
  tcodeAuthorized: boolean;
  requestedTcode: string;
  sessionToken: string;
  latencyMs: number;
  message: string;
  timestamp: string;
}

export interface SapRfcCheckPoRequest {
  poNumber: string;
  plantCode?: string;
  userData?: SapUserData;
}

export interface SapRfcCheckPoResponse {
  success: boolean;
  poNumber: string;
  error?: string;
  header?: {
    poNumber: string;
    docType: string;
    vendorCode: string;
    vendorName: string;
    companyCode: string;
    purchasingOrg: string;
    purchasingGroup: string;
    plantCode: string;
    currency: string;
    docStatus: string;
    docDate: string;
  };
  item?: {
    itemNo: string;
    materialCode: string;
    materialName: string;
    category: string;
    orderedQty: number;
    receivedQty: number;
    pendingQty: number;
    openBalanceMT: number;
    unit: string;
    plantCode: string;
    storageLocation: string;
    defaultVehicle?: string;
    defaultDriver?: string;
  };
  tolerances?: {
    overDeliveryTolerancePct: number;
    underDeliveryTolerancePct: number;
    maxAllowableNetKg: number;
    unlimitedDelivery: boolean;
  };
  checkedByUser?: {
    userId: string;
    username: string;
    operatorName: string;
  };
  rfcTelemetry?: {
    rfcInterface: string;
    rfcHost: string;
    rfcClient: string;
    systemId: string;
    latencyMs: number;
    timestamp: string;
  };
  bapiReturn?: Array<{
    type: string;
    id: string;
    number: string;
    message: string;
  }>;
}

export interface SapRfcCheckVehicleRequest {
  vehicleRegNo: string;
  plantCode?: string;
  direction?: 'inbound' | 'outbound' | 'all';
  userData?: SapUserData;
}

export interface SapRfcCheckVehicleResponse {
  success: boolean;
  vehicleRegNo: string;
  normalizedPlate: string;
  matchFound: boolean;
  direction: 'inbound' | 'outbound';
  matchedPo?: {
    poNumber: string;
    vendorCode: string;
    vendorName: string;
    materialCode: string;
    materialName: string;
    pendingQty: number;
    unit: string;
    plantCode: string;
    storageLocation: string;
    defaultDriver?: string;
  } | null;
  matchedDelivery?: {
    deliveryNumber: string;
    salesOrder: string;
    customerName: string;
    destinationSite: string;
    concreteGrade: string;
    batchVolumeM3: number;
    expectedNetWeightKg: number;
    mixerTareKg: number;
    driverName: string;
    sealNumber?: string;
  } | null;
  checkedByUser?: {
    userId: string;
    username: string;
    operatorName: string;
  };
  bapiReturn?: Array<{
    type: string;
    id: string;
    number: string;
    message: string;
  }>;
  rfcLatencyMs: number;
  timestamp: string;
}

export interface SapRfcConsumePoRequest {
  poNumber?: string;
  itemNo?: string;
  syncType: 'po_ref' | 'without_po' | 'others';
  vendorCode?: string;
  vendorName?: string;
  materialCode?: string;
  materialName?: string;
  vehicleRegNo: string;
  driverName?: string;
  transport?: string;
  text?: string;
  challanNo?: string;
  challanWeight?: number;
  challanDate?: string;
  truckInDate?: string;
  truckInTime?: string;
  tareWeight: number;
  grossWeight: number;
  netWeight: number;
  uom?: string;
  plantCode?: string;
  storageLocation?: string;
  notes?: string;
  evidenceImages?: string[];
  sessionId?: string;
  slipNumber?: string;
  userData?: SapUserData;
}

export interface SapRfcConsumePoResponse {
  success: boolean;
  syncId: string;
  sapDocNumber: string;
  fiscalYear: string;
  movementType: string;
  poNumber?: string;
  consumedQuantityMT: number;
  remainingBalanceMT: number;
  operator: {
    operatorId: string;
    operatorName: string;
    shift?: string;
  };
  payload?: any;
  response?: any;
  message: string;
}

export interface SapRfcExecuteRequest {
  rfcName: string;
  importParams?: Record<string, any>;
  tables?: Record<string, any[]>;
  userData?: SapUserData;
}

export interface SapRfcExecuteResponse {
  success: boolean;
  rfcFunction: string;
  systemId: string;
  client: string;
  connectionMode: string;
  exportParams?: Record<string, any>;
  tables?: Record<string, any[]>;
  bapiReturn?: Array<{
    type: string;
    id: string;
    number: string;
    message: string;
  }>;
  userAudit?: {
    userId: string;
    username: string;
  };
  latencyMs: number;
  timestamp: string;
}

// ==============================================================================
// WEIGHBRIDGE GATE IN & GATE OUT INTEGRATION TYPES (WITH PO, WITHOUT PO, OTHERS)
// ==============================================================================

export type WeighbridgeScenario = 'WITH_PO' | 'WITHOUT_PO' | 'OTHERS';

export interface SapWeighbridgeGateInRequest {
  scenario: WeighbridgeScenario;
  plantCode: string;
  vehicleRegNo: string;
  firstWeight: number;
  firstWeightType?: 'GROSS' | 'TARE';
  poNumber?: string;
  itemNo?: string;
  vendorCode?: string;
  vendorName?: string;
  materialCode?: string;
  materialName?: string;
  transporter?: string;
  driverName?: string;
  driverPhone?: string;
  challanNo?: string;
  challanWeight?: number;
  challanDate?: string;
  customerName?: string;
  destinationSite?: string;
  storageLocation?: string;
  userData?: SapUserData;
}

export interface SapWeighbridgeGateInResponse {
  success: boolean;
  ticketNumber: string;
  sessionId: string;
  scenario: WeighbridgeScenario;
  stage: 'GATE_IN';
  vehicleRegNo: string;
  firstWeight: number;
  firstWeightType: 'GROSS' | 'TARE';
  plantCode: string;
  poNumber?: string;
  vendorName?: string;
  materialName?: string;
  challanNo?: string;
  gateInTime: string;
  operatorName: string;
  latencyMs: number;
  message: string;
  error?: string;
}

export interface SapActiveTicket {
  ticketNumber: string;
  sessionId: string;
  scenario: WeighbridgeScenario;
  vehicleRegNo: string;
  poNumber?: string;
  vendorName?: string;
  materialName?: string;
  firstWeight: number;
  firstWeightType: 'GROSS' | 'TARE';
  gateInTime: string;
  gateInOperatorName?: string;
  challanNo?: string;
  customerName?: string;
}

export interface SapTicketDetails {
  success: boolean;
  ticketNumber: string;
  sessionId: string;
  scenario: WeighbridgeScenario;
  stage: 'GATE_IN' | 'COMPLETED';
  vehicleRegNo: string;
  plantCode: string;
  poNumber?: string;
  itemNo?: string;
  vendorCode?: string;
  vendorName?: string;
  materialCode?: string;
  materialName?: string;
  transporter?: string;
  driverName?: string;
  challanNo?: string;
  challanWeight?: number | null;
  challanDate?: string;
  customerName?: string;
  destinationSite?: string;
  firstWeight: number;
  firstWeightType: 'GROSS' | 'TARE';
  gateInTime: string;
  gateInOperatorName?: string;
  error?: string;
}

export interface SapWeighbridgeGateOutRequest {
  ticketNumber: string;
  secondWeight: number;
  secondWeightType?: 'TARE' | 'GROSS';
  sealNumber?: string;
  remarks?: string;
  userData?: SapUserData;
}

export interface SapWeighbridgeGateOutResponse {
  success: boolean;
  ticketNumber: string;
  slipNumber: string;
  status: 'COMPLETED';
  scenario: WeighbridgeScenario;
  vehicleRegNo: string;
  materialName: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  sapDocNumber: string;
  movementType: string;
  gateInTime: string;
  gateOutTime: string;
  operatorName: string;
  latencyMs: number;
  message: string;
  error?: string;
}

