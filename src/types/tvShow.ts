export interface TvShow {
  "@key": string;
  "@assetType": "tvShows";
  "@lastTouchBy"?: string;
  "@lastTx"?: string;
  "@lastTxID"?: string;
  "@lastUpdated"?: string;
  title: string;
  description: string;
  recommendedAge?: number;
}

export interface SearchResponse<T> {
  result: T[];
  metadata: {
    bookmark: string;
    fetchedRecordsCount: number;
  };
}
