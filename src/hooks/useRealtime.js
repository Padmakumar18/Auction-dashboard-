import { useEffect } from "react";
import {
  subscribeToTeams,
  subscribeToPlayers,
  subscribeToAuctionLogs,
} from "../services/api";
import useStore from "../store/useStore";

// Custom hook for realtime updates
export const useRealtime = () => {
  const { setTeams, setPlayers, setAuctionLogs } = useStore();

  useEffect(() => {
    // Subscribe to teams changes
    const teamsSubscription = subscribeToTeams((payload) => {
      console.log("Teams change:", payload);
      // Refetch teams on any change
      // In production, you'd update the specific team
    });

    // Subscribe to players changes
    const playersSubscription = subscribeToPlayers((payload) => {
      console.log("Players change:", payload);
      // Refetch players on any change
    });

    // Subscribe to auction logs changes
    const logsSubscription = subscribeToAuctionLogs((payload) => {
      console.log("Auction logs change:", payload);
      // Refetch logs on any change
    });

    // Cleanup subscriptions
    return () => {
      teamsSubscription.unsubscribe();
      playersSubscription.unsubscribe();
      logsSubscription.unsubscribe();
    };
  }, [setTeams, setPlayers, setAuctionLogs]);
};
