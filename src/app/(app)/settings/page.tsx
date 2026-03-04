"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <p className="text-sm text-gray-500">Configure your preferences</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Settings options coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
