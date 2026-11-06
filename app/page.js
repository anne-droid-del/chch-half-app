"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  Heart, 
  Sparkles, 
  ShieldAlert, 
  Award, 
  TrendingUp,
  Activity as ActivityIcon,
  Upload,
  FileText,
  CheckCircle2
} from "lucide-react";

const START = "2026-07-06";
const DATA_START = "2026-01-01";
const RACE_DATE = "2027-04-18";
const PEAK_TARGET_KM = 22.0;

// 41-Week progression featuring the 22.0 km peak in Week 35
const WEEKS = [
  [5,6,10],[6,6,11],[6,7,11],[5,6,9],[6,7,12],[6,7,12],[7,7,13],[6,6,10],[7,7,13],[7,8,14],[7,8,14],[6,7,11],
  [7,8,14],[7,8,15],[6,7,12],[8,8,15],[8,9,16],[7,8,13],[8,9,16],[8,9,17],[7,8,14],[8,9,17],[8,9,17],[7,8,14],
  [6,7,12],[7,7,13],[6,7,11],
  [7,8,14],[8,9,16],[7,8,13],[8,9,17],[8,9,18],[7,8,14],[8,9,20],[7,9,22],[7,8,15],[8,9,18],[7,9,20],[7,8,15],[6,6,10],[5,4,21.1],
];

const PHASES = [
  { name: "Recalibrate", from: 1, to: 12, dates: "Jul–Sep", focus: "Slow down and make easy running genuinely easy." },
  { name: "Build", from: 13, to: 24, dates: "Sep–Dec", focus: "Build endurance and introduce one controlled steady section." },
  { name: "Maintain", from: 25, to: 27, dates: "Christmas", focus: "Keep the rhythm without chasing volume over the holidays." },
  { name: "Half-specific", from: 28, to: 41, dates: "Jan–race day", focus: "Practise race effort, peak at 22 km in late Feb, then taper." },
];

const phaseFor = (week) => PHASES.find(p => week >= p.from && week <= p.to);
const cutbacks = new Set([4,8,12,15,18,21,24,27,30,33,36,39,40]);
const DEFAULTS = { ceiling: 150, floor: 136, maxHr: 188, restHr: 59 };

const INITIAL_ACTIVITIES = [
  {
    id: "run-2026-11-06-anchor",
    date: "2026-11-06",
    type: "run",
    kind: "long",
    km: 8.0,
    min: 70.0,
    avgHr: 155,
    maxHr: 165,
    note: "Friday Aerobic Anchor Run. 70m continuous milestone at 8:45 pace."
  },
  {
    id: "run-2026-11-04-midweek",
    date: "2026-11-04",
    type: "run",
    kind: "easy",
    km: 3.23,
    min: 29.0,
    avgHr: 150,
    maxHr: 172,
    note: "Midweek base run."
  }
];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const date = (s) => new Date(`${s}T12:00:00`);
const add = (s, n) => { const d = date(s); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const nice = (s) => date(s).toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" });
const pace = (a) => a.km && a.min ? a.min / a.km : 0;
const aerobicEfficiency = (a) => a.avgHr && a.min && a.km ? ((a.km * 1000) / a.min) / a.avgHr : 0;
const paceText = (p) => { 
  if (!p) return "—"; 
  let m = Math.floor(p), s = Math.round((p - m) * 60); 
  if (s === 60) { m++; s = 0; } 
  return `${m}:${String(s).padStart(2, "0")}/km`; 
};
const weekMonday = (s) => { const d = date(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };

const PLAN = WEEKS.flatMap((kms, i) => {
  const mon = add(START, i * 7), week = i + 1;
  const phase = phaseFor(week).name;
  const quality = phase === "Build" ? "Easy + steady section" : phase === "Half-specific" && week < 40 ? (week % 2 ? "Tempo intervals" : "Easy + controlled tempo") : "Easy run";
  return [
    { date: mon, week, phase, kind: "easy", km: kms[0], label: week === 9 ? "Easy + 4 × 20-sec strides" : "Easy run" },
    { date: add(mon, 2), week, phase, kind: "easy", km: kms[1], label: quality },
    { date: week === 41 ? RACE_DATE : add(mon, 4), week, phase, kind: (week === 41 ? "hard" : "long"), km: kms[2], label: week === 41 ? "Christchurch Half Marathon" : week === 35 ? "22 km Peak Endurance Milestone" : [34, 37, 38].includes(week) ? "Long + controlled finish" : "Long run" },
  ];
});

function parseDuration(raw) {
  const p = raw.trim().split(":").map(Number);
  if (p.some(Number.isNaN)) return 0;
  if (p.length === 3) return p[0] * 60 + p[1] + p[2] / 60;
  if (p.length === 2) return p[0] + p[1] / 60;
  return p[0] || 0;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseGPX(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  const trkpts = Array.from(xml.querySelectorAll("trkpt"));
  if (!trkpts.length) throw new Error("No track points found in file");

  let totalKm = 0;
  let hrList = [];
  let startTime = null;
  let endTime = null;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute("lat"));
    const lon = parseFloat(pt.getAttribute("lon"));
    const timeNode = pt.querySelector("time");
    
    if (timeNode) {
      const t = new Date(timeNode.textContent);
      if (!startTime) startTime = t;
      endTime = t;
    }

    if (i > 0) {
      const prev = trkpts[i - 1];
      const pLat = parseFloat(prev.getAttribute("lat"));
      const pLon = parseFloat(prev.getAttribute("lon"));
      totalKm += haversine(pLat, pLon, lat, lon);
    }

    const hrNode = pt.querySelector("hr") || pt.querySelector("ns3\\:hr") || pt.querySelector("HeartRateBpm value");
    if (hrNode) {
      const hr = parseInt(hrNode.textContent, 10);
      if (!isNaN(hr) && hr > 40 && hr < 230) hrList.push(hr);
    }
  }

  const durationMin = startTime && endTime ? Math.max(1, (endTime - startTime) / 60000) : 0;
  const avgHr = hrList.length ? Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length) : undefined;
  const maxHr = hrList.length ? Math.max(...hrList) : undefined;
  const runDate = startTime ? iso(startTime) : today();

  return {
    km: Math.round(totalKm * 100) / 100,
    min: Math.round(durationMin * 10) / 10,
    avgHr,
    maxHr,
    date: runDate
  };
}

function PaceHeartChart({ values, ceiling }) {
  const [selected, setSelected] = useState(null);
  if (!values.length) return <div className="empty-chart">No runs with pace and heart-rate data yet.</div>;
  const w = Math.max(620, values.length * 62), h = 205, p = 28;
  const paceLo = Math.min(...values.map(v => v.pace)) - 0.15, paceHi = Math.max(...values.map(v => v.pace)) + 0.15;
  const hrLo = Math.min(...values.map(v => v.hr), ceiling) - 4, hrHi = Math.max(...values.map(v => v.hr), ceiling) + 4;
  const x = (i) => values.length === 1 ? w / 2 : p + i * (w - p * 2) / (values.length - 1);
  const paceY = (v) => p + (v - paceLo) * (h - p * 2) / (paceHi - paceLo);
  const hrY = (v) => h - p - (v - hrLo) * (h - p * 2) / (hrHi - hrLo);
  const pacePts = values.map((v, i) => `${x(i)},${paceY(v.pace)}`).join(" ");
  const hrPts = values.map((v, i) => `${x(i)},${hrY(v.hr)}`).join(" ");
  const ceilingY = hrY(ceiling);

  return (
    <>
      <div className="chart-legend">
        <span className="pace-key">● Pace · min/km</span>
        <span className="hr-key">● Heart rate · bpm</span>
      </div>
      <div className="spark-scroll">
        <svg className="combined-chart" width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: `${w}px`, height: `${h}px`, maxWidth: "none", overflow: "hidden" }} role="img" aria-label="Combined pace and heart-rate graph.">
          <rect x="0" y="0" width={w} height={h} rx="14" fill="#fffaf7" />
          {[0.25, 0.5, 0.75].map(n => <line key={n} x1={p} x2={w - p} y1={p + (h - p * 2) * n} y2={p + (h - p * 2) * n} stroke="#e8e4df" strokeWidth="1" />)}
          <line x1={p} x2={w - p} y1={ceilingY} y2={ceilingY} stroke="#ec6a47" strokeWidth="2" strokeDasharray="6 5" />
          <text x={w - p} y={ceilingY - 6} textAnchor="end" fill="#ec6a47" fontSize="10">{ceiling} bpm ceiling</text>
          <text x={p} y={17} fill="#a95359" fontSize="10" fontWeight="700">faster pace ↑</text>
          <text x={w - p} y={17} textAnchor="end" fill="#47796e" fontSize="10" fontWeight="700">higher HR ↑</text>
          {values.length > 1 && (
            <>
              <polyline points={pacePts} fill="none" stroke="#b85d69" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={hrPts} fill="none" stroke="#47796e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {values.map((v, i) => (
            <g key={`${v.date}-${i}`}>
              <circle cx={x(i)} cy={paceY(v.pace)} r={selected?.date === v.date ? 8 : 6} fill="#b85d69" stroke="#fff" strokeWidth="3" className="tappable" onClick={() => setSelected(v)} />
              <circle cx={x(i)} cy={hrY(v.hr)} r={selected?.date === v.date ? 8 : 6} fill={v.hr > ceiling ? "#d7a949" : "#47796e"} stroke="#fff" strokeWidth="3" className="tappable" onClick={() => setSelected(v)} />
            </g>
          ))}
        </svg>
      </div>
      {selected && (
        <div className="run-popover">
          <button aria-label="Close run details" onClick={() => setSelected(null)}>×</button>
          <span>{nice(selected.date)}</span>
          <b>{selected.km.toFixed(1)} km · {paceText(selected.pace)}</b>
          <small>{selected.hr} bpm average</small>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const [tab, setTab] = useState("today");
  const [acts, setActs] = useState([]);
  const [settings, setSettings] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [viewWeek, setViewWeek] = useState(null);
  const [planAdjustments, setPlanAdjustments] = useState({});
  const [illnessMode, setIllnessMode] = useState(false);
  const [form, setForm] = useState({ date: today(), kind: "easy", km: "", time: "", hr: "", note: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("half-activities") || "[]");
      setActs(saved.length > 0 ? saved.filter(a => a.date >= DATA_START) : INITIAL_ACTIVITIES);
      setSettings({ ...DEFAULTS, ...JSON.parse(localStorage.getItem("half-settings") || "{}") });
      const stored = JSON.parse(localStorage.getItem("half-plan-adjustments") || "{}");
      setPlanAdjustments(Object.fromEntries(Object.entries(stored).filter(([, change]) => change > 0)));
    } catch {
      setActs(INITIAL_ACTIVITIES);
    }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem("half-activities", JSON.stringify(acts)); }, [acts, ready]);
  useEffect(() => { if (ready) localStorage.setItem("half-settings", JSON.stringify(settings)); }, [settings, ready]);
  useEffect(() => { if (ready) localStorage.setItem("half-plan-adjustments", JSON.stringify(planAdjustments)); }, [planAdjustments, ready]);

  const flash = (s) => { setToast(s); setTimeout(() => setToast(""), 3500); };
  const runs = useMemo(() => acts.filter(a => a.type === "run").sort((a, b) => a.date.localeCompare(b.date)), [acts]);

  const adaptivePlan = useMemo(() => PLAN.map(s => ({
    ...s,
    km: planAdjustments[s.week] != null && s.week < 41
      ? Math.round(Math.max(3, s.km * (1 + planAdjustments[s.week])) * 2) / 2
      : s.km
  })), [planAdjustments]);

  const matched = useMemo(() => {
    const assigned = new Map(), usedIds = new Set(), usedRunDates = new Set();
    adaptivePlan.forEach(s => {
      const candidates = runs.filter(r => !usedIds.has(r.id) && !usedRunDates.has(r.date) && r.date === s.date);
      const run = candidates.sort((a, b) => Math.abs(a.km - s.km) - Math.abs(b.km - s.km))[0];
      if (run) { assigned.set(s.date, run); usedIds.add(run.id); usedRunDates.add(run.date); }
    });
    adaptivePlan.forEach(s => {
      if (assigned.has(s.date) || s.date > today()) return;
      const run = runs.filter(r => !usedIds.has(r.id) && !usedRunDates.has(r.date) && r.date <= today() && weekMonday(r.date) === weekMonday(s.date) && r.kind === s.kind)
        .sort((a, b) => Math.abs(date(a.date).getTime() - date(s.date).getTime()) - Math.abs(date(b.date).getTime() - date(s.date).getTime()))[0];
      if (run) { assigned.set(s.date, run); usedIds.add(run.id); usedRunDates.add(run.date); }
    });
    return adaptivePlan.map(s => ({ ...s, run: assigned.get(s.date) }));
  }, [runs, adaptivePlan]);

  const currentWeek = Math.min(41, Math.max(1, Math.floor((date(today()).getTime() - date(START).getTime()) / 604800000) + 1));
  const currentPhase = phaseFor(currentWeek);
  const raceDays = Math.max(0, Math.ceil((date(RACE_DATE).getTime() - date(today()).getTime()) / 86400000));
  const next = matched.find(s => !s.run && s.date >= today()) || matched.find(s => !s.run) || matched[matched.length - 1];
  const thisWeek = matched.filter(s => s.week === currentWeek);
  const complete = thisWeek.filter(s => s.run).length;
  const shownWeek = viewWeek ?? currentWeek;
  const shownPhase = phaseFor(shownWeek);
  const shownSessions = matched.filter(s => s.week === shownWeek);

  const easyPaceRuns = runs.filter(a => a.kind !== "hard" && a.avgHr && pace(a));
  const graphRuns = runs.filter(a => a.avgHr && pace(a));

  const longestBankedRun = runs.length ? Math.max(...runs.map(r => r.km)) : 8.0;
  const peakProgressPercent = Math.min(100, Math.round((longestBankedRun / PEAK_TARGET_KM) * 100));

  const efficiencyRuns = easyPaceRuns.filter(a => aerobicEfficiency(a) > 0);
  const efficiencyWindow = Math.min(5, Math.floor(efficiencyRuns.length / 2));
  const efficiencyEarlier = efficiencyWindow >= 2 ? efficiencyRuns.slice(-(efficiencyWindow * 2), -efficiencyWindow) : [];
  const efficiencyRecent = efficiencyWindow >= 2 ? efficiencyRuns.slice(-efficiencyWindow) : [];
  const meanEfficiency = (items) => items.length ? items.reduce((n, a) => n + aerobicEfficiency(a), 0) / items.length : 0;
  const earlierScore = meanEfficiency(efficiencyEarlier);
  const recentScore = meanEfficiency(efficiencyRecent);
  const efficiencyChange = earlierScore ? ((recentScore / earlierScore) - 1) * 100 : null;

  const latestEasy = easyPaceRuns.at(-1);
  const comparableEasy = latestEasy 
    ? [...easyPaceRuns.slice(0, -1)].reverse().find(a => Math.abs((a.avgHr || 0) - (latestEasy.avgHr || 0)) <= 3) 
    : undefined;
  const paceGain = latestEasy && comparableEasy 
    ? Math.round((pace(comparableEasy) - pace(latestEasy)) * 60) 
    : null;

  function saveRun() {
    const km = +form.km, min = parseDuration(form.time);
    if (!km || !min) return flash("Add the distance and time first.");
    setActs(a => [...a, { id: `manual-${Date.now()}`, date: form.date, type: "run", kind: form.kind, km, min, avgHr: +form.hr || undefined, note: form.note }]);
    setForm({ ...form, km: "", time: "", hr: "", note: "" });
    flash("Run banked — nice work.");
    setTab("today");
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseGPX(text);
        setActs(current => [
          ...current,
          {
            id: `gpx-${Date.now()}`,
            date: parsed.date,
            type: "run",
            kind: parsed.km >= 8 ? "long" : "easy",
            km: parsed.km,
            min: parsed.min,
            avgHr: parsed.avgHr,
            maxHr: parsed.maxHr,
            note: `Samsung Health GPX (${parsed.km} km)`
          }
        ]);
        flash(`Banked ${parsed.km} km from Samsung Health!`);
        setTab("today");
      } catch (err) {
        flash("Could not parse file. Make sure it's a valid GPX.");
      }
    };
    reader.readAsText(file);
  }

  if (!ready) return <main className="loading">Opening your training log…</main>;

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-top">
          <div>
            <p className="eyebrow">Christchurch Half · 18 April 2027</p>
            <h1>Run steady.<br /><em>Finish strong.</em></h1>
          </div>
          <div className="week-orbit">
            <strong>{currentWeek}</strong>
            <span>week<br />of 41</span>
          </div>
        </div>
        <p className="purpose">{currentPhase.name} phase · {raceDays} days to race day. Keep easy days easy and let the engine grow.</p>
      </header>

      <section className="content">
        {tab === "today" && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex justify-between items-center text-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-5 h-5 ${illnessMode ? "text-amber-400" : "text-slate-400"}`} />
                <div>
                  <div className="text-xs font-bold">{illnessMode ? "Illness / Fatigue Mode Active" : "Standard Training Mode"}</div>
                  <div className="text-[11px] text-slate-400">
                    {illnessMode ? "Volume capped at 25–30m. Zero guilt." : "Weekly progression active."}
                  </div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={illnessMode}
                onChange={() => setIllnessMode(!illnessMode)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <article className="panel adaptive-card progress">
              <div className="adaptive-head">
                <div>
                  <span className="text-teal-600 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 22.0 km Over-Distance Target
                  </span>
                  <h2>Surpass Race Day Distance</h2>
                </div>
                <div className="adaptive-mark text-teal-700">{peakProgressPercent}%</div>
              </div>
              <p>Late February peak target. Building endurance beyond 21.1 km makes race day feel shorter.</p>
              
              <div className="w-full bg-slate-200 rounded-full h-3 my-2 overflow-hidden">
                <div 
                  className="bg-teal-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${peakProgressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1 text-[11px] text-center pt-2 border-t border-slate-200 mt-2 font-medium">
                <div className="text-teal-700 font-bold">8.0K (Banked) ✓</div>
                <div className="text-slate-500">14K (Dec)</div>
                <div className="text-slate-500">18K (Jan)</div>
                <div className="text-amber-600 font-bold">22K (Feb Peak)</div>
              </div>
            </article>

            <article className="next-card">
              <div className="next-head">
                <span className="pill">Your next run</span>
                <span>{nice(next.date)}</span>
              </div>
              <div className="run-brief">
                <div>
                  <small>{next.label.toUpperCase()}</small>
                  <strong>{illnessMode ? "3.5" : next.km}<i>km</i></strong>
                </div>
                <div className="hr-target">
                  <span>{next.week === 41 ? "Race" : "Your ceiling"}</span>
                  <b>{next.week === 41 ? "21.1" : settings.ceiling}</b>
                  <span>{next.week === 41 ? "km" : "bpm"}</span>
                </div>
              </div>
              <p>
                {illnessMode 
                  ? "Gentle recovery jog only. Keep effort conversational and walk immediately if heart rate exceeds 140."
                  : next.week === 41 
                    ? "Start conservatively, settle into your rhythm, and finish strong." 
                    : next.kind === "long" 
                      ? "Keep this conversational. Distance is the goal; pace is not. Walk 30–45s if your watch shows 151+ bpm." 
                      : "Relax your pace whenever your heart rate rises. Easy running builds stroke volume."}
              </p>
              <button className="primary" onClick={() => setTab("log")}>Log a run <span>→</span></button>
            </article>

            {latestEasy && (
              <article className="pace-glance">
                <div>
                  <span>Latest easy run</span>
                  <b>{paceText(pace(latestEasy))}</b>
                  <small>{latestEasy.avgHr} bpm · {nice(latestEasy.date)}</small>
                </div>
                <div className={paceGain !== null && paceGain > 0 ? "pace-change improving" : "pace-change"}>
                  <span>Aerobic Adaptation</span>
                  <b>
                    {paceGain === null 
                      ? "Building baseline..." 
                      : paceGain > 0 
                        ? `${paceGain}s/km faster` 
                        : paceGain < 0 
                          ? `${Math.abs(paceGain)}s/km slower` 
                          : "Identical pace"}
                  </b>
                  <small>
                    {comparableEasy 
                      ? `At same heart rate (~${comparableEasy.avgHr} bpm) vs ${nice(comparableEasy.date)}` 
                      : "Matches your runs at identical heart-rate zones"}
                  </small>
                </div>
              </article>
            )}

            <div className="stat-grid">
              <article>
                <span>This week</span>
                <b>{complete}<i>/ 3</i></b>
                <small>runs banked</small>
              </article>
              <article>
                <span>Aerobic Ceiling</span>
                <b>{settings.ceiling}<i> bpm</i></b>
                <small>Watch limit</small>
              </article>
              <article>
                <span>Pace Evolution</span>
                <b>7:15<i>–7:30</i></b>
                <small>Goal at 150 bpm</small>
              </article>
            </div>

            <article className="week-card">
              <div className="section-title">
                <div>
                  <span>{shownPhase.name} · Week {shownWeek}</span>
                  <h2>{shownWeek === 41 ? "Race week" : "Your three runs"}</h2>
                </div>
                <span>{WEEKS[shownWeek - 1].reduce((a, b) => a + b, 0).toFixed(shownWeek === 41 ? 1 : 0)} km planned</span>
              </div>
              {shownSessions.map((s, i) => (
                <div className="session" key={s.date}>
                  <span className={s.run ? "check done" : "check"}>{s.run ? "✓" : i + 1}</span>
                  <div>
                    <b>{nice(s.date)} · {s.label}</b>
                    <small>{s.run ? `${s.run.km.toFixed(1)} km · ${paceText(pace(s.run))}${s.run.avgHr ? ` · ${s.run.avgHr} bpm` : ""}` : `${s.km} km planned`}</small>
                  </div>
                  {s.run && s.run.avgHr && s.run.kind !== "hard" && (
                    <span className={(s.run.avgHr || 0) <= settings.ceiling ? "status good" : "status warm"}>
                      {(s.run.avgHr || 0) <= settings.ceiling ? "in zone" : "warm"}
                    </span>
                  )}
                </div>
              ))}
            </article>
          </>
        )}

        {tab === "plan" && (
          <article className="panel">
            <div className="section-title">
              <div>
                <span>To 18 April 2027</span>
                <h2>Your complete 41-week plan (22 km Peak)</h2>
              </div>
            </div>
            <p className="intro">Three runs per week across four phases, incorporating your late-February 22 km over-distance peak.</p>
            {PHASES.map(phase => (
              <section className="phase-block" key={phase.name}>
                <div className="phase-heading">
                  <div><span>{phase.dates}</span><h3>{phase.name}</h3></div>
                  <p>{phase.focus}</p>
                </div>
                {WEEKS.slice(phase.from - 1, phase.to).map((w, offset) => {
                  const wk = phase.from + offset, rows = matched.filter(s => s.week === wk), done = rows.filter(s => s.run).length, total = rows.reduce((n, r) => n + r.km, 0);
                  return (
                    <details key={wk} open={wk === currentWeek}>
                      <summary>
                        <span className={done === 3 ? "week-num complete" : "week-num"}>{done === 3 ? "✓" : wk}</span>
                        <div>
                          <b>Week {wk}{cutbacks.has(wk) ? " · cutback" : wk === 41 ? " · race week" : wk === 35 ? " · 22 km PEAK" : ""}</b>
                          <small>{total.toFixed(wk === 41 ? 1 : 0)} km · {done}/3 complete</small>
                        </div>
                        <span>⌄</span>
                      </summary>
                      <div className="plan-rows">
                        {rows.map(r => (
                          <div key={r.date}>
                            <span>{nice(r.date)}</span>
                            <b>{r.label} · {r.km} km</b>
                            <span>{r.run ? "✓ Banked" : "Planned"}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </section>
            ))}
          </article>
        )}

        {tab === "log" && (
          <>
            <article className="panel" style={{ background: "linear-gradient(145deg, #f0f8f5, #ffffff)", border: "2px dashed #2f8270" }}>
              <div className="section-title">
                <div>
                  <span style={{ color: "#2f8270", fontWeight: "800" }}>Fast Import</span>
                  <h2>Drop Samsung Health GPX</h2>
                </div>
                <Upload className="w-6 h-6 text-teal-700" />
              </div>
              <p className="intro" style={{ margin: "8px 0 14px" }}>
                Export your workout from Samsung Health as a GPX file and tap below. We'll automatically pull the distance, duration, splits, and heart rate.
              </p>
              <input 
                type="file" 
                accept=".gpx" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: "none" }} 
              />
              <button 
                className="primary" 
                style={{ background: "#2f8270" }}
                onClick={() => fileInputRef.current?.click()}
              >
                Select GPX File from Phone <span>↑</span>
              </button>
            </article>

            <article className="panel form-panel">
              <div className="section-title">
                <div><span>Manual Log</span><h2>Or enter details manually</h2></div>
              </div>
              <label>Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
              <div className="segmented">
                {["easy", "long", "hard"].map(k => (
                  <button className={form.kind === k ? "active" : ""} onClick={() => setForm({ ...form, kind: k })} key={k}>
                    {k === "hard" ? "Hard / race" : k}
                  </button>
                ))}
              </div>
              <div className="two">
                <label>Distance (km)<input inputMode="decimal" placeholder="8.0" value={form.km} onChange={e => setForm({ ...form, km: e.target.value })} /></label>
                <label>Time<input placeholder="70:00" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label>
              </div>
              <label>Average heart rate (bpm)<input inputMode="numeric" placeholder="150" value={form.hr} onChange={e => setForm({ ...form, hr: e.target.value })} /></label>
              <label>Notes<input placeholder="Felt relaxed, cadence, weather..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
              <button className="primary" onClick={saveRun}>Bank this run <span>✓</span></button>
            </article>
          </>
        )}

        {tab === "progress" && (
          <>
            <article className="panel efficiency-card">
              <div className="section-title">
                <div>
                  <span>Cardiovascular Adaptation</span>
                  <h2>Aerobic Efficiency Index</h2>
                </div>
                <span>Speed vs Heart Rate</span>
              </div>
              {efficiencyChange !== null ? (
                <>
                  <div className={`efficiency-result ${efficiencyChange > 0.5 ? "up" : efficiencyChange < -0.5 ? "down" : "steady"}`}>
                    <div>
                      <small>Engine Improvement</small>
                      <b>{efficiencyChange > 0 ? "+" : ""}{efficiencyChange.toFixed(1)}%</b>
                      <span>{efficiencyChange > 0.5 ? "More speed produced per heartbeat" : "Holding steady"}</span>
                    </div>
                  </div>
                  <p className="efficiency-detail">
                    Measuring metres traveled per minute divided by heart rate. As your stroke volume expands, this score climbs upward.
                  </p>
                </>
              ) : (
                <div className="efficiency-baseline">
                  <b>{efficiencyRuns.length} of 4 runs with heart rate</b>
                  <span>Keep logging runs with heart rate to unlock your overall aerobic trend.</span>
                </div>
              )}
            </article>

            <article className="panel pace-panel">
              <div className="section-title">
                <div><span>Dual-Curve Tracking</span><h2>Same Effort. Faster Pace.</h2></div>
              </div>
              <PaceHeartChart values={graphRuns.map(r => ({ date: r.date, km: r.km, pace: pace(r), hr: r.avgHr }))} ceiling={settings.ceiling} />
              <p className="chart-note">
                Pink line is pace (higher is faster); green line is heart rate. As your engine adapts, the pink line climbs while the green line stays flat beneath 150 bpm.
              </p>
            </article>
          </>
        )}

        {tab === "more" && (
          <article className="panel">
            <div className="section-title">
              <div><span>Custom Thresholds</span><h2>Heart-Rate Parameters</h2></div>
            </div>
            <div className="two">
              <label>Aerobic Ceiling (bpm)
                <input inputMode="numeric" value={settings.ceiling} onChange={e => setSettings({ ...settings, ceiling: +e.target.value || settings.ceiling })} />
              </label>
              <label>Aerobic Floor (bpm)
                <input inputMode="numeric" value={settings.floor} onChange={e => setSettings({ ...settings, floor: +e.target.value || settings.floor })} />
              </label>
            </div>
          </article>
        )}
      </section>

      <nav className="bottom-nav">
        <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>
          <span>📅</span>Today
        </button>
        <button className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}>
          <span>📋</span>Plan
        </button>
        <button className={tab === "log" ? "active" : ""} onClick={() => setTab("log")}>
          <span>➕</span>Log
        </button>
        <button className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}>
          <span>📈</span>Progress
        </button>
        <button className={tab === "more" ? "active" : ""} onClick={() => setTab("more")}>
          <span>⚙️</span>Settings
        </button>
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
