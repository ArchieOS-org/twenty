import { fetchRemainingFindManyPages } from '~/pages/call-station/fetch-remaining-find-many-pages';

describe('fetchRemainingFindManyPages', () => {
  it('should call fetchMore until hasNextPage is false', async () => {
    const fetchMoreRecords = jest
      .fn()
      .mockResolvedValueOnce({
        data: { pageInfo: { hasNextPage: true } },
      })
      .mockResolvedValueOnce({
        data: { pageInfo: { hasNextPage: true } },
      })
      .mockResolvedValueOnce({
        data: { pageInfo: { hasNextPage: false } },
      });

    await fetchRemainingFindManyPages(fetchMoreRecords);

    expect(fetchMoreRecords).toHaveBeenCalledTimes(3);
  });

  it('should stop after the first page when hasNextPage is false', async () => {
    const fetchMoreRecords = jest.fn().mockResolvedValue({
      data: { pageInfo: { hasNextPage: false } },
    });

    await fetchRemainingFindManyPages(fetchMoreRecords);

    expect(fetchMoreRecords).toHaveBeenCalledTimes(1);
  });

  it('should stop when fetchMore returns an error', async () => {
    const fetchMoreRecords = jest.fn().mockResolvedValue({
      error: new Error('network'),
    });

    await fetchRemainingFindManyPages(fetchMoreRecords);

    expect(fetchMoreRecords).toHaveBeenCalledTimes(1);
  });

  it('should stop when fetchMore returns nothing', async () => {
    const fetchMoreRecords = jest.fn().mockResolvedValue(undefined);

    await fetchRemainingFindManyPages(fetchMoreRecords);

    expect(fetchMoreRecords).toHaveBeenCalledTimes(1);
  });

  it('should cap requests at maximumPages', async () => {
    const fetchMoreRecords = jest.fn().mockResolvedValue({
      data: { pageInfo: { hasNextPage: true } },
    });

    await fetchRemainingFindManyPages(fetchMoreRecords, 4);

    expect(fetchMoreRecords).toHaveBeenCalledTimes(4);
  });
});
