
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Proxy ayarı kaldırıldı çünkü api.php statik bir dosya gibi public klasöründen sunulacak (Prod) 
  // veya yerel PHP sunucusu kullanılacak.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
