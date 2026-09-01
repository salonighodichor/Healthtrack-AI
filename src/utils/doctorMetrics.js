/**
 * Shared utilities for doctor dashboard metrics
 * Ensures consistent interpretation of recovery data across all dashboard views
 */

/**
 * Get status badge text and color based on recovery percentage
 */
export const getRecoveryStatus = (recoveryPercent) => {
  if (recoveryPercent >= 80) return { status: "Excellent", color: "#10b981", icon: "✨" };
  if (recoveryPercent >= 60) return { status: "Good", color: "#3b82f6", icon: "💙" };
  if (recoveryPercent >= 40) return { status: "Improving", color: "#f59e0b", icon: "📈" };
  return { status: "Monitoring", color: "#ef4444", icon: "⚠️" };
};

/**
 * Get star rating from recovery percentage (0% = 1 star, 100% = 5 stars)
 */
export const getRecoveryRating = (recoveryPercent) => {
  const rating = Math.round((recoveryPercent / 100) * 4) + 1;
  return Math.min(5, Math.max(1, rating));
};

/**
 * Interpret recovery metrics for doctor display
 */
export const interpretRecoveryMetrics = (metrics) => {
  return {
    overall: metrics?.overall || 0,
    physical: metrics?.physicalRecovery || 0,
    medication: metrics?.medicationRecovery || 0,
    activity: metrics?.dailyActivity || 0,
    improvingCount: Math.max(0, metrics?.improvingPatients || 0),
    monitoringCount: Math.max(0, metrics?.needMonitoring || 0),
    excellentCount: Math.max(0, metrics?.excellentRecovery || 0),
    status: getRecoveryStatus(metrics?.overall || 0),
  };
};

/**
 * Alert type to icon mapping
 */
export const getAlertIcon = (alertType) => {
  const icons = {
    warning: "⚠️",
    success: "💙",
    info: "📅",
    alert: "⚠️",
    appointment: "📅",
    medication: "💊",
    health: "❤️",
  };
  return icons[alertType] || "📅";
};

/**
 * Alert type to color class mapping
 */
export const getAlertClass = (alertType) => {
  const classes = {
    warning: "warning",
    alert: "warning",
    success: "success",
    info: "info",
  };
  return classes[alertType] || "info";
};

/**
 * Format appointment status for display
 */
export const formatAppointmentStatus = (status) => {
  const statusMap = {
    pending: "Pending",
    requested: "Requested",
    scheduled: "Scheduled",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return statusMap[status] || status;
};

/**
 * Get medication status badge info
 */
export const getMedicationStatusInfo = (medicationStatus) => {
  const statuses = {
    pending: { label: "Pending", icon: "⏳", color: "#f59e0b" },
    taken: { label: "Taken", icon: "✓", color: "#10b981" },
    missed: { label: "Missed", icon: "✕", color: "#ef4444" },
    skipped: { label: "Skipped", icon: "↷", color: "#6b7280" },
  };
  return statuses[medicationStatus] || { label: "Unknown", icon: "?", color: "#9ca3af" };
};

/**
 * Compute health card statistics from raw metrics
 */
export const computeHealthCardStats = (overview, appointments, alerts, patients) => {
  return {
    totalPatients: overview?.totalPatients || patients?.length || 0,
    todaysAppointments: appointments?.filter((a) => {
      const appointmentDate = new Date(a.date).toDateString();
      return appointmentDate === new Date().toDateString();
    }).length || 0,
    averageRecovery: overview?.averageRecovery || 0,
    pendingReports: alerts?.filter((a) => a.type === "warning").length || 0,
  };
};
