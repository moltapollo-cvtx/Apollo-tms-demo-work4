"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MagnifyingGlass,
  Clock,
  Truck,
  Package,
  Shield,
  MapPin,
  Users,
  Calendar,
  Scales,
  X,
  Tag,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useChargeCodes, type ChargeCode } from "@/lib/hooks/api/use-billing";
import { cn } from "@/lib/utils";

// Common accessorial charge codes with icons and categories
const COMMON_ACCESSORIALS = [
  {
    category: "detention",
    icon: Clock,
    color: "text-orange-500",
    charges: [
      { code: "DET", description: "Detention - Pickup", category: "detention" },
      { code: "DETD", description: "Detention - Delivery", category: "detention" },
      { code: "WAIT", description: "Wait Time", category: "detention" },
    ]
  },
  {
    category: "equipment",
    icon: Truck,
    color: "text-blue-500",
    charges: [
      { code: "LIFT", description: "Liftgate Service", category: "equipment" },
      { code: "TARP", description: "Tarping", category: "equipment" },
      { code: "CHAIN", description: "Chains & Binders", category: "equipment" },
      { code: "PUMP", description: "Pump-off/On", category: "equipment" },
    ]
  },
  {
    category: "delivery",
    icon: Package,
    color: "text-green-500",
    charges: [
      { code: "INSIDE", description: "Inside Delivery", category: "delivery" },
      { code: "RES", description: "Residential Delivery", category: "delivery" },
      { code: "APPT", description: "Appointment Delivery", category: "delivery" },
      { code: "SORT", description: "Sorting & Segregation", category: "delivery" },
    ]
  },
  {
    category: "special",
    icon: Shield,
    color: "text-apollo-cyan-600",
    charges: [
      { code: "HAZ", description: "Hazmat Surcharge", category: "special" },
      { code: "REEFER", description: "Reefer Fuel", category: "special" },
      { code: "OVER", description: "Oversize/Overweight", category: "special" },
      { code: "TEAM", description: "Team Driver Premium", category: "special" },
    ]
  },
  {
    category: "location",
    icon: MapPin,
    color: "text-red-500",
    charges: [
      { code: "NYC", description: "New York City Delivery", category: "location" },
      { code: "TOLL", description: "Toll Charges", category: "location" },
      { code: "FERRY", description: "Ferry Charges", category: "location" },
      { code: "REMOTE", description: "Remote Delivery", category: "location" },
    ]
  },
  {
    category: "labor",
    icon: Users,
    color: "text-apollo-cyan-600",
    charges: [
      { code: "LUMPER", description: "Lumper/Unloading", category: "labor" },
      { code: "LOAD", description: "Driver Load/Unload", category: "labor" },
      { code: "COUNT", description: "Piece Count", category: "labor" },
      { code: "SORT", description: "Sorting Labor", category: "labor" },
    ]
  },
  {
    category: "time",
    icon: Calendar,
    color: "text-yellow-600",
    charges: [
      { code: "RUSH", description: "Rush Delivery", category: "time" },
      { code: "SAT", description: "Saturday Delivery", category: "time" },
      { code: "SUN", description: "Sunday Delivery", category: "time" },
      { code: "HOL", description: "Holiday Delivery", category: "time" },
    ]
  },
  {
    category: "weight",
    icon: Scales,
    color: "text-gray-600",
    charges: [
      { code: "SCALE", description: "Scales Ticket", category: "weight" },
      { code: "REWEIGH", description: "Reweigh", category: "weight" },
      { code: "HEAVY", description: "Heavy Lift", category: "weight" },
    ]
  },
];

interface AccessorialCharge {
  id: string;
  code: string;
  description: string;
  category?: string;
  defaultRate?: number;
  rateType?: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface AccessorialChargeBuilderProps {
  selectedCharges?: AccessorialCharge[];
  onChargesChange?: (charges: AccessorialCharge[]) => void;
  miles?: number;
  weight?: number;
  className?: string;
}

export function AccessorialChargeBuilder({
  selectedCharges = [],
  onChargesChange,
  miles = 0,
  weight = 0,
  className,
}: AccessorialChargeBuilderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [charges, setCharges] = useState<AccessorialCharge[]>(selectedCharges);

  const { data: chargeCodes, isLoading } = useChargeCodes({ isActive: true });

  const categories = [
    { value: "", label: "All Categories" },
    { value: "detention", label: "Detention" },
    { value: "equipment", label: "Equipment" },
    { value: "delivery", label: "Delivery" },
    { value: "special", label: "Special Services" },
    { value: "location", label: "Location" },
    { value: "labor", label: "Labor" },
    { value: "time", label: "Time Sensitive" },
    { value: "weight", label: "Weight Related" },
    { value: "other", label: "Other" },
  ];

  const addCharge = (chargeCodeData: ChargeCode) => {
    const id = `${chargeCodeData.code}-${Date.now()}`;
    let quantity = 1;
    const defaultRateValue = chargeCodeData.defaultRate ?? 0;
    const rate = parseFloat(String(defaultRateValue)) || 0;
    let amount = rate * quantity;

    // Apply rate type calculations
    if (chargeCodeData.rateType === "per_mile" && miles > 0) {
      quantity = miles;
      amount = rate * miles;
    } else if (chargeCodeData.rateType === "per_cwt" && weight > 0) {
      quantity = weight / 100;
      amount = rate * quantity;
    }

    const newCharge: AccessorialCharge = {
      id,
      code: chargeCodeData.code,
      description: chargeCodeData.description,
      category: chargeCodeData.category,
      defaultRate: chargeCodeData.defaultRate,
      rateType: chargeCodeData.rateType || "flat",
      quantity,
      rate,
      amount,
    };

    const updatedCharges = [...charges, newCharge];
    setCharges(updatedCharges);
    onChargesChange?.(updatedCharges);
  };

  const updateCharge = (id: string, updates: Partial<AccessorialCharge>) => {
    const updatedCharges = charges.map(charge => {
      if (charge.id === id) {
        const updated = { ...charge, ...updates };
        // Recalculate amount when quantity or rate changes
        if (updates.quantity !== undefined || updates.rate !== undefined) {
          updated.amount = updated.rate * updated.quantity;
        }
        return updated;
      }
      return charge;
    });
    setCharges(updatedCharges);
    onChargesChange?.(updatedCharges);
  };

  const removeCharge = (id: string) => {
    const updatedCharges = charges.filter(charge => charge.id !== id);
    setCharges(updatedCharges);
    onChargesChange?.(updatedCharges);
  };

  // Funnel available charge codes
  const filteredChargeCodes = chargeCodes?.filter(code => {
    const matchesSearch = !searchQuery ||
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || code.category === selectedCategory;

    const notAlreadySelected = !charges.some(charge => charge.code === code.code);

    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  const getCategoryIcon = (category: string) => {
    const categoryData = COMMON_ACCESSORIALS.find(c => c.category === category);
    if (categoryData) {
      const Icon = categoryData.icon;
      return <Icon className={cn("size-4", categoryData.color)} weight="light" />;
    }
    return <Tag className="size-4 text-muted-foreground" weight="light" />;
  };

  const totalAmount = charges.reduce((sum, charge) => sum + charge.amount, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Selected Charges */}
      {charges.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Selected Charges</h3>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-mono font-medium">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {charges.map((charge, index) => (
                <motion.div
                  key={charge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {charge.category && getCategoryIcon(charge.category)}
                    <Badge variant="secondary" className="text-xs font-mono">
                      {charge.code}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {charge.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16">
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={charge.quantity}
                        onChange={(e) => updateCharge(charge.id, {
                          quantity: parseFloat(e.target.value) || 1
                        })}
                        className="text-xs text-center"
                        placeholder="Qty"
                      />
                    </div>

                    <div className="w-20">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 text-muted-foreground -translate-y-1/2 text-xs">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={charge.rate}
                          onChange={(e) => updateCharge(charge.id, {
                            rate: parseFloat(e.target.value) || 0
                          })}
                          className="text-xs text-center pl-5"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="w-20 text-right">
                      <span className="text-sm font-mono font-medium">
                        ${charge.amount.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCharge(charge.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                    >
                      <X className="size-3" weight="bold" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* Funnels */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-4 text-muted-foreground -translate-y-1/2" />
          <Input
            placeholder="Search charge codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(Array.isArray(value) ? value[0] : value)}
          options={categories}
          placeholder="All Categories"
          className="w-48"
        />
      </div>

      {/* Available Charges */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Available Charges</h3>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredChargeCodes?.map((chargeCode, index) => (
                <motion.div
                  key={chargeCode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addCharge(chargeCode)}
                  className="p-4 rounded-lg border border-border hover:border-primary cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {chargeCode.category && getCategoryIcon(chargeCode.category)}
                    <Badge variant="secondary" className="text-xs font-mono">
                      {chargeCode.code}
                    </Badge>
                    {chargeCode.category && (
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === chargeCode.category)?.label || chargeCode.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {chargeCode.description}
                  </p>
                  {chargeCode.defaultRate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">
                        ${Number(chargeCode.defaultRate).toFixed(2)}
                        {chargeCode.rateType === "per_mile" && "/mi"}
                        {chargeCode.rateType === "per_cwt" && "/cwt"}
                        {chargeCode.rateType === "per_hour" && "/hr"}
                        {chargeCode.rateType === "percentage" && "%"}
                      </span>
                      <Plus className="size-4 text-primary" weight="bold" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredChargeCodes?.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <MagnifyingGlass className="size-8 mx-auto mb-2 opacity-50" weight="light" />
            <p className="text-sm">No charge codes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
