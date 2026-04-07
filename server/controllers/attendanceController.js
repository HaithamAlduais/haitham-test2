/**
 * Ramsha — Attendance Controller
 *
 * Handles Participant check-in for both QR Code and F2F session types.
 * Uses a Firestore transaction to prevent duplicate attendance records.
 */

const { admin, db } = require("../lib/firebase");
const { SESSION_STATUS, SESSION_TYPE, ATTENDANCE_STATUS } = require("../lib/constants");
const { haversineDistance } = require("../utils/haversine");
const { validateQrToken } = require("../utils/qrToken");

// Lazy collection accessors
const sessionsCol = () => db().collection("sessions");
const attendanceCol = () => db().collection("attendance_records");

// ── POST /api/sessions/:id/attend ───────────────────────────────────────────

/**
 * Ramsha attendance check-in endpoint.
 *
 * Handles both QR Code and F2F attendance modes within a single handler.
 * Uses a Firestore transaction for the duplicate check + write to prevent
 * race conditions from concurrent check-in attempts.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function attendSession(req, res) {
  try {
    const { id: sessionId } = req.params;
    const participantUid = req.uid;

    // ── Role gate ─────────────────────────────────────────────────────────
    if (req.role !== "Participant") {
      return res.status(403).json({
        success: false,
        code: "PROVIDER_NOT_ALLOWED",
        message: "Only Participants can check in to sessions.",
      });
    }

    // ── Fetch session ─────────────────────────────────────────────────────
    const sessionDoc = await sessionsCol().doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        code: "SESSION_NOT_FOUND",
        message: "Session not found.",
      });
    }

    const session = sessionDoc.data();

    // ── Session must be active ────────────────────────────────────────────
    if (session.status !== SESSION_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        code: "SESSION_NOT_ACTIVE",
        message: "This session is not currently active.",
      });
    }

    // ── Mode-specific validation ──────────────────────────────────────────
    const { participantName, participantEmail } = req.body;

    if (session.sessionType === SESSION_TYPE.QR_CODE) {
      // QR Code path — supports rotating token (qrToken) or static code (qrCode)
      const { qrCode, qrToken } = req.body;

      // Support rotating QR tokens (new) and static codes (legacy)
      let qrValid = false;
      if (session.qrSecret && qrToken) {
        // Rotating token validation
        const interval = session.qrRotationInterval || 120;
        qrValid = validateQrToken(session.qrSecret, interval, qrToken);
      } else {
        // Legacy static code validation
        qrValid = qrCode === session.qrCode;
      }

      if (!qrValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_QR_CODE",
          message: session.qrSecret
            ? "QR code has expired or is invalid. Please scan the latest code."
            : "The QR code does not match this session.",
        });
      }
    } else if (session.sessionType === SESSION_TYPE.F2F) {
      // F2F path — validate location
      const { participantLocation } = req.body;

      if (
        !participantLocation ||
        typeof participantLocation.latitude !== "number" ||
        typeof participantLocation.longitude !== "number"
      ) {
        return res.status(400).json({
          success: false,
          code: "MISSING_LOCATION",
          message: "F2F check-in requires participantLocation with latitude and longitude.",
        });
      }

      const distance = haversineDistance(
        participantLocation,
        session.instructorLocation
      );

      if (distance > session.radiusMeters) {
        return res.status(403).json({
          success: false,
          code: "OUTSIDE_ALLOWED_RADIUS",
          message: `You are ${Math.round(distance)}m away. Maximum allowed distance is ${session.radiusMeters}m.`,
        });
      }
    }

    // ── Calculate present / late status ───────────────────────────────────
    const nowMs = Date.now();
    const baseTime = session.activatedAt || session.createdAt;
    const baseTimeMs = baseTime.toMillis();
    const latenessMs = (session.allowedLatenessMinutes || 15) * 60 * 1000;
    const attendanceStatus =
      nowMs <= baseTimeMs + latenessMs
        ? ATTENDANCE_STATUS.PRESENT
        : ATTENDANCE_STATUS.LATE;

    // ── Transactional duplicate check + write ─────────────────────────────
    const result = await db().runTransaction(async (transaction) => {
      // Query for existing attendance inside the transaction
      const existingSnap = await transaction.get(
        attendanceCol()
          .where("sessionId", "==", sessionId)
          .where("participantUid", "==", participantUid)
          .limit(1)
      );

      if (!existingSnap.empty) {
        return { duplicate: true };
      }

      const recordRef = attendanceCol().doc();
      const attendanceData = {
        sessionId,
        participantUid,
        participantName,
        participantEmail,
        attendanceTime: admin.firestore.FieldValue.serverTimestamp(),
        status: attendanceStatus,
      };

      // Include participant location for F2F sessions
      if (session.sessionType === SESSION_TYPE.F2F) {
        attendanceData.participantLocation = req.body.participantLocation;
      }

      transaction.set(recordRef, attendanceData);

      return {
        duplicate: false,
        id: recordRef.id,
        ...attendanceData,
        attendanceTime: new Date().toISOString(), // approximate for the response
      };
    });

    if (result.duplicate) {
      return res.status(409).json({
        success: false,
        code: "ALREADY_CHECKED_IN",
        message: "You have already checked in to this session.",
      });
    }

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("attendSession error:", err);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to record attendance.",
    });
  }
}

// ── GET /api/sessions/:id/attendance ─────────────────────────────────────────

/**
 * Ramsha — List attendance records for a session.
 *
 * Returns all check-in records for the given session, sorted by
 * attendanceTime ascending (first to arrive at top). Only the
 * session's owning Provider may call this endpoint.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function listAttendance(req, res) {
  try {
    const { id: sessionId } = req.params;

    // Verify session exists and belongs to this Provider
    const sessionDoc = await sessionsCol().doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Session not found." });
    }
    if (sessionDoc.data().ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this session." });
    }

    const snapshot = await attendanceCol()
      .where("sessionId", "==", sessionId)
      .orderBy("attendanceTime", "asc")
      .get();

    const records = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return res.json({ data: records });
  } catch (err) {
    console.error("listAttendance error:", err);
    return res.status(500).json({ error: "Failed to list attendance." });
  }
}

module.exports = { attendSession, listAttendance };
