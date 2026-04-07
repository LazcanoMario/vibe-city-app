import MapComponent from '@/components/MapComponent';

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Título de la App Flotante */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl">
          VIBE<span className="text-cyan-400 underline decoration-pink-500 underline-offset-4">CHECK</span>
        </h1>
        <p className="text-slate-400 font-medium ml-1 text-sm uppercase tracking-widest">
          City Intelligence Hub
        </p>
      </div>

      {/* Nuestro Componente del Mapa */}
      <MapComponent />
      
      {/* Overlay de viñeta para que se vea más 'pro' */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.7)]"></div>
    </main>
  );
}