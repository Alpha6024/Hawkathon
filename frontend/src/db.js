import Dexie from 'dexie';

export const db = new Dexie('RuralCareDB');

db.version(1).stores({
  appointments: '++id, bookingId, patientPhone, doctorId, status',
  doctors: 'id, name, specialization'
});

// Version 2: fix healthRecords primary key to use MongoDB _id
db.version(2).stores({
  appointments: '++id, bookingId, patientPhone, doctorId, status',
  healthRecords: '_id, phone, diagnosis, date',
  doctors: 'id, name, specialization'
});