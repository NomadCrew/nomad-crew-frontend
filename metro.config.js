const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Extract transformer and resolver
const { transformer, resolver } = config;

// Updated transformer for SVGs
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// Updated resolver to handle SVG and JSX extensions
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx', 'svg'],
  alias: {
    '@': path.resolve(__dirname), // Allows using @ for imports
  },
};

// Additional configuration for React 18 and Metro bundler compatibility
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, 'node_modules/react'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

module.exports = config;
