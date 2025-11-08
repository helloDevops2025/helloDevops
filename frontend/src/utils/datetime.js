// // src/utils/datetime.js
// export function fmtDateTime(isoLike) {
//   if (!isoLike) return "–";
//   try {
//     const d = new Date(isoLike);
//     const datePart = new Intl.DateTimeFormat(
//       "en-GB-u-ca-gregory",
//       { day: "2-digit", month: "short", year: "numeric" }
//     ).format(d);
//     const timePart = new Intl.DateTimeFormat(
//       "en-US-u-ca-gregory",
//       { hour: "2-digit", minute: "2-digit", hour12: true }
//     ).format(d);
//     return `${datePart} • ${timePart}`; // e.g. 25 Jan 2025 • 01:45 PM
//   } catch {
//     return String(isoLike);
//   }
// }
