"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Tabs } from "@/components/ui/tabs"
import { CustomerList } from "@/components/customers/customer-list"
import { CustomerDetail } from "@/components/customers/customer-detail"
import { FacilitySearch } from "@/components/customers/facility-search"
import { Button } from "@/components/ui/button"
import { Buildings, MapPin, X } from "@phosphor-icons/react"

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("customers")
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null)
  const { toast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", code: "", contactName: "", email: "", phone: "", city: "", state: "" })

  const handleAddCustomer = () => {
    const code = `CUS-${(100 + Math.floor(Math.random() * 900)).toString()}`
    setShowAddForm(false)
    toast({ title: "Customer Created", description: `${newCustomer.name} (${code}) has been added.` })
    setNewCustomer({ name: "", code: "", contactName: "", email: "", phone: "", city: "", state: "" })
  }

  const handleViewCustomer = (id: number) => {
    setSelectedCustomer(id)
  }

  const handleBackToList = () => {
    setSelectedCustomer(null)
  }

  const tabs = [
    {
      value: "customers",
      label: "Customers",
      icon: <Buildings className="h-4 w-4" />
    },
    {
      value: "facilities",
      label: "Facility Search",
      icon: <MapPin className="h-4 w-4" />
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Customer Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer relationships, contacts, facilities, and service history.
          </p>
        </div>
      </div>

      {/* Show customer detail if selected */}
      {selectedCustomer ? (
        <CustomerDetail
          id={selectedCustomer}
          onBack={handleBackToList}
        />
      ) : (
        <>
          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            tabs={tabs}
          />

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "customers" && (
              <CustomerList
                onViewCustomer={handleViewCustomer}
                onAddCustomer={() => setShowAddForm(true)}
              />
            )}
            {activeTab === "facilities" && (
              <FacilitySearch
                onLocationSelect={(location) => {
                  toast({
                    title: "Facility Selected",
                    description: `${location.name} in ${location.city}, ${location.state} is now active.`,
                  })
                }}
              />
            )}
          </div>
        </>
      )}
      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Add New Customer</h2>
                <button onClick={() => setShowAddForm(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                  <input type="text" value={newCustomer.name} onChange={(e) => setNewCustomer(p => ({ ...p, name: e.target.value }))} placeholder="Acme Logistics" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Primary Contact</label>
                  <input type="text" value={newCustomer.contactName} onChange={(e) => setNewCustomer(p => ({ ...p, contactName: e.target.value }))} placeholder="Jane Doe" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                    <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer(p => ({ ...p, email: e.target.value }))} placeholder="jane@acme.com" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                    <input type="tel" value={newCustomer.phone} onChange={(e) => setNewCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">City</label>
                    <input type="text" value={newCustomer.city} onChange={(e) => setNewCustomer(p => ({ ...p, city: e.target.value }))} placeholder="Dallas" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">State</label>
                    <input type="text" value={newCustomer.state} onChange={(e) => setNewCustomer(p => ({ ...p, state: e.target.value }))} placeholder="TX" maxLength={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button onClick={handleAddCustomer} disabled={!newCustomer.name}>Add Customer</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
