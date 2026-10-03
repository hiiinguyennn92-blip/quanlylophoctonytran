import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import {defineConfig} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suppressHmrWsPlugin = () => ({
  name: 'suppress-hmr-ws-error',
  transformIndexHtml() {
    return [
      {
        tag: 'script',
        injectTo: 'head-prepend' as const,
        children: `
          (function() {
            function isWsError(msg) {
              if (!msg) return false;
              var str = typeof msg === 'string' ? msg : (msg.message || msg.stack || String(msg));
              return str.indexOf('WebSocket') !== -1 ||
                     str.indexOf('websocket') !== -1 ||
                     str.indexOf('closed without opened') !== -1 ||
                     str.indexOf('failed to connect to websocket') !== -1 ||
                     (str.indexOf('[vite]') !== -1 && str.indexOf('ws') !== -1);
            }

            // Suppress console.error & console.warn for Vite WebSocket disconnection
            var origError = console.error;
            console.error = function() {
              var str = '';
              for (var i = 0; i < arguments.length; i++) {
                var a = arguments[i];
                str += ' ' + (a && (a.message || a.stack || (typeof a === 'object' ? JSON.stringify(a) : String(a))));
              }
              if (isWsError(str)) return;
              origError.apply(console, arguments);
            };

            var origWarn = console.warn;
            console.warn = function() {
              var str = '';
              for (var i = 0; i < arguments.length; i++) {
                var a = arguments[i];
                str += ' ' + (a && (a.message || a.stack || (typeof a === 'object' ? JSON.stringify(a) : String(a))));
              }
              if (isWsError(str)) return;
              origWarn.apply(console, arguments);
            };

            window.addEventListener('unhandledrejection', function(e) {
              if (isWsError(e.reason)) {
                e.preventDefault();
                e.stopImmediatePropagation();
              }
            }, true);

            window.addEventListener('error', function(e) {
              if (isWsError(e.message) || isWsError(e.error)) {
                e.preventDefault();
                e.stopImmediatePropagation();
              }
            }, true);

            // Mock Vite HMR WebSocket so client stays cleanly silent without reconnect loops
            if (typeof window !== 'undefined' && window.WebSocket) {
              var NativeWebSocket = window.WebSocket;
              function MockWebSocket(url, protocols) {
                var isViteHmr = typeof url === 'string' && (
                  url.indexOf('vite') !== -1 ||
                  url.indexOf('localhost') !== -1 ||
                  url.indexOf('3000') !== -1 ||
                  protocols === 'vite-hmr'
                );
                if (isViteHmr) {
                  var listeners = {};
                  var self = {
                    url: url,
                    readyState: 1, // OPEN
                    CONNECTING: 0,
                    OPEN: 1,
                    CLOSING: 2,
                    CLOSED: 3,
                    send: function() {},
                    close: function() {},
                    addEventListener: function(type, fn) {
                      listeners[type] = listeners[type] || [];
                      listeners[type].push(fn);
                    },
                    removeEventListener: function(type, fn) {
                      if (listeners[type]) {
                        listeners[type] = listeners[type].filter(function(cb) { return cb !== fn; });
                      }
                    },
                    dispatchEvent: function(event) {
                      var fns = listeners[event.type] || [];
                      fns.forEach(function(fn) { fn.call(self, event); });
                      return true;
                    },
                    onopen: null,
                    onmessage: null,
                    onerror: null,
                    onclose: null,
                  };
                  setTimeout(function() {
                    var ev = { type: 'open' };
                    if (typeof self.onopen === 'function') self.onopen(ev);
                    self.dispatchEvent(ev);
                  }, 10);
                  return self;
                }
                return new NativeWebSocket(url, protocols);
              }
              MockWebSocket.CONNECTING = 0;
              MockWebSocket.OPEN = 1;
              MockWebSocket.CLOSING = 2;
              MockWebSocket.CLOSED = 3;
              MockWebSocket.prototype = NativeWebSocket.prototype;
              window.WebSocket = MockWebSocket;
            }
          })();
        `,
      },
    ];
  },
});

export default defineConfig(() => {
  return {
    plugins: [suppressHmrWsPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio environment per guidelines.
      hmr: false,
      watch: null,
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      cssCodeSplit: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react/') || id.includes('react-dom/')) {
                return 'vendor-react';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('xlsx')) {
                return 'vendor-excel';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('date-fns')) {
                return 'vendor-date';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
            }
          },
        },
      },
    },
  };
});

