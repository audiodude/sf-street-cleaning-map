import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parseTimeToDisplay } from '../utils/dataParser';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapController = ({ center, zoom, data }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 15);
    }
  }, [map, center, zoom]);

  // Fit bounds to show all segments when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      const bounds = L.latLngBounds();
      
      data.forEach(group => {
        // Handle grouped segments - get all individual segments
        const segmentsToCheck = group.segments || [group];
        
        segmentsToCheck.forEach(segment => {
          if (segment.coordinates && segment.coordinates.length > 0) {
            segment.coordinates.forEach(coord => {
              bounds.extend([coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
            });
          }
        });
      });
      
      // Add some padding and fit the bounds
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, data]);
  
  return null;
};

const Map = ({ 
  data = [], 
  searchResult = null, 
  selectedSegment = null,
  onSegmentClick = () => {} 
}) => {
  
  // San Francisco center coordinates
  const sfCenter = [37.7749, -122.4194];
  const mapCenter = searchResult ? [searchResult.lat, searchResult.lng] : sfCenter;
  
  const getLineColor = (segment) => {
    if (selectedSegment && selectedSegment.id === segment.id) {
      return '#dc2626'; // darker red for selected
    }
    
    // Use the isActive property if available (from search results)
    if (segment.hasOwnProperty('isActive')) {
      return segment.isActive ? '#ef4444' : '#22c55e'; // red for active, green for inactive
    }
    
    // Fallback to current time check for non-search data
    const now = new Date();
    const currentHour = now.getHours();
    const isActiveNow = currentHour >= segment.fromHour && currentHour < segment.toHour;
    
    if (isActiveNow) {
      return '#f59e0b'; // amber for currently active
    }
    
    return '#3b82f6'; // blue for default
  };
  
  const getLineWeight = (segment) => {
    if (selectedSegment && selectedSegment.id === segment.id) {
      return 6;
    }
    return 3;
  };
  
  return (
    <div className="h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="h-full w-full"
      >
        <MapController 
          center={searchResult ? [searchResult.lat, searchResult.lng] : null} 
          zoom={15} 
          data={data}
        />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render street segments */}
        {data.map((group, groupIndex) => {
          // Handle grouped segments - render all segments within each group
          const segmentsToRender = group.segments || [group];
          
          return segmentsToRender.map((segment, segmentIndex) => {
            if (!segment.coordinates || segment.coordinates.length === 0) {
              return null;
            }
            
            // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
            const positions = segment.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Use the group for color if it has isActive, otherwise use the segment
            const colorSource = group.hasOwnProperty('isActive') ? group : segment;
            const segmentColor = getLineColor(colorSource);
            
            return (
              <Polyline
                key={`${groupIndex}-${segment.id}-${segmentIndex}`} // Ensure unique keys
                positions={positions}
                color={segmentColor}
                weight={getLineWeight(segment)}
                opacity={0.9}
                eventHandlers={{
                  click: () => onSegmentClick(segment),
                }}
              >
                <Popup>
                  <div className="min-w-64">
                    <h3 className="font-semibold text-lg mb-2">{group.fullName}</h3>
                    {group.hasOwnProperty('isActive') && (
                      <div className={`mb-2 px-2 py-1 rounded text-sm font-medium ${
                        group.isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {group.isActive ? 'Street cleaning active at searched time' : 'No street cleaning at searched time'}
                      </div>
                    )}
                    <div className="space-y-1 text-sm">
                      <p><strong>Day:</strong> {segment.weekDay}</p>
                      <p><strong>Time:</strong> {parseTimeToDisplay(segment.fromHour)} - {parseTimeToDisplay(segment.toHour)}</p>
                      <p><strong>Side:</strong> {segment.blockSide}</p>
                      <p><strong>Limits:</strong> {segment.limits}</p>
                      {segment.distance && (
                        <p><strong>Distance:</strong> ~{Math.round(segment.distance * 111320)}m from search</p>
                      )}
                      {group.count > 1 && (
                        <p><strong>Grouped with:</strong> {group.sides.join(', ')} sides</p>
                      )}
                      <div className="mt-2">
                        <strong>Weeks:</strong>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(week => (
                            <span 
                              key={week}
                              className={`px-2 py-1 rounded text-xs ${
                                segment[`week${week}`] 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {week}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          });
        }).flat()}
        
        {/* Search result marker */}
        {searchResult && (
          <Marker position={[searchResult.lat, searchResult.lng]}>
            <Popup>
              <div>
                <h3 className="font-semibold">{searchResult.display_name}</h3>
                <p className="text-sm text-gray-600">Search Result</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default Map;