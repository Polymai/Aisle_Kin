import { supabase } from '../lib/supabase.js';
import { addItem } from './lists-api.js';

const LIBRARY = 'app612_aislekin_library_entries';
const ITEMS = 'app612_aislekin_items';

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('Authentication required.');
  }
  return data.user;
}

export async function loadLibraryCollections(householdId) {
  const { data: favorites, error: favoritesError } = await supabase
    .from(LIBRARY)
    .select(
      'id, household_id, name, default_quantity, default_unit, notes, default_section, priority, kind, usage_count, last_used_at, created_at, updated_at'
    )
    .eq('household_id', householdId)
    .eq('kind', 'favorite')
    .order('last_used_at', { ascending: false });

  if (favoritesError) {
    throw favoritesError;
  }

  const { data: staples, error: staplesError } = await supabase
    .from(LIBRARY)
    .select(
      'id, household_id, name, default_quantity, default_unit, notes, default_section, priority, kind, usage_count, last_used_at, created_at, updated_at'
    )
    .eq('household_id', householdId)
    .eq('kind', 'staple')
    .order('last_used_at', { ascending: false });

  if (staplesError) {
    throw staplesError;
  }

  const { data: recentItems, error: recentsError } = await supabase
    .from(ITEMS)
    .select('id, name, quantity, unit, notes, section, priority, updated_at')
    .eq('household_id', householdId)
    .order('updated_at', { ascending: false })
    .limit(40);

  if (recentsError) {
    throw recentsError;
  }

  const seen = new Set();
  const recents = [];
  for (const item of recentItems || []) {
    const key = item.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      recents.push(item);
    }
  }

  return {
    favorites: favorites || [],
    staples: staples || [],
    recents
  };
}

async function saveLibraryEntry(householdId, item, kind) {
  const user = await getCurrentUser();
  const normalizedName = item.name.trim();

  const { data: existing, error: existingError } = await supabase
    .from(LIBRARY)
    .select(
      'id, household_id, name, default_quantity, default_unit, notes, default_section, priority, kind, usage_count, last_used_at, created_at, updated_at'
    )
    .eq('household_id', householdId)
    .eq('kind', kind)
    .ilike('name', normalizedName)
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  const payload = {
    household_id: householdId,
    name: normalizedName,
    default_quantity: Number(item.quantity || item.default_quantity || 1),
    default_unit: item.unit || item.default_unit || null,
    notes: item.notes || null,
    default_section: item.section || item.default_section || 'Other',
    priority: Number(item.priority || 2),
    kind,
    usage_count: Number(item.usage_count || 1),
    last_used_at: new Date().toISOString(),
    created_by: user.id
  };

  if (existing?.[0]) {
    const { data, error } = await supabase
      .from(LIBRARY)
      .update(payload)
      .eq('id', existing[0].id)
      .select(
        'id, household_id, name, default_quantity, default_unit, notes, default_section, priority, kind, usage_count, last_used_at, created_at, updated_at'
      )
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  const { data, error } = await supabase
    .from(LIBRARY)
    .insert(payload)
    .select(
      'id, household_id, name, default_quantity, default_unit, notes, default_section, priority, kind, usage_count, last_used_at, created_at, updated_at'
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveFavoriteFromItem(householdId, item) {
  return saveLibraryEntry(householdId, item, 'favorite');
}

export async function saveStapleFromItem(householdId, item) {
  return saveLibraryEntry(householdId, item, 'staple');
}

export async function createCustomStaple(householdId, payload) {
  return saveLibraryEntry(
    householdId,
    {
      name: payload.name,
      quantity: payload.quantity,
      unit: payload.unit,
      notes: payload.notes,
      section: payload.section,
      priority: payload.priority
    },
    'staple'
  );
}

export async function addLibraryEntryToList(listId, householdId, entry) {
  const item = await addItem(householdId, listId, {
    name: entry.name,
    quantity: entry.default_quantity || entry.quantity || 1,
    unit: entry.default_unit || entry.unit || '',
    notes: entry.notes || '',
    section: entry.default_section || entry.section || 'Other',
    priority: entry.priority || 2,
    source_kind: entry.kind || 'recent'
  });

  if (entry.id && entry.kind) {
    const { error } = await supabase
      .from(LIBRARY)
      .update({
        usage_count: Number(entry.usage_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', entry.id);

    if (error) {
      throw error;
    }
  }

  return item;
}

export async function removeLibraryEntry(entryId) {
  const { error } = await supabase.from(LIBRARY).delete().eq('id', entryId);
  if (error) {
    throw error;
  }
}