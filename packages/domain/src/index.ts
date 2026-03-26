export const approveThreshold = 75;

export function isApproved(score: number) {
  return score >= approveThreshold;
}
