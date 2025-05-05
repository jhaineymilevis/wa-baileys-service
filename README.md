// ---- README (quick start) ----

# Baileys WhatsApp Service

Now exposes a **/qr** endpoint so you can scan from anywhere.

```bash
npm install
cp .env.example .env  # edit values
node server.js        # open http://localhost:3000/qr and scan
```

### Docker

```bash
docker build -t baileys-wa .
docker run -d --name wa \
  -p 3000:3000 \
  -v $PWD/auth:/app/auth \
  --env-file .env \
  baileys-wa
```

### Docker compose

```bash
docker compose up -d
```

Then browse to `http://<host>:3000/qr`.

**Endpoints**

- `GET  /qr` – PNG QR to log in
- `POST /send-message` – `{ "to": "573001234567", "text": "Hola 🥳" }`
- `GET  /health` – quick health‑check

Incoming messages are forwarded to `N8N_WEBHOOK_URL`. Incoming QR codes show for 30–60&nbsp;s – refresh if expired.

## rUn with Railway

# montar un volumen en railway

railway volume add -m /data
railway volume list

# run

railway up
