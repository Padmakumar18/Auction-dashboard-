import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Shuffle, Gavel, X, Check } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Loader from "../components/Loader";
import useStore from "../store/useStore";
import {
  teamsAPI,
  playersAPI,
  auctionLogsAPI,
  helperAPI,
} from "../services/api";
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

  const [helper, setHelper] = useState([]);

  const [bidAmount, setBidAmount] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    loadData();
    loadHelper();
  }, []);

  useEffect(() => {
    if (currentPlayer) {
      // console.log("CurrentPlayer");
      // console.log(currentPlayer);
    }
  }, [currentPlayer]);

  useEffect(() => {
    if (currentBid) {
      setSelectedTeam(currentBid.team_id);
      setBidAmount(currentBid.amount);
    } else {
      setSelectedTeam("");
      setBidAmount(helper && helper.length > 0 ? helper[0].base_price : 0);
    }
  }, [currentBid, helper]);

  const loadHelper = async () => {
    setLoading(true);
    try {
      const data = await helperAPI.getAll();
      setHelper(data);
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

      const [teamsData, playersData] = await Promise.all([
        teamsAPI.getAll(),
        playersAPI.getAll(),
      ]);

      setTeams(teamsData);
      setPlayers(playersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShufflePlayer = async () => {
    const availablePlayers = players.filter((p) => p.status === "available");
    const unsoldPlayers = players.filter((p) => p.status === "unsold");

    // console.log("players");
    // console.log(players);

    const eligiblePlayers =
      availablePlayers.length > 0 ? availablePlayers : unsoldPlayers;

    if (eligiblePlayers.length === 0) {
      toast("No players available for selection!");
      return;
    }

    setShuffling(true);

    const shuffled = shuffleArray(eligiblePlayers);
    let count = 0;

    const interval = setInterval(() => {
      setShuffleDisplay(shuffled[count % shuffled.length]);
      count++;

      if (count >= 20) {
        clearInterval(interval);

        const selectedPlayer = getRandomPlayer(eligiblePlayers);

        if (!selectedPlayer) {
          toast.error("Player selection failed due to data inconsistency.");
          setShuffling(false);
          return;
        }

        setCurrentPlayer(selectedPlayer);
        setShuffleDisplay(null);
        setShuffling(false);

        setSelectedTeam("");
        setCurrentBid(null);

        // console.log("currentPlayer");

        // console.log(currentPlayer);

        // console.log("selectedPlayer");
        // console.log(selectedPlayer);

        setBidAmount(String(selectedPlayer.base_price ?? ""));
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

    // console.log("team");
    // console.log(team);

    if (amount > calculateRecommendedBid(team)) {
      toast.error("Bid exceeds recommended limit");
      return;
    }

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

    const team = teams.find((t) => t.id === currentBid.team_id);
    // console.log("team");
    // console.log(team);

    if (team.players_count === team.max_players) {
      toast.error("Maximum player reached");
      return;
    }

    try {
      await playersAPI.update(currentPlayer.id, {
        status: "sold",
        sold_price: currentBid.amount,
        sold_to: team.id,
        sold_team: team.team_name,
      });

      // console.log("First passed");

      // Update team points
      await teamsAPI.update(team.id, {
        points_used: team.points_used + currentBid.amount,
        balance_players_count: team.balance_players_count - 1,
        players_count: team.players_count + 1,
        points_left: team.points_left - currentBid.amount,
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
        balance_players_count: team.balance_players_count - 1,
        players_count: team.players_count + 1,
        points_left: team.points_left - currentBid.amount,
      });

      // Reset auction state

      // toast.success("Player sold successfully!");
      toast.success(
        `Player has been successfully sold to ${team.team_name} for a price of ${bidAmount}`,
        {
          style: {
            padding: "20px 25px",
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "14px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#000000ff",
            fontSize: "20px",
            fontWeight: 500,
            textAlign: "center",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.4), inset 0 0 12px rgba(255, 170, 65, 0.25)",
          },

          iconTheme: {
            primary: "#00b828ff",
            secondary: "#1a1a1a",
          },
        }
      );

      setCurrentPlayer(null);
      setCurrentBid(null);
      setBidAmount("");
      setSelectedTeam("");
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

      toast.success("Player marked as unsold");
    } catch (error) {
      toast.error("Failed to mark unsold: " + error.message);
    }
  };

  const remainingPlayers = players.filter(
    (p) => p.status === "unsold" || p.status === "available"
  ).length;

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Auction</h1>
          <p className="text-gray-600 mt-1">
            {remainingPlayers} players remaining
          </p>
        </div>
        <Button
          onClick={handleShufflePlayer}
          disabled={shuffling || remainingPlayers === 0}
        >
          <Shuffle size={20} className="inline mr-2" />
          {shuffling ? "Shuffling..." : "Pick Random Player"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-10"> */}
                  {/* LEFT: Player Photo */}
                  <div className="flex justify-start">
                    <div className="bg-blue-100 w-96 h-96 rounded-3xl overflow-hidden flex items-center justify-center shadow-xl">
                      {currentPlayer.player_photo ? (
                        <img
                          src={currentPlayer.player_photo}
                          alt={currentPlayer.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-8xl font-bold text-blue-600">
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

                    <span className="text-lg text-gray-600">Base Price: </span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatCurrency(currentPlayer.base_price)}
                    </span>

                    <div className="space-y-3 text-gray-700 text-lg">
                      {/* {currentPlayer.age && (
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
                      )} */}

                      {/* <div className="mt-4">
                        <span className="text-lg text-gray-600">
                          Base Price:{" "}
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          {formatCurrency(currentPlayer.base_price)}
                        </span>
                      </div> */}
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
                                team.players_count === team.max_players
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

                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isAuctionLocked}
                  />

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

        <div>
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Teams Status
            </h3>
            <div className="space-y-3">
              {teams.map((team) => {
                const pointsLeft = team.total_points - team.points_used;
                const recommendedBid = calculateRecommendedBid(team);

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
                      <p>
                        Recommended max points :{" "}
                        {formatCurrency(recommendedBid)}
                      </p>
                      <p>Total players : {team.players_count}</p>
                      <p>
                        Balance players count : {team.balance_players_count}
                      </p>
                      <p>
                        Points used :{" "}
                        {new Intl.NumberFormat("en-IN").format(
                          team.points_used
                        )}
                      </p>
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
