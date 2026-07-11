# Customer Intelligence Dashboard

A corporate-level, production-ready dashboard for customer churn prediction and segmentation analysis.

## Features

- **Executive Overview**: Real-time KPIs and metrics
- **Risk Analyzer**: Predict customer churn probability
- **Segment Intelligence**: Customer segmentation insights
- **Technical Insights**: Feature importance and cluster distribution
- **Corporate Design**: Dark luxury theme with gold accents

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v4
- Recharts (data visualization)
- Framer Motion (animations)
- Axios (API client)

## Setup

1. Install dependencies:
\`\`\`bash
cd dashboard
npm install
\`\`\`

2. Make sure the FastAPI backend is running on `http://localhost:8000`

3. Start the dashboard:
\`\`\`bash
npm run dev
\`\`\`

4. Open `http://localhost:3000` in your browser

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

## API Endpoints Used

- `GET /health` - Health check
- `GET /metrics` - Global metrics
- `POST /predict` - Churn prediction
- `GET /segments` - Segment analysis
- `GET /feature-importance` - Feature importance
- `GET /cluster-distribution` - Cluster distribution
