/**
 * Ramsha — Event Controller Tests
 *
 * Unit tests for create/update/delete event management flow.
 */

const mockEventAdd = jest.fn();
const mockEventCodeQueryGet = jest.fn();
const mockEventDocGet = jest.fn();
const mockEventDocUpdate = jest.fn();
const mockEventDocDelete = jest.fn();
const mockSessionsByEventGet = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchDelete = jest.fn();
const mockBatchCommit = jest.fn();

const eventRef = {
  get: mockEventDocGet,
  update: mockEventDocUpdate,
  delete: mockEventDocDelete,
};

const mockEventsCollection = {
  add: mockEventAdd,
  doc: jest.fn(() => eventRef),
  where: jest.fn((field) => {
    if (field === "eventCode") {
      return {
        limit: jest.fn(() => ({ get: mockEventCodeQueryGet })),
      };
    }

    return {
      orderBy: jest.fn(() => ({ get: jest.fn() })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({ get: jest.fn() })),
      })),
    };
  }),
};

const mockSessionsCollection = {
  where: jest.fn(() => ({
    where: jest.fn(() => ({
      get: mockSessionsByEventGet,
    })),
  })),
};

const mockFirestore = {
  collection: jest.fn((name) => {
    if (name === "events") return mockEventsCollection;
    if (name === "sessions") return mockSessionsCollection;
    return {};
  }),
  batch: jest.fn(() => ({
    update: mockBatchUpdate,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  })),
};

jest.mock("firebase-admin", () => {
  const firestoreFn = () => mockFirestore;
  firestoreFn.FieldValue = {
    serverTimestamp: () => "SERVER_TIMESTAMP",
  };

  return {
    firestore: firestoreFn,
  };
});

const {
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

function mockReq(overrides = {}) {
  const overrideBody = overrides.body || {};
  return {
    uid: "provider-uid-1",
    params: { eventId: "event-123" },
    ...overrides,
    body: {
      name: "Spring Event",
      description: "Hands-on session",
      visibility: "public",
      ...overrideBody,
    },
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeEvent(overrides = {}) {
  return {
    ownerUid: "provider-uid-1",
    name: "Existing Event",
    description: "Existing Description",
    eventType: "other",
    eventCode: "EVT-ABC123",
    visibility: "private",
    createdAt: "SERVER_TIMESTAMP",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEventAdd.mockResolvedValue({ id: "event-123" });
  mockEventCodeQueryGet.mockResolvedValue({ empty: true });
  mockEventDocGet.mockResolvedValue({ exists: true, data: () => makeEvent() });
  mockEventDocUpdate.mockResolvedValue();
  mockEventDocDelete.mockResolvedValue();
  mockSessionsByEventGet.mockResolvedValue({ docs: [], size: 0 });
  mockBatchCommit.mockResolvedValue();
});

describe("eventController", () => {
  describe("createEvent", () => {
    test("creates event with system-generated eventCode", async () => {
      const req = mockReq();
      const res = mockRes();

      await createEvent(req, res);

      expect(mockEventAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerUid: "provider-uid-1",
          name: "Spring Event",
          eventCode: expect.stringMatching(/^[A-Z]{3}-[A-Z0-9]{6}$/),
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "event-123",
          eventCode: expect.stringMatching(/^[A-Z]{3}-[A-Z0-9]{6}$/),
        })
      );
    });

    test("rejects missing event name", async () => {
      const req = mockReq({ body: { name: "" } });
      const res = mockRes();

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockEventAdd).not.toHaveBeenCalled();
    });
  });

  describe("updateEvent", () => {
    test("updates owned event", async () => {
      const req = mockReq({
        body: {
          name: "Updated Name",
          description: "Updated Description",
          visibility: "public",
        },
      });
      const res = mockRes();

      await updateEvent(req, res);

      expect(mockEventDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated Name",
          description: "Updated Description",
          visibility: "public",
          updatedAt: "SERVER_TIMESTAMP",
        })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: "event-123" }));
    });

    test("forbids updating event not owned by provider", async () => {
      mockEventDocGet.mockResolvedValue({
        exists: true,
        data: () => makeEvent({ ownerUid: "other-provider" }),
      });
      const req = mockReq();
      const res = mockRes();

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockEventDocUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteEvent", () => {
    test("deletes event and unlinks linked sessions", async () => {
      const sessionRefA = { id: "s1" };
      const sessionRefB = { id: "s2" };
      mockSessionsByEventGet.mockResolvedValue({
        size: 2,
        docs: [
          { ref: sessionRefA },
          { ref: sessionRefB },
        ],
      });

      const req = mockReq();
      const res = mockRes();

      await deleteEvent(req, res);

      expect(mockBatchUpdate).toHaveBeenCalledWith(sessionRefA, { eventId: null });
      expect(mockBatchUpdate).toHaveBeenCalledWith(sessionRefB, { eventId: null });
      expect(mockBatchDelete).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, unlinkedSessions: 2 })
      );
    });

    test("returns 404 for missing event", async () => {
      mockEventDocGet.mockResolvedValue({ exists: false });
      const req = mockReq();
      const res = mockRes();

      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockBatchCommit).not.toHaveBeenCalled();
    });
  });
});
