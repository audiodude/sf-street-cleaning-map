// Test file to demonstrate grouping functionality
import { groupSimilarSegments } from './dataParser';

const testData = [
  {
    id: '1',
    corridor: 'Market St',
    fullName: 'Market St Block 1',
    fromHour: 8,
    toHour: 10,
    limits: 'Larkin St - Polk St',
    weekDay: 'Mon'
  },
  {
    id: '2',
    corridor: 'Market St',
    fullName: 'Market St Block 2',
    fromHour: 8,
    toHour: 10,
    limits: 'Polk St - Van Ness Ave',
    weekDay: 'Mon'
  },
  {
    id: '3',
    corridor: 'Market St',
    fullName: 'Market St Block 3',
    fromHour: 8,
    toHour: 10,
    limits: 'Van Ness Ave - Gough St',
    weekDay: 'Mon'
  },
  {
    id: '4',
    corridor: 'Castro St',
    fullName: 'Castro St Block 1',
    fromHour: 9,
    toHour: 11,
    limits: '18th St - 19th St',
    weekDay: 'Tue'
  }
];

// This would group the 3 Market St segments into 1 entry: "Market St (3 blocks)"
// And keep Castro St as "Castro St Block 1" since it's unique
const grouped = groupSimilarSegments(testData);

export default testData;