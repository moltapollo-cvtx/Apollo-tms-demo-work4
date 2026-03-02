"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Lightning,
  Plus,
  Play,
  Pause,
  Copy,
  Trash,
  Eye,
  Gear,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowBuilder } from "@/components/workflows/workflow-builder";
import { WorkflowTemplates, type WorkflowTemplate } from "@/components/workflows/workflow-templates";
import {
  WORKFLOW_TEMPLATE_PRESETS,
  INITIAL_WORKFLOWS,
  createWorkflowFromTemplate,
  type WorkflowRecord,
} from "@/components/workflows/workflow-types";
import { cn } from "@/lib/utils";

type WorkflowView = "list" | "builder" | "templates";
type WorkflowFilter = "all" | "active" | "inactive";

export default function WorkflowsPage() {
  const [view, setView] = useState<WorkflowView>("list");
  const [statusFilter, setStatusFilter] = useState<WorkflowFilter>("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRecord | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>(INITIAL_WORKFLOWS);

  const workflowStats = useMemo(
    () => ({
      activeCount: workflows.filter((workflow) => workflow.isActive).length,
      totalRuns: workflows.reduce((sum, workflow) => sum + workflow.runCount, 0),
      templateCount: WORKFLOW_TEMPLATE_PRESETS.length,
    }),
    [workflows],
  );

  const visibleWorkflows = useMemo(() => {
    if (statusFilter === "active") {
      return workflows.filter((workflow) => workflow.isActive);
    }

    if (statusFilter === "inactive") {
      return workflows.filter((workflow) => !workflow.isActive);
    }

    return workflows;
  }, [statusFilter, workflows]);

  const createNewWorkflow = () => {
    setSelectedWorkflow(null);
    setView("builder");
  };

  const editWorkflow = (workflow: WorkflowRecord) => {
    setSelectedWorkflow(workflow);
    setView("builder");
  };

  const useTemplate = () => {
    setView("templates");
  };

  const backToList = () => {
    setView("list");
    setSelectedWorkflow(null);
  };

  const saveWorkflow = (workflow: WorkflowRecord) => {
    setWorkflows((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.id === workflow.id);

      if (existingIndex === -1) {
        return [workflow, ...prev];
      }

      return prev.map((entry) => (entry.id === workflow.id ? workflow : entry));
    });

    backToList();
  };

  const duplicateWorkflow = (workflow: WorkflowRecord) => {
    const duplicate: WorkflowRecord = {
      ...workflow,
      id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${workflow.name} Copy`,
      runCount: 0,
      lastRun: "Never",
      isActive: false,
      nodes: workflow.nodes.map((node, index) => ({
        ...node,
        id: `node-${Date.now()}-${index}`,
        config: { ...node.config },
        position: { ...node.position },
      })),
    };

    setWorkflows((prev) => [duplicate, ...prev]);
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((workflow) =>
        workflow.id === workflowId
          ? {
              ...workflow,
              isActive: !workflow.isActive,
            }
          : workflow,
      ),
    );
  };

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows((prev) => prev.filter((workflow) => workflow.id !== workflowId));
  };

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    const workflowFromTemplate = createWorkflowFromTemplate(template, {
      name: `${template.name} (Draft)`,
      isActive: true,
      runCount: 0,
      lastRun: "Never",
    });

    setSelectedWorkflow(workflowFromTemplate);
    setView("builder");
  };

  if (view === "builder") {
    return (
      <WorkflowBuilder
        key={selectedWorkflow?.id ?? "new-workflow"}
        workflow={selectedWorkflow}
        onBack={backToList}
        onSave={saveWorkflow}
      />
    );
  }

  if (view === "templates") {
    return <WorkflowTemplates onBack={backToList} onSelectTemplate={handleTemplateSelect} />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Workflow Automation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automate repetitive tasks and streamline your operations with custom workflows.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={useTemplate} className="inline-flex items-center gap-2">
            <Lightning className="h-4 w-4" />
            Use Template
          </Button>
          <Button onClick={createNewWorkflow} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.08 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Lightning className="h-4 w-4 text-apollo-cyan-600" />
            <span className="text-sm text-muted-foreground">Active Workflows</span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">{workflowStats.activeCount}</div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Total Runs</span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">{workflowStats.totalRuns}</div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Gear className="h-4 w-4 text-sky-600" />
            <span className="text-sm text-muted-foreground">Templates</span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">{workflowStats.templateCount}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.14 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Lightning className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Your Workflows</h2>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "All", value: "all" as const },
              { label: "Active", value: "active" as const },
              { label: "Inactive", value: "inactive" as const },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "primary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {visibleWorkflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.2 + index * 0.04 }}
              className="p-6 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{workflow.name}</h3>
                    <Badge
                      className={cn(
                        "text-xs font-mono",
                        workflow.isActive
                          ? "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200"
                          : "bg-slate-100 text-slate-700 border-slate-200",
                      )}
                    >
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {workflow.template && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Template</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Trigger:</span> {workflow.trigger}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Runs:</span>{" "}
                      <span className="font-mono">{workflow.runCount}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Last Run:</span> {workflow.lastRun || "Never"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-6">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editWorkflow(workflow)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editWorkflow(workflow)} className="h-8 w-8 p-0">
                    <Gear className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => duplicateWorkflow(workflow)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleWorkflow(workflow.id)}
                  >
                    {workflow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteWorkflow(workflow.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          {visibleWorkflows.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No workflows match the selected filter.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
