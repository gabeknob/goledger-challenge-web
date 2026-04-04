import type { SeasonReference } from "#/types/season";

export interface Episode {
  "@assetType": "episodes";
  "@key": string;
  "@lastTouchBy"?: string;
  "@lastTx"?: string;
  "@lastTxID"?: string;
  "@lastUpdated"?: string;
  season: SeasonReference;
  episodeNumber: number;
  title: string;
  releaseDate: string;
  description: string;
  rating?: number;
}
