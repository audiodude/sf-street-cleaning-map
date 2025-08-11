# SF Street Cleaning Map

An interactive web application that helps San Francisco residents find street cleaning schedules in their area. Built with React and Leaflet, this app displays real-time street cleaning information on an interactive map.

## Features

- 🗺️ **Interactive Map**: View street cleaning schedules on a detailed San Francisco map
- 🔍 **Location Search**: Find street cleaning schedules for specific addresses
- 📍 **Current Location**: Get cleaning schedules for your current location
- 📅 **Today's Schedule**: Quick view of today's street cleaning in your area
- 🕒 **Time Filtering**: Filter schedules by time ranges
- 📊 **Smart Grouping**: Similar street segments are grouped for better readability
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, React Leaflet
- **Mapping**: Leaflet with OpenStreetMap tiles
- **Styling**: Tailwind CSS
- **Data Processing**: Papa Parse (CSV parsing), Wellknown (WKT geometry parsing)
- **Build Tool**: Create React App

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git LFS (for CSV data files)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sf-street-cleaning-map
```

2. Install dependencies:
```bash
npm install
```

3. Pull LFS files (required for street cleaning data):
```bash
git lfs pull
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view the app

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/
│   ├── Map.js          # Interactive Leaflet map component
│   └── Sidebar.js      # Search and filter sidebar
├── utils/
│   ├── dataParser.js   # CSV parsing and data filtering utilities
│   └── testGrouping.js # Test utilities for data grouping
├── App.js              # Main application component
└── index.js            # React entry point

public/
└── Street_Sweeping_Schedule_20250810.csv  # SF street cleaning data (Git LFS)
```

## Data Source

The app uses San Francisco's official street sweeping schedule data. The CSV file contains:
- Street segment geometries (WKT format)
- Cleaning schedules by day and time
- Week-of-month patterns (1st, 2nd, 3rd, 4th, 5th week)
- Street names and block information

## Key Features Explained

### Smart Grouping
Similar street segments with the same cleaning time are automatically grouped together. For example, multiple blocks of "Market St" cleaned at the same time will appear as "Market St (3 blocks)".

### Location-Based Search
- Click "Use My Location" to find nearby street cleaning schedules
- Search for specific addresses using the search bar
- Results are sorted by proximity to your location

### Time and Date Filtering
- View today's cleaning schedule automatically
- Filter by specific days of the week
- Filter by time ranges
- Week-of-month filtering (1st week, 2nd week, etc.)

## Git LFS Setup

This project uses Git LFS to store the large CSV data file. To work with the data:

```bash
# Install Git LFS (if not already installed)
git lfs install

# Track CSV files
git lfs track "*.csv"

# Pull LFS files
git lfs pull
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- San Francisco Open Data for providing street cleaning schedule data
- OpenStreetMap for map tiles
- React Leaflet community for mapping components