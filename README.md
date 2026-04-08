# BhavBazzar Price API

Scrap market price fetcher API that reads from Google Sheets database.

## API Endpoints

### Search Prices
```
GET /market-prices/search?location=MANDI&product=HMS&grade=(80:20)
```

**Parameters (all optional):**
- `location` - City name (MANDI, ALANG, MUMBAI, etc.)
- `product` - Product name (HMS, SHIP BREAKING, etc.)
- `grade` - Grade ((80:20), STANDARD, etc.)
- `dimensions` - Size (4 ANI, 1 KG, etc.)
- `form` - Form (BALE, GRINDED, etc.)
- `sheet` - Specific sheet to search

### Other Endpoints
- `GET /` - Health check
- `GET /sheets` - List all sheets
- `GET /locations` - List all locations
- `GET /products` - List all products

## Environment Variables
- `GOOGLE_SHEET_ID` - Google Sheet ID
- `GOOGLE_CREDENTIALS` - Service Account JSON
- `PORT` - Server port (default: 3000)
