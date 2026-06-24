import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface HotSpot {
  lat: number;
  lng: number;
  intensity: number;
  cases: number;
}

interface Location {
  name: string;
  lat: number;
  lng: number;
}

export function HeatMapWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // NYC and NJ hotspots - more concentrated in NYC
  const hotspots: HotSpot[] = [
    // Manhattan - high concentration
    { lat: 40.7589, lng: -73.9851, intensity: 0.95, cases: 24 },
    { lat: 40.7489, lng: -73.9851, intensity: 0.9, cases: 18 },
    { lat: 40.7689, lng: -73.9751, intensity: 0.85, cases: 16 },
    { lat: 40.7589, lng: -73.9951, intensity: 0.9, cases: 20 },
    { lat: 40.7689, lng: -73.9851, intensity: 0.88, cases: 17 },
    { lat: 40.7489, lng: -73.9751, intensity: 0.92, cases: 21 },
    { lat: 40.7389, lng: -73.9851, intensity: 0.87, cases: 15 },
    { lat: 40.7789, lng: -73.9851, intensity: 0.83, cases: 14 },

    // Brooklyn - medium-high
    { lat: 40.6782, lng: -73.9442, intensity: 0.75, cases: 12 },
    { lat: 40.6482, lng: -73.9642, intensity: 0.7, cases: 10 },
    { lat: 40.6582, lng: -73.9542, intensity: 0.72, cases: 11 },

    // Queens - medium
    { lat: 40.7282, lng: -73.7949, intensity: 0.65, cases: 8 },
    { lat: 40.7482, lng: -73.8149, intensity: 0.6, cases: 7 },

    // Bronx - medium
    { lat: 40.8448, lng: -73.8648, intensity: 0.68, cases: 9 },
    { lat: 40.8648, lng: -73.8848, intensity: 0.63, cases: 8 },

    // Jersey City - lower intensity
    { lat: 40.7178, lng: -74.0431, intensity: 0.5, cases: 6 },
    { lat: 40.7278, lng: -74.0531, intensity: 0.48, cases: 5 },

    // Newark - medium-low
    { lat: 40.7357, lng: -74.1724, intensity: 0.55, cases: 7 },
    { lat: 40.7457, lng: -74.1824, intensity: 0.52, cases: 6 },
  ];

  const locations: Location[] = [
    { name: 'Manhattan', lat: 40.7589, lng: -73.9851 },
    { name: 'Brooklyn', lat: 40.6782, lng: -73.9442 },
    { name: 'Queens', lat: 40.7282, lng: -73.7949 },
    { name: 'Bronx', lat: 40.8448, lng: -73.8648 },
    { name: 'Jersey City', lat: 40.7178, lng: -74.0431 },
    { name: 'Newark', lat: 40.7357, lng: -74.1724 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas with light background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo((width / 20) * i, 0);
      ctx.lineTo((width / 20) * i, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, (height / 20) * i);
      ctx.lineTo(width, (height / 20) * i);
      ctx.stroke();
    }

    // Normalize lat/lng to canvas coordinates
    const latMin = Math.min(...hotspots.map(h => h.lat));
    const latMax = Math.max(...hotspots.map(h => h.lat));
    const lngMin = Math.min(...hotspots.map(h => h.lng));
    const lngMax = Math.max(...hotspots.map(h => h.lng));

    const padding = 50;

    // Draw heatmap circles (multiple passes for better blending)
    hotspots.forEach(spot => {
      const x = padding + ((spot.lng - lngMin) / (lngMax - lngMin)) * (width - padding * 2);
      const y = height - padding - ((spot.lat - latMin) / (latMax - latMin)) * (height - padding * 2);
      const radius = 60 * spot.intensity;

      // Create gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      if (spot.intensity > 0.8) {
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.7)');
        gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.5)');
        gradient.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (spot.intensity > 0.6) {
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.6)');
        gradient.addColorStop(0.3, 'rgba(251, 146, 60, 0.4)');
        gradient.addColorStop(0.7, 'rgba(251, 146, 60, 0.15)');
        gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(234, 179, 8, 0.5)');
        gradient.addColorStop(0.3, 'rgba(250, 204, 21, 0.3)');
        gradient.addColorStop(0.7, 'rgba(250, 204, 21, 0.1)');
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw location labels
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    locations.forEach(location => {
      const x = padding + ((location.lng - lngMin) / (lngMax - lngMin)) * (width - padding * 2);
      const y = height - padding - ((location.lat - latMin) / (latMax - latMin)) * (height - padding * 2);

      // Background for text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const textWidth = ctx.measureText(location.name).width;
      ctx.fillRect(x - textWidth / 2 - 6, y - 20, textWidth + 12, 20);

      // Text
      ctx.fillStyle = '#374151';
      ctx.fillText(location.name, x, y - 6);
    });

    // Draw pin markers on top
    hotspots.forEach(spot => {
      const x = padding + ((spot.lng - lngMin) / (lngMax - lngMin)) * (width - padding * 2);
      const y = height - padding - ((spot.lat - latMin) / (latMax - latMin)) * (height - padding * 2);

      ctx.fillStyle = spot.intensity > 0.8 ? '#dc2626' : spot.intensity > 0.6 ? '#f97316' : '#eab308';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, []);

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-gray-900 dark:text-white">Activity Map</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Low</span>
          </div>
        </div>
      </div>
      <div className="relative w-full h-80 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
