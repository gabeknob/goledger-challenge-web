import { api } from "#/lib/api";
import type { SearchResponse } from "#/types/tvShow";

export interface SearchAssetPage<T> {
  items: T[];
  nextBookmark?: string;
}

/**
 * Fetches a single page of assets from the GoLedger search endpoint.
 * Returns a `nextBookmark` when there are more pages to load.
 */
export async function searchAssetPage<T>({
  assetType,
  bookmark,
  limit,
  selector = {},
}: {
  assetType: string;
  bookmark?: string;
  limit: number;
  selector?: Record<string, unknown>;
}): Promise<SearchAssetPage<T>> {
  const { data } = await api.post<SearchResponse<T>>("/query/search", {
    query: {
      selector: {
        "@assetType": assetType,
        ...selector,
      },
      limit,
      ...(bookmark ? { bookmark } : {}),
    },
  });

  return {
    items: data.result,
    nextBookmark:
      data.result.length < limit || !data.metadata.bookmark ? undefined : data.metadata.bookmark,
  };
}

/**
 * Fetches all pages of assets by following bookmarks until exhausted.
 * Use for operations that need the full dataset (cascade plans, rename flows, etc.).
 */
export async function searchAllAssets<T>({
  assetType,
  limit = 200,
  selector = {},
}: {
  assetType: string;
  limit?: number;
  selector?: Record<string, unknown>;
}): Promise<T[]> {
  const items: T[] = [];
  let bookmark: string | undefined;

  do {
    const page = await searchAssetPage<T>({
      assetType,
      bookmark,
      limit,
      selector,
    });

    items.push(...page.items);
    bookmark = page.nextBookmark;
  } while (bookmark);

  return items;
}
