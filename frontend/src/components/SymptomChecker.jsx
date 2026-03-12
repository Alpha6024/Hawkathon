import { useState } from "react";
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

  const handleCheck = async () => {
    if (symptoms.trim().length < 5) {
      setError("Please describe your symptoms in more detail.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/symptom-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, age: age ? Number(age) : 30 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResult(data.result);
      setProvider(data.provider);
    } catch (err) {
      setError(err.message || "Could not analyze symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sev = result ? severityConfig[result.severity] || severityConfig.Low : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl hover:bg-emerald-500 transition-colors">🏥</button>
            <div>
              <h1 className="text-white font-bold text-lg">AI Symptom Checker</h1>
              <p className="text-slate-400 text-xs">Powered by Claude · RuralCare</p>
            </div>
          </div>
          <button onClick={() => navigate("/consult")} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors font-semibold">
            Book Doctor →
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Input Card */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="text-white font-bold text-xl mb-1">Describe Your Symptoms</h2>
          <p className="text-slate-400 text-sm mb-5">Our AI will analyze and suggest possible conditions</p>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-medium mb-2">Your Age</label>
            <input
              type="number" value={age} onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 35"
              className="w-full sm:w-32 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="block text-slate-300 text-sm font-medium mb-2">Symptoms</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. I have fever since 2 days, headache, body ache and sore throat..."
              rows={4}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
            <p className="text-slate-600 text-xs mt-1">{symptoms.length} characters — more detail = better analysis</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm mb-4">⚠️ {error}</div>
          )}

          <button
            onClick={handleCheck}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 ${loading ? "bg-purple-800 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/40"} text-white`}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Analyzing symptoms...
              </>
            ) : "🤖 Analyze Symptoms"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* Provider badge */}
            <div className="flex items-center justify-end">
              <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
                Analyzed by {provider} AI
              </span>
            </div>

            {/* Severity Banner */}
            <div className={`rounded-2xl p-5 border ${sev.bg} flex items-start gap-4`}>
              <span className="text-3xl">{sev.icon}</span>
              <div>
                <h3 className={`font-bold text-lg ${sev.color}`}>{result.severity} Severity</h3>
                <p className="text-slate-300 text-sm mt-0.5">{result.severityReason}</p>
                <div className={`inline-block mt-2 text-sm font-semibold px-3 py-1 rounded-full ${sev.bg} ${sev.color}`}>
                  ⏰ {result.urgency}
                </div>
              </div>
            </div>

            {/* Possible Conditions */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h3 className="text-white font-bold mb-4">🔍 Possible Conditions</h3>
              <div className="space-y-3">
                {result.possibleConditions?.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-700/40 rounded-xl p-3">
                    <span className="text-slate-400 text-sm font-bold w-5 shrink-0 mt-0.5">{i + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{c.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${probabilityColor[c.probability] || probabilityColor.Low}`}>
                          {c.probability}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h3 className="text-white font-bold mb-4">💊 Recommendations</h3>
              <div className="space-y-2">
                {result.recommendations?.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-emerald-400 text-sm mt-0.5 shrink-0">✓</span>
                    <p className="text-slate-300 text-sm">{r}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Specialty */}
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-blue-300 text-sm font-medium mb-0.5">Suggested Specialist</p>
                <p className="text-white font-bold text-lg">👨‍⚕️ {result.suggestedSpecialty}</p>
              </div>
              <button
                onClick={() => navigate("/consult")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/40"
              >
                Book {result.suggestedSpecialty} →
              </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-xs">⚕️ {result.disclaimer}</p>
            </div>

            {/* Try Again */}
            <button
              onClick={() => { setResult(null); setSymptoms(""); setAge(""); }}
              className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white text-sm font-medium transition-all"
            >
              Check Different Symptoms
            </button>
          </div>
        )}
      </div>
    </div>
  );
}