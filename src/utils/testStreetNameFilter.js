// Test the new street name filtering functionality
import { findSegmentsByStreetName } from './dataParser';

const testData = [
  { corridor: 'Market St', limits: 'Larkin St - Polk St' },
  { corridor: 'Market St', limits: 'Polk St - Van Ness Ave' },
  { corridor: 'Castro St', limits: '18th St - 19th St' },
  { corridor: 'Fillmore St', limits: 'Pine St - Bush St' },
  { corridor: 'Van Ness Ave', limits: 'Market St - Mission St' },
];

// Test various search patterns
const testQueries = [
  'Market St',
  'market street', 
  '123 Market St',
  'Castro',
  'fillmore street',
  'van ness ave',
  'Van Ness Avenue'
];

testQueries.forEach(query => {
  const results = findSegmentsByStreetName(testData, query);
  console.log(`Query: "${query}" -> Found ${results.length} results:`, 
    results.map(r => r.corridor));
});

export default testData;