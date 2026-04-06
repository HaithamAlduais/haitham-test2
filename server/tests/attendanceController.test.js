/**
 * Ramsha — Attendance Controller Tests
 *
 * Unit tests for POST /api/sessions/:id/attend covering both QR Code
 * and F2F attendance modes.
 */

// ── Mock firebase-admin before requiring the controller ─────────────────────

const mockTransaction = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockDocRef = {
  id: "attendance-record-123",
};

const mockSessionGet = jest.fn();
const mockAttendanceWhere = jest.fn();

const mockFirestore = {
  collection: jest.fn((name) => {
    if (name === "sessions") {
      return {
        doc: jest.fn(() => ({ get: mockSessionGet })),
      };
    }
    if (name === "attendance_records") {
      return {
        doc: jest.fn(() => mockDocRef),
        where: mockAttendanceWhere,
      };
    }
  }),
  runTransaction: jest.fn((fn) => fn(mockTransaction)),
};

jest.mock("firebase-admin", () => {
  const firestoreFn = () => mockFirestore;
  firestoreFn.FieldValue = {
    serverTimestamp: () => "SERVER_TIMESTAMP",
  };
  firestoreFn.Timestamp = {
    now: () => ({ toMillis: () => Date.now() }),
  };

  return {
    firestore: firestoreFn,
  };
});

const { attendSession } = require("../controllers/attendanceController");

// ── Test helpers ────────────────────────────────────────────────────────────

function mockReq(overrides = {}) {
  return {
    params: { id: "session-abc" },
    uid: "participant-uid-1",
    role: "Participant",
    body: {
      participantName: "Alice",
      participantEmail: "alice@example.com",
      ...overrides.body,
    },
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeSession(overrides = {}) {
  return {
    status: "active",
    sessionType: "qr_code",
    qrCode: "valid-qr-uuid",
    ownerUid: "provider-uid-1",
    allowedLatenessMinutes: 15,
    createdAt: { toMillis: () => Date.now() - 5 * 60 * 1000 }, // 5 min ago
    instructorLocation: null,
    radiusMeters: null,
    ...overrides,
  };
}

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Default: no existing attendance (empty snapshot)
  mockTransaction.get.mockResolvedValue({ empty: true });

  // Default: attendance where().limit() returns itself for chaining
  mockAttendanceWhere.mockReturnValue({
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue("attendance-query"),
    }),
  });
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/sessions/:id/attend", () => {
  // ── QR Code Path ────────────────────────────────────────────────────────

  describe("QR Code check-in", () => {
    test("successful check-in → present", async () => {
      const session = makeSession({
        createdAt: { toMillis: () => Date.now() - 5 * 60 * 1000 }, // 5 min ago (within 15 min window)
      });
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });

      const req = mockReq({ body: { qrCode: "valid-qr-uuid", participantName: "Alice", participantEmail: "alice@example.com" } });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            sessionId: "session-abc",
            participantUid: "participant-uid-1",
            status: "present",
          }),
        })
      );
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    test("successful check-in → late", async () => {
      const session = makeSession({
        createdAt: { toMillis: () => Date.now() - 20 * 60 * 1000 }, // 20 min ago (beyond 15 min window)
      });
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });

      const req = mockReq({ body: { qrCode: "valid-qr-uuid", participantName: "Alice", participantEmail: "alice@example.com" } });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: "late",
          }),
        })
      );
    });

    test("invalid QR code → 400 INVALID_QR_CODE", async () => {
      const session = makeSession();
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });

      const req = mockReq({ body: { qrCode: "wrong-qr-code", participantName: "Alice", participantEmail: "alice@example.com" } });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "INVALID_QR_CODE",
        })
      );
      expect(mockTransaction.set).not.toHaveBeenCalled();
    });

    test("duplicate check-in → 409 ALREADY_CHECKED_IN", async () => {
      const session = makeSession();
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });

      // Simulate existing attendance record found in transaction
      mockTransaction.get.mockResolvedValue({ empty: false });

      const req = mockReq({ body: { qrCode: "valid-qr-uuid", participantName: "Alice", participantEmail: "alice@example.com" } });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "ALREADY_CHECKED_IN",
        })
      );
      expect(mockTransaction.set).not.toHaveBeenCalled();
    });
  });

  // ── F2F Path ────────────────────────────────────────────────────────────

  describe("F2F check-in", () => {
    const instructorLocation = { latitude: 24.7136, longitude: 46.6753 };
    // ~50m away from instructor
    const nearbyLocation = { latitude: 24.71405, longitude: 46.6753 };
    // ~5km away from instructor
    const farLocation = { latitude: 24.76, longitude: 46.6753 };

    test("successful F2F check-in → present (within radius)", async () => {
      const session = makeSession({
        sessionType: "f2f",
        qrCode: null,
        instructorLocation,
        radiusMeters: 100,
        createdAt: { toMillis: () => Date.now() - 5 * 60 * 1000 },
      });
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });

      const req = mockReq({
        body: {
          participantName: "Bob",
          participantEmail: "bob@example.com",
          participantLocation: nearbyLocation,
        },
      });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: "present",
            participantLocation: nearbyLocation,
          }),
        })
      );
    });

    test("F2F rejection → outside radius", async () => {
      const session = makeSession({
        sessionType: "f2f",
        qrCode: null,
        instructorLocation,
        radiusMeters: 100,
      });
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });

      const req = mockReq({
        body: {
          participantName: "Bob",
          participantEmail: "bob@example.com",
          participantLocation: farLocation,
        },
      });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "OUTSIDE_ALLOWED_RADIUS",
        })
      );
      expect(mockTransaction.set).not.toHaveBeenCalled();
    });

    test("duplicate F2F check-in → 409 ALREADY_CHECKED_IN", async () => {
      const session = makeSession({
        sessionType: "f2f",
        qrCode: null,
        instructorLocation,
        radiusMeters: 100,
      });
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });
      mockTransaction.get.mockResolvedValue({ empty: false });

      const req = mockReq({
        body: {
          participantName: "Bob",
          participantEmail: "bob@example.com",
          participantLocation: nearbyLocation,
        },
      });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "ALREADY_CHECKED_IN",
        })
      );
    });
  });

  // ── Common Validations ──────────────────────────────────────────────────

  describe("common validations", () => {
    test("Provider role → 403 PROVIDER_NOT_ALLOWED", async () => {
      const req = mockReq({
        role: "Provider",
        body: { qrCode: "valid-qr-uuid", participantName: "Alice", participantEmail: "alice@example.com" },
      });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "PROVIDER_NOT_ALLOWED",
        })
      );
    });

    test("session not found → 404", async () => {
      mockSessionGet.mockResolvedValue({ exists: false });

      const req = mockReq({ body: { qrCode: "any", participantName: "Alice", participantEmail: "alice@example.com" } });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "SESSION_NOT_FOUND",
        })
      );
    });

    test("session not active → 400 SESSION_NOT_ACTIVE", async () => {
      const session = makeSession({ status: "closed" });
      mockSessionGet.mockResolvedValue({ exists: true, data: () => session });

      const req = mockReq({ body: { qrCode: "valid-qr-uuid", participantName: "Alice", participantEmail: "alice@example.com" } });
      const res = mockRes();

      await attendSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "SESSION_NOT_ACTIVE",
        })
      );
    });
  });
});
