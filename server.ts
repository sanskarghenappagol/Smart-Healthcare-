import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { testConnection } from './server/db/mysql.js';
import { authRouter } from './server/routes/auth.js';
import { patientsRouter } from './server/routes/patients.js';
import { doctorsRouter } from './server/routes/doctors.js';
import { appointmentsRouter } from './server/routes/appointments.js';
import { prescriptionsRouter } from './server/routes/prescriptions.js';
import { medicinesRouter } from './server/routes/medicines.js';
import { billingRouter } from './server/routes/billing.js';
import { mongoRouter } from './server/routes/mongodb.js';
import { dbmsRouter } from './server/routes/dbms.js';
import { statsRouter } from './server/routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDatabaseRunning() {
  const isHealthy = await testConnection();
  if (!isHealthy) {
    console.log('Ensuring MariaDB server daemon is active...');
    try {
      execSync('mkdir -p /run/mysqld /var/lib/mysql 2>/dev/null || true');
      execSync('mariadbd --user=root --datadir=/var/lib/mysql &', { stdio: 'ignore' });
      // Wait for socket
      let attempts = 0;
      while (attempts < 10) {
        await new Promise(r => setTimeout(r, 600));
        if (await testConnection()) {
          console.log('MariaDB connected successfully.');
          return;
        }
        attempts++;
      }
    } catch (e) {
      console.error('Failed to auto-start MariaDB daemon:', e);
    }
  } else {
    console.log('MariaDB connection verified and active.');
  }
}

async function startServer() {
  await ensureDatabaseRunning();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON Body parsing
  app.use(express.json());

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/patients', patientsRouter);
  app.use('/api/doctors', doctorsRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/prescriptions', prescriptionsRouter);
  app.use('/api/medicines', medicinesRouter);
  app.use('/api/bills', billingRouter);
  app.use('/api/mongodb', mongoRouter);
  app.use('/api/dbms', dbmsRouter);
  app.use('/api/stats', statsRouter);

  // Health check endpoint
  app.get('/api/health', async (_req, res) => {
    const dbOk = await testConnection();
    res.json({
      status: 'UP',
      department: 'PES University CSE',
      project: 'Smart Healthcare & Doctor Appointment Management System',
      mysql_connected: dbOk,
      mongodb_collections: ['LabReports', 'PatientReviews', 'AuditLogs'],
      timestamp: new Date().toISOString()
    });
  });

  // Development vs Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PES Healthcare DBMS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
