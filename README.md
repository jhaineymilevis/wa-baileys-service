# Baileys WhatsApp Service

```bash
# clone repo & enter
npm install
cp .env.example .env    # edit values
node server.js          # scan the QR code once

# build & run in Docker
docker build -t baileys-wa .
docker run -d --name wa \
  -p 3000:3000 \
  -v $PWD/auth:/app/auth \  # persist login
  --env-file .env \
  baileys-wa
```

**Endpoints**

- `POST /send-message` → `{ "to": "573001234567", "text": "Hola 🥳" }`

Incoming messages are forwarded to the URL in `WEBHOOK_URL`.
