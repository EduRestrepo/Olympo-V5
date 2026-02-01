# OLYMPO - Organizational Analytics Platform
**Version 5.1 - Advanced Analytics Edition**

![Privacy First](https://img.shields.io/badge/Privacy-First-green)
![Metadata Only](https://img.shields.io/badge/Analysis-Metadata%20Only-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![Scalability](https://img.shields.io/badge/Scalability-5000%2B%20Users-orange)

## 🎯 Overview

**OLYMPO** is a privacy-first organizational analytics platform that reveals influence patterns and communication dynamics within your organization using **only metadata** from Microsoft 365 (Exchange & Teams).

### Core Features (V5.0)

- 📊 **Influence Scoring** - Unified algorithm combining Email and Teams interactions
- 👥 **Top Influencers Dashboard** - Ranked list with badges, metrics, and response times
- 🕸️ **Network Graph Analyzer** - Interactive D3.js visualization with multiple view modes
- ⚡ **Electric Energy Particles** - Dynamic flow visualization on network connections
- 📈 **Power Balance** - Treemap showing influence distribution by role
- 🎯 **Radar Profiles** - 5-dimensional analysis (Connectivity, Speed, Volume, Teams Impact, Leadership)
- 🔒 **Privacy-First** - Zero content analysis, metadata only

### 🆕 Advanced Analytics (V5.1)

**⏰ Temporal Analysis**
- Activity heatmaps by hour/day
- Overload detection (burnout risk)
- Response time analysis by department
- Timezone collaboration patterns

**👥 Community Detection**
- Louvain clustering algorithm
- Organizational silo identification
- Bridge connector detection
- Network diversity metrics

**📞 Meeting Analysis**
- Efficiency scoring
- Cost analysis (hours × participants)
- Attendance pattern detection
- Automated recommendations

**🔮 Predictive Intelligence**
- Churn risk prediction
- Burnout indicators
- Isolation alerts
- Collaboration forecasting

**📈 Benchmarking & Export**
- Department comparisons
- Temporal snapshots
- Rankings (Top 20 in multiple categories)
- CSV export for all data types

**🚀 Scalability Features**
- Batch processing for 5,000+ users
- Active Directory group filtering
- Extraction scope management
- Progress tracking for large jobs

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- PHP 8.2 (Slim Framework)
- PostgreSQL 15
- Microsoft Graph API integration

**Frontend:**
- React 18 + Vite
- D3.js for network visualization
- Recharts for analytics
- Lucide React icons

**Infrastructure:**
- Docker Compose
- Nginx reverse proxy
- Multi-stage builds for optimization

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Microsoft 365 tenant with admin access
- Azure AD App Registration (for Graph API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Olympo-V4.git
   cd Olympo-V4
   ```

2. **Configure environment variables**
   
   Create `.env` file in the root:
   ```env
   # Microsoft Graph API
   TENANT_ID=your-tenant-id
   CLIENT_ID=your-client-id
   CLIENT_SECRET=your-client-secret
   
   # Database
   POSTGRES_DB=olympus_db
   POSTGRES_USER=olympus_user
   POSTGRES_PASSWORD=your-secure-password
   
   # Application
   APP_ENV=production
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the dashboard**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8080`

5. **Initial data ingestion**
   - Navigate to Settings → Seed Database
   - Click "Iniciar Extracción" to start Microsoft 365 data ingestion

---

## 📊 Features Deep Dive

### 1. Influence Scoring Algorithm

The platform calculates a unified influence score combining:

**Email Metrics (Weight: 0.6)**
- Sent volume
- Received volume
- Unique contacts

**Teams Metrics (Weight: 0.4)**
- Calls organized
- Calls participated
- Call duration

**Formula:**
```
Score = (EmailScore × 0.6) + (TeamsScore × 0.4)
```

### 2. Badge System

Dynamic badge assignment based on global ranking:

| Badge | Name | Criteria |
|-------|------|----------|
| ♚ | Rey/Reina (Formales) | #1 absolute |
| ♛ | Estratega | #2 and #3 |
| ♜ | Conector | Top 10 (#4-#10) |
| ♗ | Guía | Top 15% |
| ♞ | Explorador | Top 30% |
| ♙ | Colaborador | Rest of organization |

### 3. Network Graph Modes

- **Roles** - Color by badge/influence level
- **Silos** - Color by department (detects organizational silos)
- **Países** - Color by geographic location
- **Oposición** - Color by escalation score (conflict detection)

### 4. Interactive Features

- **Path Analysis** - Shift+Click two nodes to see influence path
- **Simulation Mode** - Remove nodes to simulate organizational impact
- **Zoom & Pan** - Explore large networks easily
- **Electric Particles** - Visual representation of information flow

---

## 🔧 Configuration

### Settings Panel

Access via the Settings icon in the dashboard:

- **Allowed Domains** - Filter users by email domain
- **Excluded Users** - Remove specific users from analysis
- **Data Refresh** - Re-calculate metrics and re-ingest data

### Database Seeding

The platform automatically:
1. Fetches users from Microsoft Graph API
2. Retrieves email metadata (last 30 days)
3. Retrieves Teams call records (last 30 days)
4. Calculates interactions and influence scores
5. Assigns badges dynamically
6. Detects communities and silos

---

## 📁 Project Structure

```
Olympo/
├── backend/
│   ├── src/
│   │   ├── Controllers/
│   │   │   ├── AnalyticsController.php    # NEW: 30+ analytics endpoints
│   │   │   └── ...
│   │   ├── Services/
│   │   │   ├── TemporalAnalysisService.php       # NEW
│   │   │   ├── CommunityDetectionService.php     # NEW
│   │   │   ├── MeetingAnalysisService.php        # NEW
│   │   │   ├── PredictiveAnalyticsService.php    # NEW
│   │   │   ├── BenchmarkingService.php           # NEW
│   │   │   ├── BatchProcessingService.php        # NEW
│   │   │   ├── ADGroupService.php                # NEW
│   │   │   ├── ExportService.php                 # NEW
│   │   │   ├── GamificationService.php           # NEW
│   │   │   └── ...
│   │   ├── Db/
│   │   │   ├── migrations_v5.1.sql        # NEW: 35+ tables
│   │   │   └── ...
│   │   └── routes/
│   │       └── routes.php                 # Updated with analytics routes
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── shared/                    # NEW
│   │   │   │   ├── TabContainer.jsx
│   │   │   │   ├── LoadingStates.jsx
│   │   │   │   └── EmptyStates.jsx
│   │   │   ├── tabs/                      # NEW
│   │   │   │   ├── TemporalTab.jsx
│   │   │   │   ├── CommunitiesTab.jsx
│   │   │   │   ├── MeetingsTab.jsx
│   │   │   │   ├── IntelligenceTab.jsx
│   │   │   │   └── BenchmarksTab.jsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── analyticsApi.js            # NEW: Analytics API layer
│   │   └── App.jsx                        # Updated with tabs
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── Fundamentos_Conceptuales.MD
```

---

## 🔐 Privacy & Security

### Privacy-First Design

- ✅ **Metadata Only** - No email content or message bodies analyzed
- ✅ **Aggregated Data** - Individual messages never stored
- ✅ **Configurable Exclusions** - Remove sensitive users/domains
- ✅ **No External Services** - All processing happens in your infrastructure

### Data Collected

**Email Metadata:**
- Sender/Recipient addresses
- Timestamp
- Message count (volume)

**Teams Metadata:**
- Call organizer/participants
- Call duration
- Call timestamp

**NOT Collected:**
- Email subject lines
- Email body content
- Attachment contents
- Chat messages
- Meeting notes

---

## 🛠️ Development

### Local Development Setup

**Backend:**
```bash
cd backend
composer install
php -S localhost:8080 -t public
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
composer test

# Frontend tests
cd frontend
npm test
```

---

## 📈 What's New in V5.1 - Advanced Analytics

### 🎨 Tabbed Interface
The dashboard now features **6 organized tabs** for better navigation:
1. **📊 Dashboard** - Overview with influence graph and top metrics
2. **⏰ Temporal** - Time-based patterns and overload detection
3. **👥 Comunidades** - Community detection and silo analysis
4. **📞 Reuniones** - Meeting efficiency and cost optimization
5. **🔮 Inteligencia** - Predictive analytics and risk alerts
6. **📈 Benchmarks** - Comparisons, rankings, and data export

### ⏰ Temporal Analysis Features
- **Activity Heatmap**: Visualize communication patterns by hour and day
- **Overload Detection**: Identify users at risk of burnout (40+ meeting hours/week, 200+ emails)
- **Response Time Analysis**: Compare average response times across departments
- **Timezone Collaboration**: Detect cross-timezone collaboration patterns

### 👥 Community Detection
- **Louvain Clustering**: Automatic community detection using graph algorithms
- **Silo Identification**: Find departments with low external communication
- **Bridge Connectors**: Identify key people connecting different communities
- **Diversity Metrics**: Measure network diversity across departments and locations

### 📞 Meeting Analysis
- **Efficiency Scoring**: Rate meetings based on duration, participants, and frequency
- **Cost Calculation**: Compute meeting costs as (hours × participants)
- **Attendance Patterns**: Identify recurring meeting patterns and attendance rates
- **Smart Recommendations**: Automated suggestions for meeting optimization

### 🔮 Predictive Intelligence
- **Churn Risk**: Detect users with declining communication patterns
- **Burnout Indicators**: Multi-factor analysis (overtime, email volume, meeting load)
- **Isolation Alerts**: Find users with below-threshold network connectivity
- **Trend Forecasting**: Predict collaboration trends based on historical data

### 📈 Benchmarking & Rankings
- **Department Comparison**: Compare metrics across organizational units
- **Temporal Snapshots**: Track evolution of metrics over time
- **Top 20 Rankings**: 
  - Top Collaborators
  - Most Connected
  - Fastest Responders
  - Meeting Organizers
  - Bridge Connectors
- **CSV Export**: Download any dataset for external analysis

### 🚀 Scalability Enhancements
- **Batch Processing**: Handle 5,000+ users with chunked processing (100 users/batch)
- **AD Group Filtering**: Extract data for specific organizational units
- **Extraction Scopes**: Define custom filters (all users, by group, by department, custom)
- **Progress Tracking**: Real-time monitoring of large extraction jobs
- **Job Management**: Create, monitor, and cancel batch jobs

### 🏗️ New Backend Services
- `TemporalAnalysisService` - Time-based pattern analysis
- `CommunityDetectionService` - Graph clustering and silo detection
- `MeetingAnalysisService` - Meeting efficiency and cost analysis
- `PredictiveAnalyticsService` - Risk prediction and forecasting
- `BenchmarkingService` - Comparative analytics
- `BatchProcessingService` - Large-scale data processing
- `ADGroupService` - Active Directory integration
- `ExportService` - Data export functionality
- `GamificationService` - Badge and achievement system

### 🎨 New Frontend Components
- `TabContainer` - Reusable tab navigation
- `LoadingStates` - Spinner, skeleton loaders, overlays
- `EmptyStates` - Informative empty/error states
- 5 new tab components with 20 total views
- `analyticsApi.js` - Comprehensive API service layer

### 📊 New Database Tables (35+)
- Temporal analysis tables
- Community detection tables
- Meeting analysis tables
- Predictive analytics tables
- Benchmarking tables
- Batch processing tables
- Gamification tables

---

## 📈 Recent Updates (v5.0)

### Network Graph Enhancements
- ⚡ Electric energy spheres with vibrant blue gradients
- 🎯 Fixed particle diameter with brightness flicker effect
- 🛡️ Buffer zones - particles stop before node centers
- 📖 Comprehensive legend explaining all graph elements
- 📊 Radar chart explanation in legend

### UI Improvements
- 🏷️ Badge names displayed alongside symbols in Top Influencers
- 🎭 Animations apply only to badge icons, not text
- 🔒 Privacy-First disclaimer moved to dashboard top
- 📋 Enhanced tooltips and explanations

### Bug Fixes
- ✅ Fixed "Unknown" role display (source data limitation documented)
- ✅ Fixed average response time calculation
- ✅ Fixed domain filter causing "No results" issue
- ✅ Improved data persistence and metric calculations

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

## 🙏 Acknowledgments

- Microsoft Graph API for metadata access
- D3.js community for visualization tools
- React ecosystem for modern UI development

---

**Built with ❤️ for organizational transparency and privacy**
