import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AppCard from "./AppCard";
import { colors, spacing } from "../theme/tokens";

const StatCard = ({ label, value }) => (
  <AppCard style={styles.card}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </AppCard>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%"
  },
  value: {
    color: colors.primaryDark,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: spacing.xs
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600"
  }
});

export default StatCard;
