"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Receipt,
  CurrencyDollar,
  Calculator,
  X,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChartOfAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentId?: string;
  isActive: boolean;
  balance: number;
  description?: string;
  children?: ChartOfAccount[];
}

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset", icon: Calculator, color: "text-blue-600" },
  { value: "liability", label: "Liability", icon: Calculator, color: "text-red-600" },
  { value: "equity", label: "Equity", icon: Calculator, color: "text-slate-600" },
  { value: "revenue", label: "Revenue", icon: Calculator, color: "text-apollo-cyan-600" },
  { value: "expense", label: "Expense", icon: Receipt, color: "text-orange-600" },
];

// Sample chart of accounts for trucking company
const SAMPLE_ACCOUNTS: ChartOfAccount[] = [
  // Assets
  {
    id: "1000",
    accountNumber: "1000",
    accountName: "Current Assets",
    accountType: "asset",
    isActive: true,
    balance: 0,
    description: "Current assets",
    children: [
      {
        id: "1100",
        accountNumber: "1100",
        accountName: "Cash and Cash Equivalents",
        accountType: "asset",
        parentId: "1000",
        isActive: true,
        balance: 125000,
      },
      {
        id: "1200",
        accountNumber: "1200",
        accountName: "Accounts Receivable",
        accountType: "asset",
        parentId: "1000",
        isActive: true,
        balance: 185000,
        description: "Customer receivables",
      },
      {
        id: "1300",
        accountNumber: "1300",
        accountName: "Fuel Inventory",
        accountType: "asset",
        parentId: "1000",
        isActive: true,
        balance: 15000,
      },
      {
        id: "1400",
        accountNumber: "1400",
        accountName: "Parts Inventory",
        accountType: "asset",
        parentId: "1000",
        isActive: true,
        balance: 25000,
      },
    ],
  },
  {
    id: "1500",
    accountNumber: "1500",
    accountName: "Fixed Assets",
    accountType: "asset",
    isActive: true,
    balance: 0,
    children: [
      {
        id: "1510",
        accountNumber: "1510",
        accountName: "Tractors",
        accountType: "asset",
        parentId: "1500",
        isActive: true,
        balance: 850000,
      },
      {
        id: "1520",
        accountNumber: "1520",
        accountName: "Trailers",
        accountType: "asset",
        parentId: "1500",
        isActive: true,
        balance: 350000,
      },
      {
        id: "1530",
        accountNumber: "1530",
        accountName: "Equipment",
        accountType: "asset",
        parentId: "1500",
        isActive: true,
        balance: 75000,
      },
    ],
  },

  // Liabilities
  {
    id: "2000",
    accountNumber: "2000",
    accountName: "Current Liabilities",
    accountType: "liability",
    isActive: true,
    balance: 0,
    children: [
      {
        id: "2100",
        accountNumber: "2100",
        accountName: "Accounts Payable",
        accountType: "liability",
        parentId: "2000",
        isActive: true,
        balance: 45000,
      },
      {
        id: "2200",
        accountNumber: "2200",
        accountName: "Driver Settlements Payable",
        accountType: "liability",
        parentId: "2000",
        isActive: true,
        balance: 85000,
      },
      {
        id: "2300",
        accountNumber: "2300",
        accountName: "Fuel Tax Payable",
        accountType: "liability",
        parentId: "2000",
        isActive: true,
        balance: 12000,
      },
    ],
  },

  // Revenue
  {
    id: "4000",
    accountNumber: "4000",
    accountName: "Revenue",
    accountType: "revenue",
    isActive: true,
    balance: 0,
    children: [
      {
        id: "4100",
        accountNumber: "4100",
        accountName: "Freight Revenue",
        accountType: "revenue",
        parentId: "4000",
        isActive: true,
        balance: 1250000,
      },
      {
        id: "4200",
        accountNumber: "4200",
        accountName: "Fuel Surcharge Revenue",
        accountType: "revenue",
        parentId: "4000",
        isActive: true,
        balance: 125000,
      },
      {
        id: "4300",
        accountNumber: "4300",
        accountName: "Accessorial Revenue",
        accountType: "revenue",
        parentId: "4000",
        isActive: true,
        balance: 85000,
      },
    ],
  },

  // Expenses
  {
    id: "5000",
    accountNumber: "5000",
    accountName: "Operating Expenses",
    accountType: "expense",
    isActive: true,
    balance: 0,
    children: [
      {
        id: "5100",
        accountNumber: "5100",
        accountName: "Driver Wages",
        accountType: "expense",
        parentId: "5000",
        isActive: true,
        balance: 450000,
      },
      {
        id: "5200",
        accountNumber: "5200",
        accountName: "Fuel Costs",
        accountType: "expense",
        parentId: "5000",
        isActive: true,
        balance: 285000,
      },
      {
        id: "5300",
        accountNumber: "5300",
        accountName: "Maintenance & Repairs",
        accountType: "expense",
        parentId: "5000",
        isActive: true,
        balance: 125000,
      },
      {
        id: "5400",
        accountNumber: "5400",
        accountName: "Insurance",
        accountType: "expense",
        parentId: "5000",
        isActive: true,
        balance: 95000,
      },
    ],
  },
];

interface ChartOfAccountsProps {
  className?: string;
}

export function ChartOfAccounts({ className }: ChartOfAccountsProps) {
  const [accounts, _setAccounts] = useState<ChartOfAccount[]>(SAMPLE_ACCOUNTS);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(["1000", "2000", "4000", "5000"]));
  const [_showCreateModal, setShowCreateModal] = useState(false);
  const [_editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const { toast: _toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getAccountTypeConfig = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.value === type) || ACCOUNT_TYPES[0];
  };

  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const flattenAccounts = (accounts: ChartOfAccount[], level = 0): Array<ChartOfAccount & { level: number }> => {
    const result: Array<ChartOfAccount & { level: number }> = [];

    for (const account of accounts) {
      result.push({ ...account, level });

      if (account.children && expandedAccounts.has(account.id)) {
        result.push(...flattenAccounts(account.children, level + 1));
      }
    }

    return result;
  };

  const filteredAccounts = flattenAccounts(accounts).filter(account => {
    const matchesSearch = !searchQuery ||
      account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountNumber.includes(searchQuery);

    const matchesType = !selectedType || account.accountType === selectedType;

    return matchesSearch && matchesType;
  });

  const columns: Column<ChartOfAccount & { level: number }>[] = [
    {
      key: "accountNumber",
      title: "Account",
      render: (value: string, row: ChartOfAccount & { level: number }) => {
        const typeConfig = getAccountTypeConfig(row.accountType);
        const TypeIcon = typeConfig.icon;
        const hasChildren = row.children && row.children.length > 0;
        const isExpanded = expandedAccounts.has(row.id);

        return (
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${row.level * 24}px` }}
          >
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(row.id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <Calculator className="size-4" weight="light" />
                ) : (
                  <Calculator className="size-4" weight="light" />
                )}
              </Button>
            )}
            <TypeIcon className={cn("size-4", typeConfig.color)} weight="light" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-sm">{value}</span>
                <span className="text-sm">{row.accountName}</span>
              </div>
              {row.description && (
                <p className="text-xs text-muted-foreground">{row.description}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "accountType",
      title: "Type",
      render: (value: string) => {
        const config = getAccountTypeConfig(value);
        return (
          <Badge variant="secondary" className="text-xs">
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "balance",
      title: "Balance",
      align: "right",
      render: (value: number, row: ChartOfAccount) => {
        const isDebit = row.accountType === "asset" || row.accountType === "expense";
        const displayValue = isDebit ? value : -value;
        const isNegative = displayValue < 0;

        return (
          <span className={cn(
            "font-mono font-medium",
            isNegative ? "text-red-600" : "text-apollo-cyan-600"
          )}>
            {formatCurrency(Math.abs(displayValue))}
          </span>
        );
      },
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
      align: "right",
      render: (_, row: ChartOfAccount) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingAccount(row)}
            className="h-8 w-8 p-0"
          >
            <Calculator className="size-4" weight="light" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <X className="size-4" weight="light" />
          </Button>
        </div>
      ),
    },
  ];

  // Calculate totals by account type
  const totals = ACCOUNT_TYPES.map(type => {
    const typeAccounts = flattenAccounts(accounts).filter(account => account.accountType === type.value);
    const total = typeAccounts.reduce((sum, account) => sum + account.balance, 0);
    return { ...type, total };
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your company&apos;s accounting structure and track financial data
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="size-4" weight="bold" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {totals.map((type, index) => {
          const TypeIcon = type.icon;
          return (
            <motion.div
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {type.label}
                  </p>
                  <TypeIcon className={cn("size-5", type.color)} weight="light" />
                </div>
                <p className={cn("text-lg font-mono font-bold", type.color)}>
                  {formatCurrency(Math.abs(type.total))}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={selectedType}
          onValueChange={(value) => setSelectedType(Array.isArray(value) ? value[0] : value)}
          placeholder="All Types"
          options={[
            { value: "", label: "All Types" },
            ...ACCOUNT_TYPES.map(type => ({
              value: type.value,
              label: type.label,
            })),
          ]}
          className="w-40"
        />
      </div>

      {/* Chart of Accounts Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-5 text-primary" weight="light" />
          <h2 className="text-lg font-semibold">Account Structure</h2>
        </div>

        <DataTable
          data={filteredAccounts}
          columns={columns}
          emptyMessage="No accounts found"
          emptyState={{
            title: "No chart accounts found",
            description: "Create your first account to start building the ledger.",
            action: {
              label: "Add Account",
              onClick: () => setShowCreateModal(true),
            },
          }}
          className="border-none"
        />
      </Card>

      {/* Trial Balance Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollar className="size-5 text-primary" weight="light" />
          <h2 className="text-lg font-semibold">Trial Balance Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-muted-foreground">Assets & Expenses (Debits)</h3>
            <div className="space-y-2">
              {totals.filter(t => t.value === "asset" || t.value === "expense").map(type => (
                <div key={type.value} className="flex justify-between text-sm">
                  <span>{type.label}:</span>
                  <span className="font-mono">{formatCurrency(type.total)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Debits:</span>
                <span className="font-mono">
                  {formatCurrency(
                    totals.filter(t => t.value === "asset" || t.value === "expense")
                      .reduce((sum, t) => sum + t.total, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-muted-foreground">Liabilities, Equity & Revenue (Credits)</h3>
            <div className="space-y-2">
              {totals.filter(t => t.value === "liability" || t.value === "equity" || t.value === "revenue").map(type => (
                <div key={type.value} className="flex justify-between text-sm">
                  <span>{type.label}:</span>
                  <span className="font-mono">{formatCurrency(type.total)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Credits:</span>
                <span className="font-mono">
                  {formatCurrency(
                    totals.filter(t => t.value === "liability" || t.value === "equity" || t.value === "revenue")
                      .reduce((sum, t) => sum + t.total, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Placeholder notice */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Calculator className="size-5 text-blue-600 mt-0.5" weight="light" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Chart of Accounts - Preview</h3>
            <p className="text-sm text-blue-700">
              This is a sample chart of accounts structure for a trucking company.
              In the full implementation, this would integrate with your accounting system
              and provide real-time financial data, journal entries, and detailed reporting.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
