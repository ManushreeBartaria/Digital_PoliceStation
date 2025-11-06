# Digital Police Station & Public Safety Management System

A modern web application built with React, TypeScript, and Tailwind CSS that aims to modernize case management, ensure tamper-proof FIR records, and improve accountability in the Indian police system.

## Problem Statement

India's current FIR and police case management system is outdated, paper-based, and vulnerable to manipulation:

- FIRs can be tampered with, lost, or delayed, especially in cases involving influential individuals
- Citizens often face refusal when trying to register FIRs
- Case status updates are slow, non-transparent, and prone to corruption
- Manual record-keeping slows investigations and reduces accountability
- Safety infrastructure (CCTV, hazard reporting) is poorly monitored

This leads to delayed justice, corruption, and loss of citizen trust in law enforcement.

## Our Solution

A Digital Police Station & Public Safety Management System that modernizes case management, ensures tamper-proof FIR records, and improves accountability.

### Key Features

1. **Secure Digital FIR Registration**
   - Officer enters FIR digitally → stored in a tamper-proof system
   - Citizen receives receipt + unique tracking ID (SMS/print)
   - FIR cannot be deleted or altered

2. **Real-Time Case Tracking & Accountability**
   - Case status updated by police → visible to complainant & higher officials
   - System auto-flags long-pending cases to higher authority
   - Instant notification on case closure with dispute option

3. **Complaint Escalation for FIR Refusal**
   - Grievance complaint system for FIR refusal
   - Direct escalation to senior officials with evidence

4. **Smart Case Reference & Search**
   - Digital summaries for instant search and cross-referencing
   - Pattern detection and repeat offender identification

5. **Crime-based CCTV Planning & Maintenance**
   - AI-powered crime hotspot analysis
   - Automated CCTV maintenance tracking

6. **Community Safety Reporting**
   - Hazard reporting system
   - Preventive governance features

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Python (v3.12 or higher)
- pip (latest version)

### Installation

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd IIC2.0
   ```

2. Install Frontend Dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install Backend Dependencies:
   ```bash
   cd ../backend/app
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the Backend Server:
   ```bash
   cd backend/app
   python main.py
   ```
   The FastAPI server will start at http://localhost:8000

2. Start the Frontend Development Server:
   ```bash
   cd frontend
   npm run dev
   ```
   This will start the development server at http://localhost:5173

3. For Frontend Production Build:
   ```bash
   cd frontend
   npm run build
   ```

4. To Preview Frontend Production Build:
   ```bash
   cd frontend
   npm run preview
   ```

### Project Structure

```
IIC2.0/
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx       # Main application component
│   │   └── main.tsx      # Application entry point
│   ├── public/           # Static assets
│   ├── index.html        # HTML template
│   └── package.json      # Frontend dependencies and scripts
│
├── backend/
│   └── app/
│       ├── api/          # API routes and dependencies
│       ├── core/         # Core application logic
│       ├── database/     # Database models and connections
│       ├── models/       # Data models
│       ├── services/     # Business logic services
│       ├── utils/        # Utility functions
│       ├── main.py       # Backend entry point
│       └── requirements.txt  # Python dependencies
```

## Tech Stack

### Frontend
- React 18.x
- TypeScript
- Tailwind CSS
- Vite

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy (ORM)

### Database
- PostgreSQL

