import { isNonEmptyString } from '@sniptt/guards';

export type CallTranscript = {
  __typename?: string;
  blocknote?: string | null;
  markdown?: string | null;
};

export const getCallTranscriptText = (
  transcript: CallTranscript | string | null | undefined,
): string => {
  if (isNonEmptyString(transcript)) {
    return transcript;
  }

  if (
    typeof transcript === 'object' &&
    transcript !== null &&
    isNonEmptyString(transcript.markdown)
  ) {
    return transcript.markdown;
  }

  return '';
};
