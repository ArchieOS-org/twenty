import { styled } from '@linaria/react';
import { useCallback, useEffect, useState } from 'react';
import { IconPhone, IconBrandLinkedin } from 'twenty-ui/icon';
import { MainButton } from 'twenty-ui/input';
import { H2Title } from 'twenty-ui/typography';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
  AnimatedPlaceholderEmptySubTitle,
} from 'twenty-ui/feedback';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { TabList } from '@/ui/layout/tab-list/components/TabList';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

type QueueItem = {
  name: string;
  phone: string;
  brokerage: string;
  notes?: string;
  done: boolean;
};

type Person = {
  id: string;
  name: { firstName: string; lastName: string };
  phones: { primaryPhoneNumber?: string; additionalPhones?: string[] };
  emails: { primaryEmail?: string };
  company?: { name?: string };
  outreachStatus?: string;
  lastTouch?: string;
  notes?: string;
  tier?: string;
  linkedinLink?: { primaryLinkUrl?: string };
};

const BRIDGE_BASE_URL = 'http://127.0.0.1:8787';
const QUEUE_PATH =
  '/Users/noahdeskin/.hermes/data/austin-realtors/call_queue.csv';

const DISPOSITION_MAPPING: Record<string, string> = {
  Connected: 'REPLIED',
  Voicemail: 'VOICEMAIL',
  'No Answer': 'NO_ANSWER',
  'Wrong Number': 'WRONG_NUMBER',
  Busy: 'BUSY',
};

const normalizePhone = (phone: string | undefined): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const normalizeName = (name: string | undefined): string => {
  if (!name) return '';
  return name.toLowerCase().trim();
};

const findPersonForContact = (
  contact: QueueItem,
  people: Person[],
): Person | null => {
  const normalizedQueuePhone = normalizePhone(contact.phone);

  if (normalizedQueuePhone) {
    const personByPhone = people.find((p) => {
      const normalizedPrimaryPhone = normalizePhone(
        p.phones?.primaryPhoneNumber,
      );
      if (normalizedPrimaryPhone === normalizedQueuePhone) {
        return true;
      }

      if (p.phones?.additionalPhones) {
        return p.phones.additionalPhones.some(
          (phone) => normalizePhone(phone) === normalizedQueuePhone,
        );
      }

      return false;
    });

    if (personByPhone) return personByPhone;
  }

  const normalizedQueueName = normalizeName(contact.name);
  if (normalizedQueueName) {
    const personByName = people.find((p) => {
      const fullName = `${p.name.firstName} ${p.name.lastName}`
        .toLowerCase()
        .trim();
      return fullName === normalizedQueueName;
    });

    if (personByName) return personByName;
  }

  return null;
};

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[8]};
`;

const StyledPersonPanel = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledPersonHeader = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  margin-bottom: ${themeCssVariables.spacing[4]};
  padding-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledPersonPhone = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledNoCrmMatch = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-style: italic;
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledFieldRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 1fr 1fr;
  margin-bottom: ${themeCssVariables.spacing[3]};
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

const StyledNotesField = styled.div`
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledSecondaryFields = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  margin-top: ${themeCssVariables.spacing[4]};
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
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: ${themeCssVariables.spacing[6]};
`;

const StyledQueueSection = styled.div`
  margin-top: ${themeCssVariables.spacing[4]};
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

const StyledQueueItem = styled.div<{ isDone: boolean }>`
  color: ${({ isDone }) =>
    isDone
      ? themeCssVariables.font.color.tertiary
      : themeCssVariables.font.color.secondary};
  cursor: ${({ isDone }) => (isDone ? 'default' : 'pointer')};
  font-size: ${themeCssVariables.font.size.sm};
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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('A - Talk first');
  const [currentContact, setCurrentContact] = useState<QueueItem | null>(null);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { records: people } = useFindManyRecords<Person>({
    objectNameSingular: CoreObjectNameSingular.Person,
    filter: {},
    recordGqlFields: {
      id: true,
      name: true,
      phones: true,
      emails: true,
      company: true,
      outreachStatus: true,
      lastTouch: true,
      notes: true,
      tier: true,
      linkedinLink: true,
    },
  });

  const fetchQueue = async () => {
    try {
      const response = await fetch(`${BRIDGE_BASE_URL}/queue/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue: QUEUE_PATH }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }

      const data = await response.json();
      setQueue(data.queue || []);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const filterQueueByGroup = (items: QueueItem[]): QueueItem[] => {
    return items.filter((item) => {
      const itemNotes = item.notes?.trim() || '';
      return itemNotes === selectedGroup;
    });
  };

  const filteredQueue = filterQueueByGroup(queue);
  const notDoneFilteredQueue = filteredQueue.filter((item) => !item.done);

  const groupTabs = [
    { id: 'A - Talk first', title: 'A' },
    { id: 'B - Backup', title: 'B' },
    { id: 'Team member', title: 'Team' },
  ];

  useEffect(() => {
    if (notDoneFilteredQueue.length > 0 && !currentContact) {
      const nextContact = notDoneFilteredQueue[0];
      setCurrentContact(nextContact);
      setCurrentPerson(findPersonForContact(nextContact, people));
    }
  }, [notDoneFilteredQueue, currentContact, people]);

  const handleStartCall = async () => {
    if (!currentContact) return;

    try {
      await fetch(`${BRIDGE_BASE_URL}/call/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentContact.phone,
          name: currentContact.name,
          brokerage: currentContact.brokerage,
        }),
      });

      setIsCallActive(true);
    } catch {
      // Silently handle error
    }
  };

  const handleFinishCall = async (dispositionLabel: string) => {
    if (!currentContact) return;

    const disposition =
      DISPOSITION_MAPPING[dispositionLabel] || dispositionLabel;

    try {
      await fetch(`${BRIDGE_BASE_URL}/call/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposition,
          notes: currentContact.notes || '',
        }),
      });

      setIsCallActive(false);
      await fetchQueue();

      const updatedNotDoneQueue = notDoneFilteredQueue.filter(
        (item) => item.phone !== currentContact.phone,
      );
      if (updatedNotDoneQueue.length > 0) {
        const nextContact = updatedNotDoneQueue[0];
        setCurrentContact(nextContact);
        setCurrentPerson(findPersonForContact(nextContact, people));
      } else {
        setCurrentContact(null);
        setCurrentPerson(null);
      }
    } catch {
      // Silently handle error
    }
  };

  const handleQueueItemClick = (item: QueueItem) => {
    if (!item.done) {
      setCurrentContact(item);
      setCurrentPerson(findPersonForContact(item, people));
      setIsCallActive(false);
    }
  };

  const handleGroupChange = useCallback((groupId: string) => {
    setSelectedGroup(groupId);
    setCurrentContact(null);
    setCurrentPerson(null);
    setIsCallActive(false);
  }, []);

  const notDoneCount = notDoneFilteredQueue.length;
  const displayName = currentPerson
    ? `${currentPerson.name.firstName} ${currentPerson.name.lastName}`
    : currentContact?.name || '';

  const hasSecondaryFields =
    !!currentPerson?.linkedinLink?.primaryLinkUrl ||
    (!!currentPerson?.phones?.additionalPhones &&
      currentPerson.phones.additionalPhones.length > 0);

  return (
    <PageContainer>
      <PageTitle title="Call Station" />
      <PageHeader title="Call Station" Icon={IconPhone} />
      <StyledContent>
        <TabList
          tabs={groupTabs}
          componentInstanceId="call-station-groups"
          behaveAsLinks={false}
          onChangeTab={handleGroupChange}
        />

        {isLoading ? (
          <AnimatedPlaceholderEmptyContainer>
            <AnimatedPlaceholderEmptyTextContainer>
              <AnimatedPlaceholderEmptyTitle>
                Loading queue...
              </AnimatedPlaceholderEmptyTitle>
            </AnimatedPlaceholderEmptyTextContainer>
          </AnimatedPlaceholderEmptyContainer>
        ) : !currentContact ? (
          <AnimatedPlaceholderEmptyContainer>
            <AnimatedPlaceholderEmptyTextContainer>
              <AnimatedPlaceholderEmptyTitle>
                No contacts
              </AnimatedPlaceholderEmptyTitle>
              <AnimatedPlaceholderEmptySubTitle>
                This group has no pending calls
              </AnimatedPlaceholderEmptySubTitle>
            </AnimatedPlaceholderEmptyTextContainer>
          </AnimatedPlaceholderEmptyContainer>
        ) : (
          <>
            <StyledPersonPanel>
              <StyledPersonHeader>
                <H2Title title={displayName} />
                <StyledPersonPhone>{currentContact.phone}</StyledPersonPhone>
                {!currentPerson && (
                  <StyledNoCrmMatch>No CRM match</StyledNoCrmMatch>
                )}
              </StyledPersonHeader>

              <StyledFieldRow>
                <StyledField>
                  <StyledFieldLabel>Brokerage</StyledFieldLabel>
                  <StyledFieldValue>
                    {currentPerson?.company?.name || currentContact.brokerage}
                  </StyledFieldValue>
                </StyledField>
                {currentPerson?.tier && (
                  <StyledField>
                    <StyledFieldLabel>Tier</StyledFieldLabel>
                    <StyledFieldValue>{currentPerson.tier}</StyledFieldValue>
                  </StyledField>
                )}
              </StyledFieldRow>

              {(currentPerson?.outreachStatus || currentPerson?.lastTouch) && (
                <StyledFieldRow>
                  {currentPerson.outreachStatus && (
                    <StyledField>
                      <StyledFieldLabel>Outreach Status</StyledFieldLabel>
                      <StyledFieldValue>
                        {currentPerson.outreachStatus}
                      </StyledFieldValue>
                    </StyledField>
                  )}
                  {currentPerson.lastTouch && (
                    <StyledField>
                      <StyledFieldLabel>Last Touch</StyledFieldLabel>
                      <StyledFieldValue>
                        {currentPerson.lastTouch}
                      </StyledFieldValue>
                    </StyledField>
                  )}
                </StyledFieldRow>
              )}

              {(currentPerson?.notes || currentContact.notes) && (
                <StyledNotesField>
                  <StyledFieldLabel>Notes</StyledFieldLabel>
                  <StyledFieldValue>
                    {currentPerson?.notes || currentContact.notes}
                  </StyledFieldValue>
                </StyledNotesField>
              )}

              {hasSecondaryFields && (
                <StyledSecondaryFields>
                  {currentPerson?.linkedinLink?.primaryLinkUrl && (
                    <StyledLinkedInLink
                      href={currentPerson.linkedinLink.primaryLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandLinkedin size={16} />
                      LinkedIn
                    </StyledLinkedInLink>
                  )}
                  {currentPerson?.phones?.additionalPhones &&
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
                {!isCallActive ? (
                  <MainButton
                    title="Dial"
                    Icon={IconPhone}
                    onClick={handleStartCall}
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
            </StyledPersonPanel>

            <StyledQueueSection>
              <StyledQueueHeader>{notDoneCount} left</StyledQueueHeader>
              <StyledQueueList>
                {filteredQueue.map((item, index) => (
                  <StyledQueueItem
                    key={`${item.phone}-${index}`}
                    isDone={item.done}
                    onClick={() => handleQueueItemClick(item)}
                  >
                    {item.name}
                  </StyledQueueItem>
                ))}
              </StyledQueueList>
            </StyledQueueSection>
          </>
        )}
      </StyledContent>
    </PageContainer>
  );
};
