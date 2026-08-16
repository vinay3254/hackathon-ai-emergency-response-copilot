import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useIncidentStore } from '../store/incidentStore';

export const IncidentMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker | L.CircleMarker }>({});

  const { incidents, hospitals, ambulances, selectedIncidentId, selectIncident } = useIncidentStore();

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([12.9716, 77.5946], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // 1. Render Hospital Markers (Solid Blue with White Cross)
    hospitals.forEach((hosp) => {
      const hospIcon = L.divIcon({
        className: 'custom-hosp-marker',
        html: `
          <div class="w-8 h-8 rounded-lg bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-md font-bold text-xs">
            H
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([hosp.lat, hosp.lng], { icon: hospIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans">
            <div class="font-bold text-sm text-slate-900">${hosp.name}</div>
            <div class="text-xs text-slate-600 mt-0.5">Capacity: ${hosp.capacity} beds</div>
            <div class="text-xs text-blue-700 font-semibold mt-1">${hosp.contact_number}</div>
          </div>
        `);
      markersRef.current[`hosp-${hosp.id}`] = marker;
    });

    // 2. Render Ambulance Markers (Solid Emerald/Amber)
    ambulances.forEach((amb) => {
      const isDispatched = amb.status === 'dispatched';
      const ambIcon = L.divIcon({
        className: 'custom-amb-marker',
        html: `
          <div class="w-7 h-7 rounded-md ${isDispatched ? 'bg-amber-600' : 'bg-emerald-600'} border-2 border-white text-white flex items-center justify-center shadow-md font-bold text-[10px]">
            AMB
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([amb.lat, amb.lng], { icon: ambIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans">
            <div class="font-bold text-sm text-slate-900">${amb.name}</div>
            <div class="text-xs text-slate-600 font-semibold capitalize mt-0.5">Status: ${amb.status}</div>
          </div>
        `);
      markersRef.current[`amb-${amb.id}`] = marker;
    });

    // 3. Render Incident Markers
    incidents.forEach((inc) => {
      const isSelected = inc.id === selectedIncidentId;
      let badgeBg = 'bg-slate-700 text-white';
      if (inc.severity >= 5) badgeBg = 'bg-rose-600 text-white';
      else if (inc.severity === 4) badgeBg = 'bg-amber-600 text-white';
      else if (inc.severity === 3) badgeBg = 'bg-yellow-600 text-white';

      const incIcon = L.divIcon({
        className: 'custom-inc-marker',
        html: `
          <div class="relative flex items-center justify-center">
            ${isSelected ? '<div class="absolute -inset-1.5 rounded-full border-2 border-rose-600 animate-pulse"></div>' : ''}
            <div class="w-8 h-8 rounded-full ${badgeBg} border-2 border-white flex items-center justify-center font-bold text-xs shadow-lg cursor-pointer">
              L${inc.severity}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: incIcon })
        .addTo(map)
        .on('click', () => selectIncident(inc.id));

      markersRef.current[`inc-${inc.id}`] = marker;
    });
  }, [incidents, hospitals, ambulances, selectedIncidentId, selectIncident]);

  // Center map on selected incident
  useEffect(() => {
    if (mapInstanceRef.current && selectedIncident) {
      mapInstanceRef.current.setView([selectedIncident.lat, selectedIncident.lng], 14, {
        animate: true
      });
    }
  }, [selectedIncidentId]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden border border-slate-200 rounded-lg shadow-2xs">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Overlay legend with solid white card */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 border border-slate-200 rounded-md p-3 text-xs space-y-1.5 shadow-md">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Map Legend</div>
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-700 inline-block"></span>
          <span>Critical Incident (L5)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="w-3 h-3 rounded-full bg-amber-600 border border-amber-700 inline-block"></span>
          <span>High Severity (L4)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-blue-600 border border-blue-700 inline-block"></span>
          <span>Hospital Trauma Center</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-emerald-600 border border-emerald-700 inline-block"></span>
          <span>Available Ambulance</span>
        </div>
      </div>
    </div>
  );
};
