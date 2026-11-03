import type { Item } from "../schema";

function metric(value: string | undefined, fallback: number) {
  const parsed = value?.trim() ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function commentCount(item: Item, localReplies = 0) {
  return (
    Math.max(item.comments.length, metric(item.meta.commentCount, 0)) +
    localReplies
  );
}

export function repostCount(item: Item) {
  return metric(item.meta.reposts, 0);
}

export function formatSocialCount(value: number) {
  return value >= 10000
    ? (value / 10000).toFixed(1).replace(/\.0$/, "") + "万"
    : String(value);
}
