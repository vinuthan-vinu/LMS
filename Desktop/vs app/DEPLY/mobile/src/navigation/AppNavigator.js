import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { useAuth } from "../context/AuthContext";
import AssignmentsScreen from "../screens/AssignmentsScreen";
import CoursesScreen from "../screens/CoursesScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SubmissionScreen from "../screens/SubmissionScreen";
import UsersScreen from "../screens/UsersScreen";
import { capitalize, formatDateTime } from "../utils/formatters";
import { colors } from "../theme/tokens";
import LoadingOverlay from "../components/LoadingOverlay";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIconMap = {
  Dashboard: "grid-outline",
  Courses: "book-outline",
  Assignments: "document-text-outline",
  Submissions: "cloud-upload-outline",
  Profile: "person-outline",
  Users: "people-outline"
};

const AppTabs = () => {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const initialRouteName =
    role === "admin" ? "Users" : role === "lecturer" ? "Assignments" : "Dashboard";

  return (
    <Tab.Navigator
      key={role || "guest"}
      initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIconMap[route.name]} color={color} size={size} />
        )
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Submissions" component={SubmissionScreen} />
      {role === "admin" ? <Tab.Screen name="Users" component={UsersScreen} /> : null}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay label="Restoring session..." />;
  }

  return isAuthenticated ? <AppTabs /> : <AuthStack />;
};

export default AppNavigator;
