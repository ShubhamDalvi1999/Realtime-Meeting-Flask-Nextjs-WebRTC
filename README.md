# Meeting App - WebRTC Based Video Conferencing 🎥

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Enabled-326CE5.svg)](https://kubernetes.io/)

A modern, full-stack video conferencing application built with microservices architecture, enabling seamless real-time communication through WebRTC technology. Perfect for remote meetings, online education, and virtual collaboration.

## ✨ Key Features

- **Real-time Communication**
  - High-quality video and audio calls using WebRTC
  - Screen sharing capabilities
  - Support for multiple participants
  - Meeting codes for easy room access

- **Collaboration Tools**
  - Interactive whiteboard with multiple colors and tools
  - Real-time chat messaging
  - File sharing capabilities
  - Meeting recording (coming soon)

- **Technical Highlights**
  - Microservices architecture
  - Containerized deployment
  - Kubernetes orchestration
  - Scalable and fault-tolerant design

## 🛠️ Tech Stack

### Frontend
- **Next.js + React**: For a modern, SSR-capable UI
- **TypeScript**: For type-safe code
- **WebRTC**: For real-time communication
- **Material-UI**: For responsive design

### Backend
- **Flask API Service**: 
  - User management
  - Meeting coordination
  - Business logic
- **Node.js WebSocket Service**:
  - Real-time communication
  - WebRTC signaling
  - Chat functionality

### Infrastructure
- **PostgreSQL**: Primary database
- **Redis**: Caching and real-time features
- **Docker**: Containerization
- **Kubernetes**: Container orchestration

## 📁 Project Structure

```
.
├── frontend/                 # Next.js frontend application
│   ├── src/                 # Source code
│   ├── public/             # Static assets
│   └── tests/              # Frontend tests
├── backend/
│   ├── flask-service/      # Flask REST API service
│   │   ├── app/           # Application code
│   │   ├── tests/        # Backend tests
│   │   └── config/       # Configuration files
│   └── node-service/      # Node.js WebSocket service
│       ├── src/          # Source code
│       └── tests/        # WebSocket tests
├── k8s/                    # Kubernetes configuration
│   └── config/
│       └── development/   # Development environment
├── scripts/                # Utility scripts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Docker Desktop with Kubernetes enabled
- PowerShell (Windows) or Terminal (Unix)
- kubectl CLI tool
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start (Using Docker & Kubernetes)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meeting-app
   ```

2. **Deploy using script** (requires admin privileges)
   ```powershell
   # Windows (PowerShell as Administrator)
   .\scripts\deploy-meeting-app.ps1
   ```

3. **Access the application**
   - Web App: http://meeting-app.local:30000
   - API Docs: http://api.meeting-app.local:30963/docs
   - WebSocket: ws://ws.meeting-app.local:30283

### Local Development Setup

1. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Flask Backend Setup**
   ```bash
   cd backend/flask-service
   python -m venv venv
   source venv/bin/activate  # Unix
   # or
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   python run.py
   ```

3. **Node.js Backend Setup**
   ```bash
   cd backend/node-service
   npm install
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create the following `.env` files:

1. **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_WS_URL=ws://localhost:8080
   ```

2. **Flask Backend** (`backend/flask-service/.env`):
   ```env
   FLASK_ENV=development
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   REDIS_URL=redis://localhost:6379
   ```

3. **Node Backend** (`backend/node-service/.env`):
   ```env
   NODE_ENV=development
   REDIS_URL=redis://localhost:6379
   ```

## 🛡️ Security

- End-to-end encryption for video/audio
- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- Regular security updates

## 🔍 Troubleshooting

### Common Issues

1. **Pods not starting:**
   ```bash
   kubectl get pods -n meeting-app
   kubectl describe pod <pod-name> -n meeting-app
   ```

2. **Service connectivity:**
   ```bash
   kubectl get svc -n meeting-app
   kubectl get ingress -n meeting-app
   ```

3. **Database issues:**
   ```bash
   kubectl logs -n meeting-app <postgres-pod-name>
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Documentation

- [System Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Development Guide](docs/development.md)
- [Deployment Guide](docs/deployment.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

For support, email support@meeting-app.com or join our [Discord community](https://discord.gg/meeting-app).

---

Made with ❤️ by the Meeting App Team 