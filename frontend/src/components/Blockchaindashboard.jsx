import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function BlockchainDashboard() {
  const navigate = useNavigate();
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");
      const res  = await fetch(`${API}/blockchain/doctors`);
      const data = await res.json();
      if (data.success) setDoctors(data.doctors);
      else throw new Error(data.message);
    } catch (err) {
      setError(err.message || "Could not connect to blockchain. Make sure Hardhat node is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res  = await fetch(`${API}/blockchain/sync-all`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`✅ ${data.message}`);
        await fetchDoctors();
      } else throw new Error(data.message);
    } catch (err) {
      setSyncMsg("❌ " + (err.message || "Sync failed"));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const specialtyColor = (specialty) => {
    const map = {
      "General Physician": "#10b981",
      "Cardiologist":      "#3b82f6",
      "Pediatrician":      "#f59e0b",
      "Gynecologist":      "#ec4899",
      "Orthopedic":        "#8b5cf6",
      "Dermatologist":     "#f97316",
    };
    return map[specialty] || "#64748b";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-lg transition-colors">←</button>
              <div>
                <h1 className="text-white font-bold text-lg">⛓️ Blockchain Registry</h1>
                <p className="text-slate-400 text-xs">Immutable doctor records · Local Ethereum</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSync} disabled={syncing}
                className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${syncing ? "border-slate-700 text-slate-600 cursor-not-allowed" : "border-purple-700 text-purple-400 hover:bg-purple-900/30"}`}>
                {syncing
                  ? <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Syncing...</>
                  : <>🔄 Sync</>}
              </button>
              <button onClick={fetchDoctors}
                className="text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 transition-all">
                ↻
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 py-6">

        {/* Sync message */}
        {syncMsg && (
          <div className={`rounded-xl p-3 text-sm mb-4 border ${syncMsg.startsWith("✅") ? "bg-emerald-900/20 border-emerald-800 text-emerald-400" : "bg-red-900/20 border-red-800 text-red-400"}`}>
            {syncMsg}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6 transform transition-all duration-700 ease-out" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          {[
            ["⛓️ On Chain",    doctors.length,                              "text-purple-400"],
            ["✅ Available",   doctors.filter(d => d.available).length,     "text-emerald-400"],
            ["🔒 Immutable",   doctors.length > 0 ? "Yes" : "—",            "text-blue-400"],
          ].map(([label, val, color]) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center transition-all duration-300 hover:border-purple-700 hover:scale-105">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-slate-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="bg-purple-900/10 border border-purple-800/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">🔗</span>
          <div>
            <p className="text-purple-300 text-sm font-semibold">How this works</p>
            <p className="text-slate-400 text-xs mt-1">
              Every doctor registration is stored as an immutable transaction on a local Ethereum blockchain (Hardhat).
              Data cannot be edited or deleted — only new records can be added. Each record has a unique transaction hash as proof.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm mb-6">
            ⚠️ {error}
            <p className="text-red-500 text-xs mt-1">Make sure: (1) Hardhat node is running, (2) Contract is deployed</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-800 animate-pulse" />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && doctors.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⛓️</div>
            <p className="text-white font-semibold text-lg">No doctors on blockchain yet</p>
            <p className="text-slate-400 text-sm mt-2 mb-6">Click "Sync DB → Chain" to store all existing doctors</p>
            <button onClick={handleSync} disabled={syncing}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-all">
              🔄 Sync Now
            </button>
          </div>
        )}

        {/* Doctor cards */}
        {!loading && doctors.length > 0 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-white font-bold text-base mb-3">
              {doctors.length} Doctor{doctors.length > 1 ? "s" : ""} on Blockchain
            </h2>
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-purple-700/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-900/20">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0"
                    style={{ backgroundColor: specialtyColor(doctor.specialty) + "22", border: `2px solid ${specialtyColor(doctor.specialty)}`, color: specialtyColor(doctor.specialty) }}>
                    {doctor.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold">{doctor.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${doctor.available ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-slate-700 text-slate-400 border-slate-600"}`}>
                        {doctor.available ? "● Available" : "○ Unavailable"}
                      </span>
                      {/* Block ID badge */}
                      <span className="text-xs bg-purple-900/30 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded-full">
                        #{doctor.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2">
                      <span className="text-slate-400">🩺 {doctor.specialty}</span>
                      <span className="text-slate-400">⏱ {doctor.experience}</span>
                      <span className="text-emerald-400 font-medium">₹{doctor.fee}</span>
                    </div>

                    {/* Blockchain metadata */}
                    <div className="bg-slate-900/60 rounded-lg px-3 py-2 mt-2">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                        <span className="text-slate-500">🕐 Stored: <span className="text-slate-400">{doctor.timestamp}</span></span>
                        <span className="text-slate-500">🔒 Immutable on-chain record</span>
                      </div>
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