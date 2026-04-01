"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2, Save } from "lucide-react";
import { getSettings, updateSetting, type SettingRow } from "@/app/actions/settings";

const DEFAULT_KEYS = [
  { key: "company_name", label: "Company Name", placeholder: "e.g. Century Pacific Food Inc." },
  { key: "low_stock_threshold", label: "Low Stock Threshold", placeholder: "e.g. 10" },
  { key: "currency", label: "Currency", placeholder: "e.g. PHP" },
  { key: "timezone", label: "Timezone", placeholder: "e.g. Asia/Manila" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((data) => {
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value ?? ""; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  async function handleSave(key: string) {
    setSaving(key);
    await updateSetting(key, settings[key] || "");
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#005914]" />
          System Settings
        </h1>
        <p className="text-gray-500 text-sm">Configure global system preferences.</p>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {DEFAULT_KEYS.map((item) => (
            <div key={item.key} className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor={item.key}>{item.label}</Label>
                <Input
                  id={item.key}
                  value={settings[item.key] || ""}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  placeholder={item.placeholder}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4"
                onClick={() => handleSave(item.key)}
                disabled={saving === item.key}
              >
                {saving === item.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
