import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Loader from "../components/Loader";
import useStore from "../store/useStore";
import { teamsAPI } from "../services/api";
import { formatCurrency, validateTeam } from "../utils/helpers";

const Teams = () => {
  const { teams, setTeams, addTeam, updateTeam } = useStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: "", total_points: "" });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamsAPI.getAll();
      setTeams(data);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({ name: team.name, total_points: team.total_points });
    } else {
      setEditingTeam(null);
      setFormData({ name: "", total_points: "" });
    }
    setErrors([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    setFormData({ name: "", total_points: "" });
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateTeam({
      name: formData.name,
      total_points: parseInt(formData.total_points),
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const teamData = {
        name: formData.name,
        total_points: parseInt(formData.total_points),
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
      const errorMessage = error.message || "Failed to save team";
      setErrors([errorMessage]);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;

    try {
      await teamsAPI.delete(id);
      setTeams(teams.filter((t) => t.id !== id));
      toast.success("Team deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete team: " + error.message);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} className="inline mr-2" />
          Add Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const pointsLeft = team.total_points - team.points_used;
          const percentage = (team.points_used / team.total_points) * 100;

          return (
            <Card key={team.id}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(team)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
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
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
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

          <Input
            label="Total Points"
            type="number"
            value={formData.total_points}
            onChange={(e) =>
              setFormData({ ...formData, total_points: e.target.value })
            }
            placeholder="Enter total points"
            required
          />

          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              {errors.map((error, index) => (
                <p key={index} className="text-red-600 text-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCloseModal} type="button">
              Cancel
            </Button>
            <Button type="submit">{editingTeam ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teams;
