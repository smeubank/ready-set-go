// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@sentry/nuxt/module"],
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  sentry: {
    sourceMapsUploadOptions: {
      org: "steven-eubank",
      project: "ready-set-go",
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
    },
  },
})
