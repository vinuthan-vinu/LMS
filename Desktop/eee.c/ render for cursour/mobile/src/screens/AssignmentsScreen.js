import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View, TouchableOpacity, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import LoadingOverlay from "../components/LoadingOverlay";
import ModalSheet from "../components/ModalSheet";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { createAssignment, deleteAssignment, fetchAssignments, updateAssignment } from "../services/assignmentService";
import { fetchCourses } from "../services/courseService";
import { colors, spacing, typography } from "../theme/tokens";
import { extractApiError } from "../utils/apiError";
import { formatDateTime } from "../utils/formatters";

const toIsoDateTime = (value) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString();
  } catch (e) {
    return "";
  }
};

const assetToWebFile = async (asset) => {
  if (asset?.file) return asset.file;
  if (!asset?.uri) return null;
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const name = asset.name || "attachment";
  const type = asset.mimeType || blob.type || "application/octet-stream";
  return new File([blob], name, { type });
};

const initialForm = {
  title: "",
  description: "",
  course: "",
  dueDate: "",
  maxScore: "100",
  status: "published"
};

const AssignmentsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueSoon");
  const [courses, setCourses] = useState([]);
  const [files, setFiles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const canManage = user.role !== "student";

  const loadAssignments = async () => {
    const [assignmentResult, courseResult] = await Promise.allSettled([fetchAssignments(), fetchCourses()]);
    setAssignments(assignmentResult.status === "fulfilled" ? assignmentResult.value : []);
    setCourses(courseResult.status === "fulfilled" ? courseResult.value : []);

    if (assignmentResult.status === "rejected") {
      throw assignmentResult.reason;
    }
  };

  useEffect(() => {
    loadAssignments()
      .catch((error) => Alert.alert("Assignment error", extractApiError(error)))
      .finally(() => setLoading(false));
  }, []);

  const pickDocuments = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.onchange = (e) => {
        const selectedFiles = Array.from(e.target.files).map((file) => ({
          file,
          name: file.name,
          uri: URL.createObjectURL(file),
          mimeType: file.type
        }));
        setFiles(selectedFiles);
      };
      input.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true
      });
      if (!result.canceled) {
        setFiles(result.assets || []);
      }
    } catch (error) {
      Alert.alert("File picker failed", error?.message || "Unable to open file picker.");
    }
  };

  const buildPayload = async () => {
    const payload = new FormData();
    const isoDueDate = toIsoDateTime(form.dueDate);
    if (!isoDueDate) {
      throw new Error("Due date must be a valid date/time (example: 2030-01-01T10:00).");
    }

    Object.entries({ ...form, dueDate: isoDueDate }).forEach(([key, value]) => payload.append(key, value));

    for (const file of files) {
      if (Platform.OS === "web") {
        payload.append("files", file.file, file.name);
      } else {
        payload.append("files", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream"
        });
      }
    }
    return payload;
  };

  const openModal = (assignment = null) => {
    setEditingAssignment(assignment);
    setFiles([]);
    setErrors({});
    setForm(
      assignment
        ? {
            title: assignment.title,
            description: assignment.description,
            course: assignment.course?._id || assignment.course,
            dueDate: assignment.dueDate?.slice(0, 16) || "",
            maxScore: String(assignment.maxScore || 100),
            status: assignment.status
          }
        : {
            ...initialForm,
            course: courses[0]?._id || ""
          }
    );
    setModalVisible(true);
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.title) newErrors.title = "Title is required";
    if (!form.description) newErrors.description = "Description is required";
    if (!form.course) newErrors.course = "Course is required";
    if (!form.dueDate) newErrors.dueDate = "Due date is required";
    if (!form.maxScore) newErrors.maxScore = "Max score is required";
    if (!form.status) newErrors.status = "Status is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload = await buildPayload();
      if (editingAssignment) {
        await updateAssignment(editingAssignment._id, payload);
      } else {
        await createAssignment(payload);
      }
      setModalVisible(false);
      await loadAssignments();
    } catch (error) {
      Alert.alert("Save failed", extractApiError(error));
    }
  };

  const handleDelete = async (assignmentId) => {
    try {
      await deleteAssignment(assignmentId);
      await loadAssignments();
    } catch (error) {
      Alert.alert("Delete failed", extractApiError(error));
    }
  };

  if (loading) {
    return <LoadingOverlay label="Loading assignments..." />;
  }

  const filteredAssignments = assignments
    .filter((assignment) => {
      const matchesSearch = `${assignment.title} ${assignment.description} ${assignment.course?.title || ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : assignment.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Assignments</Text>
          <Text style={styles.subtitle}>Track due work and course deliverables.</Text>
        </View>
        {canManage ? <AppButton label="Add" onPress={() => openModal()} style={styles.smallButton} /> : null}
      </View>
      <AppInput
        label="Search Assignments"
        placeholder="Search by title, description, course"
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filterRow}>
        {["all", "published", "draft", "closed"].map((status) => (
          <AppButton
            key={status}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            variant={statusFilter === status ? "primary" : "secondary"}
            style={styles.filterButton}
            onPress={() => setStatusFilter(status)}
          />
        ))}
      </View>
      <View style={styles.filterRow}>
        {[
          { id: "dueSoon", label: "Due Soon" },
          { id: "newest", label: "Newest" },
          { id: "oldest", label: "Oldest" }
        ].map((option) => (
          <AppButton
            key={option.id}
            label={option.label}
            variant={sortBy === option.id ? "primary" : "secondary"}
            style={styles.filterButton}
            onPress={() => setSortBy(option.id)}
          />
        ))}
      </View>

      {filteredAssignments.map((assignment) => (
        <AppCard key={assignment._id} style={styles.card}>
          <Text style={styles.cardTitle}>{assignment.title}</Text>
          <Text style={styles.meta}>{assignment.course?.title} • Due {formatDateTime(assignment.dueDate)}</Text>
          <Text style={styles.description}>{assignment.description}</Text>
          
          {assignment.attachments?.length > 0 && (
            <View style={styles.attachmentSection}>
              <Text style={styles.attachmentLabel}>Attachments:</Text>
              {assignment.attachments.map((url, index) => {
                const fileName = url.split("/").pop();
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => Linking.openURL(url)}
                    style={styles.attachmentItem}
                  >
                    <Text style={styles.attachmentText}>📎 {fileName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.meta}>Status: {assignment.status} • Max score: {assignment.maxScore}</Text>
          {canManage ? (
            <View style={styles.actions}>
              <AppButton label="Edit" variant="secondary" onPress={() => openModal(assignment)} />
              <AppButton label="Delete" variant="danger" onPress={() => handleDelete(assignment._id)} />
            </View>
          ) : null}
        </AppCard>
      ))}
      {!filteredAssignments.length ? <Text style={styles.emptyText}>No assignments match your filters.</Text> : null}

      <ModalSheet
        title={editingAssignment ? "Update Assignment" : "Create Assignment"}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <AppInput 
          label="Title" 
          required 
          error={errors.title}
          value={form.title} 
          onChangeText={(title) => {
            setForm((s) => ({ ...s, title }));
            if (errors.title) setErrors(e => ({ ...e, title: null }));
          }} 
        />
        <AppInput 
          label="Description" 
          required 
          multiline 
          error={errors.description}
          value={form.description} 
          onChangeText={(description) => {
            setForm((s) => ({ ...s, description }));
            if (errors.description) setErrors(e => ({ ...e, description: null }));
          }} 
        />
        
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Select Course</Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>
          <View style={styles.optionRow}>
            {courses.map((course) => (
              <AppButton
                key={course._id}
                label={course.title}
                variant={form.course === course._id ? "primary" : "secondary"}
                style={styles.optionButton}
                onPress={() => {
                  setForm((s) => ({ ...s, course: course._id }));
                  if (errors.course) setErrors(e => ({ ...e, course: null }));
                }}
              />
            ))}
          </View>
          {errors.course && <Text style={styles.inlineError}>{errors.course}</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Due Date</Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>
          {Platform.OS === "web" ? (
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(event) => {
                setForm((s) => ({ ...s, dueDate: event.target.value }));
                if (errors.dueDate) setErrors(e => ({ ...e, dueDate: null }));
              }}
              style={{
                ...styles.webDateInput,
                ...(errors.dueDate ? { borderColor: colors.error } : {})
              }}
            />
          ) : (
            <TouchableOpacity 
              style={[styles.datePickerBtn, errors.dueDate && { borderColor: colors.error }]} 
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.datePickerText}>
                {form.dueDate ? formatDateTime(toIsoDateTime(form.dueDate)) : "Select Due Date & Time"}
              </Text>
            </TouchableOpacity>
          )}
          {errors.dueDate && <Text style={styles.inlineError}>{errors.dueDate}</Text>}

          {Platform.OS !== "web" && showDatePicker && (
            <DateTimePicker
              value={form.dueDate && !isNaN(new Date(form.dueDate).getTime()) ? new Date(form.dueDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setForm((s) => ({ ...s, dueDate: selectedDate.toISOString() }));
                  setShowTimePicker(true);
                }
              }}
            />
          )}

          {Platform.OS !== "web" && showTimePicker && (
            <DateTimePicker
              value={form.dueDate && !isNaN(new Date(form.dueDate).getTime()) ? new Date(form.dueDate) : new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setForm((s) => ({ ...s, dueDate: selectedTime.toISOString() }));
                }
              }}
            />
          )}
        </View>
        <AppInput 
          label="Max Score" 
          required 
          error={errors.maxScore}
          keyboardType="numeric" 
          value={form.maxScore} 
          onChangeText={(maxScore) => {
            setForm((s) => ({ ...s, maxScore }));
            if (errors.maxScore) setErrors(e => ({ ...e, maxScore: null }));
          }} 
        />
        <AppInput 
          label="Status" 
          required 
          error={errors.status}
          value={form.status} 
          onChangeText={(status) => {
            setForm((s) => ({ ...s, status }));
            if (errors.status) setErrors(e => ({ ...e, status: null }));
          }} 
        />
        <AppButton label={`Attach Files (${files.length})`} variant="secondary" onPress={pickDocuments} />
        {files.length > 0 ? (
          <View style={styles.fileList}>
            {files.map((file, index) => (
              <Text key={index} style={styles.fileName}>
                • {file.name}
              </Text>
            ))}
          </View>
        ) : null}
        <AppButton label={editingAssignment ? "Update Assignment" : "Create Assignment"} onPress={handleSave} style={styles.submitButton} />
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
    color: colors.textMuted
  },
  smallButton: {
    minWidth: 90
  },
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  meta: {
    marginTop: 6,
    color: colors.textMuted
  },
  description: {
    marginTop: spacing.sm,
    lineHeight: 20,
    color: colors.text
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  helperText: {
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginBottom: spacing.md
  },
  filterButton: {
    minWidth: 90
  },
  emptyText: {
    color: colors.textMuted
  },
  webDateField: {
    marginBottom: spacing.md
  },
  webDateLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.xs
  },
  webDateInput: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: colors.text,
    paddingHorizontal: 16,
    width: "100%",
    fontSize: 14
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52
  },
  datePickerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  inlineError: {
    marginTop: 6,
    color: colors.error,
    fontSize: 12,
    fontWeight: "600"
  },
  fileList: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm
  },
  fileName: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4
  },
  section: {
    marginBottom: spacing.md
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs
  },
  requiredAsterisk: {
    color: colors.error,
    marginLeft: 4,
    fontWeight: "900"
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  optionButton: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: 12
  },
  attachmentSection: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 4
  },
  attachmentItem: {
    paddingVertical: 4
  },
  attachmentText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600"
  },
  submitButton: {
    marginTop: spacing.md
  }
});

export default AssignmentsScreen;
