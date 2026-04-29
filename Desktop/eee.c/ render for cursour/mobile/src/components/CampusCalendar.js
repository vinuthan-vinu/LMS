import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { colors, spacing, radius } from "../theme/tokens";

const CampusCalendar = ({ events = [], onSelectDate, isAdmin = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(<View key={`pad-${i}`} style={styles.dayCell} />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = new Date(year, month, d).toISOString().split("T")[0];
    const event = events.find((e) => e.date.split("T")[0] === dateStr);

    days.push(
      <TouchableOpacity
        key={d}
        style={[
          styles.dayCell,
          event && { backgroundColor: event.color + "20" }, // Light background
          event && { borderColor: event.color, borderWidth: 2 }
        ]}
        disabled={!isAdmin}
        onPress={() => onSelectDate(new Date(year, month, d))}
      >
        <Text style={[styles.dayText, event && { color: event.color, fontWeight: "bold" }]}>
          {d}
        </Text>
        {event && (
          <View style={[styles.dot, { backgroundColor: event.color }]} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}>
          <Text style={styles.navText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName} {year}</Text>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}>
          <Text style={styles.navText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Text key={day} style={styles.weekText}>{day}</Text>
        ))}
      </View>

      <View style={styles.grid}>{days}</View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>Leave</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#eab308" }]} />
          <Text style={styles.legendText}>Event</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
          <Text style={styles.legendText}>Poya</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }
    })
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  navText: {
    fontSize: 20,
    color: colors.primary,
    padding: 10,
    fontWeight: "bold"
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.sm
  },
  weekText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    width: "14%",
    textAlign: "center"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 2
  },
  dayText: {
    fontSize: 14,
    color: colors.text
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600"
  }
});

export default CampusCalendar;
