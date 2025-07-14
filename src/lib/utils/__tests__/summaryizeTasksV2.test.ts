import { describe, it, expect } from 'vitest';
import { summarizeTasksV2 } from '../summaryizeTasks';

// Simple test - let's just run the function and log the output for now
describe('summarizeTasksV2', () => {
	it('should parse and group task descriptions correctly', () => {
		// Test data based on your example
		const testTasks: ITrackedTask[] = [
			{
				id: '1',
				title: 'Sprint Work',
				description: `#Sprint 10
works on xxx
https://xxx`,
				status: 'done',
				createdAt: '2025-07-13T08:00:00Z',
				start: '2025-07-13T08:30:00Z',
				end: '2025-07-13T10:00:00Z',
			},
			{
				id: '2',
				title: 'More Sprint Work', 
				description: `#Sprint 10
works on yyy
https://yyy`,
				status: 'done',
				createdAt: '2025-07-13T10:15:00Z',
				start: '2025-07-13T10:30:00Z',
				end: '2025-07-13T12:00:00Z',
			},
			{
				id: '3',
				title: 'Sprint Tasks',
				description: `#Sprint 10
review pr, self-explore, .etc`,
				status: 'done',
				createdAt: '2025-07-13T13:00:00Z',
				start: '2025-07-13T13:15:00Z',
				end: '2025-07-13T14:30:00Z',
			},
			{
				id: '4',
				title: 'Research',
				description: `#Sprint 10
research and found issue xxx`,
				status: 'done',
				createdAt: '2025-07-13T14:45:00Z',
				start: '2025-07-13T15:00:00Z',
				end: '2025-07-13T16:30:00Z',
			},
			{
				id: '5',
				title: 'Multi-task Sprint',
				description: `#Sprint 10
- review pr
- self-explore
- .etc`,
				status: 'done',
				createdAt: '2025-07-13T16:45:00Z',
				start: '2025-07-13T17:00:00Z',
				end: '2025-07-13T18:00:00Z',
			},
			{
				id: '6',
				title: 'New Sprint',
				description: `#Sprint 11
-works on zzz
- https://zzz`,
				status: 'done',
				createdAt: '2025-07-13T09:00:00Z',
				start: '2025-07-13T09:15:00Z',
				end: '2025-07-13T11:00:00Z',
			},
			{
				id: '7',
				title: 'Break Time',
				description: `# Break`,
				status: 'done',
				createdAt: '2025-07-13T12:00:00Z',
				start: '2025-07-13T12:15:00Z',
				end: '2025-07-13T13:00:00Z',
			},
			{
				id: '8',
				title: 'Learning',
				description: `# English class`,
				status: 'done',
				createdAt: '2025-07-13T18:30:00Z',
				start: '2025-07-13T18:45:00Z',
				end: '2025-07-13T19:30:00Z',
			},
			{
				id: '9',
				title: 'Research Issue',
				description: `#  
issue research, and found issue xxx`,
				status: 'done',
				createdAt: '2025-07-13T19:45:00Z',
				start: '2025-07-13T20:00:00Z',
				end: '2025-07-13T21:00:00Z',
			},
		];

		const result = summarizeTasksV2(testTasks);
		
		// Basic checks
		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		
		// Check that non-work activities are filtered out
		const titles = result.map(g => g.title);
		expect(titles).not.toContain('Break');
		expect(titles).not.toContain('English class');
		
		// Should have work-related groups
		expect(titles).toContain('Sprint 10');
		expect(titles).toContain('Sprint 11');
		
		// Log for manual verification
		console.log('\n=== Test Result ===');
		result.forEach(group => {
			console.log(`# ${group.title}`);
			group.tasks.forEach(task => {
				console.log(`- ${task}`);
			});
			console.log('');
		});
	});
});