import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Sport = "football" | "hurling";

type Action =
  | "teamPoint"
  | "teamTwoPointer"
  | "teamGoal"
  | "teamWide"
  | "teamShort"
  | "teamBlocked"
  | "teamSaved"
  | "ownKickoutWon"
  | "ownKickoutLost"
  | "oppositionKickoutWon"
  | "oppositionKickoutLost"
  | "oppositionPoint"
  | "oppositionTwoPointer"
  | "oppositionGoal";

type SavedMatch = {
  id: string;
  savedAt: string;
  sport?: Sport;
  currentHalf: string;
  teamName: string;
  oppositionName: string;
  teamGoals: number;
  teamPoints: number;
  teamScore: number;
  oppositionGoals: number;
  oppositionPoints: number;
  oppositionScore: number;
  seconds: number;
  addedSeconds: number;
  teamScores: number;
  teamWides: number;
  teamShorts: number;
  teamBlocked: number;
  teamSaved: number;
  totalShots: number;
  conversionRate: number;
  ownKickoutsWon: number;
  ownKickoutsLost: number;
  ownKickoutWinRate: number;
  oppositionKickoutsWon: number;
  oppositionKickoutsLost: number;
  oppositionKickoutWinRate: number;
};

export default function HomeScreen() {
  const [sport, setSport] = useState<Sport>("football");

  const [seconds, setSeconds] = useState(30 * 60);
  const [addedSeconds, setAddedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentHalf, setCurrentHalf] = useState("1st Half");

  const scoringColours = [
    { name: "Maroon", colour: "#7a0019" },
    { name: "Black", colour: "#222222" },
    { name: "Blue", colour: "#0057b8" },
    { name: "Navy", colour: "#003366" },
    { name: "Green", colour: "#146c2e" },
    { name: "Orange", colour: "#b85c00" },
    { name: "Purple", colour: "#5b2c83" },
    { name: "Grey", colour: "#555555" },
  ];

  const [leftScoringColourIndex, setLeftScoringColourIndex] = useState(0);
  const [rightScoringColourIndex, setRightScoringColourIndex] = useState(1);

  const leftScoringColour = scoringColours[leftScoringColourIndex];
  const rightScoringColour = scoringColours[rightScoringColourIndex];

  const [teamName, setTeamName] = useState("An Tearmainn");
  const [oppositionName, setOppositionName] = useState("Opposition");

  const [teamScore, setTeamScore] = useState(0);
  const [teamGoals, setTeamGoals] = useState(0);
  const [teamPoints, setTeamPoints] = useState(0);
  const [teamScores, setTeamScores] = useState(0);
  const [teamWides, setTeamWides] = useState(0);
  const [teamShorts, setTeamShorts] = useState(0);
  const [teamBlocked, setTeamBlocked] = useState(0);
  const [teamSaved, setTeamSaved] = useState(0);

  const [ownKickoutsWon, setOwnKickoutsWon] = useState(0);
  const [ownKickoutsLost, setOwnKickoutsLost] = useState(0);
  const [oppositionKickoutsWon, setOppositionKickoutsWon] = useState(0);
  const [oppositionKickoutsLost, setOppositionKickoutsLost] = useState(0);

  const [oppositionScore, setOppositionScore] = useState(0);
  const [oppositionGoals, setOppositionGoals] = useState(0);
  const [oppositionPoints, setOppositionPoints] = useState(0);

  const [lastActions, setLastActions] = useState<Action[]>([]);
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [showSavedMatches, setShowSavedMatches] = useState(false);
  const [currentMatchLoaded, setCurrentMatchLoaded] = useState(false);

  const isFootball = sport === "football";
  const restartLabel = isFootball ? "Kickouts" : "Puck Outs";
  const shortRestartLabel = isFootball ? "KO" : "PO";

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (timerRunning) {
      timer = setInterval(() => {
        setSeconds((value) => {
          if (value > 0) {
            return value - 1;
          }

          setAddedSeconds((addedValue) => addedValue + 1);
          return 0;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    loadSavedMatches();
    loadCurrentMatch();
  }, []);

  useEffect(() => {
    if (!currentMatchLoaded) return;

    const autoSaveCurrentMatch = async () => {
      const currentMatch = {
        sport,
        seconds,
        addedSeconds,
        timerRunning: false,
        currentHalf,
        leftScoringColourIndex,
        rightScoringColourIndex,
        teamName,
        oppositionName,
        teamScore,
        teamGoals,
        teamPoints,
        teamScores,
        teamWides,
        teamShorts,
        teamBlocked,
        teamSaved,
        ownKickoutsWon,
        ownKickoutsLost,
        oppositionKickoutsWon,
        oppositionKickoutsLost,
        oppositionScore,
        oppositionGoals,
        oppositionPoints,
      };

      await AsyncStorage.setItem("currentMatch", JSON.stringify(currentMatch));
    };

    autoSaveCurrentMatch();
  }, [
    currentMatchLoaded,
    sport,
    seconds,
    addedSeconds,
    currentHalf,
    leftScoringColourIndex,
    rightScoringColourIndex,
    teamName,
    oppositionName,
    teamScore,
    teamGoals,
    teamPoints,
    teamScores,
    teamWides,
    teamShorts,
    teamBlocked,
    teamSaved,
    ownKickoutsWon,
    ownKickoutsLost,
    oppositionKickoutsWon,
    oppositionKickoutsLost,
    oppositionScore,
    oppositionGoals,
    oppositionPoints,
  ]);

  const addAction = (action: Action) => {
    setLastActions((currentActions) => [...currentActions, action]);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTimerDisplay = () => {
    return seconds > 0 ? formatTime(seconds) : formatTime(addedSeconds);
  };

  const formatShareTime = () => {
    if (seconds > 0) {
      return `${currentHalf} - Time Remaining: ${formatTime(seconds)}`;
    }

    return `${currentHalf} - Added Time: ${formatTime(addedSeconds)}`;
  };

  const formatGaelicScore = (goals: number, points: number) => {
    return `${goals}:${points.toString().padStart(2, "0")}`;
  };

  const formatSavedDate = (dateText: string) => {
    return new Date(dateText).toLocaleString();
  };

  const totalShots = teamScores + teamWides + teamShorts + teamBlocked + teamSaved;
  const conversionRate =
    totalShots === 0 ? 0 : Math.round((teamScores / totalShots) * 100);

  const ownKickoutsTotal = ownKickoutsWon + ownKickoutsLost;
  const ownKickoutWinRate =
    ownKickoutsTotal === 0
      ? 0
      : Math.round((ownKickoutsWon / ownKickoutsTotal) * 100);

  const oppositionKickoutsTotal = oppositionKickoutsWon + oppositionKickoutsLost;
  const oppositionKickoutWinRate =
    oppositionKickoutsTotal === 0
      ? 0
      : Math.round((oppositionKickoutsWon / oppositionKickoutsTotal) * 100);

  const startFirstHalf = () => {
    if (seconds !== 30 * 60 || addedSeconds !== 0 || timerRunning) {
      Alert.alert("Restart 1st Half?", "This will reset the timer to 30:00.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: () => {
            setCurrentHalf("1st Half");
            setSeconds(30 * 60);
            setAddedSeconds(0);
            setTimerRunning(true);
          },
        },
      ]);

      return;
    }

    setCurrentHalf("1st Half");
    setSeconds(30 * 60);
    setAddedSeconds(0);
    setTimerRunning(true);
  };

  const startSecondHalf = () => {
    if (currentHalf !== "2nd Half") {
      Alert.alert("Start 2nd Half?", "This will start the timer at 30:00.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            setCurrentHalf("2nd Half");
            setSeconds(30 * 60);
            setAddedSeconds(0);
            setTimerRunning(true);
          },
        },
      ]);

      return;
    }

    if (seconds !== 30 * 60 || addedSeconds !== 0 || timerRunning) {
      Alert.alert("Restart 2nd Half?", "This will reset the timer to 30:00.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: () => {
            setCurrentHalf("2nd Half");
            setSeconds(30 * 60);
            setAddedSeconds(0);
            setTimerRunning(true);
          },
        },
      ]);

      return;
    }

    setCurrentHalf("2nd Half");
    setSeconds(30 * 60);
    setAddedSeconds(0);
    setTimerRunning(true);
  };

  const loadCurrentMatch = async () => {
    try {
      const existingCurrentMatch = await AsyncStorage.getItem("currentMatch");

      if (existingCurrentMatch) {
        const match = JSON.parse(existingCurrentMatch);

        setSport(match.sport || "football");
        setSeconds(match.seconds ?? 30 * 60);
        setAddedSeconds(match.addedSeconds || 0);
        setTimerRunning(false);
        setCurrentHalf(match.currentHalf || "1st Half");
        setLeftScoringColourIndex(match.leftScoringColourIndex || 0);
        setRightScoringColourIndex(match.rightScoringColourIndex || 1);

        setTeamName(match.teamName || "An Tearmainn");
        setOppositionName(match.oppositionName || "Opposition");

        setTeamScore(match.teamScore || 0);
        setTeamGoals(match.teamGoals || 0);
        setTeamPoints(match.teamPoints || 0);
        setTeamScores(match.teamScores || 0);
        setTeamWides(match.teamWides || 0);
        setTeamShorts(match.teamShorts || 0);
        setTeamBlocked(match.teamBlocked || 0);
        setTeamSaved(match.teamSaved || 0);

        setOwnKickoutsWon(match.ownKickoutsWon || 0);
        setOwnKickoutsLost(match.ownKickoutsLost || 0);
        setOppositionKickoutsWon(match.oppositionKickoutsWon || 0);
        setOppositionKickoutsLost(match.oppositionKickoutsLost || 0);

        setOppositionScore(match.oppositionScore || 0);
        setOppositionGoals(match.oppositionGoals || 0);
        setOppositionPoints(match.oppositionPoints || 0);
      }

      setCurrentMatchLoaded(true);
    } catch (error) {
      setCurrentMatchLoaded(true);
      Alert.alert("Restore Failed", "The current match could not be restored.");
    }
  };

  const loadSavedMatches = async () => {
    try {
      const existingMatches = await AsyncStorage.getItem("savedMatches");
      const matches = existingMatches ? JSON.parse(existingMatches) : [];
      setSavedMatches(matches);
    } catch (error) {
      Alert.alert("Load Failed", "Saved matches could not be loaded.");
    }
  };

  const shareSavedMatch = async (match: SavedMatch) => {
    const savedTime =
      match.seconds > 0
        ? `${match.currentHalf || "Match"} - Time Remaining: ${formatTime(
            match.seconds
          )}`
        : `${match.currentHalf || "Match"} - Added Time: ${formatTime(
            match.addedSeconds || 0
          )}`;

    const savedSport = match.sport || "football";
    const savedRestartWord = savedSport === "football" ? "Kickouts" : "Puck Outs";
    const savedRestartShort = savedSport === "football" ? "KO" : "PO";
    const savedOwnKickoutsTotal = match.ownKickoutsWon + match.ownKickoutsLost;
    const savedOppKickoutsTotal =
      match.oppositionKickoutsWon + match.oppositionKickoutsLost;

    const message = `
🏐 Saved Match Summary

${match.teamName} ${formatGaelicScore(match.teamGoals, match.teamPoints)}
${match.oppositionName} ${formatGaelicScore(
      match.oppositionGoals,
      match.oppositionPoints
    )}

${savedTime}

📊 Shot Summary
Scores: ${match.teamScores}
Total Attempts: ${match.totalShots}
Shot Conversion: ${match.conversionRate}%

Wides: ${match.teamWides}
Shorts: ${match.teamShorts}
Blocked: ${match.teamBlocked}
Saved: ${match.teamSaved}

📍 ${savedRestartWord}
Own ${savedRestartShort} Won: ${match.ownKickoutsWon}/${savedOwnKickoutsTotal} - ${
      match.ownKickoutWinRate
    }%
Opp ${savedRestartShort} Won: ${match.oppositionKickoutsWon}/${savedOppKickoutsTotal} - ${
      match.oppositionKickoutWinRate
    }%

Saved: ${formatSavedDate(match.savedAt)}
`;

    await Share.share({
      message,
    });
  };

  const deleteSavedMatch = async (matchId: string) => {
    try {
      const updatedMatches = savedMatches.filter((match) => match.id !== matchId);

      await AsyncStorage.setItem("savedMatches", JSON.stringify(updatedMatches));
      setSavedMatches(updatedMatches);

      Alert.alert("Deleted", "Saved match deleted.");
    } catch (error) {
      Alert.alert("Delete Failed", "The saved match could not be deleted.");
    }
  };

  const saveMatch = async () => {
    try {
      const savedMatch: SavedMatch = {
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        sport,
        currentHalf,
        teamName,
        oppositionName,
        teamGoals,
        teamPoints,
        teamScore,
        oppositionGoals,
        oppositionPoints,
        oppositionScore,
        seconds,
        addedSeconds,
        teamScores,
        teamWides,
        teamShorts,
        teamBlocked,
        teamSaved,
        totalShots,
        conversionRate,
        ownKickoutsWon,
        ownKickoutsLost,
        ownKickoutWinRate,
        oppositionKickoutsWon,
        oppositionKickoutsLost,
        oppositionKickoutWinRate,
      };

      const existingMatches = await AsyncStorage.getItem("savedMatches");
      const matches = existingMatches ? JSON.parse(existingMatches) : [];

      const updatedMatches = [savedMatch, ...matches];

      await AsyncStorage.setItem("savedMatches", JSON.stringify(updatedMatches));
      setSavedMatches(updatedMatches);

      Alert.alert("Match Saved", "Your match has been saved on this phone.");
    } catch (error) {
      Alert.alert("Save Failed", "The match could not be saved.");
    }
  };

  const shareMatchSummary = async () => {
    const message = `
🏐 Gaelic Match Summary

${teamName} ${formatGaelicScore(teamGoals, teamPoints)}
${oppositionName} ${formatGaelicScore(oppositionGoals, oppositionPoints)}

${formatShareTime()}

📊 Shot Summary
Scores: ${teamScores}
Total Attempts: ${totalShots}
Shot Conversion: ${conversionRate}%

Wides: ${teamWides}
Shorts: ${teamShorts}
Blocked: ${teamBlocked}
Saved: ${teamSaved}

📍 ${restartLabel}
Own ${shortRestartLabel} Won: ${ownKickoutsWon}/${ownKickoutsTotal} - ${ownKickoutWinRate}%
Opp ${shortRestartLabel} Won: ${oppositionKickoutsWon}/${oppositionKickoutsTotal} - ${oppositionKickoutWinRate}%
`;

    await Share.share({
      message,
    });
  };

  const shareScoreOnly = async () => {
    const message = `
🏐 Score Update

${teamName} ${formatGaelicScore(teamGoals, teamPoints)}
${oppositionName} ${formatGaelicScore(oppositionGoals, oppositionPoints)}

${formatShareTime()}

📍 ${restartLabel}
Own ${shortRestartLabel} Won: ${ownKickoutsWon}/${ownKickoutsTotal} - ${ownKickoutWinRate}%
Opp ${shortRestartLabel} Won: ${oppositionKickoutsWon}/${oppositionKickoutsTotal} - ${oppositionKickoutWinRate}%
`;

    await Share.share({
      message,
    });
  };

  const undoLastAction = () => {
    if (lastActions.length === 0) return;

    const lastAction = lastActions[lastActions.length - 1];

    if (lastAction === "teamPoint") {
      setTeamScore((value) => Math.max(0, value - 1));
      setTeamPoints((value) => Math.max(0, value - 1));
      setTeamScores((value) => Math.max(0, value - 1));
    }

    if (lastAction === "teamTwoPointer") {
      setTeamScore((value) => Math.max(0, value - 2));
      setTeamPoints((value) => Math.max(0, value - 2));
      setTeamScores((value) => Math.max(0, value - 1));
    }

    if (lastAction === "teamGoal") {
      setTeamScore((value) => Math.max(0, value - 3));
      setTeamGoals((value) => Math.max(0, value - 1));
      setTeamScores((value) => Math.max(0, value - 1));
    }

    if (lastAction === "teamWide") setTeamWides((value) => Math.max(0, value - 1));
    if (lastAction === "teamShort") setTeamShorts((value) => Math.max(0, value - 1));
    if (lastAction === "teamBlocked") setTeamBlocked((value) => Math.max(0, value - 1));
    if (lastAction === "teamSaved") setTeamSaved((value) => Math.max(0, value - 1));
    if (lastAction === "ownKickoutWon") setOwnKickoutsWon((value) => Math.max(0, value - 1));
    if (lastAction === "ownKickoutLost") setOwnKickoutsLost((value) => Math.max(0, value - 1));
    if (lastAction === "oppositionKickoutWon") setOppositionKickoutsWon((value) => Math.max(0, value - 1));
    if (lastAction === "oppositionKickoutLost") setOppositionKickoutsLost((value) => Math.max(0, value - 1));

    if (lastAction === "oppositionPoint") {
      setOppositionScore((value) => Math.max(0, value - 1));
      setOppositionPoints((value) => Math.max(0, value - 1));
    }

    if (lastAction === "oppositionTwoPointer") {
      setOppositionScore((value) => Math.max(0, value - 2));
      setOppositionPoints((value) => Math.max(0, value - 2));
    }

    if (lastAction === "oppositionGoal") {
      setOppositionScore((value) => Math.max(0, value - 3));
      setOppositionGoals((value) => Math.max(0, value - 1));
    }

    setLastActions(lastActions.slice(0, -1));
  };

  const resetEverything = async () => {
    setTimerRunning(false);
    setSeconds(30 * 60);
    setAddedSeconds(0);
    setCurrentHalf("1st Half");

    setTeamScore(0);
    setTeamGoals(0);
    setTeamPoints(0);
    setTeamScores(0);
    setTeamWides(0);
    setTeamShorts(0);
    setTeamBlocked(0);
    setTeamSaved(0);

    setOwnKickoutsWon(0);
    setOwnKickoutsLost(0);
    setOppositionKickoutsWon(0);
    setOppositionKickoutsLost(0);

    setOppositionScore(0);
    setOppositionGoals(0);
    setOppositionPoints(0);

    setLastActions([]);

    await AsyncStorage.removeItem("currentMatch");
  };

  const confirmResetMatch = () => {
    Alert.alert("New Match", "Are you sure you want to start a new match?", [
      { text: "Cancel", style: "cancel" },
      { text: "New Match", style: "destructive", onPress: resetEverything },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gaelic Stats Tracker</Text>

      <View style={styles.compactTimerBox}>
        <Text style={styles.currentHalfText}>{currentHalf}</Text>

        <View style={styles.timerTimeRow}>
          <TouchableOpacity
            style={[
              styles.sportIconButton,
              sport === "football" && styles.sportIconButtonSelected,
            ]}
            onPress={() => setSport("football")}
          >
            <Text style={styles.sportIconText}>🏐</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustTimerButton}
            onPress={() => {
              if (seconds > 0) {
                setSeconds((value) => Math.max(0, value - 60));
              } else {
                setAddedSeconds((value) => Math.max(0, value - 60));
              }
            }}
          >
            <Text style={styles.adjustTimerText}>-1 min</Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.compactTimerText,
              seconds === 0 && styles.addedTimeText,
            ]}
          >
            {formatTimerDisplay()}
          </Text>

          <TouchableOpacity
            style={styles.adjustTimerButton}
            onPress={() => {
              if (seconds > 0) {
                setSeconds((value) => value + 60);
              } else {
                setAddedSeconds((value) => value + 60);
              }
            }}
          >
            <Text style={styles.adjustTimerText}>+1 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sportIconButton,
              sport === "hurling" && styles.sportIconButtonSelected,
            ]}
            onPress={() => setSport("hurling")}
          >
            <Text style={styles.sportIconText}>🏑</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timerButtonRow}>
          <TouchableOpacity style={styles.timerStartButton} onPress={startFirstHalf}>
            <Text style={styles.timerButtonText}>Start 1st Half</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pauseIconButton}
            onPress={() => setTimerRunning(!timerRunning)}
          >
            <Text style={styles.pauseIcon}>{timerRunning ? "⏸" : "▶"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.timerStopButton} onPress={startSecondHalf}>
            <Text style={styles.timerButtonText}>Start 2nd Half</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scoreboard}>
        <View style={styles.scoreCard}>
          <TextInput
            style={styles.teamNameInput}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Team name"
          />
          <Text style={styles.gaelicScore}>
            {formatGaelicScore(teamGoals, teamPoints)}
          </Text>
          <Text style={styles.totalScore}>Total: {teamScore}</Text>
        </View>

        <View style={styles.scoreCard}>
          <TextInput
            style={styles.teamNameInput}
            value={oppositionName}
            onChangeText={setOppositionName}
            placeholder="Opposition"
          />
          <Text style={styles.gaelicScore}>
            {formatGaelicScore(oppositionGoals, oppositionPoints)}
          </Text>
          <Text style={styles.totalScore}>Total: {oppositionScore}</Text>
        </View>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.sectionTitle}>Scoring</Text>

        <View style={styles.twoColumnButtons}>
          <View style={styles.teamColumn}>
            <Text style={styles.smallHeading}>{teamName}</Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: leftScoringColour.colour }]}
              onPress={() => {
                setTeamScore(teamScore + 1);
                setTeamPoints(teamPoints + 1);
                setTeamScores(teamScores + 1);
                addAction("teamPoint");
              }}
            >
              <Text style={styles.buttonText}>+ Point</Text>
            </TouchableOpacity>

            {isFootball && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: leftScoringColour.colour }]}
                onPress={() => {
                  setTeamScore(teamScore + 2);
                  setTeamPoints(teamPoints + 2);
                  setTeamScores(teamScores + 1);
                  addAction("teamTwoPointer");
                }}
              >
                <Text style={styles.buttonText}>+ 2 Pointer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: leftScoringColour.colour }]}
              onPress={() => {
                setTeamScore(teamScore + 3);
                setTeamGoals(teamGoals + 1);
                setTeamScores(teamScores + 1);
                addAction("teamGoal");
              }}
            >
              <Text style={styles.buttonText}>+ Goal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.teamColumn}>
            <Text style={styles.smallHeading}>{oppositionName}</Text>

            <TouchableOpacity
              style={[styles.buttonDark, { backgroundColor: rightScoringColour.colour }]}
              onPress={() => {
                setOppositionScore(oppositionScore + 1);
                setOppositionPoints(oppositionPoints + 1);
                addAction("oppositionPoint");
              }}
            >
              <Text style={styles.buttonText}>+ Point</Text>
            </TouchableOpacity>

            {isFootball && (
              <TouchableOpacity
                style={[styles.buttonDark, { backgroundColor: rightScoringColour.colour }]}
                onPress={() => {
                  setOppositionScore(oppositionScore + 2);
                  setOppositionPoints(oppositionPoints + 2);
                  addAction("oppositionTwoPointer");
                }}
              >
                <Text style={styles.buttonText}>+ 2 Pointer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.buttonDark, { backgroundColor: rightScoringColour.colour }]}
              onPress={() => {
                setOppositionScore(oppositionScore + 3);
                setOppositionGoals(oppositionGoals + 1);
                addAction("oppositionGoal");
              }}
            >
              <Text style={styles.buttonText}>+ Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.scoreBox}>
        <View style={styles.shotHeaderRow}>
          <Text style={styles.shotHeaderSideText}>Scores: {teamScores}</Text>
          <Text style={styles.sectionTitleNoMargin}>Shot Attempts</Text>
          <Text style={styles.shotHeaderSideText}>Total Att: {totalShots}</Text>
        </View>

        <View style={styles.compactSummaryBox}>
          <View style={styles.shotCompactRow}>
            <Text style={styles.compactStatText}>Wides: {teamWides}</Text>
            <Text style={styles.compactStatText}>Shorts: {teamShorts}</Text>
            <Text style={styles.compactStatText}>Blocked: {teamBlocked}</Text>
            <Text style={styles.compactStatText}>Saved: {teamSaved}</Text>
          </View>

          <Text style={styles.compactConversionText}>
            Shot Conversion: {conversionRate}%
          </Text>
        </View>

        <View style={styles.shotButtonGrid}>
          <TouchableOpacity
            style={styles.shotHalfButton}
            onPress={() => {
              setTeamWides(teamWides + 1);
              addAction("teamWide");
            }}
          >
            <Text style={styles.buttonText}>+ Wide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shotHalfButton}
            onPress={() => {
              setTeamShorts(teamShorts + 1);
              addAction("teamShort");
            }}
          >
            <Text style={styles.buttonText}>+ Short</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shotHalfButton}
            onPress={() => {
              setTeamBlocked(teamBlocked + 1);
              addAction("teamBlocked");
            }}
          >
            <Text style={styles.buttonText}>+ Blocked</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shotHalfButton}
            onPress={() => {
              setTeamSaved(teamSaved + 1);
              addAction("teamSaved");
            }}
          >
            <Text style={styles.buttonText}>+ Saved</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.sectionTitle}>{restartLabel}</Text>

        <View style={styles.summaryBox}>
          <View style={styles.kickoutStatsRow}>
            <Text style={styles.statText}>Own Won: {ownKickoutsWon}</Text>
            <Text style={styles.statText}>Own Lost: {ownKickoutsLost}</Text>
          </View>

          <Text style={styles.conversionText}>
            Own {shortRestartLabel}'s Won: {ownKickoutWinRate}%
          </Text>
        </View>

        <View style={styles.twoColumnButtons}>
          <TouchableOpacity
            style={styles.kickoutWonButton}
            onPress={() => {
              setOwnKickoutsWon(ownKickoutsWon + 1);
              addAction("ownKickoutWon");
            }}
          >
            <Text style={styles.buttonText}>+ Own Won</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kickoutLostButton}
            onPress={() => {
              setOwnKickoutsLost(ownKickoutsLost + 1);
              addAction("ownKickoutLost");
            }}
          >
            <Text style={styles.buttonText}>+ Own Lost</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.kickoutStatsRow}>
            <Text style={styles.statText}>Opp Won: {oppositionKickoutsWon}</Text>
            <Text style={styles.statText}>Opp Lost: {oppositionKickoutsLost}</Text>
          </View>

          <Text style={styles.conversionText}>
            Opp {shortRestartLabel} Won: {oppositionKickoutWinRate}%
          </Text>
        </View>

        <View style={styles.twoColumnButtons}>
          <TouchableOpacity
            style={styles.kickoutWonButton}
            onPress={() => {
              setOppositionKickoutsWon(oppositionKickoutsWon + 1);
              addAction("oppositionKickoutWon");
            }}
          >
            <Text style={styles.buttonText}>+ Opp Won</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kickoutLostButton}
            onPress={() => {
              setOppositionKickoutsLost(oppositionKickoutsLost + 1);
              addAction("oppositionKickoutLost");
            }}
          >
            <Text style={styles.buttonText}>+ Opp Lost</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.shareButtonRow}>
        <TouchableOpacity style={styles.shareHalfButton} onPress={shareMatchSummary}>
          <Text style={styles.shareButtonText}>Share Match Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareScoreButton} onPress={shareScoreOnly}>
          <Text style={styles.shareButtonText}>Share Score</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.undoButton} onPress={undoLastAction}>
        <Text style={styles.resetText}>Undo Last Action</Text>
      </TouchableOpacity>

      <View style={styles.newSaveButtonRow}>
        <TouchableOpacity style={styles.newMatchHalfButton} onPress={confirmResetMatch}>
          <Text style={styles.resetText}>New Match</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveMatchHalfButton} onPress={saveMatch}>
          <Text style={styles.resetText}>Save Match</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.themeButtonRow}>
        <TouchableOpacity
          style={styles.themeHalfButton}
          onPress={() => {
            setLeftScoringColourIndex((currentIndex) =>
              currentIndex === scoringColours.length - 1 ? 0 : currentIndex + 1
            );
          }}
        >
          <Text style={styles.themeButtonText}>
            Left Colour: {leftScoringColour.name}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.themeHalfButton}
          onPress={() => {
            setRightScoringColourIndex((currentIndex) =>
              currentIndex === scoringColours.length - 1 ? 0 : currentIndex + 1
            );
          }}
        >
          <Text style={styles.themeButtonText}>
            Right Colour: {rightScoringColour.name}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.viewSavedButton}
        onPress={() => {
          loadSavedMatches();
          setShowSavedMatches(!showSavedMatches);
        }}
      >
        <Text style={styles.resetText}>
          {showSavedMatches ? "Hide Saved Matches" : "View Saved Matches"}
        </Text>
      </TouchableOpacity>

      {showSavedMatches && (
        <View style={styles.savedMatchesBox}>
          <Text style={styles.sectionTitle}>Saved Matches</Text>

          {savedMatches.length === 0 ? (
            <Text style={styles.noSavedText}>No saved matches yet.</Text>
          ) : (
            savedMatches.map((match) => {
              const savedSport = match.sport || "football";
              const savedShortLabel = savedSport === "football" ? "KO" : "PO";

              return (
                <View key={match.id} style={styles.savedMatchCard}>
                  <Text style={styles.savedMatchTitle}>
                    {match.teamName} {formatGaelicScore(match.teamGoals, match.teamPoints)} v{" "}
                    {match.oppositionName}{" "}
                    {formatGaelicScore(match.oppositionGoals, match.oppositionPoints)}
                  </Text>

                  <Text style={styles.savedMatchText}>
                    Sport: {savedSport === "football" ? "Football" : "Hurling"}
                  </Text>

                  <Text style={styles.savedMatchText}>
                    Shot Conversion: {match.conversionRate}%
                  </Text>

                  <Text style={styles.savedMatchText}>
                    Own {savedShortLabel}: {match.ownKickoutWinRate}% | Opp{" "}
                    {savedShortLabel}: {match.oppositionKickoutWinRate}%
                  </Text>

                  <Text style={styles.savedMatchDate}>
                    Saved: {formatSavedDate(match.savedAt)}
                  </Text>

                  <View style={styles.savedMatchButtonRow}>
                    <TouchableOpacity
                      style={styles.deleteSavedHalfButton}
                      onPress={() => deleteSavedMatch(match.id)}
                    >
                      <Text style={styles.savedMatchButtonText}>Delete Saved Match</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.shareSavedHalfButton}
                      onPress={() => shareSavedMatch(match)}
                    >
                      <Text style={styles.savedMatchButtonText}>Share Saved Match</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#dcebd7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 12,
  },
  compactTimerBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    elevation: 3,
  },
  currentHalfText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
    marginBottom: 2,
  },
  timerTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 6,
  },
  sportIconButton: {
    backgroundColor: "#eeeeee",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: "#dddddd",
  },
  sportIconButtonSelected: {
    backgroundColor: "#e8f3e5",
    borderColor: "#146c2e",
  },
  sportIconText: {
    fontSize: 18,
    textAlign: "center",
  },
  timerButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timerStartButton: {
    flex: 1,
    backgroundColor: "#146c2e",
    paddingVertical: 9,
    borderRadius: 8,
  },
  timerStopButton: {
    flex: 1,
    backgroundColor: "#8b1a1a",
    paddingVertical: 9,
    borderRadius: 8,
  },
  compactTimerText: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    minWidth: 80,
  },
  addedTimeText: {
    color: "red",
  },
  pauseIconButton: {
    backgroundColor: "#dddddd",
    paddingVertical: 3,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  pauseIcon: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  adjustTimerButton: {
    backgroundColor: "#dddddd",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  adjustTimerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#222",
  },
  timerButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  scoreboard: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    elevation: 3,
  },
  teamNameInput: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#eeeeee",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  scoreBox: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    elevation: 3,
  },
  smallHeading: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  shotHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  shotHeaderSideText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionTitleNoMargin: {
    flex: 1.2,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  gaelicScore: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
  },
  totalScore: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
    color: "#555",
  },
  compactSummaryBox: {
    backgroundColor: "#eeeeee",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  summaryBox: {
    backgroundColor: "#eeeeee",
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  shotCompactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  compactStatText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  compactConversionText: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 3,
  },
  statText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  conversionText: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
  },
  kickoutStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  twoColumnButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  teamColumn: {
    flex: 1,
    gap: 6,
  },
  button: {
    backgroundColor: "#7a0019",
    padding: 10,
    borderRadius: 8,
  },
  shotButtonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  shotHalfButton: {
    width: "48%",
    backgroundColor: "#b85c00",
    padding: 10,
    borderRadius: 8,
  },
  kickoutWonButton: {
    flex: 1,
    backgroundColor: "#146c2e",
    padding: 10,
    borderRadius: 8,
  },
  kickoutLostButton: {
    flex: 1,
    backgroundColor: "#8b1a1a",
    padding: 10,
    borderRadius: 8,
  },
  buttonDark: {
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  newSaveButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  newMatchHalfButton: {
    flex: 1,
    backgroundColor: "#999",
    padding: 11,
    borderRadius: 8,
  },
  saveMatchHalfButton: {
    flex: 1,
    backgroundColor: "#0057b8",
    padding: 11,
    borderRadius: 8,
  },
  themeButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  themeHalfButton: {
    flex: 1,
    backgroundColor: "#444444",
    padding: 11,
    borderRadius: 8,
  },
  themeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  viewSavedButton: {
    backgroundColor: "#333333",
    padding: 11,
    borderRadius: 8,
    marginBottom: 8,
  },
  savedMatchesBox: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 10,
    marginBottom: 20,
    elevation: 3,
  },
  savedMatchCard: {
    backgroundColor: "#eeeeee",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  savedMatchTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  savedMatchText: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  savedMatchDate: {
    fontSize: 11,
    textAlign: "center",
    color: "#555",
    marginTop: 4,
  },
  savedMatchButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  deleteSavedHalfButton: {
    flex: 1,
    backgroundColor: "#8b1a1a",
    padding: 8,
    borderRadius: 8,
  },
  shareSavedHalfButton: {
    flex: 1,
    backgroundColor: "#146c2e",
    padding: 8,
    borderRadius: 8,
  },
  savedMatchButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  noSavedText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#555",
  },
  shareButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  shareHalfButton: {
    flex: 1,
    backgroundColor: "#146c2e",
    padding: 11,
    borderRadius: 8,
  },
  shareScoreButton: {
    flex: 1,
    backgroundColor: "#7a0019",
    padding: 11,
    borderRadius: 8,
  },
  shareButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  undoButton: {
    backgroundColor: "#444",
    padding: 11,
    borderRadius: 8,
    marginBottom: 8,
  },
  resetText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});