import { supabase } from "../config/supabase";
import sessionManager from "../utils/sessionManager";

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
    // console.log("team");
    // console.log(team);

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
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const teamIds = [
        ...new Set(data.filter((p) => p.team_id).map((p) => p.team_id)),
      ];

      if (teamIds.length > 0) {
        const { data: teams, error: teamsError } = await supabase
          .from("teams")
          .select("id, team_name")
          .in("id", teamIds);

        if (!teamsError && teams) {
          const teamMap = teams.reduce((acc, team) => {
            acc[team.id] = team;
            return acc;
          }, {});

          return data.map((player) => ({
            ...player,
            teams: player.team_id ? teamMap[player.team_id] : null,
          }));
        }
      }
    }

    return data;
  },

  create: async (player) => {
    console.log("player ");
    console.log(player);
    player.role = player.role.toLowerCase();

    // console.log("updates");
    // console.log(player);

    const { data, error } = await supabase
      .from("players")
      .insert([{ ...player, status: "available" }])
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

  delete: async (player) => {
    const photoPath = player?.player_photo;
    console.log("photoPath");
    console.log(photoPath);
    if (photoPath) {
      const { error: storageError } = await supabase.storage
        .from("players-photos")
        .remove([photoPath]);

      if (storageError) throw storageError;
    }

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", player.id);
    if (error) throw error;
  },

  // ⭐ ADD THIS FUNCTION
  getByTeam: async (teamId) => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("sold_to", teamId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Fetch team name for response enrichment
    const { data: teamData, error: teamErr } = await supabase
      .from("teams")
      .select("id, team_name")
      .eq("id", teamId)
      .single();

    if (!teamErr && teamData) {
      return data.map((player) => ({
        ...player,
        teams: teamData,
      }));
    }

    return data;
  },
};

// Auction Logs API
export const auctionLogsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("auction_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) throw error;

    // Fetch related players and teams separately
    if (data && data.length > 0) {
      const playerIds = [
        ...new Set(data.filter((l) => l.player_id).map((l) => l.player_id)),
      ];
      const teamIds = [
        ...new Set(data.filter((l) => l.team_id).map((l) => l.team_id)),
      ];

      const promises = [];

      if (playerIds.length > 0) {
        promises.push(
          supabase.from("players").select("id, name").in("id", playerIds)
        );
      }

      if (teamIds.length > 0) {
        promises.push(
          supabase.from("teams").select("id, team_name").in("id", teamIds)
        );
      }

      const results = await Promise.all(promises);
      const playersData = playerIds.length > 0 ? results[0].data : [];
      const teamsData =
        teamIds.length > 0 ? results[playerIds.length > 0 ? 1 : 0].data : [];

      const playerMap = (playersData || []).reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {});

      const teamMap = (teamsData || []).reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
      }, {});

      return data.map((log) => ({
        ...log,
        players: log.player_id ? playerMap[log.player_id] : null,
        teams: log.team_id ? teamMap[log.team_id] : null,
      }));
    }

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
    try {
      // Query admin_users table
      const { data: users, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      // Check for errors
      if (error) {
        console.error("Supabase error:", error);
        throw new Error("Database error. Please check your Supabase setup.");
      }

      // Check if user exists
      if (!users) {
        throw new Error("Invalid email or password");
      }

      // Check password (plain text comparison for now)
      // TODO: Implement proper password hashing with bcrypt
      if (users.password_hash !== password) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      const { error: updateError } = await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", users.id);

      if (updateError) {
        console.warn("Could not update last login:", updateError);
      }

      // Store user in localStorage for session management
      localStorage.setItem("admin_user", JSON.stringify(users));

      // Initialize session timestamp
      sessionManager.initSession();

      return { user: users };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  logout: async () => {
    // Clear user session
    localStorage.removeItem("admin_user");

    // Clear saved credentials (email and password)
    localStorage.removeItem("saved_email");
    localStorage.removeItem("saved_password");

    // Clear session timestamp
    sessionManager.clearSession();

    return Promise.resolve();
  },

  getCurrentUser: async () => {
    // Check if session is valid
    if (!sessionManager.isSessionValid()) {
      sessionManager.clearSession();
      return null;
    }

    // Get user from localStorage
    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      try {
        // Refresh session timestamp on access
        sessionManager.refreshSession();
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
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

export const helperAPI = {
  getAll: async () => {
    const { data, error } = await supabase.from("helper").select("*");

    if (error) throw error;

    // console.log("data");
    // console.log(data);

    return data;
  },
};
