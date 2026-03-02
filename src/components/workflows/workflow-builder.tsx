"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Lightning,
  X,
  GitBranch,
  Bell,
  Link,
  FileText,
  Copy,
  Eye,
  CursorClick,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type WorkflowNode,
  type WorkflowNodeConfig,
  type WorkflowRecord,
  getTriggerSummary,
} from "@/components/workflows/workflow-types";

interface WorkflowBuilderProps {
  workflow?: WorkflowRecord | null;
  onBack: () => void;
  onSave: (workflow: WorkflowRecord) => void;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 112;

const actionTypeLabels: Record<string, string> = {
  send_notification: "Send Notification",
  update_field: "Update Field",
  webhook: "Trigger Webhook",
  create_task: "Create Task",
};

const conditionTypeLabels: Record<string, string> = {
  load_status: "Load Status",
  driver_location: "Driver Location",
  time_condition: "Time Condition",
  customer_type: "Customer Type",
  load_value: "Load Value",
  equipment_type: "Equipment Type",
};

const createDefaultTriggerNode = (): WorkflowNode => ({
  id: `trigger-${Date.now()}-1`,
  type: "trigger",
  label: "Load Status Changed",
  config: { event: "load_status_changed", status: "at_risk" },
  position: { x: 80, y: 120 },
});

const cloneNodes = (nodes: WorkflowNode[]): WorkflowNode[] =>
  nodes.map((node) => ({
    ...node,
    config: { ...node.config },
    position: { ...node.position },
  }));

const getActionLabel = (actionType?: string) => actionTypeLabels[actionType ?? ""] ?? "Action";
const getConditionLabel = (conditionType?: string) => conditionTypeLabels[conditionType ?? ""] ?? "If Condition";

export function WorkflowBuilder({ workflow, onBack, onSave }: WorkflowBuilderProps) {
  const initialBuilderState = (() => {
    if (workflow?.nodes?.length) {
      const nextNodes = cloneNodes(workflow.nodes);
      return {
        nodes: nextNodes,
        selectedNodeId: nextNodes[0]?.id ?? null,
      };
    }

    const triggerNode = createDefaultTriggerNode();
    return {
      nodes: [triggerNode],
      selectedNodeId: triggerNode.id,
    };
  })();

  const [workflowName, setWorkflowName] = useState(() => workflow?.name ?? "");
  const [workflowDescription, setWorkflowDescription] = useState(() => workflow?.description ?? "");
  const [nodes, setNodes] = useState<WorkflowNode[]>(() => initialBuilderState.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    () => initialBuilderState.selectedNodeId,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [dragState, setDragState] = useState<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const maxX = Math.max(20, rect.width - NODE_WIDTH - 20);
      const maxY = Math.max(20, rect.height - NODE_HEIGHT - 20);

      const nextX = event.clientX - rect.left - dragState.offsetX;
      const nextY = event.clientY - rect.top - dragState.offsetY;

      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== dragState.nodeId) {
            return node;
          }

          return {
            ...node,
            position: {
              x: Math.min(Math.max(20, nextX), maxX),
              y: Math.min(Math.max(20, nextY), maxY),
            },
          };
        }),
      );
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  const triggerOptions = [
    { value: "load_created", label: "Load Created" },
    { value: "load_status_changed", label: "Load Status Changed" },
    { value: "driver_assigned", label: "Driver Assigned" },
    { value: "pod_received", label: "POD Received" },
    { value: "invoice_generated", label: "Invoice Generated" },
    { value: "certification_expiring", label: "Certification Expiring" },
    { value: "maintenance_due", label: "Maintenance Due" },
    { value: "scheduled_time", label: "Scheduled Time" },
  ];

  const conditionOptions = [
    { value: "load_status", label: "Load Status" },
    { value: "driver_location", label: "Driver Location" },
    { value: "time_condition", label: "Time Condition" },
    { value: "customer_type", label: "Customer Type" },
    { value: "load_value", label: "Load Value" },
    { value: "equipment_type", label: "Equipment Type" },
  ];

  const actionOptions = [
    { value: "send_notification", label: "Send Notification" },
    { value: "update_field", label: "Update Field" },
    { value: "webhook", label: "Trigger Webhook" },
    { value: "create_task", label: "Create Task" },
  ];

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const addNode = (type: "condition" | "action") => {
    const selectedPosition = selectedNode?.position;
    const nextIndex = nodes.length + 1;

    const baseNode: WorkflowNode = {
      id: `${type}-${Date.now()}-${nextIndex}`,
      type,
      label: type === "condition" ? "If Condition" : "Send Notification",
      config:
        type === "condition"
          ? { type: "load_status", operator: "equals", value: "at_risk" }
          : {
              type: "send_notification",
              recipients: "dispatch",
              message: "Workflow action triggered.",
            },
      position: selectedPosition
        ? {
            x: selectedPosition.x + 260,
            y: selectedPosition.y,
          }
        : {
            x: 80 + nodes.length * 50,
            y: 120 + nodes.length * 36,
          },
    };

    setNodes((prev) => [...prev, baseNode]);
    setSelectedNodeId(baseNode.id);
  };

  const removeNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
    );
  };

  const updateNodeConfig = (node: WorkflowNode, nextConfig: WorkflowNodeConfig, nextLabel?: string) => {
    updateNode(node.id, {
      config: nextConfig,
      label: nextLabel ?? node.label,
    });
  };

  const duplicateSelectedNode = () => {
    if (!selectedNode || selectedNode.type === "trigger") {
      return;
    }

    const duplicate: WorkflowNode = {
      ...selectedNode,
      id: `${selectedNode.type}-${Date.now()}-copy`,
      position: {
        x: selectedNode.position.x + 36,
        y: selectedNode.position.y + 36,
      },
      config: { ...selectedNode.config },
    };

    setNodes((prev) => [...prev, duplicate]);
    setSelectedNodeId(duplicate.id);
  };

  const getNodeIcon = (node: WorkflowNode) => {
    switch (node.type) {
      case "trigger":
        return Lightning;
      case "condition":
        return GitBranch;
      case "action":
        if (node.config.type === "send_notification") return Bell;
        if (node.config.type === "webhook") return Link;
        return FileText;
      default:
        return FileText;
    }
  };

  const orderedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
  }, [nodes]);

  const actionCount = nodes.filter((node) => node.type === "action").length;
  const canSave = workflowName.trim().length > 0 && actionCount > 0;

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    const workflowData: WorkflowRecord = {
      id: workflow?.id ?? `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: workflowName.trim(),
      description: workflowDescription.trim() || "No description provided",
      nodes: cloneNodes(nodes),
      trigger: getTriggerSummary(nodes),
      isActive: workflow?.isActive ?? true,
      runCount: workflow?.runCount ?? 0,
      lastRun: workflow?.lastRun ?? "Never",
      template: workflow?.template,
    };

    onSave(workflowData);
  };

  const handleNodeMouseDown = (event: React.MouseEvent<HTMLDivElement>, node: WorkflowNode) => {
    const target = event.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("textarea")) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    setDragState({
      nodeId: node.id,
      offsetX: event.clientX - rect.left - node.position.x,
      offsetY: event.clientY - rect.top - node.position.y,
    });
    setSelectedNodeId(node.id);
  };

  const renderNodeConfig = () => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case "trigger":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Trigger Event</label>
              <Select
                value={(selectedNode.config.event as string | undefined) ?? ""}
                onValueChange={(value) => {
                  const eventValue = value as string;
                  updateNodeConfig(
                    selectedNode,
                    {
                      ...selectedNode.config,
                      event: eventValue,
                    },
                    triggerOptions.find((option) => option.value === eventValue)?.label ?? selectedNode.label,
                  );
                }}
                options={triggerOptions}
                placeholder="Select trigger event"
              />
            </div>
            {selectedNode.config.event === "load_status_changed" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select
                  value={(selectedNode.config.status as string | undefined) ?? ""}
                  onValueChange={(value) => {
                    updateNodeConfig(selectedNode, {
                      ...selectedNode.config,
                      status: value as string,
                    });
                  }}
                  options={[
                    { value: "assigned", label: "Assigned" },
                    { value: "at_risk", label: "At Risk" },
                    { value: "late", label: "Late" },
                    { value: "delivered", label: "Delivered" },
                  ]}
                  placeholder="Select status"
                />
              </div>
            )}
          </div>
        );

      case "condition":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Condition Type</label>
              <Select
                value={(selectedNode.config.type as string | undefined) ?? ""}
                onValueChange={(value) => {
                  const conditionType = value as string;
                  updateNodeConfig(
                    selectedNode,
                    {
                      ...selectedNode.config,
                      type: conditionType,
                    },
                    getConditionLabel(conditionType),
                  );
                }}
                options={conditionOptions}
                placeholder="Select condition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Operator</label>
              <Select
                value={(selectedNode.config.operator as string | undefined) ?? ""}
                onValueChange={(value) => {
                  updateNodeConfig(selectedNode, {
                    ...selectedNode.config,
                    operator: value as string,
                  });
                }}
                options={[
                  { value: "equals", label: "Equals" },
                  { value: "not_equals", label: "Not Equals" },
                  { value: "greater_than", label: "Greater Than" },
                  { value: "less_than", label: "Less Than" },
                  { value: "contains", label: "Contains" },
                ]}
                placeholder="Select operator"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Value</label>
              <input
                type="text"
                value={(selectedNode.config.value as string | undefined) ?? ""}
                onChange={(event) => {
                  updateNodeConfig(selectedNode, {
                    ...selectedNode.config,
                    value: event.target.value,
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter value"
              />
            </div>
          </div>
        );

      case "action":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Action Type</label>
              <Select
                value={(selectedNode.config.type as string | undefined) ?? ""}
                onValueChange={(value) => {
                  const actionType = value as string;
                  updateNodeConfig(
                    selectedNode,
                    {
                      ...selectedNode.config,
                      type: actionType,
                    },
                    getActionLabel(actionType),
                  );
                }}
                options={actionOptions}
                placeholder="Select action"
              />
            </div>

            {selectedNode.config.type === "send_notification" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Recipients</label>
                  <Select
                    value={(selectedNode.config.recipients as string | undefined) ?? ""}
                    onValueChange={(value) => {
                      updateNodeConfig(selectedNode, {
                        ...selectedNode.config,
                        recipients: value as string,
                      });
                    }}
                    options={[
                      { value: "dispatch", label: "Dispatch Team" },
                      { value: "safety", label: "Safety Team" },
                      { value: "customer", label: "Customer" },
                      { value: "driver", label: "Driver" },
                    ]}
                    placeholder="Select recipients"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message Template</label>
                  <textarea
                    value={(selectedNode.config.message as string | undefined) ?? ""}
                    onChange={(event) => {
                      updateNodeConfig(selectedNode, {
                        ...selectedNode.config,
                        message: event.target.value,
                      });
                    }}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder="Enter notification message..."
                  />
                </div>
              </>
            )}

            {selectedNode.config.type === "update_field" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Field</label>
                  <input
                    type="text"
                    value={(selectedNode.config.field as string | undefined) ?? ""}
                    onChange={(event) => {
                      updateNodeConfig(selectedNode, {
                        ...selectedNode.config,
                        field: event.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="e.g. invoice_status"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Value</label>
                  <input
                    type="text"
                    value={(selectedNode.config.fieldValue as string | undefined) ?? ""}
                    onChange={(event) => {
                      updateNodeConfig(selectedNode, {
                        ...selectedNode.config,
                        fieldValue: event.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="e.g. generated"
                  />
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
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
              {workflow ? "Edit Workflow" : "Create Workflow"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Drag nodes on the canvas, add conditions, and configure actions.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPreview((prev) => !prev)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save Workflow
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl border border-border shadow-sm min-h-[600px] relative overflow-hidden"
          >
            <div className="border-b border-border p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(event) => setWorkflowName(event.target.value)}
                  className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 w-full"
                  placeholder="Workflow Name"
                />
                <input
                  type="text"
                  value={workflowDescription}
                  onChange={(event) => setWorkflowDescription(event.target.value)}
                  className="text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 w-full"
                  placeholder="Brief description of what this workflow does..."
                />
              </div>
            </div>

            <div
              ref={canvasRef}
              className="relative p-6 min-h-[500px] bg-gradient-to-br from-slate-50/50 to-transparent"
            >
              <div className="absolute inset-0 opacity-30">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>

              <div className="relative z-10">
                {nodes.map((node) => {
                  const Icon = getNodeIcon(node);
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "absolute bg-white rounded-2xl border-2 shadow-sm cursor-grab active:cursor-grabbing transition-all select-none",
                        isSelected
                          ? "border-primary shadow-md"
                          : "border-border hover:border-primary/50 hover:shadow-md",
                      )}
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                        width: `${NODE_WIDTH}px`,
                      }}
                      onMouseDown={(event) => handleNodeMouseDown(event, node)}
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                node.type === "trigger" && "bg-apollo-cyan-100 text-apollo-cyan-600",
                                node.type === "condition" && "bg-blue-100 text-blue-600",
                                node.type === "action" && "bg-sky-100 text-sky-600",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                node.type === "trigger" &&
                                  "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200",
                                node.type === "condition" &&
                                  "bg-blue-100 text-blue-700 border-blue-200",
                                node.type === "action" && "bg-sky-100 text-sky-700 border-sky-200",
                              )}
                            >
                              {node.type}
                            </Badge>
                          </div>
                          {node.type !== "trigger" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeNode(node.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="text-sm font-medium text-foreground mb-1 truncate">{node.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(node.config.event as string | undefined) ??
                            (node.config.type as string | undefined) ??
                            "Not configured"}
                        </div>
                      </div>

                      <div className="absolute -right-2 top-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm transform -translate-y-1/2" />
                    </motion.div>
                  );
                })}

                {orderedNodes.map((node, index) => {
                  if (index === orderedNodes.length - 1) return null;
                  const nextNode = orderedNodes[index + 1];

                  const startX = node.position.x + NODE_WIDTH;
                  const startY = node.position.y + NODE_HEIGHT / 2;
                  const endX = nextNode.position.x;
                  const endY = nextNode.position.y + NODE_HEIGHT / 2;
                  const markerId = `arrowhead-${node.id}`;

                  return (
                    <svg
                      key={`line-${node.id}`}
                      className="absolute inset-0 pointer-events-none"
                      style={{ zIndex: 1, overflow: "visible" }}
                    >
                      <defs>
                        <marker
                          id={markerId}
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#0096C7" />
                        </marker>
                      </defs>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#0096C7"
                        strokeWidth="2"
                        markerEnd={`url(#${markerId})`}
                        className="drop-shadow-sm"
                      />
                    </svg>
                  );
                })}
              </div>

              <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                <Button
                  onClick={() => addNode("condition")}
                  className="rounded-full w-12 h-12 p-0 bg-blue-600 hover:bg-blue-700"
                >
                  <GitBranch className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => addNode("action")}
                  className="rounded-full w-12 h-12 p-0 bg-sky-600 hover:bg-sky-700"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-xl border border-border shadow-sm"
          >
            <div className="border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedNode ? "Configure Node" : "Select a Node"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedNode
                  ? `Configure the ${selectedNode.type} settings`
                  : "Click on a node to configure its settings"}
              </p>
            </div>
            <div className="p-4">
              {selectedNode ? (
                renderNodeConfig()
              ) : (
                <div className="text-center py-8">
                  <Lightning className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No node selected</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border shadow-sm p-4"
          >
            <h4 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addNode("condition")}>
                <GitBranch className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addNode("action")}>
                <Bell className="h-4 w-4 mr-2" />
                Add Action
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={duplicateSelectedNode}
                disabled={!selectedNode || selectedNode.type === "trigger"}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Node
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CursorClick className="h-4 w-4 mt-0.5" />
                <span>Drag nodes to rearrange workflow flow and branch logic.</span>
              </div>
              {!canSave && (
                <p className="text-amber-700">
                  Add a workflow name and at least one action node to save.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Workflow Preview</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{workflowName || "Untitled Workflow"}</h4>
                  <p className="text-sm text-muted-foreground">
                    {workflowDescription || "No description provided"}
                  </p>
                </div>

                <div className="space-y-3">
                  {orderedNodes.map((node, index) => (
                    <div key={node.id} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-1">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{node.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {(node.config.event as string | undefined) ??
                            (node.config.type as string | undefined) ??
                            "Not configured"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
