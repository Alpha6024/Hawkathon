import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Hero() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 transform transition-all duration-700 ease-out" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(-100%)', opacity: isVisible ? 1 : 0 }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-lg">🏥</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">RuralCare</h1>
              <p className="text-slate-400 text-xs hidden sm:block">Nabha Civil Hospital · Telemedicine</p>
            </div>
          </div>
          <button onClick={() => navigate("/blockchain")}
            className="flex items-center gap-1.5 text-xs bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 px-2.5 py-1.5 rounded-full border border-purple-800 transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="hidden sm:inline">Blockchain</span>
            <span className="sm:hidden">⛓️</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-xl w-full text-center transform transition-all duration-1000 ease-out delay-200" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(50px)', opacity: isVisible ? 1 : 0 }}>
          <div className="text-5xl sm:text-6xl mb-4">🏥</div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            Healthcare at <span className="text-emerald-400">Your Doorstep</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-1">
            Consult doctors from 173 villages around Nabha — no travel, no waiting.
          </p>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">
            Works on 2G · Free for rural patients
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3" style={{ transform: isVisible ? 'scale(1)' : 'scale(0.9)', opacity: isVisible ? 1 : 0 }}>
            <button onClick={() => navigate("/patient-auth")}
              className="group relative bg-emerald-600 hover:bg-emerald-500 rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-emerald-900/40">
              <div className="text-3xl sm:text-4xl mb-2">🧑‍⚕️</div>
              <h3 className="text-white font-bold text-sm sm:text-lg mb-0.5">Book Doctor</h3>
              <p className="text-emerald-100/70 text-xs sm:text-sm">Login or sign up to consult</p>
              <div className="absolute bottom-3 right-3 text-emerald-200/50 group-hover:translate-x-1 transition-transform">→</div>
            </button>

            <button onClick={() => navigate("/doctor-auth")}
              className="group relative bg-blue-600 hover:bg-blue-500 rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-blue-900/40">
              <div className="text-3xl sm:text-4xl mb-2">👨‍⚕️</div>
              <h3 className="text-white font-bold text-sm sm:text-lg mb-0.5">Doctor Login</h3>
              <p className="text-blue-100/70 text-xs sm:text-sm">View appointments & start calls</p>
              <div className="absolute bottom-3 right-3 text-blue-200/50 group-hover:translate-x-1 transition-transform">→</div>
            </button>

            <button onClick={() => navigate("/symptoms")}
              className="group relative bg-purple-600 hover:bg-purple-500 rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-purple-900/40">
              <div className="text-3xl sm:text-4xl mb-2">🤖</div>
              <h3 className="text-white font-bold text-sm sm:text-lg mb-0.5">AI Symptom Check</h3>
              <p className="text-purple-100/70 text-xs sm:text-sm">Instant AI health analysis</p>
              <div className="absolute bottom-3 right-3 text-purple-200/50 group-hover:translate-x-1 transition-transform">→</div>
            </button>

            <button onClick={() => navigate("/records")}
              className="group relative bg-orange-600 hover:bg-orange-500 rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-orange-900/40">
              <div className="text-3xl sm:text-4xl mb-2">📋</div>
              <h3 className="text-white font-bold text-sm sm:text-lg mb-0.5">Health Records</h3>
              <p className="text-orange-100/70 text-xs sm:text-sm">View past consultations</p>
              <div className="absolute bottom-3 right-3 text-orange-200/50 group-hover:translate-x-1 transition-transform">→</div>
            </button>
          </div>

          <button onClick={() => navigate("/blockchain")}
            className="group w-full bg-slate-800/60 hover:bg-slate-800 border border-purple-800/50 hover:border-purple-600 rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.02] mb-5">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⛓️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-white font-bold text-sm">Blockchain Registry</h3>
                  <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full border border-purple-800">Live</span>
                </div>
                <p className="text-slate-400 text-xs">Tamper-proof doctor records on Ethereum</p>
              </div>
              <div className="text-purple-400/50 group-hover:translate-x-1 transition-transform shrink-0">→</div>
            </div>
          </button>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[["173","Villages"],["6+","Doctors"],["2G","Bandwidth"]].map(([val, label]) => (
              <div key={label} className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700">
                <p className="text-emerald-400 font-bold text-lg sm:text-xl">{val}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
