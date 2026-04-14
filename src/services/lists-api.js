import { supabase } from '../lib/supabase.js';
import { normalizeSection, SECTION_OPTIONS } from '../data/sections.js';

const LISTS = 'app612_aislekin_lists';
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

export async function loadLists(householdId) {
  const { data: lists, error: listsError } = await supabase
    .from(LISTS)
    .select('id, household_id, title, emoji, position, is_archived, created_at')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('position', { ascending: true });

  if (listsError) {
    throw listsError;
  }

  const { data: items, error: itemsError } = await supabase
    .from(ITEMS)
    .select('id, list_id, is_checked')
    .eq('household_id', householdId);

  if (itemsError) {
    throw itemsError;
  }

  const counts = (items || []).reduce((acc, item) => {
    if (!acc[item.list_id]) {
      acc[item.list_id] = { total: 0, done: 0 };
    }
    acc[item.list_id].total += 1;
    if (item.is_checked) {
      acc[item.list_id].done += 1;
    }
    return acc;
  }, {});

  return (lists || []).map((list) => {
    const stats = counts[list.id] || { total: 0, done: 0 };
    return {
      ...list,
      total: stats.total,
      done: stats.done,
      progress: stats.total ? Math.round((stats.done / stats.total) * 100) : 0
    };
  });
}

export async function createList(householdId, title) {
  const user = await getCurrentUser();
  const { data: current } = await supabase
    .from(LISTS)
    .select('position')
    .eq('household_id', householdId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = (current?.[0]?.position || 0) + 1;

  const { data, error } = await supabase
    .from(LISTS)
    .insert({
      household_id: householdId,
      title: title.trim(),
      emoji: '🛒',
      position: nextPosition,
      created_by: user.id
    })
    .select('id, household_id, title, emoji, position, is_archived, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadList(listId) {
  const { data: list, error: listError } = await supabase
    .from(LISTS)
    .select('id, household_id, title, emoji, position, is_archived, created_at, updated_at')
    .eq('id', listId)
    .single();

  if (listError) {
    throw listError;
  }

  const { data: items, error: itemsError } = await supabase
    .from(ITEMS)
    .select(
      'id, household_id, list_id, name, quantity, unit, notes, section, priority, is_checked, sort_order, source_kind, checked_by, checked_at, created_by, created_at, updated_at'
    )
    .eq('list_id', listId)
    .order('is_checked', { ascending: true })
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw itemsError;
  }

  return {
    list,
    items: items || []
  };
}

export async function addItem(householdId, listId, payload) {
  const user = await getCurrentUser();
  const { data: current } = await supabase
    .from(ITEMS)
    .select('sort_order')
    .eq('list_id', listId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (current?.[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from(ITEMS)
    .insert({
      household_id: householdId,
      list_id: listId,
      name: payload.name.trim(),
      quantity: Number(payload.quantity || 1),
      unit: payload.unit?.trim() || null,
      notes: payload.notes?.trim() || null,
      section: normalizeSection(payload.section),
      priority: Number(payload.priority || 2),
      sort_order: nextOrder,
      source_kind: payload.source_kind || 'manual',
      created_by: user.id
    })
    .select(
      'id, household_id, list_id, name, quantity, unit, notes, section, priority, is_checked, sort_order, source_kind, checked_by, checked_at, created_by, created_at, updated_at'
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateItem(itemId, patch) {
  const payload = { ...patch };
  if (payload.name) {
    payload.name = payload.name.trim();
  }
  if (payload.section) {
    payload.section = normalizeSection(payload.section);
  }
  if (payload.quantity !== undefined) {
    payload.quantity = Number(payload.quantity || 1);
  }
  if (payload.priority !== undefined) {
    payload.priority = Number(payload.priority || 2);
  }
  if (payload.unit === '') {
    payload.unit = null;
  }
  if (payload.notes === '') {
    payload.notes = null;
  }

  const { data, error } = await supabase
    .from(ITEMS)
    .update(payload)
    .eq('id', itemId)
    .select(
      'id, household_id, list_id, name, quantity, unit, notes, section, priority, is_checked, sort_order, source_kind, checked_by, checked_at, created_by, created_at, updated_at'
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleItem(item) {
  const user = await getCurrentUser();

  return updateItem(item.id, {
    is_checked: !item.is_checked,
    checked_at: item.is_checked ? null : new Date().toISOString(),
    checked_by: item.is_checked ? null : user.id
  });
}

export async function deleteItem(itemId) {
  const { error } = await supabase.from(ITEMS).delete().eq('id', itemId);
  if (error) {
    throw error;
  }
}

export function filterAndGroupItems(items, { query = '', filter = 'all' } = {}) {
  const needle = query.trim().toLowerCase();

  const filtered = (items || []).filter((item) => {
    const matchesQuery =
      !needle ||
      item.name.toLowerCase().includes(needle) ||
      (item.notes || '').toLowerCase().includes(needle);

    if (!matchesQuery) {
      return false;
    }

    if (filter === 'needed') {
      return !item.is_checked;
    }
    if (filter === 'done') {
      return item.is_checked;
    }
    if (filter === 'high') {
      return item.priority === 1;
    }
    return true;
  });

  const sectionOrder = SECTION_OPTIONS.map((entry) => entry.value);
  const sectionMap = new Map();

  filtered
    .filter((item) => !item.is_checked)
    .forEach((item) => {
      const key = normalizeSection(item.section);
      if (!sectionMap.has(key)) {
        sectionMap.set(key, []);
      }
      sectionMap.get(key).push(item);
    });

  const groups = [...sectionMap.entries()]
    .sort((a, b) => sectionOrder.indexOf(a[0]) - sectionOrder.indexOf(b[0]))
    .map(([section, sectionItems]) => ({
      section,
      items: sectionItems.sort((a, b) => a.sort_order - b.sort_order)
    }));

  const completed = filtered
    .filter((item) => item.is_checked)
    .sort((a, b) => new Date(b.checked_at || b.updated_at) - new Date(a.checked_at || a.updated_at));

  return {
    groups,
    completed,
    remainingCount: items.filter((item) => !item.is_checked).length,
    doneCount: items.filter((item) => item.is_checked).length
  };
}