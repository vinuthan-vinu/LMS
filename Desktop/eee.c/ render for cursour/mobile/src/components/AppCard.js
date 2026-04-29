import React from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, shadows, spacing } from "../theme/tokens";

const AppCard = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  }
});

export default AppCard;
