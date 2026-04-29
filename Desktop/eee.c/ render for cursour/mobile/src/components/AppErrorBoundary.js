import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AppButton from "./AppButton";
import ScreenContainer from "./ScreenContainer";
import { colors, spacing, typography } from "../theme/tokens";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep logs for debugging crashes without blank screens.
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScreenContainer scroll={false}>
          <View style={styles.container}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app recovered from an unexpected error. Please try again.
            </Text>
            <AppButton label="Reload App View" onPress={() => this.setState({ hasError: false })} />
          </View>
        </ScreenContainer>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
    color: colors.text
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 320
  }
});

export default AppErrorBoundary;
