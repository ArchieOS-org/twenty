import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
import { IconPhone } from 'twenty-ui/icon';
import { MainButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';

type QueueItem = {
  name: string;
  phone: string;
  brokerage: string;
  notes?: string;
  done: boolean;
};

const BRIDGE_BASE_URL = 'http://localhost:8765';
const QUEUE_PATH =
  '/Users/noahdeskin/.hermes/data/austin-realtors/call_queue.csv';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledGroupPicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledGroupChip = styled.button<{ isSelected: boolean }>`
  background: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.background.primary
      : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ isSelected }) =>
      isSelected
        ? themeCssVariables.border.color.strong
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ isSelected }) =>
      isSelected
        ? themeCssVariables.background.primary
        : themeCssVariables.background.tertiary};
  }
`;

const StyledQueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledQueueHeader = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledQueueItemRow = styled.div<{ isDone: boolean; isActive: boolean }>`
  background: ${({ isActive, isDone }) =>
    isActive
      ? themeCssVariables.background.tertiary
      : isDone
        ? themeCssVariables.background.transparent.lighter
        : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ isActive }) =>
      isActive
        ? themeCssVariables.border.color.strong
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 1fr 150px 1fr;
  opacity: ${({ isDone }) => (isDone ? 0.5 : 1)};
  padding: ${themeCssVariables.spacing[3]};
  transition: all 0.15s ease;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

const StyledItemText = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCurrentContactCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledContactName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledContactDetail = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledButtonGroup = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledDispositionButtons = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const StyledDispositionButton = styled.button`
  background: ${themeCssVariables.background.tertiary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
  transition: all 0.15s ease;

  &:hover {
    background: ${themeCssVariables.background.quaternary};
  }
`;

export const CallStationPage = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
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

  const deriveGroups = (): string[] => {
    const uniqueGroups = new Set<string>();
    queue.forEach((item) => {
      const group = item.notes?.trim() || '';
      uniqueGroups.add(group);
    });
    return ['All', ...Array.from(uniqueGroups).sort()];
  };

  const filterQueueByGroup = (items: QueueItem[]): QueueItem[] => {
    if (selectedGroup === 'All') {
      return items;
    }

    return items.filter((item) => {
      const itemGroup = item.notes?.trim() || '';
      if (selectedGroup === 'Ungrouped') {
        return itemGroup === '';
      }
      return itemGroup === selectedGroup;
    });
  };

  const filteredQueue = filterQueueByGroup(queue);
  const notDoneFilteredQueue = filteredQueue.filter((item) => !item.done);
  const groups = deriveGroups();

  useEffect(() => {
    if (!groups.includes(selectedGroup)) {
      if (groups.includes('A - Talk first')) {
        setSelectedGroup('A - Talk first');
      } else {
        setSelectedGroup('All');
      }
    }
  }, [queue, selectedGroup, groups]);

  useEffect(() => {
    if (notDoneFilteredQueue.length > 0 && !currentContact) {
      setCurrentContact(notDoneFilteredQueue[0]);
    }
  }, [notDoneFilteredQueue, currentContact]);

  const handleStartCall = () => {
    if (currentContact) {
      setIsCallActive(true);
    }
  };

  const handleFinishCall = async (disposition: string) => {
    if (!currentContact) return;

    try {
      await fetch(`${BRIDGE_BASE_URL}/queue/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue: QUEUE_PATH,
          phone: currentContact.phone,
          disposition,
        }),
      });

      setIsCallActive(false);
      setCurrentContact(null);
      await fetchQueue();
    } catch {
      // Silently handle error
    }
  };

  const handleRowClick = (item: QueueItem) => {
    if (!item.done) {
      setCurrentContact(item);
      setIsCallActive(false);
    }
  };

  const notDoneCount = notDoneFilteredQueue.length;

  const displayGroups = groups.map((group) => {
    if (group === '') return 'Ungrouped';
    return group;
  });

  return (
    <StyledContainer>
      <PageTitle title="Call Station" />
      <PageHeader title="Call Station" Icon={IconPhone} />
      <StyledContent>
        <StyledGroupPicker>
          {displayGroups.map((group) => {
            const actualGroup = group === 'Ungrouped' ? '' : group;
            return (
              <StyledGroupChip
                key={group}
                isSelected={selectedGroup === actualGroup}
                onClick={() => setSelectedGroup(actualGroup)}
              >
                {group}
              </StyledGroupChip>
            );
          })}
        </StyledGroupPicker>

        {currentContact && (
          <StyledCurrentContactCard>
            <StyledContactInfo>
              <StyledContactName>{currentContact.name}</StyledContactName>
              <StyledContactDetail>{currentContact.phone}</StyledContactDetail>
              <StyledContactDetail>
                {currentContact.brokerage}
              </StyledContactDetail>
              {currentContact.notes && (
                <StyledContactDetail>
                  Notes: {currentContact.notes}
                </StyledContactDetail>
              )}
            </StyledContactInfo>

            {!isCallActive ? (
              <StyledButtonGroup>
                <MainButton title="Start Call" onClick={handleStartCall} />
              </StyledButtonGroup>
            ) : (
              <>
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
                    onClick={() => handleFinishCall('Wrong Number')}
                  >
                    Wrong Number
                  </StyledDispositionButton>
                </StyledDispositionButtons>
              </>
            )}
          </StyledCurrentContactCard>
        )}

        <StyledQueueList>
          <StyledQueueHeader>Queue · {notDoneCount} left</StyledQueueHeader>
          {isLoading ? (
            <StyledItemText>Loading queue...</StyledItemText>
          ) : filteredQueue.length === 0 ? (
            <StyledItemText>No contacts in this group</StyledItemText>
          ) : (
            filteredQueue.map((item, index) => (
              <StyledQueueItemRow
                key={`${item.phone}-${index}`}
                isDone={item.done}
                isActive={currentContact?.phone === item.phone && !item.done}
                onClick={() => handleRowClick(item)}
              >
                <StyledItemText>{item.name}</StyledItemText>
                <StyledItemText>{item.phone}</StyledItemText>
                <StyledItemText>{item.brokerage}</StyledItemText>
              </StyledQueueItemRow>
            ))
          )}
        </StyledQueueList>
      </StyledContent>
    </StyledContainer>
  );
};
