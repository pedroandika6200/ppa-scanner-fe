import { ref, shallowRef, type Ref } from 'vue';

interface SelectCacheItem<R> {
  options: Ref<R[]>;
  loading: Ref<boolean>;
  promise: Promise<void> | null;
  abortController: AbortController | null;
  subscribers: number;
}

const selectCache = new Map<string, SelectCacheItem<unknown>>();

function stableStringify(value: unknown): string {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((v) => stableStringify(v))
      .join(',')}]`;
  }

  const obj = value as Record<string, unknown>;

  return `{${Object.keys(obj)
    .sort()
    .map(
      (key) =>
        `"${key}":${stableStringify(obj[key])}`
    )
    .join(',')}}`;
}

export const getCacheKey = (
  url: string,
  params: Record<string, unknown>
) => {
  return `${url}::${stableStringify(params)}`;
};

export function getOrCreateCache<R>(
  key: string
): SelectCacheItem<R> {
  if (!selectCache.has(key)) {
    selectCache.set(key, {
      options: shallowRef<R[]>([]),
      loading: ref(false),
      promise: null,
      abortController: null,
      subscribers: 0,
    });
  }

  return selectCache.get(
    key
  ) as SelectCacheItem<R>;
}

export function removeCache(key: string) {
  selectCache.delete(key);
}
