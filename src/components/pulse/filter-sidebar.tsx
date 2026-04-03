"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  Search,
  X,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  type PulseFilters,
  type FilterOptions,
  SOURCE_LABELS,
  getDefaultFilters,
} from "@/lib/pulse-types";

interface FilterSidebarProps {
  filters: PulseFilters;
  onFiltersChange: (filters: PulseFilters) => void;
  filterOptions: FilterOptions | null;
  matchCount: number;
  isLoading: boolean;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  filterOptions,
  matchCount,
  isLoading,
}: FilterSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const updateFilter = useCallback(
    <K extends keyof PulseFilters>(key: K, value: PulseFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange],
  );

  const resetFilters = useCallback(() => {
    onFiltersChange(getDefaultFilters());
  }, [onFiltersChange]);

  const toggleArrayItem = useCallback(
    (key: keyof PulseFilters, item: string) => {
      const current = filters[key] as string[];
      const next = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      updateFilter(key, next as PulseFilters[typeof key]);
    },
    [filters, updateFilter],
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-2 border-r border-border bg-card w-10 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="Expand filters"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 border-r border-border bg-card flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Filters
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-md hover:bg-accent transition-colors"
          aria-label="Collapse filters"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-5">
          {/* Host Species Category */}
          <FilterSection title="Species">
            <div className="flex gap-1.5">
              {["human", "animal", "crop"].map((cat) => (
                <button
                  key={cat}
                  disabled={cat !== "human"}
                  onClick={() => updateFilter("host_species_category", cat)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors capitalize",
                    filters.host_species_category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground",
                    cat !== "human" && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {cat}
                  {cat !== "human" && (
                    <Lock className="inline w-3 h-3 ml-1 -mt-0.5" />
                  )}
                </button>
              ))}
            </div>
            {filters.host_species_category === "human" && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Animal & Crop tracking coming soon
              </p>
            )}
          </FilterSection>

          {/* Status */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </h3>
              <div className="relative group">
                <Info className="w-3 h-3 text-muted-foreground/50 cursor-help" />
                <div className="absolute left-0 top-full mt-1.5 w-52 p-2.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-50">
                  <p className="text-[10px] font-semibold mb-1.5">Event lifecycle</p>
                  <div className="space-y-1">
                    <StatusHint dot="bg-bauhaus-red" label="Active" desc="Reported within 14 days" />
                    <StatusHint dot="bg-bauhaus-yellow" label="Monitoring" desc="No reports for 14-30 days" />
                    <StatusHint dot="bg-bauhaus-blue" label="Contained" desc="No reports for 30-90 days" />
                    <StatusHint dot="bg-zinc-400" label="Resolved" desc="No reports for 90+ days" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["active", "monitoring", "contained", "resolved"].map((s) => {
                const checked = filters.status.includes(s);
                const dotColor: Record<string, string> = {
                  active: "bg-bauhaus-red",
                  monitoring: "bg-bauhaus-yellow",
                  contained: "bg-bauhaus-blue",
                  resolved: "bg-zinc-400",
                };
                return (
                  <button
                    key={s}
                    onClick={() => toggleArrayItem("status", s)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors capitalize",
                      checked
                        ? "bg-primary/10 border-primary/30 text-foreground"
                        : "bg-card border-border text-muted-foreground",
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", dotColor[s])} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disease */}
          <FilterSection title="Disease">
            <SearchableMultiSelect
              placeholder="Search diseases..."
              options={filterOptions?.disease_names ?? []}
              selected={filters.disease_name}
              onToggle={(val) => toggleArrayItem("disease_name", val)}
              onClear={() => updateFilter("disease_name", [])}
            />
          </FilterSection>

          {/* Pathogen */}
          <FilterSection title="Pathogen">
            <SearchableMultiSelect
              placeholder="Search pathogens..."
              options={filterOptions?.pathogen_names ?? []}
              selected={filters.pathogen_name}
              onToggle={(val) => toggleArrayItem("pathogen_name", val)}
              onClear={() => updateFilter("pathogen_name", [])}
            />
          </FilterSection>

          {/* Pathogen Type */}
          <FilterSection title="Pathogen Type">
            <div className="flex flex-wrap gap-1.5">
              {["virus", "bacterium", "fungus", "parasite", "prion", "unknown"].map(
                (pt) => {
                  const checked = filters.pathogen_type.includes(pt);
                  return (
                    <button
                      key={pt}
                      onClick={() => toggleArrayItem("pathogen_type", pt)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors capitalize",
                        checked
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-card border-border text-muted-foreground",
                      )}
                    >
                      {pt}
                    </button>
                  );
                },
              )}
            </div>
          </FilterSection>

          {/* Country */}
          <FilterSection title="Country">
            <SearchableMultiSelect
              placeholder="Search countries..."
              options={
                filterOptions?.countries.map(
                  (c) => `${c.name} (${c.iso})`,
                ) ?? []
              }
              selected={filters.country_iso.map((iso) => {
                const c = filterOptions?.countries.find((c) => c.iso === iso);
                return c ? `${c.name} (${c.iso})` : iso;
              })}
              onToggle={(val) => {
                const isoMatch = val.match(/\(([A-Z]{3})\)$/);
                if (isoMatch) toggleArrayItem("country_iso", isoMatch[1]);
              }}
              onClear={() => updateFilter("country_iso", [])}
            />
          </FilterSection>

          {/* Last Reported */}
          <FilterSection title="Last Reported">
            <DateRangeSlider
              dateFrom={filters.date_from}
              dateTo={filters.date_to}
              onChangeRange={(from, to) =>
                onFiltersChange({ ...filters, date_from: from, date_to: to })
              }
            />
            <div className="flex gap-2 mt-2">
              <DatePickerField
                label="From"
                value={filters.date_from}
                onChange={(v) => updateFilter("date_from", v)}
              />
              <DatePickerField
                label="To"
                value={filters.date_to}
                onChange={(v) => updateFilter("date_to", v)}
              />
            </div>
          </FilterSection>

          {/* Source */}
          <FilterSection title="Source">
            <div className="space-y-1.5">
              {Object.entries(SOURCE_LABELS).map(([key, label]) => {
                const checked = filters.source.includes(key);
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleArrayItem("source", key)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="w-full text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1.5" />
          Reset Filters
        </Button>
        <p className="text-[10px] text-center text-muted-foreground font-medium">
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              Showing{" "}
              <span className="text-foreground font-bold">{matchCount.toLocaleString()}</span>{" "}
              outbreak events
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SearchableMultiSelect({
  placeholder,
  options,
  selected,
  onToggle,
  onClear,
}: {
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-1.5">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="text-[10px] py-0 px-1.5 gap-0.5"
            >
              {s.length > 20 ? s.slice(0, 20) + "…" : s}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onToggle(s)}
              />
            </Badge>
          ))}
          {selected.length > 1 && (
            <button
              onClick={onClear}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="max-h-[140px] overflow-y-auto border border-border rounded-md bg-popover">
          {filtered.slice(0, 50).map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onToggle(opt);
                }}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-xs hover:bg-accent transition-colors truncate",
                  isSelected && "bg-accent/50 font-medium",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex-1 text-left px-2 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors cursor-pointer"
      >
        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
          {label}
        </span>
        <span className={cn(!value && "text-muted-foreground")}>
          {value || "Pick date"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(d.toISOString().split("T")[0]);
            }
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

const SLIDER_ORIGIN = new Date("2020-01-01T00:00:00").getTime();
const MS_PER_DAY = 86_400_000;

function dateToDay(dateStr: string): number {
  return Math.round((new Date(dateStr + "T00:00:00").getTime() - SLIDER_ORIGIN) / MS_PER_DAY);
}

function dayToDate(day: number): string {
  return new Date(SLIDER_ORIGIN + day * MS_PER_DAY).toISOString().split("T")[0];
}

function DateRangeSlider({
  dateFrom,
  dateTo,
  onChangeRange,
}: {
  dateFrom: string;
  dateTo: string;
  onChangeRange: (from: string, to: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const maxDay = dateToDay(today);
  const fromDay = dateFrom ? dateToDay(dateFrom) : 0;
  const toDay = dateTo ? dateToDay(dateTo) : maxDay;

  return (
    <div className="space-y-1.5">
      <Slider
        min={0}
        max={maxDay}
        value={[fromDay, toDay]}
        onValueChange={(value) => {
          const vals = Array.isArray(value) ? value : [value];
          onChangeRange(dayToDate(vals[0]), dayToDate(vals[1] ?? vals[0]));
        }}
      />
      <div className="flex justify-between text-[9px] text-muted-foreground tabular-nums">
        <span>{dateFrom || "2020-01-01"}</span>
        <span>{dateTo || today}</span>
      </div>
    </div>
  );
}

function StatusHint({ dot, label, desc }: { dot: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className={cn("w-1.5 h-1.5 rounded-full mt-[3px] shrink-0", dot)} />
      <p className="text-[10px] leading-tight text-muted-foreground">
        <span className="font-medium text-popover-foreground">{label}</span>{" "}
        — {desc}
      </p>
    </div>
  );
}
