#!/usr/bin/env python3
"""
Store Provisioning Platform - Start Both Services
Runs backend API and dashboard simultaneously
"""

import subprocess
import sys
import os
import signal
import time
import shutil
from pathlib import Path

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"
DASHBOARD_DIR = PROJECT_ROOT / "dashboard"

# Store process references
backend_process = None
dashboard_process = None


def get_node_command():
    """Return a runnable Node.js command for the current OS."""
    return shutil.which("node") or "node"


def get_npm_command():
    """Return a runnable npm command for the current OS.

    On Windows, npm is typically a .cmd shim which must be invoked explicitly
    (CreateProcess cannot execute .cmd directly without using the shell).
    """
    if os.name == "nt":
        return shutil.which("npm.cmd") or shutil.which("npm") or "npm.cmd"
    return shutil.which("npm") or "npm"


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n\n🛑 Shutting down services...")
    cleanup()
    sys.exit(0)


def cleanup():
    """Stop both processes"""
    global backend_process, dashboard_process
    
    if backend_process:
        print("Stopping backend...")
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
    
    if dashboard_process:
        print("Stopping dashboard...")
        dashboard_process.terminate()
        try:
            dashboard_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            dashboard_process.kill()
    
    print("✅ All services stopped")


def check_dependencies():
    """Check if Node.js and npm are installed"""
    try:
        node_cmd = get_node_command()
        npm_cmd = get_npm_command()
        subprocess.run([node_cmd, "--version"], capture_output=True, check=True)
        subprocess.run([npm_cmd, "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: Node.js and npm must be installed!")
        print("   Download from: https://nodejs.org/")
        return False


def install_dependencies(directory, name):
    """Install npm dependencies if node_modules doesn't exist"""
    node_modules = directory / "node_modules"
    if not node_modules.exists():
        print(f"📦 Installing {name} dependencies...")
        result = subprocess.run(
            [get_npm_command(), "install"],
            cwd=directory,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ Failed to install {name} dependencies:")
            print(result.stderr)
            return False
        print(f"✅ {name} dependencies installed")
    return True


def start_backend():
    """Start the backend API server"""
    global backend_process
    
    if not (BACKEND_DIR / "package.json").exists():
        print(f"❌ Backend not found at {BACKEND_DIR}")
        return False
    
    print("🚀 Starting backend API...")
    print(f"   Directory: {BACKEND_DIR}")
    print(f"   Port: 4000")
    print(f"   URL: http://localhost:4000")
    print()
    
    backend_process = subprocess.Popen(
        [get_npm_command(), "run", "dev"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    return True


def start_dashboard():
    """Start the dashboard"""
    global dashboard_process
    
    if not (DASHBOARD_DIR / "package.json").exists():
        print(f"❌ Dashboard not found at {DASHBOARD_DIR}")
        return False
    
    print("🚀 Starting dashboard...")
    print(f"   Directory: {DASHBOARD_DIR}")
    print(f"   Port: 3000")
    print(f"   URL: http://localhost:3000")
    print()
    
    dashboard_process = subprocess.Popen(
        [get_npm_command(), "run", "dev"],
        cwd=DASHBOARD_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    return True


def print_output(process, prefix):
    """Print output from a process with prefix"""
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"[{prefix}] {line.rstrip()}")
    except Exception as e:
        print(f"[{prefix}] Error reading output: {e}")


def main():
    """Main function"""
    print("=" * 60)
    print("Store Provisioning Platform - Starting Services")
    print("=" * 60)
    print()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check directories exist
    if not BACKEND_DIR.exists():
        print(f"❌ Backend directory not found: {BACKEND_DIR}")
        sys.exit(1)
    
    if not DASHBOARD_DIR.exists():
        print(f"❌ Dashboard directory not found: {DASHBOARD_DIR}")
        sys.exit(1)
    
    # Install dependencies if needed
    if not install_dependencies(BACKEND_DIR, "Backend"):
        sys.exit(1)
    
    if not install_dependencies(DASHBOARD_DIR, "Dashboard"):
        sys.exit(1)
    
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start backend
    if not start_backend():
        sys.exit(1)
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    # Start dashboard
    if not start_dashboard():
        cleanup()
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("✅ Both services are starting...")
    print("=" * 60)
    print()
    print("📍 Access the dashboard at: http://localhost:3000")
    print("📍 API endpoint: http://localhost:4000")
    print("📍 Health check: http://localhost:4000/health")
    print()
    print("Press Ctrl+C to stop all services")
    print("=" * 60)
    print()
    
    # Monitor both processes
    try:
        import threading
        
        # Start threads to print output
        backend_thread = threading.Thread(
            target=print_output,
            args=(backend_process, "BACKEND"),
            daemon=True
        )
        dashboard_thread = threading.Thread(
            target=print_output,
            args=(dashboard_process, "DASHBOARD"),
            daemon=True
        )
        
        backend_thread.start()
        dashboard_thread.start()
        
        # Wait for processes to finish
        while True:
            if backend_process.poll() is not None:
                print("\n❌ Backend process exited unexpectedly")
                cleanup()
                sys.exit(1)
            
            if dashboard_process.poll() is not None:
                print("\n❌ Dashboard process exited unexpectedly")
                cleanup()
                sys.exit(1)
            
            time.sleep(1)
    
    except KeyboardInterrupt:
        signal_handler(None, None)


if __name__ == "__main__":
    main()
