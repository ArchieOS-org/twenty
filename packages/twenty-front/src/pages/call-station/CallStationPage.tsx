import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
import { IconPhone, IconBrandLinkedin, IconCircle } from 'twenty-ui/icon';
import { MainButton, Chip } from 'twenty-ui/input';
import { H2Title } from 'twenty-ui/typography';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

type Person = {
  id: string;
  name: { firstName: string; lastName: string };
  phones: { primaryPhoneNumber?: string; additionalPhones?: string[] };
  emails: { primaryEmail?: string };
  company?: { name?: string };
  position?: string;
  linkedinLink?: { primaryLinkUrl?: string };
};

type CallRecord = {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
};

type CallState = {
  active: boolean;
  startTime?: number;
  person?: Person;
};

const BRIDGE_BASE_URL = 'http://127.0.0.1:8787';

const DISPOSITION_MAPPING: Record<string, string> = {
  Connected: 'REPLIED',
  Voicemail: 'VOICEMAIL',
  'No Answer': 'NO_ANSWER',
  'Wrong Number': 'WRONG_NUMBER',
  Busy: 'BUSY',
};

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[8]};
`;

const StyledFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMainLayout = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[6]};
  grid-template-columns: 2fr 1fr;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPersonPanel = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledCallingBanner = styled.div`
  align-items: center;
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  width: fit-content;
`;

const StyledPersonHeader = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  padding-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledPersonPhone = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledFieldRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 1fr 1fr;
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledFieldLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledFieldValue = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
`;

const StyledSecondaryFields = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[4]};
`;

const StyledLinkedInLink = styled.a`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  text-decoration: none;

  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledActions = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  padding-top: ${themeCssVariables.spacing[4]};
`;

const StyledCallsSection = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  padding-top: ${themeCssVariables.spacing[4]};
`;

const StyledCallsSectionTitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledCallItem = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  padding: ${themeCssVariables.spacing[2]} 0;

  &:last-child {
    border-bottom: none;
  }
`;

const StyledCallDisposition = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledCallTranscript = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  margin-top: ${themeCssVariables.spacing[1]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledQueuePanel = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  max-height: 600px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledQueueHeader = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledQueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledQueueItem = styled.div<{ isDone: boolean; isActive: boolean }>`
  color: ${({ isDone, isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : isDone
        ? themeCssVariables.font.color.tertiary
        : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.weight.medium
      : themeCssVariables.font.weight.regular};
  opacity: ${({ isDone }) => (isDone ? 0.4 : 1)};
  padding: ${themeCssVariables.spacing[2]};
  text-decoration: ${({ isDone }) => (isDone ? 'line-through' : 'none')};

  &:hover {
    color: ${({ isDone }) =>
      isDone
        ? themeCssVariables.font.color.tertiary
        : themeCssVariables.font.color.primary};
  }
`;

export const CallStationPage = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('has-phone');
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [callState, setCallState] = useState<CallState>({ active: false });
  const [callTimer, setCallTimer] = useState<number>(0);
  const [completedCallIds, setCompletedCallIds] = useState<Set<string>>(
    new Set(),
  );

  const { records: allPeople, loading: loadingPeople } =
    useFindManyRecords<Person>({
      objectNameSingular: CoreObjectNameSingular.Person,
      filter: {},
      recordGqlFields: {
        id: true,
        name: true,
        phones: true,
        emails: true,
        company: true,
        position: true,
        linkedinLink: true,
      },
    });

  const { records: callNotes } = useFindManyRecords<CallRecord>({
    objectNameSingular: CoreObjectNameSingular.Note,
    filter: currentPerson
      ? {
          title: {
            ilike: '%Call:%',
          },
        }
      : undefined,
    recordGqlFields: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
    },
    skip: !currentPerson,
  });

  const filteredPeople = allPeople.filter((person) => {
    if (selectedFilter === 'has-phone') {
      return !!person.phones?.primaryPhoneNumber;
    }
    if (selectedFilter === 'emailed') {
      return !!person.emails?.primaryEmail;
    }
    if (selectedFilter === 'solo') {
      return true;
    }
    return true;
  });

  const filters = [
    { id: 'solo', label: `Solo (${allPeople.length})` },
    {
      id: 'emailed',
      label: `Emailed (${allPeople.filter((p) => p.emails?.primaryEmail).length})`,
    },
    {
      id: 'has-phone',
      label: `Has phone (${allPeople.filter((p) => p.phones?.primaryPhoneNumber).length})`,
    },
  ];

  useEffect(() => {
    if (filteredPeople.length > 0 && !currentPerson) {
      const firstUncontacted = filteredPeople.find(
        (p) => !completedCallIds.has(p.id),
      );
      setCurrentPerson(firstUncontacted || filteredPeople[0]);
    }
  }, [filteredPeople, currentPerson, completedCallIds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (callState.active && callState.startTime) {
      interval = setInterval(() => {
        setCallTimer(Math.floor((Date.now() - callState.startTime!) / 1000));
      }, 1000);
    }
    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [callState.active, callState.startTime]);

  const handleStartCall = async () => {
    if (!currentPerson?.phones?.primaryPhoneNumber) return;

    try {
      await fetch(`${BRIDGE_BASE_URL}/call/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentPerson.phones.primaryPhoneNumber,
          name: `${currentPerson.name.firstName} ${currentPerson.name.lastName}`,
          brokerage: currentPerson.company?.name || '',
        }),
      });

      setCallState({
        active: true,
        startTime: Date.now(),
        person: currentPerson,
      });
      setCallTimer(0);
    } catch {
      // Silently handle error
    }
  };

  const handleFinishCall = async (dispositionLabel: string) => {
    if (!callState.person) return;

    const disposition =
      DISPOSITION_MAPPING[dispositionLabel] || dispositionLabel;

    try {
      await fetch(`${BRIDGE_BASE_URL}/call/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposition,
          notes: `Call: ${dispositionLabel}`,
        }),
      });

      setCallState({ active: false });
      setCallTimer(0);
      setCompletedCallIds((prev) => new Set(prev).add(callState.person!.id));

      const nextPerson = filteredPeople.find(
        (p) =>
          p.id !== callState.person!.id &&
          !completedCallIds.has(p.id) &&
          !completedCallIds.has(p.id),
      );

      if (nextPerson) {
        setCurrentPerson(nextPerson);
      }
    } catch {
      // Silently handle error
    }
  };

  const handlePersonClick = (person: Person) => {
    setCurrentPerson(person);
    setCallState({ active: false });
    setCallTimer(0);
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayName = currentPerson
    ? `${currentPerson.name.firstName} ${currentPerson.name.lastName}`
    : '';

  const hasSecondaryFields =
    !!currentPerson?.linkedinLink?.primaryLinkUrl ||
    (!!currentPerson?.phones?.additionalPhones &&
      currentPerson.phones.additionalPhones.length > 0);

  return (
    <PageContainer>
      <PageTitle title="Call Station" />
      <PageHeader title="Call Station" Icon={IconPhone} />
      <StyledContent>
        <StyledFilters>
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              variant={selectedFilter === filter.id ? 'highlighted' : 'regular'}
              onClick={() => setSelectedFilter(filter.id)}
            />
          ))}
        </StyledFilters>

        {loadingPeople ? (
          <AnimatedPlaceholderEmptyContainer>
            <AnimatedPlaceholderEmptyTextContainer>
              <AnimatedPlaceholderEmptyTitle>
                Loading people...
              </AnimatedPlaceholderEmptyTitle>
            </AnimatedPlaceholderEmptyTextContainer>
          </AnimatedPlaceholderEmptyContainer>
        ) : !currentPerson ? (
          <AnimatedPlaceholderEmptyContainer>
            <AnimatedPlaceholderEmptyTextContainer>
              <AnimatedPlaceholderEmptyTitle>
                No people found
              </AnimatedPlaceholderEmptyTitle>
            </AnimatedPlaceholderEmptyTextContainer>
          </AnimatedPlaceholderEmptyContainer>
        ) : (
          <StyledMainLayout>
            <StyledPersonPanel>
              {callState.active && (
                <StyledCallingBanner>
                  <IconCircle size={12} />
                  Calling · recording · {formatTimer(callTimer)}
                </StyledCallingBanner>
              )}

              <StyledPersonHeader>
                <H2Title title={displayName} />
                <StyledPersonPhone>
                  {currentPerson.phones?.primaryPhoneNumber || 'No phone'}
                </StyledPersonPhone>
              </StyledPersonHeader>

              {currentPerson.company?.name && (
                <StyledFieldRow>
                  <StyledField>
                    <StyledFieldLabel>Brokerage</StyledFieldLabel>
                    <StyledFieldValue>
                      {currentPerson.company.name}
                    </StyledFieldValue>
                  </StyledField>
                  {currentPerson.position && (
                    <StyledField>
                      <StyledFieldLabel>Position</StyledFieldLabel>
                      <StyledFieldValue>
                        {currentPerson.position}
                      </StyledFieldValue>
                    </StyledField>
                  )}
                </StyledFieldRow>
              )}

              {hasSecondaryFields && (
                <StyledSecondaryFields>
                  {currentPerson.linkedinLink?.primaryLinkUrl && (
                    <StyledLinkedInLink
                      href={currentPerson.linkedinLink.primaryLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandLinkedin size={16} />
                      LinkedIn
                    </StyledLinkedInLink>
                  )}
                  {currentPerson.phones?.additionalPhones &&
                    currentPerson.phones.additionalPhones.length > 0 && (
                      <StyledField>
                        <StyledFieldLabel>Additional Phones</StyledFieldLabel>
                        <StyledFieldValue>
                          {currentPerson.phones.additionalPhones.join(', ')}
                        </StyledFieldValue>
                      </StyledField>
                    )}
                </StyledSecondaryFields>
              )}

              <StyledActions>
                {!callState.active ? (
                  <MainButton
                    title="Dial"
                    Icon={IconPhone}
                    onClick={handleStartCall}
                    disabled={!currentPerson.phones?.primaryPhoneNumber}
                  />
                ) : (
                  <>
                    <MainButton
                      title="Connected"
                      onClick={() => handleFinishCall('Connected')}
                    />
                    <MainButton
                      title="Voicemail"
                      variant="secondary"
                      onClick={() => handleFinishCall('Voicemail')}
                    />
                    <MainButton
                      title="No Answer"
                      variant="secondary"
                      onClick={() => handleFinishCall('No Answer')}
                    />
                    <MainButton
                      title="Busy"
                      variant="tertiary"
                      onClick={() => handleFinishCall('Busy')}
                    />
                    <MainButton
                      title="Wrong Number"
                      variant="tertiary"
                      onClick={() => handleFinishCall('Wrong Number')}
                    />
                  </>
                )}
              </StyledActions>

              {callNotes.length > 0 && (
                <StyledCallsSection>
                  <StyledCallsSectionTitle>
                    Calls + transcript
                  </StyledCallsSectionTitle>
                  {callNotes.slice(0, 5).map((call) => (
                    <StyledCallItem key={call.id}>
                      <StyledCallDisposition>
                        {call.title}
                      </StyledCallDisposition>
                      {call.body && (
                        <StyledCallTranscript>{call.body}</StyledCallTranscript>
                      )}
                    </StyledCallItem>
                  ))}
                </StyledCallsSection>
              )}
            </StyledPersonPanel>

            <StyledQueuePanel>
              <StyledQueueHeader>
                {
                  filteredPeople.filter((p) => !completedCallIds.has(p.id))
                    .length
                }{' '}
                remaining
              </StyledQueueHeader>
              <StyledQueueList>
                {filteredPeople.map((person) => (
                  <StyledQueueItem
                    key={person.id}
                    isDone={completedCallIds.has(person.id)}
                    isActive={person.id === currentPerson.id}
                    onClick={() => handlePersonClick(person)}
                  >
                    {person.name.firstName} {person.name.lastName}
                  </StyledQueueItem>
                ))}
              </StyledQueueList>
            </StyledQueuePanel>
          </StyledMainLayout>
        )}
      </StyledContent>
    </PageContainer>
  );
};
