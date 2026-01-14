import React, { useState, useEffect } from "react";
import useStore from "../store/useStore";
import { Shuffle, X, Calendar, Users, ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { useRef } from "react";

export default function TeamLot() {
  const {
    teams,
    updateTeam,
    setTeams,
    players,
    setPlayers,
    updatePlayer,
    isAuthenticated,
  } = useStore();
  const fixturesRef = useRef(null);
  const groupsRef = useRef(null);

  const totalTeams = teams.length;
  const [step, setStep] = useState(1);
  const [numGroups, setNumGroups] = useState("");
  const [teamsPerGroup, setTeamsPerGroup] = useState("");
  const [availableTeams, setAvailableTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [shuffledTeam, setShuffledTeam] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [fixtures, setFixtures] = useState([]);

  const generateRoundRobin = (teamList) => {
    const matches = [];
    const n = teamList.length;

    if (n < 2) return matches;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        matches.push({
          team1: teamList[i],
          team2: teamList[j],
          matchNumber: matches.length + 1,
        });
      }
    }

    return matches;
  };

  const exportSectionAsImage = async (ref, fileName) => {
    if (!ref?.current) return;

    try {
      const dataUrl = await toPng(ref.current, {
        quality: 1,
        pixelRatio: 6,
        backgroundColor: "#f0f9ff",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image export failed", err);
    }
  };

  // Generate fixtures for all groups
  const generateAllFixtures = () => {
    const allFixtures = groups.map((group, idx) => {
      let matches = generateRoundRobin(group);

      // Shuffle matches using Fisher-Yates
      for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
      }

      // Reassign matchNumber sequentially after shuffle
      matches = matches.map((match, index) => ({
        ...match,
        matchNumber: index + 1,
      }));

      return {
        groupNumber: idx + 1,
        matches,
      };
    });

    setFixtures(allFixtures);
    setStep(4);
  };

  // Calculate possible group configurations
  const getGroupOptions = () => {
    const options = [];
    for (let i = 1; i < totalTeams; i++) {
      if (totalTeams % i === 0) {
        options.push({
          groups: i,
          teamsPerGroup: totalTeams / i,
        });
      }
    }
    return options;
  };

  const groupOptions = getGroupOptions();

  const handleStart = () => {
    const ng = parseInt(numGroups);
    const tpg = parseInt(teamsPerGroup);

    if (ng > 0 && tpg > 0) {
      if (ng === 1) {
        // Special case: only one group, assign all teams directly
        setGroups([[...teams]]);
        setAvailableTeams([]);
        setStep(3); // Skip to final groups directly
      } else {
        // Multiple groups: go through normal lottery process
        setAvailableTeams([...teams]);
        setGroups(Array.from({ length: ng }, () => []));
        setStep(2);
      }
    }
  };

  const shuffleTeam = () => {
    if (availableTeams.length === 0) return;

    setIsShuffling(true);
    let count = 0;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableTeams.length);
      setShuffledTeam(availableTeams[randomIndex]);
      count++;

      if (count > 30) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * availableTeams.length);
        setShuffledTeam(availableTeams[finalIndex]);
        setIsShuffling(false);
      }
    }, 100);
  };

  const assignTeamToGroup = (groupIndex) => {
    if (shuffledTeam === null) return;

    const newGroups = [...groups];

    if (newGroups[groupIndex].length >= parseInt(teamsPerGroup)) {
      return;
    }

    newGroups[groupIndex].push(shuffledTeam);
    setGroups(newGroups);

    const newAvailableTeams = availableTeams.filter(
      (t) => t.id !== shuffledTeam.id
    );

    setAvailableTeams(newAvailableTeams);

    const groupsCompleted = newGroups.filter(
      (g) => g.length === parseInt(teamsPerGroup)
    ).length;
    const isLastGroupRemaining = groupsCompleted === parseInt(numGroups) - 1;

    if (isLastGroupRemaining && newAvailableTeams.length > 0) {
      const lastGroupIdx = newGroups.findIndex(
        (g) => g.length < parseInt(teamsPerGroup)
      );
      newGroups[lastGroupIdx].push(...newAvailableTeams);
      setGroups(newGroups);
      setAvailableTeams([]);
      setStep(3);
      return;
    }

    setShuffledTeam(null);

    if (newAvailableTeams.length === 0) {
      setStep(3);
    }
  };

  const removeTeamFromGroup = (groupIndex, team) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = newGroups[groupIndex].filter(
      (t) => t.id !== team.id
    );
    setGroups(newGroups);

    const newAvailableTeams = [...availableTeams, team];
    setAvailableTeams(newAvailableTeams);

    if (step === 3) {
      setStep(2);
    }
  };

  const reset = () => {
    setStep(1);
    setNumGroups("");
    setTeamsPerGroup("");
    setAvailableTeams([]);
    setGroups([]);
    setShuffledTeam(null);
    setIsShuffling(false);
    setFixtures([]);
  };

  // Function to get teams that are NOT in any group
  const getRemainingTeamsList = () => {
    // Flatten all teams currently in groups
    const teamsInGroups = groups.flat();
    const teamIdsInGroups = teamsInGroups.map((team) => team.id);

    // Return teams that are not in any group
    return teams.filter((team) => !teamIdsInGroups.includes(team.id));
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-sky-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-sky-700">
          Team Lot & Fixtures
        </h1>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-sky-100">
            <h1 className="text-2xl mb-4">
              Total Teams :{" "}
              <span className="font-semibold">{teams.length}</span>
            </h1>

            <div className="space-y-6">
              <div className="bg-sky-200 p-4 rounded-lg border border-sky-500">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white text-sky-700 text-sm font-medium px-3 py-2 
                   rounded-lg border border-sky-100 text-center"
                    >
                      {team.team_name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sky-800 mb-3">
                  Choose Group Configuration
                </label>
                <div className="space-y-3">
                  {groupOptions.map((option) => (
                    <label
                      key={option.groups}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        numGroups === String(option.groups)
                          ? "border-sky-500 bg-sky-50"
                          : "border-sky-200 hover:border-sky-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="groupConfig"
                        value={option.groups}
                        checked={numGroups === String(option.groups)}
                        onChange={(e) => {
                          setNumGroups(e.target.value);
                          setTeamsPerGroup(String(option.teamsPerGroup));
                        }}
                        className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="ml-3 flex-1">
                        <span className="font-semibold text-sky-900">
                          {option.groups}{" "}
                          {option.groups === 1 ? "Group" : "Groups"}
                        </span>
                        <span className="text-sky-700"> with </span>
                        <span className="font-semibold text-sky-900">
                          {option.teamsPerGroup}{" "}
                          {option.teamsPerGroup === 1 ? "Team" : "Teams"} per
                          group
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={!numGroups || !teamsPerGroup}
                className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Start Lottery
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-sky-100">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg 
               border border-sky-300 text-sky-700 
               font-semibold hover:bg-sky-50 transition"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>

                <h2 className="text-2xl font-semibold text-sky-800">
                  Draw Team
                </h2>
              </div>

              <div className="mb-6">
                <div className="bg-gradient-to-br from-sky-50 to-white rounded-lg p-8 mb-4 min-h-32 flex items-center justify-center border-2 border-sky-200">
                  {shuffledTeam !== null ? (
                    <div className="text-6xl font-bold text-sky-600">
                      {shuffledTeam.team_name}
                    </div>
                  ) : (
                    <div className="text-sky-400 text-xl">
                      Click shuffle to draw a team
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={shuffleTeam}
                    disabled={isShuffling}
                    className="flex-1 bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    <Shuffle size={20} />
                    {isShuffling ? "Shuffling..." : "Shuffle"}
                  </button>
                </div>

                {shuffledTeam !== null && !isShuffling && (
                  <div>
                    <h3 className="text-lg font-semibold text-sky-800 mb-3">
                      Assign to Group:
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {groups.map((group, idx) => {
                        const isFull = group.length >= parseInt(teamsPerGroup);
                        return (
                          <button
                            key={idx}
                            onClick={() => assignTeamToGroup(idx)}
                            disabled={isFull}
                            className={`py-3 px-4 rounded-lg font-semibold transition ${
                              isFull
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-sky-600 text-white hover:bg-sky-700"
                            }`}
                          >
                            Group {idx + 1}
                            {isFull && " (Full)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Show only teams that are NOT in any group */}
              <div className="text-sm text-sky-700 bg-sky-50 p-3 rounded-lg border border-sky-100">
                <span className="font-semibold">Remaining Teams:</span>{" "}
                {availableTeams.length > 0
                  ? availableTeams.map((team) => team.team_name).join(", ")
                  : "No teams remaining"}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-sky-100">
              <h3 className="text-xl font-semibold mb-4 text-sky-800">
                Current Groups
              </h3>

              <div className="space-y-6">
                {groups.map((group, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-sky-50 to-white 
                   rounded-lg p-4 border border-sky-200"
                  >
                    {/* Group Header */}
                    <h4 className="font-semibold text-sky-800 mb-3">
                      Group {idx + 1}
                    </h4>

                    {/* Teams – Horizontal Flow */}
                    <div className="grid grid-flow-col auto-cols-fr gap-3">
                      {group.map((team, teamIdx) => (
                        <div
                          key={teamIdx}
                          className="bg-white px-3 py-2 rounded-lg text-sm 
                         border border-sky-100 
                         flex items-center justify-between 
                         hover:border-sky-300 transition"
                        >
                          <span className="font-medium text-sky-900">
                            {team.team_name}
                          </span>

                          <button
                            onClick={() => removeTeamFromGroup(idx, team)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove team"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}

                      {/* Remaining Slots */}
                      {group.length < parseInt(teamsPerGroup) && (
                        <div
                          className="flex items-center justify-center 
                            text-sky-400 text-sm italic 
                            border-2 border-dashed border-sky-200 
                            rounded-lg px-3 py-2"
                        >
                          {parseInt(teamsPerGroup) - group.length} remaining
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-sky-100">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg 
               border border-sky-300 text-sky-700 
               font-semibold hover:bg-sky-50 transition"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <button
                onClick={() =>
                  exportSectionAsImage(groupsRef, "current-groups.png")
                }
                className="ml-auto bg-sky-600 text-white px-5 py-2 rounded-lg 
  font-semibold hover:bg-sky-700 transition"
              >
                Export Groups as Image
              </button>
            </div>

            <div
              ref={groupsRef}
              className="bg-sky-50 p-8 rounded-xl space-y-12"
            >
              <h2 className="text-2xl text-center font-semibold text-sky-800">
                Final Groups
              </h2>
              <div className="space-y-6 mb-6">
                {groups.map((group, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-sky-50 to-white 
                 rounded-lg p-6 border-2 border-sky-200"
                  >
                    {/* Group Header */}
                    <h3 className="text-xl font-bold text-sky-800 mb-4">
                      Group {idx + 1}
                    </h3>

                    {/* Teams in Horizontal Grid */}
                    <div className="grid grid-flow-col auto-cols-fr gap-4">
                      {group.map((team, teamIdx) => (
                        <div
                          key={teamIdx}
                          className="bg-white px-4 py-3 rounded-lg shadow-sm 
                       font-semibold text-sky-900 
                       border border-sky-100 
                       flex items-center justify-between 
                       hover:border-sky-300 transition"
                        >
                          <span>{team.team_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={generateAllFixtures}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Generate Match Fixtures
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-sky-100">
              {/* Top Action Bar */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg 
          border border-sky-300 text-sky-700 
          font-semibold hover:bg-sky-50 transition"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>

                <button
                  onClick={() =>
                    exportSectionAsImage(fixturesRef, "group-fixtures.png")
                  }
                  className="bg-sky-600 text-white px-5 py-2 rounded-lg 
          font-semibold hover:bg-sky-700 transition"
                >
                  Export Fixtures as Image
                </button>
              </div>

              {/* Exportable Section */}
              <div
                ref={fixturesRef}
                className="bg-sky-50 p-8 rounded-xl space-y-12"
              >
                <h2 className="text-2xl font-semibold text-sky-800 flex items-center justify-center gap-2 text-center">
                  <Calendar className="text-sky-600" size={28} />
                  Match Fixtures - Round Robin
                </h2>

                {fixtures.map((groupFixture) => (
                  <div
                    key={groupFixture.groupNumber}
                    className="mb-8 last:mb-0"
                  >
                    <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-3 rounded-t-lg">
                      <h3 className="text-xl font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Users size={20} />
                          Group {groupFixture.groupNumber} Fixtures
                        </span>
                        <span className="text-sky-100 text-sm">
                          {groupFixture.matches.length} matches total
                        </span>
                      </h3>
                    </div>

                    <div className="bg-sky-50 rounded-b-lg p-6 border-2 border-sky-200 border-t-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupFixture.matches.map((match) => (
                          <div
                            key={match.matchNumber}
                            className="bg-white rounded-lg p-4 shadow-sm border border-sky-100 hover:shadow-md transition"
                          >
                            <div className="text-xs text-sky-600 font-semibold mb-2">
                              Match {match.matchNumber}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="bg-sky-100 px-4 py-2 rounded-lg font-bold text-sky-900 flex-1 text-center">
                                {match.team1.team_name}
                              </div>

                              <span className="text-sky-400 font-bold">vs</span>

                              <div className="bg-blue-100 px-4 py-2 rounded-lg font-bold text-blue-900 flex-1 text-center">
                                {match.team2.team_name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tournament Summary */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-sky-100">
                  <h3 className="text-xl font-semibold mb-4 text-sky-800">
                    Tournament Summary
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-center">
                      <div className="text-2xl font-bold text-sky-600">
                        {groups.length}
                      </div>
                      <div className="text-sm text-sky-700">Groups</div>
                    </div>

                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-center">
                      <div className="text-2xl font-bold text-sky-600">
                        {totalTeams}
                      </div>
                      <div className="text-sm text-sky-700">Teams</div>
                    </div>

                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-center">
                      <div className="text-2xl font-bold text-sky-600">
                        {fixtures.reduce(
                          (sum, gf) => sum + gf.matches.length,
                          0
                        )}
                      </div>
                      <div className="text-sm text-sky-700">Total Matches</div>
                    </div>

                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-center">
                      <div className="text-2xl font-bold text-sky-600">
                        {parseInt(teamsPerGroup)}
                      </div>
                      <div className="text-sm text-sky-700">Teams / Group</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={reset}
              className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition"
            >
              Start New Tournament
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
