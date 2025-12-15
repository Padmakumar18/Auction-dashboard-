import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Shuffle, Gavel, X, Check } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Loader from "../components/Loader";
import useStore from "../store/useStore";
import { teamsAPI, playersAPI, auctionLogsAPI } from "../services/api";
import {
  formatCurrency,
  getRandomPlayer,
  canTeamAffordBid,
  calculateRecommendedBid,
  shuffleArray,
  extractDriveFileId,
} from "../utils/helpers";

const Auction = () => {
  const {
    teams,
    players,
    currentPlayer,
    currentBid,
    isAuctionLocked,
    setTeams,
    setPlayers,
    setCurrentPlayer,
    setCurrentBid,
    addAuctionLog,
    updateTeam,
    updatePlayer,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);
  const [shuffleDisplay, setShuffleDisplay] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

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

      console.log("playersData");
      console.log(playersData);
      setTeams(teamsData);
      setPlayers(playersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShufflePlayer = async () => {
    const unsoldPlayers = players.filter(
      (p) => p.status === "unsold" || p.status === "available"
    );

    if (unsoldPlayers.length === 0) {
      toast("No unsold players available!");
      return;
    }

    setShuffling(true);

    const shuffled = shuffleArray(unsoldPlayers);

    let count = 0;

    const interval = setInterval(() => {
      setShuffleDisplay(shuffled[count % shuffled.length]);
      count++;

      if (count >= 20) {
        clearInterval(interval);

        // FIX 1: select only from unsold list
        const selectedPlayer = getRandomPlayer(unsoldPlayers);

        // FIX 2: null protection
        if (!selectedPlayer) {
          toast.error("Failed to pick a player due to unexpected data issue.");
          setShuffling(false);
          return;
        }

        setCurrentPlayer(selectedPlayer);

        setShuffleDisplay(null);
        setShuffling(false);

        // FIX 3: safe base_price usage
        setBidAmount(String(selectedPlayer.base_price || ""));
      }
    }, 100);
  };

  const handlePlaceBid = async () => {
    if (!selectedTeam || !bidAmount || !currentPlayer) {
      toast.error("Please select a team and enter bid amount");
      return;
    }

    const team = teams.find((t) => t.id === selectedTeam);
    const amount = parseInt(bidAmount);

    if (amount < currentPlayer.base_price) {
      toast.error("Bid amount must be at least the base price");
      return;
    }

    if (!canTeamAffordBid(team, amount)) {
      toast.error("Team does not have enough points!");
      return;
    }

    try {
      // Create auction log
      await auctionLogsAPI.create({
        player_id: currentPlayer.id,
        team_id: team.id,
        bid_amount: amount,
        action: "bid",
      });

      setCurrentBid({ team_id: team.id, amount });
      addAuctionLog({
        player_id: currentPlayer.id,
        team_id: team.id,
        bid_amount: amount,
        action: "bid",
        players: { name: currentPlayer.name },
        teams: { name: team.name },
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      toast.error("Failed to place bid: " + error.message);
    }
  };

  const handleFinalizeSale = async () => {
    if (!currentBid || !currentPlayer) {
      toast.error("No active bid to finalize");
      return;
    }

    // console.log("teams");
    // console.log(teams);

    // console.log("First passed");

    try {
      const team = teams.find((t) => t.id === currentBid.team_id);

      // Update player
      await playersAPI.update(currentPlayer.id, {
        status: "sold",
        sold_price: currentBid.amount,
        sold_to: team.id,
      });

      // console.log("First passed");

      // Update team points
      await teamsAPI.update(team.id, {
        points_used: team.points_used + currentBid.amount,
      });

      // console.log("Second passed");

      // Create final log
      await auctionLogsAPI.create({
        player_id: currentPlayer.id,
        team_id: team.id,
        bid_amount: currentBid.amount,
        action: "sold",
      });

      // console.log("Third passed");

      // Update local state
      updatePlayer(currentPlayer.id, {
        status: "sold",
        sold_price: currentBid.amount,
        team_id: team.id,
      });

      // console.log("Fourth passed");

      updateTeam(team.id, {
        points_used: team.points_used + currentBid.amount,
      });

      // Reset auction state
      setCurrentPlayer(null);
      setCurrentBid(null);
      setBidAmount("");
      setSelectedTeam("");

      toast.success("Player sold successfully!");
    } catch (error) {
      toast.error("Failed to finalize sale: " + error.message);
    }
  };

  const handleMarkUnsold = async () => {
    if (!currentPlayer) return;

    try {
      await playersAPI.update(currentPlayer.id, { status: "unsold" });
      updatePlayer(currentPlayer.id, { status: "unsold" });

      setCurrentPlayer(null);
      setCurrentBid(null);
      setBidAmount("");
      setSelectedTeam("");

      toast("Player marked as unsold");
    } catch (error) {
      toast.error("Failed to mark unsold: " + error.message);
    }
  };

  const unsoldCount = players.filter(
    (p) => p.status === "unsold" || p.status === "available"
  ).length;

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Auction</h1>
          <p className="text-gray-600 mt-1">{unsoldCount} players remaining</p>
        </div>
        <Button
          onClick={handleShufflePlayer}
          // disabled={shuffling || unsoldCount === 0}
        >
          <Shuffle size={20} className="inline mr-2" />
          {shuffling ? "Shuffling..." : "Pick Random Player"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Player Card */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {shuffling ? (
              <div className="text-center py-12">
                <div className="animate-pulse">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {shuffleDisplay?.name || "Shuffling..."}
                  </h2>
                  <p className="text-xl text-gray-600">
                    {shuffleDisplay?.role}
                  </p>
                </div>
              </div>
            ) : currentPlayer ? (
              <div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mb-10">
                  {/* LEFT: Player Photo */}
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-100 w-72 h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg relative">
                      {currentPlayer.player_photo ? (
                        <img
                          src={`https://drive.google.com/uc?export=view&id=${extractDriveFileId(
                            currentPlayer.player_photo
                          )}`}
                          alt={currentPlayer.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span
                          className={`text-7xl font-bold text-blue-600 ${
                            currentPlayer.player_photo ? "hidden" : "block"
                          }`}
                        >
                          {currentPlayer.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Player Details */}
                  <div className="flex-1">
                    <h2 className="text-5xl font-bold text-gray-900 mb-3">
                      {currentPlayer.name}
                    </h2>

                    <p className="text-2xl text-gray-600 mb-6">
                      {currentPlayer.role}
                    </p>

                    <div className="space-y-3 text-gray-700 text-lg">
                      {currentPlayer.age && (
                        <p>
                          <span className="font-semibold">Age:</span>{" "}
                          {currentPlayer.age}
                        </p>
                      )}

                      {currentPlayer.country && (
                        <p>
                          <span className="font-semibold">Country:</span>{" "}
                          {currentPlayer.country}
                        </p>
                      )}

                      {currentPlayer.batting_style && (
                        <p>
                          <span className="font-semibold">Batting Style:</span>{" "}
                          {currentPlayer.batting_style}
                        </p>
                      )}

                      {currentPlayer.bowling_style && (
                        <p>
                          <span className="font-semibold">Bowling Style:</span>{" "}
                          {currentPlayer.bowling_style}
                        </p>
                      )}

                      <div className="mt-4">
                        <span className="text-lg text-gray-600">
                          Base Price:{" "}
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          {formatCurrency(currentPlayer.base_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {currentBid && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-center text-lg">
                      <span className="font-semibold">Current Bid: </span>
                      <span className="text-2xl font-bold text-yellow-700">
                        {formatCurrency(currentBid.amount)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        by{" "}
                        {
                          teams.find((t) => t.id === currentBid.team_id)
                            ?.team_name
                        }
                      </span>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Team Radio Buttons */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Select Team
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {teams.map((team) => {
                        const pointsLeft = team.total_points - team.points_used;
                        const isSelected = selectedTeam === team.id;

                        return (
                          <label
                            key={team.id}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition
                            ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name="team"
                              value={team.id}
                              checked={isSelected}
                              onChange={() => setSelectedTeam(team.id)}
                              disabled={
                                isAuctionLocked ||
                                team.players_count == team.max_player
                              }
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />

                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {team.team_name}
                              </p>
                              <p className="text-xs text-green-700 font-medium">
                                {formatCurrency(pointsLeft)} left
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bid Input */}
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isAuctionLocked}
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handlePlaceBid}
                      className="flex-1"
                      disabled={isAuctionLocked}
                    >
                      <Gavel size={20} className="inline mr-2" />
                      Place Bid
                    </Button>

                    <Button
                      onClick={handleFinalizeSale}
                      variant="secondary"
                      className="flex-1"
                      disabled={!currentBid || isAuctionLocked}
                    >
                      <Check size={20} className="inline mr-2" />
                      Finalize Sale
                    </Button>

                    <Button
                      onClick={handleMarkUnsold}
                      variant="danger"
                      disabled={isAuctionLocked}
                    >
                      <X size={20} className="inline mr-2" />
                      Unsold
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Shuffle size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl">
                  Click "Pick Random Player" to start auction
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Teams Quick View */}
        <div>
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Teams Status
            </h3>
            <div className="space-y-3">
              {teams.map((team) => {
                const pointsLeft = team.total_points - team.points_used;
                const recommendedBid = calculateRecommendedBid(
                  team,
                  unsoldCount
                );

                return (
                  <div key={team.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {team.team_name}
                      </h4>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(pointsLeft)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>Recommended max : {formatCurrency(recommendedBid)}</p>
                      <p>Total players : {team.players_count}</p>
                      <p>Points left : {team.points_left}</p>
                      {/* <p>Recommended max : {formatCurrency(recommendedBid)}</p>
                      <p>Recommended max : {formatCurrency(recommendedBid)}</p> */}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{
                          width: `${
                            (team.points_used / team.total_points) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auction;
