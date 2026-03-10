
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Proxy ayarı kaldırıldı çünkü api.php statik bir dosya gibi public klasöründen sunulacak (Prod) 
  // veya yerel PHP sunucusu kullanılacak.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
