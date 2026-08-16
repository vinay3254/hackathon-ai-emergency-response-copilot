import { useIncidentStore } from '../store/incidentStore';
import { IncidentList } from '../components/IncidentList';
import { IncidentMap } from '../components/IncidentMap';
import { IncidentDetailPanel } from '../components/IncidentDetailPanel';
import { Activity, Building2, Truck, AlertCircle } from 'lucide-react';

export const ResponderDashboard: React.FC = () => {
  const { incidents, hospitals, ambulances } = useIncidentStore();

  const criticalCount = incidents.filter((i) => i.severity >= 4).length;
  const availableAmbCount = ambulances.filter((a) => a.status === 'available').length;

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] p-3 gap-3 overflow-hidden bg-slate-50">
      {/* Top Stat Summary Strip (Solid white cards) */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Active Queue</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{incidents.length}</div>
          </div>
          <Activity className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] text-rose-600 font-semibold uppercase tracking-wider">Critical Priority</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5">{criticalCount}</div>
          </div>
          <AlertCircle className="w-5 h-5 text-rose-500" />
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Ambulance Fleet</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {availableAmbCount} <span className="text-xs text-slate-400 font-normal">/ {ambulances.length} Ready</span>
            </div>
          </div>
          <Truck className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">Trauma Centers</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{hospitals.length} Active</div>
          </div>
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      {/* Main 3-Column Command Center Layout */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Column: Incident List (3 cols) */}
        <div className="col-span-3 h-full overflow-hidden shadow-2xs">
          <IncidentList />
        </div>

        {/* Center Column: Live Map (5 cols) */}
        <div className="col-span-5 h-full overflow-hidden shadow-2xs">
          <IncidentMap />
        </div>

        {/* Right Column: Detail & Dispatch (4 cols) */}
        <div className="col-span-4 h-full overflow-hidden shadow-2xs">
          <IncidentDetailPanel />
        </div>
      </div>
    </div>
  );
};
