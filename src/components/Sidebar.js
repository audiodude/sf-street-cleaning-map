import React, { useState } from 'react';
import { parseTimeToDisplay } from '../utils/dataParser';

const Sidebar = ({
  onSearch,
  onFilter,
  onCurrentLocation,
  searchLoading = false,
  locationLoading = false,
  searchResult = null,
  todaySchedule = [],
  allData = []
}) => {
  const [searchAddress, setSearchAddress] = useState('');
  const [filters, setFilters] = useState({
    dayOfWeek: '',
    weeksOfMonth: [],
    timeStart: '',
    timeEnd: ''
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      onSearch(searchAddress.trim());
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleDayChange = (day) => {
    const newFilters = { ...filters, dayOfWeek: day };
    handleFilterChange(newFilters);
  };

  const handleWeekToggle = (weekNum) => {
    const currentWeeks = filters.weeksOfMonth;
    const newWeeks = currentWeeks.includes(weekNum)
      ? currentWeeks.filter(w => w !== weekNum)
      : [...currentWeeks, weekNum];
    
    const newFilters = { ...filters, weeksOfMonth: newWeeks };
    handleFilterChange(newFilters);
  };

  const handleTimeChange = (timeType, value) => {
    const newFilters = { ...filters, [timeType]: value };
    handleFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      dayOfWeek: '',
      weeksOfMonth: [],
      timeStart: '',
      timeEnd: ''
    };
    handleFilterChange(newFilters);
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

        {/* Filters */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>

          {/* Day of Week Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Day of Week
            </label>
            <select
              value={filters.dayOfWeek}
              onChange={(e) => handleDayChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Days</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>

          {/* Week of Month Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Week of Month
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map(week => (
                <button
                  key={week}
                  onClick={() => handleWeekToggle(week)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filters.weeksOfMonth.includes(week)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {week}
                </button>
              ))}
            </div>
          </div>

          {/* Time Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <select
                  value={filters.timeStart}
                  onChange={(e) => handleTimeChange('timeStart', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {parseTimeToDisplay(i)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <select
                  value={filters.timeEnd}
                  onChange={(e) => handleTimeChange('timeEnd', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {parseTimeToDisplay(i)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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