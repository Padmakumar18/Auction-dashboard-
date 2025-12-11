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
      setTeams(teamsData);
      setPlayers(playersData);

      console.log("players");
      console.log(players);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // const handleShufflePlayer = async () => {
  //   const unsoldPlayers = players.filter(
  //     (p) => p.status === "unsold" || p.status === "available"
  //   );
  //   if (unsoldPlayers.length === 0) {
  //     alert("No unsold players available!");
  //     return;
  //   }

  //   setShuffling(true);
  //   const shuffled = shuffleArray(unsoldPlayers);

  //   // Animate shuffle
  //   let count = 0;
  //   const interval = setInterval(() => {
  //     setShuffleDisplay(shuffled[count % shuffled.length]);
  //     count++;

  //     if (count >= 20) {
  //       clearInterval(interval);
  //       const selectedPlayer = getRandomPlayer(players);
  //       setCurrentPlayer(selectedPlayer);
  //       setShuffleDisplay(null);
  //       setShuffling(false);
  //       setBidAmount(selectedPlayer.base_price.toString());
  //     }
  //   }, 100);
  // };

  const handleShufflePlayer = async () => {
    const unsoldPlayers = players.filter(
      (p) => p.status === "unsold" || p.status === "available"
    );

    if (unsoldPlayers.length === 0) {
      alert("No unsold players available!");
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
      alert("Please select a team and enter bid amount");
      return;
    }

    const team = teams.find((t) => t.id === selectedTeam);
    const amount = parseInt(bidAmount);

    if (amount < currentPlayer.base_price) {
      alert("Bid amount must be at least the base price");
      return;
    }

    if (!canTeamAffordBid(team, amount)) {
      alert("Team does not have enough points!");
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
      alert("Failed to place bid: " + error.message);
    }
  };

  const handleFinalizeSale = async () => {
    if (!currentBid || !currentPlayer) {
      alert("No active bid to finalize");
      return;
    }

    try {
      const team = teams.find((t) => t.id === currentBid.team_id);

      // Update player
      await playersAPI.update(currentPlayer.id, {
        status: "sold",
        sold_price: currentBid.amount,
        team_id: team.id,
      });

      // Update team points
      await teamsAPI.update(team.id, {
        points_used: team.points_used + currentBid.amount,
      });

      // Create final log
      await auctionLogsAPI.create({
        player_id: currentPlayer.id,
        team_id: team.id,
        bid_amount: currentBid.amount,
        action: "sold",
      });

      // Update local state
      updatePlayer(currentPlayer.id, {
        status: "sold",
        sold_price: currentBid.amount,
        team_id: team.id,
      });

      updateTeam(team.id, {
        points_used: team.points_used + currentBid.amount,
      });

      // Reset auction state
      setCurrentPlayer(null);
      setCurrentBid(null);
      setBidAmount("");
      setSelectedTeam("");

      alert("Player sold successfully!");
    } catch (error) {
      alert("Failed to finalize sale: " + error.message);
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

      alert("Player marked as unsold");
    } catch (error) {
      alert("Failed to mark unsold: " + error.message);
    }
  };

  const unsoldCount = players.filter((p) => p.status === "unsold").length;

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
                <div className="text-center mb-8">
                  <div className="bg-blue-100 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl font-bold text-blue-600">
                      {currentPlayer.name.charAt(0)}
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">
                    {currentPlayer.name}
                  </h2>
                  <p className="text-xl text-gray-600 mb-4">
                    {currentPlayer.role}
                  </p>
                  <div className="inline-block bg-green-100 px-6 py-2 rounded-full">
                    <span className="text-sm text-gray-600">Base Price: </span>
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(currentPlayer.base_price)}
                    </span>
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
                        {teams.find((t) => t.id === currentBid.team_id)?.name}
                      </span>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isAuctionLocked}
                  >
                    <option value="">Select Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.team_name} -{" "}
                        {formatCurrency(team.total_points - team.points_used)}{" "}
                        left
                      </option>
                    ))}
                  </select>

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
                        {team.name}
                      </h4>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(pointsLeft)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>Recommended max: {formatCurrency(recommendedBid)}</p>
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
