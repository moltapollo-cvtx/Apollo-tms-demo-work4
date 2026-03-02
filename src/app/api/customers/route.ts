import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { mockStore, nextNumericId } from "@/lib/mock-store";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const offset = (page - 1) * pageSize;

    // Filters
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const states = searchParams.get("state")?.split(",");
    const include = searchParams.get("include")?.split(",") || [];

    // Filter mock customers
    const filteredCustomers = mockStore.customers.filter((customer) => {
      if (customer.organizationId !== organizationId) {
        return false;
      }
      // Active filter
      if (isActive !== null && customer.isActive !== (isActive === "true")) {
        return false;
      }

      // State filter
      if (states && states.length > 0 && !states.includes(customer.address.state)) {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const name = customer.name.toLowerCase();
        const code = customer.code.toLowerCase();
        const email = customer.email.toLowerCase();
        const city = customer.address.city.toLowerCase();

        if (!name.includes(searchLower) &&
            !code.includes(searchLower) &&
            !email.includes(searchLower) &&
            !city.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    // Sort by name
    filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));

    const total = filteredCustomers.length;
    const totalPages = Math.ceil(total / pageSize);

    // Paginate
    const paginatedCustomers = filteredCustomers.slice(offset, offset + pageSize);

    // Add included data
    const customersWithIncludes = paginatedCustomers.map((customer) => {
      const response: Record<string, unknown> = { ...customer };

      // Add mock contacts if requested
      if (include.includes("contacts")) {
        response.contacts = [
          {
            id: customer.id * 100 + 1,
            customerId: customer.id,
            firstName: customer.contactName.split(' ')[0],
            lastName: customer.contactName.split(' ')[1] || '',
            title: customer.contactTitle,
            email: customer.email,
            phone: customer.phone,
            isPrimary: true,
            isActive: true
          }
        ];
      }

      // Add mock locations if requested
      if (include.includes("locations")) {
        response.locations = [
          {
            id: customer.id * 100 + 1,
            customerId: customer.id,
            name: "Main Location",
            type: "primary",
            ...customer.address,
            isActive: true
          }
        ];
      }

      // Add related orders if requested
      if (include.includes("orders")) {
        response.orders = mockStore.orders
          .filter(
            (order) =>
              order.customerId === customer.id &&
              order.organizationId === organizationId &&
              order.isActive,
          )
          .slice(0, 10) // Limit recent orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Add related invoices if requested
      if (include.includes("invoices")) {
        response.invoices = mockStore.invoices
          .filter(
            (invoice) =>
              invoice.customerId === customer.id &&
              invoice.organizationId === organizationId &&
              invoice.isActive,
          )
          .slice(0, 10); // Limit recent invoices
      }

      return response;
    });

    return NextResponse.json({
      data: customersWithIncludes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            message: `Field '${field}' is required`,
          },
          { status: 400 }
        );
      }
    }

    // Generate customer code if not provided
    if (!body.code) {
      const customerName = body.name.toUpperCase().replace(/[^A-Z]/g, "");
      const namePrefix = customerName.slice(0, 3);

      // Get the next number for this prefix from mock data
      const existingCodes = mockStore.customers
        .filter(c => c.code.startsWith(namePrefix))
        .map(c => parseInt(c.code.slice(3)))
        .filter(n => !isNaN(n));

      const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
      body.code = `${namePrefix}${nextNumber.toString().padStart(3, "0")}`;
    }

    // Check for duplicate customer code in mock data
    const existingCustomer = mockStore.customers.find(
      (c) =>
        c.code === body.code &&
        c.organizationId === organizationId &&
        c.isActive,
    );
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer code already exists",
        },
        { status: 400 }
      );
    }

    // Create mock customer
    const newCustomer = {
      id: nextNumericId(mockStore.customers),
      organizationId,
      name: body.name,
      code: body.code,
      type: body.type || "shipper",
      contactName: body.contactName || "Main Contact",
      contactTitle: body.contactTitle || "Manager",
      email: body.email || `info@${body.name.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: body.phone || "(555) 123-4567",
      address: body.address || {
        street: "123 Business Street",
        city: "Business City",
        state: "ST",
        zipCode: "12345",
        country: "United States"
      },
      paymentTerms: body.paymentTerms || "NET_30",
      creditLimit: body.creditLimit || 50000.00,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockStore.customers.unshift(newCustomer as never);

    return NextResponse.json({
      data: newCustomer,
      success: true,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer",
      },
      { status: 500 }
    );
  }
}
