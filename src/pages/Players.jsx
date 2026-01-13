import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Upload, Edit2, Trash2, Filter, Grid, List } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import PlayerGrid from "../components/PlayerGrid";
import Select from "../components/Select";
import Table from "../components/Table";
import Loader from "../components/Loader";
import UploadInput from "../components/UploadInput";
import { supabase } from "../config/supabase";
import useStore from "../store/useStore";
import { playersAPI, teamsAPI, helperAPI } from "../services/api";
import { formatCurrency, validatePlayer, parseCSV } from "../utils/helpers";

import { useNavigate } from "react-router-dom";

const Players = () => {
  const {
    teams,
    updateTeam,
    setTeams,
    players,
    setPlayers,
    updatePlayer,
    isAuthenticated,
  } = useStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "table" or "grid"
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    retainedBy: "",
    photoFile: null,
    existingPhoto: null,
  });

  const navigate = useNavigate();

  const [helper, setHelper] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [selectedTeam, setSlectedTeam] = useState(null); // -> Current slected team
  const [isAlreadyRetained, setIsAlreadyRetained] = useState(false); // -> T or F
  const [oldRetainedTeam, setOldRetainedTeam] = useState(null); // -> Old team data

  const [unsoldPlayersCount, setUnsoldPlayersCount] = useState(0);
  const [soldPlayersCount, setSoldPlayersCount] = useState(0);
  const [availablePlayersCount, setAvailablePlayersCount] = useState(0);

  const roles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];

  useEffect(() => {
    loadData();
    loadHelper();
  }, []);

  useEffect(() => {
    console.log("selectedTeam updated:", selectedTeam);
  }, [selectedTeam]);

  useEffect(() => {
    if (!isAuthenticated) {
      const interval = setInterval(() => {
        loadData();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsoldPlayersCount = players
      ? players.filter((p) => p.status === "unsold")
      : 0;

    setUnsoldPlayersCount(unsoldPlayersCount ? unsoldPlayersCount.length : 0);

    const soldPlayersCount = players
      ? players.filter((p) => p.status === "sold")
      : 0;

    setSoldPlayersCount(soldPlayersCount ? soldPlayersCount.length : 0);

    const availablePlayersCount = players
      ? players.filter((p) => p.status === "available")
      : 0;

    setAvailablePlayersCount(
      availablePlayersCount ? availablePlayersCount.length : 0
    );
  }, [players]);

  const loadHelper = async () => {
    if (isAuthenticated) {
      setLoading(true);
    }
    try {
      const data = await helperAPI.getAll();
      setHelper(data);
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

  const loadData = async () => {
    try {
      if (isAuthenticated) {
        setLoading(true);
      }
      const getAllPlayers = await playersAPI.getAll();
      const getAllTeams = await teamsAPI.getAll();
      setTeams(getAllTeams);
      setPlayers(getAllPlayers);

      console.log("players");
      console.log(players);

      console.log("teams");
      console.log(teams);
    } catch (error) {
      console.error("Error loading players:", error);
      if (isAuthenticated) {
        toast.error("Failed to load players");
      }
    } finally {
      if (isAuthenticated) {
        setLoading(false);
      }
    }
  };

  const retainedTeam = (team) => {
    console.log("team");
    console.log(team);
    if (team.retained_playres_count === team.max_retain_players) {
      toast.error("Maximum Retain players reached");
      setFormData({ retainedBy: "" });
      return;
    }
    if (!isAlreadyRetained && team.players_count === team.max_players) {
      toast.error("Maximum players reached");
      setFormData({ retainedBy: "" });
      return;
    }
    setSlectedTeam(team);
    // setFormData({ retainedBy: "" });
  };

  const handleOpenModal = (player = null) => {
    // if (player) {
    if (player.retained_team != null) {
      setIsAlreadyRetained(true);
      setOldRetainedTeam(player.retained_team);
    }
    setEditingPlayer(player);
    const matchedRole =
      roles.find((r) => r.toLowerCase() === player.role.toLowerCase()) || "";

    setFormData({
      name: player.name,
      role: matchedRole,
      photoFile: null,
      retainedBy: player.retained_team,
      existingPhoto: player.player_photo,
    });
    // } else {
    //   setEditingPlayer(null);
    //   setFormData({
    //     name: "",
    //     role: "",
    //     retainedBy: "",
    //     photoFile: null,
    //     existingPhoto: null,
    //   });
    // }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    setFormData({
      name: "",
      role: "",
      photoFile: null,
      existingPhoto: null,
    });
  };

  const handleSubmit = async (e) => {
    const toastId = toast.loading("Submitting...");
    e.preventDefault();
    const validationErrors = validatePlayer({
      name: formData.name,
      role: formData.role,
      photo_file: formData.photoFile,
    });

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    const ROLE_NORMALIZATION_MAP = {
      Batsman: "batsman",
      Bowler: "bowler",
      "All-Rounder": "allrounder",
      "Wicket-Keeper": "wicketkeeper",
    };

    const normalizedRole = ROLE_NORMALIZATION_MAP[formData.role];

    try {
      let photoUrl = formData.existingPhoto;

      if (formData.photoFile) {
        const file = formData.photoFile;
        const filePath = `player_photo/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("player-photos")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error("Photo upload failed. Please retry.");
        }

        const { data: publicUrlData } = supabase.storage
          .from("player-photos")
          .getPublicUrl(filePath);

        photoUrl = publicUrlData.publicUrl;
      }

      const retainingPlayer =
        (!isAlreadyRetained || oldRetainedTeam != null) && selectedTeam != null
          ? {
              sold_to: selectedTeam.id,
              sold_team: selectedTeam.team_name,
              sold_price: helper[0].base_price,
              status: "sold",
              retained_team: selectedTeam.id,
            }
          : {};

      console.log("selectedTeam");
      console.log(selectedTeam);

      console.log("retainingPlayer");
      console.log(retainingPlayer);

      const playerData = {
        name: formData.name,
        role: normalizedRole,
        retained_team: formData.retainedBy,
        player_photo: photoUrl,
        ...retainingPlayer,
      };

      if (!isAlreadyRetained || oldRetainedTeam != null) {
        const teamData = {
          points_left: selectedTeam.points_left - helper[0].base_price,
          points_used: selectedTeam.points_used + helper[0].base_price,
          balance_players_count: selectedTeam.balance_players_count - 1,
          players_count: selectedTeam.players_count + 1,
          retained_playres_count: selectedTeam.retained_playres_count + 1,
        };

        const updated = teamsAPI.update(selectedTeam.id, teamData);
        updateTeam(selectedTeam.id, updated);
      }

      if (oldRetainedTeam != null) {
        const team = teams.find((t) => t.id === oldRetainedTeam);

        const teamData = {
          points_left: team.points_left + helper[0].base_price,
          points_used: team.points_used - helper[0].base_price,
          balance_players_count: team.balance_players_count + 1,
          players_count: team.players_count - 1,
          retained_playres_count: team.retained_playres_count - 1,
        };

        const updated = teamsAPI.update(team.id, teamData);
        updateTeam(team.id, updated);
      }

      console.log("playerData");
      console.log(playerData);

      const updated = await playersAPI.update(editingPlayer.id, playerData);
      updatePlayer(editingPlayer.id, updated);

      toast.success("Player updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to save player");
    } finally {
      toast.dismiss(toastId);
      handleCloseModal();
      setSlectedTeam(null);
      setIsAlreadyRetained(false);
      setOldRetainedTeam(null);
    }
  };

  const handleDelete = async (player) => {
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

                try {
                  await playersAPI.delete(player);
                  setPlayers(players.filter((p) => p.id !== player.id));
                  toast.success("Player deleted successfully!");
                } catch (error) {
                  toast.error(
                    "Failed to delete player: " + (error.message || "")
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingToast = toast.loading("Uploading players...");

    try {
      const parsedPlayers = await parseCSV(file);
      const created = await playersAPI.bulkCreate(parsedPlayers);
      setPlayers([...players, ...created]);
      setIsUploadModalOpen(false);
      toast.success(`Successfully uploaded ${created.length} players!`, {
        id: loadingToast,
      });
    } catch (error) {
      toast.error("Failed to upload CSV: " + error.message, {
        id: loadingToast,
      });
    }
  };

  const filteredPlayers = players.filter((player) => {
    if (
      searchQuery &&
      !player.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    if (filterRole && player.role !== filterRole.toLowerCase()) return false;

    if (filterStatus && player.status !== filterStatus.toLowerCase())
      return false;

    return true;
  });

  const columns = [
    {
      header: "Player Photo",
      accessor: "player_photo",
      isPhoto: true,
      render: (row) => (
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center">
          <img
            src={row.player_photo}
            alt={row.name}
            className="max-w-full max-h-full object-contain rounded-lg bg-white"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/default-avatar.png";
            }}
          />
        </div>
      ),
    },
    { header: "Name", accessor: "name" },
    { header: "Role", accessor: "role" },
    {
      header: "Base Price",
      render: (row) => formatCurrency(row.base_price),
    },
    {
      header: "Sold Price",
      render: (row) => formatCurrency(row.sold_price),
    },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1  font-semibold ${
            row.status === "sold"
              ? "bg-green-100 text-green-800 text-sm"
              : row.status === "unsold"
              ? "bg-red-100 text-red-800 text-sm"
              : "bg-gray-100 text-gray-800 text-sm"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Team",
      render: (row) =>
        teams.find((t) => t.id === row.sold_to)?.team_name || "-",
    },
    ...(isAuthenticated
      ? [
          {
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(row)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(row)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (loading && isAuthenticated) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Players Management</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          {/* View Toggle Buttons */}
          {/* <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List size={18} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Grid size={18} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div> */}

          {/* {isAuthenticated && ( */}
          <Button
            onClick={() => navigate("/teams")}
            className="flex-1 sm:flex-initial"
          >
            {/* <Plus size={20} className="inline mr-2" /> */}
            <span className="hidden sm:inline">View Teams</span>
            {/* <span className="sm:hidden">Add</span> */}
          </Button>
          {/* )} */}
        </div>
      </div>

      {/* Stats Section - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-1">Total Players</p>
          <p className="text-2xl font-bold text-gray-900">
            {players ? players.length : 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-1">Available</p>
          <p className="text-2xl font-bold text-blue-600">
            {availablePlayersCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-1">Sold</p>
          <p className="text-2xl font-bold text-green-600">
            {soldPlayersCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-1">Unsold</p>
          <p className="text-2xl font-bold text-red-600">
            {unsoldPlayersCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Filter size={20} className="text-gray-600 hidden sm:block" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by player name"
            className="mb-0 flex-1 w-full"
          />
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={roles.map((r) => ({ value: r, label: r }))}
            placeholder="Filter by Role"
            className="mb-0 flex-1 w-full sm:w-auto"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: "unsold", label: "Unsold" },
              { value: "sold", label: "Sold" },
              { value: "available", label: "Available" },
            ]}
            placeholder="Filter by Status"
            className="mb-0 flex-1 w-full sm:w-auto"
          />
          <Button
            variant="outline"
            onClick={() => {
              setFilterRole("");
              setFilterStatus("");
              setSearchQuery("");
            }}
            className="w-full sm:w-auto"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Conditional Rendering: Table or Grid */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <Table columns={columns} data={filteredPlayers} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4">
          <PlayerGrid
            data={filteredPlayers}
            teams={teams}
            isAuthenticated={isAuthenticated}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPlayer ? "Edit Player" : "Add New Player"}
      >
        <div>
          <Input
            label="Player Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter player name"
            required
          />

          <Select
            label="Retained By"
            value={formData.retainedBy ?? ""}
            onChange={(e) => {
              const selectedTeamId = e.target.value;
              const selectedTeam = teams.find(
                (team) => team.id === selectedTeamId
              );

              setFormData({
                ...formData,
                retainedBy: selectedTeamId,
              });

              retainedTeam(selectedTeam);
            }}
            options={teams.map((r) => ({
              value: r.id,
              label: r.team_name,
            }))}
            placeholder="Select team"
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={roles.map((r) => ({ value: r, label: r }))}
            placeholder="Select role"
            required
          />

          {formData.existingPhoto && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Current Photo:</p>
              <img
                src={formData.existingPhoto}
                alt="Player"
                className="h-32 w-32 object-cover rounded border"
              />
            </div>
          )}

          <UploadInput
            label="Upload New Photo"
            onChange={(e) =>
              setFormData({ ...formData, photoFile: e.target.files[0] })
            }
          />

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPlayer ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Players CSV"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Upload a CSV file with columns: name, role, base_price
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              CSV Format Example:
            </p>
            <pre className="text-xs text-blue-900">
              name,role,base_price{"\n"}
              Virat Kohli,Batsman,150000{"\n"}
              Jasprit Bumrah,Bowler,120000
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Players;
