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
import { Slider } from "@/components/ui/slider";
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
      <div className="flex flex-col items-center py-4 gap-2 border-r border-border bg-white w-10 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 hover:bg-bauhaus-muted/50 transition-colors"
          aria-label="Expand filters"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[260px] shrink-0 border-r border-border bg-white flex flex-col min-h-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/60">
          Filters
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 hover:bg-bauhaus-muted/50 transition-colors"
          aria-label="Collapse filters"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="p-3 space-y-4">
          {/* Host Species Category */}
          <FilterSection title="Species">
            <div className="flex gap-1">
              {["human", "animal", "crop"].map((cat) => (
                <button
                  key={cat}
                  disabled={cat !== "human"}
                  onClick={() => updateFilter("host_species_category", cat)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-2 transition-colors",
                    filters.host_species_category === cat
                      ? "bg-bauhaus-blue text-white border-bauhaus-black shadow-[2px_2px_0px_0px_#121212]"
                      : "bg-white border-bauhaus-black/20 text-bauhaus-black/50 hover:border-bauhaus-black/40",
                    cat !== "human" && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {cat}
                  {cat !== "human" && (
                    <Lock className="inline w-2.5 h-2.5 ml-0.5 -mt-px" />
                  )}
                </button>
              ))}
            </div>
            {filters.host_species_category === "human" && (
              <p className="text-[9px] text-bauhaus-black/40 mt-1">
                Animal & Crop tracking coming soon
              </p>
            )}
          </FilterSection>

          {/* Status */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-bauhaus-black/60">
                Status
              </h3>
              <div className="relative group">
                <Info className="w-2.5 h-2.5 text-bauhaus-black/30 cursor-help" />
                <div className="absolute left-0 top-full mt-1.5 w-48 p-2 border-2 border-bauhaus-black bg-white shadow-[3px_3px_0px_0px_#121212] opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-50">
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5">Event lifecycle</p>
                  <div className="space-y-1">
                    <StatusHint dot="bg-bauhaus-red" label="Active" desc="Reported within 14 days" />
                    <StatusHint dot="bg-bauhaus-yellow" label="Monitoring" desc="No reports for 14-30 days" />
                    <StatusHint dot="bg-bauhaus-blue" label="Contained" desc="No reports for 30-90 days" />
                    <StatusHint dot="bg-zinc-400" label="Resolved" desc="No reports for 90+ days" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
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
                      "flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-2 transition-colors",
                      checked
                        ? "bg-bauhaus-black/5 border-bauhaus-black text-bauhaus-black shadow-[2px_2px_0px_0px_#121212]"
                        : "bg-white border-bauhaus-black/20 text-bauhaus-black/50 hover:border-bauhaus-black/40",
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", dotColor[s])} />
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
            <div className="flex flex-wrap gap-1">
              {["virus", "bacterium", "fungus", "parasite", "prion", "unknown"].map(
                (pt) => {
                  const checked = filters.pathogen_type.includes(pt);
                  return (
                    <button
                      key={pt}
                      onClick={() => toggleArrayItem("pathogen_type", pt)}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-2 transition-colors",
                        checked
                          ? "bg-bauhaus-black/5 border-bauhaus-black text-bauhaus-black shadow-[2px_2px_0px_0px_#121212]"
                          : "bg-white border-bauhaus-black/20 text-bauhaus-black/50 hover:border-bauhaus-black/40",
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
            <div className="flex gap-1.5 mt-1.5">
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
            <div className="space-y-1">
              {Object.entries(SOURCE_LABELS).map(([key, label]) => {
                const checked = filters.source.includes(key);
                return (
                  <label
                    key={key}
                    className="flex items-center gap-1.5 cursor-pointer group"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleArrayItem("source", key)}
                      className="rounded-none border-2 border-bauhaus-black/30 data-[state=checked]:bg-bauhaus-blue data-[state=checked]:border-bauhaus-blue h-3.5 w-3.5"
                    />
                    <span className="text-[11px] text-bauhaus-black/50 group-hover:text-bauhaus-black transition-colors truncate">
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
      <div className="border-t border-border px-3 py-2.5 space-y-1.5">
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border-2 border-bauhaus-black/20 text-bauhaus-black/60 hover:border-bauhaus-black hover:text-bauhaus-black hover:bg-bauhaus-muted/30 transition-all"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Reset Filters
        </button>
        <p className="text-[9px] text-center text-bauhaus-black/40 font-bold uppercase tracking-wider">
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              Showing{" "}
              <span className="text-bauhaus-black font-black">{matchCount.toLocaleString()}</span>{" "}
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
      <h3 className="text-[9px] font-bold uppercase tracking-widest text-bauhaus-black/60 mb-1.5">
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
    <div className="space-y-1">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1 py-px bg-bauhaus-blue/10 text-bauhaus-blue border border-bauhaus-blue/30"
            >
              {s.length > 18 ? s.slice(0, 18) + "…" : s}
              <X
                className="w-2.5 h-2.5 cursor-pointer hover:text-bauhaus-red transition-colors"
                onClick={() => onToggle(s)}
              />
            </span>
          ))}
          {selected.length > 1 && (
            <button
              onClick={onClear}
              className="text-[9px] font-bold uppercase tracking-wider text-bauhaus-black/40 hover:text-bauhaus-red transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-bauhaus-black/30" />
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
          className="w-full pl-7 pr-2 py-1 text-[11px] bg-bauhaus-muted/30 border-2 border-bauhaus-black/20 focus:border-bauhaus-black focus:outline-none placeholder:text-bauhaus-black/25"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="max-h-[130px] overflow-y-auto border-2 border-bauhaus-black bg-white shadow-[3px_3px_0px_0px_#121212]">
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
                  "w-full text-left px-2 py-1 text-[11px] hover:bg-bauhaus-muted/50 transition-colors truncate",
                  isSelected && "bg-bauhaus-blue/10 font-bold text-bauhaus-blue",
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
        className="flex-1 text-left px-2 py-1 text-[11px] border-2 border-bauhaus-black/20 hover:border-bauhaus-black/40 hover:bg-bauhaus-muted/30 transition-all cursor-pointer"
      >
        <span className="block text-[8px] font-bold uppercase tracking-wider text-bauhaus-black/40 mb-px">
          {label}
        </span>
        <span className={cn(!value && "text-bauhaus-black/30")}>
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
    <div className="space-y-1">
      <Slider
        min={0}
        max={maxDay}
        value={[fromDay, toDay]}
        onValueChange={(value) => {
          const vals = Array.isArray(value) ? value : [value];
          onChangeRange(dayToDate(vals[0]), dayToDate(vals[1] ?? vals[0]));
        }}
      />
      <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-bauhaus-black/30 tabular-nums">
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
      <p className="text-[9px] leading-tight text-bauhaus-black/50">
        <span className="font-bold text-bauhaus-black">{label}</span>{" "}
        — {desc}
      </p>
    </div>
  );
}
