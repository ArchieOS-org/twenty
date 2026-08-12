import { useEffect, useState } from 'react';

import {
  useFindManyRecords,
  type UseFindManyRecordsParams,
} from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

import { fetchRemainingFindManyPages } from './fetch-remaining-find-many-pages';

export const useFindManyRecordsUntilEnd = <T extends ObjectRecord>(
  params: UseFindManyRecordsParams<T>,
) => {
  const findManyRecordsResult = useFindManyRecords<T>(params);
  const { loading, hasNextPage, fetchMoreRecords } = findManyRecordsResult;
  const [isPagingComplete, setIsPagingComplete] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsPagingComplete(false);
      return;
    }

    if (isPagingComplete) {
      return;
    }

    if (hasNextPage !== true) {
      setIsPagingComplete(true);
      return;
    }

    void fetchRemainingFindManyPages(fetchMoreRecords).finally(() => {
      setIsPagingComplete(true);
    });
  }, [fetchMoreRecords, hasNextPage, isPagingComplete, loading]);

  return {
    ...findManyRecordsResult,
    loading: loading || !isPagingComplete,
  };
};
