import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = "http://localhost:5000/api";
const TODAY = new Date().toISOString().split("T")[0];

export default function dr() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [startingCall, setStartingCall] = useState(null);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("doctor");
    if (!stored) { navigate("/doctor-auth"); return; }
    const doc = JSON.parse(stored);
    setDoctor(doc);
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!doctor) return;
    fetchAppointments();
  }, [doctor]);

  const fetchAppointments = async () => {
    try {
      setLoadingAppts(true);
      const res = await fetch(`${API}/doctor-dashboard/${doctor._id}/appointments?date=${TODAY}`);
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
      window.open(data.callLink, '_blank', 'width=1200,height=800');
      await fetchAppointments();
    } catch (err) { setError(err.message || "Failed to start call."); }
    finally { setStartingCall(null); }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctor");
    navigate("/doctor-auth");
  };

  const filtered = appointments.filter((a) => filterStatus === "all" ? true : a.status === filterStatus);

  const getTimeSlotData = () => {
    const slots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
    return slots.map(slot => ({
      time: slot,
      appointments: appointments.filter(a => a.timeSlot === slot && a.status !== "cancelled").length
    }));
  };

  const getStatusData = () => [
    { name: "Confirmed", value: appointments.filter(a => a.status === "confirmed").length, color: "#10b981" },
    { name: "Completed", value: appointments.filter(a => a.status === "completed").length, color: "#64748b" },
    { name: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length, color: "#ef4444" },
  ].filter(item => item.value > 0);

  const getCallTypeData = () => [
    { name: "Video", value: appointments.filter(a => a.callType === "video").length, color: "#3b82f6" },
    { name: "Audio", value: appointments.filter(a => a.callType === "audio").length, color: "#8b5cf6" },
  ].filter(item => item.value > 0);

  const statusStyle = (status, callStarted) => {
    if (callStarted)            return "bg-blue-900/40 text-blue-400 border-blue-800";
    if (status === "confirmed") return "bg-emerald-900/40 text-emerald-400 border-emerald-800";
    if (status === "completed") return "bg-slate-700 text-slate-400 border-slate-600";
    return "bg-red-900/40 text-red-400 border-red-800";
  };

  const statusLabel = (status, callStarted) => {
    if (callStarted)            return "🔴 Call Active";
    if (status === "confirmed") return "✅ Confirmed";
    if (status === "completed") return "🏁 Completed";
    return "❌ Cancelled";
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-lg transition-colors">←</button>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0"
                style={{ backgroundColor: (doctor.color || "#10b981") + "33", border: `2px solid ${doctor.color || "#10b981"}`, color: doctor.color || "#10b981" }}>
                {doctor.avatar || doctor.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">{doctor.name}</h1>
                <p className="text-slate-400 text-xs">{doctor.specialty} · Today's Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs hidden md:block">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
              </span>
              <button onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 text-xs border border-slate-700 hover:border-red-700 px-3 py-2 rounded-lg transition-all">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 transform transition-all duration-700 ease-out"
          style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          {[
            ["Total Today",  appointments.length,                                       "text-white"],
            ["Confirmed",    appointments.filter(a => a.status === "confirmed").length,  "text-emerald-400"],
            ["Completed",    appointments.filter(a => a.status === "completed").length,  "text-slate-400"],
          ].map(([label, count, color]) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center transition-all duration-300 hover:border-slate-600 hover:scale-105">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-slate-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Analytics */}
        {appointments.length > 0 && (
          <div className="mb-6 space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">📊 Today's Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <h3 className="text-white font-semibold text-sm mb-4">Appointments by Time Slot</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getTimeSlotData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#10b981' }} />
                    <Bar dataKey="appointments" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <h3 className="text-white font-semibold text-sm mb-4">Appointment Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={getStatusData()} cx="50%" cy="50%" labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80} dataKey="value">
                      {getStatusData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {getCallTypeData().length > 0 && (
                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                  <h3 className="text-white font-semibold text-sm mb-4">Call Type Preference</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={getCallTypeData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                        paddingAngle={5} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {getCallTypeData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <h3 className="text-white font-semibold text-sm mb-4">📈 Quick Insights</h3>
                <div className="space-y-3">
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Busiest Time Slot</p>
                    <p className="text-white font-bold text-lg">
                      {getTimeSlotData().reduce((max, slot) => slot.appointments > max.appointments ? slot : max, { time: 'N/A', appointments: 0 }).time}
                    </p>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Completion Rate</p>
                    <p className="text-emerald-400 font-bold text-lg">
                      {appointments.length > 0 ? ((appointments.filter(a => a.status === "completed").length / appointments.length) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Total Consultations</p>
                    <p className="text-blue-400 font-bold text-lg">{doctor.totalConsultations || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "confirmed", "completed"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-4 py-2 rounded-full border transition-all capitalize ${filterStatus === s ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
              {s}
            </button>
          ))}
          <button onClick={fetchAppointments}
            className="ml-auto text-xs px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:border-slate-500 transition-all">
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
              <div key={appt._id}
                className={`bg-slate-800 rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg ${appt.callStarted ? "border-blue-700/50 bg-blue-950/10" : "border-slate-700 hover:border-slate-600"}`}>
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
                    {/* Start Call */}
                    {appt.status === "confirmed" && !appt.callStarted && (
                      <button onClick={() => handleStartCall(appt.bookingId)} disabled={startingCall === appt.bookingId}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${startingCall === appt.bookingId ? "bg-emerald-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 hover:scale-105"} text-white`}>
                        {startingCall === appt.bookingId
                          ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Starting...</>
                          : <>📹 Start Call</>}
                      </button>
                    )}

                    {/* Rejoin Call */}
                    {appt.callStarted && appt.callLink && (
                      <button onClick={() => window.open(appt.callLink, '_blank', 'width=1200,height=800')}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 hover:scale-105 text-white transition-all duration-300">
                        🔴 Rejoin Call
                      </button>
                    )}

                    {/* 💊 Write Prescription — only show after call started */}
                    {appt.status === "confirmed" && appt.callStarted && (
                      <button onClick={() => navigate(`/prescription/${appt.bookingId}`)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 hover:scale-105 text-white transition-all duration-300">
                        💊 Prescribe & Done
                      </button>
                    )}

                    {/* Completed — edit prescription */}
                    {appt.status === "completed" && (
                      <button onClick={() => navigate(`/prescription/${appt.bookingId}`)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-purple-700 text-purple-400 hover:bg-purple-900/30 transition-all">
                        📋 Edit Prescription
                      </button>
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