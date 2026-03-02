"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Plus,
  Truck,
  NavigationArrow,
  CheckCircle,
  Receipt,
} from "@phosphor-icons/react";

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ComponentType<object>;
  status: "completed" | "active" | "pending";
  description?: string;
  onClick?: () => void;
}

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  className?: string;
}

export function WorkflowProgress({ steps, className }: WorkflowProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-border -z-10" />

        {/* Animated progress line */}
        <motion.div
          className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-primary -z-10"
          initial={{ width: "0%" }}
          animate={{
            width: `${
              (steps.findIndex(step => step.status === "active") + 1) / steps.length * 100
            }%`
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
            mass: 0.8,
          }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.status === "completed";
          const isActive = step.status === "active";
          const isPending = step.status === "pending";

          return (
            <motion.div
              key={step.id}
              className="relative z-10 flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.1,
              }}
            >
              {/* Step circle */}
              <motion.button
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-apollo-cyan-500 bg-apollo-cyan-500 text-white",
                  isActive && "border-primary bg-primary text-white",
                  isPending && "border-border bg-background text-muted-foreground",
                  step.onClick && "cursor-pointer hover:scale-105"
                )}
                onClick={step.onClick}
                whileHover={
                  step.onClick
                    ? {
                        scale: 1.1,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        },
                      }
                    : undefined
                }
                whileTap={
                  step.onClick
                    ? {
                        scale: 0.95,
                        transition: {
                          type: "spring",
                          stiffness: 600,
                          damping: 25,
                        },
                      }
                    : undefined
                }
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" weight="fill" />
                ) : (
                  <Icon className="h-5 w-5" weight={isActive ? "fill" : "regular"} />
                )}

                {/* Active step pulse */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.button>

              {/* Step label */}
              <motion.div
                className="mt-2 text-center"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.1 + 0.2,
                }}
              >
                <div
                  className={cn(
                    "text-xs font-medium",
                    isActive && "text-primary",
                    isCompleted && "text-apollo-cyan-600",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1 max-w-20 text-center">
                    {step.description}
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function OrderWorkflowProgress({
  currentStatus,
  orderId: _orderId,
  onNavigate,
}: {
  currentStatus: string;
  orderId?: number;
  onNavigate?: (step: string) => void;
}) {
  const getStepStatus = (stepId: string): "completed" | "active" | "pending" => {
    const statusOrder = ["created", "assigned", "in_transit", "delivered", "invoiced"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const steps: WorkflowStep[] = [
    {
      id: "created",
      label: "Order Created",
      icon: Plus,
      status: getStepStatus("created"),
      description: "Initial booking",
      onClick: () => onNavigate?.("orders"),
    },
    {
      id: "assigned",
      label: "Dispatched",
      icon: Truck,
      status: getStepStatus("assigned"),
      description: "Driver assigned",
      onClick: () => onNavigate?.("dispatch"),
    },
    {
      id: "in_transit",
      label: "In Transit",
      icon: NavigationArrow,
      status: getStepStatus("in_transit"),
      description: "On the road",
      onClick: () => onNavigate?.("tracking"),
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: CheckCircle,
      status: getStepStatus("delivered"),
      description: "Delivery complete",
    },
    {
      id: "invoiced",
      label: "Invoiced",
      icon: Receipt,
      status: getStepStatus("invoiced"),
      description: "Billing complete",
      onClick: () => onNavigate?.("billing"),
    },
  ];

  return <WorkflowProgress steps={steps} className="bg-card p-4 rounded-xl border shadow-sm" />;
}