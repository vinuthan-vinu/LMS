import React, { useEffect, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Platform, Linking } from "react-native";
import CampusCalendar from "../components/CampusCalendar";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import LoadingOverlay from "../components/LoadingOverlay";
import ModalSheet from "../components/ModalSheet";
import ScreenContainer from "../components/ScreenContainer";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { fetchDashboard } from "../services/dashboardService";
import {
  createNotification,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  updateNotification
} from "../services/notificationService";
import { fetchCalendarEvents, upsertCalendarEvent, deleteCalendarEvent } from "../services/calendarService";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "../services/eventService";
import { fetchExams, createExam, updateExam, deleteExam } from "../services/examService";
import { colors, spacing, typography } from "../theme/tokens";
import { extractApiError } from "../utils/apiError";
import { capitalize, formatDateTime } from "../utils/formatters";

const CALENDAR_TYPE_OPTIONS = [
  { value: "leave", label: "Leave", color: "#ef4444" },
  { value: "event", label: "Event", color: "#eab308" },
  { value: "poya", label: "Poya", color: "#22c55e" }
];

const DashboardScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState({ title: "", message: "", targetRole: "all", type: "info" });
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventDraft, setEventDraft] = useState({ title: "", type: "leave" });
  const [campusEvents, setCampusEvents] = useState([]);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [newCampusEvent, setNewCampusEvent] = useState({ title: "", venue: "", dateTime: "", description: "" });
  const [eventImage, setEventImage] = useState(null);
  const [exams, setExams] = useState([]);
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [newExam, setNewExam] = useState({ title: "", subject: "", description: "" });
  const [examFile, setExamFile] = useState(null);
  const [editingCampusEvent, setEditingCampusEvent] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [editingNotification, setEditingNotification] = useState(null);

  const loadDashboard = async () => {
    const results = await Promise.allSettled([
      fetchDashboard(),
      fetchNotifications(),
      fetchCalendarEvents(),
      fetchEvents(),
      fetchExams()
    ]);

    const [dashboardResult, notificationsResult, calendarResult, campusEventsResult, examsResult] = results;

    setSummary(
      dashboardResult.status === "fulfilled"
        ? dashboardResult.value
        : { stats: {}, upcomingAssignments: [], recentSubmissions: [] }
    );
    setNotifications(notificationsResult.status === "fulfilled" ? notificationsResult.value : []);
    setCalendarEvents(calendarResult.status === "fulfilled" ? calendarResult.value : []);
    setCampusEvents(campusEventsResult.status === "fulfilled" ? campusEventsResult.value : []);
    setExams(examsResult.status === "fulfilled" ? examsResult.value : []);

    const loadErrors = results
      .filter((result) => result.status === "rejected")
      .map((result) => extractApiError(result.reason));

    if (loadErrors.length) {
      Alert.alert("Some dashboard data failed to load", loadErrors[0]);
    }
  };

  useEffect(() => {
    loadDashboard()
      .catch((error) => Alert.alert("Dashboard error", extractApiError(error)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadDashboard().catch(() => null);
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } catch (error) {
      Alert.alert("Refresh failed", extractApiError(error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateNotification = async () => {
    try {
      await createNotification(draft);
      setDraft({ title: "", message: "", targetRole: "all", type: "info" });
      setModalVisible(false);
      await onRefresh();
    } catch (error) {
      Alert.alert("Notification failed", extractApiError(error));
    }
  };

  const handleUpdateNotification = async () => {
    try {
      await updateNotification(editingNotification._id, draft);
      setEditingNotification(null);
      setModalVisible(false);
      await onRefresh();
    } catch (error) {
      Alert.alert("Update failed", extractApiError(error));
    }
  };

  const handleNotificationAction = async (notification) => {
    try {
      if (user.role === "student") {
        await updateNotification(notification._id, { isRead: true });
      } else {
        await deleteNotification(notification._id);
      }
      await onRefresh();
    } catch (error) {
      Alert.alert("Notification action failed", extractApiError(error));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await onRefresh();
    } catch (error) {
      Alert.alert("Action failed", extractApiError(error));
    }
  };

  const openNotificationModal = (notification = null) => {
    if (notification) {
      setEditingNotification(notification);
      setDraft({
        title: notification.title,
        message: notification.message,
        targetRole: notification.targetRole,
        type: notification.type
      });
    } else {
      setEditingNotification(null);
      setDraft({ title: "", message: "", targetRole: "all", type: "info" });
    }
    setModalVisible(true);
  };

  const openEventModal = (event = null) => {
    if (event) {
      setEditingCampusEvent(event);
      setNewCampusEvent({
        title: event.title,
        venue: event.venue,
        dateTime: event.dateTime?.slice(0, 16) || "",
        description: event.description
      });
    } else {
      setEditingCampusEvent(null);
      setNewCampusEvent({ title: "", venue: "", dateTime: "", description: "" });
    }
    setEventImage(null);
    setEventModalVisible(true);
  };

  const openExamModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setNewExam({
        title: exam.title,
        subject: exam.subject,
        description: exam.description
      });
    } else {
      setEditingExam(null);
      setNewExam({ title: "", subject: "", description: "" });
    }
    setExamFile(null);
    setExamModalVisible(true);
  };

  const handleDateSelect = (date) => {
    if (user.role.toLowerCase() !== "admin") return;
    
    const existing = calendarEvents.find(e => e.date.split("T")[0] === date.toISOString().split("T")[0]);
    setSelectedDate(date);
    setEventDraft(existing ? { title: existing.title, type: existing.type } : { title: "", type: "leave" });
    setCalendarModalVisible(true);
  };

  const handleUpdateCalendar = async () => {
    try {
      if (!selectedDate) {
        Alert.alert("Missing date", "Please select a date first.");
        return;
      }

      await upsertCalendarEvent({
        date: selectedDate.toISOString().split("T")[0],
        title: eventDraft.title.trim() || capitalize(eventDraft.type),
        type: eventDraft.type
      });
      setCalendarModalVisible(false);
      setEventDraft({ title: "", type: "leave" });
      await onRefresh();
    } catch (error) {
      Alert.alert("Calendar update failed", extractApiError(error));
    }
  };

  const handleDeleteCalendarEvent = async () => {
    try {
      const existing = calendarEvents.find(e => e.date.split("T")[0] === selectedDate.toISOString().split("T")[0]);
      if (existing) {
        await deleteCalendarEvent(existing._id);
        setCalendarModalVisible(false);
        await onRefresh();
      }
    } catch (error) {
      Alert.alert("Delete failed", extractApiError(error));
    }
  };

  const selectedCalendarEvent = selectedDate
    ? calendarEvents.find((event) => event.date.split("T")[0] === selectedDate.toISOString().split("T")[0])
    : null;

  if (loading) {
    return <LoadingOverlay label="Loading dashboard..." />;
  }

  return (
    <ScreenContainer
      scroll
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Welcome back, {user.name}</Text>
      <Text style={styles.subtitle}>{capitalize(user.role)} workspace overview</Text>

      <View style={styles.statsGrid}>
        {Object.entries(summary?.stats || {}).map(([label, value]) => (
          <StatCard key={label} label={capitalize(label.replace(/([A-Z])/g, " $1"))} value={value} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Campus Calendar</Text>
      <CampusCalendar 
        events={calendarEvents} 
        isAdmin={user.role.toLowerCase() === "admin"} 
        onSelectDate={handleDateSelect} 
      />
      {user.role.toLowerCase() === "admin" ? (
        <Text style={styles.calendarHint}>Tap a date to add or edit Leave/Event/Poya.</Text>
      ) : null}

      <View style={[styles.sectionHeader, styles.eventHeader]}>
        <Text style={styles.sectionTitle}>Campus Events</Text>
        {user.role.toLowerCase() === "admin" && (
          <AppButton label="Add Event" variant="secondary" style={styles.inlineHeaderButton} onPress={() => openEventModal()} />
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
        {campusEvents.map((event) => (
          <AppCard key={event._id} style={styles.eventCard}>
            {event.image ? <Image source={{ uri: event.image }} style={styles.eventImage} /> : null}
            <View style={styles.eventCardBody}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventVenue}>📍 {event.venue}</Text>
              <Text style={styles.eventTime}>⏰ {formatDateTime(event.dateTime)}</Text>
              <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
              {user.role.toLowerCase() === "admin" && (
                <View style={styles.actionsRow}>
                  <AppButton label="Edit" variant="secondary" style={styles.deleteSmall} onPress={() => openEventModal(event)} />
                  <AppButton label="Remove" variant="secondary" style={styles.deleteSmall} onPress={async () => {
                    try {
                      await deleteEvent(event._id);
                      await onRefresh();
                    } catch (error) {
                      Alert.alert("Delete failed", extractApiError(error));
                    }
                  }} />
                </View>
              )}
            </View>
          </AppCard>
        ))}
        {!campusEvents.length ? <Text style={styles.emptyText}>No events scheduled.</Text> : null}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exam Notices</Text>
        {user.role.toLowerCase() === "admin" && (
          <AppButton label="Add Exam" variant="secondary" style={styles.inlineHeaderButton} onPress={() => openExamModal()} />
        )}
      </View>
      <View style={styles.examGrid}>
        {exams.map((exam) => (
          <AppCard key={exam._id} style={styles.examCard}>
            <View style={styles.examHeader}>
              <Text style={styles.examTitle}>{exam.title}</Text>
              <Text style={styles.examSubject}>{exam.subject}</Text>
            </View>
            <Text style={styles.examDesc}>{exam.description}</Text>
            <View style={styles.examActions}>
              <View style={styles.downloadSection}>
                {exam.fileUrl ? (
                  <TouchableOpacity onPress={() => Linking.openURL(exam.fileUrl)} style={styles.downloadLink}>
                    <Text style={styles.downloadText}>📄 Download PDF Notice</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {user.role.toLowerCase() === "admin" && (
                <View style={styles.actionsRow}>
                  <AppButton label="Edit" variant="secondary" style={styles.deleteSmall} onPress={() => openExamModal(exam)} />
                  <AppButton label="Delete" variant="secondary" style={styles.deleteSmall} onPress={async () => {
                    try {
                      await deleteExam(exam._id);
                      await onRefresh();
                    } catch (error) {
                      Alert.alert("Delete failed", extractApiError(error));
                    }
                  }} />
                </View>
              )}
            </View>
          </AppCard>
        ))}
        {!exams.length ? <Text style={styles.emptyText}>No exam notices available.</Text> : null}
      </View>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming assignments</Text>
        {(summary?.upcomingAssignments || []).map((assignment) => (
          <View key={assignment._id} style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.itemTitle}>{assignment.title}</Text>
              <Text style={styles.itemMeta}>{assignment.course?.title} • {formatDateTime(assignment.dueDate)}</Text>
            </View>
          </View>
        ))}
        {!summary?.upcomingAssignments?.length ? <Text style={styles.emptyText}>No upcoming assignments.</Text> : null}
      </AppCard>

      {user.role !== "student" ? (
        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Recent submissions</Text>
          {(summary?.recentSubmissions || []).map((submission) => (
            <View key={submission._id} style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.itemTitle}>{submission.assignment?.title || "Submission"}</Text>
                <Text style={styles.itemMeta}>
                  {submission.student?.name || "Student"} • {submission.course?.title || "Course"} •{" "}
                  {capitalize(submission.status)}
                </Text>
              </View>
            </View>
          ))}
          {!summary?.recentSubmissions?.length ? (
            <Text style={styles.emptyText}>No submissions yet.</Text>
          ) : null}
        </AppCard>
      ) : null}

      <AppCard style={styles.notiCard}>
        <View style={[styles.sectionHeader, styles.notiSectionHeader, { marginTop: 0 }]}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.headerActions}>
            {user.role === "student" ? (
              <AppButton label="Mark All Read" variant="secondary" style={styles.inlineHeaderButton} onPress={handleMarkAllRead} />
            ) : (
              <AppButton label="New" variant="secondary" style={styles.inlineHeaderButton} onPress={() => openNotificationModal()} />
            )}
          </View>
        </View>
        {notifications.map((notification) => (
          <View key={notification._id} style={styles.notification}>
            <View style={styles.rowContent}>
              <Text style={styles.itemTitle}>{notification.title}</Text>
              <Text style={styles.itemMeta}>
                {notification.type} • {formatDateTime(notification.createdAt)}
                {notification.isRead && <Text style={styles.readBadge}> • Read</Text>}
              </Text>
              <Text style={[styles.message, notification.isRead && styles.readMessage]}>{notification.message}</Text>
            </View>
            {user.role !== "student" ? (
              <View style={styles.actionsRow}>
                <AppButton label="Edit" variant="secondary" style={styles.inlineButton} onPress={() => openNotificationModal(notification)} />
                <AppButton label="Delete" variant="secondary" style={styles.inlineButton} onPress={() => handleNotificationAction(notification)} />
              </View>
            ) : (
              !notification.isRead && (
                <AppButton
                  label="Mark Read"
                  variant="secondary"
                  style={styles.inlineButton}
                  onPress={() => handleNotificationAction(notification)}
                />
              )
            )}
          </View>
        ))}
        {!notifications.length ? <Text style={styles.emptyText}>No notifications available.</Text> : null}
      </AppCard>

      <ModalSheet title={editingNotification ? "Edit Notification" : "Create Notification"} visible={modalVisible} onClose={() => setModalVisible(false)}>
        <AppInput label="Title" value={draft.title} onChangeText={(title) => setDraft((current) => ({ ...current, title }))} />
        <AppInput label="Message" multiline value={draft.message} onChangeText={(message) => setDraft((current) => ({ ...current, message }))} />
        <AppInput label="Target Role" value={draft.targetRole} onChangeText={(targetRole) => setDraft((current) => ({ ...current, targetRole }))} />
        <AppInput label="Type" value={draft.type} onChangeText={(type) => setDraft((current) => ({ ...current, type }))} />
        <AppButton label={editingNotification ? "Update Notification" : "Send Notification"} onPress={editingNotification ? handleUpdateNotification : handleCreateNotification} />
      </ModalSheet>

      <ModalSheet title={editingCampusEvent ? "Edit Campus Event" : "Schedule Campus Event"} visible={eventModalVisible} onClose={() => setEventModalVisible(false)}>
        <AppInput label="Event Name" value={newCampusEvent.title} onChangeText={(title) => setNewCampusEvent(s => ({ ...s, title }))} />
        <AppInput label="Venue / Hall" value={newCampusEvent.venue} onChangeText={(venue) => setNewCampusEvent(s => ({ ...s, venue }))} />
        
        {Platform.OS === "web" ? (
          <View style={styles.webDateField}>
            <Text style={styles.sectionLabel}>Date & Time</Text>
            <input
              type="datetime-local"
              style={{ ...styles.webDateInput }}
              value={newCampusEvent.dateTime}
              onChange={(e) => setNewCampusEvent(s => ({ ...s, dateTime: e.target.value }))}
            />
          </View>
        ) : (
          <AppInput label="Date & Time (YYYY-MM-DD HH:mm)" value={newCampusEvent.dateTime} onChangeText={(dateTime) => setNewCampusEvent(s => ({ ...s, dateTime }))} />
        )}

        <AppInput label="Description" multiline value={newCampusEvent.description} onChangeText={(description) => setNewCampusEvent(s => ({ ...s, description }))} />
        
        <AppButton label={eventImage ? "New Image Selected ✅" : (editingCampusEvent ? "Change Photo (Optional)" : "Upload Photo")} variant="secondary" onPress={async () => {
          if (Platform.OS === "web") {
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = (e) => setEventImage(e.target.files[0]);
            input.click();
          } else {
            const { getDocumentAsync } = await import("expo-document-picker");
            const res = await getDocumentAsync({ type: "image/*" });
            if (!res.canceled) setEventImage(res.assets[0]);
          }
        }} />

        <AppButton label={editingCampusEvent ? "Save Changes" : "Publish Event"} style={styles.submitButton} onPress={async () => {
          try {
            const formData = new FormData();
            Object.entries(newCampusEvent).forEach(([k, v]) => formData.append(k, v));
            if (eventImage) {
              if (Platform.OS === "web") {
                formData.append("files", eventImage);
              } else {
                formData.append("files", { uri: eventImage.uri, name: eventImage.name, type: eventImage.mimeType });
              }
            }
            if (editingCampusEvent) {
              await updateEvent(editingCampusEvent._id, formData);
            } else {
              await createEvent(formData);
            }
            setEventModalVisible(false);
            setEditingCampusEvent(null);
            setNewCampusEvent({ title: "", venue: "", dateTime: "", description: "" });
            setEventImage(null);
            await onRefresh();
          } catch (e) { Alert.alert("Error", extractApiError(e)); }
        }} />
      </ModalSheet>

      <ModalSheet title={editingExam ? "Edit Exam Notice" : "Publish Exam Notice"} visible={examModalVisible} onClose={() => setExamModalVisible(false)}>
        <AppInput label="Notice Title" placeholder="E.g. Final Exam Schedule" value={newExam.title} onChangeText={(title) => setNewExam(s => ({ ...s, title }))} />
        <AppInput label="Subject / Course" placeholder="E.g. Computer Science" value={newExam.subject} onChangeText={(subject) => setNewExam(s => ({ ...s, subject }))} />
        <AppInput label="Description / Instructions" multiline value={newExam.description} onChangeText={(description) => setNewExam(s => ({ ...s, description }))} />
        
        <AppButton label={examFile ? "New File Selected ✅" : (editingExam ? "Change PDF (Optional)" : "Upload PDF / File")} variant="secondary" onPress={async () => {
          if (Platform.OS === "web") {
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = (e) => setExamFile(e.target.files[0]);
            input.click();
          } else {
            const { getDocumentAsync } = await import("expo-document-picker");
            const res = await getDocumentAsync({ type: "*/*" });
            if (!res.canceled) setExamFile(res.assets[0]);
          }
        }} />

        <AppButton label={editingExam ? "Save Changes" : "Publish Notice"} style={styles.submitButton} onPress={async () => {
          try {
            const formData = new FormData();
            Object.entries(newExam).forEach(([k, v]) => formData.append(k, v));
            if (examFile) {
              if (Platform.OS === "web") {
                formData.append("files", examFile);
              } else {
                formData.append("files", { uri: examFile.uri, name: examFile.name, type: examFile.mimeType });
              }
            }
            if (editingExam) {
              await updateExam(editingExam._id, formData);
            } else {
              await createExam(formData);
            }
            setExamModalVisible(false);
            setEditingExam(null);
            setNewExam({ title: "", subject: "", description: "" });
            setExamFile(null);
            await onRefresh();
          } catch (e) { Alert.alert("Error", extractApiError(e)); }
        }} />
      </ModalSheet>

      <ModalSheet
        title={selectedDate ? `Calendar: ${selectedDate.toDateString()}` : "Update Calendar"}
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
      >
        <AppInput
          label="Title"
          value={eventDraft.title}
          onChangeText={(title) => setEventDraft((current) => ({ ...current, title }))}
          placeholder="E.g. Sinhala & Tamil New Year"
        />

        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.calendarTypeRow}>
          {CALENDAR_TYPE_OPTIONS.map((option) => {
            const isSelected = eventDraft.type === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.calendarTypeChip,
                  isSelected && { borderColor: option.color, backgroundColor: `${option.color}20` }
                ]}
                onPress={() => setEventDraft((current) => ({ ...current, type: option.value }))}
              >
                <View style={[styles.calendarTypeDot, { backgroundColor: option.color }]} />
                <Text style={[styles.calendarTypeText, isSelected && styles.calendarTypeTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppButton
          label={selectedCalendarEvent ? "Update Day" : "Add Day"}
          onPress={handleUpdateCalendar}
        />
        {selectedCalendarEvent ? (
          <AppButton label="Delete Day" variant="danger" style={styles.calendarDeleteButton} onPress={handleDeleteCalendarEvent} />
        ) : null}
      </ModalSheet>
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  section: {
    marginBottom: spacing.lg
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    paddingLeft: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: 0
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm
  },
  calendarHint: {
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md
  },
  eventHeader: {
    borderLeftColor: colors.accent.event
  },
  examSectionHeader: {
    borderLeftColor: colors.accent.exam
  },
  notiSectionHeader: {
    borderLeftColor: colors.accent.noti
  },
  inlineHeaderButton: {
    paddingHorizontal: spacing.sm,
    height: 32,
    borderRadius: 8
  },
  eventScroll: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm
  },
  eventCard: {
    width: 280,
    marginRight: spacing.md,
    padding: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    backgroundColor: colors.surface
  },
  eventImage: {
    width: "100%",
    height: 140,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  eventCardBody: {
    padding: spacing.md
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.accent.event,
    marginBottom: 4
  },
  eventVenue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    marginBottom: 2
  },
  eventTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  eventDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18
  },
  examGrid: {
    gap: spacing.md
  },
  examCard: {
    borderLeftWidth: 6,
    borderLeftColor: colors.accent.exam,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  examHeader: {
    marginBottom: spacing.sm
  },
  examTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text
  },
  examSubject: {
    fontSize: 14,
    color: colors.accent.exam,
    fontWeight: "700",
    marginTop: 2
  },
  examDesc: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md
  },
  downloadLink: {
    backgroundColor: "rgba(191, 90, 242, 0.1)",
    padding: spacing.sm,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(191, 90, 242, 0.3)"
  },
  downloadText: {
    color: colors.accent.exam,
    fontWeight: "800",
    fontSize: 13
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  notiCard: {
    borderTopWidth: 4,
    borderTopColor: colors.accent.noti,
    marginBottom: spacing.lg
  },
  rowContent: {
    flex: 1,
    paddingRight: spacing.sm
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  readBadge: {
    color: colors.success,
    fontWeight: "900"
  },
  readMessage: {
    opacity: 0.4
  },
  message: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20
  },
  inlineButton: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: 8
  },
  deleteSmall: {
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    padding: spacing.xl,
    fontStyle: "italic"
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  downloadSection: {
    flex: 1
  },
  calendarTypeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  calendarTypeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted
  },
  calendarTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  calendarTypeText: {
    color: colors.textMuted,
    fontWeight: "700"
  },
  calendarTypeTextSelected: {
    color: colors.text
  },
  calendarDeleteButton: {
    marginTop: spacing.sm
  }
});

export default DashboardScreen;
