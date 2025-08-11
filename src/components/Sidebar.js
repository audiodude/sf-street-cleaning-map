import React, { useState } from 'react';
import { parseTimeToDisplay } from '../utils/dataParser';

const Sidebar = ({
  onSearch,
  onCurrentLocation,
  searchLoading = false,
  locationLoading = false,
  searchResult = null,
  todaySchedule = [],
  allData = []
}) => {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchAddress.trim() && selectedDate && selectedTime !== '') {
      onSearch({
        address: searchAddress.trim(),
        date: selectedDate,
        time: parseInt(selectedTime, 10)
      });
    }
  };


  return (
    <div className="h-full bg-white shadow-lg overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          SF Street Cleaning
        </h1>

        {/* Color Legend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Map Legend
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Street cleaning at selected time</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">No street cleaning at selected time</span>
            </div>
          </div>
          {searchResult && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing street segments near your search location
              </p>
            </div>
          )}
        </div>

        {/* Search Results */}
        {todaySchedule.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Street Segments Found
            </h2>
            
            <div className="space-y-2">
              {todaySchedule.slice(0, 8).map((segment, index) => (
                <div key={segment.id || index} className="text-sm bg-white p-3 rounded border shadow-sm">
                  <div className="font-semibold text-blue-900">{segment.fullName}</div>
                  <div className="text-gray-700 font-medium">
                    Cleaning: {parseTimeToDisplay(segment.fromHour)} - {parseTimeToDisplay(segment.toHour)}
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      segment.isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {segment.isActive ? 'Active' : 'Clear'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {segment.weekDay} • {segment.limits}
                  </div>
                  {segment.distance && (
                    <div className="text-xs text-gray-600 mt-1">
                      📍 ~{Math.round(segment.distance * 111320)}m away
                    </div>
                  )}
                </div>
              ))}
              {todaySchedule.length > 8 && (
                <p className="text-sm text-blue-600 font-medium">
                  +{todaySchedule.length - 8} more segments shown on map
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Street Cleaning</h3>
          <form onSubmit={handleSearch} className="space-y-3">
            <input
              type="text"
              placeholder="Enter an address in SF"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={searchLoading}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={searchLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={searchLoading}
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {parseTimeToDisplay(i)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={searchLoading || !searchAddress.trim() || !selectedDate || selectedTime === ''}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={onCurrentLocation}
                disabled={locationLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Use current location"
              >
                {locationLoading ? '...' : '📍'}
              </button>
            </div>
          </form>
          
          {searchResult && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">Found:</p>
              <p className="text-sm text-gray-600">{searchResult.display_name}</p>
            </div>
          )}
        </div>


        {/* Data Stats */}
        <div className="text-sm text-gray-600">
          <p>Showing {allData.length} street segments</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;