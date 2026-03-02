"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Lightning,
  Clock,
  Receipt,
  ShieldCheck,
  Bell,
  Truck,
  Users,
  CheckCircle,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  WORKFLOW_TEMPLATE_PRESETS,
  type WorkflowTemplatePreset,
} from "@/components/workflows/workflow-types";

export interface WorkflowTemplate extends WorkflowTemplatePreset {
  icon: Icon;
}

interface WorkflowTemplatesProps {
  onBack: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const templateIcons: Record<string, Icon> = {
  "late-load-alert": Clock,
  "auto-invoice": Receipt,
  "cert-expiring-alert": ShieldCheck,
  "driver-performance": Users,
  "maintenance-reminder": Truck,
  "customer-feedback": Bell,
};

export function WorkflowTemplates({ onBack, onSelectTemplate }: WorkflowTemplatesProps) {
  const templates = useMemo<WorkflowTemplate[]>(
    () =>
      WORKFLOW_TEMPLATE_PRESETS.map((template) => ({
        ...template,
        icon: templateIcons[template.id] ?? Lightning,
      })),
    [],
  );

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Simple":
        return "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200";
      case "Moderate":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Advanced":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Workflow Templates
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose from pre-built workflow templates to get started quickly
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${template.color}`}>
                  <template.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={`text-xs ${getComplexityColor(template.complexity)}`}>
                    {template.complexity}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {template.description}
              </p>
            </div>

            <div className="px-6 pb-4">
              <div className="text-xs font-medium text-foreground mb-3 uppercase tracking-wide">
                Process Steps
              </div>
              <div className="space-y-2">
                {template.steps.slice(0, 3).map((step, stepIndex) => (
                  <div key={step} className="flex items-start gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      {stepIndex + 1}
                    </div>
                    <span className="text-muted-foreground text-xs leading-relaxed">{step}</span>
                  </div>
                ))}
                {template.steps.length > 3 && (
                  <div className="text-xs text-muted-foreground ml-6">
                    +{template.steps.length - 3} more steps
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="text-xs font-medium text-foreground mb-3 uppercase tracking-wide">
                Key Benefits
              </div>
              <div className="grid grid-cols-1 gap-2">
                {template.benefits.slice(0, 2).map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-apollo-cyan-600 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Estimated Time Savings</div>
                  <div className="text-sm font-semibold text-foreground">{template.estimatedSavings}</div>
                </div>
                <Button
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectTemplate(template);
                  }}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: templates.length * 0.05 }}
        className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-8 text-center"
      >
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lightning className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Need Something Custom?</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Can&apos;t find the perfect template? Start from scratch and build your own workflow
          with our visual builder.
        </p>
        <Button
          onClick={onBack}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-white"
        >
          Build From Scratch
        </Button>
      </motion.div>
    </div>
  );
}
