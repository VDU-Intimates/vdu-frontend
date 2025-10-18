'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // Import the heat layer plugin
import { X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// Leaflet is not a native React component, so we need to access it this way
declare const L: any;

const getAuthToken = (): string | null => localStorage.getItem('access_token');

// A new, internal component to handle adding the heat layer reliably
const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap(); // This hook gives us a stable reference to the map instance

  useEffect(() => {
    if (!map || points.length === 0) return;

    // The third value in the array is the "intensity" of the heat point
    const heatLayer = L.heatLayer(points, { 
        radius: 25, 
        blur: 15, 
        maxZoom: 12 
    }).addTo(map);

    // Clean up the layer when the component is unmounted
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]); // Re-run if the map or points change

  return null; // This component doesn't render anything itself
};


interface OrderHeatmapProps {
  isVisible: boolean;
  onClose: () => void;
}

const OrderHeatmap = ({ isVisible, onClose }: OrderHeatmapProps) => {
  const [locations, setLocations] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible) {
      setLoading(true);
      const fetchLocations = async () => {
        const token = getAuthToken();
        try {
          const response = await fetch('http://localhost:5000/api/reports/order-locations', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to fetch location data.');
          const data = await response.json();
          setLocations(data);
        } catch (error: any) {
          toast.error(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchLocations();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Add a third dimension (intensity) to each point for the heatmap
  const heatPoints: [number, number, number][] = locations.map(loc => [...loc, 1.0]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col relative">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Order Heatmap (Last 30 Days)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center flex-col text-gray-500">
            <MapPin className="w-12 h-12 mb-4 animate-pulse text-blue-500" />
            <p>Fetching and geocoding order locations...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center flex-col text-gray-500">
            <MapPin className="w-12 h-12 mb-4" />
            <p>No location data found for recent orders.</p>
            <p className="text-xs mt-2">Check backend logs for geocoding errors.</p>
          </div>
        ) : (
          <MapContainer 
            center={[7.8731, 80.7718]} // Center of Sri Lanka
            zoom={8} 
            style={{ height: '100%', width: '100%', borderRadius: '0 0 0.5rem 0.5rem' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <HeatmapLayer points={heatPoints} />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default OrderHeatmap;