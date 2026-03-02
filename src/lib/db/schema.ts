import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  jsonb,
  date,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "dispatcher",
  "driver_manager",
  "safety",
  "accounting",
  "driver",
]);

export const loadStatusEnum = pgEnum("load_status", [
  "available",
  "assigned",
  "dispatched",
  "in_transit",
  "at_pickup",
  "at_delivery",
  "delivered",
  "completed",
  "cancelled",
  "problem",
]);

export const equipmentTypeEnum = pgEnum("equipment_type", [
  "dry_van",
  "reefer",
  "flatbed",
  "tanker",
  "step_deck",
  "double_drop",
  "conestoga",
]);

export const driverStatusEnum = pgEnum("driver_status", [
  "available",
  "on_load",
  "off_duty",
  "sleeper",
  "driving",
  "on_break",
]);

export const equipmentStatusEnum = pgEnum("equipment_status", [
  "available",
  "assigned",
  "in_use",
  "maintenance",
  "out_of_service",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

export const settlementStatusEnum = pgEnum("settlement_status", [
  "draft",
  "pending",
  "paid",
  "cancelled",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "bol",
  "pod",
  "rate_confirmation",
  "invoice",
  "driver_license",
  "medical_cert",
  "insurance",
  "other",
]);

// Organizations (multi-tenant)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  dotNumber: varchar("dot_number", { length: 20 }),
  mcNumber: varchar("mc_number", { length: 20 }),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Users
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    role: userRoleEnum("role").notNull(),
    phone: varchar("phone", { length: 20 }),
    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at"),
    emailVerifiedAt: timestamp("email_verified_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    orgIdx: index("users_org_idx").on(table.organizationId),
  })
);

// Customers
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    zipCode: varchar("zip_code", { length: 10 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 255 }),
    creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
    paymentTerms: varchar("payment_terms", { length: 50 }),
    taxId: varchar("tax_id", { length: 20 }),
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("customers_org_idx").on(table.organizationId),
    nameIdx: index("customers_name_idx").on(table.name),
  })
);

// Customer Contacts
export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .references(() => customers.id)
      .notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    title: varchar("title", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    isPrimary: boolean("is_primary").default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    customerIdx: index("contacts_customer_idx").on(table.customerId),
  })
);

// Locations/Facilities
export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    zipCode: varchar("zip_code", { length: 10 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    phone: varchar("phone", { length: 20 }),
    operatingHours: jsonb("operating_hours").$type<Record<string, unknown>>(),
    dockCount: integer("dock_count"),
    notes: text("notes"),
    averageWaitTime: integer("average_wait_time"), // minutes
    rating: decimal("rating", { precision: 2, scale: 1 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    customerIdx: index("locations_customer_idx").on(table.customerId),
    coordsIdx: index("locations_coords_idx").on(table.latitude, table.longitude),
  })
);

// Drivers
export const drivers = pgTable(
  "drivers",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    userId: integer("user_id").references(() => users.id),
    employeeId: varchar("employee_id", { length: 50 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    zipCode: varchar("zip_code", { length: 10 }),
    dateOfBirth: date("date_of_birth"),
    hireDate: date("hire_date"),
    terminationDate: date("termination_date"),
    cdlNumber: varchar("cdl_number", { length: 50 }),
    cdlState: varchar("cdl_state", { length: 2 }),
    cdlExpiration: date("cdl_expiration"),
    medicalCertExpiration: date("medical_cert_expiration"),
    status: driverStatusEnum("status").default("available"),
    currentLocation: jsonb("current_location").$type<{
      latitude: number;
      longitude: number;
    }>(),
    homeTimePreference: integer("home_time_preference"), // days
    payStructure: jsonb("pay_structure").$type<Record<string, unknown>>(),
    preferences: jsonb("preferences").$type<Record<string, unknown>>(),
    safetyScore: decimal("safety_score", { precision: 5, scale: 2 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("drivers_org_idx").on(table.organizationId),
    statusIdx: index("drivers_status_idx").on(table.status),
    cdlIdx: index("drivers_cdl_idx").on(table.cdlNumber),
  })
);

// Driver Qualifications
export const driverQualifications = pgTable(
  "driver_qualifications",
  {
    id: serial("id").primaryKey(),
    driverId: integer("driver_id")
      .references(() => drivers.id)
      .notNull(),
    qualificationType: varchar("qualification_type", { length: 100 }).notNull(),
    issuedBy: varchar("issued_by", { length: 255 }),
    issueDate: date("issue_date"),
    expirationDate: date("expiration_date"),
    certificateNumber: varchar("certificate_number", { length: 100 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    driverIdx: index("driver_qualifications_driver_idx").on(table.driverId),
    expirationIdx: index("driver_qualifications_expiration_idx").on(
      table.expirationDate
    ),
  })
);

// Driver Certifications
export const driverCertifications = pgTable(
  "driver_certifications",
  {
    id: serial("id").primaryKey(),
    driverId: integer("driver_id")
      .references(() => drivers.id)
      .notNull(),
    certificationType: varchar("certification_type", { length: 100 }).notNull(),
    certificationNumber: varchar("certification_number", { length: 100 }),
    issueDate: date("issue_date"),
    expirationDate: date("expiration_date"),
    issuingAgency: varchar("issuing_agency", { length: 255 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    driverIdx: index("driver_certifications_driver_idx").on(table.driverId),
    expirationIdx: index("driver_certifications_expiration_idx").on(
      table.expirationDate
    ),
  })
);

// Tractors
export const tractors = pgTable(
  "tractors",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    unitNumber: varchar("unit_number", { length: 50 }).notNull(),
    vin: varchar("vin", { length: 17 }),
    make: varchar("make", { length: 50 }),
    model: varchar("model", { length: 50 }),
    year: integer("year"),
    engineMake: varchar("engine_make", { length: 50 }),
    engineModel: varchar("engine_model", { length: 50 }),
    fuelType: varchar("fuel_type", { length: 20 }),
    licensePlate: varchar("license_plate", { length: 20 }),
    plateState: varchar("plate_state", { length: 2 }),
    registrationExpiration: date("registration_expiration"),
    inspectionExpiration: date("inspection_expiration"),
    currentOdometer: integer("current_odometer"),
    status: equipmentStatusEnum("status").default("available"),
    currentLocation: jsonb("current_location").$type<{
      latitude: number;
      longitude: number;
    }>(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("tractors_org_idx").on(table.organizationId),
    unitIdx: index("tractors_unit_idx").on(table.unitNumber),
    statusIdx: index("tractors_status_idx").on(table.status),
    vinIdx: index("tractors_vin_idx").on(table.vin),
  })
);

// Trailers
export const trailers = pgTable(
  "trailers",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    unitNumber: varchar("unit_number", { length: 50 }).notNull(),
    trailerType: equipmentTypeEnum("trailer_type").notNull(),
    make: varchar("make", { length: 50 }),
    model: varchar("model", { length: 50 }),
    year: integer("year"),
    length: decimal("length", { precision: 5, scale: 2 }),
    width: decimal("width", { precision: 5, scale: 2 }),
    height: decimal("height", { precision: 5, scale: 2 }),
    capacity: decimal("capacity", { precision: 10, scale: 2 }),
    tareWeight: decimal("tare_weight", { precision: 10, scale: 2 }),
    licensePlate: varchar("license_plate", { length: 20 }),
    plateState: varchar("plate_state", { length: 2 }),
    registrationExpiration: date("registration_expiration"),
    inspectionExpiration: date("inspection_expiration"),
    status: equipmentStatusEnum("status").default("available"),
    currentLocation: jsonb("current_location").$type<{
      latitude: number;
      longitude: number;
    }>(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("trailers_org_idx").on(table.organizationId),
    unitIdx: index("trailers_unit_idx").on(table.unitNumber),
    statusIdx: index("trailers_status_idx").on(table.status),
    typeIdx: index("trailers_type_idx").on(table.trailerType),
  })
);

// Charge Codes
export const chargeCodes = pgTable(
  "charge_codes",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }),
    defaultRate: decimal("default_rate", { precision: 10, scale: 2 }),
    rateType: varchar("rate_type", { length: 20 }), // flat, per_mile, per_cwt, percentage
    glAccount: varchar("gl_account", { length: 20 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("charge_codes_org_idx").on(table.organizationId),
    codeIdx: index("charge_codes_code_idx").on(table.code),
  })
);

// Orders/Loads
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    customerId: integer("customer_id")
      .references(() => customers.id)
      .notNull(),
    status: loadStatusEnum("status").default("available"),
    revenueCode: varchar("revenue_code", { length: 20 }),
    commodity: varchar("commodity", { length: 255 }),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    pieces: integer("pieces"),
    dimensions: jsonb("dimensions").$type<{
      length: number;
      width: number;
      height: number;
    }>(),
    equipmentType: equipmentTypeEnum("equipment_type").notNull(),
    specialRequirements: text("special_requirements"),
    customerReferenceNumber: varchar("customer_reference_number", { length: 100 }),
    priorityLevel: varchar("priority_level", { length: 20 }).default("normal"),
    notes: text("notes"),
    totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }),
    totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
    margin: decimal("margin", { precision: 10, scale: 2 }),
    miles: decimal("miles", { precision: 8, scale: 2 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("orders_org_idx").on(table.organizationId),
    orderNumberIdx: index("orders_number_idx").on(table.orderNumber),
    statusIdx: index("orders_status_idx").on(table.status),
    customerIdx: index("orders_customer_idx").on(table.customerId),
    createdAtIdx: index("orders_created_idx").on(table.createdAt),
  })
);

// Stops
export const stops = pgTable(
  "stops",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id)
      .notNull(),
    locationId: integer("location_id").references(() => locations.id),
    sequence: integer("sequence").notNull(),
    type: varchar("type", { length: 20 }).notNull(), // pickup, delivery
    scheduledDate: timestamp("scheduled_date"),
    scheduledTimeStart: varchar("scheduled_time_start", { length: 8 }),
    scheduledTimeEnd: varchar("scheduled_time_end", { length: 8 }),
    actualArrival: timestamp("actual_arrival"),
    actualDeparture: timestamp("actual_departure"),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    zipCode: varchar("zip_code", { length: 10 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    contactName: varchar("contact_name", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 20 }),
    referenceNumbers: jsonb("reference_numbers").$type<Record<string, string>>(),
    specialInstructions: text("special_instructions"),
    appointmentNumber: varchar("appointment_number", { length: 100 }),
    isCompleted: boolean("is_completed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orderIdx: index("stops_order_idx").on(table.orderId),
    sequenceIdx: index("stops_sequence_idx").on(table.orderId, table.sequence),
    scheduledIdx: index("stops_scheduled_idx").on(table.scheduledDate),
  })
);

// Assignments (Driver + Equipment to Orders)
export const assignments = pgTable(
  "assignments",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id)
      .notNull(),
    driverId: integer("driver_id").references(() => drivers.id),
    tractorId: integer("tractor_id").references(() => tractors.id),
    trailerId: integer("trailer_id").references(() => trailers.id),
    assignedAt: timestamp("assigned_at").defaultNow(),
    assignedBy: integer("assigned_by").references(() => users.id),
    dispatchedAt: timestamp("dispatched_at"),
    dispatchedBy: integer("dispatched_by").references(() => users.id),
    unassignedAt: timestamp("unassigned_at"),
    unassignedBy: integer("unassigned_by").references(() => users.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orderIdx: index("assignments_order_idx").on(table.orderId),
    driverIdx: index("assignments_driver_idx").on(table.driverId),
    tractorIdx: index("assignments_tractor_idx").on(table.tractorId),
    trailerIdx: index("assignments_trailer_idx").on(table.trailerId),
  })
);

// Tracking Events
export const trackingEvents = pgTable(
  "tracking_events",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id)
      .notNull(),
    stopId: integer("stop_id").references(() => stops.id),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    eventTime: timestamp("event_time").defaultNow(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    address: text("address"),
    notes: text("notes"),
    source: varchar("source", { length: 50 }), // gps, eld, manual, driver_app
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orderIdx: index("tracking_events_order_idx").on(table.orderId),
    timeIdx: index("tracking_events_time_idx").on(table.eventTime),
    typeIdx: index("tracking_events_type_idx").on(table.eventType),
  })
);

// Charges (Line items for billing)
export const charges = pgTable(
  "charges",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id)
      .notNull(),
    chargeCodeId: integer("charge_code_id").references(() => chargeCodes.id),
    description: varchar("description", { length: 255 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
    rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    billToCustomer: boolean("bill_to_customer").default(true),
    payToDriver: boolean("pay_to_driver").default(false),
    glAccount: varchar("gl_account", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orderIdx: index("charges_order_idx").on(table.orderId),
    chargeCodeIdx: index("charges_code_idx").on(table.chargeCodeId),
  })
);

// Invoices
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    customerId: integer("customer_id")
      .references(() => customers.id)
      .notNull(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    status: invoiceStatusEnum("status").default("draft"),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
    balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    terms: text("terms"),
    sentAt: timestamp("sent_at"),
    paidAt: timestamp("paid_at"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("invoices_org_idx").on(table.organizationId),
    invoiceNumberIdx: index("invoices_number_idx").on(table.invoiceNumber),
    statusIdx: index("invoices_status_idx").on(table.status),
    customerIdx: index("invoices_customer_idx").on(table.customerId),
    dueDateIdx: index("invoices_due_date_idx").on(table.dueDate),
  })
);

// Invoice Line Items
export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .references(() => invoices.id)
      .notNull(),
    orderId: integer("order_id").references(() => orders.id),
    chargeId: integer("charge_id").references(() => charges.id),
    description: varchar("description", { length: 255 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
    rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    invoiceIdx: index("invoice_line_items_invoice_idx").on(table.invoiceId),
    orderIdx: index("invoice_line_items_order_idx").on(table.orderId),
  })
);

// Settlements (Driver pay)
export const settlements = pgTable(
  "settlements",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    driverId: integer("driver_id")
      .references(() => drivers.id)
      .notNull(),
    settlementNumber: varchar("settlement_number", { length: 50 }).notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    status: settlementStatusEnum("status").default("draft"),
    grossPay: decimal("gross_pay", { precision: 10, scale: 2 }).notNull(),
    deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
    netPay: decimal("net_pay", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    approvedAt: timestamp("approved_at"),
    approvedBy: integer("approved_by").references(() => users.id),
    paidAt: timestamp("paid_at"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("settlements_org_idx").on(table.organizationId),
    settlementNumberIdx: index("settlements_number_idx").on(table.settlementNumber),
    statusIdx: index("settlements_status_idx").on(table.status),
    driverIdx: index("settlements_driver_idx").on(table.driverId),
    periodIdx: index("settlements_period_idx").on(table.periodStart, table.periodEnd),
  })
);

// Settlement Items
export const settlementItems = pgTable(
  "settlement_items",
  {
    id: serial("id").primaryKey(),
    settlementId: integer("settlement_id")
      .references(() => settlements.id)
      .notNull(),
    orderId: integer("order_id").references(() => orders.id),
    chargeId: integer("charge_id").references(() => charges.id),
    description: varchar("description", { length: 255 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // pay, deduction
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
    rate: decimal("rate", { precision: 10, scale: 2 }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    settlementIdx: index("settlement_items_settlement_idx").on(table.settlementId),
    orderIdx: index("settlement_items_order_idx").on(table.orderId),
  })
);

// Documents
export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    orderId: integer("order_id").references(() => orders.id),
    driverId: integer("driver_id").references(() => drivers.id),
    customerId: integer("customer_id").references(() => customers.id),
    invoiceId: integer("invoice_id").references(() => invoices.id),
    documentType: documentTypeEnum("document_type").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 500 }).notNull(),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    description: varchar("description", { length: 255 }),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    isPublic: boolean("is_public").default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("documents_org_idx").on(table.organizationId),
    orderIdx: index("documents_order_idx").on(table.orderId),
    driverIdx: index("documents_driver_idx").on(table.driverId),
    customerIdx: index("documents_customer_idx").on(table.customerId),
    typeIdx: index("documents_type_idx").on(table.documentType),
  })
);

// Integrations
export const integrations = pgTable(
  "integrations",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    provider: varchar("provider", { length: 100 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // eld, fuel_card, accounting, etc.
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    credentials: jsonb("credentials").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").default(true),
    lastSyncAt: timestamp("last_sync_at"),
    syncStatus: varchar("sync_status", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("integrations_org_idx").on(table.organizationId),
    typeIdx: index("integrations_type_idx").on(table.type),
  })
);

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    userId: integer("user_id").references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>(),
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at"),
    channels: jsonb("channels").$type<string[]>().default([]), // email, sms, push, in_app
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orgIdx: index("notifications_org_idx").on(table.organizationId),
    userIdx: index("notifications_user_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    typeIdx: index("notifications_type_idx").on(table.type),
  })
);

// Audit Log
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .references(() => organizations.id)
      .notNull(),
    userId: integer("user_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: integer("resource_id"),
    oldValues: jsonb("old_values").$type<Record<string, unknown>>(),
    newValues: jsonb("new_values").$type<Record<string, unknown>>(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orgIdx: index("audit_log_org_idx").on(table.organizationId),
    userIdx: index("audit_log_user_idx").on(table.userId),
    actionIdx: index("audit_log_action_idx").on(table.action),
    resourceIdx: index("audit_log_resource_idx").on(table.resourceType, table.resourceId),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  })
);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  drivers: many(drivers),
  tractors: many(tractors),
  trailers: many(trailers),
  orders: many(orders),
  chargeCodes: many(chargeCodes),
  invoices: many(invoices),
  settlements: many(settlements),
  documents: many(documents),
  integrations: many(integrations),
  notifications: many(notifications),
  auditLog: many(auditLog),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  driver: one(drivers, {
    fields: [users.id],
    references: [drivers.userId],
  }),
  notifications: many(notifications),
  auditLog: many(auditLog),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  contacts: many(contacts),
  locations: many(locations),
  orders: many(orders),
  invoices: many(invoices),
  documents: many(documents),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [locations.customerId],
    references: [customers.id],
  }),
  stops: many(stops),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [drivers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  qualifications: many(driverQualifications),
  certifications: many(driverCertifications),
  assignments: many(assignments),
  settlements: many(settlements),
  documents: many(documents),
}));

export const driverQualificationsRelations = relations(driverQualifications, ({ one }) => ({
  driver: one(drivers, {
    fields: [driverQualifications.driverId],
    references: [drivers.id],
  }),
}));

export const driverCertificationsRelations = relations(driverCertifications, ({ one }) => ({
  driver: one(drivers, {
    fields: [driverCertifications.driverId],
    references: [drivers.id],
  }),
}));

export const tractorsRelations = relations(tractors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tractors.organizationId],
    references: [organizations.id],
  }),
  assignments: many(assignments),
}));

export const trailersRelations = relations(trailers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [trailers.organizationId],
    references: [organizations.id],
  }),
  assignments: many(assignments),
}));

export const chargeCodesRelations = relations(chargeCodes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [chargeCodes.organizationId],
    references: [organizations.id],
  }),
  charges: many(charges),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  stops: many(stops),
  assignments: many(assignments),
  trackingEvents: many(trackingEvents),
  charges: many(charges),
  invoiceLineItems: many(invoiceLineItems),
  settlementItems: many(settlementItems),
  documents: many(documents),
}));

export const stopsRelations = relations(stops, ({ one, many }) => ({
  order: one(orders, {
    fields: [stops.orderId],
    references: [orders.id],
  }),
  location: one(locations, {
    fields: [stops.locationId],
    references: [locations.id],
  }),
  trackingEvents: many(trackingEvents),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  order: one(orders, {
    fields: [assignments.orderId],
    references: [orders.id],
  }),
  driver: one(drivers, {
    fields: [assignments.driverId],
    references: [drivers.id],
  }),
  tractor: one(tractors, {
    fields: [assignments.tractorId],
    references: [tractors.id],
  }),
  trailer: one(trailers, {
    fields: [assignments.trailerId],
    references: [trailers.id],
  }),
  assignedByUser: one(users, {
    fields: [assignments.assignedBy],
    references: [users.id],
  }),
  dispatchedByUser: one(users, {
    fields: [assignments.dispatchedBy],
    references: [users.id],
  }),
  unassignedByUser: one(users, {
    fields: [assignments.unassignedBy],
    references: [users.id],
  }),
}));

export const trackingEventsRelations = relations(trackingEvents, ({ one }) => ({
  order: one(orders, {
    fields: [trackingEvents.orderId],
    references: [orders.id],
  }),
  stop: one(stops, {
    fields: [trackingEvents.stopId],
    references: [stops.id],
  }),
}));

export const chargesRelations = relations(charges, ({ one }) => ({
  order: one(orders, {
    fields: [charges.orderId],
    references: [orders.id],
  }),
  chargeCode: one(chargeCodes, {
    fields: [charges.chargeCodeId],
    references: [chargeCodes.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  lineItems: many(invoiceLineItems),
  documents: many(documents),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  order: one(orders, {
    fields: [invoiceLineItems.orderId],
    references: [orders.id],
  }),
  charge: one(charges, {
    fields: [invoiceLineItems.chargeId],
    references: [charges.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [settlements.organizationId],
    references: [organizations.id],
  }),
  driver: one(drivers, {
    fields: [settlements.driverId],
    references: [drivers.id],
  }),
  approvedByUser: one(users, {
    fields: [settlements.approvedBy],
    references: [users.id],
  }),
  items: many(settlementItems),
}));

export const settlementItemsRelations = relations(settlementItems, ({ one }) => ({
  settlement: one(settlements, {
    fields: [settlementItems.settlementId],
    references: [settlements.id],
  }),
  order: one(orders, {
    fields: [settlementItems.orderId],
    references: [orders.id],
  }),
  charge: one(charges, {
    fields: [settlementItems.chargeId],
    references: [charges.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  order: one(orders, {
    fields: [documents.orderId],
    references: [orders.id],
  }),
  driver: one(drivers, {
    fields: [documents.driverId],
    references: [drivers.id],
  }),
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [documents.invoiceId],
    references: [invoices.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLog.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));