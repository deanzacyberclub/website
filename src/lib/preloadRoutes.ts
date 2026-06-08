/**
 * Route preloading utilities
 * Call these on hover/focus of navigation links to load the chunk early.
 */

export const preloadMeetingDetails = () => import("@/pages/MeetingDetails");
export const preloadLive = () => import("@/pages/Attendance");
export const preloadDashboard = () => import("@/pages/Home");
export const preloadSettings = () => import("@/pages/Settings");
export const preloadAbout = () => import("@/pages/About");
export const preloadCTF = () => import("@/pages/CTF");
export const preloadAuth = () => import("@/pages/Auth");
