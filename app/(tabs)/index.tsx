import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKeepAwake } from "expo-keep-awake";
import { onValue, ref } from "firebase/database";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db, realtimeDb } from "../../firebaseConfig";

type Sport = "rugby";
type SavedPlayer = {
  number: string;
  name: string;
};  

type SavedTeam = {
  id: string;
  name: string;
  players: SavedPlayer[];
};
type RugbyScoreType =
  | "Try"
  | "Conversion"
  | "Penalty"
  | "Drop Goal"
  | "Penalty Try";

type PendingScore = {
  team: "team1" | "team2";
  scoreType: RugbyScoreType;
} | null;

type Action =
  | "teamTry"
  | "teamConversion"
  | "teamPenalty"
  | "teamDropGoal"
  | "teamPenaltyTry"
  | "oppositionTry"
  | "oppositionConversion"
  | "oppositionPenalty"
  | "oppositionDropGoal"
  | "oppositionPenaltyTry";

export default function HomeScreen() {
  const [sport] = useState<Sport>("rugby");

  const [seconds, setSeconds] = useState(40 * 60);
  const [addedSeconds, setAddedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentHalf, setCurrentHalf] = useState("1st Half");

  const [liveMatchId, setLiveMatchId] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
const [matchStatus, setMatchStatus] = useState("Not Started");
const [matchStartTime, setMatchStartTime] = useState<number | null>(null);
  const [liveSignalOpacity] = useState(new Animated.Value(1));
  const [newMatchStarted, setNewMatchStarted] = useState(false);
  const [pendingScore, setPendingScore] = useState<PendingScore>(null);
const [scorerModalVisible, setScorerModalVisible] = useState(false);
const [scoreSentMessage, setScoreSentMessage] = useState("");
const scoreSentOpacity = useRef(new Animated.Value(1)).current;
const [team1SinBin, setTeam1SinBin] = useState<number | null>(null);
const [team2SinBin, setTeam2SinBin] = useState<number | null>(null);
const [team1RedCard, setTeam1RedCard] = useState(false);
const [team2RedCard, setTeam2RedCard] = useState(false);
const [team1SinBinStartedAt, setTeam1SinBinStartedAt] = useState<number | null>(null);
const [team2SinBinStartedAt, setTeam2SinBinStartedAt] = useState<number | null>(null);

useEffect(() => {
  if (!timerRunning) return;

  const interval = setInterval(() => {
    setTeam1SinBin((time) => {
      if (time === null) return null;
      if (time <= 1) return null;
      return time - 1;
    });

    setTeam2SinBin((time) => {
      if (time === null) return null;
      if (time <= 1) return null;
      return time - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [timerRunning]);

  const scoringColours: {
    name: string;
    colour: string;
    textColour?: string;
    borderColour?: string;
  }[] = [
    { name: "Maroon", colour: "#7a0019" },
    { name: "Red", colour: "#b00020" },
    { name: "Black", colour: "#222222" },
    {
      name: "White",
      colour: "#f2f2f2",
      textColour: "#333333",
      borderColour: "#999999",
    },
    { name: "Dark Grey", colour: "#bfbfbf", textColour: "#000000" },
    { name: "Blue", colour: "#0057b8" },
    { name: "Sky Blue", colour: "#4aa3df" },
    { name: "Green", colour: "#146c2e" },
    { name: "Lime Green", colour: "#4caf50" },
    { name: "Yellow", colour: "#d4a900" },
    { name: "Orange", colour: "#b85c00" },
    { name: "Purple", colour: "#5b2c83" },
  ];

  const [leftScoringColourIndex, setLeftScoringColourIndex] = useState(6);
  const [rightScoringColourIndex, setRightScoringColourIndex] = useState(4);

  const leftScoringColour =
    scoringColours[leftScoringColourIndex] || scoringColours[0];

  const rightScoringColour =
    scoringColours[rightScoringColourIndex] || scoringColours[1];

  const leftButtonTextColour = leftScoringColour.textColour || "white";
  const rightButtonTextColour = rightScoringColour.textColour || "white";

  const leftScoringButtonStyle = [
    styles.button,
    {
      backgroundColor: leftScoringColour.colour,
      borderWidth: 1,
      borderColor: leftScoringColour.borderColour || "#444444",
    },
  ];

  const rightScoringButtonStyle = [
    styles.buttonDark,
    {
      backgroundColor: rightScoringColour.colour,
      borderWidth: 1,
      borderColor: rightScoringColour.borderColour || "#444444",
    },
  ];

  const [teamName, setTeamName] = useState("");
const [oppositionName, setOppositionName] = useState("");
const [competition, setCompetition] = useState("");
const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
const [teamsModalVisible, setTeamsModalVisible] = useState(false);
const [team1SquadId, setTeam1SquadId] = useState<string | null>(null);
const [team2SquadId, setTeam2SquadId] = useState<string | null>(null);
const [awayPlayers, setAwayPlayers] = useState<SavedPlayer[]>([]);
const [newAwayPlayer, setNewAwayPlayer] = useState("");
const [newAwayPlayerNumber, setNewAwayPlayerNumber] = useState("");
const [newTeamName, setNewTeamName] = useState("");
const [newPlayerName, setNewPlayerName] = useState("");
const [newPlayerNumber, setNewPlayerNumber] = useState("");

const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
const [editingTeamName, setEditingTeamName] = useState("");
const [editingTeamNameId, setEditingTeamNameId] = useState<string | null>(null);
  const [teamScore, setTeamScore] = useState(0);
  const [teamGoals, setTeamGoals] = useState(0);
  const [teamPoints, setTeamPoints] = useState(0);

  const [oppositionScore, setOppositionScore] = useState(0);
  const [oppositionGoals, setOppositionGoals] = useState(0);
  const [oppositionPoints, setOppositionPoints] = useState(0);

  const [lastActions, setLastActions] = useState<Action[]>([]);
  const [currentMatchLoaded, setCurrentMatchLoaded] = useState(false);

  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    { icon: "🆕", title: "1. Start New Match", text: "Tap Start New Match when you are ready to set up a new rugby match." },
    { icon: "✍️", title: "2. Enter Team Names", text: "Enter the two team names in the boxes at the top of the scoreboard." },
    { icon: "📡", title: "3. Create Live Match", text: "Tap Create Live Match to create the live match for your viewers." },
    { icon: "🔗", title: "4. Share Live Score", text: "When a live match is created, tap Share Your Score Live and send it to supporters." },
    { icon: "▶️", title: "5. Start Game", text: "Tap Start 1st Half when the referee starts the match." },
    { icon: "👆", title: "6. Hold a Score to Deduct", text: "Made a mistake? Press and hold Try, Conversion, Penalty, Drop Goal or Penalty Try to deduct it." },
    { icon: "💬", title: "7. Keep Viewers Updated", text: "Add match comments at any time — they appear instantly for your live viewers." },
  ];


  const [comment, setComment] = useState("");
const [commentSent, setCommentSent] = useState(false);

const [comments, setComments] = useState<
  { text: string; time: string }[]
>([]);


  useKeepAwake();

  const lastTimerUpdate = useRef(Date.now());
const appState = useRef(AppState.currentState);

const MAX_MATCH_SECONDS = 2 * 60 * 60; // 2 hours
useEffect(() => {
  const loadSavedTeams = async () => {
    try {
      const storedTeams = await AsyncStorage.getItem("rugbySavedTeams");

      if (storedTeams) {
  const parsedTeams = JSON.parse(storedTeams);

  const updatedTeams: SavedTeam[] = parsedTeams.map((team: any) => ({
    ...team,
    players: (team.players || []).map((player: any, index: number) => {
      if (typeof player === "string") {
        return {
          number: String(index + 1),
          name: player,
        };
      }

      return player;
    }),
  }));

  setSavedTeams(updatedTeams);
  await AsyncStorage.setItem(
    "rugbySavedTeams",
    JSON.stringify(updatedTeams)
  );
}
    } catch (error) {
      console.log("Could not load saved teams", error);
    }
  };

  loadSavedTeams();
}, []);

const saveTeams = async (teams: SavedTeam[]) => {
  try {
    setSavedTeams(teams);
    await AsyncStorage.setItem("rugbySavedTeams", JSON.stringify(teams));
  } catch (error) {
    Alert.alert("Save Failed", "The teams could not be saved.");
  }
};

const createSavedTeam = async () => {
  const name = newTeamName.trim();

  if (!name) {
    Alert.alert("Team Name", "Enter a team name first.");
    return;
  }

  const newTeam: SavedTeam = {
    id: Date.now().toString(),
    name,
    players: [],
  };

  await saveTeams([...savedTeams, newTeam]);

  setEditingTeamId(newTeam.id);
  setNewTeamName("");
};
const deleteSavedTeam = (teamId: string) => {
  const selectedTeam = savedTeams.find(
    (team) => team.id === teamId
  );

  if (!selectedTeam) return;

  Alert.alert(
    "Delete Team",
    `Delete ${selectedTeam.name}?`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedTeams = savedTeams.filter(
            (team) => team.id !== teamId
          );

          await saveTeams(updatedTeams);

          if (editingTeamId === teamId) {
            setEditingTeamId(null);
          }

          if (team1SquadId === teamId) {
            setTeam1SquadId(null);
            setTeamName("");
          }

          if (team2SquadId === teamId) {
            setTeam2SquadId(null);
            setOppositionName("");
          }
        },
      },
    ]
  );
};
const addPlayerToTeam = async () => {
  const playerName = newPlayerName.trim();
  const playerNumber = newPlayerNumber.trim();

  if (!editingTeamId || !playerName) return;

  const updatedTeams = savedTeams.map((team) =>
    team.id === editingTeamId
      ? {
          ...team,
          players: [
  ...team.players,
  {
    number: playerNumber,
    name: playerName,
  },
].sort((a, b) => {
  const numberA = parseInt(a.number, 10);
  const numberB = parseInt(b.number, 10);

  if (isNaN(numberA) && isNaN(numberB)) return 0;
  if (isNaN(numberA)) return 1;
  if (isNaN(numberB)) return -1;

  return numberA - numberB;
}),
        }
      : team
  );

  await saveTeams(updatedTeams);

  setNewPlayerName("");
  setNewPlayerNumber("");
};

const deletePlayerFromTeam = async (
  teamId: string,
  playerIndex: number
) => {
  const updatedTeams = savedTeams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          players: team.players.filter(
            (_, index) => index !== playerIndex
          ),
        }
      : team
  );

  await saveTeams(updatedTeams);
};
const updatePlayerNumber = async (
  teamId: string,
  playerIndex: number,
  newNumber: string
) => {
  const updatedTeams = savedTeams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          players: team.players.map((player, index) =>
            index === playerIndex
              ? {
                  ...player,
                  number: newNumber,
                }
              : player
          ),
        }
      : team
  );

  await saveTeams(updatedTeams);
};
const updatePlayerName = async (
  teamId: string,
  playerIndex: number,
  newName: string
) => {
  const updatedTeams = savedTeams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          players: team.players.map((player, index) =>
            index === playerIndex
              ? {
                  ...player,
                  name: newName,
                }
              : player
          ),
        }
      : team
  );

  await saveTeams(updatedTeams);
};
const updateSavedTeamName = async (
  teamId: string,
  newName: string
) => {
  const updatedTeams = savedTeams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          name: newName,
        }
      : team
  );

  await saveTeams(updatedTeams);

  if (team1SquadId === teamId) {
    setTeamName(newName);
  }

  if (team2SquadId === teamId) {
    setOppositionName(newName);
  }
};
const sortTeamPlayersByNumber = async (teamId: string) => {
  const updatedTeams = savedTeams.map((team) => {
    if (team.id !== teamId) return team;

    const sortedPlayers = [...team.players].sort((a, b) => {
      const numberA = parseInt(a.number, 10);
      const numberB = parseInt(b.number, 10);

      if (isNaN(numberA) && isNaN(numberB)) return 0;
      if (isNaN(numberA)) return 1;
      if (isNaN(numberB)) return -1;

      return numberA - numberB;
    });

    return {
      ...team,
      players: sortedPlayers,
    };
  });

  await saveTeams(updatedTeams);
};
const addAwayPlayer = () => {
  const playerName = newAwayPlayer.trim();
  const playerNumber = newAwayPlayerNumber.trim();

  if (!playerName && !playerNumber) return;

  const newPlayer: SavedPlayer = {
    number: playerNumber,
    name: playerName || `Player ${playerNumber}`,
  };

  setAwayPlayers((prev) =>
  [...prev, newPlayer].sort((a, b) => {
    const numberA = parseInt(a.number, 10);
    const numberB = parseInt(b.number, 10);

    if (isNaN(numberA) && isNaN(numberB)) return 0;
    if (isNaN(numberA)) return 1;
    if (isNaN(numberB)) return -1;

    return numberA - numberB;
  })
);

  setNewAwayPlayer("");
  setNewAwayPlayerNumber("");
};
const deleteAwayPlayer = (playerIndex: number) => {
  setAwayPlayers((prev) =>
    prev.filter((_, index) => index !== playerIndex)
  );
};
const updateAwayPlayerNumber = (
  playerIndex: number,
  newNumber: string
) => {
  setAwayPlayers((prev) =>
    prev.map((player, index) =>
      index === playerIndex
        ? {
            ...player,
            number: newNumber,
          }
        : player
    )
  );
};
const updateAwayPlayerName = (
  playerIndex: number,
  newName: string
) => {
  setAwayPlayers((prev) =>
    prev.map((player, index) =>
      index === playerIndex
        ? {
            ...player,
            name: newName,
          }
        : player
    )
  );
};
const sortAwayPlayersByNumber = () => {
  setAwayPlayers((prev) =>
    [...prev].sort((a, b) => {
      const numberA = parseInt(a.number, 10);
      const numberB = parseInt(b.number, 10);

      if (isNaN(numberA) && isNaN(numberB)) return 0;
      if (isNaN(numberA)) return 1;
      if (isNaN(numberB)) return -1;

      return numberA - numberB;
    })
  );
};
const openScorerPicker = (
  team: "team1" | "team2",
  scoreType: RugbyScoreType
) => {
  let players: SavedPlayer[] = [];

  if (team === "team1") {
  if (team1SquadId) {
    const selectedTeam = savedTeams.find(
      (savedTeam) => savedTeam.id === team1SquadId
    );

    players = selectedTeam?.players ?? [];
  } else {
    players = awayPlayers;
  }
} else {
  if (team2SquadId) {
    const selectedTeam = savedTeams.find(
      (savedTeam) => savedTeam.id === team2SquadId
    );

    players = selectedTeam?.players ?? [];
  } else {
    players = awayPlayers;
  }
}

  if (players.length === 0) {
    return;
  }

  setPendingScore({
    team,
    scoreType,
  });

  setScorerModalVisible(true);
};

useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (timerRunning) {
      lastTimerUpdate.current = Date.now();

      timer = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTimerUpdate.current) / 1000);

        if (elapsed > 0) {
          setSeconds((value) => {
  const newValue = value - elapsed;

  if (newValue > 0) {
    return newValue;
  }

  setAddedSeconds((prev) => prev + Math.max(0, elapsed - value));
  return 0;
});

          lastTimerUpdate.current = now;
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
  const subscription = AppState.addEventListener("change", (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active" &&
      timerRunning
    ) {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTimerUpdate.current) / 1000);

      if (elapsed > 0) {
        lastTimerUpdate.current = now;

setSeconds((value) => {
  const newValue = value - elapsed;

  if (newValue > 0) {
    return newValue;
  }

  setAddedSeconds((prev) => prev + Math.max(0, elapsed - value));
  return 0;
});
      }
    }

    appState.current = nextAppState;
  });

  return () => subscription.remove();
}, [timerRunning, addedSeconds]);

  useEffect(() => {
    loadCurrentMatch();
  }, []);

  useEffect(() => {
    const checkTutorial = async () => {
      const completed = await AsyncStorage.getItem("rugbyScoresTutorialCompleted");
      if (!completed) {
        setTutorialStep(0);
        setTutorialVisible(true);
      }
    };

    checkTutorial();
  }, []);

  const finishTutorial = async () => {
    await AsyncStorage.setItem("rugbyScoresTutorialCompleted", "true");
    setTutorialVisible(false);
    setTutorialStep(0);
  };

  const showTutorial = () => {
    setTutorialStep(0);
    setTutorialVisible(true);
  };

  useEffect(() => {
    if (!currentMatchLoaded) return;

    const autoSaveCurrentMatch = async () => {
      const currentMatch = {
        sport,
        seconds,
        addedSeconds,
        timerRunning,
        lastSavedAt: new Date().toISOString(),
        currentHalf,
        matchStatus,
        matchStartTime,
        leftScoringColourIndex,
        rightScoringColourIndex,
        teamName,
        oppositionName,
        teamScore,
        teamGoals,
        teamPoints,
        oppositionScore,
        oppositionGoals,
        oppositionPoints,
        liveMatchId,
        comments,
      };

      await AsyncStorage.setItem("currentMatch", JSON.stringify(currentMatch));
    };

    autoSaveCurrentMatch();
  }, [
    currentMatchLoaded,
    sport,
    seconds,
    addedSeconds,
    timerRunning,
    currentHalf,
    matchStatus,
    matchStartTime,
    leftScoringColourIndex,
    rightScoringColourIndex,
    teamName,
    oppositionName,
    teamScore,
    teamGoals,
    teamPoints,
    oppositionScore,
    oppositionGoals,
    oppositionPoints,
    liveMatchId,
    comments,
  ]);
useEffect(() => {
  if (!liveMatchId) {
    setViewerCount(0);
    return;
  }

  const viewersRef = ref(
    realtimeDb,
    `matchViewers/${liveMatchId}`
  );

  const unsubscribe = onValue(viewersRef, (snapshot) => {
    const viewers = snapshot.val();

    setViewerCount(
      viewers ? Object.keys(viewers).length : 0
    );
  });

  return () => unsubscribe();
}, [liveMatchId]);

const timerSyncBucket = Math.floor((seconds + addedSeconds) / 5);
const sinBinSyncBucket = Math.floor(
  ((team1SinBin ?? 0) + (team2SinBin ?? 0)) / 5
);

useEffect(() => {
  if (!liveMatchId) return;

    const updateLiveMatch = async () => {
      try {
        await updateDoc(doc(db, "matches", liveMatchId), {
          sport,
          teamName,
          oppositionName,
          competition,
          teamGoals,
          teamPoints,
          teamScore,
          oppositionGoals,
          oppositionPoints,
          oppositionScore,
          currentHalf,
          matchStatus,
          matchStartTime,
          seconds,
          addedSeconds,
          timerSyncBucket,
          sinBinSyncBucket,
          team1SinBin,
          team2SinBin,
          team1SinBinStartedAt,
          team2SinBinStartedAt,
          team1RedCard,
          team2RedCard,
          comments,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.log("Live match update failed", error);
      }
    };

    updateLiveMatch();
  }, [
    liveMatchId,
    sport,
    teamName,
    oppositionName,
    competition,
    teamGoals,
    teamPoints,
    teamScore,
    oppositionGoals,
    oppositionPoints,
    oppositionScore,
    currentHalf,
    matchStatus,
    matchStartTime,
    timerSyncBucket,
    sinBinSyncBucket,
    team1RedCard,
    team2RedCard,
    comments,
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
  if (seconds > 0) {
    return formatTime(seconds);
  }

  return `+${formatTime(addedSeconds)}`;
};

  const formatShareTime = () => {
    if (matchStatus === "Half Time") {
      return "Half Time";
    }

    if (matchStatus === "Half Time Extra Time") {
      return "Half Time Extra Time";
    }

    if (matchStatus === "Full Time") {
      return "Full Time";
    }

    if (seconds > 0) {
      return `${currentHalf} - Time Remaining: ${formatTime(seconds)}`;
    }

    return `${currentHalf} - Added Time: ${formatTime(addedSeconds)}`;
  };


const flashLiveSignal = () => {
  liveSignalOpacity.setValue(1);

  Animated.sequence([
    Animated.timing(liveSignalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(liveSignalOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),

    Animated.timing(liveSignalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(liveSignalOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),

    Animated.timing(liveSignalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(liveSignalOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),

    Animated.timing(liveSignalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(liveSignalOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),

    Animated.timing(liveSignalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(liveSignalOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
  ]).start();
};

  const createLiveMatch = async () => {
  if (liveMatchId) {
    Alert.alert(
  "Live match already created",
  "Tap 'Start New Match' to end this live match and create a new one."
);
    return;
  }

  try {
      const newLiveMatchId = Date.now().toString();

      await setDoc(doc(db, "matches", newLiveMatchId), {
        sport,
        teamName,
        oppositionName,
        competition,
        teamGoals,
        teamPoints,
        teamScore,
        oppositionGoals,
        oppositionPoints,
        oppositionScore,
        currentHalf,
        matchStatus: "Not Started",
        matchStartTime: null,
        seconds,
        addedSeconds,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setLiveMatchId(newLiveMatchId);
      setMatchStatus("Not Started");
      flashLiveSignal();

      Alert.alert("Live Match Created", "This match is now ready for live updates.");
    } catch (error) {
      Alert.alert("Live Match Failed", "The live match could not be created.");
    }
  };

  const shareLiveLink = async () => {
    if (!liveMatchId) {
      Alert.alert("No Live Match", "Create a live match first.");
      return;
    }

    const liveLink = `https://rugby-scores-live.web.app/?match=${liveMatchId}`;

const message = `🏐 ${teamName} v ${oppositionName}

Follow live updates on Rugby Scores Live:
${liveLink}`;

    await Share.share({ message });
  };

  const shareScoreOnly = async () => {
    const message = `
🏉 Rugby Score Update

${matchStatus === "Full Time" ? "🏁 Match Ended" : formatShareTime()}

${teamName} ${teamScore}
${oppositionName} ${oppositionScore}
`;

    await Share.share({ message });
  };

  const startFirstHalf = () => {
    const matchStartTime = Date.now();
    if (!teamName.trim() || !oppositionName.trim()) {
  Alert.alert(
    "Team Names Missing",
    "Team 1 and Team 2 have not both been entered. Start anyway?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Start Anyway",
        onPress: () => {
          setCurrentHalf("1st Half");
          setMatchStatus("Match Started");
          setSeconds(40 * 60);
          setAddedSeconds(0);
          setTimerRunning(true);
          setMatchStartTime(matchStartTime);
          addAutoComment("1st Half Started");
        },
      },
    ]
  );

  return;
}
    if (seconds !== 40 * 60 || addedSeconds !== 0 || timerRunning) {
      Alert.alert("Restart 1st Half?", "This will reset the timer to 40:00.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: () => {
            setCurrentHalf("1st Half");
            setMatchStatus("Match Started");
            setSeconds(40 * 60);
            setAddedSeconds(0);
            setTimerRunning(true);
            setMatchStartTime(matchStartTime);
            addAutoComment("1st Half Started");
          },
        },
      ]);

      return;
    }

    setCurrentHalf("1st Half");
    setMatchStatus("Match Started");
    setSeconds(40 * 60);
    setAddedSeconds(0);
    setTimerRunning(true);
    setMatchStartTime(matchStartTime);
  };

const confirmEndFirstHalf = () => {
  Alert.alert("End 1st Half?", "This will mark the live score as Half Time.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "End 1st Half",
      style: "destructive",
      onPress: () => {
        setTimerRunning(false);
        setSeconds(0);
        setAddedSeconds(0);
        setCurrentHalf("Half Time");
        setMatchStatus("Half Time");
        addAutoComment("Half Time");
      },
    },
  ]);
};

const confirmEndFirstHalfExtraTime = () => {
  Alert.alert(
    "End 1st Half Extra Time?",
    "This will stop the timer and show Start 2nd Half ET.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "End 1st Half ET",
        style: "destructive",
        onPress: () => {
          setTimerRunning(false);
          setSeconds(0);
          setAddedSeconds(0);
          setCurrentHalf("Half Time Extra Time");
          setMatchStatus("Half Time Extra Time");
        },
      },
    ]
  );
};

  const confirmEndMatch = () => {
  Alert.alert(
    "End 2nd Half?",
    "Choose what you want to do next.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "1st Half Extra Time",
        onPress: () => {
          setTimerRunning(false);
          setSeconds(10 * 60);
          setAddedSeconds(0);
          setCurrentHalf("Extra Time Ready");
          setMatchStatus("Extra Time Ready");
        },
      },
      {
        text: "End Match",
        style: "destructive",
        onPress: () => {
  setTimerRunning(false);
  setSeconds(0);
  setAddedSeconds(0);
  setCurrentHalf("Full Time");
  setMatchStatus("Full Time");
  setNewMatchStarted(false);
  addAutoComment("Full Time");
},
      },
    ]
  );
};
const confirmEndExtraTime = () => {
  Alert.alert(
    "End 2nd Half ET?",
    "Are you sure you want to end the match?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "End Match",
        style: "destructive",
        onPress: () => {
  setTimerRunning(false);
  setSeconds(0);
  setAddedSeconds(0);
  setCurrentHalf("Full Time");
  setMatchStatus("Full Time");
  setNewMatchStarted(false);
  addAutoComment("Full Time");
},
      },
    ]
  );
};
  const startSecondHalf = () => {
    if (currentHalf !== "2nd Half") {
      Alert.alert("Start 2nd Half?", "This will start the timer at 40:00.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            setCurrentHalf("2nd Half");
            setMatchStatus("2nd Half Started");
            setSeconds(40 * 60);
            setAddedSeconds(0);
            setTimerRunning(true);
            addAutoComment("2nd Half Started");
          },
        },
      ]);

      return;
    }

    if (seconds !== 40 * 60 || addedSeconds !== 0 || timerRunning) {
      Alert.alert("Restart 2nd Half?", "This will reset the timer to 40:00.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: () => {
            setCurrentHalf("2nd Half");
            setMatchStatus("2nd Half Started");
            setSeconds(40 * 60);
            setAddedSeconds(0);
            setTimerRunning(true);
          },
        },
      ]);

      return;
    }

    setCurrentHalf("2nd Half");
    setMatchStatus("2nd Half Started");
    setSeconds(40 * 60);
    setAddedSeconds(0);
    setTimerRunning(true);
  };

  const startSecondHalfExtraTime = () => {
    Alert.alert("Start 2nd Half Extra Time?", "This will start the timer at 10:00.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: () => {
          setCurrentHalf("2nd Half Extra Time");
          setMatchStatus("2nd Half Extra Time Started");
          setSeconds(10 * 60);
          setAddedSeconds(0);
          setTimerRunning(true);
        },
      },
    ]);
  };

  const loadCurrentMatch = async () => {
    try {
      const existingCurrentMatch = await AsyncStorage.getItem("currentMatch");

      if (existingCurrentMatch) {
        const match = JSON.parse(existingCurrentMatch);

        const savedSeconds = match.seconds ?? 40 * 60;
        const savedAddedSeconds = match.addedSeconds || 0;

        if (match.timerRunning && match.lastSavedAt) {
          const elapsed = Math.floor(
            (Date.now() - new Date(match.lastSavedAt).getTime()) / 1000
          );

          if (savedSeconds > elapsed) {
            setSeconds(savedSeconds - elapsed);
            setAddedSeconds(savedAddedSeconds);
          } else {
            setSeconds(0);
            setAddedSeconds(savedAddedSeconds + (elapsed - savedSeconds));
          }

          setTimerRunning(true);
          lastTimerUpdate.current = Date.now();
        } else {
          setSeconds(savedSeconds);
          setAddedSeconds(savedAddedSeconds);
          setTimerRunning(false);
        }

        setCurrentHalf(match.currentHalf || "1st Half");
        setMatchStatus(match.matchStatus || "Not Started");

        const savedLeftColourIndex = match.leftScoringColourIndex ?? 0;
        const savedRightColourIndex = match.rightScoringColourIndex ?? 1;

        setLeftScoringColourIndex(
          savedLeftColourIndex >= 0 && savedLeftColourIndex < scoringColours.length
            ? savedLeftColourIndex
            : 0
        );

        setRightScoringColourIndex(
          savedRightColourIndex >= 0 && savedRightColourIndex < scoringColours.length
            ? savedRightColourIndex
            : 1
        );

        setTeamName(match.teamName || "");
setOppositionName(match.oppositionName || "");

        setTeamScore(match.teamScore || 0);
        setTeamGoals(match.teamGoals || 0);
        setTeamPoints(match.teamPoints || 0);

        setOppositionScore(match.oppositionScore || 0);
        setOppositionGoals(match.oppositionGoals || 0);
        setOppositionPoints(match.oppositionPoints || 0);

        setLiveMatchId(match.liveMatchId || "");
        setComments(match.comments || []);
      }

      setCurrentMatchLoaded(true);
    } catch (error) {
      setCurrentMatchLoaded(true);
      Alert.alert("Restore Failed", "The current match could not be restored.");
    }
  };

  const confirmDeductScore = (
    team: "team1" | "team2",
    scoreType: RugbyScoreType,
    points: number
  ) => {
    const name = team === "team1" ? teamName : oppositionName;

    Alert.alert(
      `Remove ${scoreType}?`,
      `Remove ${points} point${points === 1 ? "" : "s"} from ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (team === "team1") {
              setTeamScore((value) => Math.max(0, value - points));
            } else {
              setOppositionScore((value) => Math.max(0, value - points));
            }
            addAutoComment(`Score Correction: ${scoreType} Removed - ${name}`);
          },
        },
      ]
    );
  };

const checkHalfTimeBeforeScoring = (addCorrection: () => void) => {
  if (matchStatus === "Not Started") {
    Alert.alert(
      "Match Has Not Started",
      "Start the 1st half before adding a score.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Start 1st Half",
          onPress: startFirstHalf,
        },
      ]
    );

    return true;
  }

  if (matchStatus === "Half Time") {
    Alert.alert(
      "Match is at Half Time",
      "Don't forget to start the 2nd half before adding a new score.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add Correction",
          onPress: addCorrection,
        },
        {
          text: "Start 2nd Half",
          onPress: startSecondHalf,
        },
      ]
    );

    return true;
  }

  if (matchStatus === "Extra Time Ready") {
    Alert.alert(
      "Extra Time Has Not Started",
      "Don't forget to start the 1st half of extra time before adding a new score.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add Correction",
          onPress: addCorrection,
        },
        {
          text: "Start Extra Time",
          onPress: () => {
            setCurrentHalf("1st Half Extra Time");
            setMatchStatus("1st Half Extra Time");
            setSeconds(10 * 60);
            setAddedSeconds(0);
            setTimerRunning(true);
            addAutoComment("1st Half Extra Time Started");
          },
        },
      ]
    );

    return true;
  }

  if (matchStatus === "Half Time Extra Time") {
    Alert.alert(
      "Extra Time is at Half Time",
      "Don't forget to start the 2nd half of extra time before adding a new score.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add Correction",
          onPress: addCorrection,
        },
        {
          text: "Start 2nd Half ET",
          onPress: startSecondHalfExtraTime,
        },
      ]
    );

    return true;
  }

  return false;
};
  const undoLastAction = () => {
    if (lastActions.length === 0) return;

    const lastAction = lastActions[lastActions.length - 1];

    const values: Record<Action, { team: "team1" | "team2"; points: number }> = {
      teamTry: { team: "team1", points: 5 },
      teamConversion: { team: "team1", points: 2 },
      teamPenalty: { team: "team1", points: 3 },
      teamDropGoal: { team: "team1", points: 3 },
      teamPenaltyTry: { team: "team1", points: 7 },
      oppositionTry: { team: "team2", points: 5 },
      oppositionConversion: { team: "team2", points: 2 },
      oppositionPenalty: { team: "team2", points: 3 },
      oppositionDropGoal: { team: "team2", points: 3 },
      oppositionPenaltyTry: { team: "team2", points: 7 },
    };

    const item = values[lastAction];

    if (item.team === "team1") {
      setTeamScore((value) => Math.max(0, value - item.points));
    } else {
      setOppositionScore((value) => Math.max(0, value - item.points));
    }

    setLastActions((actions) => actions.slice(0, -1));
  };

  const getCommentTime = () => {
    const normalHalfLength = 40 * 60;
    const extraHalfLength = 10 * 60;
    const isExtraTime = currentHalf.toLowerCase().includes("extra");
    const halfLength = isExtraTime ? extraHalfLength : normalHalfLength;

    if (seconds > 0) {
      return formatTime(Math.max(0, halfLength - seconds));
    }

    const baseMinute = isExtraTime ? 10 : 40;
    return `${baseMinute + Math.floor(addedSeconds / 60)}+`;
  };

  const addAutoComment = (text: string) => {
    setComments((currentComments) => [
      ...currentComments,
      {
        text,
        time: getCommentTime(),
      },
    ]);
  };

  const addComment = () => {
  if (!liveMatchId) {
    Alert.alert("No Live Match", "Create a live match before adding comments.");
    return;
  }

  if (!comment.trim()) return;

  setComments((currentComments) => [
    ...currentComments,
    {
      text: comment.trim(),
      time: getCommentTime(),
    },
  ]);

  setComment("");
  setCommentSent(true);

  setTimeout(() => {
    setCommentSent(false);
  }, 2000);
};

  const addRugbyScore = (
    team: "team1" | "team2",
    scoreType: RugbyScoreType,
    points: number,
    action: Action
  ) => {
    const name = team === "team1" ? teamName : oppositionName;

    const applyScore = (correction = false) => {
      if (team === "team1") {
        setTeamScore((value) => value + points);
      } else {
        setOppositionScore((value) => value + points);
      }

      addAction(action);

      if (correction) {
        addAutoComment(`Score Correction: ${scoreType} - ${name}`);
        return;
      }

      const hasPlayers =
        team === "team1"
          ? Boolean(team1SquadId || awayPlayers.length > 0)
          : Boolean(team2SquadId || awayPlayers.length > 0);

      if (hasPlayers) {
        openScorerPicker(team, scoreType);
      } else {
        addAutoComment(`${scoreType} - ${name}`);
      }
    };

    if (checkHalfTimeBeforeScoring(() => applyScore(true))) return;
    applyScore(false);
  };

  const resetEverything = async () => {
    setTimerRunning(false);
    setSeconds(40 * 60);
    setAddedSeconds(0);
    setCurrentHalf("1st Half");
    setMatchStatus("Not Started");
    setLiveMatchId("");
    setNewMatchStarted(true);

    setTeamName("");
setOppositionName("");

    setTeamScore(0);
    setTeamGoals(0);
    setTeamPoints(0);

    setOppositionScore(0);
    setOppositionGoals(0);
    setOppositionPoints(0);

    setLastActions([]);
    setComment("");
    setComments([]);
setAwayPlayers([]);
setNewAwayPlayer("");
setNewAwayPlayerNumber("");
setTeam1SquadId(null);
setTeam2SquadId(null);
setTeam1SinBin(null);
setTeam2SinBin(null);
setTeam1SinBinStartedAt(null);
setTeam2SinBinStartedAt(null);
setTeam1RedCard(false);
setTeam2RedCard(false);
    await AsyncStorage.removeItem("currentMatch");
  };

  const confirmResetMatch = () => {
  Alert.alert(
    "Start New Match?",
    "Are you sure you want to start a new match?\n\nIf you have shared the live link, this will end the current live match.You will need to share the new link again.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start New Match",
        style: "destructive",
        onPress: resetEverything,
      },
    ]
  );
};

const openManageTeams = async () => {
  try {
    const hasSeenPlayerTip = await AsyncStorage.getItem(
      "hasSeenPlayerSetupTip"
    );

    if (hasSeenPlayerTip === "true") {
      setTeamsModalVisible(true);
      return;
    }

    Alert.alert(
      "Manage Teams & Players",
      "Add your players for faster scoring.\n\nWhen a score happens, simply tap the scorer’s name and it will automatically appear on the live match page — no typing needed.\n\nChoose your saved team and tap Done to load the players.",
      [
        {
          text: "Continue",
          onPress: async () => {
            await AsyncStorage.setItem("hasSeenPlayerSetupTip", "true");
            setTeamsModalVisible(true);
          },
        },
      ],
      { cancelable: false }
    );
  } catch (error) {
    console.log("Player setup tip error:", error);
    setTeamsModalVisible(true);
  }
};

const giveYellowCard = () => {
  Alert.alert(
    "🟨 Yellow Card",
    "Which team received the yellow card?",
    [
      {
        text: teamName || "Team 1",
        onPress: () => {
  setTeam1SinBin(10 * 60);
  setTeam1SinBinStartedAt(Date.now());
  addAutoComment(`🟨 Yellow Card - ${teamName || "Team 1"} - Sin Bin 10:00`);
},
      },
      {
        text: oppositionName || "Team 2",
        onPress: () => {
  setTeam2SinBin(10 * 60);
  setTeam2SinBinStartedAt(Date.now());
  addAutoComment(`🟨 Yellow Card - ${oppositionName || "Team 2"} - Sin Bin 10:00`);
},
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]
  );
};

const giveRedCard = () => {
  Alert.alert(
    "🟥 Red Card",
    "Which team received the red card?",
    [
      {
        text: teamName || "Team 1",
        onPress: () => {
  setTeam1RedCard(true);
  addAutoComment(
    `🟥 Red Card - ${teamName || "Team 1"}`
  );
},
      },
      {
        text: oppositionName || "Team 2",
        onPress: () => {
  setTeam2RedCard(true);
  addAutoComment(
    `🟥 Red Card - ${oppositionName || "Team 2"}`
  );
},
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]
  );
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Rugby Scores Live</Text>
        <TouchableOpacity
  style={styles.helpButton}
  onPress={showTutorial}
  activeOpacity={0.7}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      </View>
<TouchableOpacity
  style={[styles.manageTeamsButton, { display: "none" }]}
  onPress={openManageTeams}
>
  <View
  style={{
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Text style={styles.manageTeamsButtonText}>
    Manage Teams & Players
  </Text>
  
  <Text
  style={{
    position: "absolute",
    right: 18,
    fontSize: 12,
    opacity: 0.60,
    fontWeight: "400",
    color: "#F2F2F2",
  }}
>
  (Optional)
</Text>
</View>
</TouchableOpacity>
      <View style={styles.compactTimerBox}>
        <Text style={styles.currentHalfText}>{currentHalf}</Text>

        <View style={styles.timerTimeRow}>
          <TouchableOpacity
  style={[styles.sportIconButton, styles.sportIconButtonSelected]}
  onPress={giveYellowCard}
>
  <Text style={styles.sportIconText}>🟨</Text>
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
    seconds === 0 &&
      matchStatus !== "Half Time" &&
      matchStatus !== "Half Time Extra Time" &&
      matchStatus !== "Full Time" &&
      styles.addedTimeText,
  ]}
>
  {matchStatus === "Half Time" ||
  matchStatus === "Half Time Extra Time" ||
  matchStatus === "Full Time"
    ? "00:00"
    : formatTimerDisplay()}
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
  style={[styles.sportIconButton, styles.sportIconButtonSelected]}
  onPress={giveRedCard}
>
  <Text style={styles.sportIconText}>🟥</Text>
</TouchableOpacity>
        </View>

{(team1SinBin !== null || team2SinBin !== null) && (
  <View style={{ alignItems: "center", marginTop: 6, marginBottom: 6 }}>
    {team1SinBin !== null && (
      <Text style={{ fontWeight: "bold", fontSize: 14 }}>
        🟨 {teamName || "Team 1"} Sin Bin —{" "}
        {Math.floor(team1SinBin / 60)}:
        {String(team1SinBin % 60).padStart(2, "0")}
      </Text>
    )}

    {team2SinBin !== null && (
      <Text style={{ fontWeight: "bold", fontSize: 14 }}>
        🟨 {oppositionName || "Team 2"} Sin Bin —{" "}
        {Math.floor(team2SinBin / 60)}:
        {String(team2SinBin % 60).padStart(2, "0")}
      </Text>
    )}
  </View>
)}

{(team1RedCard || team2RedCard) && (
  <View style={{ alignItems: "center", marginTop: 4, marginBottom: 6 }}>
    {team1RedCard && (
      <Text style={{ fontWeight: "bold", fontSize: 14 }}>
        🟥 {teamName || "Team 1"} — Red Card
      </Text>
    )}

    {team2RedCard && (
      <Text style={{ fontWeight: "bold", fontSize: 14 }}>
        🟥 {oppositionName || "Team 2"} — Red Card
      </Text>
    )}
  </View>
)}

        <View style={styles.timerButtonRow}>

  {/* ONE MAIN MATCH CONTROL BUTTON */}
  <TouchableOpacity
    style={[
      styles.matchControlButton,

      (matchStatus === "Match Started" ||
        matchStatus === "1st Half Extra Time" ||
        matchStatus === "2nd Half Started" ||
        matchStatus === "2nd Half Extra Time Started") &&
        styles.timerStopButton,

      matchStatus === "Full Time" && styles.timerFullTimeButton,
    ]}
    disabled={matchStatus === "Full Time"}
    onPress={() => {
      if (matchStatus === "Not Started") {
        startFirstHalf();
      }

      else if (matchStatus === "Match Started") {
        confirmEndFirstHalf();
      }

      else if (matchStatus === "Half Time") {
        startSecondHalf();
      }

      else if (matchStatus === "2nd Half Started") {
        confirmEndMatch();
      }

      else if (matchStatus === "Extra Time Ready") {
        setCurrentHalf("1st Half Extra Time");
        setMatchStatus("1st Half Extra Time");
        setSeconds(10 * 60);
        setAddedSeconds(0);
        setTimerRunning(true);
        addAutoComment("1st Half Extra Time Started");
      }

      else if (matchStatus === "1st Half Extra Time") {
        confirmEndFirstHalfExtraTime();
      }

      else if (matchStatus === "Half Time Extra Time") {
        startSecondHalfExtraTime();
      }

      else if (matchStatus === "2nd Half Extra Time Started") {
        confirmEndExtraTime();
      }
    }}
  >
    <Text
      style={[
        styles.timerButtonText,
        {
          color:
            matchStatus === "Not Started" ||
            matchStatus === "Half Time" ||
            matchStatus === "Extra Time Ready" ||
            matchStatus === "Half Time Extra Time"
              ? "#222"
              : "white",
        },
      ]}
    >
      {matchStatus === "Not Started"
        ? "Start 1st Half"
        : matchStatus === "Match Started"
        ? "End 1st Half"
        : matchStatus === "Half Time"
        ? "Start 2nd Half"
        : matchStatus === "2nd Half Started"
? "End 2nd Half"
        : matchStatus === "Extra Time Ready"
        ? "Start 1st Half ET"
        : matchStatus === "1st Half Extra Time"
        ? "End 1st Half ET"
        : matchStatus === "Half Time Extra Time"
        ? "Start 2nd Half ET"
        : matchStatus === "2nd Half Extra Time Started"
        ? "End Match"
        : matchStatus === "Full Time"
        ? "Full Time"
        : "Start 1st Half"}
    </Text>
  </TouchableOpacity>
    
</View>
<TextInput
  style={{
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
    textAlign: "center",
  }}
  value={competition}
  onChangeText={setCompetition}
  placeholder="Competition / Round (Optional)"
  placeholderTextColor="#777777"
/>
      <View style={styles.scoreboard}>
        <View style={styles.scoreCard}>
          <TextInput
            style={[
              styles.teamNameInput,
              {
                backgroundColor: leftScoringColour.colour,
                color: leftButtonTextColour,
                borderWidth: 1,
                borderColor: leftScoringColour.borderColour || "#444444",
              },
            ]}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Enter Team 1"
            placeholderTextColor={leftButtonTextColour}
          />
          <Text style={styles.rugbyScore}>
            {teamScore}
          </Text>
        </View>

        <View style={styles.scoreCard}>
          <TextInput
            style={[
              styles.teamNameInput,
              {
                backgroundColor: rightScoringColour.colour,
                color: rightButtonTextColour,
                borderWidth: 1,
                borderColor: rightScoringColour.borderColour || "#444444",
              },
            ]}
            value={oppositionName}
            onChangeText={setOppositionName}
            placeholder="Enter Team 2"
            placeholderTextColor={rightButtonTextColour}
          />
          <Text style={styles.rugbyScore}>
            {oppositionScore}
          </Text>
        </View>
      </View>

      <View style={styles.scoreBox}>

  <View style={styles.scoringHeaderRow}>
  <Text
  style={styles.scoringTeamName}
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.7}
>
  {teamName}
</Text>

  <View style={styles.pauseHeaderSlot}>
    <TouchableOpacity
      style={[
        styles.pauseIconButton,
        !(
          matchStatus === "Match Started" ||
          matchStatus === "2nd Half Started" ||
          matchStatus === "1st Half Extra Time" ||
          matchStatus === "2nd Half Extra Time Started"
        ) && styles.disabledPauseButton,
      ]}
      disabled={
        !(
          matchStatus === "Match Started" ||
          matchStatus === "2nd Half Started" ||
          matchStatus === "1st Half Extra Time" ||
          matchStatus === "2nd Half Extra Time Started"
        )
      }
      onPress={() => setTimerRunning(!timerRunning)}
    >
      <Text style={styles.pauseIcon}>
        {timerRunning ? "⏸" : "▶"}
      </Text>
    </TouchableOpacity>
  </View>

  <Text
  style={styles.scoringTeamName}
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.7}
>
  {oppositionName}
</Text>
</View>
  <View style={styles.twoColumnButtons}>
          <View style={styles.teamColumn}>
            {([
              ["Try", 5, "teamTry"],
              ["Conversion", 2, "teamConversion"],
              ["Penalty", 3, "teamPenalty"],
              ["Drop Goal", 3, "teamDropGoal"],
              ["Penalty Try", 7, "teamPenaltyTry"],
            ] as [RugbyScoreType, number, Action][]).map(([label, points, action]) => (
              <TouchableOpacity
                key={label}
                style={leftScoringButtonStyle}
                delayLongPress={1000}
                onLongPress={() => confirmDeductScore("team1", label, points)}
                onPress={() => addRugbyScore("team1", label, points, action)}
              >
                <Text style={[styles.buttonText, { color: leftButtonTextColour }]}>
                  + {label} ({points})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.teamColumn}>
            {([
              ["Try", 5, "oppositionTry"],
              ["Conversion", 2, "oppositionConversion"],
              ["Penalty", 3, "oppositionPenalty"],
              ["Drop Goal", 3, "oppositionDropGoal"],
              ["Penalty Try", 7, "oppositionPenaltyTry"],
            ] as [RugbyScoreType, number, Action][]).map(([label, points, action]) => (
              <TouchableOpacity
                key={label}
                style={rightScoringButtonStyle}
                delayLongPress={1000}
                onLongPress={() => confirmDeductScore("team2", label, points)}
                onPress={() => addRugbyScore("team2", label, points, action)}
              >
                <Text style={[styles.buttonText, { color: rightButtonTextColour }]}>
                  + {label} ({points})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
{matchStatus === "Not Started" && (
  <Text
    style={{
      fontSize: 11,
      opacity: 0.6,
      textAlign: "center",
      marginTop: 4,
      marginBottom: 8,
    }}
  >
    Tip: Hold a score button to deduct
  </Text>
)}
      <View style={styles.scoreBox}>
        <View style={styles.commentsHeader}>
  <Text style={styles.commentsSide}>
    {liveMatchId ? "🔴 LIVE" : ""}
  </Text>

  <Text style={styles.sectionTitle}>
  💬 Comments shown to live viewers
</Text>

  <Text style={[styles.commentsSide, { textAlign: "right" }]}>
    {liveMatchId ? `👥 ${viewerCount}` : ""}
  </Text>
</View>

        <View style={{ position: "relative" }}>
  <TextInput
    style={styles.commentInput}
    value={comment}
    onChangeText={setComment}
    placeholder={
  scoreSentMessage
    ? ""
    : commentSent
    ? "✓ Comment Added"
    : "Type match comment..."
}
    placeholderTextColor={commentSent ? "#146c2e" : "#777"}
  />

  {scoreSentMessage !== "" && (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 14,
        top: 14,
        opacity: scoreSentOpacity,
        color: "#777",
      }}
    >
      {scoreSentMessage}
    </Animated.Text>
  )}
</View>

        <TouchableOpacity style={styles.liveMatchButton} onPress={addComment}>
  <Text style={styles.shareButtonText}>Add Comment</Text>
</TouchableOpacity>

      </View>

<TouchableOpacity
  style={[
  styles.newMatchHalfButton,
  styles.startNewMatchHalfButton,
  { marginBottom: 8 }
]}
  onPress={confirmResetMatch}
>
          <View style={styles.actionStepRow}>
  <View style={styles.actionStepBadge}>
    <Text style={styles.actionStepBadgeText}>1</Text>
  </View>

  <Text style={styles.shareButtonText}>
  {newMatchStarted ? "✓ New Match Started" : "Start New Match"}
</Text>
</View>
        </TouchableOpacity>
      <TouchableOpacity style={styles.liveMatchButton} onPress={createLiveMatch}>
  <View style={styles.actionStepRow}>
    <View style={styles.actionStepBadge}>
      <Text style={styles.actionStepBadgeText}>2</Text>
    </View>

    {liveMatchId && (
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: "#d00000",
          marginTop: -2,
        }}
      />
    )}

    <Text style={styles.shareButtonText}>
  {liveMatchId
  ? "✓ Live Match Created"
  : "Create Live Match"}
</Text>
  </View>
</TouchableOpacity>

      <TouchableOpacity style={styles.liveShareButton} onPress={shareLiveLink}>
  <View style={styles.actionStepRow}>
    <View style={styles.actionStepBadge}>
      <Text style={styles.actionStepBadgeText}>3</Text>
    </View>

    <Text style={styles.shareButtonText}>
      💬 Share Your Score Live
    </Text>

    {liveMatchId ? (
      <Animated.Text
        style={[
          styles.liveSignalIcon,
          {
            opacity: liveSignalOpacity,
          },
        ]}
      >
        📡
      </Animated.Text>
    ) : null}
  </View>
</TouchableOpacity>

      <View style={styles.shareButtonRow}>

        <TouchableOpacity
  style={[styles.shareHalfButton, styles.currentScoreButton]}
  onPress={shareScoreOnly}
>
          <Text
  style={[
    styles.shareButtonText,
    { fontSize: 13, paddingTop: 2 }
  ]}
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.8}
>
  💬 Share Current Score
</Text>
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
      </View>
  <Modal
  visible={teamsModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setTeamsModalVisible(false)}
>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <View style={styles.teamsModalOverlay}>
      <View style={styles.teamsModalBox}>

      <Text style={styles.teamsModalTitle}>
        Teams & Players
      </Text>

      <ScrollView
        style={styles.teamsModalScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text
  style={{
    fontSize: 12,
    opacity: 0.65,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 10,
  }}
>
  <Text style={{ fontWeight: "700" }}>Tip: </Text>
  Add players to quickly select and share scorers with fans during a live match.
</Text>
<Text style={styles.teamsSectionTitle}>
          Add New Team
        </Text>

        <TextInput
          style={styles.teamManagerInput}
          value={newTeamName}
          onChangeText={setNewTeamName}
          placeholder="e.g. Ruairí Óg U16"
        />

        <TouchableOpacity
          style={styles.teamManagerAddButton}
          onPress={createSavedTeam}
        >
          <Text style={styles.teamManagerAddButtonText}>
            + Add Team
          </Text>
        </TouchableOpacity>
        <Text style={styles.teamsSectionTitle}>
  Saved Teams{" "}
  <Text
    style={{
      fontSize: 12,
      opacity: 0.6,
      fontWeight: "400",
    }}
  >
    (Tap the team that's playing)
  </Text>
</Text>

        {savedTeams.length === 0 && (
          <Text style={styles.noTeamsText}>
            No teams saved yet.
          </Text>
        )}

        {savedTeams.map((team) => (
          <View
  key={team.id}
  style={[
    styles.savedTeamButton,
    editingTeamId === team.id &&
      styles.savedTeamButtonSelected,
    {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  ]}
>
  <TouchableOpacity
    style={{ flex: 1 }}
    onPress={() => {
  setEditingTeamId(team.id);
  setEditingTeamNameId(null);
  setEditingTeamName("");
}}
  >
    <Text style={styles.savedTeamName}>
      {team.name}
    </Text>

    <Text style={styles.savedTeamPlayerCount}>
      {team.players.length} players
    </Text>
  </TouchableOpacity>

  <View style={{ flexDirection: "row", gap: 10 }}>
    <TouchableOpacity
  onPress={() => {
  setEditingTeamId(team.id);
  setEditingTeamNameId(team.id);
  setEditingTeamName(team.name);
}}
>
  <Text style={{ fontWeight: "600" }}>
    Edit
  </Text>
</TouchableOpacity>

    <TouchableOpacity
  onPress={() => deleteSavedTeam(team.id)}
>
  <Text style={{ fontWeight: "600" }}>
    Delete
  </Text>
</TouchableOpacity>
  </View>
</View>
        ))}

        {editingTeamId && (
          <>
{editingTeamNameId === editingTeamId && (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
  <TextInput
    style={[
      styles.teamManagerInput,
      {
        flex: 1,
        marginBottom: 0,
      },
    ]}
    value={editingTeamName}
    onChangeText={setEditingTeamName}
    placeholder="Team name"
  />

  <TouchableOpacity
    style={styles.smallAddPlayerButton}
    onPress={async () => {
  const newName = editingTeamName.trim();

  if (!editingTeamId || !newName) return;

  await updateSavedTeamName(
    editingTeamId,
    newName
  );

  setEditingTeamName("");
  setEditingTeamId(null);
}}
  >
    <Text style={styles.teamManagerAddButtonText}>
      Save
    </Text>
  </TouchableOpacity>
</View>
)}
<Text
  style={[
    styles.editingTeamText,
    {
      fontSize: 13,
      opacity: 0.6,
      marginBottom: 6,
    },
  ]}
>
  (Select Team 1 or Team 2 for{" "}
  {savedTeams.find((team) => team.id === editingTeamId)?.name || "team"})
</Text>

<View style={styles.loadTeamRow}>
  <TouchableOpacity
    style={styles.loadTeamButton}
    onPress={() => {
      const selectedTeam = savedTeams.find(
        (team) => team.id === editingTeamId
      );

      if (!selectedTeam) return;

      setTeamName(selectedTeam.name);
setTeam1SquadId(selectedTeam.id);

if (team2SquadId === selectedTeam.id) {
  setTeam2SquadId(null);
  setOppositionName("");
}
    }}
  >
    <Text
  style={[
    styles.loadTeamButtonText,
    !team1SquadId && { opacity: 0.45 },
  ]}
>
  {team1SquadId ? teamName : "Team 1 (Home)"}
</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.loadTeamButton}
    onPress={() => {
      const selectedTeam = savedTeams.find(
        (team) => team.id === editingTeamId
      );

      if (!selectedTeam) return;

      setOppositionName(selectedTeam.name);
setTeam2SquadId(selectedTeam.id);

if (team1SquadId === selectedTeam.id) {
  setTeam1SquadId(null);
  setTeamName("");
}
    }}
  >
    <Text
  style={[
    styles.loadTeamButtonText,
    !team2SquadId && { opacity: 0.45 },
  ]}
>
  {team2SquadId ? oppositionName : "Team 2 (Away)"}
</Text>
  </TouchableOpacity>
</View>
<Text style={styles.teamsSectionTitle}>
  {savedTeams.find((team) => team.id === editingTeamId)?.name || "Team"} Players{" "}
  <Text
    style={{
      fontSize: 12,
      opacity: 0.6,
      fontWeight: "400",
    }}
  >
    (Add / Edit Players)
  </Text>
</Text>
            <View style={styles.addPlayerRow}>
  <TextInput
    style={[
      styles.teamManagerInput,
      {
        width: 70,
        marginBottom: 0,
        textAlign: "center",
      },
    ]}
    value={newPlayerNumber}
    onChangeText={setNewPlayerNumber}
    placeholder="No."
    keyboardType="number-pad"
  />

  <TextInput
    style={[
      styles.teamManagerInput,
      { flex: 1, marginBottom: 0 },
    ]}
    value={newPlayerName}
    onChangeText={setNewPlayerName}
    placeholder="Player name"
    onSubmitEditing={addPlayerToTeam}
  />

  <TouchableOpacity
    style={styles.smallAddPlayerButton}
    onPress={addPlayerToTeam}
  >
    <Text style={styles.teamManagerAddButtonText}>
      Add
    </Text>
  </TouchableOpacity>
</View>

            
          </>
        )}

        {savedTeams
  .find((team) => team.id === editingTeamId)
  ?.players.map((player, index) => (
    <View
      key={`${editingTeamId}-${index}`}
      style={styles.playerManagerRow}
    >
      <TextInput
  style={styles.editPlayerNumberInput}
  value={player.number}
  onChangeText={(value) =>
    updatePlayerNumber(
      editingTeamId!,
      index,
      value
    )
  }
  keyboardType="number-pad"
  placeholder="No."
  selectTextOnFocus
  onEndEditing={() =>
    sortTeamPlayersByNumber(editingTeamId!)
  }
/>

      <TextInput
  style={[
    styles.teamManagerInput,
    {
      flex: 1,
      marginBottom: 0,
      paddingVertical: 6,
    },
  ]}
  value={player.name}
  onChangeText={(value) =>
    updatePlayerName(
      editingTeamId!,
      index,
      value
    )
  }
/>

      <TouchableOpacity
        onPress={() =>
          deletePlayerFromTeam(
            editingTeamId!,
            index
          )
        }
      >
        <Text style={styles.deletePlayerText}>
          ✕
        </Text>
      </TouchableOpacity>
    </View>
  ))}

<Text style={styles.teamsSectionTitle}>
  Opponent (Optional)
</Text>

<TextInput
  style={styles.teamManagerInput}
  value={
  team2SquadId
    ? teamName
    : oppositionName
}
onChangeText={(value) => {
  if (team2SquadId) {
    setTeamName(value);
  } else {
    setOppositionName(value);
  }
}}
  placeholder="Enter opponent name"
/>
<View style={styles.addPlayerRow}>
  <TextInput
    style={[
      styles.teamManagerInput,
      {
        width: 70,
        marginBottom: 0,
        textAlign: "center",
      },
    ]}
    value={newAwayPlayerNumber}
    onChangeText={setNewAwayPlayerNumber}
    placeholder="No."
    keyboardType="number-pad"
  />

  <TextInput
    style={[
      styles.teamManagerInput,
      { flex: 1, marginBottom: 0 },
    ]}
    value={newAwayPlayer}
    onChangeText={setNewAwayPlayer}
    placeholder="Player name"
    onSubmitEditing={addAwayPlayer}
  />

  <TouchableOpacity
    style={styles.smallAddPlayerButton}
    onPress={addAwayPlayer}
  >
    <Text style={styles.teamManagerAddButtonText}>
      Add
    </Text>
  </TouchableOpacity>
</View>

{awayPlayers.map((player, index) => (
  <View
    key={`${player}-${index}`}
    style={styles.playerManagerRow}
  >
    <TextInput
  style={styles.editPlayerNumberInput}
  value={player.number}
  onChangeText={(value) =>
    updateAwayPlayerNumber(index, value)
  }
  onBlur={sortAwayPlayersByNumber}
  keyboardType="number-pad"
  placeholder="No."
  selectTextOnFocus
/>

<TextInput
  style={[
    styles.teamManagerInput,
    {
      flex: 1,
      marginBottom: 0,
      paddingVertical: 6,
    },
  ]}
  value={player.name}
  onChangeText={(value) =>
    updateAwayPlayerName(index, value)
  }
/>

    <TouchableOpacity
      onPress={() => deleteAwayPlayer(index)}
    >
      <Text style={styles.deletePlayerText}>
        ✕
      </Text>
    </TouchableOpacity>
  </View>
))}
      </ScrollView>

      <TouchableOpacity
        style={styles.closeTeamsButton}
        onPress={() => setTeamsModalVisible(false)}
      >
        <Text style={styles.closeTeamsButtonText}>
          Done
        </Text>
      </TouchableOpacity>

    </View>
  </View>
  </KeyboardAvoidingView>
</Modal>
<Modal
  visible={scorerModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => {
    setScorerModalVisible(false);
    setPendingScore(null);
  }}
>
  <View style={styles.teamsModalOverlay}>
    <View style={styles.teamsModalBox}>
      <Text style={styles.teamsModalTitle}>
        Select Scorer
      </Text>

      <ScrollView>
        {(
  pendingScore?.team === "team1"
  ? (
      team1SquadId
        ? savedTeams.find(
            (team) => team.id === team1SquadId
          )?.players ?? []
        : awayPlayers
    )
  : (
      team2SquadId
        ? savedTeams.find(
            (team) => team.id === team2SquadId
          )?.players ?? []
        : awayPlayers
    )
)
  .slice()
  .sort((a, b) => {
    const numberA = parseInt(a.number, 10);
    const numberB = parseInt(b.number, 10);

    if (isNaN(numberA) && isNaN(numberB)) return 0;
    if (isNaN(numberA)) return 1;
    if (isNaN(numberB)) return -1;

    return numberA - numberB;
  })
  .map((player, index) => (
          <TouchableOpacity
  key={`${player.name}-${index}`}
  style={[
    styles.savedTeamButton,
    {
      paddingVertical: 14,
      marginBottom: 8,
    },
  ]}
  onPress={() => {
              if (!pendingScore) return;

              const scorerMessage = `${player.name} - ${pendingScore.scoreType}`;

addAutoComment(scorerMessage);

setScoreSentMessage(`${scorerMessage} sent`);
scoreSentOpacity.setValue(1);

setTimeout(() => {
  Animated.timing(scoreSentOpacity, {
    toValue: 0,
    duration: 500,
    useNativeDriver: true,
  }).start(() => {
    setTimeout(() => {
      setScoreSentMessage("");
      scoreSentOpacity.setValue(1);
    }, 150);
  });
}, 1000);

              setScorerModalVisible(false);
              setPendingScore(null);
            }}
          >
            <Text style={styles.savedTeamName}>
  {player.number
    ? `${player.number} - ${player.name}`
    : player.name}
</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.closeTeamsButton}
        onPress={() => {
  if (pendingScore) {
    const teamNameForComment =
      pendingScore.team === "team1"
        ? teamName
        : oppositionName;

    addAutoComment(
      `${pendingScore.scoreType} - ${teamNameForComment}`
    );
  }

  setScorerModalVisible(false);
  setPendingScore(null);
}}
      >
        <Text style={styles.closeTeamsButtonText}>
          Skip
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
      <Modal
        visible={tutorialVisible}
        transparent
        animationType="fade"
        onRequestClose={finishTutorial}
      >
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialBubble}>
            <Text style={styles.tutorialIcon}>{tutorialSteps[tutorialStep].icon}</Text>
            <Text style={styles.tutorialTitle}>{tutorialSteps[tutorialStep].title}</Text>
            <Text style={styles.tutorialText}>{tutorialSteps[tutorialStep].text}</Text>

            <Text style={styles.tutorialCounter}>
              {tutorialStep + 1} of {tutorialSteps.length}
            </Text>

            <View style={styles.tutorialButtonRow}>
              <TouchableOpacity onPress={finishTutorial} style={styles.tutorialSkipButton}>
                <Text style={styles.tutorialSkipText}>Skip</Text>
              </TouchableOpacity>

              {tutorialStep > 0 && (
                <TouchableOpacity
                  onPress={() => setTutorialStep((step) => step - 1)}
                  style={styles.tutorialBackButton}
                >
                  <Text style={styles.tutorialBackText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (tutorialStep === tutorialSteps.length - 1) {
                    finishTutorial();
                  } else {
                    setTutorialStep((step) => step + 1);
                  }
                }}
                style={styles.tutorialNextButton}
              >
                <Text style={styles.tutorialNextText}>
                  {tutorialStep === tutorialSteps.length - 1 ? "Got it ✓" : "Next"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
  position: "relative",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: 24,
},
  helpButton: {
  position: "absolute",
  right: 12,
  top: 34,
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#146c2e",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  elevation: 10,
},
  helpButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  tutorialOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  tutorialBubble: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  tutorialIcon: {
    fontSize: 42,
    marginBottom: 10,
  },
  tutorialTitle: {
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#146c2e",
  },
  tutorialText: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    color: "#333",
    marginBottom: 16,
  },
  tutorialCounter: {
    fontSize: 12,
    color: "#777",
    marginBottom: 14,
  },
  tutorialButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  tutorialSkipButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tutorialSkipText: {
    color: "#666",
    fontWeight: "bold",
  },
  tutorialBackButton: {
    backgroundColor: "#dddddd",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  tutorialBackText: {
    color: "#222",
    fontWeight: "bold",
  },
  tutorialNextButton: {
    flex: 1,
    backgroundColor: "#146c2e",
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  tutorialNextText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  container: {
    padding: 12,
    paddingBottom: 140,
    backgroundColor: "#dcebd7",
    minHeight: "100%",
  },
  disabledButton: {
  opacity: 0.35,
},
  title: {
    fontSize: 26,
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

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,

  elevation: 3,
},
  currentHalfText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
    marginBottom: 2,
  },

  currentScoreButton: {
  backgroundColor: "#3f8f55",
},

  startNewMatchHalfButton: {
  borderWidth: 2,
  borderColor: "#e57373",
},
  timerTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 6,
  },

  timerButtonRow: {
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
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
  matchControlButton: {
  width: "100%",
  backgroundColor: "#d6d6d6",
  paddingVertical: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#999999",
},
  timerStartButton: {
    flex: 1,
    backgroundColor: "#d6d6d6",
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#999999",
  },
timerStopButton: {
  flex: 1,
  backgroundColor: "#a94a4a",
  paddingVertical: 9,
  borderRadius: 8,
},

timerFullTimeButton: {
  flex: 1,
  backgroundColor: "#146c2e",
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
  paddingVertical: 1,
  paddingHorizontal: 10,
  borderRadius: 6,
},
  pauseIcon: {
  fontSize: 18,
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
    color: "#222222",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  scoreboard: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },

  actionStepRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
},

actionStepBadge: {
  width: 21,
  height: 21,
  borderRadius: 11,
  backgroundColor: "rgba(255,255,255,0.25)",
  alignItems: "center",
  justifyContent: "center",
},

actionStepBadgeText: {
  color: "white",
  fontSize: 12,
  fontWeight: "bold",
},
  scoreCard: {
  flex: 1,
  backgroundColor: "white",
  borderRadius: 12,
  padding: 10,

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,

  elevation: 3,
},

  teamNameInput: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  scoreBox: {
  backgroundColor: "white",
  borderRadius: 14,
  padding: 10,
  marginBottom: 10,

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,

  elevation: 3,
},

  scoringHeaderRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 20,
  width: "100%",
  marginBottom: 6,
},

scoringTeamName: {
  width: 90,
  fontSize: 14,
  fontWeight: "bold",
  textAlign: "center",
},

pauseHeaderSlot: {
  width: 45,
  alignItems: "center",
},

  smallHeading: {
  fontSize: 14,
  fontWeight: "bold",
  textAlign: "center",
  marginTop: -4,
  marginBottom: 4,
},
  sectionTitle: {
  flex: 4,
  fontSize: 13,
  textAlign: "center",
},

commentsHeader: {
  flexDirection: "row",
  alignItems: "center",
  width: "100%",
  marginBottom: 8,
},

commentsSide: {
  flex: 1,
  fontSize: 10,
  fontWeight: "bold",
  color: "#555555",
  textAlign: "center",
},

  rugbyScore: {
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
  paddingVertical: 12,
  paddingHorizontal: 8,
  borderRadius: 8,
},
  buttonDark: {
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  liveMatchButton: {
    backgroundColor: "#0057b8",
    padding: 11,
    borderRadius: 8,
    marginBottom: 8,
  },
  liveShareButton: {
    backgroundColor: "#146c2e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  shareButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  newMatchHalfButton: {
    flex: 1,
    backgroundColor: "#999",
    padding: 7,
    borderRadius: 8,
  },
  shareHalfButton: {
    flex: 1,
    backgroundColor: "#146c2e",
    padding: 7,
    borderRadius: 8,
  },
  shareButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  liveTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  liveSignalIcon: {
    fontSize: 13,
  },
  undoButton: {
    backgroundColor: "#444",
    padding: 11,
    borderRadius: 8,
    marginBottom: 8,
  },
  newMatchButton: {
    backgroundColor: "#999",
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
  disabledPauseButton: {
  opacity: 0.35,
},
commentSentText: {
  color: "#146c2e",
  fontSize: 14,
  fontWeight: "bold",
  textAlign: "center",
  marginTop: -2,
  marginBottom: 4,
},
  commentInput: {
  borderWidth: 1,
  borderColor: "#cccccc",
  borderRadius: 8,
  padding: 10,
  marginBottom: 8,
  backgroundColor: "white",
  color: "#000000",
},

manageTeamsButton: {
  backgroundColor: "#146c2e",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 10,
  marginBottom: 8,
  alignItems: "center",
},

manageTeamsButtonText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 15,
},

teamsModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "center",
  padding: 16,
},

teamsModalBox: {
  backgroundColor: "white",
  borderRadius: 16,
  padding: 16,
  maxHeight: "88%",
},

teamsModalTitle: {
  fontSize: 22,
  fontWeight: "bold",
  textAlign: "center",
  marginBottom: 12,
  color: "#146c2e",
},

teamsModalScroll: {
  marginBottom: 12,
},

teamsSectionTitle: {
  fontSize: 17,
  fontWeight: "bold",
  marginTop: 12,
  marginBottom: 8,
},

noTeamsText: {
  color: "#777",
  marginBottom: 8,
},

savedTeamButton: {
  borderWidth: 1,
  borderColor: "#cccccc",
  borderRadius: 10,
  padding: 12,
  marginBottom: 7,
  backgroundColor: "#f5f5f5",
},

savedTeamButtonSelected: {
  borderWidth: 2,
  borderColor: "#146c2e",
  backgroundColor: "#e3f2e5",
},

savedTeamName: {
  fontSize: 16,
  fontWeight: "bold",
},

savedTeamPlayerCount: {
  fontSize: 12,
  color: "#666",
  marginTop: 2,
},

teamManagerInput: {
  borderWidth: 1,
  borderColor: "#bbbbbb",
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
  backgroundColor: "white",
  marginBottom: 8,
},

teamManagerAddButton: {
  backgroundColor: "#146c2e",
  borderRadius: 8,
  paddingVertical: 11,
  alignItems: "center",
},

teamManagerAddButtonText: {
  color: "white",
  fontWeight: "bold",
},

editingTeamText: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#146c2e",
  marginBottom: 8,
},

addPlayerRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
},

smallAddPlayerButton: {
  backgroundColor: "#146c2e",
  borderRadius: 8,
  paddingHorizontal: 18,
  paddingVertical: 12,
},

playerManagerRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eeeeee",
},

playerManagerNumber: {
  width: 30,
  color: "#777",
},

playerManagerName: {
  flex: 1,
  fontSize: 16,
},

deletePlayerText: {
  color: "#c62828",
  fontSize: 20,
  fontWeight: "bold",
  paddingHorizontal: 8,
},

closeTeamsButton: {
  backgroundColor: "#333333",
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: "center",
},

closeTeamsButtonText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 16,
},

loadTeamRow: {
  flexDirection: "row",
  gap: 8,
  marginBottom: 12,
},

loadTeamButton: {
  flex: 1,
  backgroundColor: "#3f8f55",
  borderRadius: 8,
  paddingVertical: 10,
  alignItems: "center",
},

loadTeamButtonText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 13,
},

editPlayerNumberInput: {
  width: 55,
  borderWidth: 1,
  borderColor: "#cccccc",
  borderRadius: 7,
  paddingVertical: 6,
  paddingHorizontal: 6,
  textAlign: "center",
  marginRight: 10,
  fontSize: 15,
},

});