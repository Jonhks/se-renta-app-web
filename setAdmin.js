const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Inicializamos Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ⚠️ PEGA AQUÍ TU UID REAL
const uid = "FhZnxmhgBCVaHvgC4FkQx2zHkZk2";

async function setAdminClaim() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log("✅ Admin claim asignado correctamente.");
    process.exit();
  } catch (error) {
    console.error("❌ Error asignando admin claim:", error);
    process.exit(1);
  }
}

setAdminClaim();
