import { supabase } from '../lib/supabase.js';

const PROFILES = 'app612_aislekin_profiles';
const HOUSEHOLDS = 'app612_aislekin_households';
const MEMBERS = 'app612_aislekin_household_members';
const INVITES = 'app612_aislekin_invites';

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

export async function ensureProfile(displayName = '') {
  const user = await getCurrentUser();
  const payload = {
    user_id: user.id,
    email: user.email || null,
    display_name: displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Household member'
  };

  const { error } = await supabase.from(PROFILES).upsert(payload, { onConflict: 'user_id' });
  if (error) {
    throw error;
  }
}

export async function getMyHouseholdContext() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from(MEMBERS)
    .select(
      'household_id, role, joined_at, household:app612_aislekin_households(id, name, image_path, invite_code, created_by, created_at, updated_at)'
    )
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true });

  if (error) {
    throw error;
  }

  const households = (data || []).map((entry) => ({
    ...entry.household,
    role: entry.role,
    joined_at: entry.joined_at
  }));

  return {
    households,
    activeHousehold: households[0] || null
  };
}

export async function createHousehold(name) {
  const { data, error } = await supabase.rpc('app612_aislekin_create_household', {
    p_name: name.trim()
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function joinHouseholdByCode(code) {
  const { data, error } = await supabase.rpc('app612_aislekin_accept_invite', {
    p_code: code.trim().toUpperCase()
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function createInvite(householdId, email = '') {
  const { data, error } = await supabase.rpc('app612_aislekin_create_invite', {
    p_household_id: householdId,
    p_email: email.trim() || null,
    p_role: 'member'
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function loadHouseholdSettings(householdId) {
  const { data: household, error: householdError } = await supabase
    .from(HOUSEHOLDS)
    .select('id, name, image_path, invite_code, created_by, created_at, updated_at')
    .eq('id', householdId)
    .single();

  if (householdError) {
    throw householdError;
  }

  const { data: members, error: membersError } = await supabase
    .from(MEMBERS)
    .select('id, user_id, role, joined_at')
    .eq('household_id', householdId)
    .order('joined_at', { ascending: true });

  if (membersError) {
    throw membersError;
  }

  const userIds = [...new Set((members || []).map((member) => member.user_id).filter(Boolean))];
  let profileMap = new Map();

  if (userIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from(PROFILES)
      .select('user_id, display_name, email, avatar_path')
      .in('user_id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
  }

  const { data: invites, error: invitesError } = await supabase
    .from(INVITES)
    .select('id, code, email, role, created_at, claimed_at, expires_at, revoked_at')
    .eq('household_id', householdId)
    .is('claimed_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (invitesError) {
    throw invitesError;
  }

  return {
    household,
    members: (members || []).map((member) => ({
      ...member,
      profile: profileMap.get(member.user_id) || null
    })),
    invites: invites || []
  };
}

export async function updateHouseholdDetails(householdId, patch) {
  const payload = {};
  if (typeof patch.name === 'string' && patch.name.trim()) {
    payload.name = patch.name.trim();
  }
  if (typeof patch.image_path === 'string') {
    payload.image_path = patch.image_path;
  }

  const { data, error } = await supabase
    .from(HOUSEHOLDS)
    .update(payload)
    .eq('id', householdId)
    .select('id, name, image_path, invite_code, created_by, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateHouseholdImagePath(householdId, imagePath) {
  return updateHouseholdDetails(householdId, {
    image_path: imagePath
  });
}
