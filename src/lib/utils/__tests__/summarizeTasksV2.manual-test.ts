import { summarizeTasksV2, summarizeTasksV2Sync, formatSummaryForDisplay } from '../summarizeTasksV2';

// Example data based on user's requirements
const mockTasks: ITrackedTask[] = [
	{
		id: '1',
		title: 'Sprint 10',
		description: 'works on xxx\nhttps://xxx',
		status: 'done',
		createdAt: '2025-07-14T09:00:00Z',
		start: '2025-07-14T09:00:00Z',
		end: '2025-07-14T10:00:00Z'
	},
	{
		id: '2', 
		title: 'Sprint 10',
		description: 'works on yyy\nhttps://yyy',
		status: 'done',
		createdAt: '2025-07-14T10:00:00Z',
		start: '2025-07-14T10:00:00Z',
		end: '2025-07-14T11:00:00Z'
	},
	{
		id: '3',
		title: 'Sprint 10',
		description: 'review pr, self-explore, .etc',
		status: 'done',
		createdAt: '2025-07-14T11:00:00Z',
		start: '2025-07-14T11:00:00Z',
		end: '2025-07-14T12:00:00Z'
	},
	{
		id: '4',
		title: 'Sprint 10',
		description: 'research and found issue xxx',
		status: 'done',
		createdAt: '2025-07-14T12:00:00Z',
		start: '2025-07-14T12:00:00Z',
		end: '2025-07-14T13:00:00Z'
	},
	{
		id: '5',
		title: 'Sprint 10', 
		description: '- review pr\n- self-explore\n- .etc',
		status: 'done',
		createdAt: '2025-07-14T13:00:00Z',
		start: '2025-07-14T13:00:00Z',
		end: '2025-07-14T14:00:00Z'
	},
	{
		id: '6',
		title: 'Sprint 11',
		description: '-works on zzz\n- https://zzz',
		status: 'done',
		createdAt: '2025-07-14T14:00:00Z',
		start: '2025-07-14T14:00:00Z',
		end: '2025-07-14T15:00:00Z'
	},
	{
		id: '7',
		title: 'Break',
		description: 'lunch break',
		status: 'done',
		createdAt: '2025-07-14T15:00:00Z',
		start: '2025-07-14T15:00:00Z',
		end: '2025-07-14T16:00:00Z'
	},
	{
		id: '8',
		title: 'English class',
		description: 'learning english',
		status: 'done',
		createdAt: '2025-07-14T16:00:00Z',
		start: '2025-07-14T16:00:00Z',
		end: '2025-07-14T17:00:00Z'
	},
	{
		id: '9',
		title: '',
		description: 'issue research, and found issue xxx',
		status: 'done',
		createdAt: '2025-07-14T17:00:00Z',
		start: '2025-07-14T17:00:00Z',
		end: '2025-07-14T18:00:00Z'
	}
];

console.log('Testing summarizeTasksV2 with ITrackedTask array:');

// Test with the new async function
summarizeTasksV2(mockTasks).then(result => {
	console.log('Async result:', JSON.stringify(result, null, 2));
	console.log('\nFormatted for display:');
	console.log(formatSummaryForDisplay(result));
}).catch(error => {
	console.error('Error:', error);
	
	// Test fallback - should work even if ML fails
	console.log('Testing fallback behavior...');
	// This will trigger the fallback since we might not have the ML model in test environment
});

// Test with text input (backward compatibility)
const textInput = `#Sprint 10
works on xxx
https://xxx

#Sprint 10
works on yyy
https://yyy

#Sprint 10
review pr, self-explore, .etc

#Sprint 10
research and found issue xxx

#Sprint 10
- review pr
- self-explore
- .etc

#Sprint 11
-works on zzz
- https://zzz

# Break

# English class

#  
issue research, and found issue xxx`;

console.log('\nTesting synchronous text parsing:');
const syncResult = summarizeTasksV2Sync(textInput);
console.log('Sync result:', JSON.stringify(syncResult, null, 2));
console.log('\nFormatted for display:');
console.log(formatSummaryForDisplay(syncResult));
