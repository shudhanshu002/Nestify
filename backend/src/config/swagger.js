import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PG Finder API Documentation',
      version: '1.0.0',
      description: 'Industry-grade API for PG/Hostel/Hotel Platform',
      contact: {
        name: 'Backend Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);