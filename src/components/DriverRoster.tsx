import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Driver } from '../types/game';
import {
  User,
  Award,
  GraduationCap,
  Shield,
  Coffee,
  Activity,
  PlusCircle,
  Check,
  Zap,
  RefreshCw,
} from 'lucide-react';

export const DriverRoster: React.FC = () => {
  const { state, trainDriver, hireDriver, fireDriver } = useGame();
  const [showHireModal, setShowHireModal] = useState(false);

  const [candidatePool, setCandidatePool] = useState<any[]>([]);

  const generateCandidates = () => {
    const firstNames = ['Marcus', 'Elena', 'Lucas', 'Sarah', 'Viktor', 'Hans', 'Chiara', 'Mateo', 'Darius', 'Sofia', 'Hiroshi', 'Kaito', 'Astrid', 'Bjorn', 'Guillaume', 'Camille', 'Javier', 'Carmen', 'Krzysztof', 'Zofia', 'Liam', 'Chloe', 'Oliver', 'Mia', 'Gabriel', 'Nadia'];
    const lastNames = ['Vance', 'Alvarez', 'Rossi', 'Schmidt', 'Weber', 'Dubois', 'Lefevre', 'Novak', 'Kovacs', 'Jensen', 'Larsson', 'Tanaka', 'Sato', 'Moreau', 'Santos', 'Garcia', 'Wagner', 'Becker', 'Popov', 'Andersen', 'O’Connor', 'Van Der Berg', 'Dubov', 'Miller'];
    const avatars = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
    ];

    const ownedHubs = state.hubs.filter(h => h.isUnlocked);
    const availableHubIds = ownedHubs.length > 0 ? ownedHubs.map(h => h.id) : ['hub-seattle'];
    const pool = [];
    const usedNames = new Set();

    while (pool.length < 3) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${fName} ${lName}`;
      if (usedNames.has(fullName)) continue;
      usedNames.add(fullName);

      const exp = Math.floor(Math.random() * 14) + 2;
      const wage = Number((0.38 + exp * 0.01).toFixed(2));
      const retainer = Math.round(90 + exp * 3);
      const hubId = availableHubIds[Math.floor(Math.random() * availableHubIds.length)];

      pool.push({
        name: fullName,
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        experienceYears: exp,
        wagePerKmUsd: wage,
        dailyRetainerUsd: retainer,
        homeHubId: hubId,
        stats: {
          ecoDrivingRating: Math.floor(Math.random() * 15) + 82,
          mechanicalSympathy: Math.floor(Math.random() * 15) + 82,
          mountainCert: Math.random() > 0.4,
          winterCert: Math.random() > 0.5,
          hazmatCert: Math.random() > 0.6,
          fatiguePercent: 0,
          totalKmDriven: exp * 10000 + Math.floor(Math.random() * 20000),
          deliveriesCompleted: exp * 8 + Math.floor(Math.random() * 15),
          safetyScore: Math.floor(Math.random() * 6) + 94,
        },
      });
    }
    setCandidatePool(pool);
  };

  useEffect(() => {
    generateCandidates();
  }, [showHireModal]);

  return (
    <div className="space-y-8">
      {/* Header & Hire Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span>Driver Crew Roster & Tachograph Telemetry ({state.drivers.length} Drivers)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor digital tachograph hours of service, fatigue management, and advance professional credentials.
          </p>
        </div>

        <button
          onClick={() => setShowHireModal(!showHireModal)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Recruit Crew</span>
        </button>
      </div>

      {/* Recruitment Agency Modal/Drawer */}
      {showHireModal && (
        <div className="p-5 bg-slate-900 border border-amber-500/40 rounded-xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase text-amber-400">
              Commercial Driver Recruitment Pool ($2,500 Onboarding Fee)
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={generateCandidates}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Candidates</span>
              </button>
              <button
                onClick={() => setShowHireModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidatePool.map((candidate, i) => (
              <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={candidate.avatar}
                    alt={candidate.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{candidate.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {candidate.experienceYears} yrs exp · ${candidate.wagePerKmUsd}/km
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div>Eco-Score: {candidate.stats.ecoDrivingRating}/100</div>
                  <div>Mechanical Care: {candidate.stats.mechanicalSympathy}/100</div>
                  <div className="flex gap-2 text-[10px] text-amber-400">
                    {candidate.stats.mountainCert && <span>Mountain</span>}
                    {candidate.stats.winterCert && <span>Winter</span>}
                    {candidate.stats.hazmatCert && <span>Hazmat</span>}
                  </div>
                </div>

                <button
                  onClick={() => {
                    hireDriver(candidate);
                    setShowHireModal(false);
                  }}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Hire & Induct
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.drivers.map((driver) => {
          const homeHub = state.hubs.find((h) => h.id === driver.homeHubId);
          const assignedTruck = state.trucks.find((t) => t.id === driver.assignedTruckId);
          const isDriving = driver.hosStatus === 'driving';
          const isResting = driver.hosStatus === 'resting';

          const driveHoursLeft = ((270 - driver.continuousDriveMinutes) / 60).toFixed(1);

          return (
            <div
              key={driver.id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition-all shadow-lg"
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={driver.avatar}
                    alt={driver.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{driver.name}</h4>
                    <p className="text-xs text-slate-400">
                      {driver.experienceYears} Years Long-Haul Experience
                    </p>
                    <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                      ${driver.wagePerKmUsd}/km · ${driver.dailyRetainerUsd}/day retainer
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div>
                  {isDriving ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Activity className="w-3 h-3 animate-pulse" />
                      DRIVING
                    </span>
                  ) : isResting ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Coffee className="w-3 h-3" />
                      RESTING
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                      OFF-DUTY
                    </span>
                  )}
                </div>
              </div>

              {/* Tachograph & Hours of Service (HOS) Gauge */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Continuous Shift (Max 4.5h)</span>
                  <span className="text-white font-bold tabular-nums">
                    {Math.round(driver.continuousDriveMinutes)} / 270 min
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      driver.continuousDriveMinutes > 220 ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, (driver.continuousDriveMinutes / 270) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>{isDriving ? `${driveHoursLeft}h until required 45m break` : 'Tachograph reset'}</span>
                  <span>Daily: {Math.round(driver.dailyDriveMinutes)}/540m</span>
                </div>
              </div>

              {/* Telemetry Ratings */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 bg-slate-950/50 border border-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Eco Score</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {driver.stats.ecoDrivingRating}/100
                  </span>
                </div>

                <div className="p-2 bg-slate-950/50 border border-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Mechanic</span>
                  <span className="font-bold text-sky-400 tabular-nums">
                    {driver.stats.mechanicalSympathy}/100
                  </span>
                </div>

                <div className="p-2 bg-slate-950/50 border border-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase">Deliveries</span>
                  <span className="font-bold text-white tabular-nums">
                    {driver.stats.deliveriesCompleted}
                  </span>
                </div>
              </div>

              {/* Certifications & Training Academy */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Authorized Certifications</span>
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {driver.stats.mountainCert ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Check className="w-3 h-3" /> Mountain Master
                    </span>
                  ) : (
                    <button
                      onClick={() => trainDriver(driver.id, 'mountain')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      + Mountain ($2,800)
                    </button>
                  )}

                  {driver.stats.winterCert ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Check className="w-3 h-3" /> Severe Winter
                    </span>
                  ) : (
                    <button
                      onClick={() => trainDriver(driver.id, 'winter')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      + Winter ($3,200)
                    </button>
                  )}

                  {driver.stats.hazmatCert ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Check className="w-3 h-3" /> ADR Hazmat
                    </span>
                  ) : (
                    <button
                      onClick={() => trainDriver(driver.id, 'hazmat')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      + Hazmat ($4,500)
                    </button>
                  )}

                  {driver.stats.ecoDrivingRating < 95 && (
                    <button
                      onClick={() => trainDriver(driver.id, 'eco')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                    >
                      + Eco Academy ($1,800)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
