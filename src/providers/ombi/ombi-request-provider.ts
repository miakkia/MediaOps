import type {
  RequestMediaType, RequestProvider, RequestProviderCapabilities, RequestSearchResult,
  RequestSeriesLifecycleStatus, RequestStatus, RequestSubmissionResult,
} from '../request-provider.js';
import { OmbiClient } from './ombi-client.js';
import type {
  OmbiMultiSearchResult, OmbiNotificationPreference, OmbiRequestResponse,
  OmbiSearchMovieResult, OmbiTvRequestPayload, OmbiTvSearchDetail, OmbiUser,
} from './ombi-types.js';

function parseYear(value: string | number | null | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return Number.isInteger(value) && value > 0 ? value : undefined;
  const match = value.trim().match(/\b(\d{4})\b/);
  if (!match?.[1]) return undefined;
  const year = Number.parseInt(match[1], 10);
  return Number.isFinite(year) ? year : undefined;
}

function parseSeriesStatus(value: string | null | undefined): RequestSeriesLifecycleStatus | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'ended' || normalized === 'canceled' || normalized === 'cancelled') {
    return 'ended';
  }
  if (
    normalized === 'returning series' ||
    normalized === 'continuing' ||
    normalized === 'in production' ||
    normalized === 'planned'
  ) {
    return 'continuing';
  }
  return undefined;
}

function mapMovie(item: OmbiSearchMovieResult): RequestSearchResult | undefined {
  if (item.id === undefined || !item.title) return undefined;
  return {
    providerId: String(item.id), mediaType: 'movie', title: item.title,
    originalTitle: item.originalTitle, year: parseYear(item.releaseDate), overview: item.overview,
    posterUrl: item.posterPath,
    status: item.available ? 'available' : item.requested ? 'requested' : 'unavailable',
    requested: item.requested ?? false, available: item.available ?? false,
  };
}

function mapSeries(item: OmbiMultiSearchResult, detail?: OmbiTvSearchDetail): RequestSearchResult | undefined {
  if (!item.id || !item.title || item.mediaType?.toLowerCase() !== 'tv') return undefined;
  const titleMatch = item.title.match(/^(.*?)(?:\s+\((\d{4})\))?$/);
  const title = titleMatch?.[1]?.trim() || item.title;
  const year = parseYear(detail?.firstAired) ?? parseYear(item.firstAirDate) ?? parseYear(item.firstAired) ??
    parseYear(item.releaseDate) ?? parseYear(item.year) ?? parseYear(titleMatch?.[2]);
  const available = detail?.available ?? detail?.fullyAvailable ?? false;
  const requested = detail?.requested ?? false;
  return {
    providerId: item.id, mediaType: 'series', title, originalTitle: undefined, year,
    overview: item.overview ?? undefined, posterUrl: item.poster ?? undefined,
    seriesStatus: parseSeriesStatus(detail?.status),
    status: available ? 'available' : requested ? 'requested' : 'unavailable',
    requested, available,
  };
}

export class OmbiRequestProvider implements RequestProvider {
  readonly name = 'Ombi';
  private readonly discordUserCache = new Map<string, { userName: string; expiresAt: number }>();
  private readonly discordUserCacheTtlMs = 5 * 60 * 1000;

  constructor(private readonly client: OmbiClient) {}

  async healthCheck(): Promise<void> { await this.client.get<unknown>('/api/v1/Status'); }

  async getCapabilities(): Promise<RequestProviderCapabilities> {
    return {
      movies: true,
      series: true,
      requestStatus: false,
      autoApproval: false,
    };
  }

  async search(query: string, mediaType: RequestMediaType): Promise<RequestSearchResult[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];
    if (mediaType === 'movie') {
      const results = await this.client.get<OmbiSearchMovieResult[]>(`/api/v1/Search/movie/${encodeURIComponent(normalizedQuery)}`);
      return results.map(mapMovie).filter((item): item is RequestSearchResult => item !== undefined);
    }
    const results = await this.client.post<OmbiMultiSearchResult[]>(
      `/api/v2/Search/multi/${encodeURIComponent(normalizedQuery)}`,
      { movies: false, tvShows: true, music: false, people: false },
    );
    const tvResults = results.filter(item => item.id && item.title && item.mediaType?.toLowerCase() === 'tv');
    const enriched = await Promise.all(tvResults.map(async item => {
      const tvId = Number.parseInt(item.id, 10);
      if (!Number.isInteger(tvId) || tvId <= 0) return mapSeries(item);
      try {
        const detail = await this.client.get<OmbiTvSearchDetail>(`/api/v2/Search/tv/moviedb/${tvId}`);
        return mapSeries(item, detail);
      } catch (error) {
        console.warn(`Unable to enrich Ombi TV search result ${item.id}:`, error);
        return mapSeries(item);
      }
    }));
    return enriched.filter((item): item is RequestSearchResult => item !== undefined);
  }

  private async resolveOmbiUserNameForDiscord(discordUserId: string): Promise<string | undefined> {
    const now = Date.now();
    const cached = this.discordUserCache.get(discordUserId);
    if (cached && cached.expiresAt > now) return cached.userName;
    const users = await this.client.get<OmbiUser[]>('/api/v1/Identity/Users');
    for (const user of users) {
      if (!user.id || !user.userName) continue;
      let preferences: OmbiNotificationPreference[];
      try {
        preferences = await this.client.get<OmbiNotificationPreference[]>(
          '/api/v1/Identity/notificationpreferences/' + encodeURIComponent(user.id), { userName: user.userName },
        );
      } catch (error) {
        console.warn(`Unable to inspect Ombi notification preferences for ${user.userName}:`, error);
        continue;
      }
      const discordPreference = preferences.find(preference =>
        preference.agent === 1 && preference.value?.trim() === discordUserId);
      if (!discordPreference) continue;
      this.discordUserCache.set(discordUserId, { userName: user.userName, expiresAt: now + this.discordUserCacheTtlMs });
      return user.userName;
    }
    return undefined;
  }

  async request(
    item: RequestSearchResult,
    options?: {
      requester?: {
        source: 'discord';
        id: string;
      };
    },
  ): Promise<RequestSubmissionResult> {
    if (item.available) {
      return {
        success: false,
        providerRequestId: undefined,
        status: 'available',
        message: 'This media is already available.',
      };
    }

    if (item.requested) {
      return {
        success: false,
        providerRequestId: undefined,
        status: 'requested',
        message: 'This media has already been requested.',
      };
    }

    let ombiUserName: string | undefined;
    if (options?.requester?.source === 'discord') {
      ombiUserName = await this.resolveOmbiUserNameForDiscord(options.requester.id);
      if (!ombiUserName) {
        return {
          success: false,
          providerRequestId: undefined,
          status: 'unknown',
          message: 'Your Discord account is not mapped to an Ombi user. The request was not submitted so requester ownership is not lost.',
        };
      }
    }

    const userOptions = ombiUserName ? { userName: ombiUserName } : undefined;

    if (item.mediaType === 'movie') {
      const movieId = Number.parseInt(item.providerId, 10);
      if (!Number.isInteger(movieId) || movieId <= 0) {
        throw new Error('Invalid Ombi movie identifier.');
      }

      const response = await this.client.post<OmbiRequestResponse>(
        '/api/v1/Request/movie',
        { theMovieDbId: movieId },
        userOptions,
      );
      const requestId = response.requestId;

      if (response.result !== true || response.isError === true || !requestId || requestId <= 0) {
        return {
          success: false,
          providerRequestId: requestId ? String(requestId) : undefined,
          status: 'unknown',
          message: response.errorMessage ?? response.message ?? 'Ombi did not create the request.',
        };
      }

      return {
        success: true,
        providerRequestId: String(requestId),
        status: 'pending',
        message: 'Request submitted to Ombi.',
      };
    }

    const tvId = Number.parseInt(item.providerId, 10);
    if (!Number.isInteger(tvId) || tvId <= 0) {
      throw new Error('Invalid Ombi TV identifier.');
    }

    const payload: OmbiTvRequestPayload = {
      theMovieDbId: tvId,
      requestAll: true,
      firstSeason: false,
      latestSeason: false,
      seasons: [],
      languageCode: 'en',
    };
    const response = await this.client.post<OmbiRequestResponse>(
      '/api/v2/Requests/tv',
      payload,
      userOptions,
    );
    const requestId = response.requestId;

    if (response.result !== true || response.isError === true || !requestId || requestId <= 0) {
      return {
        success: false,
        providerRequestId: requestId ? String(requestId) : undefined,
        status: 'unknown',
        message: response.errorMessage ?? response.message ?? 'Ombi did not create the TV request.',
      };
    }

    return {
      success: true,
      providerRequestId: String(requestId),
      status: 'pending',
      message: 'TV request submitted to Ombi.',
    };
  }

  async getRequestStatus(
    _providerRequestId: string,
    _mediaType: RequestMediaType,
  ): Promise<RequestStatus> {
    return 'unknown';
  }
}
