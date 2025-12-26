import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Upload, Edit2, Trash2, Filter } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import Table from "../components/Table";
import Loader from "../components/Loader";
import UploadInput from "../components/UploadInput";
import { supabase } from "../config/supabase";
import useStore from "../store/useStore";
import { playersAPI, teamsAPI, helperAPI } from "../services/api";
import { formatCurrency, validatePlayer, parseCSV } from "../utils/helpers";

const Players = () => {
  const { teams, setTeams, players, setPlayers, addPlayer, updatePlayer } =
    useStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    photoFile: null, // holds the raw File object
    existingPhoto: null, // holds Supabase public URL after upload
  });

  const [helper, setHelper] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [unsoldPlayersCount, setUnsoldPlayersCount] = useState(0);
  const [soldPlayersCount, setSoldPlayersCount] = useState(0);
  const [availablePlayersCount, setAvailablePlayersCount] = useState(0);

  const roles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];

  useEffect(() => {
    loadData();
    loadHelper();
  }, []);

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
    setLoading(true);
    try {
      const data = await helperAPI.getAll();
      setHelper(data);

      // console.log("helper");
      // console.log(helper);
    } catch (error) {
      console.error("Helper load failed:", error);
      toast.error("Failed to load helper");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const getAllPlayers = await playersAPI.getAll();
      const getAllTeams = await teamsAPI.getAll();
      setTeams(getAllTeams);
      setPlayers(getAllPlayers);

      // console.log("players");
      // console.log(players);
    } catch (error) {
      console.error("Error loading players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  // const handleOpenModal = (player = null) => {
  //   if (player) {
  //     setEditingPlayer(player);
  //     setFormData({
  //       name: player.name,
  //       role: player.role,
  //       photoLink: player.player_photo,
  //     });
  //   } else {
  //     setEditingPlayer(null);
  //     setFormData({ name: "", role: "", photoLink: "" });
  //   }
  //   setIsModalOpen(true);
  // };

  const handleOpenModal = (player = null) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({
        name: player.name,
        role: player.role,
        photoFile: null, // new file if chosen
        existingPhoto: player.player_photo, // store existing Supabase URL
      });
    } else {
      setEditingPlayer(null);
      setFormData({
        name: "",
        role: "",
        photoFile: null,
        existingPhoto: null,
      });
    }
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
    e.preventDefault();

    // -----------------------------
    // Validation Layer
    // -----------------------------
    const validationErrors = validatePlayer({
      name: formData.name,
      role: formData.role,
      photo_file: formData.photoFile, // required for upload
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
      // -------------------------------------------------
      // 1. Upload photo to Supabase bucket
      // -------------------------------------------------
      // let photoUrl = null;

      let photoUrl = formData.existingPhoto; // default = existing

      if (formData.photoFile) {
        const file = formData.photoFile;
        // console.log("file");
        // console.log(file);

        const filePath = `players/${Date.now()}_${file.name}`;
        // console.log("filePath");
        // console.log(filePath);

        const { error: uploadError } = await supabase.storage
          .from("player-photos")
          .upload(filePath, file);

        // console.log("error");
        // console.log(error);

        console.log("uploadError");
        console.log(uploadError);

        if (uploadError) {
          throw new Error("Photo upload failed. Please retry.");
        }

        const { data: publicUrlData } = supabase.storage
          .from("player-photos")
          .getPublicUrl(filePath);

        photoUrl = publicUrlData.publicUrl;
      }

      // -------------------------------------------------
      // 2. Prepare player object for API
      // -------------------------------------------------
      const playerData = {
        name: formData.name,
        role: normalizedRole,
        base_price: parseInt(helper[0].base_price),
        player_photo: photoUrl, // <-- dynamic Supabase URL
      };

      // -------------------------------------------------
      // 3. Persist to your backend
      // -------------------------------------------------
      if (editingPlayer) {
        const updated = await playersAPI.update(editingPlayer.id, playerData);
        updatePlayer(editingPlayer.id, updated);
        toast.success("Player updated successfully!");
      } else {
        const created = await playersAPI.create(playerData);
        addPlayer(created);
        toast.success("Player created successfully!");
      }

      handleCloseModal();
    } catch (error) {
      toast.error(error.message || "Failed to save player");
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const validationErrors = validatePlayer({
  //     name: formData.name,
  //     role: formData.role,
  //     // player_photo: formData.photoLink,
  //     photo_file: formData.photoFile,
  //   });

  //   if (validationErrors.length > 0) {
  //     validationErrors.forEach((error) => toast.error(error));
  //     return;
  //   }

  //   const ROLE_NORMALIZATION_MAP = {
  //     Batsman: "batsman",
  //     Bowler: "bowler",
  //     "All-Rounder": "allrounder",
  //     "Wicket-Keeper": "wicketkeeper",
  //   };
  //   const normalizedRole = ROLE_NORMALIZATION_MAP[formData.role];

  //   try {
  //     const playerData = {
  //       name: formData.name,
  //       role: normalizedRole,
  //       base_price: parseInt(helper[0].base_price),
  //       player_photo: formData.photoLink,
  //     };

  //     if (editingPlayer) {
  //       const updated = await playersAPI.update(editingPlayer.id, playerData);
  //       updatePlayer(editingPlayer.id, updated);
  //       toast.success("Player updated successfully!");
  //     } else {
  //       const created = await playersAPI.create(playerData);
  //       addPlayer(created);
  //       toast.success("Player created successfully!");
  //     }

  //     handleCloseModal();
  //   } catch (error) {
  //     toast.error(error.message || "Failed to save player");
  //   }
  // };

  const handleDelete = async (player) => {
    console.log("row");
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

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Are you sure you want to delete this player?")) return;

  //   try {
  //     await playersAPI.delete(id);
  //     setPlayers(players.filter((p) => p.id !== id));
  //     toast.success("Player deleted successfully!");
  //   } catch (error) {
  //     toast.error("Failed to delete player: " + error.message);
  //   }
  // };

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

  // console.log(
  //   teams.find((t) => t.id === "2a810c8d-6721-4653-8344-90b1f29878e0").team_name
  // );

  const columns = [
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
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Players Management</h1>
        <div className="flex gap-3">
          {/* <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={20} className="inline mr-2" />
            Upload CSV
          </Button> */}
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="inline mr-2" />
            Add Player
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-8">
        <p className="text-lg text-gray-900">
          Total Players - {players ? players.length : 0}
        </p>
        <p className="text-lg text-gray-900">
          Available Players - {availablePlayersCount}
        </p>
        <p className="text-lg text-gray-900">
          Sold Players - {soldPlayersCount}
        </p>
        <p className="text-lg text-gray-900">
          Unsold Players - {unsoldPlayersCount}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-600" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by player name"
            className="mb-0 flex-1"
          />
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={roles.map((r) => ({ value: r, label: r }))}
            placeholder="Filter by Role"
            className="mb-0 flex-1"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: "unsold", label: "Unsold" },
              { value: "sold", label: "Sold" },
            ]}
            placeholder="Filter by Status"
            className="mb-0 flex-1"
          />
          <Button
            variant="outline"
            onClick={() => {
              setFilterRole("");
              setFilterStatus("");
              setSearchQuery("");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <Table columns={columns} data={filteredPlayers} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPlayer ? "Edit Player" : "Add New Player"}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Player Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter player name"
            required
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={roles.map((r) => ({ value: r, label: r }))}
            placeholder="Select role"
            required
          />

          {/* Preview existing photo */}
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

          {/* Upload new photo */}
          <UploadInput
            label="Upload New Photo"
            onChange={(e) =>
              setFormData({ ...formData, photoFile: e.target.files[0] })
            }
          />

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCloseModal} type="button">
              Cancel
            </Button>
            <Button type="submit">{editingPlayer ? "Update" : "Create"}</Button>
          </div>
        </form>
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
