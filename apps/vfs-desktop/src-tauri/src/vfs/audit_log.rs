//! Audit Log - Persistent audit trail for user and organization operations
//!
//! Provides long-term storage of operations for audit purposes:
//! - User operations audit
//! - Organization operations audit (under development)
//! - Persistent storage separate from operation tracker

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use parking_lot::RwLock;
use tracing::{error, info};

use super::operation_tracker::{Operation, OperationType, OperationStatus};

/// Audit log entry (simplified operation record for audit)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogEntry {
    /// Unique operation ID
    pub operation_id: String,
    /// Operation type
    pub operation_type: OperationType,
    /// Source ID
    pub source_id: String,
    /// Source path
    pub source_path: String,
    /// Destination path (if applicable)
    pub destination_path: Option<String>,
    /// File size
    pub file_size: Option<u64>,
    /// Operation status
    pub status: OperationStatus,
    /// Error message if failed
    pub error: Option<String>,
    /// User ID who performed the operation
    pub user_id: Option<String>,
    /// Organization ID
    pub organization_id: Option<String>,
    /// Timestamp when operation was created
    #[serde(with = "chrono::serde::ts_seconds_option")]
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    /// Timestamp when operation was completed
    #[serde(with = "chrono::serde::ts_seconds_option")]
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl From<Operation> for AuditLogEntry {
    fn from(op: Operation) -> Self {
        Self {
            operation_id: op.operation_id,
            operation_type: op.operation_type,
            source_id: op.source_id,
            source_path: op.source_path,
            destination_path: op.destination_path,
            file_size: op.file_size,
            status: op.status,
            error: op.error,
            user_id: op.user_id,
            organization_id: op.organization_id,
            created_at: op.created_at,
            completed_at: op.completed_at,
        }
    }
}

/// Audit log manager
pub struct AuditLog {
    /// Audit entries (in-memory cache)
    entries: Arc<RwLock<Vec<AuditLogEntry>>>,
    /// Audit log file path
    audit_file: PathBuf,
    /// Maximum number of entries to keep (0 = unlimited)
    max_entries: usize,
}

impl AuditLog {
    /// Create a new audit log
    pub fn new(audit_dir: &Path, max_entries: usize) -> Result<Self> {
        std::fs::create_dir_all(audit_dir)
            .context("Failed to create audit log directory")?;
        
        let audit_file = audit_dir.join("audit_log.json");
        
        let audit = Self {
            entries: Arc::new(RwLock::new(Vec::new())),
            audit_file,
            max_entries,
        };
        
        // Load existing audit entries
        audit.load()?;
        
        Ok(audit)
    }

    /// Load audit entries from disk
    fn load(&self) -> Result<()> {
        // Try loading from JSON file first
        if self.audit_file.exists() {
            let data = std::fs::read_to_string(&self.audit_file)
                .context("Failed to read audit log file")?;
            
            // Try parsing as JSON array first
            if let Ok(entries) = serde_json::from_str::<Vec<AuditLogEntry>>(&data) {
                let mut audit_entries = self.entries.write();
                *audit_entries = entries;
                info!("Loaded {} audit log entries from JSON", audit_entries.len());
                return Ok(());
            }
        }
        
        // Try loading from JSONL file (legacy format from operation tracker)
        let jsonl_file = self.audit_file.parent()
            .map(|p| p.join("operations").join("audit_log.jsonl"))
            .unwrap_or_else(|| self.audit_file.parent().unwrap().join("audit_log.jsonl"));
        
        if jsonl_file.exists() {
            let data = std::fs::read_to_string(&jsonl_file)
                .context("Failed to read audit log JSONL file")?;
            
            let mut entries = Vec::new();
            for line in data.lines() {
                if let Ok(op) = serde_json::from_str::<Operation>(line) {
                    entries.push(AuditLogEntry::from(op));
                }
            }
            
            let mut audit_entries = self.entries.write();
            *audit_entries = entries;
            info!("Loaded {} audit log entries from JSONL", audit_entries.len());
        }
        
        Ok(())
    }

    /// Save audit entries to disk
    fn save(&self) -> Result<()> {
        let entries = self.entries.read();
        
        // Limit entries if max_entries is set
        let entries_to_save = if self.max_entries > 0 && entries.len() > self.max_entries {
            let mut sorted = entries.clone();
            sorted.sort_by(|a, b| {
                let a_time = a.created_at.or(a.completed_at);
                let b_time = b.created_at.or(b.completed_at);
                b_time.cmp(&a_time)
            });
            sorted.truncate(self.max_entries);
            sorted
        } else {
            entries.clone()
        };
        
        let data = serde_json::to_string_pretty(&entries_to_save)
            .context("Failed to serialize audit log")?;
        
        std::fs::write(&self.audit_file, data)
            .context("Failed to write audit log file")?;
        
        Ok(())
    }

    /// Add an operation to the audit log
    pub fn log_operation(&self, operation: Operation) -> Result<()> {
        let entry: AuditLogEntry = operation.into();
        
        {
            let mut entries = self.entries.write();
            entries.push(entry);
        }
        
        self.save()?;
        Ok(())
    }

    /// Get all audit entries
    pub fn get_all_entries(&self) -> Vec<AuditLogEntry> {
        let entries = self.entries.read();
        entries.clone()
    }

    /// Get audit entries by user ID
    pub fn get_entries_by_user(&self, user_id: &str) -> Vec<AuditLogEntry> {
        let entries = self.entries.read();
        entries.iter()
            .filter(|e| e.user_id.as_ref().map(|id| id == user_id).unwrap_or(false))
            .cloned()
            .collect()
    }

    /// Get audit entries by organization ID
    pub fn get_entries_by_organization(&self, organization_id: &str) -> Vec<AuditLogEntry> {
        let entries = self.entries.read();
        entries.iter()
            .filter(|e| e.organization_id.as_ref().map(|id| id == organization_id).unwrap_or(false))
            .cloned()
            .collect()
    }

    /// Get audit entries filtered by type
    pub fn get_entries_by_type(&self, operation_type: &OperationType) -> Vec<AuditLogEntry> {
        let entries = self.entries.read();
        entries.iter()
            .filter(|e| e.operation_type == *operation_type)
            .cloned()
            .collect()
    }

    /// Get audit entries filtered by status
    pub fn get_entries_by_status(&self, status: &OperationStatus) -> Vec<AuditLogEntry> {
        let entries = self.entries.read();
        entries.iter()
            .filter(|e| e.status == *status)
            .cloned()
            .collect()
    }

    /// Clear audit log
    pub fn clear(&self) -> Result<()> {
        {
            let mut entries = self.entries.write();
            entries.clear();
        }
        self.save()?;
        Ok(())
    }
}
