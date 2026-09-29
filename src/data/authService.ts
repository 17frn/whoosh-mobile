import { supabase } from './supabase';
import type { TimelineData, TimelineMoment } from './timeline';

// Helper to generate clean, memorable token keys (e.g., MOMEN-A1B2-C3D4)
export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `MOMEN-${part()}-${part()}`;
}

export interface SessionInfo {
  id: string;
  token: string;
  name: string;
}

// ── Token Auth API ───────────────────────────────────────────────────

/**
 * Creates a brand new cloud-backed session using a unique token
 */
export async function createSession(name: string = 'Timeline Kami'): Promise<SessionInfo> {
  const token = generateToken();
  return createSessionWithToken(token, name);
}

/**
 * Creates a cloud-backed session using a specified token (e.g. for local sharing)
 */
export async function createSessionWithToken(token: string, name: string): Promise<SessionInfo> {
  const cleanToken = token.trim().toUpperCase();
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ token: cleanToken, name }])
    .select()
    .single();

  if (error) throw error;
  return data as SessionInfo;
}


/**
 * Checks and retrieves an existing session by its token
 */
export async function getSessionByToken(token: string): Promise<SessionInfo | null> {
  const cleanToken = token.trim().toUpperCase();
  const { data, error } = await supabase
    .from('sessions')
    .select()
    .eq('token', cleanToken)
    .maybeSingle();

  if (error) throw error;
  return data as SessionInfo | null;
}

// ── Account ↔ Session Linking API ───────────────────────────────────

/**
 * Links a user (by username) to a cloud session so their username
 * appears as a collaborator badge on moments they create.
 */
export async function linkUsernameToSession(username: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .upsert(
      { username: username.toLowerCase(), session_id: sessionId },
      { onConflict: 'username,session_id' }
    );

  if (error) throw error;
}

/**
 * Saves a user alias to Supabase, keyed by a persistent device key + session token.
 * This ensures the alias can be restored even after app reinstall.
 * Uses a special system moment row pattern (like collaborators) but keyed per device.
 */
export async function saveAliasToSession(sessionId: string, deviceKey: string, alias: string): Promise<void> {
  const key = `__ALIAS__${deviceKey}`;
  // Upsert by checking if a row with this key pattern exists
  const { data: existing } = await supabase
    .from('moments')
    .select('id')
    .eq('session_id', sessionId)
    .eq('title', key)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('moments')
      .update({ location: alias })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('moments')
      .insert([{
        session_id: sessionId,
        title: key,
        location: alias,
        date: 'system',
        year: 9999,
        dot_color: '#ffffff',
        rtl: false
      }]);
  }
}

/**
 * Restores a user alias from Supabase using device key + session.
 * Returns null if no alias was previously saved.
 */
export async function restoreAliasFromSession(sessionId: string, deviceKey: string): Promise<string | null> {
  const key = `__ALIAS__${deviceKey}`;
  const { data } = await supabase
    .from('moments')
    .select('location')
    .eq('session_id', sessionId)
    .eq('title', key)
    .maybeSingle();

  return data?.location ?? null;
}

// ── Timeline Cloud Sync API ──────────────────────────────────────────

/**
 * Fetches the entire timeline from the cloud database for a session
 */
export async function getTimelineData(sessionId: string): Promise<TimelineData[]> {
  const { data: moments, error: momentsErr } = await supabase
    .from('moments')
    .select('*')
    .eq('session_id', sessionId)
    .neq('year', 9999)
    .order('created_at', { ascending: false });

  if (momentsErr) throw momentsErr;
  if (!moments || moments.length === 0) return [];

  const momentIds = moments.map(m => m.id);
  const { data: items, error: itemsErr } = await supabase
    .from('moment_items')
    .select('*')
    .in('moment_id', momentIds);

  if (itemsErr) throw itemsErr;

  return moments.map(m => {
    const rawItems = (items || []).filter(i => i.moment_id === m.id);
    const sortedItems = rawItems.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return {
      id: m.id,
      title: m.title,
      location: m.location || '',
      date: m.date || '',
      year: m.year || new Date().getFullYear(),
      dotColor: m.dot_color || 'var(--accent-1)',
      rtl: m.rtl ?? false,
      mapEmbedUrl: m.map_embed_url || undefined,
      latitude: m.latitude || undefined,
      longitude: m.longitude || undefined,
      addedBy: m.added_by || undefined,   // username marker for collaborators
      moments: sortedItems.map(i => ({
        title: i.title || '',
        description: i.description || '',
        image: i.image || '',
        accentColor: i.accent_color || 'var(--accent-1)'
      }))
    };
  });
}

/**
 * Inserts a new moment and its detail items into Supabase.
 * Optional: pass `addedBy` (username) to mark the collaborator.
 */
export async function addMoment(
  sessionId: string,
  moment: Omit<TimelineData, 'id' | 'moments'>,
  items: TimelineMoment[],
  _addedBy?: string
): Promise<void> {
  const insertPayload: any = {
    session_id: sessionId,
    title: moment.title,
    location: moment.location,
    date: moment.date,
    year: moment.year,
    dot_color: moment.dotColor,
    rtl: moment.rtl,
    map_embed_url: moment.mapEmbedUrl,
    latitude: moment.latitude,
    longitude: moment.longitude
  };

  const { data: newMoment, error: momentErr } = await supabase
    .from('moments')
    .insert([insertPayload])
    .select()
    .single();

  if (momentErr) throw momentErr;


  if (items && items.length > 0) {
    const itemsToInsert = items.map(item => ({
      moment_id: newMoment.id,
      title: item.title,
      description: item.description,
      image: item.image,
      accent_color: item.accentColor
    }));

    const { error: itemsErr } = await supabase
      .from('moment_items')
      .insert(itemsToInsert);

    if (itemsErr) throw itemsErr;
  }
}

/**
 * Fetches the list of collaborator aliases for a session.
 */
export async function getCollaborators(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('moments')
    .select('location')
    .eq('session_id', sessionId)
    .eq('title', '__SYSTEM_COLLABORATOR_METADATA__')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch collaborators:', error);
    return [];
  }

  if (data && data.location) {
    try {
      const parsed = JSON.parse(data.location);
      return parsed.collaborators || [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Registers a new alias in the session collaborators metadata.
 * Optionally replaces an old alias if the user changed their name.
 */
export async function registerCollaborator(
  sessionId: string,
  newAlias: string,
  oldAlias?: string
): Promise<string[]> {
  const cleanNew = newAlias.trim();
  if (!cleanNew) return [];

  const current = await getCollaborators(sessionId);
  let updatedList = [...current];

  // If oldAlias is provided and exists in the list, replace or update it
  if (oldAlias && oldAlias.trim()) {
    const idx = updatedList.indexOf(oldAlias.trim());
    if (idx !== -1) {
      updatedList[idx] = cleanNew;
    }
  }

  // Ensure newAlias is in the list and unique
  if (!updatedList.includes(cleanNew)) {
    updatedList.push(cleanNew);
  }

  // Clean duplicate entries if any
  updatedList = Array.from(new Set(updatedList)).filter(Boolean);

  // If list didn't change, just return it without redundant db writes
  if (JSON.stringify(current) === JSON.stringify(updatedList)) {
    return updatedList;
  }

  // Insert updated metadata moment
  const { error } = await supabase
    .from('moments')
    .insert([{
      session_id: sessionId,
      title: '__SYSTEM_COLLABORATOR_METADATA__',
      location: JSON.stringify({ collaborators: updatedList }),
      date: 'system',
      year: 9999,
      dot_color: '#ffffff',
      rtl: false
    }]);

  if (error) {
    console.error('Failed to register collaborator in Supabase:', error);
  }

  return updatedList;
}

/**
 * Removes an alias from the session collaborators metadata.
 */
export async function removeCollaborator(sessionId: string, aliasToRemove: string): Promise<string[]> {
  const current = await getCollaborators(sessionId);
  const updatedList = current.filter(c => c !== aliasToRemove);

  if (current.length === updatedList.length) {
    return current; // Not found, no change
  }

  const { error } = await supabase
    .from('moments')
    .insert([{
      session_id: sessionId,
      title: '__SYSTEM_COLLABORATOR_METADATA__',
      location: JSON.stringify({ collaborators: updatedList }),
      date: 'system',
      year: 9999,
      dot_color: '#ffffff',
      rtl: false
    }]);

  if (error) {
    console.error('Failed to remove collaborator:', error);
  }
  return updatedList;
}


/**
 * Updates metadata fields (title, location, date, etc.) of an existing moment in Supabase.
 */
export async function updateMoment(
  _sessionId: string,
  momentId: string,
  data: {
    title: string;
    location: string;
    date: string;
    year: number;
    dotColor: string;
    rtl: boolean;
    mapEmbedUrl: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('moments')
    .update({
      title: data.title,
      location: data.location,
      date: data.date,
      year: data.year,
      dot_color: data.dotColor,
      rtl: data.rtl,
      map_embed_url: data.mapEmbedUrl,
      latitude: data.latitude,
      longitude: data.longitude
    })
    .eq('id', momentId);

  if (error) throw error;
}

/**
 * Adds a new photo item to an existing moment in Supabase.
 */
export async function addMomentPhoto(
  momentId: string,
  photo: {
    title: string;
    description: string;
    image: string;
    accentColor: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('moment_items')
    .insert([{
      moment_id: momentId,
      title: photo.title,
      description: photo.description,
      image: photo.image,
      accent_color: photo.accentColor
    }]);

  if (error) throw error;
}

/**
 * Clears all photos for a specific moment (used before replacing them with an updated list).
 */
export async function clearMomentPhotos(momentId: string): Promise<void> {
  const { error } = await supabase
    .from('moment_items')
    .delete()
    .eq('moment_id', momentId);

  if (error) throw error;
}

/**
 * Deletes a moment and all its associated photo items from Supabase.
 * moment_items will cascade-delete if FK is set, otherwise we delete them first.
 */
export async function deleteMoment(momentId: string): Promise<void> {
  // Delete child items first (in case no CASCADE is set on the FK)
  const { error: itemsErr } = await supabase
    .from('moment_items')
    .delete()
    .eq('moment_id', momentId);

  if (itemsErr) throw itemsErr;

  const { error } = await supabase
    .from('moments')
    .delete()
    .eq('id', momentId);

  if (error) throw error;
}
