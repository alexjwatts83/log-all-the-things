/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.logallthethings.app',
  appName: 'Log All The Things',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
};

export default config;