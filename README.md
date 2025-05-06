# Unizo SCM Event Listener

A Node.js service that listens to SCM events via the Unizo API platform. This service allows you to automatically subscribe to and handle repository events for your organization.

## Features

- Subscribe to SCM events (repository, branch, commit events)
- Handle event notifications securely
- Event signature verification
- Health check endpoints
- Rate limiting
- Docker support
- Kubernetes deployment via Helm

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Docker (for containerization)
- Kubernetes cluster (for deployment)
- Helm 3 (for deployment)
- Unizo API key with appropriate permissions

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/unizo/scm-event-listener.git
   cd scm-event-listener
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the required environment variables:
   ```env
   NODE_ENV=development
   PORT=3000
   UNIZO_API_URL=https://api.unizo.ai/api/v1
   UNIZO_API_KEY=your_api_key_here
   UNIZO_AUTH_USER_ID=your_auth_user_id
   INTEGRATION_ID=your_integration_id
   EVENT_SECRET=your_event_secret
   TARGET_ORGANIZATION=your_org_name
   APP_URL=https://your-app-url.com
   ```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000 with hot reloading enabled.

## API Endpoints

### Watch Management

- `POST /api/v1/repositories/:repositoryId/watches` - Register repository watch
- `DELETE /api/v1/watches/:watchId` - Delete watch
- `GET /api/v1/watches` - List watches
- `PUT /api/v1/watches/:watchId` - Update watch configuration
- `POST /api/v1/events` - Event handler

### Health Checks

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with API connectivity status

## Event Types

The service handles the following SCM events:
- `repository:created`
- `repository:renamed`
- `repository:deleted`
- `repository:archived`
- `branch:created`
- `commit:pushed`

## Docker

Build the Docker image:
```bash
docker build -t unizo/scm-event-listener:latest .
```

Run the container:
```bash
docker run -p 3000:3000 --env-file .env unizo/scm-event-listener:latest
```

## Kubernetes Deployment

1. Configure values in `helm/values.yaml`:
   ```yaml
   image:
     repository: unizo/scm-event-listener
     tag: latest

   secrets:
     - name: UNIZO_API_KEY
       key: api-key
       value: "your-api-key"
     - name: UNIZO_AUTH_USER_ID
       key: auth-user-id
       value: "your-auth-user-id"
     - name: INTEGRATION_ID
       key: integration-id
       value: "your-integration-id"
     - name: EVENT_SECRET
       key: event-secret
       value: "your-event-secret"
   ```

2. Install the Helm chart:
   ```bash
   helm install scm-event-listener ./helm
   ```

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| UNIZO_API_URL | Unizo API URL | https://api.unizo.ai/api/v1 |
| UNIZO_API_KEY | Unizo API key | Required |
| UNIZO_AUTH_USER_ID | Unizo Auth User ID | Required |
| INTEGRATION_ID | Integration ID | Required |
| EVENT_SECRET | Secret for event verification | Required |
| TARGET_ORGANIZATION | Organization name | Required |
| APP_URL | Public URL for event callbacks | Required |

## Security

- All endpoints require proper authentication via authuserid header
- Event payloads are verified using SHA-256 signatures
- Rate limiting is enabled by default
- Runs as non-root user in containers
- Uses secure headers with helmet

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.