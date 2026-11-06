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
