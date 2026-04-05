const EPISODE_PARAM_PATTERN = /^s(\d+)e(\d+)$/i;

export function buildEpisodeParam(seasonNumber: number, episodeNumber: number) {
  return `s${seasonNumber}e${episodeNumber}`;
}

/**
 * Parses an episode URL param in `s3e10` format.
 * Throws if the format is invalid — callers (route beforeLoad) let TanStack Router
 * catch the error and render the route's errorComponent.
 */
export function parseEpisodeParam(value: string) {
  const match = EPISODE_PARAM_PATTERN.exec(value);

  if (!match) {
    throw new Error('Episode URL must follow the "s3e10" format.');
  }

  const seasonNumber = Number(match[1]);
  const episodeNumber = Number(match[2]);

  return {
    episodeNumber,
    label: buildEpisodeParam(seasonNumber, episodeNumber).toUpperCase(),
    seasonNumber,
  };
}
