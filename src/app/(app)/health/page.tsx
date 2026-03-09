"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { Server, Database, Clock, RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/state/error-state";

export default function HealthPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  usePageLoadReporter(loading);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [simple, setSimple] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [s, d] = await Promise.all([
        apiClient.simpleHealthCheck(),
        apiClient.databaseHealthCheck(),
      ]);
      if (s.success) setSimple(s.data);
      if (d.success) setDb(d.data);
      setLastChecked(new Date());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch health status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchHealth();
    const id = setInterval(fetchHealth, 30000);
    return () => clearInterval(id);
  }, [isAdmin, fetchHealth]);

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Admin only.</p>
      </div>
    );
  }

  if (fetchError && !simple && !db) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">System Health</h1>
        <ErrorState entity="health status" onRetry={fetchHealth} />
      </div>
    );
  }

  if (loading && !simple && !db) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">System Health</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 w-4 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Health</h1>
        <div className="flex items-center gap-4">
          {lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {Math.round((Date.now() - lastChecked.getTime()) / 1000)}s ago
            </span>
          )}
          <Button variant="outline" onClick={fetchHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Application</CardTitle>
            <Server className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">Online</p>
            <p className="text-xs text-gray-500 mt-1">
              {simple?.environment ?? "—"} · {simple?.version ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Database</CardTitle>
            <Database className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">Connected</p>
            <p className="text-xs text-gray-500 mt-1">
              {db?.database?.responseTime ?? "—"}ms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {simple?.uptime ? `${Math.floor(simple.uptime / 3600)}h` : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Since startup</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
