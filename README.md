# Unizo SCM Repository Webhook Subscriber

A Node.js service that automates webhook registration on customer repositories using Unizo’s SCM API platform.

Resources

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
   ```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000 with hot reloading enabled.

## API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with API connectivity status

## Event Types

The service handles the following SCM events:
- `repository:created`
- `repository:renamed`
- `repository:updated`
- `repository:deleted`
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
   ```

2. Install the Helm chart:
   ```bash
   helm install scm-event-listener ./helm
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
