import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Hero() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 transform transition-all duration-700 ease-out" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(-100%)', opacity: isVisible ? 1 : 0 }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl">🏥</div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">RuralCare</h1>
              <p className="text-slate-400 text-xs">Nabha Civil Hospital · Telemedicine</p>
            </div>
          </div>
          {/* Blockchain badge */}
          <button onClick={() => navigate("/blockchain")}
            className="flex items-center gap-2 text-xs bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 px-3 py-1.5 rounded-full border border-purple-800 transition-all">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Blockchain
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full text-center transform transition-all duration-1000 ease-out delay-200" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(50px)', opacity: isVisible ? 1 : 0 }}>
          <div className="text-6xl mb-6 animate-bounce-slow">🏥</div>
          <h2 className="text-4xl font-bold text-white mb-3">
            Healthcare at <span className="text-emerald-400">Your Doorstep</span>
          </h2>
          <p className="text-slate-400 text-base mb-2">
            Consult doctors from 173 villages around Nabha — no travel, no waiting.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Works on 2G · Available in Hindi & Punjabi · Free for rural patients
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4 transform transition-all duration-1000 ease-out delay-300" style={{ transform: isVisible ? 'scale(1)' : 'scale(0.9)', opacity: isVisible ? 1 : 0 }}>
            <button onClick={() => navigate("/patient-auth")}
              className="group relative bg-emerald-600 hover:bg-emerald-500 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-emerald-900/40 hover:shadow-2xl hover:shadow-emerald-900/60">
              <div className="text-4xl mb-3">🧑‍⚕️</div>
              <h3 className="text-white font-bold text-lg mb-1">Book Doctor</h3>
              <p className="text-emerald-100/70 text-sm">Login or sign up to consult</p>
              <div className="absolute bottom-4 right-4 text-emerald-200/50 text-xl group-hover:translate-x-1 transition-transform">→</div>
            </button>

            <button onClick={() => navigate("/doctor-auth")}
              className="group relative bg-blue-600 hover:bg-blue-500 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-blue-900/40 hover:shadow-2xl hover:shadow-blue-900/60">
              <div className="text-4xl mb-3">👨‍⚕️</div>
              <h3 className="text-white font-bold text-lg mb-1">Doctor Login</h3>
              <p className="text-blue-100/70 text-sm">View appointments & start calls</p>
              <div className="absolute bottom-4 right-4 text-blue-200/50 text-xl group-hover:translate-x-1 transition-transform">→</div>
            </button>

            <button onClick={() => navigate("/symptoms")}
              className="group relative bg-purple-600 hover:bg-purple-500 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-purple-900/40 hover:shadow-2xl hover:shadow-purple-900/60">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-white font-bold text-lg mb-1">AI Symptom Check</h3>
              <p className="text-purple-100/70 text-sm">Instant AI health analysis</p>
              <div className="absolute bottom-4 right-4 text-purple-200/50 text-xl group-hover:translate-x-1 transition-transform">→</div>
            </button>

            <button onClick={() => navigate("/records")}
              className="group relative bg-orange-600 hover:bg-orange-500 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg shadow-orange-900/40 hover:shadow-2xl hover:shadow-orange-900/60">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-white font-bold text-lg mb-1">Health Records</h3>
              <p className="text-orange-100/70 text-sm">View past consultations</p>
              <div className="absolute bottom-4 right-4 text-orange-200/50 text-xl group-hover:translate-x-1 transition-transform">→</div>
            </button>
          </div>

          {/* Blockchain Dashboard Card */}
          <button onClick={() => navigate("/blockchain")}
            className="group w-full bg-slate-800/60 hover:bg-slate-800 border border-purple-800/50 hover:border-purple-600 rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 mb-8 hover:shadow-xl hover:shadow-purple-900/40">
            <div className="flex items-center gap-4">
              <div className="text-4xl">⛓️</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-base">Blockchain Registry</h3>
                  <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full border border-purple-800">Live</span>
                </div>
                <p className="text-slate-400 text-sm">View tamper-proof doctor records stored on Ethereum blockchain</p>
              </div>
              <div className="text-purple-400/50 text-xl group-hover:translate-x-1 transition-transform">→</div>
            </div>
          </button>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[["173","Villages Covered"],["6+","Doctors Online"],["2G","Low Bandwidth"]].map(([val, label]) => (
              <div key={label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                <p className="text-emerald-400 font-bold text-xl">{val}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}