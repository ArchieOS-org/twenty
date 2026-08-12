import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
import { IconPhone } from 'twenty-ui/icon';
import { MainButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';

type QueueItem = {
  name: string;
  phone: string;
  brokerage: string;
  notes?: string;
  done: boolean;
};

const BRIDGE_BASE_URL = 'http://127.0.0.1:8787';
const QUEUE_PATH =
  '/Users/noahdeskin/.hermes/data/austin-realtors/call_queue.csv';

const GROUP_MAPPING: Record<string, string> = {
  'A - Talk first': 'A',
  'B - Backup': 'B',
  'Team member': 'Team',
};

const DISPOSITION_MAPPING: Record<string, string> = {
  Connected: 'REPLIED',
  Voicemail: 'VOICEMAIL',
  'No Answer': 'NO_ANSWER',
  'Wrong Number': 'WRONG_NUMBER',
  Busy: 'BUSY',
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const StyledGroupPicker = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledGroupChip = styled.button<{ isSelected: boolean }>`
  background: ${({ isSelected }) =>
    isSelected ? themeCssVariables.color.blue : 'transparent'};
  border: 2px solid
    ${({ isSelected }) =>
      isSelected
        ? themeCssVariables.color.blue
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 80px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ isSelected }) =>
      isSelected
        ? themeCssVariables.color.blue
        : themeCssVariables.background.transparent.light};
  }
`;

const StyledTheater = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  justify-content: center;
  min-height: 400px;
  padding: ${themeCssVariables.spacing[8]} ${themeCssVariables.spacing[6]};
`;

const StyledContactName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: 48px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: -0.02em;
  text-align: center;
`;

const StyledContactPhone = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-top: -${themeCssVariables.spacing[3]};
`;

const StyledContactReason = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  font-style: italic;
  margin-top: -${themeCssVariables.spacing[2]};
`;

const StyledCallButton = styled.div`
  margin-top: ${themeCssVariables.spacing[4]};
  min-width: 200px;
`;

const StyledDispositionButtons = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledDispositionButton = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: 2px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[5]};
  transition: all 0.2s ease;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
    border-color: ${themeCssVariables.border.color.strong};
  }
`;

const StyledQueueSection = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  flex: 1;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledQueueHeader = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[3]};
  text-transform: uppercase;
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
  transition: color 0.15s ease;

  &:hover {
    color: ${({ isDone }) =>
      isDone
        ? themeCssVariables.font.color.tertiary
        : themeCssVariables.font.color.primary};
  }
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.lg};
  height: 200px;
  justify-content: center;
`;

export const CallStationPage = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('A - Talk first');
  const [currentContact, setCurrentContact] = useState<QueueItem | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      setQueue(data.items || []);
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

  const availableGroups = ['A - Talk first', 'B - Backup', 'Team member'];

  useEffect(() => {
    if (notDoneFilteredQueue.length > 0 && !currentContact) {
      setCurrentContact(notDoneFilteredQueue[0]);
    }
  }, [notDoneFilteredQueue, currentContact]);

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
        setCurrentContact(updatedNotDoneQueue[0]);
      } else {
        setCurrentContact(null);
      }
    } catch {
      // Silently handle error
    }
  };

  const handleQueueItemClick = (item: QueueItem) => {
    if (!item.done) {
      setCurrentContact(item);
      setIsCallActive(false);
    }
  };

  const notDoneCount = notDoneFilteredQueue.length;

  return (
    <StyledContainer>
      <PageTitle title="Call Station" />
      <StyledGroupPicker>
        {availableGroups.map((group) => {
          const shortName = GROUP_MAPPING[group] || group;
          return (
            <StyledGroupChip
              key={group}
              isSelected={selectedGroup === group}
              onClick={() => {
                setSelectedGroup(group);
                setCurrentContact(null);
                setIsCallActive(false);
              }}
            >
              {shortName}
            </StyledGroupChip>
          );
        })}
      </StyledGroupPicker>

      {isLoading ? (
        <StyledEmptyState>Loading...</StyledEmptyState>
      ) : !currentContact ? (
        <StyledEmptyState>No contacts in this group</StyledEmptyState>
      ) : (
        <>
          <StyledTheater>
            <StyledContactName>{currentContact.name}</StyledContactName>
            <StyledContactPhone>{currentContact.phone}</StyledContactPhone>
            {currentContact.notes && (
              <StyledContactReason>{currentContact.notes}</StyledContactReason>
            )}

            {!isCallActive ? (
              <StyledCallButton>
                <MainButton
                  title="Dial"
                  Icon={IconPhone}
                  onClick={handleStartCall}
                />
              </StyledCallButton>
            ) : (
              <StyledDispositionButtons>
                <StyledDispositionButton
                  onClick={() => handleFinishCall('Connected')}
                >
                  Connected
                </StyledDispositionButton>
                <StyledDispositionButton
                  onClick={() => handleFinishCall('Voicemail')}
                >
                  Voicemail
                </StyledDispositionButton>
                <StyledDispositionButton
                  onClick={() => handleFinishCall('No Answer')}
                >
                  No Answer
                </StyledDispositionButton>
                <StyledDispositionButton
                  onClick={() => handleFinishCall('Busy')}
                >
                  Busy
                </StyledDispositionButton>
                <StyledDispositionButton
                  onClick={() => handleFinishCall('Wrong Number')}
                >
                  Wrong Number
                </StyledDispositionButton>
              </StyledDispositionButtons>
            )}
          </StyledTheater>

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
    </StyledContainer>
  );
};
