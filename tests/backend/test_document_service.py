"""
MetroMind Backend Tests - Document Service
Comprehensive testing for document upload, processing, and management
"""

import pytest
import asyncio
import tempfile
import os
from fastapi.testclient import TestClient
from fastapi import UploadFile
from io import BytesIO
from unittest.mock import Mock, patch, AsyncMock

# Import the services to test
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.document_service import app as document_app
from services.auth_service import app as auth_app
from database import get_db_connection

# Test client setup
document_client = TestClient(document_app)
auth_client = TestClient(auth_app)

class TestDocumentService:
    """Test suite for document service functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Set up test environment before each test"""
        self.test_user_id = "test_user_123"
        self.test_token = "test_token_456"
        self.sample_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        self.sample_doc_content = b"Sample document content for testing"
        
    def create_test_file(self, filename: str, content: bytes, content_type: str):
        """Helper to create test upload files"""
        return {
            'file': (filename, BytesIO(content), content_type)
        }
    
    def test_health_check(self):
        """Test document service health endpoint"""
        response = document_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "timestamp" in data
    
    def test_document_upload_success(self):
        """Test successful document upload"""
        test_file = self.create_test_file(
            "test_document.pdf", 
            self.sample_pdf_content, 
            "application/pdf"
        )
        
        form_data = {
            "title": "Test Document",
            "description": "Test description",
            "category": "general",
            "priority": "medium"
        }
        
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.fetchone.return_value = {"id": 1}
            
            response = document_client.post(
                "/documents/upload",
                files=test_file,
                data=form_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert "document_id" in data
            assert "task_id" in data
    
    def test_document_upload_invalid_file_type(self):
        """Test document upload with invalid file type"""
        test_file = self.create_test_file(
            "test_file.exe", 
            b"executable content", 
            "application/x-executable"
        )
        
        form_data = {
            "title": "Invalid File",
            "description": "Should fail",
            "category": "general",
            "priority": "medium"
        }
        
        response = document_client.post(
            "/documents/upload",
            files=test_file,
            data=form_data
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "file type" in data["error"].lower()
    
    def test_document_upload_missing_required_fields(self):
        """Test document upload with missing required fields"""
        test_file = self.create_test_file(
            "test_document.pdf", 
            self.sample_pdf_content, 
            "application/pdf"
        )
        
        # Missing title
        form_data = {
            "description": "Test description",
            "category": "general"
        }
        
        response = document_client.post(
            "/documents/upload",
            files=test_file,
            data=form_data
        )
        
        assert response.status_code == 400
    
    def test_document_upload_large_file(self):
        """Test document upload with file size limit"""
        # Create a large file (simulate 100MB)
        large_content = b"x" * (100 * 1024 * 1024)
        test_file = self.create_test_file(
            "large_document.pdf", 
            large_content, 
            "application/pdf"
        )
        
        form_data = {
            "title": "Large Document",
            "description": "Test large file",
            "category": "general",
            "priority": "medium"
        }
        
        response = document_client.post(
            "/documents/upload",
            files=test_file,
            data=form_data
        )
        
        # Should fail due to size limit
        assert response.status_code == 413 or response.status_code == 400
    
    def test_list_documents_success(self):
        """Test successful document listing"""
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock document data
            mock_cursor.fetchall.return_value = [
                {
                    "id": 1,
                    "title": "Test Document 1",
                    "description": "Test description 1",
                    "category": "general",
                    "status": "processed",
                    "created_at": "2024-01-01T00:00:00Z",
                    "file_size": 1024,
                    "file_type": "application/pdf"
                },
                {
                    "id": 2,
                    "title": "Test Document 2",
                    "description": "Test description 2",
                    "category": "reports",
                    "status": "processing",
                    "created_at": "2024-01-02T00:00:00Z",
                    "file_size": 2048,
                    "file_type": "application/msword"
                }
            ]
            mock_cursor.fetchone.return_value = {"total": 2}
            
            response = document_client.get("/documents/list")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["documents"]) == 2
            assert data["total"] == 2
            assert data["documents"][0]["title"] == "Test Document 1"
    
    def test_list_documents_with_filters(self):
        """Test document listing with filters"""
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.fetchall.return_value = []
            mock_cursor.fetchone.return_value = {"total": 0}
            
            response = document_client.get(
                "/documents/list",
                params={
                    "category": "reports",
                    "status": "processed",
                    "limit": 10,
                    "offset": 0
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "documents" in data
            assert "total" in data
            
            # Verify filter parameters were used in query
            mock_cursor.execute.assert_called()
            query_call = mock_cursor.execute.call_args[0][0]
            assert "category" in query_call
            assert "status" in query_call
    
    def test_get_document_by_id_success(self):
        """Test retrieving specific document by ID"""
        document_id = 1
        
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            mock_cursor.fetchone.return_value = {
                "id": document_id,
                "title": "Test Document",
                "description": "Test description",
                "category": "general",
                "status": "processed",
                "created_at": "2024-01-01T00:00:00Z",
                "file_path": "/tmp/test_document.pdf",
                "file_size": 1024,
                "file_type": "application/pdf",
                "processing_result": {"extracted_text": "Sample text"}
            }
            
            response = document_client.get(f"/documents/{document_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == document_id
            assert data["title"] == "Test Document"
            assert "processing_result" in data
    
    def test_get_document_by_id_not_found(self):
        """Test retrieving non-existent document"""
        document_id = 999
        
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.fetchone.return_value = None
            
            response = document_client.get(f"/documents/{document_id}")
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data
    
    def test_delete_document_success(self):
        """Test successful document deletion"""
        document_id = 1
        
        with patch('services.document_service.get_db_connection') as mock_db:
            with patch('os.remove') as mock_remove:
                mock_conn = Mock()
                mock_cursor = Mock()
                mock_db.return_value.__enter__.return_value = mock_conn
                mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
                
                # Mock document exists
                mock_cursor.fetchone.return_value = {
                    "id": document_id,
                    "file_path": "/tmp/test_document.pdf"
                }
                mock_cursor.rowcount = 1
                
                response = document_client.delete(f"/documents/{document_id}")
                
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"
                
                # Verify file deletion was attempted
                mock_remove.assert_called_once()
    
    def test_document_search(self):
        """Test document search functionality"""
        search_query = "test query"
        
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            mock_cursor.fetchall.return_value = [
                {
                    "id": 1,
                    "title": "Test Document",
                    "description": "Contains test query",
                    "relevance_score": 0.95
                }
            ]
            
            response = document_client.get(
                "/documents/search",
                params={"q": search_query}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert len(data["results"]) == 1
            assert "relevance_score" in data["results"][0]

class TestDocumentProcessing:
    """Test suite for document processing functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Set up test environment"""
        self.test_document_id = 1
        self.test_file_path = "/tmp/test_document.pdf"
    
    @patch('services.document_service.process_document_async')
    def test_document_processing_trigger(self, mock_process):
        """Test that document processing is triggered after upload"""
        mock_process.return_value = AsyncMock()
        
        test_file = {
            'file': ("test.pdf", BytesIO(b"PDF content"), "application/pdf")
        }
        
        form_data = {
            "title": "Test Document",
            "description": "Test",
            "category": "general",
            "priority": "medium"
        }
        
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.fetchone.return_value = {"id": 1}
            
            response = document_client.post(
                "/documents/upload",
                files=test_file,
                data=form_data
            )
            
            assert response.status_code == 200
            # Verify processing was triggered
            mock_process.assert_called_once()
    
    def test_document_status_update(self):
        """Test document status updates during processing"""
        document_id = 1
        new_status = "processed"
        
        with patch('services.document_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.rowcount = 1
            
            response = document_client.put(
                f"/documents/{document_id}/status",
                json={"status": new_status}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"

class TestDocumentSecurity:
    """Test suite for document security and access control"""
    
    def test_upload_requires_authentication(self):
        """Test that document upload requires authentication"""
        # This would be implemented when authentication is added
        pass
    
    def test_document_access_permissions(self):
        """Test document access permissions"""
        # This would test user-specific document access
        pass
    
    def test_file_type_validation(self):
        """Test comprehensive file type validation"""
        dangerous_files = [
            ("virus.exe", b"MZ", "application/x-executable"),
            ("script.js", b"<script>", "application/javascript"),
            ("malware.bat", b"@echo off", "application/x-msdos-program")
        ]
        
        for filename, content, content_type in dangerous_files:
            test_file = {
                'file': (filename, BytesIO(content), content_type)
            }
            
            form_data = {
                "title": f"Test {filename}",
                "description": "Should be rejected",
                "category": "general",
                "priority": "medium"
            }
            
            response = document_client.post(
                "/documents/upload",
                files=test_file,
                data=form_data
            )
            
            assert response.status_code == 400, f"File {filename} should be rejected"

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])