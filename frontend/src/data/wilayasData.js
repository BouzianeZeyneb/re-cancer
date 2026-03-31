export const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira',
  'Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda',
  'Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','MSila','Mascara',
  'Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt',
  'El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane',
  'Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M\'Ghair','El Meniaa'
];

const CUSTOM_DATA = {
  "Alger": { lat: 36.7538, lng: 3.0588, communes: ["Alger-Centre", "Bab El Oued", "Hussein Dey", "Rouiba", "Zéralda"], zones: ["ZI Rouiba", "ZI Réghaïa", "Zone Industrielle Oued Smar", "Zone d'Activité Baba Ali"] },
  "Oran": { lat: 35.6987, lng: -0.6308, communes: ["Oran", "Arzew", "Bir El Djir", "Es Sénia", "Gdyel"], zones: ["ZI Arzew (Pétrochimie)", "Zone Industrielle Hassi-Ameur", "ZI Oued Tlélat"] },
  "Constantine": { lat: 36.3650, lng: 6.6147, communes: ["Constantine", "El Khroub", "Ain Smara", "Hamma Bouziane"], zones: ["ZI Oued Hamimine", "ZI Ibn Ziad", "Zone d'Activité Ali Mendjeli"] },
  "Tlemcen": { lat: 34.8783, lng: -1.3150, communes: ["Tlemcen", "Mansourah", "Maghnia", "Remchi", "Ghazaouet"], zones: ["ZI Remchi", "ZI Maghnia", "ZI Chetouane"] },
  "Annaba": { lat: 36.9000, lng: 7.7667, communes: ["Annaba", "El Bouni", "Sidi Amar", "El Hadjar", "Berrahal"], zones: ["ZI Pont Bouchet", "Complexe Sidérurgique El Hadjar", "ZI Berrahal"] },
  "Sétif": { lat: 36.1911, lng: 5.4137, communes: ["Sétif", "El Eulma", "Ain Arnat", "Ain Oulmene"], zones: ["ZI Sétif-Est", "ZI El Eulma", "Zone d'Activité Ain Arnat"] },
  "Batna": { lat: 35.5558, lng: 6.1736, communes: ["Batna", "Barika", "Arris", "Merouana"], zones: ["Zone Industrielle Kechida", "ZI Barika"] },
  "Blida": { lat: 36.4700, lng: 2.8277, communes: ["Blida", "Boufarik", "Beni Mered", "Ouled Yaich"], zones: ["Zone Industrielle de Boufarik", "ZI Ben Boulaid", "ZI Ouled Yaich"] },
  "Béjaïa": { lat: 36.7512, lng: 5.0645, communes: ["Béjaïa", "Amizour", "Akbou", "El Kseur"], zones: ["ZI Taharacht", "Zone Portuaire Béjaïa", "Zone d'Activité Ighil Ouazzoug"] },
  "Skikda": { lat: 36.8778, lng: 5.9069, communes: ["Skikda", "Azzaba", "El Harrouch", "Collo"], zones: ["ZI Skikda (Pétrochimie)", "Zone d'Activité Hamadi Krouma"] },
  "Bordj Bou Arréridj": { lat: 36.0732, lng: 4.7611, communes: ["Bordj Bou Arréridj", "Ras El Oued", "Bordj Ghedir"], zones: ["ZI BBA (Électronique/Électroménager)", "Zone d'Activité Bordj Ghedir"] },
  "Ouargla": { lat: 31.9493, lng: 5.3250, communes: ["Ouargla", "Rouissat", "Hassi Messaoud"], zones: ["Zones Pétrolières Hassi Messaoud", "ZI Ouargla"] },
  "Boumerdès": { lat: 36.7558, lng: 3.4735, communes: ["Boumerdès", "Boudouaou", "Corso", "Dellys"], zones: ["ZI Corso", "ZI Larbatache", "Zone Industrielle Ouled Moussa"] },
  "Tizi Ouzou": { lat: 36.7118, lng: 4.0459, communes: ["Tizi Ouzou", "Azazga", "Draa Ben Khedda"], zones: ["ZI Oued Aïssi", "Zone d'Activité Freha"] },
  "Médéa": { lat: 36.2642, lng: 2.7539, communes: ["Médéa", "Berrouaghia", "Ksar El Boukhari"], zones: ["ZI Ksar El Boukhari", "ZI Médéa"] },
  "Biskra": { lat: 34.8500, lng: 5.7333, communes: ["Biskra", "Tolga", "Sidi Okba"], zones: ["ZI Biskra", "Zone d'Activité Tolga"] },
  "Tiaret": { lat: 35.3710, lng: 1.3166, communes: ["Tiaret", "Sougueur", "Frenda"], zones: ["ZI Zaaroura", "ZI Tiaret"] },
  "Chlef": { lat: 36.1647, lng: 1.3318, communes: ["Chlef", "Ténès", "Boukadir"], zones: ["ZI Oued Sly", "Zone d'Activité Ténès"] },
  "Sidi Bel Abbès": { lat: 35.1899, lng: -0.6308, communes: ["Sidi Bel Abbès", "Sfisef", "Telagh"], zones: ["ZI Route d'Oran", "Zone Industrielle Sidi Bel Abbès"] },
  "Guelma": { lat: 36.4621, lng: 7.4261, communes: ["Guelma", "Bouchegouf", "Oued Zenati"], zones: ["ZI Guelma", "Zone d'Activité Bouchegouf"] },
};

// Simple pseudo-random hash generator for fake coords per wilaya if missing
const getHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return hash;
};

export const getWilayaData = (wilayaName) => {
  if (!wilayaName) return null;
  const match = Object.keys(CUSTOM_DATA).find(k => k.toLowerCase() === wilayaName.toLowerCase());
  if (match) return { id: wilayaName, nom: wilayaName, ...CUSTOM_DATA[match] };
  
  // Predictable pseudorandom coordinates within Algeria bounds (approx 21-36 lat, -8-11 lng)
  const hash = Math.abs(getHash(wilayaName));
  const lat = 28 + (hash % 8) + ((hash % 100) / 100);
  const lng = -2 + (hash % 10) + ((hash % 100) / 100);

  return {
    id: wilayaName,
    nom: wilayaName,
    lat,
    lng,
    communes: [`Commune Centre de ${wilayaName}`, `Commune Périphérique A`, `Commune Périphérique B`],
    zones: [`Zone Industrielle Primaire ${wilayaName}`, `Zone d'activités tertiaires`]
  };
};

export const getAllWilayasData = () => {
  return WILAYAS.map(w => getWilayaData(w));
};
