"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Circle, Square, Triangle, Radio } from "lucide-react";
import Link from "next/link";
import { Map, MapControls } from "@/components/ui/map";
import { OutbreakClusterLayer } from "@/components/pulse/outbreak-cluster-layer";
import { FilterSidebar } from "@/components/pulse/filter-sidebar";
import { DetailSidebar } from "@/components/pulse/detail-sidebar";
import { SummaryBar } from "@/components/pulse/summary-bar";
import {
  type PulseFilters,
  type FilterOptions,
  type OutbreakFeatureCollection,
  type OutbreakFeatureProperties,
  getDefaultFilters,
  filtersToSearchParams,
} from "@/lib/pulse-types";

const INITIAL_CENTER: [number, number] = [20, 15];
const INITIAL_ZOOM = 2;

function BauhausLogo() {
  return (
    <div className="flex items-center gap-2">
      <Circle className="w-5 h-5 fill-bauhaus-red text-bauhaus-red" />
      <Square className="w-5 h-5 fill-bauhaus-blue text-bauhaus-blue" />
      <Triangle className="w-5 h-5 fill-bauhaus-yellow text-bauhaus-yellow" />
    </div>
  );
}

export default function PulsePage() {
  const [filters, setFilters] = useState<PulseFilters>(getDefaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [geojson, setGeojson] = useState<OutbreakFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<
    OutbreakFeatureProperties[]
  >([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch filter options on mount
  useEffect(() => {
    fetch("/api/outbreaks/filters")
      .then((r) => r.json())
      .then(setFilterOptions)
      .catch(() => {});
  }, []);

  // Fetch GeoJSON when filters change (debounced)
  const fetchGeoJSON = useCallback((f: PulseFilters) => {
    setLoading(true);
    setError(null);

    const params = filtersToSearchParams(f);
    fetch(`/api/outbreaks/geojson?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch outbreak data");
        return r.json();
      })
      .then((data: OutbreakFeatureCollection) => {
        setGeojson(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGeoJSON(filters), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, fetchGeoJSON]);

  const handlePointClick = useCallback(
    (
      feature: GeoJSON.Feature<GeoJSON.Point, OutbreakFeatureProperties>,
      _coordinates: [number, number],
    ) => {
      if (!geojson) {
        setSelectedEvents([feature.properties]);
        return;
      }
      const [lng, lat] = feature.geometry.coordinates;
      const COORD_EPSILON = 0.01;
      const colocated = geojson.features
        .filter((f) => {
          const [fLng, fLat] = f.geometry.coordinates;
          return (
            Math.abs(fLng - lng) < COORD_EPSILON &&
            Math.abs(fLat - lat) < COORD_EPSILON
          );
        })
        .map((f) => f.properties);
      setSelectedEvents(colocated.length > 0 ? colocated : [feature.properties]);
    },
    [geojson],
  );

  const handleClusterExpand = useCallback(
    (features: OutbreakFeatureProperties[]) => {
      setSelectedEvents(features);
    },
    [],
  );

  const emptyData: OutbreakFeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  return (
    <div className="h-screen flex flex-col bg-bauhaus-bg text-bauhaus-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <BauhausLogo />
              <span className="text-xl font-black uppercase tracking-tighter">
                Lucid
              </span>
            </Link>
            <span className="w-px h-6 bg-bauhaus-black/20" />
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-bauhaus-red" />
              <span className="text-sm font-bold uppercase tracking-wider">
                Pulse
              </span>
            </div>
          </div>
          <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
            Global Outbreak Tracker
          </span>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Filter sidebar */}
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          matchCount={geojson?.features.length ?? 0}
          isLoading={loading}
        />

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <Map
            center={INITIAL_CENTER}
            zoom={INITIAL_ZOOM}
            className="h-full w-full"
            loading={loading}
            theme="light"
          >
            <OutbreakClusterLayer
              data={geojson ?? emptyData}
              onPointClick={handlePointClick}
              onClusterExpand={handleClusterExpand}
            />
            <MapControls
              position="bottom-right"
              showZoom
              showCompass
              showFullscreen
              showResetView
              resetCenter={INITIAL_CENTER}
              resetZoom={INITIAL_ZOOM}
            />
          </Map>

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
              <div className="bg-white border-2 border-bauhaus-red p-6 max-w-sm text-center shadow-[4px_4px_0px_0px_#D02020]">
                <p className="text-sm font-bold text-bauhaus-red">{error}</p>
                <button
                  onClick={() => fetchGeoJSON(filters)}
                  className="mt-3 text-xs font-bold uppercase tracking-wider text-bauhaus-blue hover:underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading &&
            !error &&
            geojson &&
            geojson.features.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="bg-white border-2 border-bauhaus-black p-6 max-w-sm text-center shadow-[4px_4px_0px_0px_#121212] pointer-events-auto">
                  <p className="text-sm font-bold uppercase tracking-wider text-bauhaus-black/50">
                    No outbreaks match your filters
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Detail sidebar */}
        {selectedEvents.length > 0 && (
          <DetailSidebar
            selectedEvents={selectedEvents}
            onClose={() => setSelectedEvents([])}
          />
        )}
      </div>

      {/* Summary bar */}
      <SummaryBar data={geojson} />
    </div>
  );
}
