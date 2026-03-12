import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";
const TODAY = new Date().toISOString().split("T")[0];

export default function dr() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [startingCall, setStartingCall] = useState(null);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API}/doctors`);
        const data = await res.json();
        if (data.success) setDoctors(data.doctors);
      } catch { setError("Could not load doctors."); }
      finally { setLoadingDoctors(false); }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;
    fetchAppointments();
  }, [selectedDoctor]);

  const fetchAppointments = async () => {
    try {
      setLoadingAppts(true);
      const res = await fetch(`${API}/doctor-dashboard/${selectedDoctor._id}/appointments?date=${TODAY}`);
      const data = await res.json();
      if (data.success) setAppointments(data.appointments);
    } catch { setError("Could not load appointments."); }
    finally { setLoadingAppts(false); }
  };

  const handleStartCall = async (bookingId) => {
    setStartingCall(bookingId);
    setError("");
    try {
      const res = await fetch(`${API}/doctor-dashboard/${bookingId}/start-call`, { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchAppointments();
      window.open(data.callLink, "_blank");
    } catch (err) { setError(err.message || "Failed to start call."); }
    finally { setStartingCall(null); }
  };

  const handleComplete = async (bookingId) => {
    try {
      const res = await fetch(`${API}/doctor-dashboard/${bookingId}/complete`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) fetchAppointments();
    } catch { setError("Could not update status."); }
  };

  const filtered = appointments.filter((a) => filterStatus === "all" ? true : a.status === filterStatus);

  const statusStyle = (status, callStarted) => {
    if (callStarted) return "bg-blue-900/40 text-blue-400 border-blue-800";
    if (status === "confirmed") return "bg-emerald-900/40 text-emerald-400 border-emerald-800";
    if (status === "completed") return "bg-slate-700 text-slate-400 border-slate-600";
    return "bg-red-900/40 text-red-400 border-red-800";
  };

  const statusLabel = (status, callStarted) => {
    if (callStarted) return "🔴 Call Active";
    if (status === "confirmed") return "✅ Confirmed";
    if (status === "completed") return "🏁 Completed";
    return "❌ Cancelled";
  };

  // Doctor Selection
  if (!selectedDoctor) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl">👨‍⚕️</div>
            <div>
              <h1 className="text-white font-bold text-lg">Doctor Dashboard</h1>
              <p className="text-slate-400 text-xs">RuralCare · Nabha Civil Hospital</p>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-white mb-2">Select Your Profile</h2>
          <p className="text-slate-400 text-sm mb-6">Choose your name to view today's appointments</p>
          {loadingDoctors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((d) => (
                <div key={d._id} onClick={() => setSelectedDoctor(d)}
                  className="cursor-pointer rounded-2xl p-5 border-2 border-slate-700 bg-slate-800/60 hover:border-blue-500 hover:bg-blue-950/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                      style={{ backgroundColor: d.color + "33", border: `2px solid ${d.color}`, color: d.color }}>
                      {d.avatar}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{d.name}</p>
                      <p className="text-slate-400 text-sm">{d.specialty}</p>
                      <p className="text-slate-500 text-xs">{d.experience}</p>
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

  // Appointments Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: selectedDoctor.color + "33", border: `2px solid ${selectedDoctor.color}`, color: selectedDoctor.color }}>
              {selectedDoctor.avatar}
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">{selectedDoctor.name}</h1>
              <p className="text-slate-400 text-xs">{selectedDoctor.specialty} · Today's Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden sm:block">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</span>
            <button onClick={() => setSelectedDoctor(null)} className="text-slate-400 hover:text-white text-sm border border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
              Switch
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            ["Total Today", appointments.length, "text-white"],
            ["Confirmed", appointments.filter(a => a.status === "confirmed").length, "text-emerald-400"],
            ["Completed", appointments.filter(a => a.status === "completed").length, "text-slate-400"],
          ].map(([label, count, color]) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-slate-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "confirmed", "completed"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-4 py-2 rounded-full border transition-all capitalize ${filterStatus === s ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
              {s}
            </button>
          ))}
          <button onClick={fetchAppointments} className="ml-auto text-xs px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:border-slate-500 transition-all">
            🔄 Refresh
          </button>
        </div>

        {error && <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm mb-4">⚠️ {error}</div>}

        {/* Appointments */}
        {loadingAppts ? (
          <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-800 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-white font-semibold text-lg">No appointments today</p>
            <p className="text-slate-400 text-sm mt-1">Your schedule is clear</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((appt) => (
              <div key={appt._id} className={`bg-slate-800 rounded-2xl p-5 border transition-all ${appt.callStarted ? "border-blue-700/50 bg-blue-950/10" : "border-slate-700"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-white font-semibold text-base">{appt.patientName}</h3>
                      <span className="text-slate-500 text-xs">Age {appt.patientAge}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle(appt.status, appt.callStarted)}`}>
                        {statusLabel(appt.status, appt.callStarted)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="text-slate-400">⏰ {appt.timeSlot}</span>
                      <span className="text-slate-400">📍 {appt.patientVillage}</span>
                      <span className="text-slate-400">📱 {appt.patientPhone}</span>
                      <span className="text-slate-400">{appt.callType === "video" ? "📹 Video" : "📞 Audio"}</span>
                    </div>
                    {appt.symptoms && (
                      <p className="text-slate-500 text-xs mt-2 bg-slate-700/40 rounded-lg px-3 py-1.5 inline-block">
                        🩺 {appt.symptoms}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {appt.status === "confirmed" && !appt.callStarted && (
                      <button onClick={() => handleStartCall(appt.bookingId)} disabled={startingCall === appt.bookingId}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${startingCall === appt.bookingId ? "bg-emerald-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500"} text-white`}>
                        {startingCall === appt.bookingId ? (
                          <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Starting...</>
                        ) : <>📹 Start Call</>}
                      </button>
                    )}
                    {appt.callStarted && appt.callLink && (
                      <button onClick={() => window.open(appt.callLink, "_blank")}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all">
                        🔴 Rejoin Call
                      </button>
                    )}
                    {appt.status === "confirmed" && (
                      <button onClick={() => handleComplete(appt.bookingId)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white transition-all">
                        ✓ Mark Done
                      </button>
                    )}
                    {appt.status === "completed" && (
                      <span className="px-4 py-2 rounded-xl text-sm text-center text-slate-500 bg-slate-700/50">🏁 Done</span>
                    )}
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