import MapComponent from '@/components/MapComponent';

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* HUD de la Aplicación */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl">
          VIBE<span className="text-cyan-400 underline decoration-pink-500">CHECK</span>
        </h1>
        <p className="text-slate-300 font-medium ml-1">Explora el pulso de tu ciudad</p>
      </div>

      {/* El Mapa */}
      <MapComponent />

      {/* Overlay de diseño (opcional para dar un toque cinematográfico) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]"></div>
    </main>
  );
}