# KnowledgePlane AI Backend

This repository contains the backend code for the KnowledgePlane AI application, which serves as the server-side component of the adaptive organization fabric.

## Getting Started

To get started with the backend development, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/knowledgeplane-backend.git
   cd knowledgeplane-backend
   ```

2. **Install Dependencies**
   Make sure you have Node.js installed. Then run:
   ```bash
   npm install
   ```

3. **Configuration**
   Update the configuration settings in `src/config/index.ts` to match your environment, including database connection strings and any necessary environment variables.

4. **Database Setup**
   Run the initial migration to set up the database:
   ```bash
   npm run migrate
   ```

5. **Running the Application**
   You can start the server using:
   ```bash
   npm start
   ```

## Docker Setup

To run the backend using Docker, follow these steps:

1. **Build the Docker Image**
   ```bash
   docker build -t knowledgeplane-backend .
   ```

2. **Run the Docker Container**
   ```bash
   docker run -p 3000:3000 knowledgeplane-backend
   ```

Alternatively, you can use Docker Compose to run the application along with any dependencies defined in `docker-compose.yml`:
```bash
docker-compose up
```

## Directory Structure

- `src/`: Contains the source code for the backend application.
  - `api/`: Contains the API logic, including controllers, middleware, routes, and services.
  - `config/`: Configuration settings for the application.
  - `db/`: Database models and migration scripts.
  - `utils/`: Utility functions, such as logging.
  - `server.ts`: Entry point for the application.

## Testing

To run tests, use:
```bash
npm test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.