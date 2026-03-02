export type WorkflowNodeType = "trigger" | "condition" | "action";

export interface WorkflowNodeConfig {
  event?: string;
  status?: string;
  type?: string;
  operator?: string;
  value?: string;
  recipients?: string;
  message?: string;
  field?: string;
  fieldValue?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: WorkflowNodeConfig;
  position: { x: number; y: number };
}

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string;
  trigger: string;
  isActive: boolean;
  lastRun?: string;
  runCount: number;
  template?: string;
  nodes: WorkflowNode[];
}

export interface WorkflowTemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  steps: string[];
  benefits: string[];
  estimatedSavings: string;
  complexity: "Simple" | "Moderate" | "Advanced";
  trigger: string;
  nodes: WorkflowNode[];
}

const nodeId = (prefix: WorkflowNodeType, suffix: string) => `${prefix}-${suffix}`;

const baseTemplateNodes = {
  lateLoadAlert: [
    {
      id: nodeId("trigger", "late-1"),
      type: "trigger" as const,
      label: "Load Status Changed",
      config: { event: "load_status_changed", status: "at_risk" },
      position: { x: 80, y: 120 },
    },
    {
      id: nodeId("condition", "late-1"),
      type: "condition" as const,
      label: "Load Status Is At Risk",
      config: { type: "load_status", operator: "equals", value: "at_risk" },
      position: { x: 340, y: 120 },
    },
    {
      id: nodeId("action", "late-1"),
      type: "action" as const,
      label: "Notify Dispatch",
      config: {
        type: "send_notification",
        recipients: "dispatch",
        message: "Load {{orderNumber}} is at risk. Review ETA and update customer.",
      },
      position: { x: 600, y: 120 },
    },
    {
      id: nodeId("action", "late-2"),
      type: "action" as const,
      label: "Create Follow-Up Task",
      config: {
        type: "create_task",
        taskTitle: "Review at-risk load ETA",
        assigneeRole: "dispatcher",
        dueInHours: "1",
        priority: "high",
      },
      position: { x: 860, y: 120 },
    },
  ],
  autoInvoice: [
    {
      id: nodeId("trigger", "invoice-1"),
      type: "trigger" as const,
      label: "POD Received",
      config: { event: "pod_received" },
      position: { x: 80, y: 120 },
    },
    {
      id: nodeId("condition", "invoice-1"),
      type: "condition" as const,
      label: "Load Delivered",
      config: { type: "load_status", operator: "equals", value: "delivered" },
      position: { x: 340, y: 120 },
    },
    {
      id: nodeId("action", "invoice-1"),
      type: "action" as const,
      label: "Generate Invoice",
      config: {
        type: "update_field",
        field: "invoice_status",
        fieldValue: "generated",
      },
      position: { x: 600, y: 120 },
    },
    {
      id: nodeId("action", "invoice-2"),
      type: "action" as const,
      label: "Notify Customer",
      config: {
        type: "send_notification",
        recipients: "customer",
        message: "Invoice for load {{orderNumber}} is ready.",
      },
      position: { x: 860, y: 120 },
    },
  ],
  certExpiring: [
    {
      id: nodeId("trigger", "cert-1"),
      type: "trigger" as const,
      label: "Certification Expiring",
      config: { event: "certification_expiring" },
      position: { x: 80, y: 120 },
    },
    {
      id: nodeId("condition", "cert-1"),
      type: "condition" as const,
      label: "Days Until Expiry",
      config: { type: "time_condition", operator: "less_than", value: "30" },
      position: { x: 340, y: 120 },
    },
    {
      id: nodeId("action", "cert-1"),
      type: "action" as const,
      label: "Notify Safety",
      config: {
        type: "send_notification",
        recipients: "safety",
        message: "Driver certification expires in less than 30 days.",
      },
      position: { x: 600, y: 120 },
    },
    {
      id: nodeId("action", "cert-2"),
      type: "action" as const,
      label: "Notify Driver",
      config: {
        type: "send_notification",
        recipients: "driver",
        message: "Your certification is expiring soon. Upload renewal documents.",
      },
      position: { x: 860, y: 120 },
    },
  ],
  performanceReview: [
    {
      id: nodeId("trigger", "perf-1"),
      type: "trigger" as const,
      label: "Scheduled Time",
      config: { event: "scheduled_time" },
      position: { x: 80, y: 120 },
    },
    {
      id: nodeId("condition", "perf-1"),
      type: "condition" as const,
      label: "Monthly Review Window",
      config: { type: "time_condition", operator: "equals", value: "monthly" },
      position: { x: 340, y: 120 },
    },
    {
      id: nodeId("action", "perf-1"),
      type: "action" as const,
      label: "Create Review Task",
      config: {
        type: "create_task",
        taskTitle: "Monthly driver performance review",
        assigneeRole: "driver_manager",
        dueInHours: "24",
        priority: "medium",
      },
      position: { x: 600, y: 120 },
    },
    {
      id: nodeId("action", "perf-2"),
      type: "action" as const,
      label: "Notify Driver Manager",
      config: {
        type: "send_notification",
        recipients: "dispatch",
        message: "Driver performance packet is ready for review.",
      },
      position: { x: 860, y: 120 },
    },
  ],
  maintenanceReminder: [
    {
      id: nodeId("trigger", "maint-1"),
      type: "trigger" as const,
      label: "Maintenance Due",
      config: { event: "maintenance_due" },
      position: { x: 80, y: 120 },
    },
    {
      id: nodeId("condition", "maint-1"),
      type: "condition" as const,
      label: "Equipment Type Check",
      config: { type: "equipment_type", operator: "equals", value: "tractor" },
      position: { x: 340, y: 120 },
    },
    {
      id: nodeId("action", "maint-1"),
      type: "action" as const,
      label: "Create Maintenance Task",
      config: {
        type: "create_task",
        taskTitle: "Schedule PM service",
        assigneeRole: "fleet_manager",
        dueInHours: "6",
        priority: "high",
      },
      position: { x: 600, y: 120 },
    },
    {
      id: nodeId("action", "maint-2"),
      type: "action" as const,
      label: "Notify Fleet Manager",
      config: {
        type: "send_notification",
        recipients: "dispatch",
        message: "Unit {{equipmentId}} is due for maintenance.",
      },
      position: { x: 860, y: 120 },
    },
  ],
  customerFeedback: [
    {
      id: nodeId("trigger", "feedback-1"),
      type: "trigger" as const,
      label: "Load Delivered",
      config: { event: "load_status_changed", status: "delivered" },
      position: { x: 80, y: 120 },
    },
    {
      id: nodeId("condition", "feedback-1"),
      type: "condition" as const,
      label: "Customer Type",
      config: { type: "customer_type", operator: "not_equals", value: "internal" },
      position: { x: 340, y: 120 },
    },
    {
      id: nodeId("action", "feedback-1"),
      type: "action" as const,
      label: "Send Feedback Request",
      config: {
        type: "send_notification",
        recipients: "customer",
        message: "Share your delivery feedback for load {{orderNumber}}.",
      },
      position: { x: 600, y: 120 },
    },
    {
      id: nodeId("action", "feedback-2"),
      type: "action" as const,
      label: "Trigger Webhook",
      config: {
        type: "webhook",
        endpoint: "https://api.customer-feedback.local/events/delivery-feedback",
        method: "POST",
        retryPolicy: "3x_exponential",
      },
      position: { x: 860, y: 120 },
    },
  ],
};

export const WORKFLOW_TEMPLATE_PRESETS: WorkflowTemplatePreset[] = [
  {
    id: "late-load-alert",
    name: "Late Load Alert",
    description: "Automatically notify dispatch and customers when loads are running behind schedule",
    category: "Operations",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    steps: [
      "Monitor load status in real-time",
      "Check if load is at risk based on GPS and schedule",
      "Send alert to dispatch team",
      "Optionally notify customer with ETA update",
      "Create follow-up task for dispatcher",
    ],
    benefits: [
      "Proactive customer communication",
      "Reduced customer complaints",
      "Better visibility into problems",
      "Automated escalation process",
    ],
    estimatedSavings: "2-3 hours/week",
    complexity: "Simple",
    trigger: "Load Status: At Risk",
    nodes: baseTemplateNodes.lateLoadAlert,
  },
  {
    id: "auto-invoice",
    name: "Auto-Invoice on Delivery",
    description: "Generate and send invoices automatically when proof of delivery is received",
    category: "Billing",
    color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200",
    steps: [
      "Detect POD document upload or signature capture",
      "Validate load completion status",
      "Calculate charges and apply accessorials",
      "Generate invoice PDF",
      "Send invoice to customer via email",
      "Update accounting records",
    ],
    benefits: [
      "Faster payment cycles",
      "Reduced manual billing work",
      "Consistent invoice formatting",
      "Immediate invoice delivery",
    ],
    estimatedSavings: "5-8 hours/week",
    complexity: "Moderate",
    trigger: "Document: POD Received",
    nodes: baseTemplateNodes.autoInvoice,
  },
  {
    id: "cert-expiring-alert",
    name: "Cert Expiring Alert",
    description: "Monitor driver certifications and send renewal reminders before expiration",
    category: "Safety & Compliance",
    color: "bg-red-100 text-red-700 border-red-200",
    steps: [
      "Check certification expiration dates daily",
      "Send initial reminder at 60 days",
      "Send urgent alert at 30 days",
      "Notify safety manager at 15 days",
      "Flag driver as non-compliant if expired",
      "Generate compliance report",
    ],
    benefits: [
      "Maintain DOT compliance",
      "Prevent service disruptions",
      "Reduce safety violations",
      "Automate renewal tracking",
    ],
    estimatedSavings: "3-4 hours/week",
    complexity: "Simple",
    trigger: "Certification: 30 Days to Expiry",
    nodes: baseTemplateNodes.certExpiring,
  },
  {
    id: "driver-performance",
    name: "Driver Performance Review",
    description: "Automatically generate monthly performance reports and schedule reviews",
    category: "HR & Management",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    steps: [
      "Collect performance metrics monthly",
      "Calculate safety scores and on-time rates",
      "Generate performance report",
      "Schedule review meeting if scores are low",
      "Send report to driver manager",
      "Track improvement goals",
    ],
    benefits: [
      "Data-driven performance reviews",
      "Consistent evaluation process",
      "Early problem identification",
      "Automated documentation",
    ],
    estimatedSavings: "4-6 hours/month",
    complexity: "Advanced",
    trigger: "Schedule: Monthly",
    nodes: baseTemplateNodes.performanceReview,
  },
  {
    id: "maintenance-reminder",
    name: "Maintenance Reminder",
    description: "Schedule and track vehicle maintenance based on mileage and time intervals",
    category: "Equipment",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    steps: [
      "Monitor truck mileage and engine hours",
      "Check against maintenance schedules",
      "Send reminder to fleet manager",
      "Create work order when due",
      "Schedule maintenance appointment",
      "Track completion status",
    ],
    benefits: [
      "Prevent breakdowns",
      "Extend equipment life",
      "Ensure warranty compliance",
      "Reduce maintenance costs",
    ],
    estimatedSavings: "1-2 hours/week",
    complexity: "Moderate",
    trigger: "Maintenance: Due",
    nodes: baseTemplateNodes.maintenanceReminder,
  },
  {
    id: "customer-feedback",
    name: "Customer Feedback Collection",
    description: "Automatically request feedback from customers after load delivery",
    category: "Customer Service",
    color: "bg-apollo-cyan-100 text-apollo-cyan-700 border-apollo-cyan-200",
    steps: [
      "Wait 24 hours after delivery confirmation",
      "Send feedback request email to customer",
      "Collect rating and comments",
      "Alert account manager for low ratings",
      "Generate customer satisfaction reports",
      "Track improvement trends",
    ],
    benefits: [
      "Improve customer satisfaction",
      "Identify service issues early",
      "Build stronger relationships",
      "Competitive differentiation",
    ],
    estimatedSavings: "2-3 hours/week",
    complexity: "Simple",
    trigger: "Load Status: Delivered",
    nodes: baseTemplateNodes.customerFeedback,
  },
];

const cloneNodeForWorkflow = (workflowId: string, node: WorkflowNode, index: number): WorkflowNode => ({
  ...node,
  id: `${workflowId}-${node.type}-${index + 1}`,
  config: { ...node.config },
  position: { ...node.position },
});

export const createWorkflowFromTemplate = (
  template: WorkflowTemplatePreset,
  overrides?: Partial<Omit<WorkflowRecord, "nodes" | "template">>,
): WorkflowRecord => {
  const workflowId = overrides?.id ?? `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: workflowId,
    name: overrides?.name ?? template.name,
    description: overrides?.description ?? template.description,
    trigger: overrides?.trigger ?? template.trigger,
    isActive: overrides?.isActive ?? true,
    lastRun: overrides?.lastRun ?? "Never",
    runCount: overrides?.runCount ?? 0,
    template: template.id,
    nodes: template.nodes.map((node, index) => cloneNodeForWorkflow(workflowId, node, index)),
  };
};

const templateById = (id: string) => WORKFLOW_TEMPLATE_PRESETS.find((template) => template.id === id);

export const INITIAL_WORKFLOWS: WorkflowRecord[] = [
  createWorkflowFromTemplate(templateById("late-load-alert")!, {
    id: "wf-1",
    isActive: true,
    lastRun: "2 hours ago",
    runCount: 23,
  }),
  createWorkflowFromTemplate(templateById("auto-invoice")!, {
    id: "wf-2",
    isActive: true,
    lastRun: "45 minutes ago",
    runCount: 156,
  }),
  createWorkflowFromTemplate(templateById("cert-expiring-alert")!, {
    id: "wf-3",
    isActive: true,
    lastRun: "1 day ago",
    runCount: 8,
  }),
  {
    id: "wf-4",
    name: "Customer Follow-up",
    description: "Send follow-up messages to customers 24hrs after delivery",
    trigger: "Load Status: Delivered",
    isActive: false,
    lastRun: "Never",
    runCount: 0,
    nodes: [
      {
        id: "wf-4-trigger-1",
        type: "trigger",
        label: "Load Status Changed",
        config: { event: "load_status_changed", status: "delivered" },
        position: { x: 80, y: 120 },
      },
      {
        id: "wf-4-action-1",
        type: "action",
        label: "Send Notification",
        config: {
          type: "send_notification",
          recipients: "customer",
          message: "Thanks for shipping with Apollo. Share your experience.",
        },
        position: { x: 340, y: 120 },
      },
    ],
  },
];

const triggerLabels: Record<string, string> = {
  load_created: "Load Created",
  load_status_changed: "Load Status Changed",
  driver_assigned: "Driver Assigned",
  pod_received: "POD Received",
  invoice_generated: "Invoice Generated",
  certification_expiring: "Certification Expiring",
  maintenance_due: "Maintenance Due",
  scheduled_time: "Scheduled Time",
};

export const getTriggerSummary = (nodes: WorkflowNode[]): string => {
  const triggerNode = nodes.find((node) => node.type === "trigger");
  if (!triggerNode) {
    return "Manual Trigger";
  }

  const event = triggerNode.config.event as string | undefined;
  const status = triggerNode.config.status as string | undefined;

  if (!event) {
    return triggerNode.label;
  }

  const eventLabel = triggerLabels[event] ?? event;

  if (event === "load_status_changed" && status) {
    return `Load Status: ${status.replace(/_/g, " ")}`;
  }

  return eventLabel;
};
