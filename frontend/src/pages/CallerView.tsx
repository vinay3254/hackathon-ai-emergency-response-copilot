import { useState, useRef } from 'react';
import { useIncidentStore } from '../store/incidentStore';
import { Mic, MicOff, Send, Radio, CheckCircle2 } from 'lucide-react';

export const CallerView: React.FC = () => {
  const { createIncidentFromText, createIncidentFromAudio, incidents } = useIncidentStore();
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const reportedIncident = incidents.find((i) => i.id === activeReportId);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsSubmitting(true);
        const newId = await createIncidentFromAudio(blob);
        setActiveReportId(newId);
        setIsSubmitting(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access unavailable, using simulated voice report.', err);
      setIsRecording(true);
      setTimeout(async () => {
        setIsRecording(false);
        setIsSubmitting(true);
        const dummyBlob = new Blob(['sample-audio-data'], { type: 'audio/wav' });
        const newId = await createIncidentFromAudio(dummyBlob);
        setActiveReportId(newId);
        setIsSubmitting(false);
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setIsSubmitting(true);
    const newId = await createIncidentFromText(textInput);
    setActiveReportId(newId);
    setTextInput('');
    setIsSubmitting(false);
  };

  const sampleScenarios = [
    "Severe car accident on 100 Feet Road, 2 injured and 1 unconscious",
    "Active electrical fire with heavy smoke on 3rd floor apartment in Indiranagar",
    "Elderly man collapsed with chest pain at Jayanagar 4th Block Park"
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-2xs">
          <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          <span>AI Voice Emergency Dispatch Copilot</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report an Emergency</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
          Speak naturally into your microphone or describe the incident below. AI will automatically extract location, triage severity, and dispatch nearest responders.
        </p>
      </div>

      {/* Voice Capture Solid White Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center space-y-6 shadow-2xs">
        <div className="flex justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSubmitting}
            className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-50 border-rose-500 text-rose-700 animate-pulse scale-105 shadow-md'
                : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-100 active:scale-95 shadow-xs'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-8 h-8 mb-1 text-rose-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8 mb-1 text-slate-700" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Record</span>
              </>
            )}
          </button>
        </div>

        {isRecording && (
          <div className="space-y-2">
            <div className="text-xs font-mono text-rose-600 font-bold">Listening to caller audio... Speak now.</div>
            <div className="flex items-center justify-center gap-1 h-6">
              {[40, 75, 100, 60, 85, 45, 90, 65, 35, 80, 95, 50, 70, 30].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-1 bg-rose-500 rounded-full"
                />
              ))}
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="text-xs font-mono text-slate-600 flex items-center justify-center gap-2 font-semibold">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>AI Reasoning & Whisper STT in progress...</span>
          </div>
        )}
      </div>

      {/* Or Quick Text Input */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Or Submit Text Description</div>
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type emergency description..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-500 font-medium"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isSubmitting}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

        {/* Quick Test Chips */}
        <div className="pt-2">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1.5">Quick Demo Scenarios</div>
          <div className="space-y-1.5">
            {sampleScenarios.map((sc, i) => (
              <button
                key={i}
                onClick={() => setTextInput(sc)}
                className="w-full text-left p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 truncate transition-colors font-medium cursor-pointer"
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Incident Status Progression Tracker */}
      {reportedIncident && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="text-xs font-mono text-slate-500 font-semibold">Incident Ticket: #{reportedIncident.id.slice(-6)}</div>
              <div className="font-bold text-sm text-slate-900 mt-0.5 capitalize">{reportedIncident.emergency_type} Emergency</div>
            </div>
            <div className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 border border-slate-200 text-slate-800">
              Severity Level {reportedIncident.severity}/5
            </div>
          </div>

          {/* 4-Step Progress Flow */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px] font-bold">
            <div className="space-y-1">
              <div className="w-6 h-6 mx-auto rounded-full bg-emerald-50 border border-emerald-500 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-emerald-700">1. Reported</div>
            </div>
            
            <div className="space-y-1">
              <div className={`w-6 h-6 mx-auto rounded-full border flex items-center justify-center ${
                reportedIncident.status !== 'processing' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                  : 'bg-amber-50 border-amber-500 text-amber-700 animate-pulse'
              }`}>
                {reportedIncident.status !== 'processing' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Radio className="w-3 h-3" />}
              </div>
              <div className={reportedIncident.status !== 'processing' ? 'text-emerald-700' : 'text-amber-700'}>
                2. AI Classified
              </div>
            </div>

            <div className="space-y-1">
              <div className={`w-6 h-6 mx-auto rounded-full border flex items-center justify-center ${
                reportedIncident.status === 'dispatched' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {reportedIncident.status === 'dispatched' ? <CheckCircle2 className="w-3.5 h-3.5" /> : '3'}
              </div>
              <div className={reportedIncident.status === 'dispatched' ? 'text-emerald-700' : 'text-slate-500'}>
                3. Dispatched
              </div>
            </div>

            <div className="space-y-1">
              <div className={`w-6 h-6 mx-auto rounded-full border flex items-center justify-center ${
                reportedIncident.status === 'dispatched' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700 animate-pulse' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {reportedIncident.status === 'dispatched' ? <Radio className="w-3.5 h-3.5" /> : '4'}
              </div>
              <div className={reportedIncident.status === 'dispatched' ? 'text-blue-700' : 'text-slate-500'}>
                4. En Route
              </div>
            </div>
          </div>

          {/* Transcript & Summary Feedback */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1.5">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Live AI Assessment</div>
            <div className="text-slate-800 font-medium">{reportedIncident.summary || reportedIncident.transcript}</div>
          </div>
        </div>
      )}
    </div>
  );
};
