export interface SeasonReference {
  "@assetType": "seasons";
  "@key": string;
}

export interface TvShowReference {
  "@assetType": "tvShows";
  "@key": string;
}

export interface Season {
  "@assetType": "seasons";
  "@key": string;
  "@lastTouchBy"?: string;
  "@lastTx"?: string;
  "@lastTxID"?: string;
  "@lastUpdated"?: string;
  number: number;
  tvShow: TvShowReference;
  year: number;
}
