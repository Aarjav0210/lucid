"use client";

import { useEffect, useId, useRef } from "react";
import { useMap } from "@/components/ui/map";
import type { OutbreakFeatureCollection, OutbreakFeatureProperties } from "@/lib/pulse-types";

interface OutbreakClusterLayerProps {
  data: OutbreakFeatureCollection;
  onPointClick?: (
    feature: GeoJSON.Feature<GeoJSON.Point, OutbreakFeatureProperties>,
    coordinates: [number, number],
  ) => void;
  onClusterExpand?: (
    features: OutbreakFeatureProperties[],
  ) => void;
}

const STATUS_MAP_COLORS: Record<string, string> = {
  active: "#D02020",     // bauhaus-red
  monitoring: "#F0C020", // bauhaus-yellow
  contained: "#1040C0",  // bauhaus-blue
  resolved: "#9ca3af",
};

export function OutbreakClusterLayer({
  data,
  onPointClick,
  onClusterExpand,
}: OutbreakClusterLayerProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `outbreak-source-${id}`;
  const clusterLayerId = `outbreak-clusters-${id}`;
  const clusterCountId = `outbreak-cluster-count-${id}`;
  const pointLayerId = `outbreak-points-${id}`;
  const pulseLayerId = `outbreak-pulse-${id}`;
  const onPointClickRef = useRef(onPointClick);
  onPointClickRef.current = onPointClick;
  const onClusterExpandRef = useRef(onClusterExpand);
  onClusterExpandRef.current = onClusterExpand;

  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: "geojson",
      data,
      cluster: true,
      clusterMaxZoom: 10,
      clusterRadius: 50,
    });

    // Cluster circles
    map.addLayer({
      id: clusterLayerId,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#7c8594",  // light grey (small: 2–9)
          10,
          "#505a68",  // mid grey   (medium: 10–49)
          50,
          "#2b3240",  // dark slate  (large: 50+)
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          18,
          10,
          26,
          50,
          36,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "rgba(255,255,255,0.5)",
        "circle-opacity": 0.9,
      },
    });

    // Cluster count labels
    map.addLayer({
      id: clusterCountId,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Pulse ring for active outbreaks
    map.addLayer({
      id: pulseLayerId,
      type: "circle",
      source: sourceId,
      filter: [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "status"], "active"],
      ],
      paint: {
        "circle-color": "rgba(208, 32, 32, 0)",
        "circle-radius": [
          "step",
          ["coalesce", ["get", "case_count"], 0],
          14,
          100, 18,
          1000, 22,
          10000, 28,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "rgba(208, 32, 32, 0.4)",
        "circle-opacity": 0,
      },
    });

    // Individual points with data-driven color/size
    map.addLayer({
      id: pointLayerId,
      type: "circle",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match",
          ["get", "status"],
          "active", STATUS_MAP_COLORS.active,
          "monitoring", STATUS_MAP_COLORS.monitoring,
          "contained", STATUS_MAP_COLORS.contained,
          "resolved", STATUS_MAP_COLORS.resolved,
          "#6b7280",
        ],
        "circle-radius": [
          "step",
          ["coalesce", ["get", "case_count"], 0],
          6,
          100, 10,
          1000, 14,
          10000, 20,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "rgba(255,255,255,0.8)",
        "circle-opacity": [
          "case",
          ["==", ["get", "case_count"], null],
          0.7,
          1,
        ],
      },
    });

    return () => {
      try {
        [pulseLayerId, pointLayerId, clusterCountId, clusterLayerId].forEach(
          (lid) => {
            if (map.getLayer(lid)) map.removeLayer(lid);
          },
        );
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // Style may have been removed already
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Update data when it changes
  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    }
  }, [isLoaded, map, data, sourceId]);

  // Click handlers
  useEffect(() => {
    if (!isLoaded || !map) return;

    const handleClusterClick = async (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId],
      });
      if (!features.length) return;

      const feature = features[0];
      const clusterId = feature.properties?.cluster_id as number;
      const pointCount = feature.properties?.point_count as number;
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      const currentZoom = map.getZoom();

      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      const expansionZoom = await source.getClusterExpansionZoom(clusterId);

      // If we can still zoom in meaningfully (>1 level to go), zoom first
      if (expansionZoom - currentZoom > 1) {
        map.easeTo({ center: coordinates, zoom: expansionZoom });
        return;
      }

      // We're close to or past the expansion zoom — open the sidebar with all events
      // But zoom in a bit more first for context if we're not already tight
      if (currentZoom < expansionZoom) {
        map.easeTo({ center: coordinates, zoom: Math.min(expansionZoom, currentZoom + 2) });
      }

      try {
        const leaves = await source.getClusterLeaves(clusterId, pointCount, 0);
        const props = leaves.map(
          (f) => f.properties as unknown as OutbreakFeatureProperties,
        );
        if (props.length > 0) {
          onClusterExpandRef.current?.(props);
        }
      } catch {
        map.easeTo({ center: coordinates, zoom: currentZoom + 2 });
      }
    };

    const handlePointClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [pointLayerId],
      });
      if (!features.length) return;

      const feature = features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      onPointClickRef.current?.(
        feature as unknown as GeoJSON.Feature<GeoJSON.Point, OutbreakFeatureProperties>,
        coordinates,
      );
    };

    const setPointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const clearPointer = () => { map.getCanvas().style.cursor = ""; };

    map.on("click", clusterLayerId, handleClusterClick);
    map.on("click", pointLayerId, handlePointClick);
    map.on("mouseenter", clusterLayerId, setPointer);
    map.on("mouseleave", clusterLayerId, clearPointer);
    map.on("mouseenter", pointLayerId, setPointer);
    map.on("mouseleave", pointLayerId, clearPointer);

    return () => {
      map.off("click", clusterLayerId, handleClusterClick);
      map.off("click", pointLayerId, handlePointClick);
      map.off("mouseenter", clusterLayerId, setPointer);
      map.off("mouseleave", clusterLayerId, clearPointer);
      map.off("mouseenter", pointLayerId, setPointer);
      map.off("mouseleave", pointLayerId, clearPointer);
    };
  }, [isLoaded, map, clusterLayerId, pointLayerId, sourceId]);

  return null;
}
