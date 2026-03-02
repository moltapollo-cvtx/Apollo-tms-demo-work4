import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  organizations,
  users,
  customers,
  contacts,
  locations,
  drivers,
  driverQualifications,
  driverCertifications,
  tractors,
  trailers,
  chargeCodes,
  orders,
  stops,
  assignments,
  trackingEvents,
  charges,
  invoices,
  invoiceLineItems,
  settlements,
  settlementItems,
  documents,
  integrations,
  notifications,
  auditLog,
} from "@/lib/db/schema";

// Database Table Types
export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;

export type Contact = InferSelectModel<typeof contacts>;
export type NewContact = InferInsertModel<typeof contacts>;

export type Location = InferSelectModel<typeof locations>;
export type NewLocation = InferInsertModel<typeof locations>;

export type Driver = InferSelectModel<typeof drivers>;
export type NewDriver = InferInsertModel<typeof drivers>;

export type DriverQualification = InferSelectModel<typeof driverQualifications>;
export type NewDriverQualification = InferInsertModel<typeof driverQualifications>;

export type DriverCertification = InferSelectModel<typeof driverCertifications>;
export type NewDriverCertification = InferInsertModel<typeof driverCertifications>;

export type Tractor = InferSelectModel<typeof tractors>;
export type NewTractor = InferInsertModel<typeof tractors>;

export type Trailer = InferSelectModel<typeof trailers>;
export type NewTrailer = InferInsertModel<typeof trailers>;

export type ChargeCode = InferSelectModel<typeof chargeCodes>;
export type NewChargeCode = InferInsertModel<typeof chargeCodes>;

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

export type Stop = InferSelectModel<typeof stops>;
export type NewStop = InferInsertModel<typeof stops>;

export type Assignment = InferSelectModel<typeof assignments>;
export type NewAssignment = InferInsertModel<typeof assignments>;

export type TrackingEvent = InferSelectModel<typeof trackingEvents>;
export type NewTrackingEvent = InferInsertModel<typeof trackingEvents>;

export type Charge = InferSelectModel<typeof charges>;
export type NewCharge = InferInsertModel<typeof charges>;

export type Invoice = InferSelectModel<typeof invoices>;
export type NewInvoice = InferInsertModel<typeof invoices>;

export type InvoiceLineItem = InferSelectModel<typeof invoiceLineItems>;
export type NewInvoiceLineItem = InferInsertModel<typeof invoiceLineItems>;

export type Settlement = InferSelectModel<typeof settlements>;
export type NewSettlement = InferInsertModel<typeof settlements>;

export type SettlementItem = InferSelectModel<typeof settlementItems>;
export type NewSettlementItem = InferInsertModel<typeof settlementItems>;

export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;

export type Integration = InferSelectModel<typeof integrations>;
export type NewIntegration = InferInsertModel<typeof integrations>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

export type AuditLogEntry = InferSelectModel<typeof auditLog>;
export type NewAuditLogEntry = InferInsertModel<typeof auditLog>;

// Enum Types (matching database enums)
export type UserRole =
  | "admin"
  | "dispatcher"
  | "driver_manager"
  | "safety"
  | "accounting"
  | "driver";

export type LoadStatus =
  | "available"
  | "assigned"
  | "dispatched"
  | "in_transit"
  | "at_pickup"
  | "at_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "problem";

export type EquipmentType =
  | "dry_van"
  | "reefer"
  | "flatbed"
  | "tanker"
  | "step_deck"
  | "double_drop"
  | "conestoga";

export type DriverStatus =
  | "available"
  | "on_load"
  | "off_duty"
  | "sleeper"
  | "driving"
  | "on_break";

export type EquipmentStatus =
  | "available"
  | "assigned"
  | "in_use"
  | "maintenance"
  | "out_of_service";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export type SettlementStatus =
  | "draft"
  | "pending"
  | "paid"
  | "cancelled";

export type DocumentType =
  | "bol"
  | "pod"
  | "rate_confirmation"
  | "invoice"
  | "driver_license"
  | "medical_cert"
  | "insurance"
  | "other";

// Extended Types for UI Components
export interface OrderWithDetails extends Order {
  customer?: Customer;
  stops?: Stop[];
  assignments?: Assignment[];
  charges?: Charge[];
  trackingEvents?: TrackingEvent[];
  documents?: Document[];
}

export interface DriverWithDetails extends Driver {
  qualifications?: DriverQualification[];
  certifications?: DriverCertification[];
  currentAssignment?: Assignment & {
    order?: Order;
    tractor?: Tractor;
    trailer?: Trailer;
  };
  settlements?: Settlement[];
  documents?: Document[];
}

export interface TractorWithDetails extends Tractor {
  currentAssignment?: Assignment & {
    order?: Order;
    driver?: Driver;
  };
}

export interface TrailerWithDetails extends Trailer {
  currentAssignment?: Assignment & {
    order?: Order;
    driver?: Driver;
  };
}

export interface CustomerWithDetails extends Customer {
  contacts?: Contact[];
  locations?: Location[];
  orders?: Order[];
  invoices?: Invoice[];
}

export interface InvoiceWithDetails extends Invoice {
  customer?: Customer;
  lineItems?: InvoiceLineItem[];
}

export interface SettlementWithDetails extends Settlement {
  driver?: Driver;
  items?: SettlementItem[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message?: string;
}

// Filter and Query Types
export interface OrderFilters {
  status?: LoadStatus[];
  customerId?: number;
  driverId?: number;
  equipmentType?: EquipmentType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface DriverFilters {
  status?: DriverStatus[];
  available?: boolean;
  search?: string;
  qualifications?: string[];
  certifications?: string[];
}

export interface EquipmentFilters {
  status?: EquipmentStatus[];
  equipmentType?: EquipmentType[];
  available?: boolean;
  search?: string;
}

export interface CustomerFilters {
  isActive?: boolean;
  search?: string;
  state?: string[];
}

// Form Types
export interface OrderFormData {
  customerId: number;
  commodity: string;
  weight: number;
  pieces: number;
  equipmentType: EquipmentType;
  specialRequirements?: string;
  customerReferenceNumber?: string;
  priorityLevel: "normal" | "high" | "urgent";
  stops: {
    type: "pickup" | "delivery";
    locationId?: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    scheduledDate: Date;
    scheduledTimeStart: string;
    scheduledTimeEnd: string;
    contactName?: string;
    contactPhone?: string;
    specialInstructions?: string;
  }[];
  charges: {
    chargeCodeId?: number;
    description: string;
    quantity: number;
    rate: number;
    billToCustomer: boolean;
    payToDriver: boolean;
  }[];
}

// Dashboard Types
export interface DashboardMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    ytd: number;
  };
  orders: {
    available: number;
    assigned: number;
    inTransit: number;
    delivered: number;
    total: number;
  };
  equipment: {
    available: number;
    assigned: number;
    maintenance: number;
    total: number;
  };
  drivers: {
    available: number;
    onLoad: number;
    offDuty: number;
    total: number;
  };
  onTimePerformance: number;
  averageMargin: number;
}
