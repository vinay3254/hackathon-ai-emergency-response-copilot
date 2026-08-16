import { useIncidentStore } from './store/incidentStore';
import { useIncidentSocket } from './hooks/useIncidentSocket';
import { ResponderDashboard } from './pages/ResponderDashboard';
import { CallerView } from './pages/CallerView';
import { Shield, LayoutDashboard, PhoneCall } from 'lucide-react';

export function App() {
  useIncidentSocket();

  const { activeView, setActiveView, isWsConnected } = useIncidentStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-rose-100 selection:text-rose-900">
      {/* Top Application Bar */}
      <header className="h-[65px] border-b border-slate-200 bg-white px-5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 font-bold text-sm">
            <Shield className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 tracking-wide uppercase">RescueAI Copilot</div>
            <div className="text-[10px] text-slate-500 font-mono">Autonomous Emergency Dispatch Orchestrator</div>
          </div>
        </div>

        {/* View Switcher Tabs (Solid minimal white) */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-md">
          <button
            onClick={() => setActiveView('responder')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeView === 'responder'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Responder Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('caller')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeView === 'caller'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Caller Voice Portal</span>
          </button>
        </div>

        {/* System Status Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 bg-slate-100 border border-slate-200 rounded">
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className={isWsConnected ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
              {isWsConnected ? 'WS LIVE' : 'WS RECONNECTING'}
            </span>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {activeView === 'responder' ? <ResponderDashboard /> : <CallerView />}
      </main>
    </div>
  );
}

export default App;
