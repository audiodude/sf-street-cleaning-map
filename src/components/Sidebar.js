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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      onSearch(searchAddress.trim());
    }
  };

  const today = new Date();
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const todayDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="h-full bg-white shadow-lg overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          SF Street Cleaning
        </h1>

        {/* Today's Schedule */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Street Cleaning Today
          </h2>
          <p className="text-sm text-blue-700 mb-3">
            {todayName}, {todayDate}
          </p>
          
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.slice(0, 3).map((segment, index) => (
                <div key={segment.id || index} className="text-sm bg-white p-3 rounded border shadow-sm">
                  <div className="font-semibold text-blue-900">{segment.fullName}</div>
                  <div className="text-gray-700 font-medium">
                    {parseTimeToDisplay(segment.fromHour)} - {parseTimeToDisplay(segment.toHour)}
                    {(segment.fromHour < 6 || segment.toHour < 6) && (
                      <span className="text-xs text-amber-600 ml-2">⚠️ Early hours</span>
                    )}
                  </div>
                  {segment.limits && (
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {segment.limits}
                    </div>
                  )}
                  {segment.scheduleDescription && segment.scheduleDescription !== segment.corridor && (
                    <div className="text-xs text-blue-600 mt-1 italic">
                      Schedule: {segment.scheduleDescription}
                    </div>
                  )}
                  {segment.distance && (
                    <div className="text-xs text-green-600 mt-1">
                      📍 ~{Math.round(segment.distance * 111320)} meters from searched location
                    </div>
                  )}
                </div>
              ))}
              {todaySchedule.length > 3 && (
                <p className="text-sm text-blue-600 font-medium">
                  +{todaySchedule.length - 3} more street{todaySchedule.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-blue-700">
              {searchResult ? 'No street cleaning scheduled within 100 meters of this location today.' : 'Search for an address to see today\'s schedule.'}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Search</h3>
          <form onSubmit={handleSearch} className="space-y-3">
            <input
              type="text"
              placeholder="Enter an address in SF"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={searchLoading}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={searchLoading || !searchAddress.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={onCurrentLocation}
                disabled={locationLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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