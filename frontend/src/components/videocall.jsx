import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function VideoCall() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const [appointment, setAppointment] = useState(null);
  const [callLink, setCallLink] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const [doctorStarted, setDoctorStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoom = async () => {
    try {
      const res = await fetch(`${API}/appointments/${bookingId}/room`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAppointment(data.appointment);
      if (data.callStarted && data.callLink) {
        setCallLink(data.callLink);
        setDoctorStarted(true);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (err) {
      setError(err.message || "Could not load appointment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    pollRef.current = setInterval(fetchRoom, 5000);
    return () => clearInterval(pollRef.current);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">Appointment Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate("/consult")} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors">
            Book New Appointment
          </button>
        </div>
      </div>
    );
  }

  const doc = appointment?.doctor;

  // Active Call iframe
  if (callStarted && callLink) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: doc?.color + "33", color: doc?.color }}>
              {doc?.avatar}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{doc?.name}</p>
              <p className="text-slate-400 text-xs">{doc?.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Live
            </span>
            <button onClick={() => setCallStarted(false)} className="text-xs bg-red-900/40 text-red-400 border border-red-800 px-3 py-1.5 rounded-full hover:bg-red-800/40 transition-colors">
              ✕ End
            </button>
          </div>
        </div>
        <div className="flex-1">
          <iframe src={callLink} allow="camera; microphone; fullscreen; speaker; display-capture"
            className="w-full h-full min-h-[calc(100vh-60px)]" style={{ border: "none" }} title="Video Consultation" />
        </div>
      </div>
    );
  }

  // Waiting Room / Pre-call
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl">🏥</div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">RuralCare</h1>
              <p className="text-slate-400 text-xs">Nabha Civil Hospital · Telemedicine</p>
            </div>
          </div>
          <button onClick={() => navigate("/consult")} className="text-slate-400 hover:text-white text-sm transition-colors">← Back</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-slate-500 text-xs mb-1">Booking ID</p>
          <span className="text-emerald-400 font-mono text-2xl font-bold tracking-widest">{bookingId}</span>
        </div>

        {/* Doctor + Appointment Info */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl shrink-0"
              style={{ backgroundColor: doc?.color + "33", border: `2px solid ${doc?.color}`, color: doc?.color }}>
              {doc?.avatar}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{doc?.name}</h2>
              <p className="text-slate-400 text-sm">{doc?.specialty}</p>
              <p className="text-emerald-400 text-sm font-medium mt-0.5">₹{doc?.fee}</p>
            </div>
          </div>
          <div className="space-y-2.5 border-t border-slate-700 pt-4">
            {[
              ["👤 Patient",  appointment?.patientName + ", Age " + appointment?.patientAge],
              ["📅 Date",     appointment?.date],
              ["⏰ Time",     appointment?.timeSlot],
              [appointment?.callType === "video" ? "📹 Call" : "📞 Call", appointment?.callType === "video" ? "Video Call" : "Audio Call"],
              ["📍 Location", appointment?.patientVillage],
              appointment?.symptoms ? ["🩺 Symptoms", appointment.symptoms] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="text-slate-500 text-sm w-32 shrink-0">{label}</span>
                <span className="text-white text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor started → Join Button */}
        {doctorStarted && callLink ? (
          <div className="bg-emerald-900/20 border-2 border-emerald-600 rounded-2xl p-6 text-center mb-4">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="text-white font-bold text-lg mb-1">Doctor has started the call!</h3>
            <p className="text-slate-400 text-sm mb-5">Dr. {doc?.name} is waiting for you</p>
            <button onClick={() => setCallStarted(true)}
              className="w-full py-4 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-all">
              📹 Join Call Now
            </button>
          </div>
        ) : (
          /* Waiting for doctor */
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Waiting for Doctor</h3>
            <p className="text-slate-400 text-sm mb-2">
              Dr. {doc?.name} will start the call at <strong className="text-white">{appointment?.timeSlot}</strong>
            </p>
            <p className="text-slate-600 text-xs">Checking automatically every 5 seconds...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm mt-2">⚠️ {error}</div>
        )}
      </div>
    </div>
  );
}