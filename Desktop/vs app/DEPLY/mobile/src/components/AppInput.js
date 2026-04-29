import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

const AppInput = ({ label, error, required, multiline = false, style, ...props }) => (
  <View style={styles.container}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.requiredAsterisk}>*</Text>}
    </View>
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, multiline ? styles.multiline : null, style, error ? styles.inputError : null]}
      multiline={multiline}
      {...props}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  requiredAsterisk: {
    color: colors.danger,
    marginLeft: 4,
    fontWeight: "900"
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    color: colors.text
  },
  inputError: {
    borderColor: colors.error
  },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  error: {
    marginTop: 6,
    color: colors.error,
    fontSize: 12
  }
});

export default AppInput;
