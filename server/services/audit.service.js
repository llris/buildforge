const auditRepository = require('../repositories/audit.repository');
const logger = require('../utils/logger');

/**
 * Records an audit log entry.
 * Non-blocking: logs error if it fails without breaking the main transaction/operation if desired,
 * or can be awaited directly.
 */
const recordAuditLog = async ({ actorId, action, entityType, entityId, before, after, tx = null }) => {
  try {
    if (!actorId) {
      logger.warn(`Audit log skipped: No actorId provided for action "${action}" on ${entityType}:${entityId}`);
      return null;
    }
    return await auditRepository.createAuditLog(tx, {
      actorId,
      action,
      entityType,
      entityId,
      before,
      after,
    });
  } catch (error) {
    logger.error(`Failed to record audit log: ${error.message}`);
    return null;
  }
};

const getAuditLogs = async (queryParams) => {
  return auditRepository.findAuditLogsPaginated(queryParams);
};

module.exports = {
  recordAuditLog,
  getAuditLogs,
};
