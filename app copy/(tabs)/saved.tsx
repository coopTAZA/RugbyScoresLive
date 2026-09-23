import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Sport = "football" | "hurling";

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
  turnoverWonForced: number;
  turnoverWonUnforced: number;
  turnoverLostForced: number;
  turnoverLostUnforced: number;
};

export default function SavedMatchesScreen() {
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSavedMatches();
    }, [])
  );

  const loadSavedMatches = async () => {
    try {
      const existingMatches = await AsyncStorage.getItem("savedMatches");
      const matches = existingMatches ? JSON.parse(existingMatches) : [];
      setSavedMatches(matches);
    } catch (error) {
      Alert.alert("Load Failed", "Saved matches could not be loaded.");
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatGaelicScore = (goals: number, points: number) => {
    return `${goals}:${points.toString().padStart(2, "0")}`;
  };

  const formatSavedDate = (dateText: string) => {
    return new Date(dateText).toLocaleString();
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

    const savedTurnoversWon =
      (match.turnoverWonForced || 0) + (match.turnoverWonUnforced || 0);
    const savedTurnoversLost =
      (match.turnoverLostForced || 0) + (match.turnoverLostUnforced || 0);

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

🔁 Turnovers
Turn Ov Won: ${savedTurnoversWon}
Forced: ${match.turnoverWonForced || 0} | Unforced: ${
      match.turnoverWonUnforced || 0
    }

Turn Ov Lost: ${savedTurnoversLost}
Forced: ${match.turnoverLostForced || 0} | Unforced: ${
      match.turnoverLostUnforced || 0
    }

Saved: ${formatSavedDate(match.savedAt)}
`;

    await Share.share({ message });
  };

  const deleteSavedMatch = async (matchId: string) => {
    Alert.alert("Delete Saved Match?", "This will delete this saved match.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const updatedMatches = savedMatches.filter(
              (match) => match.id !== matchId
            );

            await AsyncStorage.setItem(
              "savedMatches",
              JSON.stringify(updatedMatches)
            );

            setSavedMatches(updatedMatches);
          } catch (error) {
            Alert.alert("Delete Failed", "The saved match could not be deleted.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Saved Matches</Text>

      <TouchableOpacity style={styles.refreshButton} onPress={loadSavedMatches}>
        <Text style={styles.buttonText}>Refresh Saved Matches</Text>
      </TouchableOpacity>

      {savedMatches.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.noSavedText}>No saved matches yet.</Text>
        </View>
      ) : (
        savedMatches.map((match) => {
          const savedSport = match.sport || "football";
          const savedShortLabel = savedSport === "football" ? "KO" : "PO";

          const turnOvWon =
            (match.turnoverWonForced || 0) +
            (match.turnoverWonUnforced || 0);

          const turnOvLost =
            (match.turnoverLostForced || 0) +
            (match.turnoverLostUnforced || 0);

          return (
            <View key={match.id} style={styles.savedMatchCard}>
              <Text style={styles.savedMatchTitle}>
                {match.teamName}{" "}
                {formatGaelicScore(match.teamGoals, match.teamPoints)} v{" "}
                {match.oppositionName}{" "}
                {formatGaelicScore(match.oppositionGoals, match.oppositionPoints)}
              </Text>

              <Text style={styles.savedMatchText}>
                Shot Conversion: {match.conversionRate}%
              </Text>

              <Text style={styles.savedMatchText}>
                Own {savedShortLabel}: {match.ownKickoutWinRate}% | Opp{" "}
                {savedShortLabel}: {match.oppositionKickoutWinRate}%
              </Text>

              <Text style={styles.savedMatchText}>Turn Ov Won: {turnOvWon}</Text>
              <Text style={styles.savedMatchText}>
                Forced: {match.turnoverWonForced || 0} | Unforced:{" "}
                {match.turnoverWonUnforced || 0}
              </Text>

              <Text style={styles.savedMatchText}>Turn Ov Lost: {turnOvLost}</Text>
              <Text style={styles.savedMatchText}>
                Forced: {match.turnoverLostForced || 0} | Unforced:{" "}
                {match.turnoverLostUnforced || 0}
              </Text>

              <Text style={styles.savedMatchDate}>
                Saved: {formatSavedDate(match.savedAt)}
              </Text>

              <View style={styles.savedMatchButtonRow}>
                <TouchableOpacity
                  style={styles.deleteSavedHalfButton}
                  onPress={() => deleteSavedMatch(match.id)}
                >
                  <Text style={styles.savedMatchButtonText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareSavedHalfButton}
                  onPress={() => shareSavedMatch(match)}
                >
                  <Text style={styles.savedMatchButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#dcebd7",
    minHeight: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 12,
  },
  refreshButton: {
    backgroundColor: "#146c2e",
    padding: 11,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyBox: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
    elevation: 3,
  },
  noSavedText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#555",
  },
  savedMatchCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 3,
  },
  savedMatchTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
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
    marginTop: 6,
  },
  savedMatchButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  deleteSavedHalfButton: {
    flex: 1,
    backgroundColor: "#8b1a1a",
    padding: 9,
    borderRadius: 8,
  },
  shareSavedHalfButton: {
    flex: 1,
    backgroundColor: "#146c2e",
    padding: 9,
    borderRadius: 8,
  },
  savedMatchButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
});