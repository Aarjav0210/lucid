"use client";

import { useEffect, useState } from "react";
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  type OutbreakDetail,
  type OutbreakFeatureProperties,
  STATUS_COLORS,
  SOURCE_LABELS,
} from "@/lib/pulse-types";

interface DetailSidebarProps {
  selectedEvents: OutbreakFeatureProperties[];
  onClose: () => void;
}

export function DetailSidebar({ selectedEvents, onClose }: DetailSidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEvents.length === 1) {
      setExpandedId(selectedEvents[0].id);
    } else {
      setExpandedId(null);
    }
  }, [selectedEvents]);

  if (selectedEvents.length === 0) return null;

  return (
    <div className="w-[360px] shrink-0 border-l border-border bg-white flex flex-col min-h-0 animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-bold uppercase tracking-wider leading-tight">
            {selectedEvents.length === 1
              ? "1 outbreak at this location"
              : `${selectedEvents.length} outbreaks at this location`}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-bauhaus-muted/50 transition-colors shrink-0 ml-2"
          aria-label="Close detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {selectedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            expanded={expandedId === event.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === event.id ? null : event.id))
            }
          />
        ))}
      </div>
    </div>
  );
}

function EventCard({
  event,
  expanded,
  onToggle,
}: {
  event: OutbreakFeatureProperties;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [detail, setDetail] = useState<OutbreakDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const statusStyle = STATUS_COLORS[event.status] ?? STATUS_COLORS.resolved;

  useEffect(() => {
    if (!expanded || detail?.id === event.id) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/outbreaks/${event.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, event.id, detail?.id]);

  const cfr =
    event.case_count && event.death_count
      ? ((event.death_count / event.case_count) * 100).toFixed(1)
      : null;

  const statusDot: Record<string, string> = {
    active: "bg-bauhaus-red",
    monitoring: "bg-bauhaus-yellow",
    contained: "bg-bauhaus-blue",
    resolved: "bg-zinc-400",
  };

  const statusBadgeCn: Record<string, string> = {
    active: "bg-bauhaus-red/10 text-bauhaus-red border-bauhaus-red/30",
    monitoring: "bg-bauhaus-yellow/10 text-bauhaus-yellow border-bauhaus-yellow/30",
    contained: "bg-bauhaus-blue/10 text-bauhaus-blue border-bauhaus-blue/30",
    resolved: "bg-zinc-100 text-zinc-500 border-zinc-300",
  };

  return (
    <div className={cn("border-b-2 border-bauhaus-black/10", expanded && "bg-bauhaus-muted/20")}>
      {/* Clickable header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bauhaus-muted/30 transition-colors"
      >
        <span
          className={cn("w-2 h-2 rounded-full shrink-0", statusDot[event.status] ?? "bg-zinc-400")}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold truncate">{event.disease_name}</p>
          <p className="text-[10px] text-bauhaus-black/40 truncate">
            {event.case_count?.toLocaleString() ?? "—"} cases
            {event.pathogen_name ? ` · ${event.pathogen_name}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border shrink-0",
            statusBadgeCn[event.status] ?? statusBadgeCn.resolved,
          )}
        >
          {event.status}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-bauhaus-black/30 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-bauhaus-black/30 shrink-0" />
        )}
      </button>

      {/* Expanded detail content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-bauhaus-black/40 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold">{event.location_name}</p>
              <p className="text-xs text-bauhaus-black/40">
                {event.country_iso}
              </p>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Cases" value={event.case_count?.toLocaleString() ?? "—"} />
            <StatCard label="Deaths" value={event.death_count?.toLocaleString() ?? "—"} />
            <StatCard label="CFR" value={cfr ? `${cfr}%` : "—"} />
          </div>

          {/* Dates */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3 h-3 text-bauhaus-black/40 shrink-0" />
              <span className="text-bauhaus-black/40">First reported:</span>
              <span className="font-bold">
                {new Date(event.date_reported).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3 h-3 text-bauhaus-black/40 shrink-0" />
              <span className="text-bauhaus-black/40">Last updated:</span>
              <span className="font-bold">
                {new Date(event.last_report_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Source */}
          <div className="flex items-center gap-2 text-xs">
            <Activity className="w-3 h-3 text-bauhaus-black/40 shrink-0" />
            <span className="text-bauhaus-black/40">Source:</span>
            <span className="font-bold">
              {SOURCE_LABELS[event.source] ?? event.source}
            </span>
            {event.source_url && (
              <a
                href={event.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bauhaus-blue hover:text-bauhaus-blue/70 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Time series chart */}
          {loading && (
            <div className="h-[120px] flex items-center justify-center border-2 border-bauhaus-black/10">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-bauhaus-black/30 animate-pulse" />
                <span className="w-1.5 h-1.5 bg-bauhaus-black/30 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-bauhaus-black/30 animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {!loading &&
            detail?.time_series &&
            detail.time_series.length > 1 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/60 mb-2">
                  Cumulative Cases
                </h3>
                <div className="h-[120px] w-full border-2 border-bauhaus-black/10 p-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={detail.time_series.map((ts) => ({
                        date: new Date(ts.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }),
                        cases: ts.cumulativeCases ?? 0,
                        deaths: ts.cumulativeDeaths ?? 0,
                      }))}
                    >
                      <defs>
                        <linearGradient
                          id={`casesGrad-${event.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#D02020"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#D02020"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 11,
                          border: "2px solid #121212",
                          borderRadius: 0,
                          backgroundColor: "#fff",
                          color: "#121212",
                          boxShadow: "3px 3px 0px 0px #121212",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cases"
                        stroke="#D02020"
                        strokeWidth={1.5}
                        fill={`url(#casesGrad-${event.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-bauhaus-black/20 p-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-bauhaus-black/40">
        {label}
      </p>
      <p className="text-sm font-black mt-0.5">{value}</p>
    </div>
  );
}
