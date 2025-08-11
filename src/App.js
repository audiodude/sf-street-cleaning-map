import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { 
  loadStreetCleaningData, 
  getTodaysCleaningSchedule
} from './utils/dataParser';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and location states
  const [searchResult, setSearchResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Store the original search query
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const streetData = await loadStreetCleaningData();
        setData(streetData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update today's schedule when search result or query changes
  useEffect(() => {
    if (searchResult && data.length > 0) {
      const coordinates = [searchResult.lng, searchResult.lat];
      // Pass both coordinates and the street name from search query
      const todayData = getTodaysCleaningSchedule(data, coordinates, searchQuery);
      setTodaySchedule(todayData);
    } else {
      setTodaySchedule([]);
    }
  }, [searchResult, data, searchQuery]);

  const handleSearch = async (address) => {
    setSearchLoading(true);
    setError(null);
    setSearchQuery(address); // Store the original search query
    
    try {
      // Using Nominatim (OpenStreetMap) for geocoding - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', San Francisco, CA')}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const results = await response.json();
      
      if (results && results.length > 0) {
        const result = results[0];
        setSearchResult({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          display_name: result.display_name
        });
      } else {
        setError('Address not found in San Francisco');
        setSearchResult(null);
      }
    } catch (err) {
      setError(`Search failed: ${err.message}`);
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    setError(null);
    setSearchQuery(''); // Clear search query when using current location

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSearchResult({
          lat: latitude,
          lng: longitude,
          display_name: 'Your current location'
        });
        setLocationLoading(false);
      },
      (err) => {
        setError(`Location access failed: ${err.message}`);
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };


  const handleSegmentClick = (segment) => {
    setSelectedSegment(segment);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading street cleaning data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-96 flex-shrink-0">
        <Sidebar
          onSearch={handleSearch}
          onCurrentLocation={handleCurrentLocation}
          searchLoading={searchLoading}
          locationLoading={locationLoading}
          searchResult={searchResult}
          todaySchedule={todaySchedule}
          allData={data}
        />
      </div>
      
      {/* Main Map Area */}
      <div className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-10">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        
        <Map 
          data={data}
          searchResult={searchResult}
          selectedSegment={selectedSegment}
          onSegmentClick={handleSegmentClick}
        />
      </div>
    </div>
  );
}

export default App;
