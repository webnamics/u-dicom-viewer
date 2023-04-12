import { defineConfig, loadEnv } from 'vite';
import reactRefresh from '@vitejs/plugin-react'

const viteEnv = {}

Object.keys(process.env).forEach((key) => {
  if (key.startsWith(`VITE_`)) {
    viteEnv[`${key}`] = process.env[key]
  }
})

export default ({ mode }) => {
  return defineConfig({
    plugins: [reactRefresh()],
    define: viteEnv,

  });
}