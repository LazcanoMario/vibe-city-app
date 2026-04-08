"use client";

import React, { useState, useEffect } from "react";
import Map, { Marker, NavigationControl, Source, Layer, ViewStateChangeEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "../lib/supabase"; 
import { MapPin, Shield, Waves, Car, X, Navigation, Layers } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
const WEATHER_KEY = "7b89f4a78fd27270b8cd880d3d5db258";

export default function MapComponent() {
  const [viewState, setViewState] = useState({
    longitude: -116.602,
    latitude: 31.86,
    zoom: 12,
  });

  const [places, setPlaces] = useState<any[]>([]);
  const [filter, setFilter] = useState("default");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);

  // 1. CARGAR DATOS DE SUPABASE
  useEffect(() => {
    const fetchPlaces = async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (!error) setPlaces(data || []);
    };
    fetchPlaces();
  }, []);

  // 2. OBTENER CLIMA (CON CORRECCIÓN DE SEGURIDAD)
  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedPlace) {
        setWeather(null);
        return;
      }
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${selectedPlace.lat}&lon=${selectedPlace.lng}&appid=${WEATHER_KEY}&units=metric&lang=es`
        );
        const data = await res.json();
        // Solo guardamos si la respuesta es exitosa (cod 200)
        if (data.cod === 200) {
          setWeather(data);
        } else {
          setWeather(null);
        }
      } catch (error) {
        console.error("Error al obtener clima:", error);
        setWeather(null);
      }
    };
    fetchWeather();
  }, [selectedPlace]);

  const currentMapStyle = isSatellite 
    ? "mapbox://styles/mapbox/satellite-streets-v12" 
    : "mapbox://styles/mapbox/dark-v11";

  const getRoute = async (destLng: number, destLat: number) => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const start = [pos.coords.longitude, pos.coords.latitude];
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${destLng},${destLat}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const json = await query.json();
        if (json.routes && json.routes[0]) {
          setRouteData({ type: "Feature", properties: {}, geometry: json.routes[0].geometry });
          setViewState({ ...viewState, longitude: start[0], latitude: start[1], zoom: 14 });
        }
      } catch (error) {
        alert("Error al calcular la ruta");
      }
    }, () => alert("GPS no disponible"));
  };

  const getPinColor = (place: any) => {
    if (filter === "traffic") return place.traffic > 60 ? "text-red-500" : "text-green-400";
    if (filter === "safety") return place.safety > 80 ? "text-blue-400" : "text-orange-500";
    if (filter === "beach") return place.type === "beach" ? "text-cyan-400" : "text-slate-500 opacity-30";
    return place.type === "beach" ? "text-cyan-400" : "text-rose-500";
  };

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden font-sans">
      
      {/* BOTONES LATERALES */}
      <div className="absolute top-24 left-6 z-20 flex flex-col gap-3">
        <button onClick={() => setIsSatellite(!isSatellite)} className={`p-4 rounded-2xl backdrop-blur-xl border-2 transition-all shadow-2xl ${isSatellite ? "border-yellow-500 bg-yellow-500/20 text-yellow-400" : "bg-black/40 border-white/10 text-white"}`}>
          <Layers size={20} />
        </button>

        {[
          { id: "traffic", icon: <Car size={20} />, color: "border-red-500" },
          { id: "safety", icon: <Shield size={20} />, color: "border-blue-500" },
          { id: "beach", icon: <Waves size={20} />, color: "border-cyan-500" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => { setFilter(filter === btn.id ? "default" : btn.id); setSelectedPlace(null); }}
            className={`p-4 rounded-2xl backdrop-blur-xl transition-all border-2 shadow-2xl ${filter === btn.id ? `${btn.color} bg-white/20 scale-110` : "bg-black/40 border-white/10 text-white"}`}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      <Map
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle={currentMapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />

        {/* TRÁFICO MAPBOX */}
        {filter === "traffic" && (
          <Source id="mapbox-traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
            <Layer
              id="traffic-layer"
              type="line"
              source="mapbox-traffic"
              source-layer="traffic"
              paint={{
                "line-color": [
                  "interpolate", ["linear"], ["get", "congestion_level"],
                  0, "rgba(0,0,0,0)",
                  1, "#22c55e", 2, "#eab308", 3, "#f97316", 4, "#ef4444"
                ],
                "line-width": 3
              }}
            />
          </Source>
        )}

        {routeData && (
          <Source id="my-route" type="geojson" data={routeData}>
            <Layer id="route-layer" type="line" paint={{ "line-color": "#06b6d4", "line-width": 6, "line-opacity": 0.8 }} />
          </Source>
        )}

        {places.map((place) => (
          <Marker key={place.id} longitude={place.lng} latitude={place.lat} anchor="bottom">
            <div onClick={() => { setSelectedPlace(place); setRouteData(null); }} className="group cursor-pointer flex flex-col items-center">
              <div className="bg-white/90 text-black text-[10px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                {place.name}
              </div>
              <MapPin className={`${getPinColor(place)} transition-all`} fill="currentColor" size={selectedPlace?.id === place.id ? 38 : 28} />
            </div>
          </Marker>
        ))}
      </Map>

      <AnimatePresence>
        {selectedPlace && (
          <motion.div initial={{ y: 100, opacity: 0, x: "-50%" }} animate={{ y: 0, opacity: 1, x: "-50%" }} exit={{ y: 100, opacity: 0, x: "-50%" }} className="absolute bottom-10 left-1/2 z-30 w-[90%] max-w-[360px]">
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 text-white shadow-2xl">
              <button onClick={() => setSelectedPlace(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white"><X size={18} /></button>
              
              <h2 className="text-2xl font-black leading-tight">{selectedPlace.name}</h2>
              <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                {selectedPlace.type === 'beach' ? '🏖️ Zona Costera' : '🍸 Punto de Interés'}
              </p>

              {/* SECCIÓN DE CLIMA CORREGIDA */}
              {weather && weather.weather && weather.weather[0] ? (
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 mb-4">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                    alt="icono clima" 
                    className="w-12 h-12" 
                  />
                  <div>
                    <p className="text-2xl font-black">{Math.round(weather.main?.temp)}°C</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{weather.weather[0].description}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[8px] text-slate-500 uppercase font-bold">Humedad</p>
                    <p className="text-sm font-bold">{weather.main?.humidity}%</p>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center bg-white/5 rounded-2xl mb-4 text-xs text-slate-500 animate-pulse border border-white/5">
                   Cargando clima actual...
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Vibe</p>
                  <p className="text-sm font-black text-cyan-400">{selectedPlace.vibe_score}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Seguridad</p>
                  <p className="text-sm font-black text-blue-400">{selectedPlace.safety}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Tráfico</p>
                  <p className="text-sm font-black text-rose-400">{selectedPlace.traffic}%</p>
                </div>
              </div>

              <button 
                onClick={() => getRoute(selectedPlace.lng, selectedPlace.lat)}
                className="w-full mt-6 bg-white text-black font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all uppercase text-[10px] tracking-widest active:scale-95 shadow-lg shadow-white/5"
              >
                Planear ruta ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}