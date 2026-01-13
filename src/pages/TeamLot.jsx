import React, { useState } from "react";
import useStore from "../store/useStore";
import { Shuffle, X, Calendar, Users } from "lucide-react";

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
  // const [teams] = useState(Array.from({ length: 12 }, (_, i) => i + 1));
  const totalTeams = teams.length;
  const [step, setStep] = useState(1);
  const [numGroups, setNumGroups] = useState("");
  const [teamsPerGroup, setTeamsPerGroup] = useState("");
  const [availableTeams, setAvailableTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [shuffledTeam, setShuffledTeam] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [fixtures, setFixtures] = useState([]);

  const generateRoundRobin = (teamNumbers) => {
    const matches = [];
    const n = teamNumbers.length;

    if (n < 2) return matches;

    // Round-robin algorithm
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        matches.push({
          team1: teamNumbers[i],
          team2: teamNumbers[j],
          matchNumber: matches.length + 1,
        });
      }
    }

    return matches;
  };

  // Generate fixtures for all groups
  const generateAllFixtures = () => {
    const allFixtures = groups.map((group, idx) => ({
      groupNumber: idx + 1,
      matches: generateRoundRobin(group),
    }));

    setFixtures(allFixtures);
    setStep(4);
  };

  // Calculate possible group configurations
  const getGroupOptions = () => {
    const options = [];
    for (let i = 1; i <= totalTeams; i++) {
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
      setAvailableTeams(Array.from({ length: totalTeams }, (_, i) => i + 1));
      setGroups(Array.from({ length: ng }, () => []));
      setStep(2);
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

      if (count > 20) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * availableTeams.length);
        const selectedTeam = availableTeams[finalIndex];
        setShuffledTeam(selectedTeam);
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

    const newAvailableTeams = availableTeams.filter((t) => t !== shuffledTeam);
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

  const removeTeamFromGroup = (groupIndex, teamNumber) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = newGroups[groupIndex].filter(
      (t) => t !== teamNumber
    );
    setGroups(newGroups);

    const newAvailableTeams = [...availableTeams, teamNumber].sort(
      (a, b) => a - b
    );
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

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-sky-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-sky-700">
          Team Lot & Fixtures
        </h1>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-sky-100">
            <h2 className="text-2xl font-semibold mb-6 text-sky-800">Setup</h2>

            <div className="space-y-6">
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                <p className="text-sm text-sky-800">
                  Total Teams:{" "}
                  <span className="font-semibold">{totalTeams}</span>
                </p>
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
              <h2 className="text-2xl font-semibold mb-4 text-sky-800">
                Draw Team
              </h2>

              <div className="mb-6">
                <div className="bg-gradient-to-br from-sky-50 to-white rounded-lg p-8 mb-4 min-h-32 flex items-center justify-center border-2 border-sky-200">
                  {shuffledTeam !== null ? (
                    <div className="text-6xl font-bold text-sky-600">
                      Team {shuffledTeam}
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

                {shuffledTeam !== null && (
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

              <div className="text-sm text-sky-700 bg-sky-50 p-3 rounded-lg border border-sky-100">
                <span className="font-semibold">Remaining Teams:</span>{" "}
                {availableTeams.join(", ")}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-sky-100">
              <h3 className="text-xl font-semibold mb-4 text-sky-800">
                Current Groups
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-sky-50 to-white rounded-lg p-4 border border-sky-200"
                  >
                    <h4 className="font-semibold text-sky-800 mb-2">
                      Group {idx + 1}
                    </h4>
                    <div className="space-y-2">
                      {group.map((team, teamIdx) => (
                        <div
                          key={teamIdx}
                          className="bg-white px-3 py-2 rounded text-sm border border-sky-100 flex items-center justify-between group hover:border-sky-300 transition"
                        >
                          <span className="font-medium text-sky-900">
                            Team {team}
                          </span>
                          <button
                            onClick={() => removeTeamFromGroup(idx, team)}
                            className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
                            title="Remove team"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {group.length < parseInt(teamsPerGroup) && (
                        <div className="text-sky-400 text-sm italic px-3 py-2">
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
            <h2 className="text-2xl font-semibold mb-6 text-sky-800">
              Final Groups
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {groups.map((group, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-sky-50 to-white rounded-lg p-6 border-2 border-sky-200"
                >
                  <h3 className="text-xl font-bold text-sky-800 mb-4">
                    Group {idx + 1}
                  </h3>
                  <div className="space-y-2">
                    {group.map((team, teamIdx) => (
                      <div
                        key={teamIdx}
                        className="bg-white px-4 py-2 rounded-lg shadow-sm font-semibold text-sky-900 border border-sky-100 flex items-center justify-between group hover:border-sky-300 transition"
                      >
                        <span>Team {team}</span>
                        <button
                          onClick={() => removeTeamFromGroup(idx, team)}
                          className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
                          title="Remove team"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={generateAllFixtures}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Generate Match Fixtures
              </button>
              <button
                onClick={reset}
                className="flex-1 bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition"
              >
                Start New Lottery
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-sky-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-sky-800 flex items-center gap-2">
                  <Calendar className="text-sky-600" size={28} />
                  Match Fixtures - Round Robin
                </h2>
              </div>

              {fixtures.map((groupFixture) => (
                <div key={groupFixture.groupNumber} className="mb-8 last:mb-0">
                  <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-3 rounded-t-lg">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Users size={20} />
                      Group {groupFixture.groupNumber} Fixtures
                    </h3>
                    <p className="text-sky-100 text-sm mt-1">
                      {groupFixture.matches.length} matches total
                    </p>
                  </div>

                  <div className="bg-sky-50 rounded-b-lg p-6 border-2 border-sky-200 border-t-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupFixture.matches.map((match) => (
                        <div
                          key={match.matchNumber}
                          className="bg-white rounded-lg p-4 shadow-sm border border-sky-100 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-xs text-sky-600 font-semibold mb-2">
                                Match {match.matchNumber}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="bg-sky-100 px-4 py-2 rounded-lg font-bold text-sky-900 flex-1 text-center">
                                    Team {match.team1}
                                  </div>
                                  <div className="text-sky-400 font-bold">
                                    vs
                                  </div>
                                  <div className="bg-blue-100 px-4 py-2 rounded-lg font-bold text-blue-900 flex-1 text-center">
                                    Team {match.team2}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
                    {fixtures.reduce((sum, gf) => sum + gf.matches.length, 0)}
                  </div>
                  <div className="text-sm text-sky-700">Total Matches</div>
                </div>
                <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-center">
                  <div className="text-2xl font-bold text-sky-600">
                    {parseInt(teamsPerGroup)}
                  </div>
                  <div className="text-sm text-sky-700">Teams/Group</div>
                </div>
              </div>
            </div>

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
