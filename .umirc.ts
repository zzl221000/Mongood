import { defineConfig } from 'umi'
import { resolve } from 'path'
import ThreadsPlugin from 'threads-plugin'

export default defineConfig({
  antd: false,
  dva: false,
  title: 'Mongood',
  esbuild: {},
  history: { type: 'hash' },
  favicon: '/favicon.ico',
  hash: true,
  proxy: {
    '/api': {
      target: 'http://localhost:3000/',
      changeOrigin: true,
    },
  },
  forkTSChecker: {},
  alias: {
    'react-redux':
      process.env.NODE_ENV === 'development'
        ? 'react-redux/lib'
        : 'react-redux',
  },
  chainWebpack(config) {
    config.module
      .rule('declaration')
      .test(/\.d\.ts$/)
      .include.add(resolve('./src/utils/editor/libs'))
      .end()
      .use('declaration')
      .loader('raw-loader')
    config.plugin('threads').use(ThreadsPlugin)
  },
})
