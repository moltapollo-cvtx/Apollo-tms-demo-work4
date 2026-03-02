"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Warning as WarningTriangle,
  FileText,
  Calendar,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SimpleTabs as Tabs } from "@/components/ui/tabs";
import { ExpirationCalendar } from "@/components/safety/expiration-calendar";
import { CertificationTrackingTable } from "@/components/safety/certification-tracking-table";
import { FmcsaBasicsChart } from "@/components/safety/fmcsa-basics-chart";
import { DrugTestTracking } from "@/components/safety/drug-test-tracking";
import { DriverSafetyScorecard } from "@/components/safety/driver-safety-scorecard";
import { AccidentReportWizard, type AccidentReportData } from "@/components/safety/accident-report-wizard";
import { useToast } from "@/hooks/use-toast";

export default function SafetyPage() {
  const [isAccidentReportOpen, setIsAccidentReportOpen] = useState(false);
  const { toast } = useToast();

  const handleAccidentReportSubmit = (_data: AccidentReportData) => {
    toast({
      title: "Accident Report Submitted",
      description: "Safety workflow has been initiated and compliance review is now in queue.",
    });
  };

  const tabs = [
    {
      value: "compliance",
      label: "Compliance Dashboard",
      content: (
        <div className="space-y-6">
          {/* Compliance overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Compliance Score", value: "96.4%", icon: ShieldCheck },
              { label: "Expiring (30 days)", value: "7", icon: Calendar },
              { label: "Open Violations", value: "2", icon: WarningTriangle },
              { label: "Clean Inspections", value: "89%", icon: FileText },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 26, delay: index * 0.08 }}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <stat.icon className="h-4 w-4 text-muted-foreground" weight="duotone" />
                </div>
                <p className="mt-2 font-mono text-xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Expiration Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.16 }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <ExpirationCalendar />
          </motion.div>

          {/* FMCSA BASICs Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.22 }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <FmcsaBasicsChart />
          </motion.div>
        </div>
      ),
    },
    {
      value: "certifications",
      label: "Certifications",
      content: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <CertificationTrackingTable />
        </motion.div>
      ),
    },
    {
      value: "drug-testing",
      label: "Drug Testing",
      content: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <DrugTestTracking />
        </motion.div>
      ),
    },
    {
      value: "safety-scorecard",
      label: "Driver Safety",
      content: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <DriverSafetyScorecard />
        </motion.div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Safety & Compliance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compliance dashboard, driver safety scores, inspections, certifications, and accident management.
          </p>
        </div>

        <Button
          onClick={() => setIsAccidentReportOpen(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Warning className="h-4 w-4 mr-2" weight="duotone" />
          Report Accident
        </Button>
      </div>

      <Tabs tabs={tabs} defaultValue="compliance" />

      {/* Accident Report Wizard */}
      <AccidentReportWizard
        isOpen={isAccidentReportOpen}
        onClose={() => setIsAccidentReportOpen(false)}
        onSubmit={handleAccidentReportSubmit}
      />
    </div>
  );
}
