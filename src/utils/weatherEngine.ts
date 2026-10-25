import { Coordinate, WeatherCondition, WeatherType } from '../types/game';

export interface WeatherFront {
  id: string;
  center: Coordinate;
  radius: number;
  type: WeatherType;
  baseTemp: number;
  windSpeed: number;
  windHeading: number;
  velocity: Coordinate; // movement per sim hour
}

// Global active weather systems simulated across North America and Europe
export const ACTIVE_FRONTS: WeatherFront[] = [
  {
    id: 'front-atlantic-gale',
    center: { x: 680, y: 160 },
    radius: 180,
    type: 'Rain',
    baseTemp: 11,
    windSpeed: 48,
    windHeading: 240, // strong southwesterly
    velocity: { x: 0.8, y: 0.2 },
  },
  {
    id: 'front-alpine-cold',
    center: { x: 740, y: 310 },
    radius: 120,
    type: 'Snow',
    baseTemp: -4,
    windSpeed: 34,
    windHeading: 310,
    velocity: { x: 0.3, y: 0.1 },
  },
  {
    id: 'front-midwest-squall',
    center: { x: 320, y: 220 },
    radius: 190,
    type: 'Heavy Storm',
    baseTemp: 16,
    windSpeed: 55,
    windHeading: 280,
    velocity: { x: 1.2, y: 0.4 },
  },
  {
    id: 'front-rockies-blizzard',
    center: { x: 210, y: 250 },
    radius: 140,
    type: 'Blizzard',
    baseTemp: -12,
    windSpeed: 65,
    windHeading: 340,
    velocity: { x: 0.5, y: -0.2 },
  },
  {
    id: 'front-southern-heat',
    center: { x: 250, y: 420 },
    radius: 170,
    type: 'Heatwave',
    baseTemp: 39,
    windSpeed: 18,
    windHeading: 180,
    velocity: { x: 0.2, y: 0.1 },
  },
];

export function getLocalWeather(coord: Coordinate, elevationMeters: number, simMinutes: number): WeatherCondition {
  // Check if inside any moving weather front
  let matchedType: WeatherType = 'Clear';
  let windSpeed = 12;
  let windDirection = 90;
  let precipitationMm = 0;
  let baseTemp = 20;

  // Lapsed temperature with elevation: standard lapse rate -6.5°C per 1,000m
  const elevationTempDrop = (elevationMeters / 1000) * 6.5;

  for (const front of ACTIVE_FRONTS) {
    // Current animated position
    const hoursElapsed = (simMinutes % 1440) / 60;
    const currentX = front.center.x + Math.sin(hoursElapsed * 0.2) * 40;
    const currentY = front.center.y + Math.cos(hoursElapsed * 0.15) * 30;

    const dx = coord.x - currentX;
    const dy = coord.y - currentY;
    const dist = Math.hypot(dx, dy);

    if (dist < front.radius) {
      matchedType = front.type;
      windSpeed = front.windSpeed * (1 - dist / (front.radius * 1.5));
      windDirection = front.windHeading;
      baseTemp = front.baseTemp;
      if (front.type === 'Rain') precipitationMm = 6.5;
      if (front.type === 'Heavy Storm') precipitationMm = 18.0;
      if (front.type === 'Snow') precipitationMm = 4.0;
      if (front.type === 'Blizzard') precipitationMm = 14.0;
      break;
    }
  }

  // If high altitude without front, cold/overcast
  if (elevationMeters > 1800 && matchedType === 'Clear') {
    matchedType = 'Overcast';
    baseTemp = 4;
  }

  const effectiveTemp = Math.round(baseTemp - elevationTempDrop);

  // Road friction and rolling resistance multipliers based on road state
  let roadFriction = 0.85; // dry asphalt
  let rollingResistanceMultiplier = 1.0;

  switch (matchedType) {
    case 'Rain':
      roadFriction = 0.58;
      rollingResistanceMultiplier = 1.12;
      break;
    case 'Heavy Storm':
      roadFriction = 0.45;
      rollingResistanceMultiplier = 1.25;
      break;
    case 'Snow':
      roadFriction = 0.28;
      rollingResistanceMultiplier = 1.35;
      break;
    case 'Blizzard':
      roadFriction = 0.14; // near black-ice conditions
      rollingResistanceMultiplier = 1.50;
      break;
    case 'Heatwave':
      roadFriction = 0.82; // hot bitumen bleeding
      rollingResistanceMultiplier = 1.05;
      break;
    case 'Overcast':
      roadFriction = 0.85;
      rollingResistanceMultiplier = 1.0;
      break;
    case 'Clear':
    default:
      roadFriction = 0.88;
      rollingResistanceMultiplier = 1.0;
      break;
  }

  return {
    type: matchedType,
    tempCelsius: effectiveTemp,
    windSpeedKmh: Math.max(5, Math.round(windSpeed)),
    windDirectionDeg: windDirection,
    precipitationMm,
    roadFrictionCoeff: roadFriction,
    rollingResistanceMultiplier,
  };
}
