export const CALL_STATION_FIND_MANY_MAXIMUM_PAGES = 100;

type FetchMoreFindManyRecordsResult = {
  data?: {
    pageInfo?: {
      hasNextPage?: boolean | null;
    };
  };
  error?: unknown;
};

const getFetchMoreFindManyRecordsResult = (
  result: unknown,
): FetchMoreFindManyRecordsResult | undefined => {
  if (typeof result !== 'object' || result === null) {
    return undefined;
  }

  return result as FetchMoreFindManyRecordsResult;
};

export const fetchRemainingFindManyPages = async (
  fetchMoreRecords: () => Promise<unknown>,
  maximumPages = CALL_STATION_FIND_MANY_MAXIMUM_PAGES,
): Promise<void> => {
  for (let pageIndex = 0; pageIndex < maximumPages; pageIndex++) {
    const result = getFetchMoreFindManyRecordsResult(await fetchMoreRecords());

    if (result?.error !== undefined) {
      return;
    }

    if (result?.data?.pageInfo?.hasNextPage !== true) {
      return;
    }
  }
};
