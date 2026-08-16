export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type EmergencyType = 'medical' | 'fire' | 'accident' | 'crime' | 'hazard' | 'other' | 'processing';

export type IncidentStatus = 'processing' | 'reported' | 'classified' | 'dispatched' | 'resolved';

export interface IncidentClassification {
  location_text: string;
  lat?: number;
  lng?: number;
  emergency_type: EmergencyType;
  severity: SeverityLevel;
  severity_reasoning: string;
  num_people_affected?: number;
  summary: string;
  key_entities?: string[];
  action_required?: string;
}

export interface Incident {
  id: string;
  transcript: string;
  emergency_type: EmergencyType;
  severity: SeverityLevel;
  lat: number;
  lng: number;
  status: IncidentStatus;
  summary: string;
  created_at: string;
  classification?: IncidentClassification;
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  contact_number: string;
  status: string;
  distance_km?: number;
  eta_minutes?: number;
}

export interface Ambulance {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'available' | 'dispatched';
  contact_number: string;
  distance_km?: number;
  eta_minutes?: number;
}

export interface DispatchRecord {
  id: string;
  incident_id: string;
  hospital_id?: string;
  ambulance_id?: string;
  eta_minutes: number;
  dispatched_at: string;
}
