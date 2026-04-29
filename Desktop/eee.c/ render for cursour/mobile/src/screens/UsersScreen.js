import React, { useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import LoadingOverlay from "../components/LoadingOverlay";
import ModalSheet from "../components/ModalSheet";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { deleteUser, fetchUsers, updateUser } from "../services/userService";
import { colors, spacing, typography } from "../theme/tokens";
import { extractApiError } from "../utils/apiError";
import { capitalize, formatDateTime } from "../utils/formatters";

const UsersScreen = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "student",
    department: "",
    isActive: "true"
  });

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      Alert.alert("Users error", extractApiError(error));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    loadUsers()
      .catch((error) => Alert.alert("Users error", extractApiError(error)))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (userItem) => {
    setEditingUser(userItem);
    setForm({
      name: userItem.name || "",
      role: userItem.role || "student",
      department: userItem.department || "",
      isActive: String(userItem.isActive !== false)
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    if (!form.name || !form.role || !form.department || !form.isActive) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }
    try {
      await updateUser(editingUser._id, {
        name: form.name.trim(),
        role: form.role.trim().toLowerCase(),
        department: form.department.trim(),
        isActive: form.isActive.trim().toLowerCase() === "true"
      });
      setModalVisible(false);
      await loadUsers();
    } catch (error) {
      Alert.alert("Update failed", extractApiError(error));
    }
  };

  const handleDelete = async (userItem) => {
    if (String(userItem._id) === String(currentUser?.id || currentUser?._id)) {
      Alert.alert("Blocked", "You cannot delete your own account.");
      return;
    }

    try {
      await deleteUser(userItem._id);
      await loadUsers();
    } catch (error) {
      Alert.alert("Delete failed", extractApiError(error));
    }
  };

  if (loading) {
    return <LoadingOverlay label="Loading users..." />;
  }

  const filteredUsers = users.filter((userItem) => {
    const matchesSearch = `${userItem.name} ${userItem.email} ${userItem.role} ${userItem.department || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const isActive = userItem.isActive !== false;
    const matchesActive =
      activeFilter === "all" ? true : activeFilter === "active" ? isActive : !isActive;
    return matchesSearch && matchesActive;
  });

  return (
    <ScreenContainer scrollEnabled={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>Admin user management</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshBtnText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <AppInput
        label="Search Users"
        placeholder="Search by name, email, role"
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filters}>
        <AppButton
          label="All"
          variant={activeFilter === "all" ? "primary" : "secondary"}
          style={styles.filterBtn}
          onPress={() => setActiveFilter("all")}
        />
        <AppButton
          label="Active"
          variant={activeFilter === "active" ? "primary" : "secondary"}
          style={styles.filterBtn}
          onPress={() => setActiveFilter("active")}
        />
        <AppButton
          label="Inactive"
          variant={activeFilter === "inactive" ? "primary" : "secondary"}
          style={styles.filterBtn}
          onPress={() => setActiveFilter("inactive")}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item: userItem }) => (
          <AppCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{userItem.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: userItem.isActive !== false ? colors.success + "20" : colors.error + "20" }]}>
                <Text style={[styles.statusText, { color: userItem.isActive !== false ? colors.success : colors.error }]}>
                  {userItem.isActive !== false ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {userItem.email}
            </Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{capitalize(userItem.role)}</Text>
              </View>
              {userItem.department && (
                <View style={[styles.tag, { borderColor: colors.accent3 }]}>
                  <Text style={[styles.tagText, { color: colors.accent3 }]}>{userItem.department}</Text>
                </View>
              )}
            </View>
            <View style={styles.actions}>
              <AppButton label="Edit" variant="secondary" style={styles.actionBtn} onPress={() => openModal(userItem)} />
              <AppButton label="Delete" variant="danger" style={styles.actionBtn} onPress={() => handleDelete(userItem)} />
            </View>
          </AppCard>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No users match your filters.</Text>}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />

      <ModalSheet title="Edit User" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <AppInput label="Name" required value={form.name} onChangeText={(name) => setForm((s) => ({ ...s, name }))} />
        <AppInput
          label="Role (student / lecturer / admin)"
          required
          value={form.role}
          autoCapitalize="none"
          onChangeText={(role) => setForm((s) => ({ ...s, role }))}
        />
        <AppInput
          label="Department"
          required
          value={form.department}
          onChangeText={(department) => setForm((s) => ({ ...s, department }))}
        />
        <AppInput
          label="isActive (true / false)"
          required
          value={form.isActive}
          autoCapitalize="none"
          onChangeText={(isActive) => setForm((s) => ({ ...s, isActive }))}
        />
        <AppButton label="Save User" onPress={handleSave} />
      </ModalSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
    color: colors.text
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted
  },
  refreshBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  refreshBtnText: {
    color: colors.primary,
    fontWeight: "700"
  },
  card: {
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted
  },
  tagRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "transparent"
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionBtn: {
    flex: 1
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  filterBtn: {
    flex: 1
  },
  emptyText: {
    textAlign: "center",
    marginTop: spacing.xl,
    color: colors.textMuted
  }
});

export default UsersScreen;

