// Returns the questions in a random order and renumbers sortOrder from 1.
// The attempt snapshot stores this order, so it stays stable on refresh and in review.
export function shuffleAttemptQuestions<T extends { sortOrder: number }>(
  questions: T[],
  random: () => number = Math.random,
): T[] {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.map((question, index) => ({ ...question, sortOrder: index + 1 }));
}
