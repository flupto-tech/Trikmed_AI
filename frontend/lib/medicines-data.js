// TrikMed Medicine Master Database
// 150+ common Indian medicines with brand names, generics, strengths, defaults

export const MEDICINES = [
  // ─── ANALGESIC / ANTIPYRETIC ─────────────────────────────────────────────
  { id:'m001', brandName:'Dolo 650',       genericName:'Paracetamol',        strengths:['500mg','650mg'],       form:'Tablet',  category:'Analgesic/Antipyretic', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'3 days' },
  { id:'m002', brandName:'Crocin',         genericName:'Paracetamol',        strengths:['500mg','650mg'],       form:'Tablet',  category:'Analgesic/Antipyretic', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'3 days' },
  { id:'m003', brandName:'Calpol',         genericName:'Paracetamol',        strengths:['250mg/5ml','125mg/5ml'], form:'Syrup', category:'Analgesic/Antipyretic', defaultDosage:'5ml-5ml-5ml', defaultTiming:'After food', defaultDuration:'3 days' },
  { id:'m004', brandName:'Combiflam',      genericName:'Ibuprofen+Paracetamol', strengths:['400mg+325mg'],     form:'Tablet',  category:'Analgesic/Antipyretic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'3 days' },
  { id:'m005', brandName:'Brufen',         genericName:'Ibuprofen',          strengths:['200mg','400mg','600mg'], form:'Tablet', category:'Analgesic/Antipyretic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'3 days' },
  { id:'m006', brandName:'Voveran',        genericName:'Diclofenac Sodium',  strengths:['50mg'],               form:'Tablet',  category:'Analgesic/Antipyretic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m007', brandName:'Moov',           genericName:'Diclofenac Gel',     strengths:['1%'],                 form:'Gel',     category:'Analgesic/Antipyretic', defaultDosage:'Apply locally', defaultTiming:'TDS', defaultDuration:'7 days' },
  { id:'m008', brandName:'Aceclofenac',    genericName:'Aceclofenac',        strengths:['100mg'],              form:'Tablet',  category:'Analgesic/Antipyretic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m009', brandName:'Tramadol',       genericName:'Tramadol HCl',       strengths:['50mg'],               form:'Capsule', category:'Analgesic/Antipyretic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'3 days' },

  // ─── ANTIBIOTICS ──────────────────────────────────────────────────────────
  { id:'m010', brandName:'Azithral 500',   genericName:'Azithromycin',       strengths:['250mg','500mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-0', defaultTiming:'Empty stomach', defaultDuration:'5 days' },
  { id:'m011', brandName:'Zithromax',      genericName:'Azithromycin',       strengths:['250mg','500mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-0', defaultTiming:'Empty stomach', defaultDuration:'5 days' },
  { id:'m012', brandName:'Mox',            genericName:'Amoxicillin',        strengths:['250mg','500mg'],      form:'Capsule', category:'Antibiotic', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m013', brandName:'Novamox',        genericName:'Amoxicillin',        strengths:['250mg','500mg'],      form:'Capsule', category:'Antibiotic', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m014', brandName:'Augmentin 625',  genericName:'Amoxicillin+Clavulanic Acid', strengths:['375mg','625mg','1g'], form:'Tablet', category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m015', brandName:'Clavam',         genericName:'Amoxicillin+Clavulanic Acid', strengths:['375mg','625mg'],   form:'Tablet', category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m016', brandName:'Taxim-O',        genericName:'Cefixime',           strengths:['100mg','200mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m017', brandName:'Zifi',           genericName:'Cefixime',           strengths:['100mg','200mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m018', brandName:'Cifran',         genericName:'Ciprofloxacin',      strengths:['250mg','500mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m019', brandName:'Ciplox',         genericName:'Ciprofloxacin',      strengths:['250mg','500mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m020', brandName:'Levoflox',       genericName:'Levofloxacin',       strengths:['250mg','500mg','750mg'], form:'Tablet', category:'Antibiotic', defaultDosage:'1-0-0', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m021', brandName:'Doxy-1',         genericName:'Doxycycline',        strengths:['100mg'],              form:'Capsule', category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m022', brandName:'Flagyl',         genericName:'Metronidazole',      strengths:['200mg','400mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m023', brandName:'Clindac A',      genericName:'Clindamycin',        strengths:['150mg','300mg'],      form:'Capsule', category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m024', brandName:'Erythromycin',   genericName:'Erythromycin',       strengths:['250mg','500mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-1-1-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m025', brandName:'Trimethoprim+Sulfa', genericName:'Co-trimoxazole', strengths:['480mg'],              form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m026', brandName:'Cefpodoxime',    genericName:'Cefpodoxime',        strengths:['100mg','200mg'],      form:'Tablet',  category:'Antibiotic', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },

  // ─── ANTACIDS / PPI ───────────────────────────────────────────────────────
  { id:'m030', brandName:'Pan D',          genericName:'Pantoprazole+Domperidone', strengths:['40mg+10mg'],   form:'Capsule', category:'Antacid/PPI', defaultDosage:'1-0-0', defaultTiming:'Before food', defaultDuration:'14 days' },
  { id:'m031', brandName:'Pan 40',         genericName:'Pantoprazole',       strengths:['20mg','40mg'],        form:'Tablet',  category:'Antacid/PPI', defaultDosage:'1-0-0', defaultTiming:'Before breakfast', defaultDuration:'14 days' },
  { id:'m032', brandName:'Pantocid',       genericName:'Pantoprazole',       strengths:['20mg','40mg'],        form:'Tablet',  category:'Antacid/PPI', defaultDosage:'1-0-0', defaultTiming:'Before breakfast', defaultDuration:'14 days' },
  { id:'m033', brandName:'Omez',           genericName:'Omeprazole',         strengths:['20mg','40mg'],        form:'Capsule', category:'Antacid/PPI', defaultDosage:'1-0-0', defaultTiming:'Before breakfast', defaultDuration:'14 days' },
  { id:'m034', brandName:'Razo',           genericName:'Rabeprazole',        strengths:['10mg','20mg'],        form:'Tablet',  category:'Antacid/PPI', defaultDosage:'1-0-0', defaultTiming:'Before breakfast', defaultDuration:'14 days' },
  { id:'m035', brandName:'Sucrafil',       genericName:'Sucralfate',         strengths:['1g'],                 form:'Syrup',   category:'Antacid/PPI', defaultDosage:'10ml-10ml-10ml', defaultTiming:'Empty stomach', defaultDuration:'14 days' },
  { id:'m036', brandName:'Digene',         genericName:'Antacid (Mg+Al hydroxide)', strengths:[''],           form:'Tablet',  category:'Antacid/PPI', defaultDosage:'1-1-1-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m037', brandName:'ENO',            genericName:'Fruit Salt (Antacid)', strengths:['5g/sachet'],       form:'Granule', category:'Antacid/PPI', defaultDosage:'1 sachet SOS', defaultTiming:'Empty stomach', defaultDuration:'SOS' },

  // ─── ANTIHISTAMINES ───────────────────────────────────────────────────────
  { id:'m040', brandName:'Cetzine',        genericName:'Cetirizine',         strengths:['5mg','10mg'],         form:'Tablet',  category:'Antihistamine', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m041', brandName:'Alerid',         genericName:'Cetirizine',         strengths:['10mg'],               form:'Tablet',  category:'Antihistamine', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m042', brandName:'Okacet',         genericName:'Cetirizine',         strengths:['10mg'],               form:'Tablet',  category:'Antihistamine', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m043', brandName:'Levocet',        genericName:'Levocetirizine',     strengths:['2.5mg','5mg'],        form:'Tablet',  category:'Antihistamine', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m044', brandName:'Xyzal',          genericName:'Levocetirizine',     strengths:['5mg'],                form:'Tablet',  category:'Antihistamine', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m045', brandName:'Allegra',        genericName:'Fexofenadine',       strengths:['120mg','180mg'],      form:'Tablet',  category:'Antihistamine', defaultDosage:'1-0-0', defaultTiming:'Empty stomach', defaultDuration:'5 days' },
  { id:'m046', brandName:'Atarax',         genericName:'Hydroxyzine',        strengths:['10mg','25mg'],        form:'Tablet',  category:'Antihistamine', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m047', brandName:'Cheston Cold',   genericName:'Chlorpheniramine+Phenylephrine', strengths:['4mg+10mg'], form:'Tablet', category:'Antihistamine', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'3 days' },

  // ─── COUGH / COLD ─────────────────────────────────────────────────────────
  { id:'m050', brandName:'Benadryl',       genericName:'Diphenhydramine+Ammonium Cl', strengths:['14mg+138mg/5ml'], form:'Syrup', category:'Cough/Cold', defaultDosage:'10ml-10ml-10ml', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m051', brandName:'Mucolite',       genericName:'Ambroxol',           strengths:['30mg','60mg'],        form:'Tablet',  category:'Cough/Cold', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m052', brandName:'Ambrodil-S',     genericName:'Ambroxol Syrup',     strengths:['15mg/5ml'],           form:'Syrup',   category:'Cough/Cold', defaultDosage:'10ml-10ml-10ml', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m053', brandName:'Montair LC',     genericName:'Montelukast+Levocetirizine', strengths:['10mg+5mg'],   form:'Tablet',  category:'Cough/Cold', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m054', brandName:'Montek LC',      genericName:'Montelukast+Levocetirizine', strengths:['10mg+5mg'],   form:'Tablet',  category:'Cough/Cold', defaultDosage:'0-0-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m055', brandName:'Ascoril LS',     genericName:'Levosalbutamol+Ambroxol', strengths:['1mg+30mg/5ml'], form:'Syrup',   category:'Cough/Cold', defaultDosage:'10ml-10ml-10ml', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m056', brandName:'Honitus',        genericName:'Honey+Tulsi Herbal Cough', strengths:['10ml'],        form:'Syrup',   category:'Cough/Cold', defaultDosage:'10ml-10ml-10ml', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m057', brandName:'Dextromethorphan 15', genericName:'Dextromethorphan', strengths:['15mg/5ml'],       form:'Syrup',   category:'Cough/Cold', defaultDosage:'10ml-10ml-10ml', defaultTiming:'After food', defaultDuration:'3 days' },

  // ─── DIABETES ─────────────────────────────────────────────────────────────
  { id:'m060', brandName:'Glycomet 500',   genericName:'Metformin',          strengths:['500mg','850mg','1g'], form:'Tablet',  category:'Diabetes', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m061', brandName:'Glyciphage',     genericName:'Metformin',          strengths:['500mg','1g'],         form:'Tablet',  category:'Diabetes', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m062', brandName:'Amaryl',         genericName:'Glimepiride',        strengths:['1mg','2mg','3mg','4mg'], form:'Tablet', category:'Diabetes', defaultDosage:'1-0-0', defaultTiming:'Before breakfast', defaultDuration:'30 days' },
  { id:'m063', brandName:'Januvia',        genericName:'Sitagliptin',        strengths:['50mg','100mg'],       form:'Tablet',  category:'Diabetes', defaultDosage:'1-0-0', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m064', brandName:'Galvus Met',     genericName:'Vildagliptin+Metformin', strengths:['50mg+500mg','50mg+1g'], form:'Tablet', category:'Diabetes', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m065', brandName:'Tenepure',       genericName:'Teneligliptin',      strengths:['20mg'],               form:'Tablet',  category:'Diabetes', defaultDosage:'1-0-0', defaultTiming:'Before breakfast', defaultDuration:'30 days' },
  { id:'m066', brandName:'Jardiance',      genericName:'Empagliflozin',      strengths:['10mg','25mg'],        form:'Tablet',  category:'Diabetes', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m067', brandName:'Huminsulin 30/70', genericName:'Insulin (Biphasic)', strengths:['100 IU/ml'],       form:'Injection', category:'Diabetes', defaultDosage:'Per advice', defaultTiming:'Before meals', defaultDuration:'As directed' },
  { id:'m068', brandName:'Lantus',         genericName:'Insulin Glargine',   strengths:['100 IU/ml'],          form:'Injection', category:'Diabetes', defaultDosage:'Per advice', defaultTiming:'Bedtime', defaultDuration:'As directed' },

  // ─── HYPERTENSION ─────────────────────────────────────────────────────────
  { id:'m070', brandName:'Stamlo',         genericName:'Amlodipine',         strengths:['2.5mg','5mg','10mg'], form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m071', brandName:'Amlokind',       genericName:'Amlodipine',         strengths:['5mg','10mg'],         form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m072', brandName:'Telma',          genericName:'Telmisartan',        strengths:['20mg','40mg','80mg'],  form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m073', brandName:'Tazloc',         genericName:'Telmisartan',        strengths:['40mg','80mg'],        form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m074', brandName:'Losar',          genericName:'Losartan',           strengths:['25mg','50mg','100mg'], form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m075', brandName:'Envas',          genericName:'Enalapril',          strengths:['2.5mg','5mg','10mg'], form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m076', brandName:'Tenormin',       genericName:'Atenolol',           strengths:['25mg','50mg','100mg'], form:'Tablet', category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m077', brandName:'Betaloc ZOK',    genericName:'Metoprolol Succinate', strengths:['25mg','50mg'],      form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m078', brandName:'Minipress XL',   genericName:'Prazosin',           strengths:['2.5mg','5mg'],        form:'Tablet',  category:'Hypertension', defaultDosage:'0-0-1', defaultTiming:'Before bed', defaultDuration:'30 days' },
  { id:'m079', brandName:'Dytor',          genericName:'Torsemide',          strengths:['5mg','10mg'],         form:'Tablet',  category:'Hypertension', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },

  // ─── CARDIAC ──────────────────────────────────────────────────────────────
  { id:'m080', brandName:'Ecosprin',       genericName:'Aspirin (Enteric Coated)', strengths:['75mg','150mg'], form:'Tablet', category:'Cardiac', defaultDosage:'0-1-0', defaultTiming:'After lunch', defaultDuration:'30 days' },
  { id:'m081', brandName:'Clopilet',       genericName:'Clopidogrel',        strengths:['75mg'],               form:'Tablet',  category:'Cardiac', defaultDosage:'0-1-0', defaultTiming:'After lunch', defaultDuration:'30 days' },
  { id:'m082', brandName:'Plavix',         genericName:'Clopidogrel',        strengths:['75mg'],               form:'Tablet',  category:'Cardiac', defaultDosage:'0-1-0', defaultTiming:'After lunch', defaultDuration:'30 days' },
  { id:'m083', brandName:'Atorva',         genericName:'Atorvastatin',       strengths:['10mg','20mg','40mg','80mg'], form:'Tablet', category:'Cardiac', defaultDosage:'0-0-1', defaultTiming:'After dinner', defaultDuration:'30 days' },
  { id:'m084', brandName:'Storvas',        genericName:'Atorvastatin',       strengths:['10mg','20mg','40mg'], form:'Tablet',  category:'Cardiac', defaultDosage:'0-0-1', defaultTiming:'After dinner', defaultDuration:'30 days' },
  { id:'m085', brandName:'Rozavel',        genericName:'Rosuvastatin',       strengths:['5mg','10mg','20mg'],  form:'Tablet',  category:'Cardiac', defaultDosage:'0-0-1', defaultTiming:'After dinner', defaultDuration:'30 days' },
  { id:'m086', brandName:'Ranexa',         genericName:'Ranolazine',         strengths:['500mg'],              form:'Tablet',  category:'Cardiac', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m087', brandName:'Nitrocontin',    genericName:'Isosorbide Mononitrate', strengths:['20mg','40mg'],    form:'Tablet',  category:'Cardiac', defaultDosage:'1-0-0', defaultTiming:'Empty stomach', defaultDuration:'30 days' },

  // ─── GASTRO ───────────────────────────────────────────────────────────────
  { id:'m090', brandName:'Vomikind',       genericName:'Ondansetron',        strengths:['4mg','8mg'],          form:'Tablet',  category:'Gastro', defaultDosage:'1-1-1', defaultTiming:'Before food', defaultDuration:'3 days' },
  { id:'m091', brandName:'Emeset',         genericName:'Ondansetron',        strengths:['4mg','8mg'],          form:'Tablet',  category:'Gastro', defaultDosage:'1-1-1', defaultTiming:'Before food', defaultDuration:'3 days' },
  { id:'m092', brandName:'Domstal',        genericName:'Domperidone',        strengths:['10mg'],               form:'Tablet',  category:'Gastro', defaultDosage:'1-1-1', defaultTiming:'Before food', defaultDuration:'3 days' },
  { id:'m093', brandName:'Nexpro RD',      genericName:'Rabeprazole+Domperidone', strengths:['20mg+30mg'],     form:'Capsule', category:'Gastro', defaultDosage:'1-0-0', defaultTiming:'Before breakfast', defaultDuration:'14 days' },
  { id:'m094', brandName:'Eldoper',        genericName:'Loperamide',         strengths:['2mg'],                form:'Tablet',  category:'Gastro', defaultDosage:'2 then 1-1-1', defaultTiming:'After food', defaultDuration:'3 days' },
  { id:'m095', brandName:'ORS',            genericName:'Oral Rehydration Salts', strengths:['1 litre pack'],  form:'Sachet',  category:'Gastro', defaultDosage:'250ml every 4h', defaultTiming:'As needed', defaultDuration:'As needed' },
  { id:'m096', brandName:'Vibact',         genericName:'Probiotic (Bacillus clausii)', strengths:['5B/2ml'],   form:'Sachet',  category:'Gastro', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m097', brandName:'Enterogermina',  genericName:'Bacillus clausii',   strengths:['5B/5ml'],             form:'Ampoule', category:'Gastro', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m098', brandName:'Duphalac',       genericName:'Lactulose',          strengths:['66.5g/100ml'],        form:'Syrup',   category:'Gastro', defaultDosage:'15ml-0-15ml', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m099', brandName:'Cremaffin',      genericName:'Liquid Paraffin+Milk of Magnesia', strengths:['10ml'], form:'Syrup', category:'Gastro', defaultDosage:'0-0-15ml', defaultTiming:'After dinner', defaultDuration:'7 days' },

  // ─── IRON / VITAMINS ──────────────────────────────────────────────────────
  { id:'m100', brandName:'Autrin',         genericName:'Ferrous Fumarate+Folic Acid', strengths:['150mg+1.5mg'], form:'Capsule', category:'Iron/Vitamins', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'90 days' },
  { id:'m101', brandName:'Livogen',        genericName:'Ferrous Fumarate+Folic Acid', strengths:['305mg+1.5mg'], form:'Tablet', category:'Iron/Vitamins', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'90 days' },
  { id:'m102', brandName:'Neurobion Forte', genericName:'Vitamin B-Complex',  strengths:[''],                  form:'Tablet',  category:'Iron/Vitamins', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m103', brandName:'Becosules',      genericName:'Vitamin B-Complex+C', strengths:[''],                  form:'Capsule', category:'Iron/Vitamins', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m104', brandName:'D-Rise 60K',     genericName:'Vitamin D3',         strengths:['60000 IU'],           form:'Sachet',  category:'Iron/Vitamins', defaultDosage:'Once weekly', defaultTiming:'After food', defaultDuration:'8 weeks' },
  { id:'m105', brandName:'Calcirol',       genericName:'Vitamin D3',         strengths:['60000 IU'],           form:'Sachet',  category:'Iron/Vitamins', defaultDosage:'Once weekly', defaultTiming:'After food', defaultDuration:'8 weeks' },
  { id:'m106', brandName:'Shelcal',        genericName:'Calcium Carbonate+Vitamin D3', strengths:['500mg+250IU'], form:'Tablet', category:'Iron/Vitamins', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'90 days' },
  { id:'m107', brandName:'Nervijen Plus',  genericName:'Methylcobalamin+ALA+VB6', strengths:['500mcg+100mg'],   form:'Tablet',  category:'Iron/Vitamins', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m108', brandName:'Zincovit',       genericName:'Zinc+Multivitamin',  strengths:[''],                   form:'Tablet',  category:'Iron/Vitamins', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },
  { id:'m109', brandName:'Supracal',       genericName:'Calcium Citrate+D3+K2', strengths:['500mg'],           form:'Tablet',  category:'Iron/Vitamins', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'90 days' },

  // ─── THYROID ──────────────────────────────────────────────────────────────
  { id:'m110', brandName:'Thyronorm',      genericName:'Levothyroxine',      strengths:['25mcg','50mcg','75mcg','100mcg','125mcg','150mcg'], form:'Tablet', category:'Thyroid', defaultDosage:'1-0-0', defaultTiming:'Empty stomach (30 min before food)', defaultDuration:'90 days' },
  { id:'m111', brandName:'Eltroxin',       genericName:'Levothyroxine',      strengths:['50mcg','100mcg'],     form:'Tablet',  category:'Thyroid', defaultDosage:'1-0-0', defaultTiming:'Empty stomach', defaultDuration:'90 days' },
  { id:'m112', brandName:'Thyroid Extract', genericName:'Carbimazole',       strengths:['5mg','10mg'],         form:'Tablet',  category:'Thyroid', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'30 days' },

  // ─── WOMEN'S HEALTH ───────────────────────────────────────────────────────
  { id:'m115', brandName:'Ferimax XT',     genericName:'Iron+Folic+B12',     strengths:[''],                   form:'Tablet',  category:"Women's Health", defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'90 days' },
  { id:'m116', brandName:'Fefol',          genericName:'Iron+Folic Acid',    strengths:['150mg+1.5mg'],        form:'Capsule', category:"Women's Health", defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'90 days' },
  { id:'m117', brandName:'Duphaston',      genericName:'Dydrogesterone',     strengths:['10mg'],               form:'Tablet',  category:"Women's Health", defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'14 days' },
  { id:'m118', brandName:'Meftal Spas',    genericName:'Mefenamic Acid+Dicyclomine', strengths:['250mg+10mg'], form:'Tablet', category:"Women's Health", defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'3 days' },
  { id:'m119', brandName:'Primolut-N',     genericName:'Norethisterone',     strengths:['5mg'],                form:'Tablet',  category:"Women's Health", defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m120', brandName:'Yasmin',         genericName:'Drospirenone+Ethinyl Estradiol', strengths:['3mg+0.03mg'], form:'Tablet', category:"Women's Health", defaultDosage:'1-0-0', defaultTiming:'After food', defaultDuration:'21 days' },

  // ─── TOPICAL ──────────────────────────────────────────────────────────────
  { id:'m125', brandName:'Betadine',       genericName:'Povidone Iodine',    strengths:['5%','10%'],           form:'Solution', category:'Topical', defaultDosage:'Apply to wound', defaultTiming:'BD', defaultDuration:'7 days' },
  { id:'m126', brandName:'Soframycin',     genericName:'Framycetin Sulphate', strengths:['1%'],                form:'Cream',   category:'Topical', defaultDosage:'Apply locally', defaultTiming:'BD', defaultDuration:'7 days' },
  { id:'m127', brandName:'Candid',         genericName:'Clotrimazole',       strengths:['1%'],                 form:'Cream',   category:'Topical', defaultDosage:'Apply locally', defaultTiming:'BD', defaultDuration:'14 days' },
  { id:'m128', brandName:'T-Bact',         genericName:'Mupirocin',          strengths:['2%'],                 form:'Cream',   category:'Topical', defaultDosage:'Apply locally', defaultTiming:'TDS', defaultDuration:'7 days' },
  { id:'m129', brandName:'Tenovate',       genericName:'Clobetasol Propionate', strengths:['0.05%'],           form:'Cream',   category:'Topical', defaultDosage:'Apply thinly', defaultTiming:'BD', defaultDuration:'7 days' },
  { id:'m130', brandName:'Elocon',         genericName:'Mometasone',         strengths:['0.1%'],               form:'Cream',   category:'Topical', defaultDosage:'Apply thinly', defaultTiming:'OD', defaultDuration:'7 days' },
  { id:'m131', brandName:'Calamine Lotion', genericName:'Calamine',          strengths:['15%'],                form:'Lotion',  category:'Topical', defaultDosage:'Apply locally', defaultTiming:'TDS', defaultDuration:'7 days' },
  { id:'m132', brandName:'Whitfield Ointment', genericName:'Benzoic+Salicylic Acid', strengths:['6%+3%'],      form:'Ointment', category:'Topical', defaultDosage:'Apply locally', defaultTiming:'BD', defaultDuration:'14 days' },

  // ─── EYE / EAR ────────────────────────────────────────────────────────────
  { id:'m135', brandName:'Moxiflox Eye',   genericName:'Moxifloxacin Eye Drops', strengths:['0.5%'],          form:'Drops',   category:'Eye/Ear', defaultDosage:'1 drop both eyes', defaultTiming:'QID', defaultDuration:'7 days' },
  { id:'m136', brandName:'Cipladine Eye',  genericName:'Povidone Iodine Eye', strengths:['5%'],               form:'Drops',   category:'Eye/Ear', defaultDosage:'1 drop', defaultTiming:'TDS', defaultDuration:'5 days' },
  { id:'m137', brandName:'Candibiotic',    genericName:'Clotrimazole+Beclomethasone+Neomycin Ear', strengths:[''], form:'Drops', category:'Eye/Ear', defaultDosage:'2-3 drops in ear', defaultTiming:'TDS', defaultDuration:'7 days' },
  { id:'m138', brandName:'Softamycin',     genericName:'Chloramphenicol Eye Drops', strengths:['0.5%'],        form:'Drops',   category:'Eye/Ear', defaultDosage:'1 drop both eyes', defaultTiming:'QID', defaultDuration:'5 days' },
  { id:'m139', brandName:'Refresh Tears',  genericName:'Carboxymethylcellulose', strengths:['0.5%'],           form:'Drops',   category:'Eye/Ear', defaultDosage:'1-2 drops', defaultTiming:'SOS', defaultDuration:'As needed' },
  { id:'m140', brandName:'Otocomb',        genericName:'Gentamicin+Triamcinolone Ear', strengths:[''],         form:'Drops',   category:'Eye/Ear', defaultDosage:'3-4 drops', defaultTiming:'TDS', defaultDuration:'7 days' },

  // ─── RESPIRATORY / ASTHMA ─────────────────────────────────────────────────
  { id:'m143', brandName:'Foracort',       genericName:'Formoterol+Budesonide', strengths:['6/200mcg','12/400mcg'], form:'Inhaler', category:'Respiratory', defaultDosage:'1 puff BD', defaultTiming:'Twice daily', defaultDuration:'30 days' },
  { id:'m144', brandName:'Asthalin',       genericName:'Salbutamol',         strengths:['100mcg/puff'],        form:'Inhaler',  category:'Respiratory', defaultDosage:'2 puffs SOS', defaultTiming:'When needed', defaultDuration:'SOS' },
  { id:'m145', brandName:'Deriphyllin',    genericName:'Theophylline+Etofylline', strengths:['100mg+150mg'],   form:'Tablet',  category:'Respiratory', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'7 days' },
  { id:'m146', brandName:'Montek',         genericName:'Montelukast',        strengths:['4mg','5mg','10mg'],   form:'Tablet',  category:'Respiratory', defaultDosage:'0-0-1', defaultTiming:'After dinner', defaultDuration:'30 days' },

  // ─── SKIN / DERMATOLOGY ───────────────────────────────────────────────────
  { id:'m148', brandName:'Aziderm',        genericName:'Azelaic Acid',       strengths:['10%','20%'],          form:'Cream',   category:'Dermatology', defaultDosage:'Apply BD', defaultTiming:'Morning & night', defaultDuration:'30 days' },
  { id:'m149', brandName:'Tretino 0.025',  genericName:'Tretinoin',          strengths:['0.025%','0.05%'],     form:'Cream',   category:'Dermatology', defaultDosage:'Apply at night', defaultTiming:'Bedtime', defaultDuration:'30 days' },
  { id:'m150', brandName:'Deriva CMS',     genericName:'Clindamycin+Benzoyl Peroxide', strengths:['1%+2.5%'], form:'Gel', category:'Dermatology', defaultDosage:'Apply BD', defaultTiming:'Morning & night', defaultDuration:'30 days' },

  // ─── AYURVEDA / OTC ───────────────────────────────────────────────────────
  { id:'m155', brandName:'Ashwagandha KSM-66', genericName:'Withania Somnifera', strengths:['300mg','600mg'], form:'Capsule', category:'Ayurveda', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m156', brandName:'Triphala Churna', genericName:'Triphala',          strengths:['3g/5ml'],             form:'Powder',  category:'Ayurveda', defaultDosage:'5ml in warm water at night', defaultTiming:'Bedtime', defaultDuration:'30 days' },
  { id:'m157', brandName:'Liv.52',          genericName:'Liver Protective Herbs', strengths:[''],             form:'Tablet',  category:'Ayurveda', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m158', brandName:'Cystone',         genericName:'Didymocarpus+Shilapushpa Herbal', strengths:[''],    form:'Tablet',  category:'Ayurveda', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'30 days' },
  { id:'m159', brandName:'Septilin',        genericName:'Tinospora+Guduchi Herbal', strengths:[''],           form:'Tablet',  category:'Ayurveda', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'15 days' },
  { id:'m160', brandName:'Tulsi Ark',       genericName:'Ocimum Sanctum Extract', strengths:[''],             form:'Drops',   category:'Ayurveda', defaultDosage:'10 drops in water', defaultTiming:'Morning', defaultDuration:'30 days' },

  // ─── PAIN / MUSCLE RELAXANTS ──────────────────────────────────────────────
  { id:'m163', brandName:'Myospaz',         genericName:'Chlorzoxazone+Paracetamol', strengths:['250mg+500mg'], form:'Tablet', category:'Muscle Relaxant', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m164', brandName:'Relaxyl',         genericName:'Methocarbamol',      strengths:['750mg'],              form:'Tablet',  category:'Muscle Relaxant', defaultDosage:'1-1-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m165', brandName:'Tizanidine',      genericName:'Tizanidine',         strengths:['2mg','4mg'],          form:'Tablet',  category:'Muscle Relaxant', defaultDosage:'0-0-1', defaultTiming:'Before bed', defaultDuration:'5 days' },

  // ─── PSYCHIATRIC / NEURO ──────────────────────────────────────────────────
  { id:'m168', brandName:'Oleanz',          genericName:'Olanzapine',         strengths:['2.5mg','5mg','10mg'], form:'Tablet', category:'Psychiatry', defaultDosage:'0-0-1', defaultTiming:'After dinner', defaultDuration:'30 days' },
  { id:'m169', brandName:'Etizola',         genericName:'Etizolam',           strengths:['0.25mg','0.5mg','1mg'], form:'Tablet', category:'Psychiatry', defaultDosage:'0-0-1', defaultTiming:'After dinner', defaultDuration:'7 days' },
  { id:'m170', brandName:'Flunil',          genericName:'Fluoxetine',         strengths:['10mg','20mg'],        form:'Capsule', category:'Psychiatry', defaultDosage:'1-0-0', defaultTiming:'After breakfast', defaultDuration:'30 days' },

  // ─── URINARY / RENAL ──────────────────────────────────────────────────────
  { id:'m173', brandName:'Nitrofurantoin',  genericName:'Nitrofurantoin',     strengths:['100mg'],              form:'Capsule', category:'Urinary', defaultDosage:'1-0-1', defaultTiming:'After food', defaultDuration:'5 days' },
  { id:'m174', brandName:'Urimax D',        genericName:'Tamsulosin+Dutasteride', strengths:['0.4mg+0.5mg'],   form:'Capsule', category:'Urinary', defaultDosage:'0-1-0', defaultTiming:'After lunch', defaultDuration:'30 days' },
  { id:'m175', brandName:'Alkasol',         genericName:'Disodium Hydrogen Citrate', strengths:['1.4g/5ml'],   form:'Syrup',   category:'Urinary', defaultDosage:'10ml TDS in water', defaultTiming:'After food', defaultDuration:'7 days' },
]

// ─── SEARCH FUNCTION ──────────────────────────────────────────────────────────
export function searchMedicines(query, customMedicines = []) {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().trim()

  const all = [...MEDICINES, ...customMedicines.map(m => ({ ...m, isCustom: true }))]

  return all
    .filter(m => {
      const brand = m.brandName?.toLowerCase() || ''
      const generic = m.genericName?.toLowerCase() || ''
      const category = m.category?.toLowerCase() || ''
      return brand.includes(q) || generic.includes(q) || category.includes(q) ||
        brand.startsWith(q.charAt(0))
    })
    .sort((a, b) => {
      const aBrand = a.brandName?.toLowerCase() || ''
      const bBrand = b.brandName?.toLowerCase() || ''
      const aStarts = aBrand.startsWith(q) ? 0 : 1
      const bStarts = bBrand.startsWith(q) ? 0 : 1
      return aStarts - bStarts || aBrand.localeCompare(bBrand)
    })
    .slice(0, 15)
}

export const MEDICINE_CATEGORIES = [
  'Analgesic/Antipyretic','Antibiotic','Antacid/PPI','Antihistamine','Cough/Cold',
  'Diabetes','Hypertension','Cardiac','Gastro','Iron/Vitamins','Thyroid',
  "Women's Health",'Topical','Eye/Ear','Respiratory','Dermatology',
  'Ayurveda','Muscle Relaxant','Psychiatry','Urinary',
]

export const TIMING_OPTIONS = [
  'Before breakfast','After breakfast','Before food','After food',
  'Empty stomach','Before bed','After dinner','Morning',
  'BD','TDS','QID','OD','SOS','As directed',
]

export const DOSAGE_OPTIONS = [
  '1-0-0','0-1-0','0-0-1','1-0-1','1-1-1','1-1-1-1',
  '0-0-1 (HS)','½-0-½','2-0-2',
]

export const DURATION_OPTIONS = [
  '1 day','3 days','5 days','7 days','10 days','14 days',
  '1 month','2 months','3 months','SOS','As directed',
]
