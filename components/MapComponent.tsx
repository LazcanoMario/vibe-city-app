"use client";

import React, { useState, useMemo } from "react";
import Map, { Marker, NavigationControl, Source, Layer, ViewStateChangeEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { cityData } from "@/Data/vibes"; 
import { MapPin, Shield, Waves, Car, X, Navigation, Layers } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function MapComponent() {
  const [viewState, setViewState] = useState({
    longitude: -116.602,
    latitude: 31.86,
    zoom: 12,
  });

  const [filter, setFilter] = useState("default");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);

  // 1. LÓGICA DE ESTILO DE MAPA
  const currentMapStyle = isSatellite 
    ? "mapbox://styles/mapbox/satellite-streets-v12" 
    : "mapbox://styles/mapbox/dark-v11";

  // 2. FUNCIÓN PARA OBTENER RUTA DESDE MI UBICACIÓN
  const getRoute = async (destLng: number, destLat: number) => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const start = [pos.coords.longitude, pos.coords.latitude];
      
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${destLng},${destLat}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const json = await query.json();
        const data = json.routes[0].geometry;
        
        setRouteData({
          type: "Feature",
          properties: {},
          geometry: data,
        });

        // Hacer zoom para que se vea el inicio de la ruta
        setViewState({
          ...viewState,
          longitude: start[0],
          latitude: start[1],
          zoom: 14,
        });
      } catch (error) {
        alert("Error al calcular la ruta");
      }
    }, () => alert("Por favor activa el GPS para trazar la ruta"));
  };

  const goToMyLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setViewState({
        ...viewState,
        longitude: pos.coords.longitude,
        latitude: pos.coords.latitude,
        zoom: 14,
      });
    }, () => alert("GPS no disponible"));
  };

  const getPinColor = (place: any) => {
    if (filter === "traffic") return place.traffic > 60 ? "text-red-500" : "text-green-400";
    if (filter === "safety") return place.safety > 80 ? "text-blue-400" : "text-orange-500";
    if (filter === "beach") return place.type === "beach" ? "text-cyan-400" : "text-slate-500 opacity-30";
    return place.type === "beach" ? "text-cyan-400" : "text-rose-500";
  };

  const closeDetails = () => {
    setSelectedPlace(null);
    setRouteData(null); // Limpiamos la ruta al cerrar
  };

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden font-sans">
      
      {/* CONTROLES LATERALES */}
      <div className="absolute top-24 left-6 z-20 flex flex-col gap-3">
        <button
          onClick={goToMyLocation}
          className="p-4 rounded-2xl backdrop-blur-xl bg-cyan-500/20 border-2 border-cyan-500/50 shadow-2xl hover:scale-110 transition-all mb-2 text-cyan-400"
        >
          <Navigation className="animate-pulse" size={20} />
        </button>

        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className={`p-4 rounded-2xl backdrop-blur-xl border-2 transition-all shadow-2xl mb-4 ${
            isSatellite ? "border-yellow-500 bg-yellow-500/20 text-yellow-400" : "border-white/10 bg-black/40 text-white"
          }`}
        >
          <Layers size={20} />
        </button>

        {[
          { id: "traffic", icon: <Car size={20} />, color: "border-red-500" },
          { id: "safety", icon: <Shield size={20} />, color: "border-blue-500" },
          { id: "beach", icon: <Waves size={20} />, color: "border-cyan-500" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => {
                setFilter(filter === btn.id ? "default" : btn.id);
                closeDetails();
            }}
            className={`p-4 rounded-2xl backdrop-blur-xl transition-all border-2 shadow-2xl ${
              filter === btn.id ? `${btn.color} bg-white/20 scale-110` : "bg-black/40 border-white/10 text-white"
            }`}
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

        {/* CAPA DE LA RUTA (LINEA GEOJSON) */}
        {routeData && (
          <Source id="my-route" type="geojson" data={routeData}>
            <Layer
              id="route-layer"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": "#06b6d4",
                "line-width": 6,
                "line-blur": 2,
                "line-opacity": 0.8
              }}
            />
          </Source>
        )}

        {cityData.map((place) => (
          <Marker key={place.id} longitude={place.coordinates.lng} latitude={place.coordinates.lat} anchor="bottom">
            <div onClick={() => { setSelectedPlace(place); setRouteData(null); }} className="group cursor-pointer flex flex-col items-center">
              <div className="bg-white/90 text-black text-[10px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold whitespace-nowrap">
                {place.name}
              </div>
              <MapPin className={`${getPinColor(place)} transition-all`} fill="currentColor" size={selectedPlace?.id === place.id ? 38 : 28} />
              <div className="w-2 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
            </div>
          </Marker>
        ))}
      </Map>

      {/* TARJETA DE DETALLES */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            className="absolute bottom-10 left-1/2 z-30 w-[90%] max-w-[360px]"
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 shadow-2xl text-white">
              <button onClick={closeDetails} className="absolute top-5 right-5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black tracking-tight">{selectedPlace.name}</h2>
                <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {selectedPlace.type === 'beach' ? '🏖️ Zona Costera' : '🍸 Punto de Interés'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Tráfico</p>
                  <p className="text-sm font-black text-rose-400">{selectedPlace.traffic}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Seguridad</p>
                  <p className="text-sm font-black text-blue-400">{selectedPlace.safety}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Vibe</p>
                  <p className="text-sm font-black text-cyan-400">{selectedPlace.vibeScore}</p>
                </div>
              </div>

              <button 
                onClick={() => getRoute(selectedPlace.coordinates.lng, selectedPlace.coordinates.lat)}
                className="w-full mt-6 bg-white text-black font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all uppercase text-[10px] tracking-widest active:scale-95"
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