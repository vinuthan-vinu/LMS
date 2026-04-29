import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import ModalSheet from "../components/ModalSheet";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../theme/tokens";
import { forgotPassword } from "../services/authService";
import { extractApiError } from "../utils/apiError";
import { buildValidationErrors, required, validateSliitEmail } from "../utils/validators";

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotForm, setForgotForm] = useState({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState({ type: "", message: "" });

  const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const handleSubmit = async () => {
    const validationErrors = buildValidationErrors({
      email: { valid: validateSliitEmail(form.email), message: "Email must be like it12345678@my.sliit.lk" },
      password: { valid: required(form.password), message: "Password is required" }
    });

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      await signIn(form);
    } catch (error) {
      Alert.alert("Login failed", extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    setForgotFeedback({ type: "", message: "" });

    if (!forgotForm.email || !forgotForm.currentPassword || !forgotForm.newPassword || !forgotForm.confirmPassword) {
      setForgotFeedback({ type: "error", message: "Please fill all fields" });
      return;
    }
    if (!validateSliitEmail(forgotForm.email)) {
      setForgotFeedback({ type: "error", message: "Email must be like it12345678@my.sliit.lk" });
      return;
    }
    if (forgotForm.newPassword.length < 6) {
      setForgotFeedback({ type: "error", message: "Password must be at least 6 characters" });
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotFeedback({ type: "error", message: "Passwords do not match" });
      return;
    }

    try {
      setForgotLoading(true);
      await forgotPassword(forgotForm);
      setForgotFeedback({ type: "success", message: "Password reset successfully! Please login with your new password." });
      showMessage("Success", "Password reset successfully! Please login with your new password.");
      setForgotModalVisible(false);
      setForgotForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const message = extractApiError(error);
      setForgotFeedback({ type: "error", message });
      showMessage("Reset failed", message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.brand}>College LMS</Text>
        <Text style={styles.title}>
          Unlock the power of your{"\n"}
          <Text style={styles.titleAccent}>Campus Network</Text>.
        </Text>
        <Text style={styles.subtitle}>Sign in to manage courses, assignments, submissions, and announcements.</Text>
      </View>
      <AppCard>
        <AppInput
          label="Email"
          placeholder="it12345678@my.sliit.lk"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
          error={errors.email}
        />
        <AppInput
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          value={form.password}
          onChangeText={(password) => setForm((current) => ({ ...current, password }))}
          error={errors.password}
        />
        <AppButton label="Login" onPress={handleSubmit} loading={loading} />
        
        <TouchableOpacity style={styles.forgotLink} onPress={() => setForgotModalVisible(true)}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <AppButton
          label="Create Account"
          variant="secondary"
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Register")}
        />
      </AppCard>

      <ModalSheet
        title="Reset Password"
        visible={forgotModalVisible}
        onClose={() => {
          setForgotModalVisible(false);
          setForgotFeedback({ type: "", message: "" });
        }}
      >
        <Text style={styles.modalSub}>
          Enter your current password to set a new password.
        </Text>
        {forgotFeedback.message ? (
          <Text style={forgotFeedback.type === "success" ? styles.successText : styles.errorText}>{forgotFeedback.message}</Text>
        ) : null}
        <AppInput
          label="Email Address"
          placeholder="it12345678@my.sliit.lk"
          value={forgotForm.email}
          onChangeText={(email) => setForgotForm(s => ({ ...s, email }))}
        />
        <AppInput
          label="Current Password"
          placeholder="Enter current password"
          secureTextEntry
          value={forgotForm.currentPassword}
          onChangeText={(currentPassword) => setForgotForm(s => ({ ...s, currentPassword }))}
        />
        <AppInput
          label="New Password"
          placeholder="Enter new password"
          secureTextEntry
          value={forgotForm.newPassword}
          onChangeText={(newPassword) => setForgotForm(s => ({ ...s, newPassword }))}
        />
        <AppInput
          label="Confirm Password"
          placeholder="Confirm new password"
          secureTextEntry
          value={forgotForm.confirmPassword}
          onChangeText={(confirmPassword) => setForgotForm(s => ({ ...s, confirmPassword }))}
        />
        <AppButton label="Update Password" onPress={handleForgotSubmit} loading={forgotLoading} />
      </ModalSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xl
  },
  brand: {
    color: "rgba(255,255,255,0.86)",
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: spacing.lg
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
    color: "rgba(255,255,255,0.96)",
    lineHeight: 36,
    marginBottom: spacing.sm
  },
  titleAccent: {
    color: colors.primary
  },
  subtitle: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 15,
    lineHeight: 22
  },
  secondaryButton: {
    marginTop: spacing.sm
  },
  forgotLink: {
    alignItems: "center",
    marginVertical: spacing.sm
  },
  forgotText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14
  },
  modalSub: {
    color: "rgba(255,255,255,0.7)",
    marginBottom: spacing.md,
    fontSize: 14
  },
  errorText: {
    color: colors.error,
    fontWeight: "700",
    marginBottom: spacing.sm
  },
  successText: {
    color: colors.success,
    fontWeight: "700",
    marginBottom: spacing.sm
  }
});

export default LoginScreen;
