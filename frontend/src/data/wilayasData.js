export const WILAYAS = [
  '01 Adrar', '02 Chlef', '03 Laghouat', '04 Oum El Bouaghi', '05 Batna', '06 Béjaïa', '07 Biskra', '08 Béchar', '09 Blida', '10 Bouira',
  '11 Tamanrasset', '12 Tébessa', '13 Tlemcen', '14 Tiaret', '15 Tizi Ouzou', '16 Alger', '17 Djelfa', '18 Jijel', '19 Sétif', '20 Saïda',
  '21 Skikda', '22 Sidi Bel Abbès', '23 Annaba', '24 Guelma', '25 Constantine', '26 Médéa', '27 Mostaganem', '28 M\'Sila', '29 Mascara',
  '30 Ouargla', '31 Oran', '32 El Bayadh', '33 Illizi', '34 Bordj Bou Arréridj', '35 Boumerdès', '36 El Tarf', '37 Tindouf', '38 Tissemsilt',
  '39 El Oued', '40 Khenchela', '41 Souk Ahras', '42 Tipaza', '43 Mila', '44 Aïn Defla', '45 Naâma', '46 Aïn Témouchent', '47 Ghardaïa', '48 Relizane',
  '49 Timimoun', '50 Bordj Badji Mokhtar', '51 Ouled Djellal', '52 Béni Abbès', '53 In Salah', '54 In Guezzam', '55 Touggourt', '56 Djanet', '57 El M\'Ghair', '58 El Meniaa'
];

const CUSTOM_DATA = {
  "01 Adrar": ["Adrar", "Reggane", "In Zghmir", "Tit", "Tsabit", "Fenoughil", "Aoulef"],
  "02 Chlef": ["Chlef", "Ténès", "Boukadir", "Ouled Fares", "Sidi Akkacha", "Béni Haoua", "El Karimia"],
  "03 Laghouat": ["Laghouat", "Aflou", "Ain Madhi", "Ksar El Hirane", "Hassi R'Mel", "Sidi Makhlouf"],
  "04 Oum El Bouaghi": ["Oum El Bouaghi", "Ain Beida", "Ain M'lila", "Ain Kercha", "Ain Zitoun", "Fkirina"],
  "05 Batna": ["Batna", "Barika", "Arris", "Merouana", "Ain Touta", "Timgad", "Tazoult", "N'Gaous"],
  "06 Béjaïa": ["Béjaïa", "Akbou", "Amizour", "Kherrata", "Sidi Aïch", "El Kseur", "Ighram", "Ouzellaguen"],
  "07 Biskra": ["Biskra", "Tolga", "Sidi Okba", "Ouled Djellal", "Zeribet El Oued", "M'Chouneche"],
  "08 Béchar": ["Béchar", "Abadla", "Kenadsa", "Béni Abbès", "Taghit", "Igli", "Béni Ounif"],
  "09 Blida": ["Blida", "Boufarik", "Beni Mered", "Ouled Yaich", "Larbaa", "Meftah", "Mouzaia", "El Affroun"],
  "10 Bouira": ["Bouira", "Lakhdaria", "Sour El Ghozlane", "Aïn Bessem", "M'Chedallah", "Bechloul", "Kadiria"],
  "11 Tamanrasset": ["Tamanrasset", "In Salah", "In Ghar", "In Amguel", "Idles", "Tazrouk"],
  "12 Tébessa": ["Tébessa", "Bir El Ater", "Cheria", "Ouenza", "El Kouif", "Morsott", "Negrine"],
  "13 Tlemcen": ["Tlemcen", "Maghnia", "Mansourah", "Ghazaouet", "Remchi", "Sebdou", "Hennaya", "Nedroma"],
  "14 Tiaret": ["Tiaret", "Sougueur", "Frenda", "Ksar Chellala", "Mahdia", "Rahouia", "Mecheria"],
  "15 Tizi Ouzou": ["Tizi Ouzou", "Azazga", "Draâ Ben Khedda", "Tigzirt", "Larbaâ Nath Irathen", "Azeffoun", "Boghni", "Ouadhias"],
  "16 Alger": ["Alger-Centre", "Bab El Oued", "Hussein Dey", "Bir Mourad Raïs", "Kouba", "Dar El Beïda", "Birkhadem", "Cheraga", "Hydra", "El Harrach", "Zéralda", "Sidi M'Hamed"],
  "17 Djelfa": ["Djelfa", "Hassi Bahbah", "Ain Oussera", "Messaad", "Dar Chioukh", "Idrisia", "Charef"],
  "18 Jijel": ["Jijel", "Taher", "El Milia", "Chekfa", "Jidjelli", "Sidi Abdelaziz", "Texenna"],
  "19 Sétif": ["Sétif", "El Eulma", "Aïn Arnat", "Aïn Oulmene", "Bouandas", "Beni Aziz", "Hammam Guergour", "Guidjel"],
  "20 Saïda": ["Saïda", "Ain El Hadjar", "Sidi Amar", "Youb", "Hassasna", "Moulay Larbi"],
  "21 Skikda": ["Skikda", "Azzaba", "El Harrouch", "Collo", "Tamalous", "Sidi Mezghiche", "Bin El Ouidane"],
  "22 Sidi Bel Abbès": ["Sidi Bel Abbès", "Sfisef", "Télagh", "Ben Badis", "Sidi Ali Boussidi", "Moulay Slissen"],
  "23 Annaba": ["Annaba", "El Bouni", "El Hadjar", "Berrahal", "Séraïdi", "Chetaïbi", "Sidi Amar", "Trézel"],
  "24 Guelma": ["Guelma", "Bouchegouf", "Oued Zenati", "Héliopolis", "Ain Makhlouf", "Boumahra Ahmed"],
  "25 Constantine": ["Constantine", "El Khroub", "Aïn Smara", "Hamma Bouziane", "Zighoud Youcef", "Didouche Mourad"],
  "26 Médéa": ["Médéa", "Berrouaghia", "Ksar El Boukhari", "Beni Slimane", "Aziz", "Chahbounia", "Tablat"],
  "27 Mostaganem": ["Mostaganem", "Aïn Nouïssy", "Hassi Maâmeche", "Mesra", "Bouguirat", "Sidi Lakhdar", "Achaacha"],
  "28 M'Sila": ["M'Sila", "Bou Saâda", "Sidi Aïssa", "Maadid", "Beni Ilman", "Hammam Dhalaa"],
  "29 Mascara": ["Mascara", "Ghriss", "Sig", "Tighennif", "Mohammadia", "Oued Taria", "Bou Hanifia"],
  "30 Ouargla": ["Ouargla", "Hassi Messaoud", "Rouissat", "N'Goussa", "Sidi Khouiled", "Ain Beida"],
  "31 Oran": ["Oran", "Es Sénia", "Bir El Djir", "Arzew", "Bethioua", "Aïn El Turck", "Mers El Kébir", "Gdyel", "Oued Tlelat", "Misserghin"],
  "32 El Bayadh": ["El Bayadh", "Bougtob", "Brezina", "El Abiodh Sidi Cheikh", "Boualem", "Rogassa"],
  "33 Illizi": ["Illizi", "Djanet", "Debdeb", "Bordj Omar Driss"],
  "34 Bordj Bou Arréridj": ["Bordj Bou Arréridj", "Ras El Oued", "Bordj Ghedir", "Mansoura", "Medjana", "El Hammadia"],
  "35 Boumerdès": ["Boumerdès", "Boudouaou", "Corso", "Dellys", "Thénia", "Khemis El Khechna", "Hamadi"],
  "36 El Tarf": ["El Tarf", "El Kala", "Dréan", "Besbes", "Ben M'Hidi", "Bouhadjar"],
  "37 Tindouf": ["Tindouf", "Oum El Assel"],
  "38 Tissemsilt": ["Tissemsilt", "Theniet El Had", "Lardjem", "Khemisti", "Bordj Emir Abdelkader"],
  "39 El Oued": ["El Oued", "Guémar", "Robbah", "Bayadha", "Debila", "Magrane", "Hassi Khalifa"],
  "40 Khenchela": ["Khenchela", "Kais", "Chechar", "Babor", "Ouled Rechache", "Bouhmama"],
  "41 Souk Ahras": ["Souk Ahras", "Sédrata", "M'daourouch", "Taoura", "Merahna", "Haddada"],
  "42 Tipaza": ["Tipaza", "Cherchell", "Kolea", "Hadjout", "Bou Ismaïl", "Fouka", "Damous", "Gouraya"],
  "43 Mila": ["Mila", "Chelghoum Laïd", "Grarem Gouga", "Ferdjioua", "Teleghma", "Oued Endja"],
  "44 Aïn Defla": ["Aïn Defla", "Miliana", "Khemis Miliana", "Hammam Righa", "Djendel", "Boumedfa"],
  "45 Naâma": ["Naâma", "Mécheria", "Aïn Séfra", "Moghrar", "Tiout", "Asla"],
  "46 Aïn Témouchent": ["Aïn Témouchent", "Béni Saf", "Hammam Bou Hadjar", "El Amria", "El Malah"],
  "47 Ghardaïa": ["Ghardaïa", "Metlili", "El Guerrara", "Bounoura", "Zelfana", "Dhayet Bendhahoua"],
  "48 Relizane": ["Relizane", "Oued Rhiou", "Mazouna", "Zemmora", "Ammi Moussa", "Yellel"],
  "49 Timimoun": ["Timimoun", "Aougrout", "Ksar Kaddour"],
  "50 Bordj Badji Mokhtar": ["Bordj Badji Mokhtar", "Timiaouine"],
  "51 Ouled Djellal": ["Ouled Djellal", "Sidi Khaled", "Besbes", "Ras El Miad"],
  "52 Béni Abbès": ["Béni Abbès", "Taghit", "Kerzaz", "El Ouata", "Igli", "Tabelbala"],
  "53 In Salah": ["In Salah", "In Ghar", "Foggaret Ezzaouia"],
  "54 In Guezzam": ["In Guezzam", "Tin Zaouatine"],
  "55 Touggourt": ["Touggourt", "Nezla", "Tebesbest", "Zaouia El Abidia", "Sidi Slimane"],
  "56 Djanet": ["Djanet", "Bordj El Haouas"],
  "57 El M'Ghair": ["El M'Ghair", "Djamaa", "Mrara", "Still"],
  "58 El Meniaa": ["El Meniaa", "Hassi Gara", "Hassi El Khebi"]
};

export const getWilayaData = (wilayaFull) => {
  if (!wilayaFull) return null;
  const communes = CUSTOM_DATA[wilayaFull] || [];
  
  // Basic coords mapping for center points (approximate)
  const coords = {
    "16 Alger": { lat: 36.7538, lng: 3.0588 },
    "31 Oran": { lat: 35.6987, lng: -0.6308 },
    "25 Constantine": { lat: 36.3650, lng: 6.6147 },
    "23 Annaba": { lat: 36.9000, lng: 7.7667 },
    "19 Sétif": { lat: 36.1911, lng: 5.4137 },
    "05 Batna": { lat: 35.5558, lng: 6.1736 },
    "09 Blida": { lat: 36.4700, lng: 2.8277 },
    "13 Tlemcen": { lat: 34.8783, lng: -1.3150 },
    "30 Ouargla": { lat: 31.9493, lng: 5.3250 },
    "11 Tamanrasset": { lat: 22.7850, lng: 5.5228 },
    "47 Ghardaïa": { lat: 32.4909, lng: 3.6735 },
    "29 Mascara": { lat: 35.3964, lng: 0.1403 }
  };

  const base = coords[wilayaFull] || { lat: 28.0, lng: 2.0 };

  return {
    id: wilayaFull,
    nom: wilayaFull,
    lat: base.lat,
    lng: base.lng,
    communes: communes
  };
};

export const getAllWilayasData = () => {
  return WILAYAS.map(w => getWilayaData(w));
};
