"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Buildings,
  Phone,
  Envelope,
  MapPin,
  Globe,
  User,
  CurrencyDollar,
  TrendUp,
  Star,
  Clock,
  Truck,
  ArrowLeft,
  PencilSimple,
} from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import { useCustomer } from "@/lib/hooks/api/use-customers"
import type { CustomerWithDetails, Location, Contact } from "@/types"
import { cn } from "@/lib/utils"

interface CustomerDetailProps {
  id: number
  onBack?: () => void
}

export function CustomerDetail({ id, onBack }: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch customer data
  const {
    data: customerResponse,
    isLoading,
    error
  } = useCustomer(id, ['contacts', 'locations', 'orders', 'invoices', 'performance'])

  const customer = customerResponse?.data

  if (isLoading) {
    return <CustomerDetailSkeleton />
  }

  if (error || !customer) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          {error ? "Failed to load customer details" : "Customer not found"}
        </p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customer List
        </Button>
      </Card>
    )
  }

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "contacts", label: "Contacts" },
    { value: "locations", label: "Locations" },
    { value: "orders", label: "Order History" },
    { value: "performance", label: "Performance" },
    { value: "billing", label: "Billing" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Buildings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <Badge variant={customer.isActive ? "default" : "secondary"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="font-mono">{customer.code}</span>
                {customer.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <a
                      href={customer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {customer.website.replace(/https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span className="font-mono">{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button className="gap-2">
          <PencilSimple className="h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Lifetime Revenue"
          value="$2.4M"
          icon={<CurrencyDollar className="h-5 w-5" />}
          trend={12.3}
        />
        <MetricCard
          title="Total Orders"
          value="1,247"
          icon={<Truck className="h-5 w-5" />}
          trend={8.7}
        />
        <MetricCard
          title="On-Time Delivery"
          value="94.2%"
          icon={<Clock className="h-5 w-5" />}
          trend={2.1}
        />
        <MetricCard
          title="Satisfaction"
          value="4.6"
          icon={<Star className="h-5 w-5" />}
          trend={0.3}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && <OverviewTab customer={customer} />}
        {activeTab === "contacts" && <ContactsTab customer={customer} />}
        {activeTab === "locations" && <LocationsTab customer={customer} />}
        {activeTab === "orders" && <OrderHistoryTab customer={customer} />}
        {activeTab === "performance" && <PerformanceTab customer={customer} />}
        {activeTab === "billing" && <BillingTab customer={customer} />}
      </div>
    </div>
  )
}

function OverviewTab({ customer }: { customer: CustomerWithDetails }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Buildings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Company Information</h3>
        </div>
        <div className="space-y-4">
          <InfoField label="Company Name" value={customer.name} />
          <InfoField label="Customer Code" value={customer.code || "—"} mono />
          <InfoField label="Tax ID" value={customer.taxId || "—"} mono />
          <InfoField label="Payment Terms" value={customer.paymentTerms || "Net 30"} />
          <InfoField label="Credit Limit" value={customer.creditLimit ? `$${Number(customer.creditLimit).toLocaleString()}` : "No limit"} mono />
          {customer.address && (
            <InfoField
              label="Address"
              value={`${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`}
            />
          )}
          {customer.notes && <InfoField label="Notes" value={customer.notes} />}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {generateRecentActivity().map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ContactsTab({ customer }: { customer: CustomerWithDetails }) {
  const contacts = customer.contacts || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customer Contacts</h3>
        <Button size="sm" className="gap-2">
          <User className="h-4 w-4" />
          Add Contact
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((contact: Contact, index: number) => (
          <ContactCard key={contact.id || index} contact={contact} />
        ))}
        {contacts.length === 0 && (
          <Card className="p-6 text-center col-span-2">
            <p className="text-muted-foreground">No contacts found</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function LocationsTab({ customer }: { customer: CustomerWithDetails }) {
  const locations = customer.locations || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customer Locations</h3>
        <Button size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          Add Location
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location: Location, index: number) => (
          <LocationCard key={location.id || index} location={location} />
        ))}
        {locations.length === 0 && (
          <Card className="p-6 text-center col-span-2">
            <p className="text-muted-foreground">No locations found</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function OrderHistoryTab({ customer: _customer }: { customer: CustomerWithDetails }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
      <div className="space-y-3">
        {generateOrderHistory().map((order, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono font-medium">{order.orderNumber}</span>
                <Badge variant="outline">{order.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {order.origin} → {order.destination}
              </div>
              <div className="text-xs text-muted-foreground">
                {order.commodity} • {order.pieces} pieces
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium">${order.revenue}</div>
              <div className="text-xs text-muted-foreground">{order.date}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PerformanceTab({ customer: _customer }: { customer: CustomerWithDetails }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Service Metrics</h3>
        <div className="space-y-4">
          <MetricBar label="On-Time Pickup" value={94} />
          <MetricBar label="On-Time Delivery" value={96} />
          <MetricBar label="Claims Rate" value={2} inverted />
          <MetricBar label="Service Quality" value={92} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">This Month</span>
            <span className="font-mono font-medium">$127,450</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Last Month</span>
            <span className="font-mono font-medium">$134,200</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">3 Months Ago</span>
            <span className="font-mono font-medium">$118,900</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">YTD Average</span>
            <span className="font-mono font-medium">$125,800</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function BillingTab({ customer }: { customer: CustomerWithDetails }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Billing Information</h3>
        <div className="space-y-4">
          <InfoField label="Payment Terms" value={customer.paymentTerms || "Net 30"} />
          <InfoField label="Credit Limit" value={customer.creditLimit ? `$${Number(customer.creditLimit).toLocaleString()}` : "No limit"} mono />
          <InfoField label="Current Balance" value="$23,450" mono />
          <InfoField label="Available Credit" value="$76,550" mono />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
        <div className="space-y-3">
          {generateRecentInvoices().map((invoice, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-mono font-medium">{invoice.number}</div>
                <div className="text-sm text-muted-foreground">{invoice.date}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">${invoice.amount}</div>
                <Badge variant={invoice.paid ? "default" : "secondary"}>
                  {invoice.paid ? "Paid" : "Pending"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Helper Components
function MetricCard({ title, value, icon, trend }: {
  title: string
  value: string
  icon: React.ReactNode
  trend: number
}) {
  const isPositive = trend > 0
  const TrendIcon = isPositive ? TrendUp : TrendUp // Both show as positive for customer metrics

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-mono">{value}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-primary">{icon}</div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend)}%
          </div>
        </div>
      </div>
    </Card>
  )
}

function InfoField({ label, value, mono = false }: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-right", mono && "font-mono")}>
        {value || "—"}
      </span>
    </div>
  )
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">
              {contact.firstName} {contact.lastName}
            </h4>
            {contact.isPrimary && (
              <Badge variant="default" className="text-xs">Primary</Badge>
            )}
          </div>
          {contact.title && (
            <p className="text-sm text-muted-foreground">{contact.title}</p>
          )}
          <div className="mt-2 space-y-1">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <Envelope className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-primary hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{contact.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function LocationCard({ location }: { location: Location }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{location.name}</h4>
            {location.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-mono text-sm">{location.rating}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {location.city}, {location.state}
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            {location.dockCount && (
              <p>{location.dockCount} loading docks</p>
            )}
            {location.averageWaitTime && (
              <p>Avg wait: {location.averageWaitTime} min</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function MetricBar({ label, value, inverted = false }: {
  label: string
  value: number
  inverted?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{value}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all",
            inverted ? "bg-red-500" : "bg-green-500"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// Mock data generators
function generateRecentActivity() {
  return [
    { description: "New order placed: TMS-67890", timestamp: "2 hours ago" },
    { description: "Invoice INV-2024-0156 paid", timestamp: "1 day ago" },
    { description: "Updated primary contact information", timestamp: "3 days ago" },
    { description: "Order TMS-67845 delivered", timestamp: "5 days ago" },
  ]
}

function generateOrderHistory() {
  return [
    {
      orderNumber: "TMS-67890",
      status: "In Transit",
      origin: "Phoenix, AZ",
      destination: "Denver, CO",
      commodity: "Electronics",
      pieces: 50,
      revenue: "2,450",
      date: "Mar 10, 2026"
    },
    {
      orderNumber: "TMS-67845",
      status: "Delivered",
      origin: "Los Angeles, CA",
      destination: "Seattle, WA",
      commodity: "Furniture",
      pieces: 25,
      revenue: "3,200",
      date: "Mar 8, 2026"
    },
    {
      orderNumber: "TMS-67801",
      status: "Delivered",
      origin: "Dallas, TX",
      destination: "Chicago, IL",
      commodity: "Auto Parts",
      pieces: 100,
      revenue: "1,890",
      date: "Mar 5, 2026"
    },
  ]
}

function generateRecentInvoices() {
  return [
    { number: "INV-2024-0156", date: "Mar 10, 2026", amount: "2,450", paid: true },
    { number: "INV-2024-0154", date: "Mar 8, 2026", amount: "3,200", paid: true },
    { number: "INV-2024-0152", date: "Mar 5, 2026", amount: "1,890", paid: false },
    { number: "INV-2024-0149", date: "Mar 1, 2026", amount: "4,120", paid: true },
  ]
}

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-muted rounded-2xl animate-pulse" />
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-20 bg-muted rounded animate-pulse" />
          </Card>
        ))}
      </div>
      <div className="h-12 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-64 bg-muted rounded animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  )
}
