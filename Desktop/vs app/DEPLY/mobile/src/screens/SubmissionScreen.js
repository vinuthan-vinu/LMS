import React, { useEffect, useState } from "react";
import { Platform, Linking } from "react-native";
import { Alert, StyleSheet, Text, View, TouchableOpacity } from "react-native";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import LoadingOverlay from "../components/LoadingOverlay";
import ModalSheet from "../components/ModalSheet";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { fetchAssignments } from "../services/assignmentService";
import {
  createSubmission,
  deleteSubmission,
  fetchSubmissions,
  updateSubmission
} from "../services/submissionService";
import { colors, spacing, typography } from "../theme/tokens";
import { extractApiError } from "../utils/apiError";
import { capitalize, formatDateTime } from "../utils/formatters";

const assetToWebFile = async (asset) => {
  try {
    if (asset?.file) return asset.file;
    if (asset?._file) return asset._file; // Some versions of expo picker use _file
    if (!asset?.uri) return null;
    
    // If it is already a blob URL, we can fetch it
    if (asset.uri.startsWith("blob:") || asset.uri.startsWith("data:")) {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      return new File([blob], asset.name || "attachment", { type: asset.mimeType || blob.type });
    }
    
    // Last resort: if we have the uri but no file object and it is not a blob,
    // we might be in a state where we cannot access the file on web.
    console.warn("Unable to convert asset to File object on web:", asset);
    return null;
  } catch (e) {
    console.error("assetToWebFile error:", e);
    return null;
  }
};

const initialForm = {
  assignment: "",
  content: "",
  grade: "",
  feedback: ""
};

const SubmissionScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const assignmentHasSubmission = (assignmentId) =>
    submissions.some(
      (submission) => String(submission.assignment?._id || submission.assignment) === String(assignmentId)
    );

  const loadSubmissions = async () => {
    const [submissionResult, assignmentResult] = await Promise.allSettled([fetchSubmissions(), fetchAssignments()]);
    setSubmissions(submissionResult.status === "fulfilled" ? submissionResult.value : []);
    setAssignments(assignmentResult.status === "fulfilled" ? assignmentResult.value : []);

    if (submissionResult.status === "rejected") {
      throw submissionResult.reason;
    }
  };

  useEffect(() => {
    loadSubmissions()
      .catch((error) => Alert.alert("Submission error", extractApiError(error)))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (submission = null, preferredAssignmentId = null) => {
    setEditingSubmission(submission);
    setFiles([]);
    setErrors({});
    if (submission) {
      setForm({
        assignment: submission.assignment?._id || submission.assignment,
        content: submission.content || "",
        grade: submission.grade ? String(submission.grade) : "",
        feedback: submission.feedback || ""
      });
    } else {
      const availableAssignments = assignments.filter((assignment) => !assignmentHasSubmission(assignment._id));
      const preferredAvailable = preferredAssignmentId && !assignmentHasSubmission(preferredAssignmentId);
      setForm({
        ...initialForm,
        assignment: preferredAvailable
          ? preferredAssignmentId
          : availableAssignments[0]?._id || ""
      });
    }
    setModalVisible(true);
  };

  const pickDocuments = async () => {
    try {
      const { getDocumentAsync } = await import("expo-document-picker");
      const result = await getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: Platform.OS !== "web"
      });
      if (!result.canceled) {
        setFiles(result.assets || []);
        if (!(result.assets || []).length) {
          Alert.alert("No files selected", "Please select a file to attach.");
        }
      }
    } catch (error) {
      Alert.alert("File picker failed", error?.message || "Unable to open file picker.");
    }
  };

  const buildPayload = async () => {
    const payload = new FormData();
    if (!editingSubmission || user.role === "student") {
      if (form.assignment) {
        payload.append("assignment", form.assignment);
      }
      const trimmedContent = String(form.content || "").trim();
      if (trimmedContent) {
        payload.append("content", trimmedContent);
      }
    }
    if (user.role !== "student") {
      if (form.grade) {
        payload.append("grade", form.grade);
      }
      payload.append("feedback", form.feedback);
    }
    for (const file of files) {
      if (Platform.OS === "web") {
        const webFile = await assetToWebFile(file);
        if (webFile) {
          payload.append("files", webFile, file.name || "attachment");
        }
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

  const handleSave = async () => {
    const newErrors = {};
    if (user.role === "student" && editingSubmission?.status === "graded") {
      Alert.alert("Submission locked", "Graded submissions cannot be edited. Create a new submission for another assignment.");
      return;
    }

    if (user.role === "student") {
      if (!form.assignment) newErrors.assignment = "Please select an assignment";
      if (!form.content && files.length === 0) newErrors.content = "Notes or a file is required";
      if (!editingSubmission && form.assignment && assignmentHasSubmission(form.assignment)) {
        newErrors.assignment = "You already submitted this assignment. Use Update instead.";
      }
    } else {
      if (!form.grade) newErrors.grade = "Grade is required";
      if (form.grade && isNaN(Number(form.grade))) newErrors.grade = "Grade must be a number";
      if (!form.feedback) newErrors.feedback = "Feedback is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const payload = await buildPayload();
      if (!editingSubmission && assignmentHasSubmission(form.assignment)) {
        const existingSubmission = submissions.find(
          (submission) => String(submission.assignment?._id || submission.assignment) === String(form.assignment)
        );
        await updateSubmission(existingSubmission._id, payload);
      } else if (editingSubmission) {
        await updateSubmission(editingSubmission._id, payload);
      } else {
        await createSubmission(payload);
      }
      setModalVisible(false);
      await loadSubmissions();
      Alert.alert("Success", "Submission saved successfully!");
    } catch (error) {
      console.error("Submission save error:", error);
      const msg = extractApiError(error);
      Alert.alert("Submission Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (submissionId) => {
    try {
      await deleteSubmission(submissionId);
      await loadSubmissions();
    } catch (error) {
      Alert.alert("Delete failed", extractApiError(error));
    }
  };

  if (loading) {
    return <LoadingOverlay label="Loading submissions..." />;
  }

  const displaySubmissions =
    user.role === "student"
      ? [
          ...submissions,
          ...assignments
            .filter(
              (assignment) =>
                !submissions.some(
                  (submission) =>
                    String(submission.assignment?._id || submission.assignment) === String(assignment._id)
                )
            )
            .map((assignment) => ({
              _id: `pending-${assignment._id}`,
              assignment,
              course: assignment.course,
              submittedAt: assignment.dueDate,
              content: "No submission yet.",
              status: "pending",
              grade: null,
              feedback: "",
              isPending: true
            }))
        ]
      : submissions;

  const availableAssignments = assignments.filter((assignment) => !assignmentHasSubmission(assignment._id));

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Submissions</Text>
          <Text style={styles.subtitle}>
            {user.role === "student" ? "Submit and revise your work." : "Review, grade, and give feedback."}
          </Text>
        </View>
        {user.role === "student" ? (
          <AppButton label="Submit" onPress={() => openModal()} style={styles.smallButton} />
        ) : null}
      </View>

      {displaySubmissions.map((submission) => (
        <AppCard key={submission._id} style={styles.card}>
          <Text style={styles.cardTitle}>{submission.assignment?.title}</Text>
          <Text style={styles.meta}>
            {submission.course?.title} • {formatDateTime(submission.submittedAt)}
          </Text>
          <Text style={styles.description}>{submission.content}</Text>
          
          {submission.attachments?.length > 0 && (
            <View style={styles.attachmentSection}>
              <Text style={styles.attachmentLabel}>Submitted Files:</Text>
              {submission.attachments.map((url, index) => {
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

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>Status: <Text style={styles.statusValue}>{capitalize(submission.status)}</Text></Text>
            <Text style={styles.statusText}>Grade: <Text style={styles.gradeValue}>{submission.grade ?? "Pending"}</Text></Text>
          </View>
          {submission.feedback ? (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackLabel}>Lecturer Feedback:</Text>
              <Text style={styles.feedbackText}>{submission.feedback}</Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            {user.role === "student" ? (
              submission.isPending ? (
                <AppButton
                  label="Submit Now"
                  variant="secondary"
                  onPress={() => openModal(null, submission.assignment?._id)}
                />
              ) : submission.status === "graded" ? (
                <AppButton label="Locked (Graded)" variant="secondary" disabled />
              ) : (
                <>
                  <AppButton label="Update" variant="secondary" onPress={() => openModal(submission)} />
                  <AppButton label="Delete" variant="danger" onPress={() => handleDelete(submission._id)} />
                </>
              )
            ) : (
              <>
                <AppButton label="Grade" variant="secondary" onPress={() => openModal(submission)} />
                <AppButton label="Delete" variant="danger" onPress={() => handleDelete(submission._id)} />
              </>
            )}
          </View>
        </AppCard>
      ))}

      <ModalSheet
        title={
          editingSubmission
            ? user.role === "student"
              ? "Update Submission"
              : "Grade Submission"
            : "Create Submission"
        }
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        {user.role === "student" ? (
          <>
            <Text style={styles.sectionLabel}>Select Assignment</Text>
            <View style={styles.optionRow}>
              {availableAssignments.map((assignment) => (
                <TouchableOpacity 
                  key={assignment._id}
                  style={[styles.optionButton, form.assignment === assignment._id && styles.optionButtonActive]}
                  onPress={() => {
                    setForm(s => ({ ...s, assignment: assignment._id }));
                    if (errors.assignment) setErrors((e) => ({ ...e, assignment: null }));
                  }}
                >
                  <Text style={[styles.optionButtonText, form.assignment === assignment._id && styles.optionButtonTextActive]}>{assignment.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!editingSubmission && !availableAssignments.length ? (
              <Text style={styles.inlineInfo}>All available assignments already have submissions. Use Update on an existing card.</Text>
            ) : null}
            {errors.assignment ? <Text style={styles.inlineError}>{errors.assignment}</Text> : null}
            <AppInput 
              label="Submission Notes / Content" 
              required 
              error={errors.content}
              multiline 
              value={form.content} 
              onChangeText={(content) => {
                setForm((s) => ({ ...s, content }));
                if (errors.content) setErrors(e => ({ ...e, content: null }));
              }} 
            />
            <AppButton label={files.length > 0 ? `Selected Files (${files.length}) ✅` : "Upload PDF / Work Files"} variant="secondary" onPress={pickDocuments} />
          </>
        ) : (
          <>
            <AppInput 
              label="Grade (out of 100)" 
              required 
              error={errors.grade}
              keyboardType="numeric" 
              value={form.grade} 
              onChangeText={(grade) => {
                setForm((s) => ({ ...s, grade }));
                if (errors.grade) setErrors(e => ({ ...e, grade: null }));
              }} 
            />
            <AppInput 
              label="Feedback" 
              required 
              error={errors.feedback}
              multiline 
              value={form.feedback} 
              onChangeText={(feedback) => {
                setForm((s) => ({ ...s, feedback }));
                if (errors.feedback) setErrors(e => ({ ...e, feedback: null }));
              }} 
            />
          </>
        )}
        <AppButton 
          label={saving ? "Saving..." : "Save Submission"} 
          onPress={handleSave} 
          style={styles.submitButton} 
          disabled={saving || (!editingSubmission && !availableAssignments.length)}
        />
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
    minWidth: 96
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
    color: colors.text,
    lineHeight: 20
  },
  feedback: {
    marginTop: spacing.sm,
    color: colors.primaryDark
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  submitButton: {
    marginTop: spacing.md
  },
  helperText: {
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  attachmentSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  attachmentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  attachmentText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600"
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  optionButtonActive: {
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderColor: colors.primary
  },
  optionButtonText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 13
  },
  optionButtonTextActive: {
    color: colors.primary
  },
  inlineError: {
    marginTop: -4,
    marginBottom: spacing.sm,
    color: colors.error,
    fontSize: 12,
    fontWeight: "700"
  },
  inlineInfo: {
    marginTop: -4,
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  statusText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "700"
  },
  statusValue: {
    color: colors.warning
  },
  gradeValue: {
    color: colors.success,
    fontWeight: "900"
  },
  feedbackContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 4,
    textTransform: "uppercase"
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20
  }
});

export default SubmissionScreen;
