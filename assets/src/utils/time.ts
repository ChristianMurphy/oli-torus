
export function secondsSinceEpoch() {
  const now = new Date();
  return Math.round(now.getTime() / 1000);
}

