const { defineConfig, devices } = require('@playwright/test');

/* The app ships to iPhones, so Mobile Safari (WebKit) is the engine that matters:
 * the home-screen flicker and the inert <a download> were both WebKit-specific.
 * Chromium is also run because the Android build is a Trusted Web Activity, which
 * is Chrome. Pick one locally with --project=... */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8099',
    trace: 'retain-on-failure',
    // Container images often run as root, where Chromium refuses to start without
    // --no-sandbox. Opt in with PW_NO_SANDBOX=1 rather than weakening the sandbox
    // for everyone.
    ...(process.env.PW_NO_SANDBOX ? { launchOptions: { args: ['--no-sandbox'] } } : {}),
  },
  projects: [
    { name: 'mobile-safari',   use: { ...devices['iPhone 13'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 8099',
    url: 'http://127.0.0.1:8099/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
