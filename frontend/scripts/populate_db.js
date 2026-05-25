const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');

// Path to the Excel file containing test patients (located in the project root)
const FILE_PATH = path.resolve(__dirname, '..', 'patients_test.xlsx');
// Adjust the API endpoint if your backend runs on a different port or URL
const API_URL = 'http://localhost:5000/api/patients';

async function importPatients() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error('Excel file not found at', FILE_PATH);
    process.exit(1);
  }

  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Found ${rows.length} patient records`);

  for (const row of rows) {
    try {
      const resp = await axios.post(API_URL, row);
      console.log('Created patient with id', resp.data.id);
    } catch (err) {
      console.error('Failed to create patient:', row, err.response ? err.response.data : err.message);
    }
  }
}

importPatients();
