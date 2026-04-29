import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "lms_token";
const USER_KEY = "lms_user";

export const persistSession = async ({ token, user }) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)]
  ]);
};

export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

export const getStoredSession = async () => {
  const [[, token], [, user]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  return {
    token,
    user: user ? JSON.parse(user) : null
  };
};
