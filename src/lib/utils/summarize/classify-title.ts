import type { Tensor } from '@tensorflow/tfjs';
import { getClassifier, getModel } from './get-model';

export const CLASSIFIED_TITLE_KEYS_DICT = {
	valid_title: 'Valid Title',
	background_task: 'Background Task',
	meetings: 'Meetings',
	general_tasks: 'General Tasks',
	general_activities: 'General Activities',
	project_tasks: 'Project Tasks',
};

/**
 * Predefined categories for task classification.
 * These categories correspond to the indices returned by the classifyTasksTitles function.
 *
 * @see classifyTasksTitles
 */
export const CLASSIFIED_TITLES_KEYS = ['valid_title', 'background_task', 'meetings', 'general_tasks', 'general_activities', 'project_tasks'];

/**
 * Classifies task titles into predefined categories using a machine learning model.
 *
 * @param titles Array of task title strings to classify
 * @param onProgress Optional callback for progress updates during model loading
 * @returns An array of indices representing the predicted task types for each title.
 *          Indices correspond to the following categories:
 *          - 0: "valid_title" -> this means the title itself is valid for summarized task title
 *          - 1: "background_task"
 *          - 2: "meetings"
 *          - 3: "general_tasks"
 *          - 4: "general_activities"
 *          - 5: "project_tasks" -> if no valid_title, the tasks under this can be put at the top
 *
 * @see https://github.com/runm717123/task-tracker-models-dev for more details
 */
export async function classifyTasksTitles(titles: string[], onProgress?: (status: string) => void) {
	const embedModel = await getModel();
	const classifier = await getClassifier(onProgress);

	const embeddings = await embedModel.embed(titles);
	const predictions = classifier.predict(embeddings);

	const predictionTensor = predictions as Tensor;
	const predictionArray = (await predictionTensor.array()) as number[][];
	const predictedIndices = predictionArray.map((row) => row.indexOf(Math.max(...row)));

	return predictedIndices;
}

export async function clusterTitles(titles: string[], onProgress?: (status: string) => void): Promise<Record<string, string[]>> {
	const classified = await classifyTasksTitles(titles, onProgress);
	const clusters: Record<string, string[]> = {};
	for (let i = 0; i < titles.length; i++) {
		const key = CLASSIFIED_TITLES_KEYS[classified[i]];
		if (!clusters[key]) {
			clusters[key] = [];
		}
		clusters[key].push(titles[i]);
	}
	return clusters;
}
