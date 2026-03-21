import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "https://ruralcare-o2er.onrender.com/api";

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
  const [isVisible, setIsVisible] = useState(false);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    const stored = localStorage.getItem("patient");
    if (stored) setPatient(JSON.parse(stored));
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("patient");
    navigate("/patient-auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-white text-lg font-bold mb-2">Appointment Not Found</h2>
          <p className="text-slate-400 text-sm mb-5">{error}</p>
          <button onClick={() => navigate("/consult")} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors">
            Book New Appointment
          </button>
        </div>
      </div>
    );
  }

  const doc = appointment?.doctor;

  if (callStarted && callLink) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
              style={{ backgroundColor: doc?.color + "33", color: doc?.color }}>
              {doc?.avatar}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{doc?.name}</p>
              <p className="text-slate-400 text-xs hidden sm:block">{doc?.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/40 px-2.5 py-1 rounded-full border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Live
            </span>
            <button onClick={() => setCallStarted(false)} className="text-xs bg-red-900/40 text-red-400 border border-red-800 px-2.5 py-1 rounded-full hover:bg-red-800/40 transition-colors">
              ✕ End
            </button>
          </div>
        </div>
        <div className="flex-1">
          <iframe src={callLink} allow="camera; microphone; fullscreen; speaker; display-capture"
            className="w-full h-full min-h-[calc(100vh-52px)]" style={{ border: "none" }} title="Video Consultation" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 transition-all duration-500"
        style={{ transform: isVisible ? 'translateY(0)' : 'translateY(-100%)', opacity: isVisible ? 1 : 0 }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">←</button>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">🏥</div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm sm:text-base">Video Consultation</h1>
              <p className="text-slate-400 text-xs truncate">ID: {bookingId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {patient && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                <span className="text-emerald-400">👤</span>
                <span>{patient.name}</span>
              </div>
            )}
            {patient && (
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 text-xs border border-slate-700 hover:border-red-700 px-2.5 py-1.5 rounded-lg transition-all">
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="text-center mb-5 transition-all duration-700"
          style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          <p className="text-slate-500 text-xs mb-0.5">Booking ID</p>
          <span className="text-emerald-400 font-mono text-xl sm:text-2xl font-bold tracking-widest">{bookingId}</span>
        </div>

        {/* Doctor + Appointment Info */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-4 transition-all duration-700 delay-100"
          style={{ transform: isVisible ? 'translateY(0)' : 'translateY(30px)', opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
              style={{ backgroundColor: doc?.color + "33", border: `2px solid ${doc?.color}`, color: doc?.color }}>
              {doc?.avatar}
            </div>
            <div>
              <h2 className="text-white font-bold text-base sm:text-lg">{doc?.name}</h2>
              <p className="text-slate-400 text-sm">{doc?.specialty}</p>
              <p className="text-emerald-400 text-sm font-medium">₹{doc?.fee}</p>
            </div>
          </div>
          <div className="space-y-2 border-t border-slate-700 pt-3">
            {[
              ["👤 Patient",  appointment?.patientName + ", Age " + appointment?.patientAge],
              ["📅 Date",     appointment?.date],
              ["⏰ Time",     appointment?.timeSlot],
              [appointment?.callType === "video" ? "📹 Call" : "📞 Call", appointment?.callType === "video" ? "Video Call" : "Audio Call"],
              ["📍 Location", appointment?.patientVillage],
              appointment?.symptoms ? ["🩺 Symptoms", appointment.symptoms] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-slate-500 text-xs w-24 sm:w-28 shrink-0">{label}</span>
                <span className="text-white text-xs sm:text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {doctorStarted && callLink ? (
          <div className="bg-emerald-900/20 border-2 border-emerald-600 rounded-2xl p-5 text-center mb-4">
            <div className="text-3xl mb-2">🔔</div>
            <h3 className="text-white font-bold text-base mb-1">Doctor has started the call!</h3>
            <p className="text-slate-400 text-sm mb-4">Dr. {doc?.name} is waiting for you</p>
            <button onClick={() => setCallStarted(true)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-all duration-300 hover:scale-105 animate-pulse">
              📹 Join Call Now
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-center mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-white font-semibold text-base mb-1">Waiting for Doctor</h3>
            <p className="text-slate-400 text-sm mb-1">
              Dr. {doc?.name} will start at <strong className="text-white">{appointment?.timeSlot}</strong>
            </p>
            <p className="text-slate-600 text-xs">Checking every 5 seconds...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm">⚠️ {error}</div>
        )}
      </div>
    </div>
  );
}
