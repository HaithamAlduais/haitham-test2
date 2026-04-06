/**
 * Ramsha — Haversine Distance Calculator
 *
 * Calculates the great-circle distance in meters between two geographic
 * coordinates using the Haversine formula.
 *
 * @param {{ latitude: number, longitude: number }} pointA — First coordinate
 * @param {{ latitude: number, longitude: number }} pointB — Second coordinate
 * @returns {number} Distance in meters
 */
function haversineDistance(pointA, pointB) {
  const EARTH_RADIUS_METERS = 6_371_000;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(pointB.latitude - pointA.latitude);
  const dLon = toRad(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pointA.latitude)) *
      Math.cos(toRad(pointB.latitude)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

module.exports = { haversineDistance };
