import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Search } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Loader from "../components/Loader";
import useStore from "../store/useStore";
import { teamsAPI, playersAPI, helperAPI } from "../services/api";
import {
  formatCurrency,
  validateTeam,
  calculateRecommendedBid,
} from "../utils/helpers";

import { useNavigate } from "react-router-dom";

const Teams = () => {
  const {
    players,
    teams,
    setTeams,
    updatePlayer,
    addTeam,
    updateTeam,
    isAuthenticated,
  } = useStore();
  const [helper, setHelper] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [formData, setFormData] = useState({ name: "", total_points: "" });

  const [searchQuery, setSearchQuery] = useState("");

  // PLAYERS MODAL
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState([]);
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [isTeamDetailsModalOpen, setIsTeamDetailsModalOpen] = useState(false);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null);

  useEffect(() => {
    loadTeams();
    loadHelper();
  }, []);

  // Auto-refresh every 15 seconds when not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Yessss");
      const interval = setInterval(() => {
        loadTeams();
      }, 15000); // 15 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const filteredTeams = teams.filter((team) =>
    team.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadTeams = async () => {
    try {
      // Only show loading spinner if authenticated
      if (isAuthenticated) {
        setLoading(true);
      }
      const data = await teamsAPI.getAll();
      setTeams(data);

      // console.log("data");
      // console.log(data);
    } catch (error) {
      console.error("Error loading teams:", error);
      if (isAuthenticated) {
        toast.error("Failed to load teams");
      }
    } finally {
      if (isAuthenticated) {
        setLoading(false);
      }
    }
  };

  const loadHelper = async () => {
    if (isAuthenticated) {
      setLoading(true);
    }
    try {
      const data = await helperAPI.getAll();
      setHelper(data);

      // console.log("helper");
      // console.log(helper);
    } catch (error) {
      console.error("Helper load failed:", error);
      if (isAuthenticated) {
        toast.error("Failed to load helper");
      }
    } finally {
      if (isAuthenticated) {
        setLoading(false);
      }
    }
  };

  const handleOpenModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.team_name,
        total_points: helper[0].total_points,
      });
    } else {
      setEditingTeam(null);
      setFormData({ name: "", total_points: "" });
    }
    setIsModalOpen(true);
  };

  const handleViewTeamDetails = (team) => {
    setSelectedTeamDetails(team);
    setIsTeamDetailsModalOpen(true);
  };

  const closeTeamDetailsModal = () => {
    setIsTeamDetailsModalOpen(false);
    setSelectedTeamDetails(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    setFormData({ name: "", total_points: "" });
  };

  const handleDeletePlayer = (player) => {
    console.log("player");
    console.log(player);
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-white-900">
            Are you sure you want to delete this player?
          </p>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 text-sm bg-gray-200 text-black rounded"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>

            <button
              className="px-3 py-1 text-sm bg-red-600 text-white rounded"
              onClick={async () => {
                toast.dismiss(t.id);
                const loading = toast.loading("Loading...");

                try {
                  const team = teams.find((t) => t.id === player.sold_to);

                  const teamData =
                    player.retained_team != null
                      ? {
                          points_left: team.points_left + helper[0].base_price,
                          points_used: team.points_used - helper[0].base_price,
                          balance_players_count: team.balance_players_count + 1,
                          players_count: team.players_count - 1,
                          retained_playres_count:
                            team.retained_playres_count - 1,
                        }
                      : {
                          points_left: team.points_left + player.sold_price,
                          points_used: team.points_used - player.sold_price,
                          balance_players_count: team.balance_players_count + 1,
                          players_count: team.players_count - 1,
                        };

                  const updatedTeam = await teamsAPI.update(team.id, teamData);
                  updateTeam(team.id, updatedTeam);

                  const playerData = {
                    retained_team: null,
                    sold_to: null,
                    sold_team: null,
                    sold_price: null,
                    status: "available",
                    retained_team: null,
                  };

                  const updated = await playersAPI.update(
                    player.id,
                    playerData
                  );
                  updatePlayer(player.id, updated);

                  toast.success("Player deleted successfully!");
                } catch (error) {
                  toast.error(
                    "Failed to delete player: " + (error.message || "")
                  );
                } finally {
                  toast.dismiss(loading);
                  closePlayersModal();
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateTeam({
      name: formData.name,
      total_points: parseInt(helper[0].total_points),
    });

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      const teamData = {
        team_name: formData.name,
        total_points: parseInt(helper[0].total_points),
        points_used: 0,
        points_left: parseInt(helper[0].total_points),
        players_count: 0,
        max_players: parseInt(helper[0].max_players),
        max_retain_players: parseInt(helper[0].max_retain_players),
        balance_players_count: parseInt(helper[0].max_players),
      };

      if (editingTeam) {
        const updated = await teamsAPI.update(editingTeam.id, teamData);
        updateTeam(editingTeam.id, updated);
        toast.success("Team updated successfully!");
      } else {
        const created = await teamsAPI.create(teamData);
        addTeam(created);
        toast.success("Team created successfully!");
      }

      handleCloseModal();
    } catch (error) {
      toast.error(error.message || "Failed to save team");
    }
  };

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Are you sure you want to delete this team?")) return;

  //   try {
  //     await teamsAPI.delete(id);
  //     setTeams(teams.filter((t) => t.id !== id));
  //     toast.success("Team deleted successfully!");
  //   } catch (error) {
  //     toast.error("Failed to delete team: " + error.message);
  //   }
  // };

  const handleDelete = async (id) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-white-900">
            Are you sure you want to delete this team?
          </p>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 text-sm bg-gray-200 text-black rounded"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>

            <button
              className="px-3 py-1 text-sm bg-red-600 text-white rounded"
              onClick={async () => {
                toast.dismiss(t.id);

                try {
                  await teamsAPI.delete(id);
                  setTeams(teams.filter((t) => t.id !== id));
                  toast.success("Team deleted successfully!");
                } catch (error) {
                  toast.error(
                    "Failed to delete team: " + (error.message || "")
                  );
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // ---------------------------
  // VIEW ALL PLAYERS FEATURE
  // ---------------------------
  const handleViewPlayers = async (team) => {
    try {
      const players = await playersAPI.getByTeam(team.id);

      // console.log("players");
      // console.log(players);

      const sortedPlayers = players.sort((a, b) => b.base_price - a.base_price);

      setSelectedTeamPlayers(sortedPlayers);
      setSelectedTeamName(team);

      setIsPlayersModalOpen(true);
    } catch (error) {
      toast.error("Failed to load players");
    }
  };

  const closePlayersModal = () => {
    setIsPlayersModalOpen(false);
    setSelectedTeamPlayers([]);
  };

  // Only show loader when authenticated
  if (loading && isAuthenticated) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
        {isAuthenticated && (
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="inline mr-2" />
            Add Team
          </Button>
        )}
        {/* {isAuthenticated && ( */}
        <Button onClick={() => navigate("/players")}>View Players</Button>
        {/* )} */}
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <Input
          placeholder="Search team by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={16} />}
          className="w-full"
        />
      </div>

      {/* Teams Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredTeams &&
          filteredTeams.length > 0 &&
          filteredTeams.map((team) => {
            const pointsLeft = team.total_points - team.points_used;
            const percentage = (team.points_used / team.total_points) * 100;

            return (
              <Card key={team.id} className="mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {team.team_name}
                  </h3>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewTeamDetails(team)}
                      className="text-white bg-green-500 px-4 py-1 rounded text-md"
                      title="View Team Details"
                    >
                      Team Info
                    </button>
                    {isAuthenticated && (
                      <>
                        <button
                          onClick={() => handleOpenModal(team)}
                          className="text-white bg-blue-500 px-4 rounded text-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Players Count:</span>
                    <span className="font-semibold text-green-600">
                      {team.players_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Remaining players count:
                    </span>
                    <span className="font-semibold text-green-600">
                      {team.balance_players_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Points:</span>
                    <span className="font-semibold">
                      {formatCurrency(team.total_points)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Points Used:</span>
                    <span className="font-semibold">
                      {formatCurrency(team.points_used)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Points Left:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(pointsLeft)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Recommended Max Points :
                    </span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(calculateRecommendedBid(team))}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {percentage.toFixed(1)}% used
                    </p>
                  </div>

                  <div>
                    <Button
                      variant="outline"
                      onClick={() => handleViewPlayers(team)}
                    >
                      View Players
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>

      <Modal
        isOpen={isTeamDetailsModalOpen}
        onClose={closeTeamDetailsModal}
        title={`Team Details - ${selectedTeamDetails?.team_name}`}
        size="md"
      >
        {selectedTeamDetails && (
          <div className="w-full">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-transparent">
                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Total Points
                  </td>
                  <td className="py-2 font-semibold text-gray-900">
                    {formatCurrency(selectedTeamDetails.total_points)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Total Points
                  </td>
                  <td className="py-2 font-semibold text-gray-900">
                    {formatCurrency(selectedTeamDetails.total_points)}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Points Used
                  </td>
                  <td className="py-2 font-semibold text-gray-900">
                    {formatCurrency(selectedTeamDetails.points_used)}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Points Left
                  </td>
                  <td className="py-2 font-semibold text-green-700">
                    {formatCurrency(
                      selectedTeamDetails.total_points -
                        selectedTeamDetails.points_used
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Recommended Max Points
                  </td>
                  <td className="py-2 font-semibold text-green-700">
                    {formatCurrency(
                      calculateRecommendedBid(selectedTeamDetails)
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Players Count
                  </td>
                  <td className="py-2 font-semibold text-gray-900">
                    {selectedTeamDetails.players_count}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Remaining Players
                  </td>
                  <td className="py-2 font-semibold text-gray-900">
                    {selectedTeamDetails.balance_players_count}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Max Players
                  </td>
                  <td className="py-2 font-semibold text-gray-900">
                    {selectedTeamDetails.max_players}
                  </td>
                </tr>

                {/* {selectedTeamDetails.retain_player && ( */}
                <tr>
                  <td className="py-2 font-medium text-gray-600">
                    Retained Player
                  </td>
                  <td className="py-2 font-semibold text-red-600">
                    {players.filter(
                      (t) => t.id === selectedTeamDetails.retain_player
                    ).name ?? "-"}
                    {/* const team = teams.find((t) => t.id === selectedTeam); */}
                  </td>
                </tr>
                {/* )} */}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {teams && teams.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
          <p className="text-lg font-medium">No teams available</p>
          <p className="text-sm">Create a team to get started</p>
        </div>
      )}

      {/* Add / Edit Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTeam ? "Edit Team" : "Add New Team"}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter team name"
            required
          />

          {/* <Input
            label="Total Points"
            type="number"
            value={formData.total_points}
            onChange={(e) =>
              setFormData({ ...formData, total_points: e.target.value })
            }
            placeholder="Enter total points"
            required
          /> */}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCloseModal} type="button">
              Cancel
            </Button>
            <Button type="submit">{editingTeam ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* PLAYERS MODAL */}
      <Modal
        isOpen={isPlayersModalOpen}
        onClose={closePlayersModal}
        title={`Players - ${selectedTeamName.team_name}`}
      >
        {selectedTeamPlayers && selectedTeamPlayers.length !== 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedTeamPlayers.map((player) => (
              <div
                key={player.id}
                className="relative border rounded-lg p-3 shadow-sm bg-white"
              >
                {/* Delete Icon */}
                {isAuthenticated && (
                  <button
                    onClick={() => handleDeletePlayer(player)}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition"
                    title="Delete Player"
                  >
                    <Trash2 size={20} />
                  </button>
                )}

                <div className="w-40 h-40 mb-4 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <img
                    src={player.player_photo}
                    alt={player.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                {selectedTeamName?.id === player.retained_team && (
                  <p className="font-bold text-red-600 mb-2">Retain Player</p>
                )}

                <p className="font-bold text-gray-900">{player.name}</p>
                <p className="text-sm text-gray-600">Role: {player.role}</p>
                <p className="text-sm font-semibold text-blue-700">
                  Base Price: {formatCurrency(player.base_price)}
                </p>
                <p className="text-sm font-semibold text-green-700">
                  Sold Price: {formatCurrency(player.sold_price)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">No players</div>
        )}
      </Modal>
    </div>
  );
};

export default Teams;
