import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "https://ruralcare-o2er.onrender.com/api";

export default function Prescription() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ diagnosis: "", prescription: "", notes: "", followUpDate: "" });

  useEffect(() => {
    const stored = localStorage.getItem("doctor");
    if (!stored) { navigate("/doctor-auth"); return; }
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const apptRes = await fetch(`${API}/appointments/${bookingId}`);
      const apptData = await apptRes.json();
      if (!apptData.success) throw new Error(apptData.message || "Could not load appointment");
      setAppointment(apptData.appointment);

      const recRes = await fetch(`${API}/health-records/booking/${bookingId}`);
      const recData = await recRes.json();
      if (recData.success && recData.record) {
        setRecord(recData.record);
        setForm({
          diagnosis:    recData.record.diagnosis    || "",
          prescription: recData.record.prescription || "",
          notes:        recData.record.notes        || "",
          followUpDate: recData.record.followUpDate ? recData.record.followUpDate.split('T')[0] : "",
        });
        if (recData.record.diagnosis || recData.record.prescription) setSaved(true);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Could not load appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.diagnosis.trim()) return setError("Please enter a diagnosis.");
    setSaving(true);
    setError("");
    try {
      const completeRes = await fetch(`${API}/doctor-dashboard/${bookingId}/complete`, { method: "PATCH" });
      const completeData = await completeRes.json();
      if (!completeData.success) throw new Error(completeData.message);

      const recRes = await fetch(`${API}/health-records/booking/${bookingId}`);
      const recData = await recRes.json();
      if (!recData.success || !recData.record) throw new Error("Health record could not be created. Try again.");

      const res = await fetch(`${API}/health-records/${recData.record._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setRecord(data.record);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Could not save prescription.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-white font-bold mb-2">Something went wrong</h2>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button onClick={() => navigate("/doctor")} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-all">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const patient = appointment;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate("/doctor")}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">←</button>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-base">Write Prescription</h1>
              <p className="text-slate-400 text-xs truncate">Booking: {bookingId}</p>
            </div>
          </div>
          {saved && (
            <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full shrink-0">
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-5">

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-3 mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <p className="text-red-300 text-sm flex-1">{error}</p>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 shrink-0">×</button>
          </div>
        )}

        {/* Patient Info */}
        {patient && (
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-4">
            <p className="text-slate-400 text-xs font-medium mb-2">PATIENT DETAILS</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                {patient.patientName?.substring(0, 1)}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm">{patient.patientName}</h3>
                <p className="text-slate-400 text-xs">Age {patient.patientAge} · {patient.patientVillage}</p>
                <p className="text-slate-500 text-xs">📱 {patient.patientPhone}</p>
              </div>
            </div>
            {patient.symptoms && (
              <div className="bg-slate-700/50 rounded-xl px-3 py-2">
                <p className="text-slate-400 text-xs font-medium mb-0.5">🩺 SYMPTOMS</p>
                <p className="text-white text-sm">{patient.symptoms}</p>
              </div>
            )}
          </div>
        )}

        {saved && (
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-2xl p-3 mb-4 flex items-center gap-2">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-emerald-400 font-semibold text-sm">Prescription Saved!</p>
              <p className="text-slate-400 text-xs">Patient can view via Health Records.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-4">
          <p className="text-white font-bold text-sm">📋 Prescription Details</p>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Diagnosis <span className="text-red-400">*</span></label>
            <input type="text" value={form.diagnosis}
              onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
              placeholder="e.g. Viral fever, Hypertension..."
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm" />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">💊 Medicines & Dosage</label>
            <textarea value={form.prescription}
              onChange={e => setForm(f => ({ ...f, prescription: e.target.value }))}
              placeholder={`e.g.\n1. Paracetamol 500mg — twice daily\n2. Cetirizine 10mg — once at night`}
              rows={4}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none font-mono text-sm" />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">📝 Doctor's Notes <span className="text-slate-500">(optional)</span></label>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional advice, lifestyle tips..."
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-sm" />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">📅 Follow-up Date <span className="text-slate-500">(optional)</span></label>
            <input type="date" value={form.followUpDate}
              onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${saving ? "bg-emerald-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40"} text-white`}>
            {saving
              ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
              : saved ? "✓ Update Prescription" : "💾 Save & Complete Appointment"}
          </button>
        </div>

        <div className="mt-3 bg-blue-900/10 border border-blue-800/30 rounded-xl p-3">
          <p className="text-blue-300 text-xs font-medium mb-0.5">📱 How patient gets this</p>
          <p className="text-slate-400 text-xs">
            Patient → Health Records → enters <strong className="text-white">{patient?.patientPhone}</strong>
          </p>
        </div>

        <button onClick={() => navigate("/doctor")}
          className="w-full mt-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white text-sm font-medium transition-all">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
