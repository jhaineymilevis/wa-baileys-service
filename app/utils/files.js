export async function convertFileToBase64(filePath, buffer) {
  fs.writeFileSync(filePath, buffer);
  const bufferred = fs.readFileSync(filePath);
  const base64 = bufferred.toString("base64");
}
