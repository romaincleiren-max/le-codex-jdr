// ============================================================================
// CHARACTERS SERVICE — Gestion des personnages partagés par les joueurs
// ============================================================================

import { supabase } from '../lib/supabase';

// ── Lecture ──────────────────────────────────────────────────────────────────

export const getAllCharacters = async () => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getApprovedCharacters = async () => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('status', 'approved')
    .order('char_name');
  if (error) throw error;
  return data;
};

export const getSessionCharacters = async () => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('status', 'approved')
    .eq('is_in_session', true)
    .order('char_name');
  if (error) throw error;
  return data;
};

export const getPendingCharacters = async () => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

// ── Création (joueurs) ────────────────────────────────────────────────────────

export const submitCharacter = async (characterData) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('characters')
    .insert({
      player_name:    characterData.playerName,
      char_name:      characterData.charName,
      class_name:     characterData.className || '',
      level:          characterData.level || 1,
      race_name:      characterData.raceName || '',
      portrait_url:   characterData.portraitUrl || null,
      portrait_emoji: characterData.portraitEmoji || '⚔',
      sheet_data:     characterData.sheetData || {},
      current_hp:     characterData.currentHp || 0,
      max_hp:         characterData.maxHp || 0,
      ac:             characterData.ac || 10,
      status:         'pending',
      is_in_session:  false,
      user_id:        user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getMyCharacters = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecté');
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const updateCharacter = async (id, updates) => {
  const allowed = [
    'char_name', 'race_name', 'portrait_url', 'portrait_emoji',
    'current_hp', 'max_hp', 'ac', 'sheet_data', 'notes',
  ];
  const clean = {};
  allowed.forEach(k => { if (updates[k] !== undefined) clean[k] = updates[k]; });
  const { data, error } = await supabase
    .from('characters')
    .update(clean)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Montée de niveau (admin) ──────────────────────────────────────────────────

export const grantLevelUp = async (id) => {
  const { data, error } = await supabase
    .from('characters')
    .update({ level_up_pending: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const revokeLevelUp = async (id) => {
  const { data, error } = await supabase
    .from('characters')
    .update({ level_up_pending: false })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getAllCharactersWithUsers = async () => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('player_name', { ascending: true });
  if (error) throw error;
  return data;
};

// ── Mise à jour admin ─────────────────────────────────────────────────────────

export const approveCharacter = async (id) => {
  const { data, error } = await supabase
    .from('characters')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const rejectCharacter = async (id) => {
  const { data, error } = await supabase
    .from('characters')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCharacter = async (id) => {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const toggleSession = async (id, inSession) => {
  const { data, error } = await supabase
    .from('characters')
    .update({ is_in_session: inSession })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCombatStats = async (id, updates) => {
  const allowed = ['current_hp', 'initiative_roll', 'conditions', 'notes', 'is_in_session'];
  const clean = {};
  allowed.forEach(k => { if (updates[k] !== undefined) clean[k] = updates[k]; });
  const { data, error } = await supabase
    .from('characters')
    .update(clean)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCharacterPortrait = async (id, portraitUrl) => {
  const { data, error } = await supabase
    .from('characters')
    .update({ portrait_url: portraitUrl })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Abonnement temps réel ─────────────────────────────────────────────────────

export const subscribeToSessionChanges = (callback) => {
  return supabase
    .channel('characters-session')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'characters',
    }, callback)
    .subscribe();
};
