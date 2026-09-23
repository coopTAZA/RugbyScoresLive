import { Image, StyleSheet, View } from "react-native";

export default function AppSplash() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash-full.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#052e16",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});