import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Hub, ActiveTrip, GeoRegion, RouteCorridor, WeatherCondition } from '../types/game';
import {
  CloudRain,
  Navigation,
  MapPin,
  Thermometer,
  Wind,
  ShieldAlert,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Truck,
  Fuel,
  Activity,
  Layers,
  Eye,
  AlertTriangle,
  Clock,
  Gauge,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  ChevronRight,
  Package,
  Wrench,
} from 'lucide-react';
import { getLocalWeather, ACTIVE_FRONTS } from '../utils/weatherEngine';

interface GlobalLogisticsMapProps {
  onSelectTruck: (truckId: string) => void;
  onSelectHub: (hubId: string) => void;
}

export const GlobalLogisticsMap: React.FC<GlobalLogisticsMapProps> = ({ onSelectTruck, onSelectHub }) => {
  const { state, setSelectedRegion } = useGame();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport zoom & pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragRef = useRef<boolean>(false);

  // Layer Visibility Toggles
  const [showWeatherRadar, setShowWeatherRadar] = useState<boolean>(true);
  const [showFleetTrucks, setShowFleetTrucks] = useState<boolean>(true);
  const [showRouteBadges, setShowRouteBadges] = useState<boolean>(true);
  const [showFuelTags, setShowFuelTags] = useState<boolean>(true);
  const [showMaintenanceHotspots, setShowMaintenanceHotspots] = useState<boolean>(true);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Selected map entity for tactical inspection popover
  const [inspectedEntity, setInspectedEntity] = useState<
    | { type: 'truck'; trip: ActiveTrip; weather: WeatherCondition }
    | { type: 'hub'; hub: Hub; weather: WeatherCondition; dockedCount: number }
    | null
  >(null);

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 360, height: 350 });

  const currentRegion = state.selectedRegion;
  const sampleHub =
    state.hubs.find((h) => h.region === currentRegion && h.isUnlocked) ||
    state.hubs.find((h) => h.region === currentRegion);
  const currentWeather = getLocalWeather(sampleHub?.coord || { x: 250, y: 250 }, 100, state.simTimeMinutes);

  // Responsive compact canvas resizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth || 360;
        const height = width < 640 ? 310 : 350;
        setCanvasDimensions({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Reset view to default zoom & pan
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.75, Math.min(3.0, Math.round((prev + delta) * 10) / 10)));
  };

  // Live Fleet Overview Metrics
  const fleetOverview = useMemo(() => {
    const activeTripsInRegion = state.activeTrips.filter((t) => {
      const origin = state.hubs.find((h) => h.id === t.corridor.originHubId);
      return origin?.region === currentRegion;
    });

    const totalTons = activeTripsInRegion.reduce((sum, t) => sum + (t.contract.weightTons || 0), 0);
    const avgSpeed =
      activeTripsInRegion.length > 0
        ? Math.round(activeTripsInRegion.reduce((sum, t) => sum + t.telemetry.currentSpeedKmh, 0) / activeTripsInRegion.length)
        : 0;

    const weatherAlertsCount = ACTIVE_FRONTS.filter(
      (f) => f.type === 'Heavy Storm' || f.type === 'Blizzard'
    ).length;

    return {
      activeCount: activeTripsInRegion.length,
      totalTons,
      avgSpeed,
      weatherAlertsCount,
    };
  }, [state.activeTrips, state.hubs, currentRegion]);

  // Main Canvas Rendering Engine (Authentic Cartographic Map Style - Zero Animations)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Coordinate bounds for regional maps
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

    const padX = width < 500 ? 30 : 50;
    const padY = width < 500 ? 25 : 40;

    const baseScaleX = (x: number) => ((x - minX) / (maxX - minX)) * (width - padX * 2) + padX;
    const baseScaleY = (y: number) => ((y - minY) / (maxY - minY)) * (height - padY * 2) + padY;

    // World coordinate to viewport transformation with Pan & Zoom
    const toScreenX = (x: number) => (baseScaleX(x) - width / 2) * zoom + width / 2 + pan.x;
    const toScreenY = (y: number) => (baseScaleY(y) - height / 2) * zoom + height / 2 + pan.y;

    // 1. Authentic Cartographic Map Background (Real Map Aesthetic)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Subtle Landmass Fill Tone
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.beginPath();
    ctx.roundRect(padX - 10, padY - 10, width - (padX - 10) * 2, height - (padY - 10) * 2, 12);
    ctx.fill();

    // 2. Geographic Grid Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = Math.round((width < 500 ? 45 : 60) * zoom);
    const startGridX = (pan.x % gridSize);
    const startGridY = (pan.y % gridSize);

    for (let x = startGridX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = startGridY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Weather Radar Layer
    if (showWeatherRadar) {
      ctx.save();
      ACTIVE_FRONTS.forEach((front) => {
        const isFrontInRegion =
          currentRegion === 'North America' ? front.center.x < 500 : front.center.x >= 500;
        if (!isFrontInRegion) return;

        const screenFrontX = toScreenX(front.center.x);
        const screenFrontY = toScreenY(front.center.y);
        const screenRadius = front.radius * zoom * 0.8;

        const grad = ctx.createRadialGradient(
          screenFrontX,
          screenFrontY,
          5 * zoom,
          screenFrontX,
          screenFrontY,
          screenRadius
        );

        if (front.type === 'Rain') {
          grad.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
          grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        } else if (front.type === 'Heavy Storm') {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        } else {
          grad.addColorStop(0, 'rgba(224, 242, 254, 0.22)');
          grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenFrontX, screenFrontY, screenRadius, 0, Math.PI * 2);
        ctx.fill();

        if (zoom >= 0.85) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ ${front.type.toUpperCase()}`, screenFrontX, screenFrontY - screenRadius * 0.4);
        }
      });
      ctx.restore();
    }

    // 4. Logistics Freight Corridors
    state.routes.forEach((corridor) => {
      const originHub = state.hubs.find((h) => h.id === corridor.originHubId);
      const destHub = state.hubs.find((h) => h.id === corridor.destinationHubId);
      if (!originHub || !destHub) return;
      if (originHub.region !== currentRegion && destHub.region !== currentRegion) return;

      const isMountain = corridor.roadType === 'Mountain Pass';
      const isCoastal = corridor.roadType === 'Coastal Express';

      ctx.save();
      ctx.beginPath();
      const startX = toScreenX(corridor.waypoints[0].coord.x);
      const startY = toScreenY(corridor.waypoints[0].coord.y);
      ctx.moveTo(startX, startY);

      for (let i = 1; i < corridor.waypoints.length; i++) {
        const wp = corridor.waypoints[i];
        ctx.lineTo(toScreenX(wp.coord.x), toScreenY(wp.coord.y));
      }

      ctx.strokeStyle = isMountain
        ? '#f59e0b'
        : isCoastal
        ? '#10b981'
        : '#38bdf8';
      ctx.lineWidth = (isMountain ? 2.2 : 1.8) * zoom;

      if (isMountain) {
        ctx.setLineDash([5, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();

      if (showRouteBadges && width >= 480 && zoom >= 0.85) {
        const midIndex = Math.floor(corridor.waypoints.length / 2);
        const midWp = corridor.waypoints[midIndex];
        const midX = toScreenX(midWp.coord.x);
        const midY = toScreenY(midWp.coord.y);

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        const badgeText = `${corridor.distanceKm}km`;
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        const textW = ctx.measureText(badgeText).width;

        ctx.beginPath();
        ctx.roundRect(midX - textW / 2 - 3, midY - 10, textW + 6, 10, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, midX, midY - 3);
      }

      ctx.restore();
    });

    // 5. Toggleable Layer: Maintenance Hotspots
    if (showMaintenanceHotspots) {
      ctx.save();
      state.routes.forEach((corridor) => {
        const originHub = state.hubs.find((h) => h.id === corridor.originHubId);
        if (!originHub || originHub.region !== currentRegion) return;
        const isHighWear = corridor.roadType === 'Mountain Pass' || corridor.hazardRisk > 0.12;
        if (!isHighWear) return;

        const midWp = corridor.waypoints[Math.floor(corridor.waypoints.length / 2)];
        const hx = toScreenX(midWp.coord.x);
        const hy = toScreenY(midWp.coord.y);

        ctx.beginPath();
        ctx.arc(hx, hy, 15 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ HIGH WEAR', hx, hy - 17 * zoom);
      });
      ctx.restore();
    }

    // 6. Hub Depots & Concession Terminals
    const currentHubs = state.hubs.filter((h) => h.region === currentRegion);
    currentHubs.forEach((hub) => {
      const x = toScreenX(hub.coord.x);
      const y = toScreenY(hub.coord.y);

      ctx.save();
      const isOwned = state.ownedHubIds?.includes(hub.id) || false;
      const hubRadius = (isOwned ? 8 : 6) * zoom;

      ctx.beginPath();
      ctx.arc(x, y, hubRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#090d16';
      ctx.fill();
      ctx.strokeStyle = isOwned ? '#f59e0b' : hub.isUnlocked ? '#38bdf8' : '#475569';
      ctx.lineWidth = 2 * zoom;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 2 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = isOwned ? '#f59e0b' : hub.isUnlocked ? '#38bdf8' : '#64748b';
      ctx.fill();

      if (zoom >= 0.8) {
        ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        ctx.fillText(hub.code, x + hubRadius + 3, y + 3);

        if (showFuelTags && hub.fuelPricePerLiter) {
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`$${hub.fuelPricePerLiter.toFixed(2)}/L`, x + hubRadius + 3, y + 12);
        }
      }

      ctx.restore();
    });

    // 7. Active Fleet Trucks with Icon Clustering
    if (showFleetTrucks) {
      const currentActiveTrips = state.activeTrips.filter((trip) => {
        const originHub = state.hubs.find((h) => h.id === trip.corridor.originHubId);
        return originHub?.region === currentRegion;
      });

      const truckCoords = currentActiveTrips.map((trip) => {
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

        return {
          trip,
          x: toScreenX(curX),
          y: toScreenY(curY),
        };
      });

      const processedIndices = new Set<number>();

      truckCoords.forEach((item, idx) => {
        if (processedIndices.has(idx)) return;

        const cluster = [item];
        for (let j = idx + 1; j < truckCoords.length; j++) {
          if (processedIndices.has(j)) continue;
          const other = truckCoords[j];
          const dist = Math.hypot(other.x - item.x, other.y - item.y);
          if (dist < 24) {
            cluster.push(other);
            processedIndices.add(j);
          }
        }

        ctx.save();
        if (cluster.length > 1) {
          ctx.beginPath();
          ctx.arc(item.x, item.y, 12 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5 * zoom;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🚛${cluster.length}`, item.x, item.y + 3);
        } else {
          const { trip, x, y } = item;
          ctx.translate(x, y);

          ctx.beginPath();
          ctx.arc(0, 0, 8 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = trip.isRestingNow ? '#0284c7' : '#059669';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🚛', 0, 3);

          if (zoom >= 0.85) {
            const speedText = trip.isRestingNow ? 'REST' : `${Math.round(trip.telemetry.currentSpeedKmh)}`;
            ctx.fillStyle = '#a7f3d0';
            ctx.font = 'bold 8px JetBrains Mono, monospace';
            ctx.fillText(speedText, 0, -11 * zoom);
          }
        }
        ctx.restore();
      });
    }

  }, [
    state.selectedRegion,
    state.routes,
    state.hubs,
    state.activeTrips,
    showWeatherRadar,
    showFleetTrucks,
    showRouteBadges,
    showFuelTags,
    showMaintenanceHotspots,
    canvasDimensions,
    zoom,
    pan,
    inspectedEntity,
    currentWeather.type,
  ]);

  // Mouse & Touch Drag-to-Scroll / Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    didDragRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = Math.abs(e.clientX - pan.x - dragStartRef.current.x);
    const deltaY = Math.abs(e.clientY - pan.y - dragStartRef.current.y);
    if (deltaX > 4 || deltaY > 4) {
      didDragRef.current = true;
    }
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    if (didDragRef.current) return;

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

    const padX = width < 500 ? 30 : 50;
    const padY = width < 500 ? 25 : 40;

    const baseScaleX = (x: number) => ((x - minX) / (maxX - minX)) * (width - padX * 2) + padX;
    const baseScaleY = (y: number) => ((y - minY) / (maxY - minY)) * (height - padY * 2) + padY;

    const toScreenX = (x: number) => (baseScaleX(x) - width / 2) * zoom + width / 2 + pan.x;
    const toScreenY = (y: number) => (baseScaleY(y) - height / 2) * zoom + height / 2 + pan.y;

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

      const tx = toScreenX(curX);
      const ty = toScreenY(curY);

      if (Math.hypot(clickX - tx, clickY - ty) <= 16) {
        setInspectedEntity({ type: 'truck', trip, weather: currentWeather });
        return;
      }
    }

    const currentHubs = state.hubs.filter((h) => h.region === currentRegion);
    for (const hub of currentHubs) {
      const hx = toScreenX(hub.coord.x);
      const hy = toScreenY(hub.coord.y);

      if (Math.hypot(clickX - hx, clickY - hy) <= 16) {
        const dockedCount = state.trucks.filter((t) => t.currentHubId === hub.id && t.status !== 'en_route').length;
        setInspectedEntity({ type: 'hub', hub, weather: currentWeather, dockedCount });
        return;
      }
    }

    setInspectedEntity(null);
  };

  // Touch Support for Mobile / Tablet Scrolling & Panning
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      didDragRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    const deltaX = Math.abs(clientX - pan.x - touchStartRef.current.x);
    const deltaY = Math.abs(clientY - pan.y - touchStartRef.current.y);
    if (deltaX > 4 || deltaY > 4) {
      didDragRef.current = true;
    }
    setPan({
      x: clientX - touchStartRef.current.x,
      y: clientY - touchStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    handleZoom(delta);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono"
    >
      {/* Top Map Tactical Toolbar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Region Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/95 border border-slate-800 rounded-xl backdrop-blur-md pointer-events-auto shadow-lg">
          {(state.unlockedRegions || ['North America']).map((region) => (
            <button
              key={region}
              onClick={() => {
                setSelectedRegion(region);
                handleResetView();
                setInspectedEntity(null);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                currentRegion === region
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {region === 'North America' ? 'North America' : region}
            </button>
          ))}
        </div>

        {/* Tactical Layer & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom In / Out / Reset */}
          <div className="flex items-center bg-slate-900/95 border border-slate-800 rounded-xl p-1 backdrop-blur-md shadow-lg">
            <button
              onClick={() => handleZoom(0.2)}
              title="Zoom In"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              title="Zoom Out"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              title="Reset View"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-[10px] font-bold px-1.5"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>

          {/* Layer Options Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-lg cursor-pointer ${
                showWeatherRadar
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900/95 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Layers</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 top-10 w-48 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl space-y-1 z-30 text-xs">
                <button
                  onClick={() => setShowWeatherRadar(!showWeatherRadar)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    Weather Radar
                  </span>
                  <span className={`text-[10px] font-bold ${showWeatherRadar ? 'text-sky-400' : 'text-slate-500'}`}>
                    {showWeatherRadar ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  onClick={() => setShowFleetTrucks(!showFleetTrucks)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    Fleet Vehicles
                  </span>
                  <span className={`text-[10px] font-bold ${showFleetTrucks ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {showFleetTrucks ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  onClick={() => setShowRouteBadges(!showRouteBadges)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    Route Corridors
                  </span>
                  <span className={`text-[10px] font-bold ${showRouteBadges ? 'text-amber-400' : 'text-slate-500'}`}>
                    {showRouteBadges ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  onClick={() => setShowFuelTags(!showFuelTags)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                    Fuel Spot Prices
                  </span>
                  <span className={`text-[10px] font-bold ${showFuelTags ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {showFuelTags ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  onClick={() => setShowMaintenanceHotspots(!showMaintenanceHotspots)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-rose-400" />
                    Maintenance Hotspots
                  </span>
                  <span className={`text-[10px] font-bold ${showMaintenanceHotspots ? 'text-rose-400' : 'text-slate-500'}`}>
                    {showMaintenanceHotspots ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Entity Inspection Popover Card */}
      {inspectedEntity && (
        <div className="absolute bottom-10 left-3 right-3 sm:left-auto sm:right-3 sm:w-72 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md z-20 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {inspectedEntity.type === 'truck' ? (
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                  <Truck className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  {inspectedEntity.type === 'truck'
                    ? inspectedEntity.trip.contract.title
                    : inspectedEntity.hub.name}
                </h4>
                <p className="text-[9px] text-slate-400">
                  {inspectedEntity.type === 'truck' ? 'Active Transit' : `${inspectedEntity.hub.region} Depot`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setInspectedEntity(null)}
              className="text-slate-400 hover:text-white cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {inspectedEntity.type === 'truck' ? (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Progress</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round(inspectedEntity.trip.progressKm)} / {inspectedEntity.trip.totalDistanceKm} km
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (inspectedEntity.trip.progressKm / inspectedEntity.trip.totalDistanceKm) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Speed</span>
                  <span className="font-bold text-white">{Math.round(inspectedEntity.trip.telemetry.currentSpeedKmh)} km/h</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Weather</span>
                  <span className="font-bold text-sky-400">{inspectedEntity.weather.type}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectTruck(inspectedEntity.trip.truckId);
                  setInspectedEntity(null);
                }}
                className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md text-[11px]"
              >
                <span>Inspect Truck</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Fuel Spot Rate</span>
                  <span className="font-bold text-cyan-400">${inspectedEntity.hub.fuelPricePerLiter.toFixed(2)}/L</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Docked Trucks</span>
                  <span className="font-bold text-white">{inspectedEntity.dockedCount} Units</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectHub(inspectedEntity.hub.id);
                  setInspectedEntity(null);
                }}
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md text-[11px]"
              >
                <span>Manage Hub Terminal</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Interactive Compact Canvas with Full Scroll, Drag Pan, and Touch Support */}
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="w-full h-auto cursor-grab active:cursor-grabbing block touch-none select-none overflow-auto"
      />

      {/* Bottom Live Logistics Status Ticker */}
      <div className="border-t border-slate-800 bg-slate-950/95 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-white font-bold">{fleetOverview.activeCount} En Route</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Package className="w-3 h-3 text-cyan-400" />
            <span>{fleetOverview.totalTons}t Freight</span>
          </div>
        </div>

        <div>
          {fleetOverview.weatherAlertsCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              {fleetOverview.weatherAlertsCount} Storm Alerts
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Nominal
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
