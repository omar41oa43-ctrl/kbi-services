"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MiniRouteMapProps {
  techLat?: number;
  techLng?: number;
  techName?: string;
  destLat?: number;
  destLng?: number;
  destAddress?: string;
}

export default function MiniRouteMap({
  techLat,
  techLng,
  techName = "Technician",
  destLat,
  destLng,
  destAddress = "Customer Destination",
}: MiniRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const initialLat = techLat ?? 24.4539;
    const initialLng = techLng ?? 54.3773;

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    leafletMapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      leafletMapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const positions: L.LatLngTuple[] = [];

    // 1. Technician Marker (Blue Pulsing Pin)
    if (techLat !== undefined && techLng !== undefined) {
      positions.push([techLat, techLng]);

      const techIcon = L.divIcon({
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        className: "mini-tech-icon",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([techLat, techLng], { icon: techIcon })
        .bindTooltip(`📍 ${techName}`, { direction: "top", offset: [0, -8] })
        .addTo(layerGroup);
    }

    // 2. Destination Marker (Red Destination Pin)
    if (destLat !== undefined && destLng !== undefined) {
      positions.push([destLat, destLng]);

      const destIcon = L.divIcon({
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #EF4444; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        className: "mini-dest-icon",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([destLat, destLng], { icon: destIcon })
        .bindTooltip(`🎯 ${destAddress}`, { direction: "top", offset: [0, -8] })
        .addTo(layerGroup);
    }

    // 3. Connect route line if both coordinates exist
    if (positions.length === 2) {
      L.polyline(positions, {
        color: "#2563EB",
        weight: 3,
        opacity: 0.85,
        dashArray: "6, 6",
      }).addTo(layerGroup);

      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    }
  }, [techLat, techLng, techName, destLat, destLng, destAddress]);

  return (
    <div className="h-28 w-full rounded-xl overflow-hidden border border-border relative bg-slate-100 dark:bg-slate-900">
      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
}
