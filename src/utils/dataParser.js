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
    .slice(0, 50); // Return more segments for parking context
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
  // Handle decimal hours by flooring to get the whole hour
  const wholeHour = Math.floor(hour);
  
  if (wholeHour < 12) {
    return wholeHour === 0 ? '12:00 AM' : `${wholeHour}:00 AM`;
  } else {
    return wholeHour === 12 ? '12:00 PM' : `${wholeHour - 12}:00 PM`;
  }
};

export const isSegmentActiveAtDateTime = (segment, targetDate, targetHour) => {
  if (!segment || !targetDate || targetHour === undefined) return false;
  
  // Fix date parsing by treating as local date, not UTC
  const [year, month, day] = targetDate.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  
  // Check if the day matches
  const dayMap = {
    'Monday': 'Mon',
    'Tuesday': 'Tues', 
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };
  
  const targetDay = dayMap[dayOfWeek];
  const dayMatches = segment.weekDay === targetDay;
  
  // Check if the week matches
  const weekMatches = 
    (weekOfMonth === 1 && segment.week1) ||
    (weekOfMonth === 2 && segment.week2) ||
    (weekOfMonth === 3 && segment.week3) ||
    (weekOfMonth === 4 && segment.week4) ||
    (weekOfMonth === 5 && segment.week5);
  
  // Check if the time is within the cleaning hours
  // Convert targetHour to just the hour part for comparison since segment times are in whole hours
  const targetHourWhole = Math.floor(targetHour);
  const timeMatches = targetHourWhole >= segment.fromHour && targetHourWhole < segment.toHour;
  
  
  return dayMatches && weekMatches && timeMatches;
};

export const groupSegmentsByStatus = (segments) => {
  const groups = {};
  
  segments.forEach(segment => {
    // Create a key based on corridor, limits, and active status
    const key = `${segment.corridor}|${segment.limits}|${segment.isActive}`;
    
    if (!groups[key]) {
      groups[key] = {
        ...segment, // Use the first segment as the base
        sides: [segment.blockSide],
        segments: [segment], // Keep track of all segments in this group
        count: 1
      };
    } else {
      // Add this segment's side to the group
      if (!groups[key].sides.includes(segment.blockSide)) {
        groups[key].sides.push(segment.blockSide);
      }
      groups[key].segments.push(segment);
      groups[key].count += 1;
    }
  });
  
  // Convert to array and update display names
  return Object.values(groups).map(group => {
    let displayName = `${group.corridor} (${group.limits})`;
    
    // If multiple sides with same status, show the sides
    if (group.count > 1 && group.sides.length > 1) {
      const sideLabels = group.sides.map(side => {
        // Map blockSide to shorter labels
        const sideMap = {
          'North': 'N side',
          'South': 'S side', 
          'East': 'E side',
          'West': 'W side',
          'NorthEast': 'NE side',
          'NorthWest': 'NW side',
          'SouthEast': 'SE side',
          'SouthWest': 'SW side'
        };
        return sideMap[side] || side;
      }).join('/');
      
      displayName += ` [${sideLabels}]`;
    }
    
    return {
      ...group,
      fullName: displayName,
      originalFullName: `${group.corridor} (${group.limits})`
    };
  });
};

export const searchStreetCleaningByDateTime = (data, coordinates, streetName, targetDate, targetHour) => {
  if (!data || !coordinates || !targetDate || targetHour === undefined) return [];
  
  let segments = [];
  
  // First try to find by street name if provided
  if (streetName && streetName.trim()) {
    segments = findSegmentsByStreetName(data, streetName);
  }
  
  // If no street name matches or no street name provided, use proximity
  if (segments.length === 0) {
    segments = findNearbySegments(data, coordinates, 0.008); // Much larger radius for parking planning (~880 meters)
  } else {
    // Even if we found segments by street name, also add nearby segments for parking context
    const nearbySegments = findNearbySegments(data, coordinates, 0.008);
    
    // Combine and deduplicate by segment ID
    const existingIds = new Set(segments.map(s => s.id));
    const additionalSegments = nearbySegments.filter(s => !existingIds.has(s.id));
    segments = [...segments, ...additionalSegments];
  }
  
  // Add activity status to each segment
  const segmentsWithStatus = segments.map(segment => ({
    ...segment,
    isActive: isSegmentActiveAtDateTime(segment, targetDate, targetHour)
  }));
  
  // Group segments by status
  const groupedSegments = groupSegmentsByStatus(segmentsWithStatus);
  
  // Sort by activity status (active segments first) then by distance if available
  return groupedSegments.sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return b.isActive - a.isActive; // Active segments first
    }
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance; // Then by distance
    }
    return 0;
  });
};