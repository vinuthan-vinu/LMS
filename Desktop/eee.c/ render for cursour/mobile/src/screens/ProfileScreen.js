import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../theme/tokens";

const ProfileScreen = () => {
  const { user, signOut, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "",
    department: user.department || "",
    phone: user.phone || "",
    enrollmentNumber: user.enrollmentNumber || "",
    employeeId: user.employeeId || ""
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(form);
      Alert.alert("Profile", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Update failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Update personal and academic identity details.</Text>

      <AppCard>
        <View style={styles.badgeRow}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.role}>{user.role}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </AppCard>

      <AppCard style={styles.formCard}>
        <AppInput label="Name" value={form.name} onChangeText={(name) => setForm((s) => ({ ...s, name }))} />
        <AppInput label="Department" value={form.department} onChangeText={(department) => setForm((s) => ({ ...s, department }))} />
        <AppInput label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm((s) => ({ ...s, phone }))} />
        {user.role === "student" ? (
          <AppInput label="Enrollment Number" value={form.enrollmentNumber} onChangeText={(enrollmentNumber) => setForm((s) => ({ ...s, enrollmentNumber }))} />
        ) : (
          <AppInput label="Employee ID" value={form.employeeId} onChangeText={(employeeId) => setForm((s) => ({ ...s, employeeId }))} />
        )}
        <AppButton label="Save Profile" onPress={handleSave} loading={saving} />
        <AppButton label="Logout" variant="secondary" style={styles.logoutButton} onPress={signOut} />
      </AppCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: typography.title,
    fontWeight: "900",
    color: colors.text
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.lg
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  name: {
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.text
  },
  role: {
    backgroundColor: colors.surfaceMuted,
    color: colors.primaryDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700"
  },
  email: {
    color: colors.textMuted,
    marginTop: spacing.sm
  },
  formCard: {
    marginTop: spacing.md
  },
  logoutButton: {
    marginTop: spacing.sm
  }
});

export default ProfileScreen;
