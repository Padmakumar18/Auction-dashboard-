import { supabase } from "../config/supabase";

// Teams API
export const teamsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  create: async (team) => {
    const { data, error } = await supabase
      .from("teams")
      .insert([{ ...team, points_used: 0 }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) throw error;
  },
};

// Players API
export const playersAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*, teams(name)")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  create: async (player) => {
    const { data, error } = await supabase
      .from("players")
      .insert([{ ...player, status: "unsold" }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  bulkCreate: async (players) => {
    const { data, error } = await supabase
      .from("players")
      .insert(players.map((p) => ({ ...p, status: "unsold" })))
      .select();
    if (error) throw error;
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("players")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw error;
  },
};

// Auction Logs API
export const auctionLogsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("auction_logs")
      .select("*, players(name), teams(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  create: async (log) => {
    const { data, error } = await supabase
      .from("auction_logs")
      .insert([log])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  clear: async () => {
    const { error } = await supabase
      .from("auction_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  },
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
};

// Realtime subscriptions
export const subscribeToTeams = (callback) => {
  return supabase
    .channel("teams-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "teams" },
      callback
    )
    .subscribe();
};

export const subscribeToPlayers = (callback) => {
  return supabase
    .channel("players-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players" },
      callback
    )
    .subscribe();
};

export const subscribeToAuctionLogs = (callback) => {
  return supabase
    .channel("auction-logs-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "auction_logs" },
      callback
    )
    .subscribe();
};
