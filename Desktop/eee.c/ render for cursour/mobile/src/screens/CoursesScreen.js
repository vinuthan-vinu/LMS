import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import LoadingOverlay from "../components/LoadingOverlay";
import ModalSheet from "../components/ModalSheet";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  toggleEnrollment,
  updateCourse
} from "../services/courseService";
import { fetchLecturers } from "../services/userService";
import { colors, spacing, typography } from "../theme/tokens";
import { extractApiError } from "../utils/apiError";

const initialForm = {
  title: "",
  code: "",
  description: "",
  department: "",
  semester: "",
  credits: "",
  lecturer: ""
};

const CoursesScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [lecturers, setLecturers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const canManage = user.role !== "student";

  const loadCourses = async () => {
    const [courseResult, lecturerResult] = await Promise.allSettled([
      fetchCourses(),
      canManage ? fetchLecturers() : Promise.resolve([])
    ]);

    setCourses(courseResult.status === "fulfilled" ? courseResult.value : []);
    setLecturers(lecturerResult.status === "fulfilled" ? lecturerResult.value : []);

    if (courseResult.status === "rejected") {
      throw courseResult.reason;
    }
  };

  useEffect(() => {
    loadCourses()
      .catch((error) => Alert.alert("Course error", extractApiError(error)))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (course = null) => {
    setEditingCourse(course);
    setErrors({});
    setForm(
      course
        ? {
            title: course.title,
            code: course.code,
            description: course.description,
            department: course.department,
            semester: String(course.semester),
            credits: String(course.credits),
            lecturer: course.lecturer?._id || course.lecturer || ""
          }
        : {
            ...initialForm,
            lecturer:
              user.role === "lecturer"
                ? user.id || user._id
                : lecturers[0]?._id || ""
          }
    );
    setModalVisible(true);
  };

  const buildFormData = () => {
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    return payload;
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.title) newErrors.title = "Title is required";
    if (!form.code) newErrors.code = "Code is required";
    if (!form.description) newErrors.description = "Description is required";
    if (!form.department) newErrors.department = "Department is required";
    if (!form.semester) newErrors.semester = "Semester is required";
    if (!form.credits) newErrors.credits = "Credits are required";
    if (!form.lecturer) newErrors.lecturer = "Lecturer is required";
    if (!/^\d+$/.test(String(form.semester || ""))) newErrors.semester = "Semester must be a number";
    if (!/^\d+$/.test(String(form.credits || ""))) newErrors.credits = "Credits must be a number";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const payload = buildFormData();
      if (editingCourse) {
        await updateCourse(editingCourse._id, payload);
      } else {
        await createCourse(payload);
      }
      setModalVisible(false);
      await loadCourses();
    } catch (error) {
      Alert.alert("Save failed", extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await deleteCourse(courseId);
      await loadCourses();
    } catch (error) {
      Alert.alert("Delete failed", extractApiError(error));
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const updatedCourse = await toggleEnrollment(courseId);
      await loadCourses();
      const enrolled = (updatedCourse?.students || []).some((id) => String(id) === String(user.id || user._id));
      Alert.alert("Enrollment", enrolled ? "Course enrolled successfully." : "Course unenrolled successfully.");
    } catch (error) {
      Alert.alert("Enrollment failed", extractApiError(error));
    }
  };

  if (loading) {
    return <LoadingOverlay label="Loading courses..." />;
  }

  const filteredCourses = courses.filter((course) => {
    const haystack = `${course.title} ${course.code} ${course.department} ${course.lecturer?.name || ""}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Courses</Text>
          <Text style={styles.subtitle}>Manage academic catalog and enrollment.</Text>
        </View>
        {canManage ? <AppButton label="Add" onPress={() => openModal()} style={styles.smallButton} /> : null}
      </View>
      <AppInput
        label="Search Courses"
        placeholder="Search by title, code, department, lecturer"
        value={search}
        onChangeText={setSearch}
      />

      {filteredCourses.map((course) => (
        <AppCard key={course._id} style={styles.card}>
          {user.role === "student" ? (
            <Text style={styles.enrollmentBadge}>
              {(course.students || []).some((student) => String(student._id || student) === String(user.id || user._id))
                ? "Enrolled"
                : "Not Enrolled"}
            </Text>
          ) : null}
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseMeta}>
            {course.code} • Semester {course.semester} • {course.credits} credits
          </Text>
          <Text style={styles.courseDescription}>{course.description}</Text>
          <Text style={styles.courseMeta}>Lecturer: {course.lecturer?.name || "Not assigned"}</Text>
          <View style={styles.actionRow}>
            {user.role === "student" ? (
              <AppButton
                label={
                  (course.students || []).some((student) => String(student._id || student) === String(user.id || user._id))
                    ? "Unenroll"
                    : "Enroll"
                }
                variant="secondary"
                onPress={() => handleEnroll(course._id)}
              />
            ) : (
              <>
                <AppButton label="Edit" variant="secondary" onPress={() => openModal(course)} />
                <AppButton label="Delete" variant="danger" onPress={() => handleDelete(course._id)} />
              </>
            )}
          </View>
        </AppCard>
      ))}
      {!filteredCourses.length ? <Text style={styles.emptyText}>No courses match your search.</Text> : null}

      <ModalSheet
        title={editingCourse ? "Update Course" : "Create Course"}
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
          label="Code" 
          required 
          error={errors.code}
          value={form.code} 
          onChangeText={(code) => {
            setForm((s) => ({ ...s, code }));
            if (errors.code) setErrors(e => ({ ...e, code: null }));
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
        <AppInput 
          label="Department" 
          required 
          error={errors.department}
          value={form.department} 
          onChangeText={(department) => {
            setForm((s) => ({ ...s, department }));
            if (errors.department) setErrors(e => ({ ...e, department: null }));
          }} 
        />
        <AppInput 
          label="Semester" 
          required 
          error={errors.semester}
          keyboardType="numeric" 
          value={form.semester} 
          onChangeText={(semester) => {
            setForm((s) => ({ ...s, semester }));
            if (errors.semester) setErrors(e => ({ ...e, semester: null }));
          }} 
        />
        <AppInput 
          label="Credits" 
          required 
          error={errors.credits}
          keyboardType="numeric" 
          value={form.credits} 
          onChangeText={(credits) => {
            setForm((s) => ({ ...s, credits }));
            if (errors.credits) setErrors(e => ({ ...e, credits: null }));
          }} 
        />
        <AppInput
          label={`Lecturer ID${lecturers[0] ? ` (${lecturers[0].name} available)` : ""}`}
          required
          error={errors.lecturer}
          value={form.lecturer}
          onChangeText={(lecturer) => {
            setForm((s) => ({ ...s, lecturer }));
            if (errors.lecturer) setErrors(e => ({ ...e, lecturer: null }));
          }}
          editable={user.role === "admin"}
        />
        {user.role === "admin" && lecturers.length ? (
          <View style={styles.lecturerRow}>
            {lecturers.slice(0, 6).map((lecturer) => (
              <AppButton
                key={lecturer._id}
                label={lecturer.name}
                variant={form.lecturer === lecturer._id ? "primary" : "secondary"}
                style={styles.lecturerButton}
                onPress={() => {
                  setForm((s) => ({ ...s, lecturer: lecturer._id }));
                  if (errors.lecturer) setErrors((e) => ({ ...e, lecturer: null }));
                }}
              />
            ))}
          </View>
        ) : null}
        {lecturers.length ? (
          <Text style={styles.helperText}>
            Lecturer options: {lecturers.slice(0, 3).map((lecturer) => `${lecturer.name} (${lecturer._id})`).join(", ")}
          </Text>
        ) : null}
        {user.role === "admin" && !lecturers.length ? (
          <Text style={styles.errorText}>No lecturer accounts found. Create a lecturer first.</Text>
        ) : null}
        <AppButton
          label={editingCourse ? "Update Course" : "Create Course"}
          onPress={handleSave}
          loading={saving}
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
    minWidth: 90
  },
  card: {
    marginBottom: spacing.md
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  courseMeta: {
    color: colors.textMuted,
    marginTop: 6
  },
  courseDescription: {
    marginTop: spacing.sm,
    color: colors.text,
    lineHeight: 20
  },
  actionRow: {
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
  lecturerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  lecturerButton: {
    minHeight: 38,
    paddingHorizontal: spacing.sm
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
    fontWeight: "700"
  },
  enrollmentBadge: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700"
  },
  emptyText: {
    color: colors.textMuted
  }
});

export default CoursesScreen;
