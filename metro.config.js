const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Mock react-native-health (iOS-only) so Android bundling doesn't fail
config.resolver.extraNodeModules = {
  "react-native-health": path.resolve(__dirname, "lib/health-ios-stub.js"),
};

module.exports = config;
