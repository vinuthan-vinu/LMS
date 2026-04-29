import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { spacing, typography } from "../theme/tokens";
import { extractApiError } from "../utils/apiError";
import { buildValidationErrors, required, validatePassword, validateSliitEmail } from "../utils/validators";

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: ""
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const validationErrors = buildValidationErrors({
      name: { valid: required(form.name), message: "Name is required" },
      email: { valid: validateSliitEmail(form.email), message: "Email must be like it12345678@my.sliit.lk" },
      password: { valid: validatePassword(form.password), message: "Minimum 6 characters" },
      department: { valid: required(form.department), message: "Department is required" }
    });

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      await register(form);
    } catch (error) {
      Alert.alert("Registration failed", extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Already have an account? <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>Login</Text></Text>
      </View>
      
      <AppCard>
        <AppInput label="Full Name" placeholder="Your Name" value={form.name} onChangeText={(name) => setForm((s) => ({ ...s, name }))} error={errors.name} />
        <AppInput
          label="Email Address"
          placeholder="it12345678@my.sliit.lk"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(email) => setForm((s) => ({ ...s, email }))}
          error={errors.email}
        />
        <AppInput label="Department" placeholder="E.g. Computer Science" value={form.department} onChangeText={(department) => setForm((s) => ({ ...s, department }))} error={errors.department} />
        <AppInput
          label="Password"
          placeholder="Create password"
          secureTextEntry
          value={form.password}
          onChangeText={(password) => setForm((s) => ({ ...s, password }))}
          error={errors.password}
        />
        <AppButton label="Create Account" onPress={handleSubmit} loading={loading} />
      </AppCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xl
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
    color: "rgba(255,255,255,0.96)",
    lineHeight: 36,
    marginBottom: spacing.sm
  },
  subtitle: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 15,
    lineHeight: 22
  },
  loginLink: {
    color: "#FF4500", // Orange color from screenshot
    fontWeight: "bold"
  }
});

export default RegisterScreen;
