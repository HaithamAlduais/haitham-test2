/**
 * Ramsha — Centralized Firebase Admin SDK access.
 *
 * All backend modules should import { admin, db, auth } from here
 * instead of requiring "firebase-admin" directly.
 *
 * Uses lazy accessors because admin.initializeApp() is called in
 * server/index.js at startup — before any request handler runs,
 * but after this module is first required.
 */

const admin = require("firebase-admin");

/** Lazy Firestore accessor — safe to call after initializeApp(). */
const db = () => admin.firestore();

/** Lazy Auth accessor — safe to call after initializeApp(). */
const auth = () => admin.auth();

module.exports = { admin, db, auth };
