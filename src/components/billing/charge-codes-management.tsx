"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Calculator,
} from "@phosphor-icons/react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleModal as Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useChargeCodes,
  useCreateChargeCode,
  useUpdateChargeCode,
  useDeleteChargeCode,
  type ChargeCode,
} from "@/lib/hooks/api/use-billing";

interface ChargeCodeFormData {
  code: string;
  description: string;
  category: string;
  defaultRate: string;
  rateType: string;
  glAccount: string;
  isActive: boolean;
}

const CHARGE_CODE_CATEGORIES = [
  { value: "accessorial", label: "Accessorial" },
  { value: "freight", label: "Freight" },
  { value: "fuel", label: "Fuel" },
  { value: "detention", label: "Detention" },
  { value: "lumper", label: "Lumper" },
  { value: "other", label: "Other" },
];

const RATE_TYPES = [
  { value: "flat", label: "Flat Rate" },
  { value: "per_mile", label: "Per Mile" },
  { value: "per_cwt", label: "Per CWT" },
  { value: "percentage", label: "Percentage" },
  { value: "per_hour", label: "Per Hour" },
];

export function ChargeCodesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingChargeCode, setEditingChargeCode] = useState<ChargeCode | null>(null);
  const [formData, setFormData] = useState<ChargeCodeFormData>({
    code: "",
    description: "",
    category: "",
    defaultRate: "",
    rateType: "flat",
    glAccount: "",
    isActive: true,
  });

  const { toast } = useToast();
  const { data: chargeCodes, isLoading, error } = useChargeCodes({
    search: searchQuery,
    category: categoryFilter || undefined,
    isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
  });
  const createMutation = useCreateChargeCode();
  const updateMutation = useUpdateChargeCode();
  const deleteMutation = useDeleteChargeCode();

  const handleCreateOrUpdate = async () => {
    try {
      const data = {
        ...formData,
        defaultRate: formData.defaultRate ? parseFloat(formData.defaultRate) : undefined,
      };

      if (editingChargeCode) {
        await updateMutation.mutateAsync({ id: editingChargeCode.id, ...data });
        toast({ title: "Charge code updated successfully" });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Charge code created successfully" });
      }

      setShowModal(false);
      setEditingChargeCode(null);
      resetForm();
    } catch (_error) {
      toast({
        title: "Error",
        description: `Failed to ${editingChargeCode ? "update" : "create"} charge code`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (chargeCode: ChargeCode) => {
    setEditingChargeCode(chargeCode);
    setFormData({
      code: chargeCode.code,
      description: chargeCode.description,
      category: chargeCode.category || "",
      defaultRate: chargeCode.defaultRate?.toString() || "",
      rateType: chargeCode.rateType || "flat",
      glAccount: chargeCode.glAccount || "",
      isActive: chargeCode.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this charge code?")) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Charge code deleted successfully" });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete charge code",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      category: "",
      defaultRate: "",
      rateType: "flat",
      glAccount: "",
      isActive: true,
    });
  };

  const columns = [
    {
      key: "code",
      title: "Code",
      sortable: true,
      render: (value: string, _row: ChargeCode) => (
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-muted-foreground" weight="light" />
          <span className="font-mono font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "description",
      title: "Description",
      sortable: true,
      render: (value: string) => (
        <span className="text-foreground">{value}</span>
      ),
    },
    {
      key: "category",
      title: "Category",
      sortable: true,
      render: (value: string) => (
        value ? (
          <Badge variant="secondary" className="text-xs">
            {CHARGE_CODE_CATEGORIES.find(cat => cat.value === value)?.label || value}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
      ),
    },
    {
      key: "defaultRate",
      title: "Default Rate",
      align: "right" as const,
      render: (value: number | null, row: ChargeCode) => (
        <div className="text-right">
          {value ? (
            <div className="flex items-center justify-end gap-1">
              <span className="font-mono text-sm">${Number(value).toFixed(2)}</span>
              {row.rateType && (
                <span className="text-xs text-muted-foreground">
                  /{row.rateType === "per_mile" ? "mi" : row.rateType === "per_cwt" ? "cwt" : row.rateType === "per_hour" ? "hr" : "flat"}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      key: "glAccount",
      title: "GL Account",
      render: (value: string) => (
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
      ),
    },
    {
      key: "isActive",
      title: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right" as const,
      render: (_: unknown, row: ChargeCode) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 p-0"
          >
            <Calculator className="size-4" weight="light" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <X className="size-4" weight="light" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Charge Codes
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage accessorial and freight charge codes for billing
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="size-4" weight="bold" />
          Add Charge Code
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Calculator className="absolute left-3 top-1/2 size-4 text-muted-foreground -translate-y-1/2" />
          <Input
            placeholder="Search charge codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(Array.isArray(value) ? value[0] : value)}
          placeholder="All Categories"
          options={[
            { value: "", label: "All Categories" },
            ...CHARGE_CODE_CATEGORIES,
          ]}
          className="w-48"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(Array.isArray(value) ? value[0] : value)}
          placeholder="All Status"
          options={[
            { value: "", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          className="w-36"
        />
      </div>

      {/* Table */}
      <DataTable
        data={chargeCodes || []}
        columns={columns}
        loading={isLoading}
        error={error?.message}
        emptyMessage="No charge codes found"
        className="border-none"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingChargeCode(null);
          resetForm();
        }}
        title={editingChargeCode ? "Edit Charge Code" : "Create Charge Code"}
        size="md"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Code</label>
              <Input
                placeholder="DET"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: Array.isArray(value) ? value[0] : value })}
                placeholder="Select category"
                options={CHARGE_CODE_CATEGORIES}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Input
              placeholder="Detention charge"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Rate Type</label>
              <Select
                value={formData.rateType}
                onValueChange={(value) => setFormData({ ...formData, rateType: Array.isArray(value) ? value[0] : value })}
                options={RATE_TYPES}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Default Rate</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 text-muted-foreground -translate-y-1/2">$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.defaultRate}
                  onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">GL Account</label>
            <Input
              placeholder="4100"
              value={formData.glAccount}
              onChange={(e) => setFormData({ ...formData, glAccount: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-foreground">
              Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingChargeCode(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdate}
              disabled={!formData.code || !formData.description || createMutation.isPending || updateMutation.isPending}
              className="gap-2"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {editingChargeCode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Calculator className="size-4" weight="bold" />
                  {editingChargeCode ? "Update" : "Create"}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
