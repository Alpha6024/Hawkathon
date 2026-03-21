import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://ruralcare-o2er.onrender.com/api";

export default function BlockchainDashboard() {
  const navigate = useNavigate();
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true); setError("");
      const res  = await fetch(`${API}/blockchain/doctors`);
      const data = await res.json();
      if (data.success) setDoctors(data.doctors);
      else throw new Error(data.message);
    } catch (err) {
      setError(err.message || "Could not connect to blockchain. Make sure Hardhat node is running.");
    } finally { setLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg("");
    try {
      const res  = await fetch(`${API}/blockchain/sync-all`, { method: "POST" });
      const data = await res.json();
      if (data.success) { setSyncMsg(`✅ ${data.message}`); await fetchDoctors(); }
      else throw new Error(data.message);
    } catch (err) {
      setSyncMsg("❌ " + (err.message || "Sync failed"));
    } finally { setSyncing(false); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const specialtyColor = (specialty) => {
    const map = {
      "General Physician": "#10b981", "Cardiologist": "#3b82f6",
      "Pediatrician": "#f59e0b", "Gynecologist": "#ec4899",
      "Orthopedic": "#8b5cf6", "Dermatologist": "#f97316",
    };
    return map[specialty] || "#64748b";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">←</button>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm sm:text-lg">⛓️ Blockchain Registry</h1>
              <p className="text-slate-400 text-xs hidden sm:block">Immutable doctor records · Local Ethereum</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSync} disabled={syncing}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${syncing ? "border-slate-700 text-slate-600 cursor-not-allowed" : "border-purple-700 text-purple-400 hover:bg-purple-900/30"}`}>
              {syncing
                ? <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Syncing...</>
                : <>🔄 Sync</>}
            </button>
            <button onClick={fetchDoctors} className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 transition-all">↻</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 py-5">

        {syncMsg && (
          <div className={`rounded-xl p-3 text-sm mb-4 border ${syncMsg.startsWith("✅") ? "bg-emerald-900/20 border-emerald-800 text-emerald-400" : "bg-red-900/20 border-red-800 text-red-400"}`}>
            {syncMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5 transition-all duration-700"
          style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          {[
            ["⛓️ On Chain",  doctors.length,                          "text-purple-400"],
            ["✅ Available", doctors.filter(d => d.available).length, "text-emerald-400"],
            ["🔒 Immutable", doctors.length > 0 ? "Yes" : "—",        "text-blue-400"],
          ].map(([label, val, color]) => (
            <div key={label} className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-center hover:border-purple-700 transition-all">
              <p className={`text-xl sm:text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-slate-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="bg-purple-900/10 border border-purple-800/30 rounded-xl p-3 mb-5 flex items-start gap-2">
          <span className="text-lg shrink-0">🔗</span>
          <div>
            <p className="text-purple-300 text-sm font-semibold">How this works</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Every doctor registration is stored as an immutable transaction on a local Ethereum blockchain (Hardhat). Data cannot be edited or deleted.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 text-red-400 text-sm mb-5">
            ⚠️ {error}
            <p className="text-red-500 text-xs mt-1">Make sure: (1) Hardhat node is running, (2) Contract is deployed</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-800 animate-pulse" />)}
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⛓️</div>
            <p className="text-white font-semibold">No doctors on blockchain yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-5">Click "Sync" to store all existing doctors</p>
            <button onClick={handleSync} disabled={syncing}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all">
              🔄 Sync Now
            </button>
          </div>
        )}

        {!loading && doctors.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white font-bold text-sm mb-2">{doctors.length} Doctor{doctors.length > 1 ? "s" : ""} on Blockchain</h2>
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-purple-700/50 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ backgroundColor: specialtyColor(doctor.specialty) + "22", border: `2px solid ${specialtyColor(doctor.specialty)}`, color: specialtyColor(doctor.specialty) }}>
                    {doctor.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold text-sm">{doctor.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${doctor.available ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-slate-700 text-slate-400 border-slate-600"}`}>
                        {doctor.available ? "● Available" : "○ Unavailable"}
                      </span>
                      <span className="text-xs bg-purple-900/30 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded-full">#{doctor.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mb-2">
                      <span className="text-slate-400">🩺 {doctor.specialty}</span>
                      <span className="text-slate-400">⏱ {doctor.experience}</span>
                      <span className="text-emerald-400 font-medium">₹{doctor.fee}</span>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg px-2.5 py-1.5">
                      <p className="text-xs text-slate-500">🕐 Stored: <span className="text-slate-400">{doctor.timestamp}</span> · 🔒 Immutable</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
