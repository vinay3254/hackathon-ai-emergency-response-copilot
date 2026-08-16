import { useState } from 'react';
import { useIncidentStore } from '../store/incidentStore';
import { Search, AlertTriangle, ShieldAlert, Clock, CheckCircle2, Radio } from 'lucide-react';

export const IncidentList: React.FC = () => {
  const { incidents, selectedIncidentId, selectIncident, activeFilter, setActiveFilter } = useIncidentStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'critical' && inc.severity < 4) return false;
    if (activeFilter === 'active' && inc.status === 'dispatched') return false;
    if (activeFilter === 'dispatched' && inc.status !== 'dispatched') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchText = (inc.transcript + ' ' + inc.emergency_type + ' ' + inc.summary).toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  const getSeverityBadge = (level: number) => {
    if (level >= 5) {
      return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-50 border border-rose-200 text-rose-700">Level 5 (Critical)</span>;
    }
    if (level === 4) {
      return <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-50 border border-amber-200 text-amber-800">Level 4 (High)</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 border border-slate-200 text-slate-700">Level {level}</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'processing') {
      return (
        <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
          <Radio className="w-3 h-3 animate-pulse" /> AI Triage
        </span>
      );
    }
    if (status === 'dispatched') {
      return (
        <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Dispatched
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] text-rose-700 font-semibold">
        <AlertTriangle className="w-3 h-3" /> Reported
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide text-slate-900 uppercase">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>Incident Queue</span>
            <span className="ml-1 px-2 py-0.2 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 font-bold">{filteredIncidents.length}</span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transcripts, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
          {(['all', 'critical', 'active', 'dispatched'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 py-1 rounded capitalize transition-all ${
                activeFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No incidents found matching current filters.
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;
            return (
              <div
                key={incident.id}
                onClick={() => selectIncident(incident.id)}
                className={`p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-50/90 border-l-4 border-l-rose-600'
                    : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(incident.severity)}
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      {incident.emergency_type}
                    </span>
                  </div>
                  {getStatusBadge(incident.status)}
                </div>

                <div className="text-xs font-semibold text-slate-800 line-clamp-2 mb-2 leading-relaxed">
                  {incident.summary || incident.transcript}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="truncate max-w-[180px]">
                    {incident.classification?.location_text || 'GPS Coordinates Stamped'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 shrink-0 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
