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

type SavedMatch = {
  id: string;
  savedAt: string;
  currentHalf: string;
  teamName: string;
  oppositionName: string;
  teamScore: number;
  oppositionScore: number;
  seconds: number;
  addedSeconds: number;
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

    const message = `🏉 Rugby Scores Live

${match.teamName || "Team"} ${match.teamScore || 0}
${match.oppositionName || "Opposition"} ${match.oppositionScore || 0}

${savedTime}

Saved: ${formatSavedDate(match.savedAt)}`;

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
        savedMatches.map((match) => (
          <View key={match.id} style={styles.savedMatchCard}>
            <Text style={styles.savedMatchTitle}>
              {match.teamName || "Team"} {match.teamScore || 0}
              {"  -  "}
              {match.oppositionScore || 0}{" "}
              {match.oppositionName || "Opposition"}
            </Text>

            <Text style={styles.savedMatchText}>
              {match.currentHalf || "Match"}
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
        ))
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
    fontSize: 18,
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