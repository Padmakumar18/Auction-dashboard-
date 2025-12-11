import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Card from "../components/Card";
import Loader from "../components/Loader";
import useStore from "../store/useStore";
import { teamsAPI, playersAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

const Analytics = () => {
  const { teams, players, setTeams, setPlayers } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, playersData] = await Promise.all([
        teamsAPI.getAll(),
        playersAPI.getAll(),
      ]);
      setTeams(teamsData);

      // console.log("teams");
      // console.log(teams);

      setPlayers(playersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  // Team spending data
  const teamSpendingData = teams.map((team) => ({
    name: team.name,
    spent: team.points_used,
    remaining: team.total_points - team.points_used,
  }));

  // Role distribution data
  const roleDistribution = players.reduce((acc, player) => {
    acc[player.role] = (acc[player.role] || 0) + 1;
    return acc;
  }, {});

  const roleData = Object.entries(roleDistribution).map(([role, count]) => ({
    name: role,
    value: count,
  }));

  // Player status data
  const soldCount = players.filter((p) => p.status === "sold").length;
  const unsoldCount = players.filter((p) => p.status === "unsold").length;

  const statusData = [
    { name: "Sold", value: soldCount },
    { name: "Unsold", value: unsoldCount },
  ];

  // Team player count
  const teamPlayerData = teams.map((team) => ({
    name: team.name,
    players: players.filter((p) => p.team_id === team.id).length,
  }));

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Analytics & Insights
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-600 mb-1">Total Teams</p>
          <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Total Players</p>
          <p className="text-3xl font-bold text-gray-900">{players.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Players Sold</p>
          <p className="text-3xl font-bold text-green-600">{soldCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Players Unsold</p>
          <p className="text-3xl font-bold text-orange-600">{unsoldCount}</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Spending Chart */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Team Spending Analysis
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamSpendingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
              <Bar dataKey="remaining" fill="#10b981" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Role Distribution Chart */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Player Role Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Player Status Chart */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Player Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Team Player Count Chart */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Players per Team
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamPlayerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="players" fill="#8b5cf6" name="Players" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Team Stats */}
      <div className="mt-8">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Detailed Team Statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Players
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Points Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Points Left
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usage %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teams.map((team) => {
                  const teamPlayers = players.filter(
                    (p) => p.team_id === team.id
                  );
                  const pointsLeft = team.total_points - team.points_used;
                  const usagePercent =
                    (team.points_used / team.total_points) * 100;

                  return (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {team.team_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {teamPlayers.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(team.total_points)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(team.points_used)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                        {formatCurrency(pointsLeft)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {usagePercent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
