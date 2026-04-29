import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

const AppButton = ({ label, onPress, loading = false, disabled = false, variant = "primary", style }) => (
  <Pressable
    disabled={loading || disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      variant === "secondary" ? styles.secondary : 
      variant === "danger" ? styles.danger : styles.primary,
      pressed && !(loading || disabled) && styles.pressed,
      (loading || disabled) && styles.disabled,
      style
    ]}
  >
    {loading ? (
      <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.surface} />
    ) : (
      <Text style={[
        styles.label, 
        variant === "secondary" ? styles.secondaryLabel : 
        variant === "danger" ? styles.dangerLabel : null
      ]}>{label}</Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.error
  },
  pressed: {
    opacity: 0.9
  },
  disabled: {
    opacity: 0.55
  },
  label: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryLabel: {
    color: colors.primary
  },
  dangerLabel: {
    color: colors.text
  }
});

export default AppButton;
