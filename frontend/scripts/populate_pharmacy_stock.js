const axios = require('axios');

// Base API URL (adjust if needed)
const API_URL = 'http://localhost:5000/api';

// Admin credentials – update if different
const ADMIN_CRED = { email: 'admin@example.com', password: 'admin' };

// Sample stock items – adjust fields to match your backend model
const stockItems = [
  { name: 'Cisplatin', dosage: '50mg', quantity: 100, unit: 'boxes', price: 120 },
  { name: 'Paclitaxel', dosage: '100mg', quantity: 80, unit: 'vials', price: 250 },
  { name: 'Doxorubicin', dosage: '20mg', quantity: 150, unit: 'vials', price: 90 },
  { name: 'Etoposide', dosage: '100mg', quantity: 120, unit: 'boxes', price: 130 },
  { name: 'Methotrexate', dosage: '10mg', quantity: 200, unit: 'vials', price: 70 }
];

async function getToken() {
  try {
    const resp = await axios.post(`${API_URL}/auth/login`, ADMIN_CRED);
    return resp.data.token || resp.data.accessToken || resp.data.access_token;
  } catch (e) {
    console.error('Login failed:', e.response ? e.response.data : e.message);
    process.exit(1);
  }
}

async function populate() {
  const token = await getToken();
  const api = axios.create({
    baseURL: `${API_URL}/pharmacie/stock`,
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log(`Creating ${stockItems.length} pharmacy stock records...`);
  for (const item of stockItems) {
    try {
      const resp = await api.post('', item);
      console.log('Created:', resp.data);
    } catch (err) {
      console.error('Failed to create stock item', item, err.response ? err.response.data : err.message);
    }
  }
}

populate();
