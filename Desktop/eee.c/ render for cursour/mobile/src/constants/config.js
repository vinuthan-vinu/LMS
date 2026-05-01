import { Platform } from "react-native";
import Constants from "expo-constants";

const getBaseUrl = () => {
  // If we are in a web browser, use localhost
  if (Platform.OS === "web") {
    return "https://lms-production-640d.up.railway.app/api/v1";
  }
  
  // If we are on a real device (iPhone/Android), use the IP address
  return Constants.expoConfig?.extra?.apiBaseUrl || "https://lms-production-640d.up.railway.app/api/v1";
};

export const API_BASE_URL = getBaseUrl();
