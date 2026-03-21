import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

const severityConfig = {
  Low:       { color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800", icon: "🟢" },
  Medium:    { color: "text-yellow-400",  bg: "bg-yellow-900/20 border-yellow-800",  icon: "🟡" },
  High:      { color: "text-orange-400",  bg: "bg-orange-900/20 border-orange-800",  icon: "🟠" },
  Emergency: { color: "text-red-400",     bg: "bg-red-900/20 border-red-800",        icon: "🔴" },
};

const probabilityColor = {
  High:   "text-red-400 bg-red-900/30",
  Medium: "text-yellow-400 bg-yellow-900/30",
  Low:    "text-slate-400 bg-slate-700/50",
};

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    const stored = localStorage.getItem("patient");
    if (stored) {
      const p = JSON.parse(stored);
      setPatient(p);
      if (p.age) setAge(p.age.toString());
    }
  }, []);

  const handleCheck = async () => {
    if (symptoms.trim().length < 5) { setError("Please describe your symptoms in more detail."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API}/symptom-check`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, age: age ? Number(age) : 30 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResult(data.result); setProvider(data.provider);
    } catch (err) {
      setError(err.message || "Could not analyze symptoms. Please try again.");
    } finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem("patient"); navigate("/patient-auth"); };
  const sev = result ? severityConfig[result.severity] || severityConfig.Low : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">←</button>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm sm:text-lg">AI Symptom Checker</h1>
              <p className="text-slate-400 text-xs hidden sm:block">Powered by Claude · RuralCare</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {patient && (
              <div className="hidden md:flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                <span className="text-emerald-400">👤</span><span>{patient.name}</span>
              </div>
            )}
            <button onClick={() => navigate("/consult")} className="hidden sm:flex text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold">
              Book Doctor
            </button>
            {patient && (
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 text-xs border border-slate-700 hover:border-red-700 px-2.5 py-1.5 rounded-lg transition-all">
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Input Card */}
        <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-700 mb-5 transition-all duration-700"
          style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          <h2 className="text-white font-bold text-lg sm:text-xl mb-1">Describe Your Symptoms</h2>
          <p className="text-slate-400 text-sm mb-4">Our AI will analyze and suggest possible conditions</p>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Your Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 35"
              className="w-full sm:w-32 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm" />
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Symptoms</label>
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. I have fever since 2 days, headache, body ache and sore throat..."
              rows={4}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-sm" />
            <p className="text-slate-600 text-xs mt-1">{symptoms.length} characters — more detail = better analysis</p>
          </div>

          {error && <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm mb-4">⚠️ {error}</div>}

          <button onClick={handleCheck} disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${loading ? "bg-purple-800 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 hover:scale-[1.02] shadow-lg shadow-purple-900/40"} text-white`}>
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Analyzing...</>
            ) : "🤖 Analyze Symptoms"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">Analyzed by {provider} AI</span>
            </div>

            <div className={`rounded-2xl p-4 border ${sev.bg} flex items-start gap-3`}>
              <span className="text-2xl shrink-0">{sev.icon}</span>
              <div>
                <h3 className={`font-bold text-base sm:text-lg ${sev.color}`}>{result.severity} Severity</h3>
                <p className="text-slate-300 text-sm mt-0.5">{result.severityReason}</p>
                <div className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${sev.bg} ${sev.color}`}>⏰ {result.urgency}</div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <h3 className="text-white font-bold mb-3 text-sm sm:text-base">🔍 Possible Conditions</h3>
              <div className="space-y-2">
                {result.possibleConditions?.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-700/40 rounded-xl p-3">
                    <span className="text-slate-400 text-xs font-bold w-4 shrink-0 mt-0.5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{c.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${probabilityColor[c.probability] || probabilityColor.Low}`}>{c.probability}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <h3 className="text-white font-bold mb-3 text-sm sm:text-base">💊 Recommendations</h3>
              <div className="space-y-2">
                {result.recommendations?.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 text-sm shrink-0">✓</span>
                    <p className="text-slate-300 text-sm">{r}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-blue-300 text-sm font-medium mb-0.5">Suggested Specialist</p>
                <p className="text-white font-bold text-base">👨⚕️ {result.suggestedSpecialty}</p>
              </div>
              <button onClick={() => navigate("/consult")}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
                Book {result.suggestedSpecialty} →
              </button>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs">⚕️ {result.disclaimer}</p>
            </div>

            <button onClick={() => { setResult(null); setSymptoms(""); setAge(""); }}
              className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white text-sm font-medium transition-all">
              Check Different Symptoms
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
