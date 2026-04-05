import type { TvShowReference } from "#/types/season";

export interface Watchlist {
  "@assetType": "watchlist";
  "@key": string;
  "@lastTouchBy"?: string;
  "@lastTx"?: string;
  "@lastTxID"?: string;
  "@lastUpdated"?: string;
  description?: string;
  title: string;
  tvShows?: TvShowReference[];
}
