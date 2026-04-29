import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { colors, spacing } from "../theme/tokens";
import { LMS_BACKGROUND_SVG } from "../assets/lmsBackgroundSvg";

const ScreenContainer = ({ children, scroll = true, ...wrapperProps }) => {
  const Wrapper = scroll ? ScrollView : View;

  return (
    <LinearGradient colors={["#0B1220", "#0E1A33", "#0B1220"]} style={styles.gradient}>
      <View pointerEvents="none" style={styles.svgLayer}>
        <SvgXml xml={LMS_BACKGROUND_SVG} width="140%" height="140%" style={styles.svg} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <Wrapper
          style={styles.wrapper}
          {...wrapperProps}
          contentContainerStyle={scroll ? [styles.content, wrapperProps.contentContainerStyle] : undefined}
          showsVerticalScrollIndicator={scroll ? false : undefined}
        >
          {children}
        </Wrapper>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  svgLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55
  },
  svg: {
    position: "absolute",
    right: "-20%",
    top: "-10%"
  },
  safeArea: {
    flex: 1
  },
  wrapper: {
    flex: 1
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2
  }
});

export default ScreenContainer;
