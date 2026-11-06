"use client";

import React, { useState } from "react";
import { 
  Heart, 
  Activity, 
  Sparkles, 
  ShieldAlert, 
  PlusCircle, 
  Flame, 
  Award, 
  TrendingDown 
} from "lucide-react";

export default function TrainingDashboard() {
  const [workouts, setWorkouts] = useState([
    {
      id: "run-fri-today",
      type: "run",
      date: "2026-11-06",
      title: "Friday Aerobic Anchor Run",
      durationMin: 70,
      distanceKm: 8.0,
      avgHr: 155,
      maxHr: 165,
      notes: "70-min continuous endurance milestone! Kept steady 8:45 pace."
    },
    {
      id: "run-wed",
      type: "run",
      date: "2026-11-04",
      title: "Midweek Base Run",
      durationMin: 29,
      distanceKm: 3.23,
      avgHr: 150,
      maxHr: 172,
      notes: "Steady Zone 2 baseline."
    },
    {
      id: "pilates-1",
      type: "pilates",
      date: "2026-11-03",
      title: "Reformer Pilates Core & Glute",
      durationMin: 37,
      distanceKm: null,
      avgHr: 131,
      maxHr: 148,
      notes: "Strong stability & hip strength."
    }
  ]);

  const [illnessMode, setIllnessMode] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const [newRun, setNewRun] = useState({
    type: "run",
    durationMin: "",
    distanceKm: "",
    avgHr: "",
    notes: ""
  });

  const HR_CEILING = 150;
  const RACE_DATE = new Date("2027-04-18");
  const PEAK_DATE = new Date("2027-02-28");
  const TODAY = new Date();

  const daysToRace = Math.ceil((RACE_DATE - TODAY) / (1000 * 60 * 60 * 24));
  const daysToPeak = Math.ceil((PEAK_DATE - TODAY) / (1000 * 60 * 60 * 24));

  const currentLongDistance = 8.0;
  const targetPeakDistance = 22.0;
  const progressPercent = Math.min(100, Math.round((currentLongDistance / targetPeakDistance) * 100));

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newRun.durationMin) return;

    const entry = {
      id: `run-${Date.now()}`,
      type: newRun.type,
      date: new Date().toISOString().split("T")[0],
      title: newRun.type === "run" ? "Training Run" : "Reformer Pilates",
      durationMin: parseFloat(newRun.durationMin),
      distanceKm: newRun.distanceKm ? parseFloat(newRun.distanceKm) : null,
      avgHr: newRun.avgHr ? parseInt(newRun.avgHr) : null,
      notes: newRun.notes || "Logged session."
    };

    setWorkouts([entry, ...workouts]);
    setShowLogModal(false);
    setNewRun({ type: "run", durationMin: "", distanceKm: "", avgHr: "", notes: "" });
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-24 space-y-4">
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Chch Half 2027 <Award className="w-5 h-5 text-teal-400" />
          </h1>
          <p className="text-xs text-slate-400">18 April 2027 • 22K Confidence Peak System</p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-3 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-md transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Quick Log
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Over-Distance Target: 22.0 km
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">Surpass Race Day Distance</h2>
            <p className="text-xs text-slate-400">Peak Window: Late Feb 2027 ({daysToPeak} days away)</p>
          </div>
          <span className="text-2xl font-black text-teal-400">{progressPercent}%</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-3 my-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-teal-500 via-sky-400 to-indigo-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 border-t border-slate-800/60 mt-2">
          <div className="text-teal-300 font-medium">8K (Today) ✓</div>
          <div className="text-slate-400">14K (Dec)</div>
          <div className="text-slate-400">18K (Jan)</div>
          <div className="text-amber-300 font-bold">22K (Feb Peak)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-teal-400 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-semibold">Aerobic Pace</span>
          </div>
          <div className="text-xl font-bold text-white">8:45 <span className="text-xs text-slate-400 font-normal">min/km</span></div>
          <p className="text-[10px] text-slate-400 mt-1">Goal: 7:15–7:30 min/km as stroke volume grows.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-rose-400 mb-1">
            <Heart className="w-4 h-4" />
            <span className="text-xs font-semibold">HR Ceiling</span>
          </div>
          <div className="text-xl font-bold text-white">150 <span className="text-xs text-slate-400 font-normal">BPM</span></div>
          <p className="text-[10px] text-slate-400 mt-1">Walk 30-45s when watch reads 151+.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${illnessMode ? "text-amber-400" : "text-slate-400"}`} />
          <div>
            <div className="text-xs font-semibold text-white">Illness / Fatigue Mode</div>
            <div className="text-[10px] text-slate-400">
              {illnessMode ? "Volume capped at 25-30m. Zero guilt." : "Standard weekly progression active."}
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

      <div className="bg-teal-950/40 border border-teal-800/50 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Flame className="w-3.5 h-3.5" /> Strategy Bite
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Over-distance builds bulletproof confidence:</strong> Conquering 22 km in late February proves your engine can exceed race distance. On race morning, 21.1 km will feel like a shorter workout.
        </p>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-slate-400" /> Recent Sessions
        </h3>

        {workouts.map((w) => (
          <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  w.type === "run" ? "bg-teal-500/20 text-teal-300" : "bg-purple-500/20 text-purple-300"
                }`}>
                  {w.type}
                </span>
                <span className="text-xs text-slate-400">{w.date}</span>
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">{w.title}</h4>
              <p className="text-[11px] text-slate-400">{w.notes}</p>
            </div>
            
            <div className="text-right">
              <div className="text-base font-bold text-white">{w.distanceKm ? `${w.distanceKm} km` : `${w.durationMin}m`}</div>
              <div className="text-xs text-slate-400">{w.durationMin} mins</div>
              {w.avgHr && (
                <div className={`text-[11px] font-medium flex items-center justify-end gap-1 ${
                  w.avgHr <= HR_CEILING ? "text-teal-400" : "text-amber-400"
                }`}>
                  <Heart className="w-3 h-3" /> {w.avgHr} bpm
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="text-base font-bold text-white">Quick Log Session</h3>
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewRun({...newRun, type: "run"})}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                    newRun.type === "run" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Run
                </button>
                <button
                  type="button"
                  onClick={() => setNewRun({...newRun, type: "pilates"})}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                    newRun.type === "pilates" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Pilates
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 70"
                  value={newRun.durationMin}
                  onChange={(e) => setNewRun({...newRun, durationMin: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              {newRun.type === "run" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Distance (km)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.00"
                      value={newRun.distanceKm}
                      onChange={(e) => setNewRun({...newRun, distanceKm: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Avg HR (bpm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={newRun.avgHr}
                      onChange={(e) => setNewRun({...newRun, avgHr: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Felt strong, good cadence"
                  value={newRun.notes}
                  onChange={(e) => setNewRun({...newRun, notes: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
