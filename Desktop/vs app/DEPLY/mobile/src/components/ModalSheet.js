import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import AppCard from "./AppCard";
import { colors, spacing, typography } from "../theme/tokens";

const ModalSheet = ({ title, visible, onClose, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable style={styles.backdropDismissArea} onPress={onClose} />
      <View style={styles.sheet}>
        <AppCard style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </View>
          <View>{children}</View>
        </AppCard>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.24)"
  },
  backdropDismissArea: {
    flex: 1
  },
  sheet: {
    padding: spacing.md
  },
  card: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  title: {
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.text,
    flex: 1
  },
  closeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  closeLabel: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 12
  }
});

export default ModalSheet;
