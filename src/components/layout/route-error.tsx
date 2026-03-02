"use client";

import { useEffect } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error("Route render error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <WarningCircle className="mx-auto mb-4 size-10 text-destructive" weight="duotone" />
        <h2 className="text-xl font-semibold text-foreground">This view failed to load</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Try loading the route again. If this keeps happening, check server logs for the error digest.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Digest: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
