import { useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Lock, Unlock, Download, AlertTriangle } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import useStore from "../store/useStore";
import { teamsAPI, playersAPI, auctionLogsAPI } from "../services/api";
import { exportToCSV } from "../utils/helpers";

const Admin = () => {
  const {
    teams,
    players,
    isAuctionLocked,
    setAuctionLocked,
    setTeams,
    setPlayers,
    setAuctionLogs,
  } = useStore();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetAuction = async () => {
    const loadingToast = toast.loading("Resetting auction...");

    try {
      setLoading(true);

      // Reset all players to unsold
      const resetPromises = players.map((player) =>
        playersAPI.update(player.id, {
          status: "available",
          sold_price: null,
          sold_to: null,
          sold_team: null,
          retained_team: null,
        })
      );

      // Reset all teams points
      const teamResetPromises = teams.map((team) =>
        teamsAPI.update(team.id, {
          points_used: 0,
          points_left: team.total_points,
          balance_players_count: team.max_players,
          players_count: 0,
          group_name: null,
          retained_playres_count: null,
        })
      );

      await Promise.all([...resetPromises, ...teamResetPromises]);

      // Clear auction logs
      await auctionLogsAPI.clear();

      // Reload data
      const [teamsData, playersData] = await Promise.all([
        teamsAPI.getAll(),
        playersAPI.getAll(),
      ]);

      setTeams(teamsData);
      setPlayers(playersData);
      setAuctionLogs([]);

      setIsResetModalOpen(false);
      toast.success("Auction reset successfully!");
    } catch (error) {
      toast.error("Failed to reset auction: " + error.message);
    } finally {
      setLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleExportResults = () => {
    const soldPlayers = players.filter((p) => p.status === "sold");
    const exportData = soldPlayers.map((player) => {
      const team = teams.find((t) => t.id === player.team_id);
      return {
        player_name: player.name,
        role: player.role,
        base_price: player.base_price,
        sold_price: player.sold_price,
        team: team?.name || "N/A",
      };
    });

    exportToCSV(exportData, "auction-results.csv");
  };

  const handleExportTeams = () => {
    const exportData = teams.map((team) => {
      const teamPlayers = players.filter((p) => p.team_id === team.id);
      return {
        team_name: team.name,
        total_points: team.total_points,
        points_used: team.points_used,
        points_remaining: team.total_points - team.points_used,
        players_count: teamPlayers.length,
      };
    });

    exportToCSV(exportData, "team-summary.csv");
  };

  const soldPlayers = players.filter((p) => p.status === "sold");
  const totalSpent = teams.reduce((sum, team) => sum + team.points_used, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Console</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-600 mb-1">Auction Status</p>
          <div className="flex items-center gap-2">
            {isAuctionLocked ? (
              <>
                <Lock size={24} className="text-red-600" />
                <span className="text-xl font-bold text-red-600">Locked</span>
              </>
            ) : (
              <>
                <Unlock size={24} className="text-green-600" />
                <span className="text-xl font-bold text-green-600">Active</span>
              </>
            )}
          </div>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Players Sold</p>
          <p className="text-3xl font-bold text-gray-900">
            {soldPlayers.length} / {players.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Total Amount Spent</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{totalSpent.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Auction Controls
          </h2>
          <div className="space-y-3">
            <Button
              onClick={() => setAuctionLocked(!isAuctionLocked)}
              variant={isAuctionLocked ? "secondary" : "danger"}
              className="w-full"
            >
              {isAuctionLocked ? (
                <>
                  <Unlock size={20} className="inline mr-2" />
                  Unlock Auction
                </>
              ) : (
                <>
                  <Lock size={20} className="inline mr-2" />
                  Lock Auction
                </>
              )}
            </Button>

            <Button
              onClick={() => setIsResetModalOpen(true)}
              variant="danger"
              className="w-full"
            >
              <RefreshCw size={20} className="inline mr-2" />
              Reset Auction
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Export Data</h2>
          <div className="space-y-3">
            <Button
              onClick={handleExportResults}
              variant="outline"
              className="w-full"
            >
              <Download size={20} className="inline mr-2" />
              Export Auction Results
            </Button>

            <Button
              onClick={handleExportTeams}
              variant="outline"
              className="w-full"
            >
              <Download size={20} className="inline mr-2" />
              Export Team Summary
            </Button>
          </div>
        </Card>
      </div>

      {/* Team Details */}
      <div className="mt-8">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Team Rosters</h2>
          <div className="space-y-6">
            {teams.map((team) => {
              const teamPlayers = players.filter((p) => p.team_id === team.id);
              const roleCount = teamPlayers.reduce((acc, player) => {
                acc[player.role] = (acc[player.role] || 0) + 1;
                return acc;
              }, {});

              return (
                <div key={team.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {team.team_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {teamPlayers.length} players | ₹
                        {team.points_used.toLocaleString()} spent | ₹
                        {(
                          team.total_points - team.points_used
                        ).toLocaleString()}{" "}
                        remaining
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-2 text-xs">
                        {Object.entries(roleCount).map(([role, count]) => (
                          <span
                            key={role}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {role}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {teamPlayers.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {teamPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="bg-gray-50 p-2 rounded text-sm"
                        >
                          <p className="font-medium text-gray-900">
                            {player.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {player.role} | ₹
                            {player.sold_price?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Auction"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900 mb-2">
                Warning: This action cannot be undone!
              </p>
              <p className="text-sm text-red-800">
                Resetting the auction will:
              </p>
              <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                <li>Mark all players as unsold</li>
                <li>Reset all team points to 0</li>
                <li>Clear all auction logs</li>
                <li>Remove all player-team associations</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsResetModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleResetAuction}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Yes, Reset Auction"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
