export default async function waitForNetwork() {
  while (true) {
    try {
      await fetch("https://clients3.google.com/generate_204", {
        timeout: 3000,
      });
      return;
    } catch {
      console.log("🌐 Sin datos… re‑chequeo en 5 s");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
