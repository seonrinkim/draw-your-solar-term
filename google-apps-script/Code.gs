// Van het Seizoen — Google Sheet / Drive mirror
//
// Bound to the "절기 드로잉 데이터베이스" Google Sheet via
// Extensions > Apps Script. Deployed as a Web App (Execute as: Me,
// Access: Anyone) so the static frontend can POST to it without OAuth.
//
// On each submission it:
//   1. Decodes the PNG sent from the browser and saves it into
//      DRIVE_FOLDER_ID, named "{term}_{nickname}_{timestamp}.png".
//   2. Appends a row to the Sheet with the term, nickname, note, and a
//      link to that same Drive file, so each row and image match up.
//
// This mirrors Supabase (the real backend for the live site) — it does
// not replace it. If this call fails, the site submission still succeeds.

const DRIVE_FOLDER_ID = '1vtVYEScd8X-ybGzS8iHq46c6vGIaYwT5';
const SHARED_SECRET = 'van-het-seizoen-2026';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const timestamp = new Date();
    const safeName = (data.nickname || 'anonymous')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = data.termSlug + '_' + safeName + '_' + timestamp.getTime() + '.png';

    const base64 = data.imageBase64.split(',').pop();
    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, 'image/png', fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const imageUrl = file.getUrl();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Term (Korean)', 'Term (English)', 'Nickname', 'Note', 'Image']);
    }
    sheet.appendRow([
      timestamp,
      data.termHangul,
      data.termEnglish,
      data.nickname,
      data.note,
      imageUrl,
    ]);

    return jsonResponse({ ok: true, imageUrl: imageUrl });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
