export let latestQRImg = null;
export let currentSocket; // para ir reemplazando la conexión Baileys

export function setLatestQRImg(value) {
  latestQRImg = value;
}

export function setCurrentSocket(value) {
  currentSocket = value;
}
