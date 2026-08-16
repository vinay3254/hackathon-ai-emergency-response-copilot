# ML Engine — AI Emergency Response Copilot

## Role

Turns raw voice/text into a structured, actionable incident record. This is
the "AI" the demo is selling — it should be a standalone service the backend
calls, so it can be tested, timed, and improved independently.

## Stack

- **Framework**: FastAPI (own service, own port) — keeps it swappable and
  independently scalable/GPU-able
- **Speech-to-text**: OpenAI Whisper (run locally with `faster-whisper` for
  speed, or call an STT API if local GPU isn't available)
- **Reasoning / extraction**: Claude API (or another LLM) — one structured
  prompt that returns location, emergency type, severity, and a summary
- **NER fallback**: spaCy for lightweight entity extraction if the LLM call
  is slow/unavailable
- **Geocoding**: convert extracted location text → lat/lng (Google Geocoding
  API or Nominatim/OpenStreetMap for a free option)

## Pipeline

```
Audio bytes
   ↓
Whisper STT  →  transcript (text)
   ↓
LLM reasoning agent (structured prompt)
   ↓
{
  "location_text": "...",
  "lat": ..., "lng": ...,     ← after geocoding
  "emergency_type": "accident | fire | medical | crime | other",
  "severity": 1-5,
  "num_people_affected": int | null,
  "summary": "one-paragraph report for responders"
}
```

## LLM Reasoning Prompt (structure, not verbatim)

Design this as a single structured-output call:
- System instructions: define the JSON schema strictly, instruct the model
  to only output JSON, no preamble
- Input: the transcript
- Output: the schema above

Severity scoring should be **explainable** — give the model a short rubric
(e.g., number of people affected, keywords like "unconscious"/"bleeding"/
"trapped", emergency type) rather than a black-box score, so you can defend
it in Q&A.

## API Surface

| Method | Path | Purpose |
|---|---|---|
| POST | `/transcribe` | Audio in → transcript out (Whisper only) |
| POST | `/classify` | Transcript in → structured incident JSON |
| POST | `/process` | Audio in → full pipeline → structured incident JSON |

Backend will mostly call `/process` directly; exposing `/transcribe` and
`/classify` separately makes each stage independently testable/demoable.

## Reliability for Demo Day

- Add a timeout (e.g. 5s) on the LLM call; on failure, fall back to a
  keyword-based classifier (regex for "fire", "accident", "unconscious",
  etc.) so the pipeline never hard-fails live
- Cache geocoding results for known demo locations
- Log every stage's latency — useful both for debugging and as a "here's
  our response time" number for judges

## Suggested Folder Structure

```
ml-engine/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── transcribe.py
│   │   ├── classify.py
│   │   └── process.py
│   ├── services/
│   │   ├── stt.py           # Whisper wrapper
│   │   ├── reasoning.py     # LLM call + prompt template
│   │   ├── fallback.py      # keyword-based backup classifier
│   │   └── geocode.py
│   ├── schemas/
│   │   └── incident.py      # shared shape with backend schemas
│   └── config.py
├── tests/
└── requirements.txt
```

## Stretch Goals (if time allows)

- Multilingual STT (Whisper supports this natively) — strong demo point for
  an Indian hackathon context
- Confidence score alongside severity, shown in the responder dashboard
- Duplicate-incident detection (same location + time window) to avoid
  double-dispatching
