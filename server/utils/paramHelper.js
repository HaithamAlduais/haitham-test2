/**
 * Extract the parent event/hackathon ID from route params.
 * Works with both /api/hackathons/:id/... and /api/events/:eventId/...
 */
function getParentId(req) {
  return req.params.id || req.params.eventId;
}

module.exports = { getParentId };
