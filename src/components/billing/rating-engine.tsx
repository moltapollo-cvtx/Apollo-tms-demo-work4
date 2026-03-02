"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Plus,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useChargeCodes } from "@/lib/hooks/api/use-billing";
import type { ChargeCode } from "@/lib/hooks/api/use-billing";
import { cn } from "@/lib/utils";

interface RateCalculation {
  baseRate: number;
  fuelSurcharge: number;
  accessorials: AccessorialCharge[];
  totalRate: number;
  perMileRate?: number;
}

interface AccessorialCharge {
  id: string;
  code: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  rateType: string;
}

interface RatingEngineProps {
  miles?: number;
  weight?: number;
  onRateCalculated?: (calculation: RateCalculation) => void;
  className?: string;
}

const RATE_TYPES = [
  { value: "flat", label: "Flat Rate", icon: Calculator },
  { value: "per_mile", label: "Per Mile", icon: Calculator },
  { value: "per_cwt", label: "Per CWT", icon: Calculator },
  { value: "per_unit", label: "Per Unit", icon: Calculator },
  { value: "percentage", label: "Percentage", icon: Calculator },
];

const FUEL_SURCHARGE_METHODS = [
  { value: "percentage", label: "Percentage of Base Rate" },
  { value: "flat", label: "Flat Amount" },
  { value: "per_mile", label: "Per Mile" },
  { value: "doe_index", label: "DOE Index Based" },
];

export function RatingEngine({
  miles = 0,
  weight = 0,
  onRateCalculated,
  className,
}: RatingEngineProps) {
  const [rateType, setRateType] = useState("flat");
  const [baseRateAmount, setBaseRateAmount] = useState("");
  const [fuelSurchargeMethod, setFuelSurchargeMethod] = useState<string>("percentage");
  const [fuelSurchargeValue, setFuelSurchargeValue] = useState("");
  const [accessorials, setAccessorials] = useState<AccessorialCharge[]>([]);
  const [showAccessorialBuilder, setShowAccessorialBuilder] = useState(false);
  const [calculation, setCalculation] = useState<RateCalculation>({
    baseRate: 0,
    fuelSurcharge: 0,
    accessorials: [],
    totalRate: 0,
    perMileRate: 0,
  });

  const { data: chargeCodes } = useChargeCodes({ isActive: true });

  // Recalculate rates when inputs change
  useEffect(() => {
    calculateRates();
  }, [baseRateAmount, fuelSurchargeValue, fuelSurchargeMethod, accessorials, rateType, miles, weight]);

  const calculateRates = () => {
    let baseRate = parseFloat(baseRateAmount) || 0;

    // Calculate base rate based on type
    if (rateType === "per_cwt" && weight > 0) {
      baseRate = baseRate * (weight / 100);
    } else if (rateType === "per_mile" && miles > 0) {
      baseRate = baseRate * miles;
    }

    // Calculate fuel surcharge
    let fuelSurcharge = 0;
    const fscValue = parseFloat(fuelSurchargeValue) || 0;

    switch (fuelSurchargeMethod) {
      case "percentage":
        fuelSurcharge = baseRate * (fscValue / 100);
        break;
      case "flat":
        fuelSurcharge = fscValue;
        break;
      case "per_mile":
        fuelSurcharge = fscValue * miles;
        break;
      case "doe_index":
        // Simplified DOE calculation - in real world this would use actual DOE data
        fuelSurcharge = baseRate * 0.15; // Assume 15% based on current index
        break;
    }

    // Calculate accessorial total
    const accessorialTotal = accessorials.reduce((sum, accessorial) => sum + accessorial.amount, 0);

    const totalRate = baseRate + fuelSurcharge + accessorialTotal;
    const perMileRate = miles > 0 ? totalRate / miles : 0;

    const newCalculation: RateCalculation = {
      baseRate,
      fuelSurcharge,
      accessorials: [...accessorials],
      totalRate,
      perMileRate,
    };

    setCalculation(newCalculation);
    onRateCalculated?.(newCalculation);
  };

  const addAccessorial = (chargeCode: ChargeCode) => {
    const id = `${chargeCode.id}-${Date.now()}`;
    const quantity = 1;
    const rate = Number(chargeCode.defaultRate ?? 0);
    let amount = rate * quantity;

    // Apply rate type calculations
    if (chargeCode.rateType === "per_mile" && miles > 0) {
      amount = rate * miles;
    } else if (chargeCode.rateType === "per_cwt" && weight > 0) {
      amount = rate * (weight / 100);
    } else if (chargeCode.rateType === "percentage") {
      amount = (parseFloat(baseRateAmount) || 0) * (rate / 100);
    }

    const newAccessorial: AccessorialCharge = {
      id,
      code: chargeCode.code,
      description: chargeCode.description,
      quantity,
      rate,
      amount,
      rateType: chargeCode.rateType || "flat",
    };

    setAccessorials([...accessorials, newAccessorial]);
  };

  const updateAccessorial = (id: string, updates: Partial<AccessorialCharge>) => {
    setAccessorials(accessorials.map(accessorial => {
      if (accessorial.id === id) {
        const updated = { ...accessorial, ...updates };
        // Recalculate amount when quantity or rate changes
        if (updates.quantity !== undefined || updates.rate !== undefined) {
          let amount = updated.rate * updated.quantity;
          if (updated.rateType === "per_mile" && miles > 0) {
            amount = updated.rate * miles;
          } else if (updated.rateType === "per_cwt" && weight > 0) {
            amount = updated.rate * (weight / 100);
          }
          updated.amount = amount;
        }
        return updated;
      }
      return accessorial;
    }));
  };

  const removeAccessorial = (id: string) => {
    setAccessorials(accessorials.filter(accessorial => accessorial.id !== id));
  };

  const _selectedRateType = RATE_TYPES.find(type => type.value === rateType);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Rate Type Selection */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-5 text-primary" weight="light" />
          <h3 className="text-base font-semibold">Base Rate</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Rate Type</label>
            <Select
              value={rateType}
              onValueChange={(value) => setRateType(Array.isArray(value) ? value[0] : value)}
              options={RATE_TYPES.map(type => ({
                value: type.value,
                label: type.label,
              }))}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Rate Amount
              {rateType === "per_mile" && " (per mile)"}
              {rateType === "per_cwt" && " (per 100 lbs)"}
              {rateType === "percentage" && " (%)"}
            </label>
            <div className="relative mt-2">
              {rateType !== "percentage" && (
                <span className="absolute left-3 top-1/2 text-muted-foreground -translate-y-1/2">$</span>
              )}
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={baseRateAmount}
                onChange={(e) => setBaseRateAmount(e.target.value)}
                className={rateType !== "percentage" ? "pl-7" : ""}
              />
              {rateType === "percentage" && (
                <span className="absolute right-3 top-1/2 text-muted-foreground -translate-y-1/2">%</span>
              )}
            </div>
          </div>
        </div>

        {/* Rate breakdown */}
        {calculation.baseRate > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base Rate:</span>
              <span className="font-mono font-medium">${calculation.baseRate.toFixed(2)}</span>
            </div>
            {miles > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span><span className="font-mono">{miles}</span> miles</span>
                <span className="font-mono">${(calculation.baseRate / miles).toFixed(3)}/mi</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Fuel Surcharge */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-5 text-orange-500" weight="light" />
          <h3 className="text-base font-semibold">Fuel Surcharge</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Method</label>
            <Select
              value={fuelSurchargeMethod}
              onValueChange={(value) => setFuelSurchargeMethod(Array.isArray(value) ? value[0] : value)}
              options={FUEL_SURCHARGE_METHODS}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {fuelSurchargeMethod === "percentage" ? "Percentage" :
               fuelSurchargeMethod === "per_mile" ? "Rate per Mile" :
               fuelSurchargeMethod === "doe_index" ? "DOE Index (Auto)" : "Amount"}
            </label>
            <div className="relative mt-2">
              {fuelSurchargeMethod === "percentage" ? (
                <>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={fuelSurchargeValue}
                    onChange={(e) => setFuelSurchargeValue(e.target.value)}
                    disabled={false}
                  />
                  <span className="absolute right-3 top-1/2 text-muted-foreground -translate-y-1/2">%</span>
                </>
              ) : (
                <>
                  <span className="absolute left-3 top-1/2 text-muted-foreground -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={fuelSurchargeValue}
                    onChange={(e) => setFuelSurchargeValue(e.target.value)}
                    disabled={fuelSurchargeMethod === "doe_index"}
                    className="pl-7"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {calculation.fuelSurcharge > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-700">Fuel Surcharge:</span>
              <span className="font-mono font-medium text-orange-800">${calculation.fuelSurcharge.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Accessorials */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-apollo-cyan-500" weight="light" />
            <h3 className="text-base font-semibold">Accessorial Charges</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAccessorialBuilder(true)}
            className="gap-2"
          >
            <Plus className="size-4" weight="bold" />
            Add Charge
          </Button>
        </div>

        <AnimatePresence mode="popLayout">
          {accessorials.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Plus className="size-8 mx-auto mb-2 opacity-50" weight="light" />
              <p className="text-sm">No accessorial charges added</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {accessorials.map((accessorial, index) => (
                <motion.div
                  key={accessorial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {accessorial.code}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {accessorial.description}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Quantity</label>
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        value={accessorial.quantity}
                        onChange={(e) => updateAccessorial(accessorial.id, {
                          quantity: parseInt(e.target.value) || 1
                        })}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Rate</label>
                      <div className="relative mt-1">
                        <span className="absolute left-2 top-1/2 text-muted-foreground -translate-y-1/2 text-xs">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={accessorial.rate}
                          onChange={(e) => updateAccessorial(accessorial.id, {
                            rate: parseFloat(e.target.value) || 0
                          })}
                          className="text-xs pl-6"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs text-muted-foreground">Amount</label>
                        <p className="font-mono text-sm font-medium mt-1">
                          ${accessorial.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccessorial(accessorial.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                  >
                    <X className="size-4" weight="bold" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </Card>

      {/* Total Calculation */}
      <Card className="p-6 bg-gradient-to-r from-apollo-cyan-50 to-blue-50 border-apollo-cyan-200">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-5 text-apollo-cyan-600" weight="bold" />
          <h3 className="text-base font-semibold">Rate Summary</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base Rate:</span>
            <span className="font-mono">${calculation.baseRate.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fuel Surcharge:</span>
            <span className="font-mono">${calculation.fuelSurcharge.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Accessorials:</span>
            <span className="font-mono">
              ${accessorials.reduce((sum, acc) => sum + acc.amount, 0).toFixed(2)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total Rate:</span>
            <span className="font-mono text-apollo-cyan-700">${calculation.totalRate.toFixed(2)}</span>
          </div>
          {miles > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Per Mile:</span>
              <span className="font-mono">${calculation.perMileRate?.toFixed(3) || "0.000"}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Accessorial Builder Modal */}
      <AnimatePresence>
        {showAccessorialBuilder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAccessorialBuilder(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Add Accessorial Charge</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAccessorialBuilder(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chargeCodes?.map((chargeCode) => (
                  <motion.div
                    key={chargeCode.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      addAccessorial(chargeCode);
                      setShowAccessorialBuilder(false);
                    }}
                    className="p-4 rounded-lg border border-border hover:border-primary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {chargeCode.code}
                      </Badge>
                      {chargeCode.category && (
                        <Badge variant="outline" className="text-xs">
                          {chargeCode.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{chargeCode.description}</p>
                    {chargeCode.defaultRate && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        ${Number(chargeCode.defaultRate).toFixed(2)}
                        {chargeCode.rateType === "per_mile" && "/mi"}
                        {chargeCode.rateType === "per_cwt" && "/cwt"}
                        {chargeCode.rateType === "per_hour" && "/hr"}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
