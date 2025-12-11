import React, { useEffect, useState } from "react";
import { Users, UserCircle, TrendingUp, DollarSign } from "lucide-react";
import Card from "../components/Card";
import Loader from "../components/Loader";
import useStore from "../store/useStore";
import { teamsAPI, playersAPI, auctionLogsAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

const Dashboard = () => {
  const { teams, players, auctionLogs, setTeams, setPlayers, setAuctionLogs } =
    useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, playersData, logsData] = await Promise.all([
        teamsAPI.getAll(),
        playersAPI.getAll(),
        auctionLogsAPI.getAll(),
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
      setAuctionLogs(logsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const soldPlayers = players.filter((p) => p.status === "sold");
  const unsoldPlayers = players.filter((p) => p.status === "unsold");
  const totalPointsUsed = teams.reduce(
    (sum, team) => sum + team.points_used,
    0
  );

  const stats = [
    {
      title: "Total Teams",
      value: teams.length,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Total Players",
      value: players.length,
      icon: UserCircle,
      color: "bg-green-500",
    },
    {
      title: "Players Sold",
      value: soldPlayers.length,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Points Used",
      value: formatCurrency(totalPointsUsed),
      icon: DollarSign,
      color: "bg-orange-500",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Teams Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Teams Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const teamPlayers = players.filter((p) => p.team_id === team.id);
            const pointsLeft = team.total_points - team.points_used;
            const percentage = (team.points_used / team.total_points) * 100;

            return (
              <Card key={team.id} hover>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {team.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Players:</span>
                    <span className="font-semibold">{teamPlayers.length}</span>
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
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {percentage.toFixed(1)}% used
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Auction Logs */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Recent Auction Activity
        </h2>
        <Card>
          {auctionLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No auction activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {auctionLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {log.players?.name || "Unknown Player"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {log.teams?.name || "Unknown Team"} - {log.action}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(log.bid_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
