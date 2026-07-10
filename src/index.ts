import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './data-source';
import { RegisterRoutes } from './generated/routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Swagger UI
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/swagger.json' },
  })
);

// Serve swagger.json
app.get('/swagger.json', (_req, res) => {
  res.sendFile(require.resolve('./generated/swagger.json'));
});

// Register TSOA routes
RegisterRoutes(app);

app.get('/', (req, res) => {
  res.send('eInvoice Backend API is running. View docs at /docs');
});

// Error handling middleware should be last
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => console.log('Database connection error: ', error));
