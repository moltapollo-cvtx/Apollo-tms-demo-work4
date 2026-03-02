"use client";

import React from "react";
import { motion } from "framer-motion";
import { Warning, ArrowClockwise, Bug } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    retry: () => void;
    reset: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // If true, only catches errors in this boundary
  level?: "page" | "component" | "section"; // Different styling based on context
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In development, also log to help with debugging
    if (process.env.NODE_ENV === "development") {
      console.group("Error Boundary");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Add a small delay to prevent rapid retries
    this.retryTimeoutId = setTimeout(() => {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }, 100);
  };

  handleReset = () => {
    // Reload the page for page-level errors
    if (this.props.level === "page") {
      window.location.reload();
    } else {
      this.handleRetry();
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, level = "component" } = this.props;

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            retry={this.handleRetry}
            reset={this.handleReset}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          level={level}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  level: "page" | "component" | "section";
  onRetry: () => void;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo: _errorInfo,
  level,
  onRetry,
  onReset,
}: DefaultErrorFallbackProps) {
  const isPageLevel = level === "page";
  const isDev = process.env.NODE_ENV === "development";

  const containerClasses = {
    page: "min-h-[50vh] p-8",
    section: "min-h-[200px] p-6",
    component: "min-h-[100px] p-4",
  };

  const iconClasses = {
    page: "h-16 w-16",
    section: "h-12 w-12",
    component: "h-8 w-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      }}
      className={cn(
        "flex flex-col items-center justify-center text-center space-y-4",
        "border border-destructive/20 rounded-xl bg-destructive/5",
        containerClasses[level]
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          delay: 0.1,
        }}
        className={cn(
          "flex items-center justify-center text-destructive/80",
          iconClasses[level]
        )}
      >
        {isPageLevel ? <Bug className="h-full w-full" /> : <Warning className="h-full w-full" />}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-2"
      >
        <h3 className={cn(
          "font-semibold text-foreground",
          isPageLevel ? "text-xl" : level === "section" ? "text-lg" : "text-base"
        )}>
          {isPageLevel ? "Something went wrong" : "Component error"}
        </h3>
        <p className={cn(
          "text-muted-foreground max-w-md",
          isPageLevel ? "text-base" : "text-sm"
        )}>
          {isPageLevel
            ? "We encountered an unexpected error. Please try refreshing the page."
            : "This component encountered an error. You can try loading it again."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.3,
        }}
        className="flex items-center gap-3"
      >
        <Button onClick={onRetry} variant="outline" size={isPageLevel ? "md" : "sm"}>
          <ArrowClockwise className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        {isPageLevel && (
          <Button onClick={onReset} variant="primary" size="md">
            Refresh Page
          </Button>
        )}
      </motion.div>

      {/* Development info */}
      {isDev && error && (
        <motion.details
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-6 w-full max-w-2xl"
        >
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground mb-2">
            Debug Info (Development Only)
          </summary>
          <div className="text-left text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-40 border">
            <div className="text-destructive font-semibold mb-2">{error.name}: {error.message}</div>
            {error.stack && (
              <div className="text-muted-foreground whitespace-pre-wrap">
                {error.stack}
              </div>
            )}
          </div>
        </motion.details>
      )}
    </motion.div>
  );
}

// Main exported component
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

// Convenience components for different contexts
export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return <ErrorBoundary level="page" {...props}>{children}</ErrorBoundary>;
}

export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return <ErrorBoundary level="component" {...props}>{children}</ErrorBoundary>;
}

export function SectionErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return <ErrorBoundary level="section" {...props}>{children}</ErrorBoundary>;
}

// Hook for throwing errors in functional components (useful for testing)
export function useErrorHandler() {
  return React.useCallback((error: Error | string) => {
    if (typeof error === "string") {
      throw new Error(error);
    }
    throw error;
  }, []);
}