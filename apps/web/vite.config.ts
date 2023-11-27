import react from '@vitejs/plugin-react-swc';
import * as dotenv from 'dotenv';
import path from 'path';
import Unfonts from 'unplugin-fonts/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      nodePolyfills(),
      react(),
      Unfonts({
        custom: {
          preload: true,
          display: 'swap',
          families: {
            'Sofia Pro': {
              src: './public/fonts/Sofia*',
              transform(font) {
                if (font.basename.includes('Reg')) {
                  font.weight = 400;
                }
                if (font.basename.includes('Med')) {
                  font.weight = 600;
                }
                if (font.basename.includes('Bold')) {
                  font.weight = 800;
                }
                return font;
              }
            }
          }
        }
      })
    ],
    resolve: {
      alias: {
        '@lib': path.resolve(__dirname, './src/lib'),
        '@gql': path.resolve(__dirname, './src/gql'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@store': path.resolve(__dirname, './src/store'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@enums': path.resolve(__dirname, './src/enums'),
        '@constants': path.resolve(__dirname, './src/constants'),
        '@generated': path.resolve(__dirname, './src/generated'),
        '@components': path.resolve(__dirname, './src/components'),
        '@persisted': path.resolve(__dirname, './src/store/persisted')
      }
    },
    define: {
      global: {},
      'process.env': process.env
    },
    server: {
      host: '0.0.0.0',
      open: true,
      port: 4783
    },
    preview: {
      host: '0.0.0.0',
      open: true,
      port: 4783
    }
  };
});