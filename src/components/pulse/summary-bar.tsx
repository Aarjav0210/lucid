"use client";

import { useMemo } from "react";
import { Activity, Globe, Users, Skull, AlertTriangle } from "lucide-react";
import type { OutbreakFeatureCollection } from "@/lib/pulse-types";

interface SummaryBarProps {
  data: OutbreakFeatureCollection | null;
}

export function SummaryBar({ data }: SummaryBarProps) {
  const stats = useMemo(() => {
    if (!data || !data.features.length) {
      return {
        total: 0,
        active: 0,
        countries: 0,
        totalCases: 0,
        totalDeaths: 0,
      };
    }

    const countrySet = new Set<string>();
    let active = 0;
    let totalCases = 0;
    let totalDeaths = 0;

    for (const f of data.features) {
      const p = f.properties;
      countrySet.add(p.country_iso);
      if (p.status === "active") active++;
      if (p.case_count != null) totalCases += p.case_count;
      if (p.death_count != null) totalDeaths += p.death_count;
    }

    return {
      total: data.features.length,
      active,
      countries: countrySet.size,
      totalCases,
      totalDeaths,
    };
  }, [data]);

  return (
    <div className="border-t border-border bg-white px-4 py-2">
      <div className="flex items-center justify-center gap-6 text-xs">
        <SummaryStat
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Events"
          value={stats.total.toLocaleString()}
        />
        <Divider />
        <SummaryStat
          icon={<AlertTriangle className="w-3.5 h-3.5 text-bauhaus-red" />}
          label="Active"
          value={stats.active.toLocaleString()}
          highlight
        />
        <Divider />
        <SummaryStat
          icon={<Globe className="w-3.5 h-3.5" />}
          label="Countries"
          value={stats.countries.toLocaleString()}
        />
        <Divider />
        <SummaryStat
          icon={<Users className="w-3.5 h-3.5" />}
          label="Total Cases"
          value={stats.totalCases.toLocaleString()}
        />
        <Divider />
        <SummaryStat
          icon={<Skull className="w-3.5 h-3.5" />}
          label="Deaths"
          value={stats.totalDeaths.toLocaleString()}
        />
      </div>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <span className="text-bauhaus-black/50 font-bold uppercase tracking-wider">{label}</span>{" "}
        <span className={highlight ? "font-black text-bauhaus-red" : "font-black"}>
          {value}
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-bauhaus-black/20" />;
}
