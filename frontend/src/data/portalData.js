'use client'
// ── TrikMed Admin Portal — Hierarchical Mock Data ──────────────────────────
// Hierarchy: Super Admin (Vikram Mehta)
//   → Zone North (Amit Singh): Jaipur (Rahul Verma CM), Delhi (Neha Gupta CM)
//   → Zone South (Kavita Reddy): Bangalore (Arjun Nair CM)

// ─── Platform Stats ─────────────────────────────────────────────────────────
export const superAdminStats = {
  totalClinics: 47, activeClinics: 38, trialClinics: 7, churnedClinics: 2,
  mrr: 94500, arr: 1134000, growth: 23, newThisMonth: 6,
  totalStaff: 17, totalZones: 2, totalCities: 3, churnRate: 1.8,
  whatsappApiStatus: 'healthy', dbStatus: 'healthy', aiStatus: 'healthy',
}

// ─── Zones ───────────────────────────────────────────────────────────────────
export const zones = [
  { id:'NZ', name:'North Zone', manager:'Amit Singh',    cities:2, clinics:28, mrr:58000, target:70000, growth:21, achievement:83 },
  { id:'SZ', name:'South Zone', manager:'Kavita Reddy',  cities:1, clinics:19, mrr:36500, target:45000, growth:26, achievement:81 },
]

// ─── Cities ──────────────────────────────────────────────────────────────────
export const cities = [
  { id:'C001', zone:'NZ', name:'Jaipur', manager:'Rahul Verma',  active:11, trial:2, churned:1, mrr:27000, target:35000, mrs:2, sales:1, installers:1, pending:3 },
  { id:'C002', zone:'NZ', name:'Delhi',  manager:'Neha Gupta',   active:12, trial:2, churned:0, mrr:31000, target:40000, mrs:2, sales:1, installers:1, pending:2 },
  { id:'C003', zone:'SZ', name:'Bangalore', manager:'Arjun Nair',active:10, trial:2, churned:0, mrr:24000, target:30000, mrs:1, sales:1, installers:1, pending:1 },
]

// ─── Staff (all portal users) ─────────────────────────────────────────────────
export const portalStaff = [
  // Super
  { id:'SA01', name:'Vikram Mehta',   role:'super',     zone:null,         city:null,        phone:'+91 98001 00001', status:'active', clinics:47, performance:100, joinDate:'2023-01-01' },
  // Zone Managers
  { id:'ZM01', name:'Amit Singh',     role:'zone',      zone:'North Zone', city:null,        phone:'+91 98001 10001', status:'active', clinics:28, performance:88,  joinDate:'2023-06-01' },
  { id:'ZM02', name:'Kavita Reddy',   role:'zone',      zone:'South Zone', city:null,        phone:'+91 98001 10002', status:'active', clinics:19, performance:85,  joinDate:'2023-06-01' },
  // City Managers
  { id:'CM01', name:'Rahul Verma',    role:'city',      zone:'North Zone', city:'Jaipur',    phone:'+91 98001 20001', status:'active', clinics:14, performance:91,  joinDate:'2023-08-10' },
  { id:'CM02', name:'Neha Gupta',     role:'city',      zone:'North Zone', city:'Delhi',     phone:'+91 98001 20002', status:'active', clinics:14, performance:87,  joinDate:'2023-08-15' },
  { id:'CM03', name:'Arjun Nair',     role:'city',      zone:'South Zone', city:'Bangalore', phone:'+91 98001 20003', status:'active', clinics:12, performance:89,  joinDate:'2023-09-01' },
  // Sales Persons
  { id:'SP01', name:'Rohit Sharma',   role:'sales',     zone:'North Zone', city:'Jaipur',    phone:'+91 98001 30001', status:'active', clinics:9,  performance:85,  joinDate:'2023-10-01' },
  { id:'SP02', name:'Anil Kapoor',    role:'sales',     zone:'North Zone', city:'Delhi',     phone:'+91 98001 30002', status:'active', clinics:7,  performance:82,  joinDate:'2023-10-15' },
  { id:'SP03', name:'Meena Iyer',     role:'sales',     zone:'South Zone', city:'Bangalore', phone:'+91 98001 30003', status:'active', clinics:5,  performance:88,  joinDate:'2023-11-01' },
  // Medical Reps
  { id:'MR01', name:'Suresh Kumar',   role:'mr',        zone:'North Zone', city:'Jaipur',    phone:'+91 98001 40001', status:'active', clinics:5,  performance:92,  joinDate:'2023-09-01' },
  { id:'MR02', name:'Priya Patel',    role:'mr',        zone:'North Zone', city:'Jaipur',    phone:'+91 98001 40002', status:'active', clinics:4,  performance:87,  joinDate:'2023-10-01' },
  { id:'MR03', name:'Raj Malhotra',   role:'mr',        zone:'North Zone', city:'Delhi',     phone:'+91 98001 40003', status:'active', clinics:6,  performance:90,  joinDate:'2023-09-15' },
  { id:'MR04', name:'Sunita Rao',     role:'mr',        zone:'North Zone', city:'Delhi',     phone:'+91 98001 40004', status:'active', clinics:5,  performance:84,  joinDate:'2023-10-10' },
  { id:'MR05', name:'Ravi Kumar',     role:'mr',        zone:'South Zone', city:'Bangalore', phone:'+91 98001 40005', status:'active', clinics:4,  performance:91,  joinDate:'2023-10-15' },
  // Installers
  { id:'IN01', name:'Manoj Tiwari',   role:'installer', zone:'North Zone', city:'Jaipur',    phone:'+91 98001 50001', status:'active', clinics:12, performance:94,  joinDate:'2023-08-15' },
  { id:'IN02', name:'Deepak Singh',   role:'installer', zone:'North Zone', city:'Delhi',     phone:'+91 98001 50002', status:'active', clinics:14, performance:96,  joinDate:'2023-08-20' },
  { id:'IN03', name:'Suresh Pillai',  role:'installer', zone:'South Zone', city:'Bangalore', phone:'+91 98001 50003', status:'active', clinics:10, performance:90,  joinDate:'2023-09-10' },
]

export const jaipurTeam = portalStaff.filter(s => s.city === 'Jaipur')

// ─── 47 Clinics ──────────────────────────────────────────────────────────────
// Jaipur: 14, Delhi: 14, Bangalore: 12, Others: 7 (not in cities table but in platform)
export const portalClinics = [
  // ── Jaipur — Suresh Kumar's 5 ────────────────────────────────────────────
  { id:'PC-J01', name:'Sharma Clinic',       doctor:'Dr. Ramesh Sharma',  city:'Jaipur',    zone:'NZ', plan:'Growth', status:'active',   mr:'Suresh Kumar', installer:'Manoj Tiwari', joinDate:'Sep 12',  lastActive:'Today',     whatsapp:'connected',    appts:31, mrr:2500 },
  { id:'PC-J02', name:'Jain Medical Centre', doctor:'Dr. Priya Jain',     city:'Jaipur',    zone:'NZ', plan:'Pro',    status:'active',   mr:'Suresh Kumar', installer:'Manoj Tiwari', joinDate:'Oct 5',   lastActive:'Today',     whatsapp:'connected',    appts:42, mrr:3500 },
  { id:'PC-J03', name:'City Heart Clinic',   doctor:'Dr. Anita Verma',    city:'Jaipur',    zone:'NZ', plan:'Growth', status:'active',   mr:'Suresh Kumar', installer:'Manoj Tiwari', joinDate:'Nov 18',  lastActive:'Yesterday', whatsapp:'connected',    appts:28, mrr:2500 },
  { id:'PC-J04', name:'Sunrise Medical',     doctor:'Dr. Amar Patel',     city:'Jaipur',    zone:'NZ', plan:'Basic',  status:'active',   mr:'Suresh Kumar', installer:'Manoj Tiwari', joinDate:'Dec 3',   lastActive:'Today',     whatsapp:'connected',    appts:17, mrr:1500 },
  { id:'PC-J05', name:'Arogya Clinic',       doctor:'Dr. Bharat Kumar',   city:'Jaipur',    zone:'NZ', plan:'Pro',    status:'active',   mr:'Suresh Kumar', installer:'Manoj Tiwari', joinDate:'Jan 8',   lastActive:'Today',     whatsapp:'connected',    appts:38, mrr:3500 },
  // ── Jaipur — Priya Patel's 4 ─────────────────────────────────────────────
  { id:'PC-J06', name:'Gupta Clinic',        doctor:'Dr. Suresh Gupta',   city:'Jaipur',    zone:'NZ', plan:'Basic',  status:'inactive', mr:'Priya Patel',  installer:'Manoj Tiwari', joinDate:'Oct 20',  lastActive:'4 days ago',whatsapp:'disconnected', appts:0,  mrr:0    },
  { id:'PC-J07', name:'Medilife Clinic',     doctor:'Dr. Kavita Singh',   city:'Jaipur',    zone:'NZ', plan:'Basic',  status:'active',   mr:'Priya Patel',  installer:'Manoj Tiwari', joinDate:'Nov 1',   lastActive:'Today',     whatsapp:'connected',    appts:14, mrr:1500 },
  { id:'PC-J08', name:'Narayana Clinic',     doctor:'Dr. Seema Agarwal',  city:'Jaipur',    zone:'NZ', plan:'Pro',    status:'active',   mr:'Priya Patel',  installer:'Manoj Tiwari', joinDate:'Nov 25',  lastActive:'Yesterday', whatsapp:'connected',    appts:36, mrr:3500 },
  { id:'PC-J09', name:'Samarth Health',      doctor:'Dr. Chetan Verma',   city:'Jaipur',    zone:'NZ', plan:'Growth', status:'active',   mr:'Priya Patel',  installer:'Manoj Tiwari', joinDate:'Jan 14',  lastActive:'Today',     whatsapp:'connected',    appts:22, mrr:2500 },
  // ── Jaipur — Trial / Misc ────────────────────────────────────────────────
  { id:'PC-J10', name:'Apollo Clinic',       doctor:'Dr. Rajesh Mehta',   city:'Jaipur',    zone:'NZ', plan:'Growth', status:'trial',    mr:'Suresh Kumar', installer:'Manoj Tiwari', joinDate:'Apr 1',   lastActive:'2 days ago',whatsapp:'connected',    appts:6,  mrr:0    },
  { id:'PC-J11', name:'QuickCure Clinic',    doctor:'Dr. Naman Sharma',   city:'Jaipur',    zone:'NZ', plan:'Pro',    status:'trial',    mr:'Priya Patel',  installer:'Manoj Tiwari', joinDate:'Apr 5',   lastActive:'Today',     whatsapp:'connected',    appts:9,  mrr:0    },
  { id:'PC-J12', name:'Prime Clinic',        doctor:'Dr. Aarav Singh',    city:'Jaipur',    zone:'NZ', plan:'Growth', status:'active',   mr:'Suresh Kumar', installer:'Manoj Tiwari', joinDate:'Mar 22',  lastActive:'Yesterday', whatsapp:'connected',    appts:19, mrr:2500 },
  { id:'PC-J13', name:'LifeCare Clinic',     doctor:'Dr. Meena Joshi',    city:'Jaipur',    zone:'NZ', plan:'Basic',  status:'active',   mr:'Priya Patel',  installer:'Manoj Tiwari', joinDate:'Feb 10',  lastActive:'Today',     whatsapp:'connected',    appts:11, mrr:1500 },
  { id:'PC-J14', name:'Metro Health',        doctor:'Dr. Dinesh Sharma',  city:'Jaipur',    zone:'NZ', plan:'Growth', status:'churned',  mr:'Priya Patel',  installer:'Manoj Tiwari', joinDate:'Oct 10',  lastActive:'30 days ago',whatsapp:'disconnected', appts:0,  mrr:0    },
  // ── Delhi — Raj Malhotra's 6 ─────────────────────────────────────────────
  { id:'PC-D01', name:'Delhi Health Clinic', doctor:'Dr. Pradeep Nagar',  city:'Delhi',     zone:'NZ', plan:'Growth', status:'active',   mr:'Raj Malhotra', installer:'Deepak Singh', joinDate:'Sep 20',  lastActive:'Today',     whatsapp:'connected',    appts:34, mrr:2500 },
  { id:'PC-D02', name:'Capital Clinic',      doctor:'Dr. Rekha Singh',    city:'Delhi',     zone:'NZ', plan:'Pro',    status:'active',   mr:'Raj Malhotra', installer:'Deepak Singh', joinDate:'Oct 14',  lastActive:'Today',     whatsapp:'connected',    appts:48, mrr:3500 },
  { id:'PC-D03', name:'North Delhi Medical', doctor:'Dr. Sunil Mishra',   city:'Delhi',     zone:'NZ', plan:'Growth', status:'active',   mr:'Raj Malhotra', installer:'Deepak Singh', joinDate:'Nov 5',   lastActive:'Yesterday', whatsapp:'connected',    appts:26, mrr:2500 },
  { id:'PC-D04', name:'Green Park Clinic',   doctor:'Dr. Ritu Chawla',    city:'Delhi',     zone:'NZ', plan:'Basic',  status:'active',   mr:'Raj Malhotra', installer:'Deepak Singh', joinDate:'Nov 30',  lastActive:'Today',     whatsapp:'connected',    appts:15, mrr:1500 },
  { id:'PC-D05', name:'Saket Clinic',        doctor:'Dr. Anil Jain',      city:'Delhi',     zone:'NZ', plan:'Pro',    status:'active',   mr:'Raj Malhotra', installer:'Deepak Singh', joinDate:'Dec 18',  lastActive:'Today',     whatsapp:'connected',    appts:41, mrr:3500 },
  { id:'PC-D06', name:'Rohini Health',       doctor:'Dr. Sunita Batra',   city:'Delhi',     zone:'NZ', plan:'Growth', status:'active',   mr:'Raj Malhotra', installer:'Deepak Singh', joinDate:'Jan 22',  lastActive:'Yesterday', whatsapp:'connected',    appts:23, mrr:2500 },
  // ── Delhi — Sunita Rao's 5 ───────────────────────────────────────────────
  { id:'PC-D07', name:'Delhi Care Centre',   doctor:'Dr. Mohan Lal',      city:'Delhi',     zone:'NZ', plan:'Basic',  status:'active',   mr:'Sunita Rao',   installer:'Deepak Singh', joinDate:'Oct 8',   lastActive:'Today',     whatsapp:'connected',    appts:12, mrr:1500 },
  { id:'PC-D08', name:'East Delhi Clinic',   doctor:'Dr. Kiran Kapoor',   city:'Delhi',     zone:'NZ', plan:'Growth', status:'active',   mr:'Sunita Rao',   installer:'Deepak Singh', joinDate:'Nov 12',  lastActive:'Today',     whatsapp:'connected',    appts:29, mrr:2500 },
  { id:'PC-D09', name:'Preet Vihar Medical', doctor:'Dr. Rakesh Kumar',   city:'Delhi',     zone:'NZ', plan:'Basic',  status:'active',   mr:'Sunita Rao',   installer:'Deepak Singh', joinDate:'Dec 5',   lastActive:'2 days ago',whatsapp:'connected',    appts:8,  mrr:1500 },
  { id:'PC-D10', name:'Lajpat Clinic',       doctor:'Dr. Neha Arora',     city:'Delhi',     zone:'NZ', plan:'Growth', status:'active',   mr:'Sunita Rao',   installer:'Deepak Singh', joinDate:'Jan 3',   lastActive:'Today',     whatsapp:'connected',    appts:20, mrr:2500 },
  { id:'PC-D11', name:'Connaught Clinic',    doctor:'Dr. Vivek Sharma',   city:'Delhi',     zone:'NZ', plan:'Pro',    status:'active',   mr:'Sunita Rao',   installer:'Deepak Singh', joinDate:'Feb 8',   lastActive:'Today',     whatsapp:'connected',    appts:37, mrr:3500 },
  // ── Delhi — Trial / Misc ─────────────────────────────────────────────────
  { id:'PC-D12', name:'Janakpuri Clinic',    doctor:'Dr. Geeta Malhotra', city:'Delhi',     zone:'NZ', plan:'Growth', status:'trial',    mr:'Raj Malhotra', installer:'Deepak Singh', joinDate:'Mar 28',  lastActive:'Today',     whatsapp:'connected',    appts:7,  mrr:0    },
  { id:'PC-D13', name:'Karol Bagh Medical',  doctor:'Dr. Pankaj Saxena',  city:'Delhi',     zone:'NZ', plan:'Basic',  status:'trial',    mr:'Sunita Rao',   installer:'Deepak Singh', joinDate:'Apr 2',   lastActive:'Yesterday', whatsapp:'connected',    appts:4,  mrr:0    },
  { id:'PC-D14', name:'Paharganj Clinic',    doctor:'Dr. Sangeeta Roy',   city:'Delhi',     zone:'NZ', plan:'Basic',  status:'active',   mr:'Sunita Rao',   installer:'Deepak Singh', joinDate:'Mar 10',  lastActive:'Today',     whatsapp:'connected',    appts:10, mrr:1500 },
  // ── Bangalore — Ravi Kumar's 4 ───────────────────────────────────────────
  { id:'PC-B01', name:'Bangalore Wellness',  doctor:'Dr. Kiran Rao',      city:'Bangalore', zone:'SZ', plan:'Growth', status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Oct 10',  lastActive:'Yesterday', whatsapp:'connected',    appts:25, mrr:2500 },
  { id:'PC-B02', name:'South City Clinic',   doctor:'Dr. Anand Kumar',    city:'Bangalore', zone:'SZ', plan:'Pro',    status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Nov 8',   lastActive:'Today',     whatsapp:'connected',    appts:39, mrr:3500 },
  { id:'PC-B03', name:'Koramangala Clinic',  doctor:'Dr. Deepa Nair',     city:'Bangalore', zone:'SZ', plan:'Growth', status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Dec 14',  lastActive:'Today',     whatsapp:'connected',    appts:31, mrr:2500 },
  { id:'PC-B04', name:'Indiranagar Medical', doctor:'Dr. Sanjay Reddy',   city:'Bangalore', zone:'SZ', plan:'Basic',  status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Jan 20',  lastActive:'2 days ago',whatsapp:'connected',    appts:13, mrr:1500 },
  // ── Bangalore — Other ────────────────────────────────────────────────────
  { id:'PC-B05', name:'Jayanagar Clinic',    doctor:'Dr. Priya Menon',    city:'Bangalore', zone:'SZ', plan:'Growth', status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Feb 5',   lastActive:'Today',     whatsapp:'connected',    appts:27, mrr:2500 },
  { id:'PC-B06', name:'Malleswaram Health',  doctor:'Dr. Suresh Pai',     city:'Bangalore', zone:'SZ', plan:'Pro',    status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Feb 22',  lastActive:'Today',     whatsapp:'connected',    appts:44, mrr:3500 },
  { id:'PC-B07', name:'BTM Layout Clinic',   doctor:'Dr. Meena Krishnan', city:'Bangalore', zone:'SZ', plan:'Basic',  status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Mar 8',   lastActive:'Yesterday', whatsapp:'connected',    appts:9,  mrr:1500 },
  { id:'PC-B08', name:'HSR Clinic',          doctor:'Dr. Arjun Shetty',   city:'Bangalore', zone:'SZ', plan:'Growth', status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Mar 18',  lastActive:'Today',     whatsapp:'connected',    appts:21, mrr:2500 },
  { id:'PC-B09', name:'Whitefield Medical',  doctor:'Dr. Divya Nair',     city:'Bangalore', zone:'SZ', plan:'Pro',    status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Mar 28',  lastActive:'Today',     whatsapp:'connected',    appts:33, mrr:3500 },
  { id:'PC-B10', name:'Electronic City Clinic',doctor:'Dr. Ravi Shankar', city:'Bangalore', zone:'SZ', plan:'Growth', status:'active',   mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Apr 4',   lastActive:'Today',     whatsapp:'connected',    appts:18, mrr:2500 },
  { id:'PC-B11', name:'Bannerghatta Clinic', doctor:'Dr. Kavya Iyer',     city:'Bangalore', zone:'SZ', plan:'Basic',  status:'trial',    mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Apr 8',   lastActive:'Today',     whatsapp:'connected',    appts:5,  mrr:0    },
  { id:'PC-B12', name:'Rajajinagar Medical', doctor:'Dr. Mohan Pillai',   city:'Bangalore', zone:'SZ', plan:'Growth', status:'trial',    mr:'Ravi Kumar',   installer:'Suresh Pillai',joinDate:'Apr 10',  lastActive:'Yesterday', whatsapp:'connected',    appts:3,  mrr:0    },
  // ── South Zone Others (Chennai / Hyderabad) ───────────────────────────────
  { id:'PC-S01', name:'Chennai Medical Hub', doctor:'Dr. Kavitha Raj',    city:'Chennai',   zone:'SZ', plan:'Growth', status:'active',   mr:'—',            installer:'—',            joinDate:'Oct 28',  lastActive:'Today',     whatsapp:'connected',    appts:29, mrr:2500 },
  { id:'PC-S02', name:'T. Nagar Clinic',     doctor:'Dr. Karthik Rajan',  city:'Chennai',   zone:'SZ', plan:'Pro',    status:'active',   mr:'—',            installer:'—',            joinDate:'Nov 14',  lastActive:'Today',     whatsapp:'connected',    appts:41, mrr:3500 },
  { id:'PC-S03', name:'Adyar Health',        doctor:'Dr. Shanthi Kumar',  city:'Chennai',   zone:'SZ', plan:'Basic',  status:'active',   mr:'—',            installer:'—',            joinDate:'Jan 7',   lastActive:'Yesterday', whatsapp:'connected',    appts:12, mrr:1500 },
  { id:'PC-S04', name:'Mylapore Clinic',     doctor:'Dr. Anbu Mani',      city:'Chennai',   zone:'SZ', plan:'Growth', status:'active',   mr:'—',            installer:'—',            joinDate:'Feb 18',  lastActive:'Today',     whatsapp:'connected',    appts:22, mrr:2500 },
  { id:'PC-S05', name:'Jubilee Hills Clinic',doctor:'Dr. Srinivas Rao',   city:'Hyderabad', zone:'SZ', plan:'Growth', status:'active',   mr:'—',            installer:'—',            joinDate:'Dec 20',  lastActive:'Today',     whatsapp:'connected',    appts:26, mrr:2500 },
  { id:'PC-S06', name:'Banjara Hills Health',doctor:'Dr. Sudha Reddy',    city:'Hyderabad', zone:'SZ', plan:'Pro',    status:'active',   mr:'—',            installer:'—',            joinDate:'Jan 28',  lastActive:'Today',     whatsapp:'connected',    appts:37, mrr:3500 },
  { id:'PC-S07', name:'Hitech City Clinic',  doctor:'Dr. Prasad Naik',    city:'Hyderabad', zone:'SZ', plan:'Basic',  status:'active',   mr:'—',            installer:'—',            joinDate:'Mar 5',   lastActive:'2 days ago',whatsapp:'connected',    appts:14, mrr:1500 },
]

// ─── MR View: Suresh Kumar's data ──────────────────────────────────────────
export const mrVisits = [
  { id:'MV01', clinic:'Sharma Clinic',       doctor:'Dr. Ramesh Sharma', address:'12, MG Road, Vaishali Nagar', time:'09:30 AM', status:'completed', lastActive:'Today',     issue:null,                   distance:'2.1 km', clinicId:'PC-J01' },
  { id:'MV02', clinic:'Jain Medical Centre', doctor:'Dr. Priya Jain',    address:'45, Tonk Road, Gaurav Tower', time:'11:00 AM', status:'completed', lastActive:'Today',     issue:null,                   distance:'4.3 km', clinicId:'PC-J02' },
  { id:'MV03', clinic:'City Heart Clinic',   doctor:'Dr. Anita Verma',   address:'8, Civil Lines, Jaipur',      time:'12:30 PM', status:'ongoing',   lastActive:'Yesterday', issue:null,                   distance:'3.8 km', clinicId:'PC-J03' },
  { id:'MV04', clinic:'Sunrise Medical',     doctor:'Dr. Amar Patel',    address:'22, Ajmer Road, Sodala',      time:'02:30 PM', status:'pending',   lastActive:'Today',     issue:null,                   distance:'5.2 km', clinicId:'PC-J04' },
  { id:'MV05', clinic:'Arogya Clinic',       doctor:'Dr. Bharat Kumar',  address:'Plot 7, Malviya Nagar',       time:'04:00 PM', status:'pending',   lastActive:'Today',     issue:null,                   distance:'6.0 km', clinicId:'PC-J05' },
]

export const mrClinics = [
  { id:'PC-J01', name:'Sharma Clinic',       doctor:'Dr. Ramesh Sharma', plan:'Growth', status:'active',   lastActive:'Today',     appts:31, alert:false, whatsapp:'connected',    mrr:2500 },
  { id:'PC-J02', name:'Jain Medical Centre', doctor:'Dr. Priya Jain',    plan:'Pro',    status:'active',   lastActive:'Today',     appts:42, alert:false, whatsapp:'connected',    mrr:3500 },
  { id:'PC-J03', name:'City Heart Clinic',   doctor:'Dr. Anita Verma',   plan:'Growth', status:'active',   lastActive:'Yesterday', appts:28, alert:false, whatsapp:'connected',    mrr:2500 },
  { id:'PC-J04', name:'Sunrise Medical',     doctor:'Dr. Amar Patel',    plan:'Basic',  status:'active',   lastActive:'Today',     appts:17, alert:false, whatsapp:'connected',    mrr:1500 },
  { id:'PC-J05', name:'Arogya Clinic',       doctor:'Dr. Bharat Kumar',  plan:'Pro',    status:'active',   lastActive:'Today',     appts:38, alert:false, whatsapp:'connected',    mrr:3500 },
]

export const visitHistory = [
  { id:'VH01', clinicName:'Sharma Clinic',       date:'Apr 14', time:'10:15 AM', notes:'Doctor happy with reports. Suggested Pro plan upgrade.', followUp:'Apr 21', status:'done' },
  { id:'VH02', clinicName:'Jain Medical Centre', date:'Apr 13', time:'11:30 AM', notes:'WhatsApp responses improved. 42 appointments this week.', followUp:'Apr 20', status:'done' },
  { id:'VH03', clinicName:'Arogya Clinic',       date:'Apr 12', time:'02:00 PM', notes:'New receptionist trained on dashboard. All good.', followUp:'Apr 19', status:'done' },
  { id:'VH04', clinicName:'City Heart Clinic',   date:'Apr 10', time:'03:30 PM', notes:'Doctor requested bulk appointment export feature.', followUp:'Apr 17', status:'done' },
  { id:'VH05', clinicName:'Sunrise Medical',     date:'Apr 8',  time:'10:00 AM', notes:'Setup QR code at reception. Staff trained.', followUp:'Apr 15', status:'done' },
  { id:'VH06', clinicName:'Sharma Clinic',       date:'Apr 5',  time:'09:30 AM', notes:'Resolved WhatsApp template issue. Working now.', followUp:'Apr 14', status:'done' },
]

// ─── Installation Queue (Manoj Tiwari — Jaipur) ─────────────────────────────
export const installationQueue = [
  { id:'IQ01', clinic:'MedPoint Clinic',    doctor:'Dr. Vinay Rao',    city:'Jaipur', address:'Plot 12, Sindhi Camp, Jaipur',    date:'Apr 15', time:'10:00 AM', status:'today',     plan:'Growth', mr:'Suresh Kumar', steps:{ whatsapp:false, qr:false, training:false, test:false, staff:false } },
  { id:'IQ02', clinic:'QuickCure Clinic',   doctor:'Dr. Naman Sharma', city:'Jaipur', address:'22B, Vidhyadhar Nagar, Jaipur',   date:'Apr 15', time:'02:00 PM', status:'today',     plan:'Pro',    mr:'Priya Patel',  steps:{ whatsapp:false, qr:false, training:false, test:false, staff:false } },
  { id:'IQ03', clinic:'Lotus Medical',      doctor:'Dr. Ritesh Patel', city:'Jaipur', address:'8, Raja Park, Jaipur',            date:'Apr 16', time:'11:00 AM', status:'upcoming',  plan:'Growth', mr:'Suresh Kumar', steps:{ whatsapp:false, qr:false, training:false, test:false, staff:false } },
  { id:'IQ04', clinic:'Prime Clinic',       doctor:'Dr. Aarav Singh',  city:'Jaipur', address:'45, Mansarovar, Jaipur',          date:'Apr 17', time:'10:00 AM', status:'upcoming',  plan:'Basic',  mr:'Priya Patel',  steps:{ whatsapp:false, qr:false, training:false, test:false, staff:false } },
  { id:'IQ05', clinic:'Wellness Plus',      doctor:'Dr. Pooja Jain',   city:'Jaipur', address:'12A, Bapu Nagar, Jaipur',        date:'Apr 18', time:'03:00 PM', status:'upcoming',  plan:'Pro',    mr:'Suresh Kumar', steps:{ whatsapp:false, qr:false, training:false, test:false, staff:false } },
  { id:'IQ06', clinic:'Apollo Clinic',      doctor:'Dr. Rajesh Mehta', city:'Jaipur', address:'Plot 7, Malviya Nagar, Jaipur',  date:'Apr 13', time:'11:00 AM', status:'completed', plan:'Growth', mr:'Suresh Kumar', steps:{ whatsapp:true,  qr:true,  training:true,  test:true,  staff:true  } },
  { id:'IQ07', clinic:'Samarth Health',     doctor:'Dr. Chetan Verma', city:'Jaipur', address:'19, Shyam Nagar, Jaipur',       date:'Apr 12', time:'02:00 PM', status:'completed', plan:'Basic',  mr:'Priya Patel',  steps:{ whatsapp:true,  qr:true,  training:true,  test:true,  staff:true  } },
]

// ─── Sales Leads (Rohit Sharma — Jaipur, 9 leads) ────────────────────────────
export const salesLeads = [
  { id:'LD001', clinic:'Ratan Clinic',       doctor:'Dr. Ratan Gupta',   phone:'+91 99001 11001', city:'Jaipur', status:'prospect',  addedDate:'Apr 14', plan:'Growth', notes:'Interested after cold call, wants WhatsApp demo', callCount:1 },
  { id:'LD002', clinic:'Om Sai Clinic',      doctor:'Dr. Sai Baba',      phone:'+91 99001 11002', city:'Jaipur', status:'prospect',  addedDate:'Apr 13', plan:'Basic',  notes:'Referred by Dr. Sharma. Follow up Monday.', callCount:2 },
  { id:'LD003', clinic:'Shree Clinic',       doctor:'Dr. Shree Ram',     phone:'+91 99001 11003', city:'Jaipur', status:'prospect',  addedDate:'Apr 11', plan:'Growth', notes:'Very interested, waiting for budget approval.', callCount:1 },
  { id:'LD004', clinic:'Wellness Plus',      doctor:'Dr. Pooja Jain',    phone:'+91 99001 11004', city:'Jaipur', status:'demo_done', addedDate:'Apr 10', plan:'Pro',    notes:'Demo went very well. Pricing discussion pending.', callCount:3 },
  { id:'LD005', clinic:'HealthFirst Clinic', doctor:'Dr. Arvind Mehta',  phone:'+91 99001 11005', city:'Jaipur', status:'demo_done', addedDate:'Apr 8',  plan:'Growth', notes:'Needs WhatsApp Business approval first.', callCount:2 },
  { id:'LD006', clinic:'Lotus Medical',      doctor:'Dr. Ritesh Patel',  phone:'+91 99001 11006', city:'Jaipur', status:'trial',     addedDate:'Apr 3',  plan:'Growth', notes:'Trial going well. 5 days remaining.', callCount:4 },
  { id:'LD007', clinic:'MedPoint Clinic',    doctor:'Dr. Vinay Rao',     phone:'+91 99001 11007', city:'Jaipur', status:'trial',     addedDate:'Apr 1',  plan:'Pro',    notes:'Happy with AI receptionist. Push for Pro plan.', callCount:5 },
  { id:'LD008', clinic:'Prime Clinic',       doctor:'Dr. Aarav Singh',   phone:'+91 99001 11008', city:'Jaipur', status:'converted', addedDate:'Mar 22', plan:'Growth', mrr:2500, convertedDate:'Apr 5',  callCount:6 },
  { id:'LD009', clinic:'Arogya Plus',        doctor:'Dr. Bhanu Prasad',  phone:'+91 99001 11009', city:'Jaipur', status:'converted', addedDate:'Mar 18', plan:'Pro',    mrr:3500, convertedDate:'Apr 2',  callCount:7 },
  { id:'LD010', clinic:'City Wellness',      doctor:'Dr. Geeta Sharma',  phone:'+91 99001 11010', city:'Jaipur', status:'converted', addedDate:'Mar 10', plan:'Basic',  mrr:1500, convertedDate:'Mar 28', callCount:5 },
  { id:'LD011', clinic:'Sunrise Clinic',     doctor:'Dr. Om Prakash',    phone:'+91 99001 11011', city:'Jaipur', status:'converted', addedDate:'Mar 5',  plan:'Growth', mrr:2500, convertedDate:'Mar 20', callCount:4 },
]

// ─── Onboarding Queue (City Manager Approvals) ───────────────────────────────
export const onboardingQueue = [
  { id:'OB01', clinic:'MedPoint Clinic',  doctor:'Dr. Vinay Rao',    city:'Jaipur', submittedBy:'Rohit Sharma',  submittedDate:'Apr 14', plan:'Growth', status:'pending_approval', installer:'Manoj Tiwari', installDate:'Apr 15', mr:'Suresh Kumar',  phone:'+91 99001 11007' },
  { id:'OB02', clinic:'Lotus Medical',    doctor:'Dr. Ritesh Patel', city:'Jaipur', submittedBy:'Rohit Sharma',  submittedDate:'Apr 12', plan:'Growth', status:'pending_approval', installer:'Manoj Tiwari', installDate:'Apr 16', mr:'Suresh Kumar',  phone:'+91 99001 11006' },
  { id:'OB03', clinic:'Wellness Plus',    doctor:'Dr. Pooja Jain',   city:'Jaipur', submittedBy:'Rohit Sharma',  submittedDate:'Apr 10', plan:'Pro',    status:'approved',          installer:'Manoj Tiwari', installDate:'Apr 18', mr:'Suresh Kumar',  phone:'+91 99001 11004' },
  { id:'OB04', clinic:'Prime Clinic',     doctor:'Dr. Aarav Singh',  city:'Jaipur', submittedBy:'Rohit Sharma',  submittedDate:'Apr 9',  plan:'Basic',  status:'install_scheduled', installer:'Manoj Tiwari', installDate:'Apr 17', mr:'Priya Patel',   phone:'+91 99001 11008' },
  { id:'OB05', clinic:'Janakpuri Clinic', doctor:'Dr. Geeta Malhotra',city:'Delhi', submittedBy:'Anil Kapoor',   submittedDate:'Apr 13', plan:'Growth', status:'pending_approval', installer:'Deepak Singh', installDate:'Apr 20', mr:'Raj Malhotra',  phone:'+91 99001 22001' },
  { id:'OB06', clinic:'Karol Bagh Medical',doctor:'Dr. Pankaj Saxena',city:'Delhi', submittedBy:'Anil Kapoor',   submittedDate:'Apr 11', plan:'Basic',  status:'approved',          installer:'Deepak Singh', installDate:'Apr 19', mr:'Sunita Rao',    phone:'+91 99001 22002' },
]

export const ROLE_LABELS = {
  super:     'Super Admin',
  zone:      'Zone Manager',
  city:      'City Manager',
  sales:     'Sales Person',
  mr:        'Medical Rep',
  installer: 'Installer',
}

export const ROLE_COLORS = {
  super:     { bg:'#fef3c7', color:'#92400e', border:'#fde68a' },
  zone:      { bg:'#ede9fe', color:'#6d28d9', border:'#ddd6fe' },
  city:      { bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe' },
  sales:     { bg:'#EFF6FF', color:'#1A5CB5', border:'#BFDBFE' },
  mr:        { bg:'#e0f2fe', color:'#0369a1', border:'#bae6fd' },
  installer: { bg:'#fce7f3', color:'#9d174d', border:'#fbcfe8' },
}

// ─── Drill-down hierarchy (Zones → Cities → MRs) ────────────────────────────
export const PORTAL_HIERARCHY = {
  zones: [
    {
      id: 'Z1', name: 'North Zone', manager: 'Rahul Sharma',
      cities_count: 3, clinics_active: 45, clinics_total: 52,
      revenue_mtd: 89000, target_mtd: 120000, growth: '+12%',
      cities: [
        {
          id: 'C1', name: 'Jaipur', zone_id: 'Z1',
          city_manager: 'Amit Verma', city_manager_id: 'CM1',
          clinics_active: 28, clinics_total: 32,
          revenue_mtd: 56000, target_mtd: 75000,
          mrs: [
            { id:'MR1', name:'Vikas Panwar',  phone:'+91 98765 43210', city:'Jaipur', zone:'North Zone', clinics_pitched:23, clinics_active:12, clinics_ready:3, deals_this_month:3, target_this_month:5, revenue_generated:45000, commission_earned:4500,  last_activity:'Today 11:30 AM', joining_date:'Jan 2025', performance_score:78 },
            { id:'MR2', name:'Sunil Gupta',   phone:'+91 87654 32109', city:'Jaipur', zone:'North Zone', clinics_pitched:18, clinics_active:8,  clinics_ready:2, deals_this_month:2, target_this_month:5, revenue_generated:32000, commission_earned:3200,  last_activity:'Yesterday',      joining_date:'Feb 2025', performance_score:62 },
            { id:'MR3', name:'Pooja Sharma',  phone:'+91 76543 21098', city:'Jaipur', zone:'North Zone', clinics_pitched:31, clinics_active:15, clinics_ready:5, deals_this_month:5, target_this_month:5, revenue_generated:67000, commission_earned:6700,  last_activity:'Today 2:15 PM',  joining_date:'Dec 2024', performance_score:95 },
          ],
        },
        {
          id: 'C2', name: 'Ajmer', zone_id: 'Z1',
          city_manager: 'Priya Singh', city_manager_id: 'CM2',
          clinics_active: 10, clinics_total: 12,
          revenue_mtd: 20000, target_mtd: 30000,
          mrs: [
            { id:'MR4', name:'Deepak Kumar',  phone:'+91 65432 10987', city:'Ajmer', zone:'North Zone', clinics_pitched:14, clinics_active:6,  clinics_ready:1, deals_this_month:1, target_this_month:3, revenue_generated:18000, commission_earned:1800,  last_activity:'2 days ago',     joining_date:'Mar 2025', performance_score:45 },
          ],
        },
        {
          id: 'C3', name: 'Kota', zone_id: 'Z1',
          city_manager: 'Ravi Meena', city_manager_id: 'CM3',
          clinics_active: 7, clinics_total: 8,
          revenue_mtd: 13000, target_mtd: 15000,
          mrs: [
            { id:'MR5', name:'Anita Yadav',   phone:'+91 54321 09876', city:'Kota',  zone:'North Zone', clinics_pitched:9,  clinics_active:5,  clinics_ready:2, deals_this_month:2, target_this_month:3, revenue_generated:22000, commission_earned:2200,  last_activity:'Today 10:00 AM', joining_date:'Jan 2025', performance_score:71 },
          ],
        },
      ],
    },
    {
      id: 'Z2', name: 'South Zone', manager: 'Kavita Joshi',
      cities_count: 2, clinics_active: 23, clinics_total: 28,
      revenue_mtd: 45000, target_mtd: 60000, growth: '+8%',
      cities: [
        {
          id: 'C4', name: 'Udaipur', zone_id: 'Z2',
          city_manager: 'Mohan Lal', city_manager_id: 'CM4',
          clinics_active: 15, clinics_total: 18,
          revenue_mtd: 30000, target_mtd: 40000,
          mrs: [
            { id:'MR6', name:'Rakesh Patel',  phone:'+91 43210 98765', city:'Udaipur', zone:'South Zone', clinics_pitched:20, clinics_active:10, clinics_ready:3, deals_this_month:3, target_this_month:4, revenue_generated:38000, commission_earned:3800,  last_activity:'Today 9:00 AM',  joining_date:'Nov 2024', performance_score:82 },
          ],
        },
        {
          id: 'C5', name: 'Jodhpur', zone_id: 'Z2',
          city_manager: 'Sunita Bhatt', city_manager_id: 'CM5',
          clinics_active: 8, clinics_total: 10,
          revenue_mtd: 15000, target_mtd: 20000,
          mrs: [
            { id:'MR7', name:'Vikram Singh',  phone:'+91 32109 87654', city:'Jodhpur', zone:'South Zone', clinics_pitched:11, clinics_active:5,  clinics_ready:1, deals_this_month:1, target_this_month:3, revenue_generated:12000, commission_earned:1200,  last_activity:'3 days ago',     joining_date:'Apr 2025', performance_score:38 },
          ],
        },
      ],
    },
  ],
}
