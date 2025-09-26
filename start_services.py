"""
MetroMind Services Startup Script
Starts all microservices in the correct order
"""

from pathlib import Path
import subprocess
import sys
import time
import os
import signal
import threading
import requests
from typing import Dict, List, Set
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from config import print_config_summary, service_config

# Service definitions with dependencies
SERVICES = [
    {
        'name': 'Auth Service',
        'script': 'services/auth_service.py',
        'port': service_config.auth_service_port,
        'essential': True,
        'dependencies': []
    },
    {
        'name': 'Document Service',
        'script': 'services/document_service.py',
        'port': service_config.document_service_port,
        'essential': True,
        'dependencies': ['Auth Service']
    },
    {
        'name': 'OCR Service',
        'script': 'services/ocr_service.py',
        'port': service_config.ocr_service_port,
        'essential': True,
        'dependencies': []
    },
    {
        'name': 'AI/ML Service',
        'script': 'services/ai_ml_service.py',
        'port': service_config.ai_ml_service_port,
        'essential': True,
        'dependencies': []
    },
    {
        'name': 'Search Service',
        'script': 'services/search_service.py',
        'port': service_config.search_service_port,
        'essential': True,
        'dependencies': ['Document Service', 'AI/ML Service']
    },
    {
        'name': 'Task Management Service',
        'script': 'services/task_service.py',
        'port': service_config.model_downloader_port + 1,  # Port 8020
        'essential': True,
        'dependencies': ['Auth Service']
    },
    {
        'name': 'Notification Service',
        'script': 'services/notification_service.py',
        'port': service_config.notification_service_port,
        'essential': True,
        'dependencies': []
    },
    {
        'name': 'Integration Service',
        'script': 'services/integration_service.py',
        'port': service_config.integration_service_port,
        'essential': True,
        'dependencies': []
    },
    {
        'name': 'Analytics Service',
        'script': 'services/analytics_service.py',
        'port': service_config.analytics_service_port,
        'essential': True,
        'dependencies': ['Document Service']
    },
    {
        'name': 'API Gateway Service',
        'script': 'services/api_gateway.py',
        'port': service_config.api_gateway_port,
        'essential': True,
        'dependencies': [
            'Auth Service', 'Document Service', 'OCR Service', 'AI/ML Service', 
            'Search Service', 'Task Management Service', 'Notification Service', 
            'Integration Service', 'Analytics Service', 'Audit & Monitoring Service', 
            'Real-time Communication Service', 'Document Workflow Service'
        ]
    },
    {
        'name': 'Real-time Communication Service',
        'script': 'services/realtime_service.py',
        'port': service_config.realtime_service_port,
        'essential': True,
        'dependencies': ['Auth Service']
    },
    {
        'name': 'Audit & Monitoring Service',
        'script': 'services/audit_service.py',
        'port': service_config.audit_service_port,
        'essential': True,
        'dependencies': ['Auth Service', 'Document Service']
    },
    {
        'name': 'Document Workflow Service',
        'script': 'services/workflow_service.py',
        'port': service_config.workflow_service_port,
        'essential': True,
        'dependencies': ['Document Service', 'Task Management Service']
    },
    {
        'name': 'Backup & Recovery Service',
        'script': 'services/backup_service.py',
        'port': service_config.backup_service_port,
        'essential': False,
        'dependencies': ['Document Service']
    },
    {
        'name': 'Enhanced Security Service',
        'script': 'services/security_service.py',
        'port': service_config.security_service_port,
        'essential': True,
        'dependencies': ['Auth Service', 'Audit & Monitoring Service']
    },
    {
        'name': 'Advanced Reporting Service',
        'script': 'services/reporting_service.py',
        'port': service_config.reporting_service_port,
        'essential': True,
        'dependencies': ['Analytics Service']
    },
    {
        'name': 'RAG Chatbot Service',
        'script': 'services/rag_chatbot_service.py',
        'port': 8028,
        'essential': True,
        'dependencies': ['AI/ML Service', 'Search Service']
    },
    {
        'name': 'Model Downloader Service',
        'script': 'services/model_downloader.py',
        'port': service_config.model_downloader_port,
        'essential': True,
        'dependencies': []
    },
    {
        'name': 'Integration Management Service',
        'script': 'services/integration_management_service.py',
        'port': service_config.integration_management_port,
        'essential': False,
        'dependencies': ['Integration Service']
    }
]

class ServiceManager:
    def __init__(self):
        self.processes = {}
        self.running = True
        self.service_status = {service['name']: 'stopped' for service in SERVICES}

    def check_service_health(self, port):
        """Check if a service is healthy"""
        try:
            response = requests.get(f"http://localhost:{port}/health", timeout=5)
            return response.status_code == 200
        except requests.ConnectionError:
            return False

    def wait_for_service(self, service):
        """Wait for a service to become healthy"""
        logger.info(f"Waiting for {service['name']} to start...")
        for _ in range(30):  # Wait for up to 30 seconds
            if self.check_service_health(service['port']):
                logger.info(f"✅ {service['name']} is healthy.")
                return True
            time.sleep(1)
        logger.error(f"❌ {service['name']} did not become healthy in time.")
        return False

    def start_service(self, service):
        """Start a single service"""
        script_path = project_root / service['script']
        
        if not script_path.exists():
            logger.error(f"Service script not found: {script_path}")
            return None
        
        # Check dependencies
        for dep_name in service.get('dependencies', []):
            if self.service_status.get(dep_name) != 'running':
                logger.error(f"Dependency {dep_name} for {service['name']} is not running. Aborting start.")
                return None

        try:
            logger.info(f"Starting {service['name']} on port {service['port']}...")
            
            # Start the service
            process = subprocess.Popen(
                [sys.executable, str(script_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            self.processes[service['name']] = {
                'process': process,
                'service': service
            }
            
            # Start log monitoring in a separate thread
            log_thread = threading.Thread(
                target=self.monitor_service_logs,
                args=(service['name'], process),
                daemon=True
            )
            log_thread.start()
            
            # Wait for service to become healthy
            if not self.wait_for_service(service):
                logger.error(f"❌ {service['name']} failed to start or become healthy.")
                process.terminate()
                return None

            logger.info(f"✅ {service['name']} started successfully")
            self.service_status[service['name']] = 'running'
            return process
                
        except Exception as e:
            logger.error(f"Failed to start {service['name']}: {e}")
            self.service_status[service['name']] = 'failed'
            return None
    
    def monitor_service_logs(self, service_name, process):
        """Monitor service logs"""
        try:
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[{service_name}] {line.strip()}")
        except:
            pass

    def get_service_order(self):
        """Get the order in which to start services based on dependencies"""
        service_map = {s['name']: s for s in SERVICES}
        sorted_services = []
        visited = set()

        def visit(service_name):
            if service_name in visited:
                return
            visited.add(service_name)
            service = service_map[service_name]
            for dep in service.get('dependencies', []):
                if dep in service_map:
                    visit(dep)
            sorted_services.append(service)

        for service in SERVICES:
            visit(service['name'])
        
        return sorted_services

    def start_all_services(self):
        """Start all services in dependency order"""
        logger.info("🚀 Starting MetroMind Services...")
        print_config_summary()
        
        # Initialize database first
        if not self.init_database():
            return False
        
        # Get service start order
        ordered_services = self.get_service_order()
        
        # Start services in order
        for service in ordered_services:
            if not self.start_service(service):
                if service['essential']:
                    logger.error(f"Essential service {service['name']} failed to start. Stopping...")
                    self.stop_all_services()
                    return False
                else:
                    logger.warning(f"Non-essential service {service['name']} failed to start. Continuing...")
        
        logger.info("🎉 All services started successfully!")
        self.print_status()
        return True
    
    def init_database(self):
        """Initialize database"""
        try:
            logger.info("🗄️ Initializing database...")
            from database import db_manager
            
            # Create tables
            db_manager.create_tables()
            
            # Create admin user
            db_manager.create_admin_user()
            
            logger.info("✅ Database initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            logger.info("Please ensure PostgreSQL is running on the configured port")
            return False
    
    def print_status(self):
        """Print service status"""
        print("\n" + "="*60)
        print("METROMIND SERVICES STATUS")
        print("="*60)
        
        for name, info in self.processes.items():
            process = info['process']
            service = info['service']
            
            if process.poll() is None:
                status = "🟢 RUNNING"
            else:
                status = "🔴 STOPPED"
            
            print(f"{status} {name:<30} Port: {service['port']}")
        
        print("\n📊 Access Points:")
        print(f"• API Gateway Service: http://localhost:{service_config.api_gateway_port}/docs")
        
        print("\n🔑 Default Admin Credentials:")
        print("Username: admin@kmrl.gov.in")
        print("Password: admin123")
        
        print("\n⚠️ Press Ctrl+C to stop all services")
        print("="*60)
    
    def stop_all_services(self):
        """Stop all services"""
        logger.info("🛑 Stopping all services...")
        
        # Stop in reverse order of start
        for name in reversed(list(self.processes.keys())):
            info = self.processes[name]
            process = info['process']
            try:
                logger.info(f"Stopping {name}...")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    logger.warning(f"Force killing {name}...")
                    process.kill()
                
                logger.info(f"✅ {name} stopped")
                self.service_status[name] = 'stopped'
            except Exception as e:
                logger.error(f"Error stopping {name}: {e}")
        
        self.processes.clear()
        logger.info("🎯 All services stopped")
    
    def monitor_services(self):
        """Monitor running services"""
        try:
            while self.running:
                time.sleep(10)
                
                # Check if any essential service has died
                for name, info in list(self.processes.items()):
                    process = info['process']
                    service = info['service']
                    
                    if process.poll() is not None:
                        self.service_status[name] = 'failed'
                        logger.error(f"💀 {name} has died unexpectedly")
                        
                        if service['essential']:
                            logger.error("Essential service died. Shutting down all services.")
                            self.running = False
                            break
                        else:
                            logger.warning(f"Non-essential service {name} died. Other services will continue.")
                        
        except KeyboardInterrupt:
            self.running = False
        except Exception as e:
            logger.error(f"Error in service monitoring: {e}")
            self.running = False

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("Received shutdown signal")
    manager.running = False

def main():
    """Main entry point"""
    global manager
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    manager = ServiceManager()
    
    try:
        # Start all services
        if manager.start_all_services():
            # Monitor services
            manager.monitor_services()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        # Cleanup
        manager.stop_all_services()
        logger.info("👋 MetroMind Services shutdown complete")

if __name__ == "__main__":
    main()
