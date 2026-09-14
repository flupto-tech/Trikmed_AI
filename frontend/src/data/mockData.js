'use client'
// ─── CLINIC INFO ─────────────────────────────────────────────────────────────
export const clinicInfo = {
  name: 'City Care Clinic',
  city: 'Jaipur',
  address: '14-B, MG Road, Vaishali Nagar, Jaipur, Rajasthan 302021',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'info@citycareJaipur.com',
  website: 'booking.trikmed.com/city-care-clinic',
  logo: 'CC',
  timings: { open: '09:00', close: '21:00', days: 'Mon – Sat' },
  plan: 'Growth',
  joinDate: '2024-03-15',
}

export const doctorInfo = {
  name: 'Dr. Rajesh Sharma',
  specialization: 'General Physician & Diabetologist',
  experience: '14 years',
  avatar: 'RS',
}

// ─── PATIENTS ────────────────────────────────────────────────────────────────
const firstNames = ['Amit','Priya','Suresh','Meena','Rajesh','Kavya','Vijay','Sunita','Arun','Pooja','Rakesh','Neha','Manoj','Shalini','Dinesh','Anita','Ramesh','Geeta','Kishore','Deepa','Ajay','Rekha','Vinod','Seema','Santosh','Lata','Bharat','Usha','Narayan','Kamla','Harish','Manju','Devesh','Savita','Girish','Nirmala','Yogesh','Pushpa','Sunil','Champa','Ashok','Radha','Pankaj','Shakuntala','Neeraj','Saroj','Vivek','Kanta','Mukesh','Bhavna']
const lastNames = ['Sharma','Gupta','Verma','Singh','Patel','Joshi','Agarwal','Yadav','Mishra','Saxena','Trivedi','Dubey','Srivastava','Tiwari','Pandey','Chaturvedi','Bhatnagar','Rastogi','Bajaj','Mathur']

function genPhone() {
  const prefixes = ['98765','97654','96543','95432','94321','93210','92109','91098','90987','89876']
  return `+91 ${prefixes[Math.floor(Math.random()*prefixes.length)]} ${10000 + Math.floor(Math.random()*89999)}`
}

function genDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

const conditions = ['Diabetes Type 2','Hypertension','Common Cold','Fever','Back Pain','Migraine','Asthma','Thyroid','Arthritis','Gastritis','Skin Allergy','Anemia','Anxiety','Vitamin Deficiency','UTI','Chest Pain','Obesity','Cholesterol','Insomnia','Knee Pain']
const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const sources = ['WhatsApp','QR Code','Walk-in','Phone','Online']

export const patients = firstNames.map((fn, i) => {
  const ln = lastNames[i % lastNames.length]
  const totalVisits = 1 + Math.floor(Math.random() * 24)
  return {
    id: `P${String(i + 1).padStart(3, '0')}`,
    name: `${fn} ${ln}`,
    phone: genPhone(),
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`,
    age: 22 + Math.floor(Math.random() * 55),
    gender: i % 3 === 0 ? 'Female' : 'Male',
    bloodGroup: bloodGroups[i % bloodGroups.length],
    condition: conditions[i % conditions.length],
    lastVisit: genDate(Math.floor(Math.random() * 60)),
    nextAppointment: i % 4 === 0 ? null : genDate(-(1 + Math.floor(Math.random() * 14))),
    totalVisits,
    source: sources[i % sources.length],
    notes: i % 5 === 0 ? 'Patient has allergy to penicillin' : i % 7 === 0 ? 'Regular check-up patient' : '',
    joinDate: genDate(30 + Math.floor(Math.random() * 300)),
    status: i % 8 === 0 ? 'inactive' : 'active',
  }
})

// ─── APPOINTMENTS ────────────────────────────────────────────────────────────
const timeSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30']
const apptTypes = ['WhatsApp','QR Code','Walk-in','Phone','Online']
const apptReasons = ['Follow-up','New consultation','Blood test review','Prescription renewal','Vaccination','Health checkup','Emergency','Routine visit']

function makeAppt(id, patientIndex, dayOffset, timeIndex, status) {
  const p = patients[patientIndex % patients.length]
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  return {
    id: `A${String(id).padStart(4, '0')}`,
    patientId: p.id,
    patientName: p.name,
    patientPhone: p.phone,
    date: d.toISOString().split('T')[0],
    time: timeSlots[timeIndex % timeSlots.length],
    type: apptTypes[id % apptTypes.length],
    reason: apptReasons[id % apptReasons.length],
    status, // confirmed | waiting | completed | no-show | cancelled
    doctor: 'Dr. Rajesh Sharma',
    notes: id % 6 === 0 ? 'Patient requested early slot' : '',
    duration: 15 + (id % 3) * 10,
  }
}

export const appointments = [
  // Today (dayOffset = 0)
  makeAppt(1,  0,  0, 0, 'completed'),
  makeAppt(2,  1,  0, 1, 'completed'),
  makeAppt(3,  2,  0, 2, 'completed'),
  makeAppt(4,  3,  0, 3, 'completed'),
  makeAppt(5,  4,  0, 4, 'completed'),
  makeAppt(6,  5,  0, 5, 'completed'),
  makeAppt(7,  6,  0, 6, 'waiting'),
  makeAppt(8,  7,  0, 7, 'confirmed'),
  makeAppt(9,  8,  0, 8, 'confirmed'),
  makeAppt(10, 9,  0, 9, 'confirmed'),
  makeAppt(11, 10, 0, 10,'confirmed'),
  makeAppt(12, 11, 0, 11,'no-show'),
  makeAppt(13, 12, 0, 12,'confirmed'),
  makeAppt(14, 13, 0, 13,'confirmed'),
  makeAppt(15, 14, 0, 14,'confirmed'),
  makeAppt(16, 15, 0, 15,'confirmed'),
  makeAppt(17, 16, 0, 16,'confirmed'),
  makeAppt(18, 17, 0, 17,'confirmed'),
  // Tomorrow
  makeAppt(19, 18, 1, 0, 'confirmed'),
  makeAppt(20, 19, 1, 2, 'confirmed'),
  makeAppt(21, 20, 1, 4, 'confirmed'),
  makeAppt(22, 21, 1, 6, 'confirmed'),
  makeAppt(23, 22, 1, 8, 'confirmed'),
  makeAppt(24, 23, 1, 10,'confirmed'),
  // Day after
  makeAppt(25, 24, 2, 1, 'confirmed'),
  makeAppt(26, 25, 2, 3, 'confirmed'),
  makeAppt(27, 26, 2, 5, 'confirmed'),
  makeAppt(28, 27, 2, 7, 'confirmed'),
  // Yesterday
  makeAppt(29, 28, -1, 0,'completed'),
  makeAppt(30, 29, -1, 2,'completed'),
  makeAppt(31, 30, -1, 4,'completed'),
  makeAppt(32, 31, -1, 6,'completed'),
  makeAppt(33, 32, -1, 8,'no-show'),
  makeAppt(34, 33, -1,10,'completed'),
  // 2 days ago
  makeAppt(35, 34, -2, 0,'completed'),
  makeAppt(36, 35, -2, 2,'completed'),
  makeAppt(37, 36, -2, 4,'completed'),
  // Next week
  makeAppt(38, 37, 5, 0, 'confirmed'),
  makeAppt(39, 38, 5, 2, 'confirmed'),
  makeAppt(40, 39, 6, 1, 'confirmed'),
]

export const todayAppointments = appointments.filter(a => {
  const today = new Date().toISOString().split('T')[0]
  return a.date === today
})

// ─── MISSED CALLS ─────────────────────────────────────────────────────────────
export const missedCalls = [
  { id:'MC001', phone:'+91 98765 11111', name:'Unknown', time:'08:42 AM', date:'Today', followUpStatus:'Booked', followUpTime:'08:43 AM', convertedTo: 'Appointment A0041' },
  { id:'MC002', phone:'+91 97654 22222', name:'Ramesh Yadav', time:'09:15 AM', date:'Today', followUpStatus:'Replied', followUpTime:'09:16 AM', convertedTo: null },
  { id:'MC003', phone:'+91 96543 33333', name:'Unknown', time:'10:30 AM', date:'Today', followUpStatus:'WhatsApp Sent', followUpTime:'10:31 AM', convertedTo: null },
  { id:'MC004', phone:'+91 95432 44444', name:'Sunita Patel', time:'11:05 AM', date:'Today', followUpStatus:'No Response', followUpTime:'11:06 AM', convertedTo: null },
  { id:'MC005', phone:'+91 94321 55555', name:'Unknown', time:'02:20 PM', date:'Yesterday', followUpStatus:'Booked', followUpTime:'02:21 PM', convertedTo: 'Appointment A0035' },
  { id:'MC006', phone:'+91 93210 66666', name:'Arun Mishra', time:'03:45 PM', date:'Yesterday', followUpStatus:'Booked', followUpTime:'03:46 PM', convertedTo: 'Appointment A0036' },
  { id:'MC007', phone:'+91 92109 77777', name:'Unknown', time:'05:10 PM', date:'Yesterday', followUpStatus:'No Response', followUpTime:'05:11 PM', convertedTo: null },
  { id:'MC008', phone:'+91 91098 88888', name:'Priya Verma', time:'06:30 PM', date:'Yesterday', followUpStatus:'Replied', followUpTime:'06:31 PM', convertedTo: null },
  { id:'MC009', phone:'+91 90987 99999', name:'Unknown', time:'09:00 AM', date:'2 days ago', followUpStatus:'Booked', followUpTime:'09:01 AM', convertedTo: 'Appointment A0029' },
  { id:'MC010', phone:'+91 89876 00001', name:'Vijay Saxena', time:'11:30 AM', date:'2 days ago', followUpStatus:'WhatsApp Sent', followUpTime:'11:31 AM', convertedTo: null },
  { id:'MC011', phone:'+91 98765 11112', name:'Kavya Trivedi', time:'02:00 PM', date:'2 days ago', followUpStatus:'Booked', followUpTime:'02:01 PM', convertedTo: 'Appointment A0030' },
  { id:'MC012', phone:'+91 97654 22223', name:'Unknown', time:'04:15 PM', date:'2 days ago', followUpStatus:'No Response', followUpTime:'04:16 PM', convertedTo: null },
]

// ─── PRESCRIPTIONS ─────────────────────────────────────────────────────────
const medicines = [
  ['Tab Metformin 500mg — 1 twice daily','Tab Glimepiride 1mg — 1 before breakfast','Cap Vitamin D3 60K — 1 weekly'],
  ['Tab Amlodipine 5mg — 1 daily','Tab Telmisartan 40mg — 1 daily','Tab Aspirin 75mg — 1 daily'],
  ['Tab Azithromycin 500mg — 1 daily x 3 days','Tab Paracetamol 500mg — SOS','Syp Benadryl — 2 tsp at night'],
  ['Tab Pantoprazole 40mg — 1 before breakfast','Tab Domperidone 10mg — 1 three times daily','Cap Probiotics — 1 daily'],
  ['Tab Cetirizine 10mg — 1 at night','Tab Montair-LC — 1 daily','Nasal spray Flonase — 2 puffs each nostril'],
  ['Tab Diclofenac 50mg — 1 twice daily after food','Cap Methylcobalamin 500mcg — 1 daily','Gel Voltaren — apply twice daily'],
]
const reminderStatuses = ['Active','Completed','Paused']

export const prescriptions = patients.slice(0, 20).map((p, i) => ({
  id: `RX${String(i + 1).padStart(3, '0')}`,
  patientId: p.id,
  patientName: p.name,
  patientPhone: p.phone,
  date: genDate(Math.floor(Math.random() * 20)),
  medicines: medicines[i % medicines.length],
  diagnosis: conditions[i % conditions.length],
  followUpDate: genDate(-(7 + Math.floor(Math.random() * 21))),
  reminderStatus: reminderStatuses[i % reminderStatuses.length],
  remindersSent: 1 + Math.floor(Math.random() * 14),
  notes: i % 4 === 0 ? 'Avoid oily food. Drink 2L water daily.' : '',
  doctor: 'Dr. Rajesh Sharma',
}))

// ─── WHATSAPP CHATS ────────────────────────────────────────────────────────
// export const whatsappChats = [
//   {
//     id: 'WA001',
//     name: 'Amit Sharma',
//     phone: '+91 98765 43210',
//     avatar: 'AS',
//     lastMessage: '✅ Appointment confirmed for 3:30 PM',
//     lastTime: '10:31 AM',
//     unread: 0,
//     status: 'online',
//     messages: [
//       { id:1, from:'patient', text:'Hi, I need to book an appointment with Dr. Sharma', time:'10:28 AM', ai:false },
//       { id:2, from:'bot', text:"👋 Welcome to City Care Clinic!\n\nI'm your AI receptionist. Available slots today:\n📅 2:00 PM\n📅 3:30 PM\n📅 5:00 PM\n\nReply with your preferred time or type 'more' for tomorrow's slots.", time:'10:28 AM', ai:true },
//       { id:3, from:'patient', text:'3:30 PM please', time:'10:30 AM', ai:false },
//       { id:4, from:'bot', text:"✅ *Appointment Confirmed!*\n\n👨‍⚕️ Dr. Rajesh Sharma\n🕐 Today at 3:30 PM\n📍 City Care Clinic, MG Road\n\nReminder will be sent 1 hour before 🔔\n\nNeed to cancel? Reply 'cancel'", time:'10:31 AM', ai:true },
//     ],
//   },
//   {
//     id: 'WA002',
//     name: 'Priya Gupta',
//     phone: '+91 97654 11111',
//     avatar: 'PG',
//     lastMessage: 'Thank you doctor 🙏',
//     lastTime: '09:15 AM',
//     unread: 1,
//     status: 'offline',
//     messages: [
//       { id:1, from:'bot', text:"⏰ *Reminder:* Your appointment with Dr. Rajesh Sharma is in 1 hour.\n\n🕐 10:00 AM today\n📍 City Care Clinic, MG Road\n\nReply 'confirm' to confirm or 'reschedule' to change.", time:'09:00 AM', ai:true },
//       { id:2, from:'patient', text:'confirm', time:'09:10 AM', ai:false },
//       { id:3, from:'bot', text:'✅ Great! We\'ll see you at 10:00 AM. Please bring any previous reports.', time:'09:10 AM', ai:true },
//       { id:4, from:'patient', text:'Thank you doctor 🙏', time:'09:15 AM', ai:false },
//     ],
//   },
//   {
//     id: 'WA003',
//     name: 'Suresh Verma',
//     phone: '+91 96543 22222',
//     avatar: 'SV',
//     lastMessage: '💊 Take Metformin 500mg twice daily',
//     lastTime: 'Yesterday',
//     unread: 0,
//     status: 'offline',
//     messages: [
//       { id:1, from:'bot', text:"💊 *Medication Reminder*\n\nHi Suresh! Time for your evening medicine:\n• Metformin 500mg — 1 tablet\n• Glimepiride 1mg — 1 tablet\n\nDon't skip! 🙏", time:'08:00 PM', ai:true },
//       { id:2, from:'patient', text:'Done ✅', time:'08:30 PM', ai:false },
//       { id:3, from:'bot', text:'Great job staying consistent! Your next appointment is in 5 days. Stay healthy! 💪', time:'08:30 PM', ai:true },
//     ],
//   },
//   {
//     id: 'WA004',
//     name: 'Meena Singh',
//     phone: '+91 95432 33333',
//     avatar: 'MS',
//     lastMessage: 'Is Dr. Sharma available on Saturday?',
//     lastTime: 'Yesterday',
//     unread: 2,
//     status: 'online',
//     messages: [
//       { id:1, from:'patient', text:'Is Dr. Sharma available on Saturday?', time:'06:30 PM', ai:false },
//       { id:2, from:'bot', text:"Yes! Dr. Sharma is available on Saturday.\n\nAvailable slots:\n📅 10:00 AM\n📅 11:30 AM\n📅 4:00 PM\n📅 5:30 PM\n\nWhich slot would you prefer?", time:'06:30 PM', ai:true },
//       { id:3, from:'patient', text:'11:30 AM please. My name is Meena Singh', time:'06:32 PM', ai:false },
//       { id:4, from:'bot', text:"✅ Booked! Appointment confirmed:\n\n👤 Meena Singh\n👨‍⚕️ Dr. Rajesh Sharma\n📅 This Saturday at 11:30 AM\n\nSee you then! 🙏", time:'06:32 PM', ai:true },
//     ],
//   },
//   {
//     id: 'WA005',
//     name: 'Rajesh Patel',
//     phone: '+91 94321 44444',
//     avatar: 'RP',
//     lastMessage: 'Missed call follow-up sent automatically',
//     lastTime: '2 days ago',
//     unread: 0,
//     status: 'offline',
//     messages: [
//       { id:1, from:'bot', text:"👋 Hi! We noticed you called City Care Clinic but we couldn't connect.\n\nBook your appointment instantly here 👇\nOr reply with your preferred time and we'll confirm right away!", time:'02:21 PM', ai:true },
//       { id:2, from:'patient', text:'Yes I called. Need appointment tomorrow', time:'03:00 PM', ai:false },
//       { id:3, from:'bot', text:"Tomorrow's available slots:\n📅 09:30 AM\n📅 11:00 AM\n📅 02:00 PM\n📅 04:30 PM\n\nWhich time works?", time:'03:00 PM', ai:true },
//       { id:4, from:'patient', text:'11 AM', time:'03:02 PM', ai:false },
//       { id:5, from:'bot', text:'✅ Confirmed! Rajesh Patel — Tomorrow 11:00 AM. See you!', time:'03:02 PM', ai:true },
//     ],
//   },
//   {
//     id: 'WA006',
//     name: 'Kavya Joshi',
//     phone: '+91 93210 55555',
//     avatar: 'KJ',
//     lastMessage: 'Please reschedule to 5 PM',
//     lastTime: '2 days ago',
//     unread: 0,
//     status: 'offline',
//     messages: [
//       { id:1, from:'bot', text:"⏰ Reminder: Your appointment is tomorrow at 3:00 PM.\n\nReply 'confirm' or 'reschedule'", time:'06:00 PM', ai:true },
//       { id:2, from:'patient', text:'Please reschedule to 5 PM', time:'06:15 PM', ai:false },
//       { id:3, from:'bot', text:"✅ Rescheduled! New time: Tomorrow at 5:00 PM\n\nWe'll send a reminder an hour before. See you!", time:'06:15 PM', ai:true },
//     ],
//   },
// ]

// ─── TODAY'S STATS ──────────────────────────────────────────────────────────
export const todayStats = {
  appointments: 18,
  checkedIn: 12,
  missedCalls: 4,
  revenue: 24500,
  noShowRate: 8,
  prevNoShowRate: 35,
  newPatients: 3,
  qrBookings: 5,
}

// ─── WEEK STATS (for chart) ──────────────────────────────────────────────────
export const weeklyData = [
  { day:'Mon', appointments:14, revenue:19000, noShows:2 },
  { day:'Tue', appointments:18, revenue:24500, noShows:1 },
  { day:'Wed', appointments:16, revenue:21000, noShows:2 },
  { day:'Thu', appointments:22, revenue:29500, noShows:1 },
  { day:'Fri', appointments:19, revenue:25500, noShows:2 },
  { day:'Sat', appointments:25, revenue:33000, noShows:0 },
  { day:'Sun', appointments:8,  revenue:11000, noShows:1 },
]

export const monthlyGrowth = [
  { month:'Oct', clinics:82, appointments:2800 },
  { month:'Nov', clinics:95, appointments:3200 },
  { month:'Dec', clinics:108, appointments:3700 },
  { month:'Jan', clinics:114, appointments:4100 },
  { month:'Feb', clinics:119, appointments:4350 },
  { month:'Mar', clinics:124, appointments:4420 },
  { month:'Apr', clinics:127, appointments:4500 },
]

// ─── ADMIN DATA ──────────────────────────────────────────────────────────────
const clinicNames = ['Apollo Clinic','City Care Clinic','HealthFirst','Sunrise Medical','MedPoint','CarePlus','LifeLine Clinic','HealWell','QuickCure','PrimeCare','TotalHealth','WellnessHub','DocPoint','Medicare','CareNow','HealthBridge','SmartClinic','NovaCare','MedEase','PureHealth','CityCure','SwasthaClinic','DocHouse','MedFirst','CareBridge','HealthOasis','QuickMed','TrueCare','MediPoint','UrbanHealth','VitalCare','ClinicPlus','HealthRoots','MedTree','DocNow','CareFast','MedLife','UrbanCure','SmartMed','HealthFirst2','CitiMed','WellPoint','MedCare','ClinicHub','DocFirst','HealthLine','CareFirst','MedoCity','HealthZone','DocEase','QuickHealth','SwasthaHub','MediFirst','CarePoint','DocQuick','HealthNow','BetterCare','MedoFirst','HealthBridge2','CityMed','WellnessFirst','MedoHub','DocPoint2','CareOasis','HealthFast','UrbanMed','SmartCare','DocEase2','MedoLine','HealthOasis2','WellCare','CityCure2','QuickDoc','MedFirst2','CareHub','HealthRoots2','DocBridge','MedoCity2','HealthZone2','FastCure','TotalCare','WellMed','DocCare','HealthPrime','MedoPoint','CityCare2','UrbanFirst','QuickCare','MedoNow','HealthTree','DocLife','CareZone','WellFirst','MedoBridge','HealthCare2','CityFirst','DocNow2','MedoEase','HealthHub','CareTree','WellLine','MedoLife','DocZone','HealthPoint2','SwasthaFirst','CareFirst2','MedoBridge2','HealthLife','UrbanCare','DocFirst2','WellNow','MedoHub2','HealthEase','CarePoint2','DocLine','MedoFirst2','HealthFast2','CityHub','WellBridge','MedoCare','DocOasis','HealthCity','CareLife','WellZone','MedoTree']
const cities = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Jaipur','Lucknow','Kanpur','Nagpur','Patna','Indore','Bhopal','Vadodara','Surat','Agra','Meerut','Varanasi','Allahabad','Ranchi','Dehradun','Coimbatore','Kochi','Vijayawada']
const plans = ['Starter','Growth','Pro']
const adminStatuses = ['active','active','active','active','trial','inactive']

export const adminClinics = Array.from({ length: 127 }, (_, i) => ({
  id: `C${String(i + 1).padStart(3, '0')}`,
  name: clinicNames[i % clinicNames.length],
  city: cities[i % cities.length],
  plan: plans[i % plans.length],
  status: adminStatuses[i % adminStatuses.length],
  doctors: 1 + (i % 5),
  appointments: 50 + Math.floor(Math.random() * 500),
  joinDate: genDate(10 + Math.floor(Math.random() * 350)),
  mrr: plans[i % plans.length] === 'Starter' ? 999 : plans[i % plans.length] === 'Growth' ? 1999 : 3999,
}))

export const adminStats = {
  totalClinics: 127,
  activeClinics: 114,
  totalAppointments: 4500,
  mrr: 285000,
  newClinicsThisMonth: 8,
  churnRate: 2.1,
}

// ─── BOOKING SOURCE ANALYTICS ────────────────────────────────────────────────
export const bookingSourceStats = [
  { key: 'google',     label: 'Google Business', thisMonth: 48, lastMonth: 31, color: '#1a73e8', bg: '#e8f0fe' },
  { key: 'justdial',   label: 'Just Dial',        thisMonth: 27, lastMonth: 19, color: '#d44200', bg: '#fff0ea' },
  { key: 'missedcall', label: 'Missed Call',       thisMonth: 34, lastMonth: 28, color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'qr',         label: 'Clinic QR',         thisMonth: 89, lastMonth: 71, color: '#1A5CB5', bg: '#F7F9FF' },
  { key: 'walkin',     label: 'Walk-in',            thisMonth: 62, lastMonth: 54, color: '#d97706', bg: '#fffbeb' },
]

export const cityDistribution = [
  { city:'Mumbai', clinics:18 },
  { city:'Delhi', clinics:15 },
  { city:'Bangalore', clinics:12 },
  { city:'Jaipur', clinics:10 },
  { city:'Lucknow', clinics:9 },
  { city:'Patna', clinics:8 },
  { city:'Indore', clinics:7 },
  { city:'Bhopal', clinics:6 },
]
