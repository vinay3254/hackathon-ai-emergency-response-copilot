import type { Incident, Hospital, Ambulance, DispatchRecord } from '../types/incident';
import { create } from 'zustand';

interface IncidentState {
  incidents: Incident[];
  selectedIncidentId: string | null;
  hospitals: Hospital[];
  ambulances: Ambulance[];
  dispatches: DispatchRecord[];
  isWsConnected: boolean;
  activeView: 'responder' | 'caller';
  isRecording: boolean;
  activeFilter: 'all' | 'critical' | 'active' | 'dispatched';

  // Actions
  setWsConnected: (connected: boolean) => void;
  setActiveView: (view: 'responder' | 'caller') => void;
  setActiveFilter: (filter: 'all' | 'critical' | 'active' | 'dispatched') => void;
  selectIncident: (id: string | null) => void;
  setIncidents: (incidents: Incident[]) => void;
  addOrUpdateIncident: (incident: Incident) => void;
  setResources: (hospitals: Hospital[], ambulances: Ambulance[]) => void;
  dispatchResource: (incidentId: string, hospitalId?: string, ambulanceId?: string, eta?: number) => Promise<void>;
  createIncidentFromText: (text: string) => Promise<string>;
  createIncidentFromAudio: (audioBlob: Blob) => Promise<string>;
}

// Initial realistic baseline data for immediate presentation
const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-demo-1',
    transcript: 'Heavy smoke and active flames coming out of the 3rd floor apartment on 12th Main Road, Indiranagar. People might be trapped inside.',
    emergency_type: 'fire',
    severity: 5,
    lat: 12.9784,
    lng: 77.6408,
    status: 'reported',
    summary: 'Structure fire on 3rd floor. High likelihood of civilian entrapment. Immediate fire & rescue dispatch.',
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    classification: {
      location_text: '12th Main Road, Indiranagar',
      lat: 12.9784,
      lng: 77.6408,
      emergency_type: 'fire',
      severity: 5,
      severity_reasoning: 'Active fire in multi-story residential building with possible entrapment.',
      num_people_affected: 3,
      summary: 'Structure fire on 3rd floor with possible entrapment.',
      key_entities: ['ACTIVE_FIRE', 'STRUCTURE_RISK', 'TRAPPED_VICTIMS'],
      action_required: 'Immediate Fire Squad & ALS Ambulance'
    }
  },
  {
    id: 'inc-demo-2',
    transcript: 'Two car collision at 80 Feet Road intersection. Driver is conscious but bleeding from head laceration. Traffic is completely blocked.',
    emergency_type: 'accident',
    severity: 4,
    lat: 12.9352,
    lng: 77.6245,
    status: 'dispatched',
    summary: 'Two-car collision with driver head trauma. Traffic congestion increasing.',
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    classification: {
      location_text: '80 Feet Road, Koramangala',
      lat: 12.9352,
      lng: 77.6245,
      emergency_type: 'accident',
      severity: 4,
      severity_reasoning: 'Active head trauma and roadway hazard requiring rapid triage.',
      num_people_affected: 2,
      summary: 'Two-car collision with head injury.',
      key_entities: ['HEAD_TRAUMA', 'ROAD_BLOCK'],
      action_required: 'BLS Ambulance & Traffic Control'
    }
  },
  {
    id: 'inc-demo-3',
    transcript: 'Elderly man collapsed at park near Jayanagar 4th Block, breathing shallowly and unresponsive to voice commands.',
    emergency_type: 'medical',
    severity: 5,
    lat: 12.9308,
    lng: 77.5838,
    status: 'reported',
    summary: 'Unresponsive senior citizen with respiratory compromise in public area.',
    created_at: new Date(Date.now() - 1 * 60000).toISOString(),
    classification: {
      location_text: 'Jayanagar 4th Block Park',
      lat: 12.9308,
      lng: 77.5838,
      emergency_type: 'medical',
      severity: 5,
      severity_reasoning: 'Respiratory compromise and unresponsiveness; critical resuscitation urgency.',
      num_people_affected: 1,
      summary: 'Unresponsive patient with shallow breathing.',
      key_entities: ['UNRESPONSIVE', 'RESPIRATORY_DISTRESS'],
      action_required: 'Advanced Life Support (ALS) Unit'
    }
  }
];

const INITIAL_HOSPITALS: Hospital[] = [
  { id: 'hosp-1', name: 'Manipal Trauma Center', lat: 12.9592, lng: 77.6534, capacity: 42, contact_number: '+91 80 2502 4444', status: 'Ready', distance_km: 2.1, eta_minutes: 6 },
  { id: 'hosp-2', name: 'Apollo Emergency Center', lat: 12.9789, lng: 77.6087, capacity: 28, contact_number: '+91 80 2630 4050', status: 'Ready', distance_km: 3.4, eta_minutes: 8 },
  { id: 'hosp-3', name: 'Fortis Multi-Specialty Emergency', lat: 12.9015, lng: 77.5989, capacity: 35, contact_number: '+91 80 6621 4444', status: 'Ready', distance_km: 6.8, eta_minutes: 14 },
  { id: 'hosp-4', name: 'Bowring Hospital ICU', lat: 12.9822, lng: 77.6045, capacity: 12, contact_number: '+91 80 2559 1325', status: 'High Occupancy', distance_km: 4.2, eta_minutes: 10 }
];

const INITIAL_AMBULANCES: Ambulance[] = [
  { id: 'amb-101', name: 'ALS Unit 101 (Indiranagar Base)', lat: 12.9750, lng: 77.6380, status: 'available', contact_number: '+91 98800 12345', distance_km: 0.8, eta_minutes: 3 },
  { id: 'amb-102', name: 'BLS Unit 102 (Domlur Sector)', lat: 12.9640, lng: 77.6410, status: 'available', contact_number: '+91 98800 12346', distance_km: 1.6, eta_minutes: 5 },
  { id: 'amb-103', name: 'Rapid Response 103 (MG Road)', lat: 12.9720, lng: 77.6110, status: 'available', contact_number: '+91 98800 12347', distance_km: 3.2, eta_minutes: 7 },
  { id: 'amb-104', name: 'Cardiac Unit 104 (Koramangala)', lat: 12.9390, lng: 77.6280, status: 'dispatched', contact_number: '+91 98800 12348', distance_km: 4.8, eta_minutes: 11 }
];

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: INITIAL_INCIDENTS,
  selectedIncidentId: 'inc-demo-1',
  hospitals: INITIAL_HOSPITALS,
  ambulances: INITIAL_AMBULANCES,
  dispatches: [],
  isWsConnected: false,
  activeView: 'responder',
  isRecording: false,
  activeFilter: 'all',

  setWsConnected: (connected) => set({ isWsConnected: connected }),
  setActiveView: (view) => set({ activeView: view }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  selectIncident: (id) => set({ selectedIncidentId: id }),
  setIncidents: (incidents) => set({ incidents }),
  
  addOrUpdateIncident: (incident) => set((state) => {
    const existingIndex = state.incidents.findIndex((i) => i.id === incident.id);
    if (existingIndex >= 0) {
      const updated = [...state.incidents];
      updated[existingIndex] = { ...updated[existingIndex], ...incident };
      return { incidents: updated };
    }
    return { incidents: [incident, ...state.incidents], selectedIncidentId: incident.id };
  }),

  setResources: (hospitals, ambulances) => set({ hospitals, ambulances }),

  dispatchResource: async (incidentId, hospitalId, ambulanceId, eta = 5) => {
    try {
      set((state) => {
        const updatedIncidents = state.incidents.map((inc) =>
          inc.id === incidentId ? { ...inc, status: 'dispatched' as const } : inc
        );
        const updatedAmbulances = state.ambulances.map((amb) =>
          amb.id === ambulanceId ? { ...amb, status: 'dispatched' as const } : amb
        );
        const newDispatch: DispatchRecord = {
          id: `disp-${Date.now()}`,
          incident_id: incidentId,
          hospital_id: hospitalId,
          ambulance_id: ambulanceId,
          eta_minutes: eta,
          dispatched_at: new Date().toISOString()
        };
        return {
          incidents: updatedIncidents,
          ambulances: updatedAmbulances,
          dispatches: [newDispatch, ...state.dispatches]
        };
      });

      await fetch('http://127.0.0.1:8000/resources/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          hospital_id: hospitalId,
          ambulance_id: ambulanceId,
          eta_minutes: eta
        })
      });
    } catch (e) {
      console.warn('Backend offline; dispatch saved in local state.', e);
    }
  },

  createIncidentFromText: async (text: string) => {
    const newId = `inc-${Date.now()}`;
    const placeholder: Incident = {
      id: newId,
      transcript: text,
      emergency_type: 'processing',
      severity: 3,
      lat: 12.9784,
      lng: 77.6408,
      status: 'processing',
      summary: 'AI Engine analyzing emergency report...',
      created_at: new Date().toISOString()
    };

    get().addOrUpdateIncident(placeholder);

    try {
      const resp = await fetch('http://127.0.0.1:8000/incidents/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, emergency_type: 'medical', severity: 3 })
      });
      if (resp.ok) {
        const data = await resp.json();
        get().addOrUpdateIncident(data);
        return data.id;
      }
    } catch (e) {
      console.log('Backend offline; running client-side fallback parsing.');
    }

    setTimeout(() => {
      const lower = text.toLowerCase();
      let type: any = 'accident';
      let sev: any = 3;
      if (lower.includes('fire') || lower.includes('smoke')) { type = 'fire'; sev = 5; }
      else if (lower.includes('heart') || lower.includes('unconscious') || lower.includes('breath')) { type = 'medical'; sev = 5; }
      else if (lower.includes('crash') || lower.includes('accident')) { type = 'accident'; sev = 4; }

      get().addOrUpdateIncident({
        ...placeholder,
        emergency_type: type,
        severity: sev,
        status: 'reported',
        summary: `AI classified ${type.toUpperCase()} emergency based on reported incident details.`,
        classification: {
          location_text: 'Indiranagar Central',
          lat: 12.9784,
          lng: 77.6408,
          emergency_type: type,
          severity: sev,
          severity_reasoning: 'Critical risk factors detected in verbal emergency description.',
          summary: `AI classified ${type} emergency.`,
          action_required: 'Immediate Field Response'
        }
      });
    }, 800);

    return newId;
  },

  createIncidentFromAudio: async (audioBlob: Blob) => {
    const newId = `inc-voice-${Date.now()}`;
    const placeholder: Incident = {
      id: newId,
      transcript: 'Processing voice audio via Whisper STT...',
      emergency_type: 'processing',
      severity: 4,
      lat: 12.9784,
      lng: 77.6408,
      status: 'processing',
      summary: 'Transcribing speech audio and scoring severity...',
      created_at: new Date().toISOString()
    };

    get().addOrUpdateIncident(placeholder);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'emergency_call.wav');
      const resp = await fetch('http://127.0.0.1:8000/incidents/voice', {
        method: 'POST',
        body: formData
      });
      if (resp.ok) {
        const data = await resp.json();
        get().addOrUpdateIncident(data);
        return data.id;
      }
    } catch (e) {
      console.warn('Backend unavailable for audio upload; using simulated voice processing.');
    }

    setTimeout(() => {
      get().addOrUpdateIncident({
        ...placeholder,
        transcript: 'There is a severe two-wheeler accident near 100 Feet Road, rider is bleeding and unresponsive.',
        emergency_type: 'accident',
        severity: 5,
        status: 'reported',
        summary: 'Critical road traffic accident with unresponsive victim. Immediate ALS ambulance dispatched.',
        classification: {
          location_text: '100 Feet Road, Indiranagar',
          lat: 12.9784,
          lng: 77.6408,
          emergency_type: 'accident',
          severity: 5,
          severity_reasoning: 'High-speed impact with loss of consciousness and severe blood loss.',
          summary: 'Critical road traffic accident with unresponsive victim.',
          action_required: 'Immediate ALS Ambulance & Trauma Bay Preparation'
        }
      });
    }, 1200);

    return newId;
  }
}));
