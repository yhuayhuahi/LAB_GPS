import { app } from './app';
import { env } from './config/env';
import { db } from './config/database';
import { runMigrations } from './db/migrate';

async function bootstrap() {
  try {
    console.log('------------------------------------------------------------');
    console.log('📚 INICIALIZANDO SERVIDOR COMERCIAL EDITORIAL QSY');
    console.log(`🌍 Entorno: ${env.NODE_ENV} | Motor DB: ${env.DB_CLIENT}`);
    console.log('------------------------------------------------------------');

    // 1. Ejecutar migraciones automáticas al arrancar
    await runMigrations();

    // 2. Levantar servidor HTTP
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Servidor escuchando en: http://localhost:${env.PORT}`);
      console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`📱 App version: http://localhost:${env.PORT}/api/v1/app-version`);
    });

    // 3. Manejo de apagado elegante (Graceful Shutdown)
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor HTTP...`);
      server.close(async () => {
        console.log('🔒 Cerrando pool de conexiones a base de datos...');
        await db.close();
        console.log('👋 Servidor apagado ordenadamente.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Error crítico durante el arranque del servidor:', err);
    process.exit(1);
  }
}

bootstrap();
