"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TechMarker {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  role?: string;
  latitude?: number;
  longitude?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  networkStatus?: string;
  speed?: number;
  heading?: number;
  status: string;
  currentOrder?: string;
  isOnline: boolean;
  specialization?: string;
  deviceModel?: string;
  etaText?: string;
  currentJobTitle?: string;
  currentJobArea?: string;
  accuracy?: number;
  lastLocationTime?: string;
  hasFreshLocation: boolean;
}

interface InteractiveMapProps {
  technicians: TechMarker[];
  selectedTechId?: string | null;
  onSelectTech: (_tech: TechMarker) => void;
}

export default function InteractiveMap({
  technicians,
  selectedTechId,
  onSelectTech,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Default UAE coordinates (Abu Dhabi / Dubai center)
    const map = L.map(mapRef.current, {
      center: [24.4539, 54.3773], // Abu Dhabi
      zoom: 11,
      zoomControl: false,
    });

    // Highly reliable OpenStreetMap standard tiles (always accessible, fast, no CORS issues)
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }
    );

    // High-resolution Satellite layer fallback
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }
    );

    osmLayer.addTo(map);

    L.control.layers(
      {
        "🗺️ Street Map": osmLayer,
        "🛰️ Satellite": satelliteLayer,
      },
      undefined,
      { position: "topright" }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    leafletMapRef.current = map;

    // Ensure map tiles properly fill container on load
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update markers when technicians list or selectedTech changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Clear old markers that no longer exist
    const currentIds = new Set(technicians.map((t) => t.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    const validPositions: L.LatLngExpression[] = [];

    technicians.forEach((tech) => {
      if (tech.latitude === undefined || tech.longitude === undefined) return;
      const isSelected = tech.id === selectedTechId;
      const pos: L.LatLngTuple = [tech.latitude, tech.longitude];
      validPositions.push(pos);

      const isBusy = tech.status === "ON_JOB" || Boolean(tech.currentOrder);
      const isOnline = tech.isOnline;

      let statusText = "OFFLINE";
      let statusBadgeBg = "#F1F5F9";
      let statusBadgeColor = "#64748B";
      let pinBorderColor = "#CBD5E1";
      let statusDotColor = "#94A3B8";
      let subtitleColor = "#64748B";
      let subtitleText = "Offline";

      if (isOnline) {
        if (isBusy) {
          statusText = "BUSY";
          statusBadgeBg = "#FEF3C7";
          statusBadgeColor = "#B45309";
          pinBorderColor = "#F59E0B";
          statusDotColor = "#F59E0B";
          subtitleColor = "#D97706";
          subtitleText = tech.etaText || (tech.currentOrder ? `Job: ${tech.currentOrder}` : "On Active Job");
        } else {
          statusText = "ONLINE";
          statusBadgeBg = "#DCFCE7";
          statusBadgeColor = "#15803D";
          pinBorderColor = "#10B981";
          statusDotColor = "#10B981";
          subtitleColor = "#059669";
          subtitleText = tech.etaText || "Available / Ready";
        }
      }

      if (!tech.hasFreshLocation) {
        pinBorderColor = tech.latitude !== undefined ? "#F59E0B" : "#CBD5E1";
        subtitleColor = tech.latitude !== undefined ? "#B45309" : "#64748B";
        subtitleText = tech.latitude !== undefined
          ? `Last GPS · ${tech.lastLocationTime || "stale"}`
          : "No GPS fix received";
      } else if (tech.accuracy !== undefined) {
        subtitleText = `${subtitleText} · GPS ±${Math.round(tech.accuracy)}m`;
      }

      const pulseDotHtml = isOnline && tech.hasFreshLocation
        ? `<span style="
            position: absolute;
            top: 2px;
            right: 2px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${statusDotColor};
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 8px ${statusDotColor};
            z-index: 10;
          "></span>`
        : "";

      const iconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s ease;">
          <div style="
            background: #FFFFFF;
            border: ${isSelected ? '2.5px solid #0284C7' : `2px solid ${pinBorderColor}`};
            border-radius: 9999px;
            padding: 5px 14px 5px 6px;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08);
            display: flex;
            align-items: center;
            gap: 9px;
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            color: #0F172A;
            transform: ${isSelected ? 'scale(1.08)' : 'scale(1)'};
            white-space: nowrap;
          ">
            <!-- Avatar with Status Dot -->
            <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #0F172A; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
              ${tech.avatar ? `
                <img src="${tech.avatar}" alt="${tech.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div style="display: none; width: 100%; height: 100%; background: #0F172A; color: #FFFFFF; font-weight: 800; font-size: 13px; align-items: center; justify-content: center; border-radius: 50%;">${tech.name.charAt(0).toUpperCase()}</div>
              ` : `
                <div style="width: 100%; height: 100%; background: #0F172A; color: #FFFFFF; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">${tech.name.charAt(0).toUpperCase()}</div>
              `}
              ${pulseDotHtml}
            </div>

            <!-- Content Details -->
            <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: left; line-height: 1.2;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 13px; font-weight: 800; color: #0F172A; letter-spacing: -0.2px;">${tech.name}</span>
                <span style="
                  background: ${statusBadgeBg};
                  color: ${statusBadgeColor};
                  border: 1px solid ${statusBadgeColor}33;
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 10px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.4px;
                  display: flex;
                  align-items: center;
                  gap: 3.5px;
                ">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusDotColor}; display: inline-block;"></span>
                  ${statusText}
                </span>
              </div>
              <span style="font-size: 10px; color: ${subtitleColor}; font-weight: 700; margin-top: 1px;">
                ${subtitleText}
              </span>
            </div>

            <!-- Chevron Icon -->
            <div style="color: #94A3B8; margin-left: 2px; display: flex; align-items: center;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <!-- Pointer Pin Arrow -->
          <div style="
            width: 0; 
            height: 0; 
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 9px solid ${isSelected ? '#0284C7' : pinBorderColor};
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
            margin-top: -1px;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-tech-marker",
        iconSize: [200, 58],
        iconAnchor: [100, 54],
      });

      if (markersRef.current[tech.id]) {
        markersRef.current[tech.id].setLatLng(pos);
        markersRef.current[tech.id].setIcon(customIcon);
        markersRef.current[tech.id].off("click");
        markersRef.current[tech.id].on("click", () => onSelectTech(tech));
      } else {
        const marker = L.marker(pos, { icon: customIcon }).addTo(map);
        marker.on("click", () => onSelectTech(tech));
        markersRef.current[tech.id] = marker;
      }
    });

    // Center on selected technician or fit all available technicians
    if (selectedTechId) {
      const selected = technicians.find((t) => t.id === selectedTechId);
      if (selected && selected.latitude !== undefined && selected.longitude !== undefined) {
        map.setView([selected.latitude, selected.longitude], 14, { animate: true });
      }
    } else if (validPositions.length > 0) {
      if (validPositions.length === 1) {
        map.setView(validPositions[0] as L.LatLngTuple, 14, { animate: true });
      } else {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [technicians, selectedTechId, onSelectTech]);

  const handleRecenter = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    const validPositions: L.LatLngTuple[] = technicians
      .filter((t) => t.latitude !== undefined && t.longitude !== undefined)
      .map((t) => [t.latitude!, t.longitude!]);

    if (validPositions.length === 1) {
      map.setView(validPositions[0], 14);
    } else if (validPositions.length > 1) {
      map.fitBounds(L.latLngBounds(validPositions), { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([24.4539, 54.3773], 11);
    }
  };

  const liveGpsCount = technicians.filter((t) => t.hasFreshLocation).length;
  const onJobCount = technicians.filter((t) => t.status === "ON_JOB").length;
  const freeCount = technicians.filter((t) => t.isOnline && t.status !== "ON_JOB").length;
  const offlineCount = technicians.filter((t) => !t.isOnline).length;

  return (
    <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F19] relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Floating Tactical HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-2.5 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-900 dark:text-white font-bold">{liveGpsCount}</span>
            <span className="text-slate-500 dark:text-slate-400">Live GPS</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span className="text-slate-900 dark:text-white font-bold">{freeCount}</span>
            <span className="text-slate-500 dark:text-slate-400">Available</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-900 dark:text-white font-bold">{onJobCount}</span>
            <span className="text-slate-500 dark:text-slate-400">On Job</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-900 dark:text-white font-bold">{offlineCount}</span>
            <span className="text-slate-500 dark:text-slate-400">Offline</span>
          </div>
        </div>

        <button
          onClick={handleRecenter}
          className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 font-bold backdrop-blur-sm cursor-pointer transition"
        >
          <span>🎯</span>
          <span>Fit All</span>
        </button>
      </div>
    </div>
  );
}
