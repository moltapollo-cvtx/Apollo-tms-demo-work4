"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  CaretDown,
  Funnel,
  MagnifyingGlass,
  Circle,
  Package,
  Snowflake,
  Truck,
  Drop,
  Stack,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-radix";

interface Customer {
  id: number;
  name: string;
  code: string;
}

interface FilterState {
  driverStatus: string[];
  loadStatus: string[];
  equipmentType: string[];
  priorityLevel: string[];
  customerId: string | null;
  region: string | null;
  search: string;
}

interface DispatchFiltersProps {
  customers: Customer[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const driverStatusOptions = [
  { value: "available", label: "Available", color: "bg-apollo-cyan-500" },
  { value: "on_load", label: "On Load", color: "bg-blue-500" },
  { value: "driving", label: "Driving", color: "bg-orange-500" },
  { value: "off_duty", label: "Off Duty", color: "bg-zinc-400" },
  { value: "sleeper", label: "Sleeper", color: "bg-sky-500" },
  { value: "on_break", label: "On Break", color: "bg-yellow-500" },
];

const loadStatusOptions = [
  { value: "available", label: "Available", color: "bg-apollo-cyan-500" },
  { value: "assigned", label: "Assigned", color: "bg-blue-500" },
  { value: "dispatched", label: "Dispatched", color: "bg-sky-500" },
  { value: "in_transit", label: "In Transit", color: "bg-orange-500" },
  { value: "delivered", label: "Delivered", color: "bg-zinc-500" },
];

const equipmentTypeOptions = [
  { value: "dry_van", label: "Dry Van", icon: Package },
  { value: "reefer", label: "Reefer", icon: Snowflake },
  { value: "flatbed", label: "Flatbed", icon: Truck },
  { value: "tanker", label: "Tanker", icon: Drop },
  { value: "step_deck", label: "Step Deck", icon: Stack },
  { value: "double_drop", label: "Double Drop", icon: CaretDown },
];

const priorityLevelOptions = [
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "normal", label: "Normal", color: "bg-blue-500" },
  { value: "low", label: "Low", color: "bg-zinc-500" },
];

const regionOptions = [
  { value: "southwest", label: "Southwest (TX, AZ, NM, NV)" },
  { value: "southeast", label: "Southeast (FL, GA, AL, SC, NC)" },
  { value: "northeast", label: "Northeast (NY, PA, MA, CT, NJ)" },
  { value: "midwest", label: "Midwest (IL, OH, MI, IN, WI)" },
  { value: "west", label: "West (CA, OR, WA, ID)" },
  { value: "mountain", label: "Mountain (CO, UT, WY, MT)" },
];

export function DispatchFilters({ customers, filters, onFiltersChange, className }: DispatchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  type MultiSelectFilterKey = "driverStatus" | "loadStatus" | "equipmentType" | "priorityLevel";

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleArrayFilter = (key: MultiSelectFilterKey, value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];

    updateFilter(key, newArray);
  };

  const clearFilters = () => {
    onFiltersChange({
      driverStatus: [],
      loadStatus: [],
      equipmentType: [],
      priorityLevel: [],
      customerId: null,
      region: null,
      search: "",
    });
  };

  const getActiveFilterCount = () => {
    return (
      filters.driverStatus.length +
      filters.loadStatus.length +
      filters.equipmentType.length +
      filters.priorityLevel.length +
      (filters.customerId ? 1 : 0) +
      (filters.region ? 1 : 0) +
      (filters.search ? 1 : 0)
    );
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drivers, loads, or customers..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          {/* Driver Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Circle className="h-4 w-4 text-apollo-cyan-500" />
                Driver Status
                {filters.driverStatus.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                    {filters.driverStatus.length}
                  </Badge>
                )}
                <CaretDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Driver Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {driverStatusOptions.map(option => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.driverStatus.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("driverStatus", option.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Load Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Circle className="h-4 w-4 text-blue-500" />
                Load Status
                {filters.loadStatus.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                    {filters.loadStatus.length}
                  </Badge>
                )}
                <CaretDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Load Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadStatusOptions.map(option => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.loadStatus.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("loadStatus", option.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Equipment Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Truck className="h-4 w-4" />
                Equipment
                {filters.equipmentType.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                    {filters.equipmentType.length}
                  </Badge>
                )}
                <CaretDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Equipment Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {equipmentTypeOptions.map(option => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.equipmentType.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("equipmentType", option.value)}
                >
                  <div className="flex items-center gap-2">
                    <option.icon className="size-4 text-muted-foreground" weight="duotone" />
                    {option.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Circle className="h-4 w-4 text-red-500" />
                Priority
                {filters.priorityLevel.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                    {filters.priorityLevel.length}
                  </Badge>
                )}
                <CaretDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Priority Level</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {priorityLevelOptions.map(option => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.priorityLevel.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("priorityLevel", option.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Funnel className="h-4 w-4" />
            More
            <CaretDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
          </Button>

          {/* Active Filters Count */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {activeFilterCount} active
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden border-t border-border pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Customer Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Customer
                </label>
                <Select
                  value={filters.customerId || ""}
                  onValueChange={(value) => updateFilter("customerId", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All customers</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} ({customer.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Region
                </label>
                <Select
                  value={filters.region || ""}
                  onValueChange={(value) => updateFilter("region", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All regions</SelectItem>
                    {regionOptions.map(region => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fast filtering shortcuts */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Quick Actions
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter("driverStatus", ["available"])}
                  >
                    Available Drivers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter("priorityLevel", ["urgent", "high"])}
                  >
                    Urgent Loads
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Driver Status Tags */}
          {filters.driverStatus.map(status => {
            const option = driverStatusOptions.find(opt => opt.value === status);
            return option ? (
              <Badge key={`driver-${status}`} variant="secondary" className="gap-1">
                <div className={cn("h-2 w-2 rounded-full", option.color)} />
                Driver: {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleArrayFilter("driverStatus", status)}
                  className="h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ) : null;
          })}

          {/* Load Status Tags */}
          {filters.loadStatus.map(status => {
            const option = loadStatusOptions.find(opt => opt.value === status);
            return option ? (
              <Badge key={`load-${status}`} variant="secondary" className="gap-1">
                <div className={cn("h-2 w-2 rounded-full", option.color)} />
                Load: {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleArrayFilter("loadStatus", status)}
                  className="h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ) : null;
          })}

          {/* Equipment Type Tags */}
          {filters.equipmentType.map(type => {
            const option = equipmentTypeOptions.find(opt => opt.value === type);
            return option ? (
              <Badge key={`equipment-${type}`} variant="secondary" className="gap-1">
                <option.icon className="size-3 text-muted-foreground" weight="duotone" />
                {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleArrayFilter("equipmentType", type)}
                  className="h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ) : null;
          })}

          {/* Priority Tags */}
          {filters.priorityLevel.map(priority => {
            const option = priorityLevelOptions.find(opt => opt.value === priority);
            return option ? (
              <Badge key={`priority-${priority}`} variant="secondary" className="gap-1">
                <div className={cn("h-2 w-2 rounded-full", option.color)} />
                Priority: {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleArrayFilter("priorityLevel", priority)}
                  className="h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ) : null;
          })}

          {/* Customer Tag */}
          {filters.customerId && (
            <Badge variant="secondary" className="gap-1">
              Customer: {customers.find(c => c.id.toString() === filters.customerId)?.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter("customerId", null)}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Region Tag */}
          {filters.region && (
            <Badge variant="secondary" className="gap-1">
              Region: {regionOptions.find(r => r.value === filters.region)?.label.split(" ")[0]}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter("region", null)}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Search Tag */}
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: &quot;{filters.search}&quot;
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter("search", "")}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
