"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Lightbulb, Loader2, Inbox } from "lucide-react";
import { getAIInsights, type AIInsightRow } from "@/app/actions/ai-insights";

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsightRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIInsights().then((data) => {
      setInsights(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  function getIcon(type: string) {
    if (type === "restock" || type === "prediction") return <TrendingUp className="w-5 h-5" />;
    if (type === "anomaly" || type === "performance") return <Lightbulb className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  }

  function getColors(type: string) {
    if (type === "restock" || type === "prediction") return { bg: "from-green-50 to-white", border: "border-green-100/50", title: "text-[#005914]" };
    if (type === "anomaly" || type === "performance") return { bg: "from-blue-50 to-white", border: "border-blue-100/50", title: "text-blue-800" };
    return { bg: "from-purple-50 to-white", border: "border-purple-100/50", title: "text-purple-800" };
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#005914]" />
            AI Insights & Forecasting
          </h1>
          <p className="text-gray-500 text-sm">Leverage AI to predict restock needs and analyze performance.</p>
        </div>
      </div>

      {insights.length === 0 ? (
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Inbox className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No AI insights available yet</p>
              <p className="text-xs mt-1">Insights will appear as the system analyzes your data.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight) => {
            const colors = getColors(insight.insight_type);
            return (
              <Card key={insight.id} className={`shadow-sm border-0 rounded-xl bg-gradient-to-br ${colors.bg}`}>
                <CardHeader className={`py-4 border-b ${colors.border} flex flex-row items-center justify-between`}>
                  <CardTitle className={`text-lg font-semibold ${colors.title} flex items-center gap-2`}>
                    {getIcon(insight.insight_type)}
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 leading-relaxed">{insight.description}</p>
                  <span className="text-xs text-gray-400 mt-3 block">
                    {new Date(insight.created_at).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
