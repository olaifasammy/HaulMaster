import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { GeoRegion, TruckModelId, TrailerModelId, FleetLivery } from '../types/game';
import { TRUCK_MODELS, TRAILER_MODELS, LIVERY_PALETTES } from '../constants/gameData';
import {
  Globe,
  Route,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FastForward,
  ShieldCheck,
  Fuel,
  Sparkles,
  Weight,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { state, completeOnboarding, skipOnboarding } = useGame();

  const [step, setStep] = useState<number>(1);
  const [selectedRegion, setSelectedRegion] = useState<GeoRegion>('North America');
  const [primaryHubId, setPrimaryHubId] = useState<string>('hub-denver');
  // Automatically connect a primary destination hub at startup for immediate active jobs
  const [connectedLocationId, setConnectedLocationId] = useState<string>('hub-chicago');
  const [companyName, setCompanyName] = useState<string>('Apex Continental Freight');
  // Free starter commercial vehicle is the Rigid truck (metro-320)
  const [starterTruckId, setStarterTruckId] = useState<TruckModelId>('metro-320');
  const [starterTrailerId, setStarterTrailerId] = useState<TrailerModelId>('dry-van-53');
  const [starterLivery, setStarterLivery] = useState<FleetLivery>('obsidian_slate');

  // Filter hubs based on region (show medium regional hubs for startup inspiration)
  const regionHubs = state.hubs.filter((h) => h.region === selectedRegion && h.locationType === 'regional_hub');

  // When region changes, auto-select sensible defaults with connected route
  const handleRegionChange = (newRegion: GeoRegion) => {
    setSelectedRegion(newRegion);
    if (newRegion === 'Europe') {
      setPrimaryHubId('hub-munich');
      setConnectedLocationId('hub-milan');
      setStarterTruckId('metro-320');
    } else {
      setPrimaryHubId('hub-denver');
      setConnectedLocationId('hub-chicago');
      setStarterTruckId('metro-320');
    }
  };

  const handleSelectPrimaryHub = (hubId: string) => {
    setPrimaryHubId(hubId);
    if (connectedLocationId === hubId) {
      setConnectedLocationId('');
    }
  };

  const handleSelectConnectedLocation = (hubId: string) => {
    setConnectedLocationId(hubId);
  };

  const handleFinish = () => {
    completeOnboarding({
      region: selectedRegion,
      primaryHubId,
      connectedLocationId: connectedLocationId || '',
      connectedHubIds: connectedLocationId ? [connectedLocationId] : [],
      companyName: companyName.trim() || 'Apex Continental Logistics',
      starterTruckModelId: starterTruckId,
      starterTrailerModelId: starterTrailerId,
      starterLivery,
    });
  };

  const selectedPrimaryHub = regionHubs.find((h) => h.id === primaryHubId) || regionHubs[0];
  const selectedConnectedHub = connectedLocationId ? regionHubs.find((h) => h.id === connectedLocationId) : null;
  const selectedTruckModel = TRUCK_MODELS.find((m) => m.id === starterTruckId) || TRUCK_MODELS[0];
  const selectedTrailerModel = TRAILER_MODELS.find((m) => m.id === starterTrailerId) || TRAILER_MODELS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-lg overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header & Progress */}
        <div className="px-5 py-4 sm:px-8 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">
                Carrier Onboarding · Step {step} of 4
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {step === 1 && 'Choose Your Starting Operating Region'}
                {step === 2 && 'Select Your Headquarters & Primary Hub'}
                {step === 3 && 'Connect 1 Strategic Terminal (Corridor)'}
                {step === 4 && 'Commission Starter Fleet & Livery'}
              </h2>
            </div>
          </div>

          {/* Quick Skip Button */}
          <button
            onClick={skipOnboarding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
            title="Skip onboarding and start with default setup"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Skip Setup</span>
          </button>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-slate-950 h-1">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Main Step Content Area */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Region Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Choose the economic theatre for your commercial fleet. Each region features distinct highway physics,
                elevation profiles, diesel spot markets, and regulatory dispatch requirements.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* North America Card */}
                <div
                  onClick={() => handleRegionChange('North America')}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    selectedRegion === 'North America'
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        Trans-American Corridors
                      </span>
                      {selectedRegion === 'North America' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">North American Interstate Network</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Expansive multi-thousand-kilometer transcontinental runs. Features steep mountain passes
                      (Snoqualmie, Siskiyou), long western plains, and flexible 105 km/h commercial cruise limits.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-[11px] font-mono">
                    <div className="p-2 bg-slate-900 rounded">
                      <span className="text-slate-500 block text-[9px] uppercase">Speed Limit</span>
                      <span className="font-bold text-slate-200">105 km/h</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded">
                      <span className="text-slate-500 block text-[9px] uppercase">Avg Distance</span>
                      <span className="font-bold text-slate-200">1,850 km</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded">
                      <span className="text-slate-500 block text-[9px] uppercase">Diesel Spot</span>
                      <span className="font-bold text-amber-400">$0.96-$1.34/L</span>
                    </div>
                  </div>
                </div>

                {/* Europe Card */}
                <div
                  onClick={() => handleRegionChange('Europe')}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    selectedRegion === 'Europe'
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        Pan-European Corridors
                      </span>
                      {selectedRegion === 'Europe' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Trans-European Logistics Corridors</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ultra-dense arterial cross-border highways connecting Rotterdam, Hamburg, and the Alpine Brenner pass.
                      Strict 90 km/h truck governors, German Lkw-Maut tolls, and high cold-chain demand.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-[11px] font-mono">
                    <div className="p-2 bg-slate-900 rounded">
                      <span className="text-slate-500 block text-[9px] uppercase">Speed Limit</span>
                      <span className="font-bold text-slate-200">90 km/h (Gov)</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded">
                      <span className="text-slate-500 block text-[9px] uppercase">Avg Distance</span>
                      <span className="font-bold text-slate-200">890 km</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded">
                      <span className="text-slate-500 block text-[9px] uppercase">Diesel Spot</span>
                      <span className="font-bold text-amber-400">$1.48-$1.91/L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Primary Hub Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Select your corporate headquarters depot. Your company dispatch and initial starter vehicle will be stationed here.
                </p>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  Region: {selectedRegion}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {regionHubs.map((hub) => {
                  const isSelected = primaryHubId === hub.id;
                  const isGateway = hub.locationType === 'gateway_hub';
                  return (
                    <div
                      key={hub.id}
                      onClick={() => handleSelectPrimaryHub(hub.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-amber-400 font-bold">{hub.code}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isGateway ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                            {isGateway ? 'Major Gateway Hub' : 'Regional Terminal'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 leading-tight">{hub.name}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block">Fuel Spot</span>
                          <span className="text-amber-400 font-bold">${hub.fuelPricePerLiter.toFixed(2)}/L</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Traffic Index</span>
                          <span className="text-emerald-400 font-bold">{hub.trafficDemandScore}% Vol</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Depot Facility</span>
                          <span className="text-slate-300">Tier {hub.workshopLevel} ({hub.bayCount} bays)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Monthly Vol</span>
                          <span className="text-slate-300">{hub.monthlyCargoVolume}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 font-bold pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Designated Primary Base</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Choose Between 2 Route Options */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
                <p>
                  Your headquarters depot at <span className="text-amber-400 font-bold">{selectedPrimaryHub.name}</span> comes equipped with your free hub concession. Choose 1 of the 2 primary route corridors below to establish your initial operational lane:
                </p>
                <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                  Select 1 Route Option
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.routes
                  .filter((r) => r.originHubId === primaryHubId)
                  .slice(0, 2)
                  .map((route, idx) => {
                    const destHub = state.hubs.find((h) => h.id === route.destinationHubId);
                    const isSelected = connectedLocationId === route.destinationHubId;

                    return (
                      <div
                        key={route.id}
                        onClick={() => setConnectedLocationId(route.destinationHubId)}
                        className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 shadow-lg ring-1 ring-amber-500/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                              Route Option {idx + 1}
                            </span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">{route.name}</h4>
                          <p className="text-xs text-slate-400">
                            Connecting <span className="text-white font-semibold">{selectedPrimaryHub.name}</span> to <span className="text-white font-semibold">{destHub?.name || 'Destination Terminal'}</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-[11px] font-mono">
                          <div className="p-2 bg-slate-900 rounded">
                            <span className="text-slate-500 block text-[9px] uppercase">Distance</span>
                            <span className="font-bold text-slate-200">{route.distanceKm} km</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded">
                            <span className="text-slate-500 block text-[9px] uppercase">Road Type</span>
                            <span className="font-bold text-slate-200 truncate block">{route.roadType}</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded">
                            <span className="text-slate-500 block text-[9px] uppercase">Speed Limit</span>
                            <span className="font-bold text-amber-400">{route.baseSpeedLimitKmh} km/h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 4: Fleet Commissioning */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Company Branding */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                  Enterprise Registered Trade Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Continental Logistics"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-white font-medium text-sm outline-none transition-colors"
                />
              </div>

              {/* Starter Heavy Hauler / Commercial Vehicle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                    Starter Commercial Vehicle (Rigid Unit)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Included Free ($0) · Buy Heavy Tractors at Dealership Later
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 max-w-md">
                  {TRUCK_MODELS.filter((truck) => truck.id === 'metro-320').map((truck) => (
                    <div
                      key={truck.id}
                      className="p-4 rounded-xl border-2 bg-amber-500/10 border-amber-500 text-white flex items-center gap-4 relative"
                    >
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[9px] rounded font-mono uppercase tracking-wide">
                        Default Starter
                      </div>
                      <div className="w-28 h-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 shrink-0">
                        <img
                          src={truck.image}
                          alt={truck.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-amber-400 font-bold block">
                          {truck.category}
                        </span>
                        <h5 className="text-sm font-bold text-white leading-snug truncate">{truck.name}</h5>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 mt-1">
                          <span>{truck.specs.horsepower} HP</span>
                          <span className="text-emerald-400 font-bold">{truck.specs.maxPayloadKg / 1000}t Payload</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starter Trailer */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                  Starter Trailer Consignment Unit
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRAILER_MODELS.slice(0, 4).map((trailer) => {
                    const isSelected = starterTrailerId === trailer.id;
                    return (
                      <div
                        key={trailer.id}
                        onClick={() => setStarterTrailerId(trailer.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                          <img
                            src={trailer.image}
                            alt={trailer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-amber-400 font-bold block">
                            {trailer.category}
                          </span>
                          <h5 className="text-xs font-bold text-white truncate">{trailer.name}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Payload Limit: <strong className="text-emerald-400">{trailer.maxPayloadKg / 1000}t</strong> · {trailer.axleCount} Axles
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Company Livery Finish */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                  Official Fleet Corporate Livery
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {LIVERY_PALETTES.map((liv) => (
                    <button
                      key={liv.id}
                      type="button"
                      onClick={() => setStarterLivery(liv.id)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                        starterLivery === liv.id
                          ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/40'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border shrink-0"
                        style={{ backgroundColor: liv.hex, borderColor: liv.border }}
                      />
                      <span className="text-xs font-medium text-slate-300">{liv.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Final Summary Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
                <div className="text-amber-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>COMMISSIONING SPECIFICATIONS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Primary Headquarters</span>
                    <span className="font-bold text-white">{selectedPrimaryHub.name.split(' ')[0]}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Connected Corridor</span>
                    <span className="font-bold text-emerald-400">
                      {selectedConnectedHub ? selectedConnectedHub.name.split(' ')[0] : 'None (Independent)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Starter Vehicle</span>
                    <span className="font-bold text-white">{selectedTruckModel.name.split(' ')[0]} (≤{selectedTruckModel.specs.maxPayloadKg / 1000}t)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Unlocked Network</span>
                    <span className="font-bold text-amber-400">
                      {selectedConnectedHub ? '2 Terminals (1 Arterial)' : '1 Headquarters Base (0 Connected Routes)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-4 sm:px-8 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-lg bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Logistics Enterprise</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
