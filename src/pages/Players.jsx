import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Upload, Edit2, Trash2, Filter } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import Table from "../components/Table";
import Loader from "../components/Loader";
import useStore from "../store/useStore";
import { playersAPI, teamsAPI } from "../services/api";
import { formatCurrency, validatePlayer, parseCSV } from "../utils/helpers";

const Players = () => {
  const { teams, setTeams, players, setPlayers, addPlayer, updatePlayer } =
    useStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    base_price: "",
  });
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const roles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const getAllPlayers = await playersAPI.getAll();
      const getAllTeams = await teamsAPI.getAll();
      setTeams(getAllTeams);
      setPlayers(getAllPlayers);
    } catch (error) {
      console.error("Error loading players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (player = null) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({
        name: player.name,
        role: player.role,
        base_price: player.base_price,
      });
    } else {
      setEditingPlayer(null);
      setFormData({ name: "", role: "", base_price: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    setFormData({ name: "", role: "", base_price: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validatePlayer({
      name: formData.name,
      role: formData.role,
      base_price: parseInt(formData.base_price),
    });

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      const playerData = {
        name: formData.name,
        role: formData.role,
        base_price: parseInt(formData.base_price),
      };

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this player?")) return;

    try {
      await playersAPI.delete(id);
      setPlayers(players.filter((p) => p.id !== id));
      toast.success("Player deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete player: " + error.message);
    }
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
    if (filterRole && player.role !== filterRole) return false;
    if (filterStatus && player.status !== filterStatus) return false;
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
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.status === "sold"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
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
            onClick={() => handleDelete(row.id)}
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
          <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={20} className="inline mr-2" />
            Upload CSV
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="inline mr-2" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-600" />
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
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-lg shadow-md">
        <Table columns={columns} data={filteredPlayers} />
      </div>

      {/* Add/Edit Modal */}
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

          <Input
            label="Base Price"
            type="number"
            value={formData.base_price}
            onChange={(e) =>
              setFormData({ ...formData, base_price: e.target.value })
            }
            placeholder="Enter base price"
            required
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
