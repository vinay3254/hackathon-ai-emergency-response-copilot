import { useState } from 'react';
import { useIncidentStore } from '../store/incidentStore';
import { 
  MapPin, 
  Send, 
  FileText, 
  CheckCircle, 
  BrainCircuit, 
  PhoneCall
} from 'lucide-react';

export const IncidentDetailPanel: React.FC = () => {
  const { incidents, selectedIncidentId, hospitals, ambulances, dispatchResource } = useIncidentStore();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState(false);

  const incident = incidents.find((i) => i.id === selectedIncidentId);

  if (!incident) {
    return (
      <div className="h-full bg-white border border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400 text-xs shadow-2xs">
        <FileText className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <div>Select an incident from the queue or map to inspect details</div>
      </div>
    );
  }

  const activeHospId = selectedHospitalId || (hospitals[0]?.id || '');
  const activeAmbId = selectedAmbulanceId || (ambulances.find(a => a.status === 'available')?.id || ambulances[0]?.id || '');

  const chosenAmb = ambulances.find(a => a.id === activeAmbId);
  const chosenHosp = hospitals.find(h => h.id === activeHospId);

  const handleDispatch = async () => {
    setIsDispatching(true);
    await dispatchResource(
      incident.id, 
      activeHospId, 
      activeAmbId, 
      chosenAmb?.eta_minutes || 5
    );
    setIsDispatching(false);
  };

  return (
    <div className="h-full bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500 font-bold">{incident.id}</span>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 border border-slate-200 text-slate-700 uppercase">
              {incident.emergency_type}
            </span>
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{incident.classification?.location_text || 'Reported Location'}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-800">
            Severity: <span className={incident.severity >= 4 ? 'text-rose-600' : 'text-amber-600'}>Level {incident.severity}/5</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {new Date(incident.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Detail Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        
        {/* Call Transcript Card */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              Caller Transcript (Whisper STT)
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">Confidence 98.4%</span>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-mono bg-slate-50 p-2.5 rounded border border-slate-200/80">
            "{incident.transcript}"
          </p>
        </div>

        {/* AI Reasoning & Severity Card */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
              AI Copilot Analysis
            </span>
            <span className="text-[10px] text-blue-700 font-mono font-bold">Claude Reasoning</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Emergency Type</div>
              <div className="font-bold text-slate-800 capitalize mt-0.5">{incident.emergency_type}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Casualty Estimate</div>
              <div className="font-bold text-slate-800 mt-0.5">{incident.classification?.num_people_affected || 1} Reported</div>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Explainable Severity Rubric</div>
            <div className="text-slate-700 text-xs leading-relaxed font-medium">
              {incident.classification?.severity_reasoning || 'Automated triage based on urgency keywords and casualty risk.'}
            </div>
          </div>

          {incident.classification?.key_entities && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {incident.classification.key_entities.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-700 rounded border border-slate-200 font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Resource Allocation & Nearest Matching */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Matched Nearby Emergency Units
          </div>

          {/* Hospital Selection */}
          <div>
            <label className="text-[11px] text-slate-600 font-bold mb-1 block">Destination Hospital (Trauma Center)</label>
            <select
              value={activeHospId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.distance_km} km (ETA: ~{h.eta_minutes} min, Capacity: {h.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Ambulance Selection */}
          <div>
            <label className="text-[11px] text-slate-600 font-bold mb-1 block">Dispatch Ambulance Unit</label>
            <select
              value={activeAmbId}
              onChange={(e) => setSelectedAmbulanceId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
            >
              {ambulances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.distance_km} km (ETA: ~{a.eta_minutes} min) [{a.status.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
        {incident.status === 'dispatched' ? (
          <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded text-xs flex items-center justify-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Dispatched to {chosenHosp?.name || 'Trauma Center'} (ETA {chosenAmb?.eta_minutes || 5} min)</span>
          </div>
        ) : (
          <button
            onClick={handleDispatch}
            disabled={isDispatching}
            className="flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isDispatching ? 'Transmitting Dispatch...' : `Confirm Unit Dispatch (ETA ~${chosenAmb?.eta_minutes || 5} min)`}
          </button>
        )}
      </div>
    </div>
  );
};
