import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // react(),
    react({
      babel: {
        parserOpts: {
          plugins: [
            'decorators-legacy',
            [
              '@babel/plugin-transform-react-jsx',
              {
                throwIfNamespace: false, // defaults to true
                runtime: 'automatic', // defaults to classic
                importSource: 'custom-jsx-library', // defaults to react
              },
            ],
          ],
        },
      },
    }),
    // [
    //   '@babel/plugin-transform-react-jsx',
    //   {
    //     throwIfNamespace: false, // defaults to true
    //     runtime: 'automatic', // defaults to classic
    //     importSource: 'custom-jsx-library', // defaults to react
    //   },
    // ],
  ],
  build: {
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
  },
})
// as import('vite').UserConfig & {
//   build: import('vite').BuildOptions & {
//     babel: {
//       presets: string[]
//       plugins: string[]
//     }
//   }
// })
// import { defineConfig } from 'vite'

// const config = {
//   build: {
//     chunkSizeWarningLimit: 1500,
//   },
//   server: {
//     port: 3000,
//     // open: true,
//   },
// }

// export default defineConfig(config)
// import { defineConfig } from 'vite'

// const config = {
//   build: {
//     chunkSizeWarningLimit: 1500,
//   },
//   server: {
//     open: true,
//   },
// }

// export default defineConfig(config)
