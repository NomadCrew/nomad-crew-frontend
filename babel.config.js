module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',       // Expo preset for React Native
      '@babel/preset-react',     // React preset for JSX
      '@babel/preset-typescript' // TypeScript support
    ],
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }], // Ensures automatic JSX runtime
      'react-native-reanimated/plugin' 
    ],
  };
};