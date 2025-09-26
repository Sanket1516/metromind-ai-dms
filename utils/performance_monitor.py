"""
MetroMind Performance Monitoring
Real-time performance tracking and optimization tools
"""

import time
import psutil
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from collections import defaultdict, deque
import json
import aiohttp
import redis
from fastapi import FastAPI, Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import structlog

# Performance metrics tracking
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
MEMORY_USAGE = Gauge('memory_usage_bytes', 'Memory usage in bytes')
CPU_USAGE = Gauge('cpu_usage_percent', 'CPU usage percentage')
DOCUMENT_PROCESSING_TIME = Histogram('document_processing_seconds', 'Document processing time')
SEARCH_RESPONSE_TIME = Histogram('search_response_seconds', 'Search response time')

logger = structlog.get_logger()

@dataclass
class PerformanceMetric:
    """Performance metric data structure"""
    timestamp: datetime
    metric_name: str
    value: float
    tags: Dict[str, str]
    service: str

@dataclass
class SystemHealth:
    """System health status"""
    cpu_percent: float
    memory_percent: float
    disk_usage: Dict[str, float]
    network_io: Dict[str, int]
    active_connections: int
    response_time_avg: float
    error_rate: float

class PerformanceMonitor:
    """Advanced performance monitoring and analytics"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=1)
        self.metrics_history = defaultdict(lambda: deque(maxlen=1000))
        self.alert_thresholds = {
            'cpu_usage': 80.0,
            'memory_usage': 85.0,
            'response_time': 2.0,
            'error_rate': 5.0,
            'disk_usage': 90.0
        }
        self.start_time = time.time()
        
    async def collect_system_metrics(self) -> SystemHealth:
        """Collect comprehensive system performance metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk_usage = {}
            for partition in psutil.disk_partitions():
                try:
                    partition_usage = psutil.disk_usage(partition.mountpoint)
                    disk_usage[partition.device] = partition_usage.percent
                except PermissionError:
                    continue
            
            # Network I/O
            network_io = psutil.net_io_counters()._asdict()
            
            # Active connections (approximate)
            connections = len(psutil.net_connections())
            
            # Calculate average response time from Redis
            response_times = await self._get_recent_response_times()
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            # Calculate error rate
            error_rate = await self._calculate_error_rate()
            
            health = SystemHealth(
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                disk_usage=disk_usage,
                network_io=network_io,
                active_connections=connections,
                response_time_avg=avg_response_time,
                error_rate=error_rate
            )
            
            # Update Prometheus metrics
            CPU_USAGE.set(cpu_percent)
            MEMORY_USAGE.set(memory.used)
            ACTIVE_CONNECTIONS.set(connections)
            
            # Store in Redis for historical tracking
            await self._store_metrics(health)
            
            # Check for alerts
            await self._check_alert_thresholds(health)
            
            return health
            
        except Exception as e:
            logger.error("Error collecting system metrics", error=str(e))
            return None
    
    async def _get_recent_response_times(self) -> List[float]:
        """Get recent response times from Redis"""
        try:
            key = "performance:response_times"
            times_data = await self.redis_client.lrange(key, 0, 100)
            return [float(t) for t in times_data if t]
        except Exception:
            return []
    
    async def _calculate_error_rate(self) -> float:
        """Calculate current error rate percentage"""
        try:
            total_key = "performance:requests_total"
            error_key = "performance:requests_errors"
            
            total_requests = await self.redis_client.get(total_key) or 0
            error_requests = await self.redis_client.get(error_key) or 0
            
            total_requests = int(total_requests)
            error_requests = int(error_requests)
            
            if total_requests == 0:
                return 0.0
            
            return (error_requests / total_requests) * 100
        except Exception:
            return 0.0
    
    async def _store_metrics(self, health: SystemHealth):
        """Store metrics in Redis for historical analysis"""
        try:
            timestamp = datetime.utcnow().isoformat()
            metrics_data = {
                'timestamp': timestamp,
                'cpu_percent': health.cpu_percent,
                'memory_percent': health.memory_percent,
                'active_connections': health.active_connections,
                'response_time_avg': health.response_time_avg,
                'error_rate': health.error_rate
            }
            
            # Store latest metrics
            await self.redis_client.setex(
                "performance:latest",
                3600,  # 1 hour expiry
                json.dumps(metrics_data)
            )
            
            # Store in time series
            await self.redis_client.lpush(
                "performance:history",
                json.dumps(metrics_data)
            )
            
            # Keep only last 24 hours of data
            await self.redis_client.ltrim("performance:history", 0, 1440)  # 24 hours in minutes
            
        except Exception as e:
            logger.error("Error storing metrics", error=str(e))
    
    async def _check_alert_thresholds(self, health: SystemHealth):
        """Check if any metrics exceed alert thresholds"""
        alerts = []
        
        if health.cpu_percent > self.alert_thresholds['cpu_usage']:
            alerts.append({
                'type': 'CPU_HIGH',
                'value': health.cpu_percent,
                'threshold': self.alert_thresholds['cpu_usage'],
                'severity': 'warning' if health.cpu_percent < 90 else 'critical'
            })
        
        if health.memory_percent > self.alert_thresholds['memory_usage']:
            alerts.append({
                'type': 'MEMORY_HIGH',
                'value': health.memory_percent,
                'threshold': self.alert_thresholds['memory_usage'],
                'severity': 'warning' if health.memory_percent < 95 else 'critical'
            })
        
        if health.response_time_avg > self.alert_thresholds['response_time']:
            alerts.append({
                'type': 'RESPONSE_TIME_HIGH',
                'value': health.response_time_avg,
                'threshold': self.alert_thresholds['response_time'],
                'severity': 'warning'
            })
        
        if health.error_rate > self.alert_thresholds['error_rate']:
            alerts.append({
                'type': 'ERROR_RATE_HIGH',
                'value': health.error_rate,
                'threshold': self.alert_thresholds['error_rate'],
                'severity': 'critical'
            })
        
        for device, usage in health.disk_usage.items():
            if usage > self.alert_thresholds['disk_usage']:
                alerts.append({
                    'type': 'DISK_USAGE_HIGH',
                    'device': device,
                    'value': usage,
                    'threshold': self.alert_thresholds['disk_usage'],
                    'severity': 'warning' if usage < 95 else 'critical'
                })
        
        if alerts:
            await self._send_alerts(alerts)
    
    async def _send_alerts(self, alerts: List[Dict]):
        """Send performance alerts"""
        try:
            for alert in alerts:
                # Store alert in Redis
                alert_data = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'alert': alert
                }
                
                await self.redis_client.lpush(
                    "performance:alerts",
                    json.dumps(alert_data)
                )
                
                # Keep only last 100 alerts
                await self.redis_client.ltrim("performance:alerts", 0, 99)
                
                # Log alert
                logger.warning(
                    "Performance alert triggered",
                    alert_type=alert['type'],
                    value=alert['value'],
                    threshold=alert.get('threshold'),
                    severity=alert['severity']
                )
                
        except Exception as e:
            logger.error("Error sending alerts", error=str(e))
    
    async def get_performance_report(self, hours: int = 24) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        try:
            # Get historical data
            history_data = await self.redis_client.lrange("performance:history", 0, hours * 60)
            
            metrics = []
            for data in history_data:
                try:
                    metrics.append(json.loads(data))
                except json.JSONDecodeError:
                    continue
            
            if not metrics:
                return {"error": "No performance data available"}
            
            # Calculate aggregated statistics
            cpu_values = [m['cpu_percent'] for m in metrics]
            memory_values = [m['memory_percent'] for m in metrics]
            response_times = [m['response_time_avg'] for m in metrics]
            error_rates = [m['error_rate'] for m in metrics]
            
            report = {
                'period': f"Last {hours} hours",
                'total_data_points': len(metrics),
                'cpu_usage': {
                    'average': sum(cpu_values) / len(cpu_values),
                    'max': max(cpu_values),
                    'min': min(cpu_values),
                    'current': cpu_values[0] if cpu_values else 0
                },
                'memory_usage': {
                    'average': sum(memory_values) / len(memory_values),
                    'max': max(memory_values),
                    'min': min(memory_values),
                    'current': memory_values[0] if memory_values else 0
                },
                'response_time': {
                    'average': sum(response_times) / len(response_times),
                    'max': max(response_times),
                    'min': min(response_times),
                    'current': response_times[0] if response_times else 0
                },
                'error_rate': {
                    'average': sum(error_rates) / len(error_rates),
                    'max': max(error_rates),
                    'min': min(error_rates),
                    'current': error_rates[0] if error_rates else 0
                },
                'uptime_seconds': time.time() - self.start_time,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Get recent alerts
            alerts_data = await self.redis_client.lrange("performance:alerts", 0, 10)
            recent_alerts = []
            for alert_data in alerts_data:
                try:
                    recent_alerts.append(json.loads(alert_data))
                except json.JSONDecodeError:
                    continue
            
            report['recent_alerts'] = recent_alerts
            
            return report
            
        except Exception as e:
            logger.error("Error generating performance report", error=str(e))
            return {"error": f"Failed to generate report: {str(e)}"}

class PerformanceMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for request performance tracking"""
    
    def __init__(self, app: FastAPI, monitor: PerformanceMonitor):
        super().__init__(app)
        self.monitor = monitor
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Track request
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status="in_progress"
        ).inc()
        
        try:
            response = await call_next(request)
            
            # Calculate response time
            process_time = time.time() - start_time
            
            # Update metrics
            REQUEST_DURATION.observe(process_time)
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status=str(response.status_code)
            ).inc()
            
            # Store response time in Redis
            try:
                await self.monitor.redis_client.lpush(
                    "performance:response_times",
                    str(process_time)
                )
                await self.monitor.redis_client.ltrim(
                    "performance:response_times", 0, 1000
                )
                
                # Update request counters
                await self.monitor.redis_client.incr("performance:requests_total")
                if response.status_code >= 400:
                    await self.monitor.redis_client.incr("performance:requests_errors")
                
            except Exception as e:
                logger.error("Error storing performance data", error=str(e))
            
            # Add performance headers
            response.headers["X-Process-Time"] = str(process_time)
            response.headers["X-Request-ID"] = f"{int(start_time * 1000)}"
            
            return response
            
        except Exception as e:
            # Track error
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status="error"
            ).inc()
            
            await self.monitor.redis_client.incr("performance:requests_errors")
            
            logger.error("Request processing error", error=str(e))
            raise

# Performance optimization utilities
class CacheManager:
    """Advanced caching for performance optimization"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_ttl = 3600  # 1 hour
    
    async def get_or_set(self, key: str, factory_func, ttl: Optional[int] = None):
        """Get from cache or set using factory function"""
        try:
            # Try to get from cache
            cached_value = await self.redis.get(key)
            if cached_value:
                try:
                    return json.loads(cached_value)
                except json.JSONDecodeError:
                    return cached_value
            
            # Generate new value
            new_value = await factory_func() if asyncio.iscoroutinefunction(factory_func) else factory_func()
            
            # Store in cache
            cache_ttl = ttl or self.default_ttl
            if isinstance(new_value, (dict, list)):
                await self.redis.setex(key, cache_ttl, json.dumps(new_value))
            else:
                await self.redis.setex(key, cache_ttl, str(new_value))
            
            return new_value
            
        except Exception as e:
            logger.error("Cache operation failed", key=key, error=str(e))
            # Fallback to direct execution
            return await factory_func() if asyncio.iscoroutinefunction(factory_func) else factory_func()
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate cache keys matching pattern"""
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
                logger.info("Cache invalidated", pattern=pattern, keys_count=len(keys))
        except Exception as e:
            logger.error("Cache invalidation failed", pattern=pattern, error=str(e))

# Initialize global performance monitor
performance_monitor = PerformanceMonitor()
cache_manager = CacheManager(performance_monitor.redis_client)