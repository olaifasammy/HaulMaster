import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Hub, ActiveTrip, GeoRegion, RouteCorridor } from '../types/game';
import { CloudRain, Navigation, MapPin } from 'lucide-react';

interface GlobalLogisticsMapProps {
  onSelectTruck: (truckId: string) => void;
  onSelectHub: (hubId: string) => void;
}

export const GlobalLogisticsMap: React.FC<GlobalLogisticsMapProps> = ({ onSelectTruck, onSelectHub }) => {
  const { state, setSelectedRegion } = useGame();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showWeatherRadar, setShowWeatherRadar] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 360, height: 320 });

  const currentRegion = state.selectedRegion;

  // Responsive canvas resizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth || 360;
        // Mobile height 320px, tablet 420px, desktop 500px
        const height = width < 640 ? 320 : width < 1024 ? 420 : 500;
        setCanvasDimensions({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Coordinate mapping from 0-1000 space to canvas coordinates
      let minX = 40;
      let maxX = 480;
      let minY = 80;
      let maxY = 480;

      if (currentRegion === 'Europe') {
        minX = 540;
        maxX = 940;
        minY = 100;
        maxY = 480;
      }

      // Responsive padding: smaller on mobile
      const padX = width < 500 ? 30 : 60;
      const padY = width < 500 ? 25 : 50;

      const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * (width - padX * 2) + padX;
      const scaleY = (y: number) => ((y - minY) / (maxY - minY)) * (height - padY * 2) + padY;

      // 1. Background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // 2. Industrial radar grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      const gridSize = width < 500 ? 30 : 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Dynamic Weather Radar
      if (showWeatherRadar) {
        ctx.save();
        if (currentRegion === 'North America') {
          // Rockies blizzard area
          const radX = scaleX(190);
          const radY = scaleY(220);
          const rSize = width < 500 ? 80 : 130;
          const grad = ctx.createRadialGradient(radX, radY, 5, radX, radY, rSize);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
          grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.08)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(radX, radY, rSize, 0, Math.PI * 2);
          ctx.fill();

          // Storm squall around Chicago
          const chiX = scaleX(340);
          const chiY = scaleY(230);
          const cSize = width < 500 ? 75 : 110;
          const grad2 = ctx.createRadialGradient(chiX, chiY, 5, chiX, chiY, cSize);
          grad2.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
          grad2.addColorStop(0.8, 'rgba(168, 85, 247, 0.05)');
          grad2.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(chiX, chiY, cSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Alps snow front
          const alpX = scaleX(740);
          const alpY = scaleY(310);
          const aSize = width < 500 ? 70 : 110;
          const grad = ctx.createRadialGradient(alpX, alpY, 5, alpX, alpY, aSize);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
          grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.08)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(alpX, alpY, aSize, 0, Math.PI * 2);
          ctx.fill();

          // Atlantic rain gale
          const rtmX = scaleX(670);
          const rtmY = scaleY(190);
          const rSize = width < 500 ? 80 : 120;
          const grad2 = ctx.createRadialGradient(rtmX, rtmY, 5, rtmX, rtmY, rSize);
          grad2.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
          grad2.addColorStop(0.8, 'rgba(14, 165, 233, 0.05)');
          grad2.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(rtmX, rtmY, rSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Corridors
      state.routes.forEach((corridor) => {
        const originHub = state.hubs.find((h) => h.id === corridor.originHubId);
        const destHub = state.hubs.find((h) => h.id === corridor.destinationHubId);
        if (!originHub || !destHub) return;
        if (originHub.region !== currentRegion && destHub.region !== currentRegion) return;

        const isMountain = corridor.roadType === 'Mountain Pass';

        ctx.save();
        ctx.beginPath();
        const startX = scaleX(corridor.waypoints[0].coord.x);
        const startY = scaleY(corridor.waypoints[0].coord.y);
        ctx.moveTo(startX, startY);

        for (let i = 1; i < corridor.waypoints.length; i++) {
          const wp = corridor.waypoints[i];
          ctx.lineTo(scaleX(wp.coord.x), scaleY(wp.coord.y));
        }

        ctx.strokeStyle = isMountain ? '#f59e0b' : '#334155';
        ctx.lineWidth = isMountain ? 2.5 : 2;
        if (isMountain) {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();

        // On larger screens, show distance label
        if (width >= 480) {
          const midIndex = Math.floor(corridor.waypoints.length / 2);
          const midWp = corridor.waypoints[midIndex];
          const midX = scaleX(midWp.coord.x);
          const midY = scaleY(midWp.coord.y);

          ctx.fillStyle = '#64748b';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${corridor.distanceKm} km`, midX, midY - 6);
        }
        ctx.restore();
      });

      // 5. Hub Nodes
      const currentHubs = state.hubs.filter((h) => h.region === currentRegion);
      currentHubs.forEach((hub) => {
        const x = scaleX(hub.coord.x);
        const y = scaleY(hub.coord.y);

        ctx.save();
        const hubRadius = width < 500 ? 7 : 9;
        ctx.beginPath();
        ctx.arc(x, y, hubRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        // City code or name
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        const labelText = width < 500 ? hub.code : hub.name.split(' ')[0];
        ctx.fillText(labelText, x + 10, y + 3);

        if (width >= 600) {
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`$${hub.fuelPricePerLiter.toFixed(2)}/L`, x + 10, y + 14);
        }
        ctx.restore();
      });

      // 6. Active Moving Trucks
      const currentActiveTrips = state.activeTrips.filter((trip) => {
        const originHub = state.hubs.find((h) => h.id === trip.corridor.originHubId);
        return originHub?.region === currentRegion;
      });

      currentActiveTrips.forEach((trip) => {
        const fraction = Math.min(1.0, trip.progressKm / trip.totalDistanceKm);
        const waypoints = trip.corridor.waypoints;
        const segmentCount = waypoints.length - 1;
        const exactSegment = fraction * segmentCount;
        const segIndex = Math.min(segmentCount - 1, Math.floor(exactSegment));
        const segFraction = exactSegment - segIndex;

        const wpStart = waypoints[segIndex];
        const wpEnd = waypoints[segIndex + 1];

        const curX = wpStart.coord.x + (wpEnd.coord.x - wpStart.coord.x) * segFraction;
        const curY = wpStart.coord.y + (wpEnd.coord.y - wpStart.coord.y) * segFraction;

        const x = scaleX(curX);
        const y = scaleY(curY);

        const angle = Math.atan2(scaleY(wpEnd.coord.y) - scaleY(wpStart.coord.y), scaleX(wpEnd.coord.x) - scaleX(wpStart.coord.x));

        ctx.save();
        ctx.translate(x, y);

        // Pulsing glow
        ctx.beginPath();
        ctx.arc(0, 0, width < 500 ? 11 : 14, 0, Math.PI * 2);
        ctx.fillStyle = trip.isRestingNow ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.3)';
        ctx.fill();

        // Directional pointer
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, -4);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fillStyle = trip.isRestingNow ? '#60a5fa' : '#34d399';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // Speed badge
        ctx.save();
        const label = trip.isRestingNow ? 'REST' : `${Math.round(trip.telemetry.currentSpeedKmh)}k`;
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillStyle = trip.isRestingNow ? '#93c5fd' : '#a7f3d0';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 12);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state.selectedRegion, state.routes, state.hubs, state.activeTrips, showWeatherRadar, canvasDimensions]);

  // Click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;

    let minX = 40;
    let maxX = 480;
    let minY = 80;
    let maxY = 480;

    if (currentRegion === 'Europe') {
      minX = 540;
      maxX = 940;
      minY = 100;
      maxY = 480;
    }

    const padX = width < 500 ? 30 : 60;
    const padY = width < 500 ? 25 : 50;

    const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * (width - padX * 2) + padX;
    const scaleY = (y: number) => ((y - minY) / (maxY - minY)) * (height - padY * 2) + padY;

    // Check click on active trucks
    for (const trip of state.activeTrips) {
      const fraction = Math.min(1.0, trip.progressKm / trip.totalDistanceKm);
      const waypoints = trip.corridor.waypoints;
      const segmentCount = waypoints.length - 1;
      const exactSegment = fraction * segmentCount;
      const segIndex = Math.min(segmentCount - 1, Math.floor(exactSegment));
      const segFraction = exactSegment - segIndex;

      const wpStart = waypoints[segIndex];
      const wpEnd = waypoints[segIndex + 1];

      const curX = wpStart.coord.x + (wpEnd.coord.x - wpStart.coord.x) * segFraction;
      const curY = wpStart.coord.y + (wpEnd.coord.y - wpStart.coord.y) * segFraction;

      const px = scaleX(curX);
      const py = scaleY(curY);

      if (Math.hypot(clickX - px, clickY - py) < 24) {
        onSelectTruck(trip.truckId);
        return;
      }
    }

    // Check click on Hubs
    for (const hub of state.hubs.filter((h) => h.region === currentRegion)) {
      const px = scaleX(hub.coord.x);
      const py = scaleY(hub.coord.y);
      if (Math.hypot(clickX - px, clickY - py) < 22) {
        onSelectHub(hub.id);
        return;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col"
    >
      {/* Top Map Toolbar - Stacked / touch-friendly */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Region Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/95 border border-slate-800 rounded-lg backdrop-blur-md pointer-events-auto shadow-md">
          <button
            onClick={() => setSelectedRegion('North America')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap min-h-[32px] flex items-center ${
              currentRegion === 'North America'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            N. America
          </button>
          <button
            onClick={() => setSelectedRegion('Europe')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap min-h-[32px] flex items-center ${
              currentRegion === 'Europe'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Europe
          </button>
        </div>

        {/* Weather Radar Toggle */}
        <button
          onClick={() => setShowWeatherRadar(!showWeatherRadar)}
          className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg border backdrop-blur-md pointer-events-auto min-h-[32px] transition-colors shadow-md ${
            showWeatherRadar
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-slate-900/95 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Weather</span> Radar
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-2.5 left-2.5 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-lg text-[10px] text-slate-400 backdrop-blur-md">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Hub</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-slate-600" />
          <span>Highway</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 border-t border-dashed border-amber-400" />
          <span>Mountain</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Truck</span>
        </div>
      </div>

      {/* Responsive Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onClick={handleCanvasClick}
        className="w-full h-auto cursor-crosshair block touch-manipulation"
      />

      {!((state.unlockedRegions || ['North America']).includes(currentRegion)) && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Navigation className="w-8 h-8 animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-white">
            {currentRegion} Territory Locked
          </h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Intercontinental region access requires Rank 4 (Logistics Enterprise) and a $450,000 concession fee. Visit the Marketplace → Intercontinental Regions tab to unlock.
          </p>
        </div>
      )}
    </div>
  );
};
