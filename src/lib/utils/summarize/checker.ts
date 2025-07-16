export function onlyDifferInNumber(a: string, b: string): boolean {
	const extractParts = (str: string) => str.split(/\d+(?:\.\d+)*/).filter(Boolean).join('').trim();
	const extractNumbers = (str: string) => str.match(/\d+(?:\.\d+)*/g) || [];

	const textA = extractParts(a);
	const textB = extractParts(b);

	if (textA !== textB) return false;

	const numsA = extractNumbers(a);
	const numsB = extractNumbers(b);

	if (numsA.length !== numsB.length) return false;

	return numsA.some((num, i) => num !== numsB[i]);
}
