const AuditLog = require('../models/AuditLog');

async function log(action, performedBy, targetType, targetId, details = {}, req = null) {
  try {
    return await AuditLog.create({
      action,
      performedBy,
      targetType,
      targetId,
      details,
      ip: req?.ip || req?.connection?.remoteAddress || '',
      userAgent: req?.headers?.['user-agent'] || ''
    });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

module.exports = { log };
