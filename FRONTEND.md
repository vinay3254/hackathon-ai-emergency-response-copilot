# Frontend — AI Emergency Response Copilot

## Role

Captures the caller's voice report, shows real-time incident status, and
renders a live map of the incident plus matched hospitals/ambulances for
the responder-facing dashboard.

## Stack

- **Framework**: React + Vite, TypeScript
- **Styling**: Tailwind CSS — static layouts, no motion/animation
- **Map**: Leaflet (open-source, fast to set up) or Mapbox GL (nicer visuals
  if time allows and a token is available)
- **Realtime**: native `WebSocket` API or a thin wrapper hook
- **State**: Zustand (lighter than Redux, fine for hackathon scope)
- **Audio capture**: `MediaRecorder` API in-browser, upload as blob
- **HTTP client**: `fetch` or `axios`

## Two Surfaces

### 1. Caller View (mobile-first)
- Big "Report Emergency" button → starts recording
- Waveform/level indicator while recording (static visual, not animated)
- Transcript preview once STT returns
- Status tracker: `Reported → Classified → Dispatched → Responder En Route`
- Caller's own location shown on a small map

### 2. Responder Dashboard (desktop)
- Live map with all active incidents as markers (color-coded by severity)
- Hospital and ambulance markers, filterable by availability
- Incident list/table with type, severity, status, ETA
- Click an incident → detail panel with transcript, summary, matched
  resources, dispatch confirmation button

## Component Structure

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── CallerView.tsx
│   │   └── ResponderDashboard.tsx
│   ├── components/
│   │   ├── RecordButton.tsx
│   │   ├── StatusTracker.tsx
│   │   ├── IncidentMap.tsx
│   │   ├── IncidentList.tsx
│   │   ├── IncidentDetailPanel.tsx
│   │   └── ResourceMarker.tsx
│   ├── hooks/
│   │   ├── useAudioRecorder.ts
│   │   ├── useIncidentSocket.ts   # WebSocket subscription
│   │   └── useIncidents.ts        # REST fetch/cache
│   ├── store/
│   │   └── incidentStore.ts       # Zustand store
│   ├── api/
│   │   └── client.ts
│   └── types/
│       └── incident.ts            # shared shape with backend schemas
├── index.html
├── tailwind.config.js
└── vite.config.ts
```

## Data Flow

1. `useAudioRecorder` captures audio → POST to `/incidents` → gets back
   `incident_id`
2. `useIncidentSocket` subscribes to `/ws/incidents`, updates the Zustand
   store as classification/dispatch events arrive
3. `IncidentMap` and `IncidentList` are pure renders off the store — no
   local polling needed once the socket is live

## Design Notes

- Keep the UI static and information-dense rather than animated — status
  changes should update instantly (no transition/fade), consistent with a
  dispatcher-tool aesthetic rather than a consumer app.
- Severity should be color-coded consistently everywhere (map markers, list
  rows, detail panel) — pick a fixed palette early (e.g. green/yellow/orange/red).
- Build the Responder Dashboard first for demo purposes — it's the visually
  impressive part judges will remember. The Caller View can be simpler.
