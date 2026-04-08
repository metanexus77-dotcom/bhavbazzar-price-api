const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Google Sheet ID - BhavBazzar Price Database
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1e8YHLK8_xg4t58WDrMAIQxhYBqls--7T_g9tUbRr8oY';

// Sheet Names
const SHEETS = [
  'RE - ROLLING SCRAP',
  'HEAVY MELTING SCRAP',
  'LIGHT MELTING SCRAP',
  'MELTING SCRAP',
  'STAINLESS STEEL SCRAP',
  'ALUMINIUM SCRAP',
  'COPPER SCRAP',
  'PET SCRAP'
];

// Green Box Columns (0-indexed positions)
// CATEGORY, MATERIAL FAMILY, MATERIAL TYPE, PRODUCT NAME, GRADE, DIMENSIONS, FORM, Location, Price
const GREEN_COLUMNS = {
  CATEGORY: 2,
  MATERIAL_FAMILY: 3,
  MATERIAL_TYPE: 4,
  PRODUCT_NAME: 5,
  GRADE: 6,
  DIMENSIONS: 7,
  FORM: 8,
  LOCATION: 9,
  PRICE: 10
};

// Google Auth Setup
async function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  return auth.getClient();
}

// Fetch data from a specific sheet
async function getSheetData(sheetName) {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A:N`
    });
    
    return response.data.values || [];
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error.message);
    return [];
  }
}

// Parse row to object (only green columns)
function parseRow(row) {
  return {
    category: (row[GREEN_COLUMNS.CATEGORY] || '').trim(),
    material_family: (row[GREEN_COLUMNS.MATERIAL_FAMILY] || '').trim(),
    material_type: (row[GREEN_COLUMNS.MATERIAL_TYPE] || '').trim(),
    product_name: (row[GREEN_COLUMNS.PRODUCT_NAME] || '').trim(),
    grade: (row[GREEN_COLUMNS.GRADE] || '').trim(),
    dimensions: (row[GREEN_COLUMNS.DIMENSIONS] || '').trim(),
    form: (row[GREEN_COLUMNS.FORM] || '').trim(),
    location: (row[GREEN_COLUMNS.LOCATION] || '').trim(),
    price: row[GREEN_COLUMNS.PRICE] || null
  };
}

// Search endpoint - Main API
app.get('/market-prices/search', async (req, res) => {
  try {
    const { 
      location, 
      product, 
      grade, 
      dimensions, 
      form, 
      material_type,
      category,
      material_family,
      sheet 
    } = req.query;
    
    let results = [];
    
    // Determine which sheets to search
    let sheetsToSearch = SHEETS;
    if (sheet) {
      sheetsToSearch = SHEETS.filter(s => 
        s.toLowerCase().includes(sheet.toLowerCase())
      );
    }
    
    // Fetch data from all relevant sheets
    for (const sheetName of sheetsToSearch) {
      const data = await getSheetData(sheetName);
      
      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const row = parseRow(data[i]);
        
        // Apply filters
        let match = true;
        
        if (location && row.location.toLowerCase() !== location.toLowerCase()) {
          match = false;
        }
        if (product && !row.product_name.toLowerCase().includes(product.toLowerCase())) {
          match = false;
        }
        if (grade && !row.grade.toLowerCase().includes(grade.toLowerCase())) {
          match = false;
        }
        if (dimensions && !row.dimensions.toLowerCase().includes(dimensions.toLowerCase())) {
          match = false;
        }
        if (form && !row.form.toLowerCase().includes(form.toLowerCase())) {
          match = false;
        }
        if (material_type && !row.material_type.toLowerCase().includes(material_type.toLowerCase())) {
          match = false;
        }
        if (category && !row.category.toLowerCase().includes(category.toLowerCase())) {
          match = false;
        }
        if (material_family && !row.material_family.toLowerCase().includes(material_family.toLowerCase())) {
          match = false;
        }
        
        if (match && row.price) {
          row.sheet_name = sheetName;
          results.push(row);
        }
      }
    }
    
    res.json({
      status: results.length > 0 ? 'success' : 'no_data',
      count: results.length,
      data: results
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get all sheets list
app.get('/sheets', (req, res) => {
  res.json({ sheets: SHEETS });
});

// Get all locations
app.get('/locations', async (req, res) => {
  try {
    const locations = new Set();
    
    for (const sheetName of SHEETS) {
      const data = await getSheetData(sheetName);
      for (let i = 1; i < data.length; i++) {
        const location = (data[i][GREEN_COLUMNS.LOCATION] || '').trim();
        if (location) locations.add(location);
      }
    }
    
    res.json({ locations: Array.from(locations).sort() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = new Set();
    
    for (const sheetName of SHEETS) {
      const data = await getSheetData(sheetName);
      for (let i = 1; i < data.length; i++) {
        const product = (data[i][GREEN_COLUMNS.PRODUCT_NAME] || '').trim();
        if (product) products.add(product);
      }
    }
    
    res.json({ products: Array.from(products).sort() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'BhavBazzar Price API',
    version: '1.0.0'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BhavBazzar API running on port ${PORT}`);
});
