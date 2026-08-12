import { getCallTranscriptText } from '~/pages/call-station/get-call-transcript-text';

describe('getCallTranscriptText', () => {
  it('should return markdown from a RICH_TEXT object', () => {
    expect(
      getCallTranscriptText({
        __typename: 'RichText',
        blocknote: '[]',
        markdown: 'Hello from the call',
      }),
    ).toBe('Hello from the call');
  });

  it('should return a plain string transcript', () => {
    expect(getCallTranscriptText('Legacy string transcript')).toBe(
      'Legacy string transcript',
    );
  });

  it('should return empty for missing or empty transcript', () => {
    expect(getCallTranscriptText(undefined)).toBe('');
    expect(getCallTranscriptText(null)).toBe('');
    expect(getCallTranscriptText('')).toBe('');
    expect(
      getCallTranscriptText({
        __typename: 'RichText',
        blocknote: null,
        markdown: null,
      }),
    ).toBe('');
  });
});
