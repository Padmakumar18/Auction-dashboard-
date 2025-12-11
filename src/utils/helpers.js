// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate recommended max bid for a team
export const calculateRecommendedBid = (team, remainingPlayers) => {
  if (!team || remainingPlayers <= 0) return 0;
  const pointsLeft = team.total_points - team.points_used;
  return Math.floor(pointsLeft / remainingPlayers);
};

// Shuffle array (Fisher-Yates algorithm)
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get random player from unsold players
export const getRandomPlayer = (players) => {
  const unsoldPlayers = players.filter((p) => p.status === "unsold");
  if (unsoldPlayers.length === 0) return null;
  return unsoldPlayers[Math.floor(Math.random() * unsoldPlayers.length)];
};

// Validate team can afford bid
export const canTeamAffordBid = (team, bidAmount) => {
  const pointsLeft = team.total_points - team.points_used;
  return pointsLeft >= bidAmount;
};

// Get team statistics
export const getTeamStats = (team, players) => {
  const teamPlayers = players.filter((p) => p.team_id === team.id);
  const pointsLeft = team.total_points - team.points_used;
  const playerCount = teamPlayers.length;

  const roleDistribution = teamPlayers.reduce((acc, player) => {
    acc[player.role] = (acc[player.role] || 0) + 1;
    return acc;
  }, {});

  return {
    pointsLeft,
    pointsUsed: team.points_used,
    playerCount,
    roleDistribution,
  };
};

// Parse CSV file
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").filter((line) => line.trim());
        const headers = lines[0].split(",").map((h) => h.trim());

        const players = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const player = {};
          headers.forEach((header, index) => {
            player[header.toLowerCase()] = values[index];
          });
          return {
            name: player.name,
            role: player.role,
            base_price: parseInt(player.base_price || player.baseprice || 0),
          };
        });

        resolve(players);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Export data to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((header) => row[header] || "").join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

// Validate player data
export const validatePlayer = (player) => {
  const errors = [];
  if (!player.name || player.name.trim() === "") {
    errors.push("Player name is required");
  }
  if (!player.role || player.role.trim() === "") {
    errors.push("Player role is required");
  }
  if (!player.base_price || player.base_price <= 0) {
    errors.push("Base price must be greater than 0");
  }
  return errors;
};

// Validate team data
export const validateTeam = (team) => {
  const errors = [];
  if (!team.name || team.name.trim() === "") {
    errors.push("Team name is required");
  }
  if (!team.total_points || team.total_points <= 0) {
    errors.push("Total points must be greater than 0");
  }
  return errors;
};
