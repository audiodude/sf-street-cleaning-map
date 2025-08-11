import Papa from 'papaparse';
import wellknown from 'wellknown';

export const loadStreetCleaningData = async () => {
  try {
    const response = await fetch('/Street_Sweeping_Schedule_20250810.csv');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        complete: (result) => {
          try {
            const processedData = result.data.map((row, index) => {
              if (!row.Line) return null;
              
              let geometry = null;
              try {
                geometry = wellknown.parse(row.Line);
              } catch (error) {
                console.warn(`Failed to parse WKT for row ${index}:`, error);
                return null;
              }
              
              return {
                id: row.BlockSweepID,
                cnn: row.CNN,
                corridor: row.Corridor,
                limits: row.Limits,
                blockSide: row.BlockSide,
                fullName: `${row.Corridor} (${row.Limits})`, // Use street name + limits
                scheduleDescription: row.FullName, // Keep original for reference
                weekDay: row.WeekDay,
                fromHour: parseInt(row.FromHour, 10),
                toHour: parseInt(row.ToHour, 10),
                week1: row.Week1 === '1',
                week2: row.Week2 === '1',
                week3: row.Week3 === '1',
                week4: row.Week4 === '1',
                week5: row.Week5 === '1',
                holidays: row.Holidays === '1',
                geometry: geometry,
                coordinates: geometry ? geometry.coordinates : null
              };
            }).filter(row => row !== null);
            
            resolve(processedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to load street cleaning data: ${error.message}`);
  }
};

export const filterDataByDay = (data, dayOfWeek) => {
  if (!dayOfWeek) return data;
  
  const dayMap = {
    'monday': 'Mon',
    'tuesday': 'Tues', 
    'wednesday': 'Wed',
    'thursday': 'Thu',
    'friday': 'Fri',
    'saturday': 'Sat',
    'sunday': 'Sun'
  };
  
  const targetDay = dayMap[dayOfWeek.toLowerCase()];
  return data.filter(item => item.weekDay === targetDay);
};

export const filterDataByWeek = (data, weekNumbers) => {
  if (!weekNumbers || weekNumbers.length === 0) return data;
  
  
  const filtered = data.filter(item => {
    return weekNumbers.some(weekNum => {
      let hasWeek = false;
      switch(weekNum) {
        case 1: hasWeek = item.week1; break;
        case 2: hasWeek = item.week2; break;
        case 3: hasWeek = item.week3; break;
        case 4: hasWeek = item.week4; break;
        case 5: hasWeek = item.week5; break;
        default: hasWeek = false;
      }
      if (hasWeek) {
      }
      return hasWeek;
    });
  });
  
  return filtered;
};

export const filterDataByTime = (data, startTime, endTime) => {
  if (startTime === undefined || endTime === undefined) return data;
  
  return data.filter(item => {
    return item.fromHour >= startTime && item.toHour <= endTime;
  });
};

export const getTodaysCleaningSchedule = (data, coordinates, streetName = null) => {
  const today = new Date();
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
  const currentWeek = Math.ceil(today.getDate() / 7);
  
  
  const todayData = filterDataByDay(data, currentDay);
  
  const thisWeekData = filterDataByWeek(todayData, [currentWeek]);
  
  // If we have a street name, prioritize street name filtering over proximity
  if (streetName && streetName.trim()) {
    const streetSegments = findSegmentsByStreetName(thisWeekData, streetName);
    if (streetSegments.length > 0) {
      return groupSimilarSegments(streetSegments.slice(0, 20));
    }
    // Fallback to proximity if no street name matches found
  }
  
  if (!coordinates) return groupSimilarSegments(thisWeekData.slice(0, 20));
  
  const nearbySegments = findNearbySegments(thisWeekData, coordinates, 0.001); // ~100 meters
  
  return groupSimilarSegments(nearbySegments.slice(0, 20));
};

export const groupSimilarSegments = (data) => {
  if (!data || data.length === 0) return [];
  
  // Group by corridor (street name) and time, with safe object creation
  const groups = {};
  
  data.forEach(segment => {
    const key = `${segment.corridor}-${segment.fromHour}-${segment.toHour}`;
    
    if (!groups[key]) {
      // Create a new clean object for the group
      groups[key] = {
        id: segment.id,
        cnn: segment.cnn,
        corridor: segment.corridor,
        blockSide: segment.blockSide,
        fullName: segment.fullName,
        weekDay: segment.weekDay,
        fromHour: segment.fromHour,
        toHour: segment.toHour,
        week1: segment.week1,
        week2: segment.week2,
        week3: segment.week3,
        week4: segment.week4,
        week5: segment.week5,
        holidays: segment.holidays,
        geometry: segment.geometry,
        coordinates: segment.coordinates,
        limits: segment.limits,
        count: 1,
        allLimits: [segment.limits]
      };
    } else {
      // Just update the count and limits
      groups[key].count += 1;
      groups[key].allLimits.push(segment.limits);
    }
  });
  
  // Convert to array and create display names
  return Object.values(groups).map(group => {
    const displayName = group.count > 1 
      ? `${group.corridor} (${group.count} blocks)`
      : group.fullName;
    
    const displayLimits = group.count > 1
      ? `Multiple blocks: ${group.allLimits.slice(0, 2).join('; ')}${group.allLimits.length > 2 ? '; +more' : ''}`
      : group.limits;
    
    return {
      id: group.id,
      cnn: group.cnn,
      corridor: group.corridor,
      blockSide: group.blockSide,
      fullName: displayName,
      weekDay: group.weekDay,
      fromHour: group.fromHour,
      toHour: group.toHour,
      week1: group.week1,
      week2: group.week2,
      week3: group.week3,
      week4: group.week4,
      week5: group.week5,
      holidays: group.holidays,
      geometry: group.geometry,
      coordinates: group.coordinates,
      limits: displayLimits
    };
  });
};

export const findNearbySegments = (data, coordinates, radiusInDegrees = 0.001) => {
  const [targetLng, targetLat] = coordinates;
  
  // Calculate distance for each segment and filter by radius
  const segmentsWithDistance = data
    .map(item => {
      if (!item.coordinates) return null;
      
      // Find the minimum distance from the point to any coordinate in the segment
      const minDistance = Math.min(
        ...item.coordinates.map(coord => {
          const [lng, lat] = coord;
          return Math.sqrt(
            Math.pow(lng - targetLng, 2) + Math.pow(lat - targetLat, 2)
          );
        })
      );
      
      if (minDistance <= radiusInDegrees) {
        return { ...item, distance: minDistance };
      }
      return null;
    })
    .filter(item => item !== null);
  
  // Sort by distance (closest first) and limit results
  return segmentsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10); // Only return the 10 closest segments
};

export const findSegmentsByStreetName = (data, streetName) => {
  if (!streetName || !streetName.trim()) return [];
  
  const searchTerm = streetName.trim().toLowerCase();
  
  // Extract potential street name from search term
  // Handle common patterns like "123 Main St", "Main Street", "Main St"
  const streetPatterns = [
    // Remove house numbers (e.g., "123 Main St" -> "Main St")
    searchTerm.replace(/^\d+\s+/, ''),
    // Try with common abbreviations
    searchTerm.replace(/\bstreet\b/g, 'st'),
    searchTerm.replace(/\bavenue\b/g, 'ave'),
    searchTerm.replace(/\bboulevard\b/g, 'blvd'),
    searchTerm.replace(/\bdrive\b/g, 'dr'),
    searchTerm.replace(/\broad\b/g, 'rd'),
    // Try without abbreviations
    searchTerm.replace(/\bst\b/g, 'street'),
    searchTerm.replace(/\bave\b/g, 'avenue'),
    searchTerm.replace(/\bblvd\b/g, 'boulevard'),
    searchTerm.replace(/\bdr\b/g, 'drive'),
    searchTerm.replace(/\brd\b/g, 'road'),
  ];
  
  // Remove duplicates and empty strings
  const uniquePatterns = [...new Set(streetPatterns.filter(p => p.length > 0))];
  
  const matchingSegments = data.filter(segment => {
    if (!segment.corridor) return false;
    
    const corridorName = segment.corridor.toLowerCase();
    
    // Check if any of our street patterns match the corridor name
    return uniquePatterns.some(pattern => {
      // Exact match
      if (corridorName === pattern) return true;
      
      // Corridor contains the search pattern
      if (corridorName.includes(pattern)) return true;
      
      // Search pattern contains the corridor (for shorter corridor names)
      if (pattern.includes(corridorName) && corridorName.length > 3) return true;
      
      return false;
    });
  });
  
  // Sort by corridor name for consistent ordering
  return matchingSegments.sort((a, b) => a.corridor.localeCompare(b.corridor));
};

export const parseTimeToDisplay = (hour) => {
  if (hour < 12) {
    return hour === 0 ? '12:00 AM' : `${hour}:00 AM`;
  } else {
    return hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
  }
};