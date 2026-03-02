"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Tabs } from "@/components/ui/tabs"
import { EquipmentList } from "@/components/equipment/equipment-list"
import { EquipmentUtilizationDashboard } from "@/components/equipment/equipment-utilization-dashboard"
import { EquipmentDetail } from "@/components/equipment/equipment-detail"
import { MaintenanceCalendar } from "@/components/equipment/maintenance-calendar"
import { Button } from "@/components/ui/button"
import { Truck, Calendar, ChartPie, X } from "@phosphor-icons/react"

export default function EquipmentPageWrapper() {
  return (
    <Suspense>
      <EquipmentPage />
    </Suspense>
  )
}

function EquipmentPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("fleet")
  const { toast } = useToast()
  const [selectedEquipment, setSelectedEquipment] = useState<{
    id: number
    type: 'tractor' | 'trailer'
  } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEquip, setNewEquip] = useState({ type: "tractor" as "tractor" | "trailer", unitNumber: "", make: "", model: "", year: "", vin: "" })

  // Auto-select equipment from URL params (e.g. ?id=3&type=tractor)
  useEffect(() => {
    const id = searchParams.get("id")
    const type = searchParams.get("type") as "tractor" | "trailer" | null
    if (id && type) {
      setSelectedEquipment((prev) => {
        const nextId = parseInt(id, 10);
        if (prev?.id === nextId && prev?.type === type) return prev;
        return { id: nextId, type };
      })
    }
  }, [searchParams])

  const handleAddEquipment = () => {
    setShowAddForm(false)
    toast({ title: "Equipment Added", description: `${newEquip.make} ${newEquip.model} (${newEquip.unitNumber}) has been added to the fleet.` })
    setNewEquip({ type: "tractor", unitNumber: "", make: "", model: "", year: "", vin: "" })
  }

  const handleViewEquipment = (id: number, type: 'tractor' | 'trailer') => {
    setSelectedEquipment({ id, type })
  }

  const handleBackToList = () => {
    setSelectedEquipment(null)
  }

  const tabs = [
    {
      value: "fleet",
      label: "Fleet Management",
      icon: <Truck className="h-4 w-4" />
    },
    {
      value: "utilization",
      label: "Utilization",
      icon: <ChartPie className="h-4 w-4" />
    },
    {
      value: "maintenance",
      label: "Maintenance",
      icon: <Calendar className="h-4 w-4" />
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Equipment Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tractors, trailers, maintenance schedules, and monitor utilization.
          </p>
        </div>
      </div>

      {/* Show equipment detail if selected */}
      {selectedEquipment ? (
        <EquipmentDetail
          id={selectedEquipment.id}
          type={selectedEquipment.type}
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
            {activeTab === "fleet" && (
              <EquipmentList
                onViewEquipment={handleViewEquipment}
                onAddEquipment={() => setShowAddForm(true)}
              />
            )}
            {activeTab === "utilization" && (
              <EquipmentUtilizationDashboard />
            )}
            {activeTab === "maintenance" && (
              <MaintenanceCalendar
                onScheduleClick={(item) => {
                  toast({
                    title: "Maintenance Draft Created",
                    description: `Scheduled draft opened for unit ${item.equipmentId} on ${item.dueDate}.`,
                  })
                }}
                onDateClick={(date) => {
                  toast({
                    title: "Date Selected",
                    description: `Viewing maintenance items for ${date.toLocaleDateString()}.`,
                  })
                }}
              />
            )}
          </div>
        </>
      )}
      {/* Add Equipment Modal */}
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
                <h2 className="text-lg font-semibold text-foreground">Add Equipment</h2>
                <button onClick={() => setShowAddForm(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                  <div className="flex gap-2">
                    {(["tractor", "trailer"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewEquip(p => ({ ...p, type: t }))}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          newEquip.type === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "tractor" ? "Tractor" : "Trailer"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Unit Number</label>
                  <input type="text" value={newEquip.unitNumber} onChange={(e) => setNewEquip(p => ({ ...p, unitNumber: e.target.value }))} placeholder="1850" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Make</label>
                    <input type="text" value={newEquip.make} onChange={(e) => setNewEquip(p => ({ ...p, make: e.target.value }))} placeholder="Peterbilt" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                    <input type="text" value={newEquip.model} onChange={(e) => setNewEquip(p => ({ ...p, model: e.target.value }))} placeholder="579" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                    <input type="text" value={newEquip.year} onChange={(e) => setNewEquip(p => ({ ...p, year: e.target.value }))} placeholder="2024" maxLength={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">VIN</label>
                    <input type="text" value={newEquip.vin} onChange={(e) => setNewEquip(p => ({ ...p, vin: e.target.value }))} placeholder="1XPWD49X..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button onClick={handleAddEquipment} disabled={!newEquip.unitNumber || !newEquip.make}>Add Equipment</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
