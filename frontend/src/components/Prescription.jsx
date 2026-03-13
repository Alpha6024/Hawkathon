import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function Prescription() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [record, setRecord] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    diagnosis: "",
    prescription: "",
    notes: "",
    followUpDate: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("doctor");
    if (!stored) { navigate("/doctor-auth"); return; }
    setDoctor(JSON.parse(stored));
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch appointment
      const apptRes  = await fetch(`${API}/appointments/${bookingId}`);
      const apptData = await apptRes.json();
      if (!apptData.success) throw new Error(apptData.message || "Could not load appointment");
      setAppointment(apptData.appointment);

      // Fetch existing health record — may not exist yet if appointment not completed
      const recRes  = await fetch(`${API}/health-records/booking/${bookingId}`);
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
    if (!form.diagnosis.trim())
      return setError("Please enter a diagnosis.");

    setSaving(true);
    setError("");
    try {
      // Step 1 — Mark appointment as completed + create health record if not exists
      const completeRes  = await fetch(`${API}/doctor-dashboard/${bookingId}/complete`, { method: "PATCH" });
      const completeData = await completeRes.json();
      if (!completeData.success) throw new Error(completeData.message);

      // Step 2 — Get the health record (just created or existing)
      const recRes  = await fetch(`${API}/health-records/booking/${bookingId}`);
      const recData = await recRes.json();
      if (!recData.success || !recData.record)
        throw new Error("Health record could not be created. Try again.");

      const recordId = recData.record._id;

      // Step 3 — Save prescription details
      const res  = await fetch(`${API}/health-records/${recordId}`, {
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
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-white font-bold text-lg mb-2">Something went wrong</h2>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button onClick={() => navigate("/doctor")}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-all">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const patient = appointment;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/doctor")}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-lg transition-colors">←</button>
            <div>
              <h1 className="text-white font-bold text-lg">Write Prescription</h1>
              <p className="text-slate-400 text-xs">Booking: {bookingId}</p>
            </div>
          </div>
          {saved && (
            <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-full">
              ✓ Saved & Completed
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-6">

        {/* Error Banner at top */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-300 font-semibold text-sm">Error</p>
              <p className="text-red-200 text-xs">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {/* Patient Info Card */}
        {patient && (
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-6">
            <p className="text-slate-400 text-xs font-medium mb-3">PATIENT DETAILS</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/40 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-lg">
                {patient.patientName?.substring(0, 1)}
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">{patient.patientName}</h3>
                <p className="text-slate-400 text-sm">Age {patient.patientAge} · {patient.patientVillage}</p>
                <p className="text-slate-500 text-xs">📱 {patient.patientPhone}</p>
              </div>
            </div>
            {patient.symptoms && (
              <div className="bg-slate-700/50 rounded-xl px-4 py-3">
                <p className="text-slate-400 text-xs font-medium mb-1">🩺 REPORTED SYMPTOMS</p>
                <p className="text-white text-sm">{patient.symptoms}</p>
              </div>
            )}
          </div>
        )}

        {/* Success Banner */}
        {saved && (
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-emerald-400 font-semibold text-sm">Prescription Saved & Appointment Completed!</p>
              <p className="text-slate-400 text-xs">Patient can view it in Health Records using their mobile number.</p>
            </div>
          </div>
        )}

        {/* Prescription Form */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-5">
          <p className="text-white font-bold text-base">📋 Prescription Details</p>

          {/* Diagnosis */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Diagnosis <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.diagnosis}
              onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
              placeholder="e.g. Viral fever, Hypertension, Common cold..."
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Medicines */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              💊 Medicines & Dosage
            </label>
            <textarea
              value={form.prescription}
              onChange={e => setForm(f => ({ ...f, prescription: e.target.value }))}
              placeholder={`e.g.\n1. Paracetamol 500mg — twice daily for 3 days\n2. Cetirizine 10mg — once at night\n3. ORS — after every loose motion`}
              rows={5}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none font-mono text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              📝 Doctor's Notes <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional advice, lifestyle tips, warnings..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-sm"
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              📅 Follow-up Date <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Save Button */}
          <button onClick={handleSave} disabled={saving}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 ${saving ? "bg-emerald-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40"} text-white`}>
            {saving
              ? <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
              : saved ? "✓ Update Prescription" : "💾 Save & Complete Appointment"}
          </button>
        </div>

        {/* Info box */}
        <div className="mt-4 bg-blue-900/10 border border-blue-800/30 rounded-xl p-4">
          <p className="text-blue-300 text-sm font-medium mb-1">📱 How patient gets this</p>
          <p className="text-slate-400 text-xs">
            Patient goes to <strong className="text-white">Health Records</strong> → enters mobile number{" "}
            <strong className="text-white">{patient?.patientPhone}</strong> → sees full prescription.
          </p>
        </div>

        {/* Back button */}
        <button onClick={() => navigate("/doctor")}
          className="w-full mt-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white text-sm font-medium transition-all">
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}