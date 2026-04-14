import { supabase } from './supabase.js';

function removeChannelsByPrefix(prefix) {
  const channels = supabase.getChannels().filter((channel) => {
    const topic = String(channel?.topic || '');
    return topic.includes(prefix);
  });
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
}

export function subscribeToHouseholdLists(householdId, onChange) {
  const prefix = `app612-aislekin-household-${householdId}`;
  removeChannelsByPrefix(prefix);
  const channel = supabase
    .channel(`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app612_aislekin_lists',
        filter: `household_id=eq.${householdId}`
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToListItems(listId, onChange) {
  const prefix = `app612-aislekin-list-${listId}`;
  removeChannelsByPrefix(prefix);
  const channel = supabase
    .channel(`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app612_aislekin_items',
        filter: `list_id=eq.${listId}`
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
