export type RequestMediaType =
  | 'movie'
  | 'series';

export type RequestStatus =
  | 'available'
  | 'requested'
  | 'pending'
  | 'approved'
  | 'processing'
  | 'unavailable'
  | 'unknown';

export interface RequestSearchResult {
  providerId: string;

  mediaType: RequestMediaType;

  title: string;
  originalTitle: string | undefined;

  year: number | undefined;

  overview: string | undefined;
  posterUrl: string | undefined;

  status: RequestStatus;

  requested: boolean;
  available: boolean;
}

export interface RequestSubmissionResult {
  success: boolean;

  providerRequestId:
    string | undefined;

  status: RequestStatus;

  message:
    string | undefined;
}

export interface RequestProviderCapabilities {
  movies: boolean;
  series: boolean;

  requestStatus: boolean;

  autoApproval:
    boolean;
}

export interface RequestProvider {
  readonly name: string;

  healthCheck():
    Promise<void>;

  getCapabilities():
    Promise<RequestProviderCapabilities>;

  search(
    query: string,
    mediaType: RequestMediaType,
  ): Promise<RequestSearchResult[]>;

  request(
    item: RequestSearchResult,
    options?: {
      autoApprove?: boolean;

      requester?: {
        source: 'discord';
        id: string;
      };
    },
  ): Promise<RequestSubmissionResult>;

  getRequestStatus(
    providerId: string,
    mediaType: RequestMediaType,
  ): Promise<RequestStatus>;
}
