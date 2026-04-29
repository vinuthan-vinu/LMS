import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/tokens";

const LoadingOverlay = ({ label = "Loading..." }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  text: {
    marginTop: 12,
    color: colors.textMuted
  }
});

export default LoadingOverlay;
