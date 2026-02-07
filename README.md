# Store Provisioning Platform

A comprehensive platform for provisioning Medusa e-commerce stores on Kubernetes.

## 🏗️ Architecture

- **Dashboard**: React + TypeScript + TailwindCSS (Premium UI) - Port 3000
- **Platform API**: Node.js + Express + Prisma (PostgreSQL) - Port 4000
- **Provisioning Engine**: Background worker (embedded in API) handling K8s reconciliation
- **Database**: PostgreSQL (Stores & Events)
- **Infrastructure**: Kubernetes (Helm Charts)

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18+) & **npm**
2.  **Python 3** (for orchestration)
3.  **PostgreSQL** running locally (Port 5432, user: `postgres`, pass: `postgres`, db: `store_provisioning`)
4.  **Kubernetes Cluster** (k3d, kind, or minikube) accessible via `kubectl`
5.  **Helm** installed

### 🛠️ Setup & Run

1.  **Initialize Database**:
    Make sure your Postgres is running.
    ```bash
    # Create the database if it doesn't exist
    createdb store_provisioning
    ```

2.  **Run the Platform**:
    The `app.py` script will install dependencies and start both the Backend and Dashboard.
    ```bash
    python app.py
    ```

3.  **Access the Dashboard**:
    Open [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Flow

1.  Go to **Create Store**.
2.  Select **Medusa** engine and **Starter** template.
3.  Click **Create Store**.
4.  You will be redirected to the Store Detail page.
5.  Observe the status change: `REQUESTED` -> `PROVISIONING` -> `READY`.
    - *Note: If you don't have a real K8s cluster, it might fail or stay in provisioning if Helm commands fail.*
6.  Once `READY`, click **Open Storefront** (requires `*.localhost.nip.io` to work, which resolves to 127.0.0.1 automatically).

## 📁 Project Structure

- `app.py`: Orchestration script
- `backend/`: Platform API & Provisioning Engine
- `dashboard/`: React Frontend
- `charts/`: Helm charts for store deployment

## 🔧 Troubleshooting

- **Database Errors**: Check `backend/.env` and ensure your local Postgres credentials match.
- **K8s Errors**: Ensure `kubectl get nodes` works in your terminal.
- **Port Conflicts**: Ensure ports 3000 and 4000 are free.
