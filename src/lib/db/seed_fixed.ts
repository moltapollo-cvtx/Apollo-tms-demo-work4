import { db } from './index';
import bcrypt from 'bcryptjs';

// Helper to convert Date to ISO string for postgres driver compatibility
const d = (date: Date): string => date.toISOString();
const _dn = (date: Date | null): string | null => date ? date.toISOString() : null;
import {
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
  charges,
} from './schema';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create organization
  console.log('Creating organization...');
  const [org] = await db.insert(organizations).values({
    name: "Atlas Freight Solutions",
    slug: "atlas-freight",
    address: "2847 Industrial Boulevard",
    city: "Dallas",
    state: "TX",
    zipCode: "75207",
    phone: "(214) 555-0100",
    email: "dispatch@atlasfreight.com",
    website: "https://atlasfreight.com",
    dotNumber: "3847291",
    mcNumber: "MC-847291",
  }).returning();

  // Create admin user
  console.log('Creating admin user...');
  const passwordHash = await bcrypt.hash('password123', 12);
  const [_adminUser] = await db.insert(users).values({
    organizationId: org.id,
    email: "elena.martinez@atlasfreight.com",
    passwordHash,
    firstName: "Elena",
    lastName: "Martinez",
    role: "admin",
    phone: "(214) 555-0101",
    isActive: true,
  }).returning();

  // Create dispatcher users
  console.log('Creating dispatcher users...');
  const dispatchers = await db.insert(users).values([
    {
      organizationId: org.id,
      email: "marcus.rivera@atlasfreight.com",
      passwordHash,
      firstName: "Marcus",
      lastName: "Rivera",
      role: "dispatcher",
      phone: "(214) 555-0102",
      isActive: true,
    },
    {
      organizationId: org.id,
      email: "sarah.chen@atlasfreight.com",
      passwordHash,
      firstName: "Sarah",
      lastName: "Chen",
      role: "dispatcher",
      phone: "(214) 555-0103",
      isActive: true,
    }
  ]).returning();

  // Create safety manager
  const [_safetyManager] = await db.insert(users).values({
    organizationId: org.id,
    email: "james.thompson@atlasfreight.com",
    passwordHash,
    firstName: "James",
    lastName: "Thompson",
    role: "safety",
    phone: "(214) 555-0104",
    isActive: true,
  }).returning();

  // Create accounting user
  const [_accountingUser] = await db.insert(users).values({
    organizationId: org.id,
    email: "patricia.wong@atlasfreight.com",
    passwordHash,
    firstName: "Patricia",
    lastName: "Wong",
    role: "accounting",
    phone: "(214) 555-0105",
    isActive: true,
  }).returning();

  // Create charge codes
  console.log('Creating charge codes...');
  const chargeCodesData = [
    // Basic Transportation & Fuel
    { code: "LINEHAUL", description: "Linehaul Transportation", category: "freight", defaultRate: "2.50", rateType: "per_mile" },
    { code: "FSC", description: "Fuel Surcharge", category: "fuel", defaultRate: "15.00", rateType: "percentage" },
    { code: "EMPTY", description: "Empty Miles", category: "freight", defaultRate: "1.25", rateType: "per_mile" },

    // Detention & Waiting Charges
    { code: "DETENTION", description: "Detention Charge", category: "detention", defaultRate: "50.00", rateType: "per_hour" },
    { code: "DET_PU", description: "Detention at Pickup", category: "detention", defaultRate: "50.00", rateType: "per_hour" },
    { code: "DET_DEL", description: "Detention at Delivery", category: "detention", defaultRate: "50.00", rateType: "per_hour" },
    { code: "LAYOVER", description: "Layover Pay", category: "detention", defaultRate: "100.00", rateType: "flat" },
    { code: "BREAKDOWN", description: "Breakdown Pay", category: "detention", defaultRate: "125.00", rateType: "flat" },

    // Loading & Unloading Services
    { code: "LUMPER", description: "Lumper Fee", category: "lumper", defaultRate: "125.00", rateType: "flat" },
    { code: "DRIVER_ASSIST", description: "Driver Assist Loading/Unloading", category: "lumper", defaultRate: "75.00", rateType: "per_hour" },
    { code: "INSIDE_DEL", description: "Inside Delivery", category: "accessorial", defaultRate: "150.00", rateType: "flat" },
    { code: "LIFTGATE", description: "Liftgate Service", category: "accessorial", defaultRate: "85.00", rateType: "flat" },
    { code: "SORT_SEG", description: "Sort and Segregate", category: "accessorial", defaultRate: "95.00", rateType: "flat" },

    // Additional Stops & Routing
    { code: "STOPOFF", description: "Stop Off Charge", category: "accessorial", defaultRate: "75.00", rateType: "flat" },
    { code: "REDELIVERY", description: "Redelivery Charge", category: "accessorial", defaultRate: "125.00", rateType: "flat" },
    { code: "RECONSIGN", description: "Reconsignment Fee", category: "accessorial", defaultRate: "100.00", rateType: "flat" },
    { code: "DIVERSION", description: "Diversion in Transit", category: "accessorial", defaultRate: "150.00", rateType: "flat" },

    // Specialized Equipment & Handling
    { code: "TARP", description: "Tarping Fee", category: "accessorial", defaultRate: "85.00", rateType: "flat" },
    { code: "CHAINS", description: "Chain Installation", category: "accessorial", defaultRate: "50.00", rateType: "flat" },
    { code: "STRAPS", description: "Load Securement Straps", category: "accessorial", defaultRate: "35.00", rateType: "flat" },
    { code: "BLANKETS", description: "Furniture Blankets", category: "accessorial", defaultRate: "45.00", rateType: "flat" },
    { code: "PADS", description: "Moving Pads", category: "accessorial", defaultRate: "40.00", rateType: "flat" },

    // Hazmat & Special Requirements
    { code: "HAZMAT", description: "Hazmat Surcharge", category: "accessorial", defaultRate: "100.00", rateType: "flat" },
    { code: "PLACARDS", description: "Hazmat Placarding", category: "accessorial", defaultRate: "25.00", rateType: "flat" },
    { code: "HAZMAT_DOC", description: "Hazmat Documentation", category: "accessorial", defaultRate: "50.00", rateType: "flat" },
    { code: "TEMP_CTRL", description: "Temperature Controlled", category: "accessorial", defaultRate: "125.00", rateType: "flat" },
    { code: "REEFER_FUEL", description: "Reefer Fuel Charge", category: "fuel", defaultRate: "150.00", rateType: "flat" },

    // Weight & Size Charges
    { code: "OVERWEIGHT", description: "Overweight Charge", category: "accessorial", defaultRate: "2.50", rateType: "per_cwt" },
    { code: "OVERSIZE", description: "Oversize Load", category: "accessorial", defaultRate: "200.00", rateType: "flat" },
    { code: "PERMITS", description: "Permit Fees", category: "accessorial", defaultRate: "175.00", rateType: "flat" },
    { code: "ESCORTS", description: "Escort Vehicle", category: "accessorial", defaultRate: "300.00", rateType: "flat" },

    // Special Delivery Types
    { code: "RESIDENTIAL", description: "Residential Delivery", category: "accessorial", defaultRate: "75.00", rateType: "flat" },
    { code: "APPOINTMENT", description: "Appointment Delivery", category: "accessorial", defaultRate: "50.00", rateType: "flat" },
    { code: "WHITE_GLOVE", description: "White Glove Service", category: "accessorial", defaultRate: "250.00", rateType: "flat" },
    { code: "THRESHOLD", description: "Threshold Delivery", category: "accessorial", defaultRate: "100.00", rateType: "flat" },

    // Premium Services & Time
    { code: "TEAM_DRIVER", description: "Team Driver Premium", category: "accessorial", defaultRate: "0.35", rateType: "per_mile" },
    { code: "WEEKEND", description: "Weekend Premium", category: "accessorial", defaultRate: "150.00", rateType: "flat" },
    { code: "HOLIDAY", description: "Holiday Premium", category: "accessorial", defaultRate: "200.00", rateType: "flat" },
    { code: "EXPEDITE", description: "Expedited Service", category: "accessorial", defaultRate: "300.00", rateType: "flat" },
    { code: "HOTSHOT", description: "Hot Shot Premium", category: "accessorial", defaultRate: "500.00", rateType: "flat" },

    // Failed Operations
    { code: "TONU", description: "Truck Ordered Not Used", category: "accessorial", defaultRate: "200.00", rateType: "flat" },
    { code: "DRY_RUN", description: "Dry Run Charge", category: "accessorial", defaultRate: "175.00", rateType: "flat" },
    { code: "MISSED_PICKUP", description: "Missed Pickup Fee", category: "accessorial", defaultRate: "150.00", rateType: "flat" },
    { code: "CANCELLED", description: "Cancellation Fee", category: "accessorial", defaultRate: "100.00", rateType: "flat" },

    // Additional Services
    { code: "WASH_OUT", description: "Trailer Washout", category: "accessorial", defaultRate: "85.00", rateType: "flat" },
    { code: "SCALE_TICKET", description: "Scale Ticket Fee", category: "accessorial", defaultRate: "25.00", rateType: "flat" },
    { code: "PHOTOS", description: "Photo Documentation", category: "accessorial", defaultRate: "35.00", rateType: "flat" },
    { code: "INSPECTION", description: "Load Inspection", category: "accessorial", defaultRate: "75.00", rateType: "flat" },
    { code: "CUSTOMS", description: "Customs Clearance", category: "accessorial", defaultRate: "125.00", rateType: "flat" },
    { code: "BORDER_FEE", description: "Border Crossing Fee", category: "accessorial", defaultRate: "100.00", rateType: "flat" },

    // Regional & Lane Adjustments
    { code: "NYC_DEL", description: "NYC Delivery Surcharge", category: "accessorial", defaultRate: "125.00", rateType: "flat" },
    { code: "CANADA", description: "Canada Delivery", category: "accessorial", defaultRate: "200.00", rateType: "flat" },
    { code: "MEXICO", description: "Mexico Delivery", category: "accessorial", defaultRate: "300.00", rateType: "flat" },
    { code: "ISLAND_DEL", description: "Island Delivery", category: "accessorial", defaultRate: "250.00", rateType: "flat" },
  ];

  const createdChargeCodes = await db.insert(chargeCodes).values(
    chargeCodesData.map(code => ({
      ...code,
      organizationId: org.id,
      defaultRate: code.defaultRate,
    }))
  ).returning();

  // Create customers
  console.log('Creating customers...');
  const customersData = [
    { name: "Pinnacle Manufacturing", code: "PIN001", city: "Houston", state: "TX", creditLimit: "50000.00", paymentTerms: "Net 30" },
    { name: "CrossBridge Logistics", code: "CBL002", city: "Atlanta", state: "GA", creditLimit: "75000.00", paymentTerms: "Net 15" },
    { name: "Meridian Foods", code: "MER003", city: "Phoenix", state: "AZ", creditLimit: "40000.00", paymentTerms: "Net 30" },
    { name: "Titan Industrial Supply", code: "TIT004", city: "Denver", state: "CO", creditLimit: "60000.00", paymentTerms: "Net 30" },
    { name: "Cascade Distribution", code: "CAS005", city: "Portland", state: "OR", creditLimit: "35000.00", paymentTerms: "Net 45" },
    { name: "Summit Automotive Parts", code: "SUM006", city: "Detroit", state: "MI", creditLimit: "45000.00", paymentTerms: "Net 30" },
    { name: "Valley Fresh Produce", code: "VAL007", city: "Fresno", state: "CA", creditLimit: "25000.00", paymentTerms: "Net 15" },
    { name: "Riverside Chemical", code: "RIV008", city: "Tampa", state: "FL", creditLimit: "80000.00", paymentTerms: "Net 30" },
    { name: "Mountain View Textiles", code: "MTV009", city: "Charlotte", state: "NC", creditLimit: "30000.00", paymentTerms: "Net 30" },
    { name: "Gateway Steel", code: "GAT010", city: "St. Louis", state: "MO", creditLimit: "90000.00", paymentTerms: "Net 30" },
  ];

  const createdCustomers = await db.insert(customers).values(
    customersData.map(customer => ({
      ...customer,
      organizationId: org.id,
      address: `${Math.floor(Math.random() * 9000) + 1000} Commerce Street`,
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `contact@${customer.name.toLowerCase().replace(/\s+/g, '')}.com`,
    }))
  ).returning();

  // Create locations for customers
  console.log('Creating customer locations...');
  const locations_data = [];
  for (const customer of createdCustomers) {
    // Create 1-3 locations per customer
    const locationCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < locationCount; i++) {
      locations_data.push({
        customerId: customer.id,
        name: i === 0 ? `${customer.name} - Main Facility` : `${customer.name} - Warehouse ${i + 1}`,
        address: `${Math.floor(Math.random() * 9000) + 1000} Industrial Way`,
        city: customer.city!,
        state: customer.state!,
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        latitude: (Math.random() * 180 - 90).toFixed(7),
        longitude: (Math.random() * 360 - 180).toFixed(7),
        phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        dockCount: Math.floor(Math.random() * 20) + 5,
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
        operatingHours: {
          monday: "06:00-18:00",
          tuesday: "06:00-18:00",
          wednesday: "06:00-18:00",
          thursday: "06:00-18:00",
          friday: "06:00-18:00",
          saturday: "08:00-12:00",
          sunday: "Closed"
        },
      });
    }
  }
  const createdLocations = await db.insert(locations).values(locations_data as Array<typeof locations.$inferInsert>).returning();

  // Create contacts for customers
  console.log('Creating customer contacts...');
  const contactNames = [
    ["Michael", "Johnson"], ["Jennifer", "Davis"], ["Robert", "Wilson"], ["Lisa", "Anderson"],
    ["David", "Taylor"], ["Maria", "Garcia"], ["Christopher", "Martinez"], ["Jessica", "Brown"],
    ["Daniel", "Jones"], ["Ashley", "Miller"], ["Matthew", "Moore"], ["Amanda", "Jackson"],
    ["Anthony", "Martin"], ["Melissa", "Lee"], ["Mark", "Lewis"], ["Stephanie", "Walker"]
  ];

  const contacts_data = [];
  for (let i = 0; i < createdCustomers.length; i++) {
    const customer = createdCustomers[i];
    const [firstName, lastName] = contactNames[i % contactNames.length];
    contacts_data.push({
      customerId: customer.id,
      firstName,
      lastName,
      title: "Transportation Manager",
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${customer.name!.toLowerCase().replace(/\s+/g, '')}.com`,
      isPrimary: true,
    });
  }
  await db.insert(contacts).values(contacts_data);

  // Create tractors
  console.log('Creating tractors...');
  const tractorMakes = ["Peterbilt", "Kenworth", "Freightliner", "Volvo", "Mack"];
  const tractorModels = ["389", "T680", "Cascadia", "VNL", "Anthem"];
  const tractors_data = [];

  for (let i = 1; i <= 15; i++) {
    const make = tractorMakes[Math.floor(Math.random() * tractorMakes.length)];
    const model = tractorModels[Math.floor(Math.random() * tractorModels.length)];
    tractors_data.push({
      organizationId: org.id,
      unitNumber: `T${i.toString().padStart(3, '0')}`,
      vin: `1FTFW1ET${Math.floor(Math.random() * 90000000) + 10000000}`,
      make,
      model,
      year: 2018 + Math.floor(Math.random() * 6),
      engineMake: make === "Peterbilt" || make === "Kenworth" ? "PACCAR" : make === "Volvo" ? "Volvo" : "Detroit",
      engineModel: "MX-13",
      fuelType: "Diesel",
      licensePlate: `TX${Math.floor(Math.random() * 900000) + 100000}`,
      plateState: "TX",
      registrationExpiration: d(new Date(2026, 11, 31)),
      inspectionExpiration: d(new Date(2026, 5, 30)),
      currentOdometer: Math.floor(Math.random() * 500000) + 100000,
      status: i <= 12 ? "available" as const : "maintenance" as const,
      currentLocation: {
        latitude: 32.7767 + (Math.random() - 0.5) * 0.1,
        longitude: -96.7970 + (Math.random() - 0.5) * 0.1
      },
    });
  }
  const createdTractors = await db.insert(tractors).values(tractors_data as Array<typeof tractors.$inferInsert>).returning();

  // Create trailers
  console.log('Creating trailers...');
  const trailerTypes = ["dry_van", "reefer", "flatbed"];
  const trailers_data = [];

  for (let i = 1; i <= 25; i++) {
    const trailerType = trailerTypes[Math.floor(Math.random() * trailerTypes.length)];
    trailers_data.push({
      organizationId: org.id,
      unitNumber: `R${i.toString().padStart(3, '0')}`,
      trailerType,
      make: "Great Dane",
      model: "Everest",
      year: 2019 + Math.floor(Math.random() * 5),
      length: "53.00",
      width: "8.50",
      height: "13.50",
      capacity: trailerType === "reefer" ? "45000.00" : "48000.00",
      tareWeight: trailerType === "flatbed" ? "12000.00" : "14000.00",
      licensePlate: `TX${Math.floor(Math.random() * 900000) + 100000}T`,
      plateState: "TX",
      registrationExpiration: d(new Date(2026, 11, 31)),
      inspectionExpiration: d(new Date(2026, 5, 30)),
      status: i <= 20 ? "available" : "maintenance",
      currentLocation: {
        latitude: 32.7767 + (Math.random() - 0.5) * 0.1,
        longitude: -96.7970 + (Math.random() - 0.5) * 0.1
      },
    });
  }
  const createdTrailers = await db.insert(trailers).values(trailers_data as Array<typeof trailers.$inferInsert>).returning();

  // Create drivers
  console.log('Creating drivers...');
  const driverNames = [
    ["Marcus", "Rivera"], ["Sarah", "Thompson"], ["Carlos", "Rodriguez"], ["Maria", "Gonzalez"],
    ["James", "Anderson"], ["Jessica", "Williams"], ["Robert", "Johnson"], ["Lisa", "Davis"],
    ["Michael", "Brown"], ["Jennifer", "Garcia"], ["David", "Martinez"], ["Amanda", "Wilson"],
    ["Christopher", "Lopez"], ["Stephanie", "Taylor"], ["Anthony", "Moore"], ["Melissa", "Jackson"],
    ["Daniel", "Lee"], ["Ashley", "Perez"], ["Matthew", "White"], ["Brittany", "Harris"]
  ];

  const drivers_data = [];
  for (let i = 0; i < 20; i++) {
    const [firstName, lastName] = driverNames[i];
    const hireYear = 2018 + Math.floor(Math.random() * 6);
    drivers_data.push({
      organizationId: org.id,
      employeeId: `D${(i + 1).toString().padStart(4, '0')}`,
      firstName,
      lastName,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@atlasfreight.com`,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${["Oak", "Pine", "Maple", "Cedar", "Elm"][Math.floor(Math.random() * 5)]} Street`,
      city: ["Dallas", "Fort Worth", "Arlington", "Plano", "Irving"][Math.floor(Math.random() * 5)],
      state: "TX",
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      dateOfBirth: d(new Date(1970 + Math.floor(Math.random()) * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      hireDate: d(new Date(hireYear, Math.floor(Math.random()) * 12), Math.floor(Math.random() * 28) + 1),
      cdlNumber: `TX${Math.floor(Math.random() * 90000000) + 10000000}`,
      cdlState: "TX",
      cdlExpiration: d(new Date(2026 + Math.floor(Math.random()) * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      medicalCertExpiration: d(new Date(2025, 6 + Math.floor(Math.random()) * 6), Math.floor(Math.random() * 28) + 1),
      status: i < 15 ? "available" : ["on_load", "off_duty"][Math.floor(Math.random() * 2)],
      currentLocation: {
        latitude: 32.7767 + (Math.random() - 0.5) * 2,
        longitude: -96.7970 + (Math.random() - 0.5) * 2
      },
      homeTimePreference: [7, 14, 21][Math.floor(Math.random() * 3)],
      payStructure: {
        type: "percentage",
        rate: 0.28 + Math.random() * 0.07, // 28-35%
        bonuses: {
          safetyBonus: 500,
          onTimeBonus: 250
        }
      },
      preferences: {
        preferredLanes: [["TX-CA", "TX-FL"], ["TX-GA", "TX-NC"], ["TX-AZ", "TX-NV"]][Math.floor(Math.random() * 3)],
        maxMiles: 2500 + Math.floor(Math.random() * 500)
      },
      safetyScore: (85 + Math.random() * 15).toFixed(2),
    });
  }
  const createdDrivers = await db.insert(drivers).values(drivers_data as Array<typeof drivers.$inferInsert>).returning();

  // Create driver qualifications
  console.log('Creating driver qualifications...');
  const qualifications_data = [];
  const qualificationTypes = ["Hazmat", "Tanker", "Double/Triple", "Passenger", "School Bus"];

  for (const driver of createdDrivers) {
    // Each driver gets 1-3 random qualifications
    const numQualifications = Math.floor(Math.random() * 3) + 1;
    const driverQualifications = qualificationTypes.sort(() => 0.5 - Math.random()).slice(0, numQualifications);

    for (const qualType of driverQualifications) {
      qualifications_data.push({
        driverId: driver.id,
        qualificationType: qualType,
        issuedBy: "Texas DPS",
        issueDate: d(new Date(2022 + Math.floor(Math.random()) * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        expirationDate: d(new Date(2026 + Math.floor(Math.random()) * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        certificateNumber: `TX${Math.floor(Math.random() * 900000) + 100000}`,
      });
    }
  }
  await db.insert(driverQualifications).values(qualifications_data as Array<typeof driverQualifications.$inferInsert>);

  // Create driver certifications
  console.log('Creating driver certifications...');
  const certifications_data = [];
  const certificationTypes = ["TWIC", "Fast Card", "DOT Medical", "Safety Training"];

  for (const driver of createdDrivers) {
    // Each driver gets 1-2 certifications
    const numCertifications = Math.floor(Math.random() * 2) + 1;
    const driverCertifications = certificationTypes.sort(() => 0.5 - Math.random()).slice(0, numCertifications);

    for (const certType of driverCertifications) {
      certifications_data.push({
        driverId: driver.id,
        certificationType: certType,
        certificationNumber: `${certType.replace(/\s+/g, '').toUpperCase()}${Math.floor(Math.random() * 900000) + 100000}`,
        issueDate: d(new Date(2022 + Math.floor(Math.random()) * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        expirationDate: d(new Date(2025 + Math.floor(Math.random()) * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        issuingAgency: certType === "TWIC" ? "TSA" : certType === "DOT Medical" ? "FMCSA" : "Atlas Training Center",
      });
    }
  }
  await db.insert(driverCertifications).values(certifications_data as Array<typeof driverCertifications.$inferInsert>);

  // Create orders
  console.log('Creating orders...');
  const statuses = ["available", "assigned", "dispatched", "in_transit", "delivered", "completed"];
  const commodities = ["Electronics", "Automotive Parts", "Food Products", "Chemicals", "Machinery", "Textiles", "Steel", "Paper Products"];
  const equipmentTypes = ["dry_van", "reefer", "flatbed"];

  const orders_data = [];
  for (let i = 1; i <= 50; i++) {
    const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
    const commodity = commodities[Math.floor(Math.random() * commodities.length)];
    const equipmentType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    const weight = (Math.random() * 35000 + 10000).toFixed(0); // 10,000 - 45,000 lbs
    const miles = Math.floor(Math.random() * 2000) + 200;
    const rate = parseFloat((miles * (2.0 + Math.random() * 1.0)).toFixed(2)); // $2.00-$3.00 per mile

    orders_data.push({
      organizationId: org.id,
      orderNumber: `0${(10000 + i).toString()}`,
      customerId: customer.id,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      revenueCode: "COMPANY",
      commodity,
      weight,
      pieces: Math.floor(Math.random() * 20) + 1,
      equipmentType,
      customerReferenceNumber: `${customer.code}${Math.floor(Math.random() * 9000) + 1000}`,
      priorityLevel: Math.random() < 0.1 ? "high" : Math.random() < 0.2 ? "urgent" : "normal",
      totalRevenue: rate.toString(),
      totalCost: (rate * 0.75).toFixed(2),
      margin: (rate * 0.25).toFixed(2),
      miles: miles.toString(),
      notes: i % 7 === 0 ? "Temperature controlled shipment required" :
             i % 11 === 0 ? "Hazmat documentation required" :
             i % 13 === 0 ? "Appointment required for delivery" : null,
    });
  }
  const createdOrders = await db.insert(orders).values(orders_data as Array<typeof orders.$inferInsert>).returning();

  // Create stops for orders
  console.log('Creating stops for orders...');
  const stops_data = [];
  for (const order of createdOrders) {
    // Each order gets 2 stops (pickup and delivery)
    const pickupLocation = createdLocations[Math.floor(Math.random() * createdLocations.length)];
    const deliveryLocation = createdLocations[Math.floor(Math.random() * createdLocations.length)];

    const pickupDate = d(new Date());
    pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 7));

    const deliveryDate = d(new Date(pickupDate));
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 1);

    // Pickup stop
    stops_data.push({
      orderId: order.id,
      locationId: pickupLocation.id,
      sequence: 1,
      type: "pickup",
      scheduledDate: pickupDate,
      scheduledTimeStart: "08:00",
      scheduledTimeEnd: "17:00",
      address: pickupLocation.address!,
      city: pickupLocation.city!,
      state: pickupLocation.state!,
      zipCode: pickupLocation.zipCode!,
      latitude: pickupLocation.latitude,
      longitude: pickupLocation.longitude,
      contactName: "Shipping Manager",
      contactPhone: pickupLocation.phone,
      referenceNumbers: {
        po_number: `PO${Math.floor(Math.random() * 900000) + 100000}`,
        bol_number: `BOL${Math.floor(Math.random() * 900000) + 100000}`
      },
      isCompleted: order.status === "delivered" || order.status === "completed",
    });

    // Delivery stop
    stops_data.push({
      orderId: order.id,
      locationId: deliveryLocation.id,
      sequence: 2,
      type: "delivery",
      scheduledDate: deliveryDate,
      scheduledTimeStart: "08:00",
      scheduledTimeEnd: "17:00",
      address: deliveryLocation.address!,
      city: deliveryLocation.city!,
      state: deliveryLocation.state!,
      zipCode: deliveryLocation.zipCode!,
      latitude: deliveryLocation.latitude,
      longitude: deliveryLocation.longitude,
      contactName: "Receiving Manager",
      contactPhone: deliveryLocation.phone,
      referenceNumbers: {
        delivery_number: `DEL${Math.floor(Math.random() * 900000) + 100000}`
      },
      isCompleted: order.status === "completed",
    });
  }
  await db.insert(stops).values(stops_data as Array<typeof stops.$inferInsert>);

  // Create assignments for some orders
  console.log('Creating assignments...');
  const assignments_data = [];
  const assignableOrders = createdOrders.filter(order =>
    ["assigned", "dispatched", "in_transit", "delivered", "completed"].includes(order.status!)
  );

  for (let i = 0; i < Math.min(assignableOrders.length, 15); i++) {
    const order = assignableOrders[i];
    const driver = createdDrivers[i % createdDrivers.length];
    const tractor = createdTractors[i % createdTractors.length];
    const trailer = createdTrailers[i % createdTrailers.length];

    assignments_data.push({
      orderId: order.id,
      driverId: driver.id,
      tractorId: tractor.id,
      trailerId: trailer.id,
      assignedBy: dispatchers[0].id,
      dispatchedBy: order.status !== "assigned" ? dispatchers[0].id : null,
      dispatchedAt: order.status !== "assigned" ? d(new Date()) : null,
    });
  }
  await db.insert(assignments).values(assignments_data as Array<typeof assignments.$inferInsert>);

  // Create charges for orders
  console.log('Creating charges for orders...');
  const charges_data = [];
  for (const order of createdOrders) {
    // Linehaul charge
    charges_data.push({
      orderId: order.id,
      chargeCodeId: createdChargeCodes[0].id, // LINEHAUL
      description: "Linehaul Transportation",
      quantity: order.miles!,
      rate: "2.50",
      amount: (parseFloat(order.miles!) * 2.50).toFixed(2),
      billToCustomer: true,
      payToDriver: true,
    });

    // Fuel surcharge
    charges_data.push({
      orderId: order.id,
      chargeCodeId: createdChargeCodes[1].id, // FSC
      description: "Fuel Surcharge",
      quantity: "1.00",
      rate: (parseFloat(order.totalRevenue!) * 0.15).toFixed(2),
      amount: (parseFloat(order.totalRevenue!) * 0.15).toFixed(2),
      billToCustomer: true,
      payToDriver: false,
    });

    // Random accessorial charges
    if (Math.random() < 0.3) {
      charges_data.push({
        orderId: order.id,
        chargeCodeId: createdChargeCodes[2].id, // DETENTION
        description: "Detention at Pickup",
        quantity: "2.00",
        rate: "50.00",
        amount: "100.00",
        billToCustomer: true,
        payToDriver: true,
      });
    }
  }
  await db.insert(charges).values(charges_data as Array<typeof charges.$inferInsert>);

  console.log('✅ Database seeded successfully!');
  console.log(`Created:
  - 1 Organization (Atlas Freight Solutions)
  - 5 Users (1 admin, 2 dispatchers, 1 safety, 1 accounting)
  - 10 Customers with locations and contacts
  - 20 Drivers with qualifications and certifications
  - 15 Tractors
  - 25 Trailers
  - 48 Charge Codes (comprehensive accessorial library)
  - 50 Orders with stops, assignments, and charges`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
