# Run Kairos on a Raspberry Pi 5

Kairos runs as three small Docker services: the web interface, a local SQLite data service, and Caddy as the local web entry point. The SQLite database is stored at `data/kairos.sqlite` and is never committed to Git.

## 1. Prepare the Pi

Use 64-bit Raspberry Pi OS. In a terminal on the Pi:

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
```

Sign out of the Pi and back in so the Docker group change takes effect. Verify:

```bash
docker version
docker compose version
```

## 2. Clone Kairos

```bash
cd "$HOME"
git clone https://github.com/csandq/visual-task-tracker.git kairos
cd kairos
```

If the repository is private, authenticate GitHub on the Pi first with `gh auth login`, then use `gh repo clone csandq/visual-task-tracker kairos`.

## 3. Start Kairos

```bash
mkdir -p data/backups
docker compose up -d --build
docker compose ps
```

Find the Pi address:

```bash
hostname -I
```

Open `http://PI_ADDRESS` from a browser on the same network. For example: `http://192.168.1.42`.

## 4. Move existing browser data

On the temporary Kairos site:

1. Open **Settings**.
2. Open **Data**.
3. Select **Download backup**.

On the Pi-hosted Kairos site:

1. Open **Settings**.
2. Open **Data**.
3. Select **Import backup** and choose the downloaded JSON file.
4. Wait until the storage message says the data is saved to the Kairos server.
5. Refresh the page and confirm the imported tasks remain.

## 5. Back up SQLite

Create a consistent backup while Kairos is running:

```bash
sh scripts/backup-pi.sh
```

Copy the resulting file from `data/backups/` to another computer or encrypted backup drive. Do not rely on the Pi's SD card as the only copy.

## 6. Update Kairos later

```bash
cd "$HOME/kairos"
sh scripts/backup-pi.sh
git pull --ff-only
docker compose up -d --build
```

The `data/` directory is not touched by code updates.

## Restore a SQLite backup

Stop Kairos before replacing the live database:

```bash
cd "$HOME/kairos"
docker compose down
cp data/backups/kairos-YYYY-MM-DD_HH-MM-SS.sqlite data/kairos.sqlite
docker compose up -d
```

Keep the old `data/kairos.sqlite` somewhere safe until the restored copy has been verified.

## Security note

This initial setup is for a trusted home network and does not include a login screen. Do not expose port 80 directly through the router. Use Tailscale for private remote access before using Kairos away from home.
