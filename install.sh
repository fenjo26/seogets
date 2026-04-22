#!/usr/bin/env bash
set -e

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}▶ $*${NC}"; }
success() { echo -e "${GREEN}✔ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }
error()   { echo -e "${RED}✖ $*${NC}"; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}── $* ──────────────────────────────────────${NC}"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      SEO Gets — VPS Installer v1.0       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ─── Root check ───────────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  error "Run as root: sudo bash install.sh"
fi

# ─── OS check ─────────────────────────────────────────────────────────────────
if ! command -v apt-get &>/dev/null; then
  error "Only Debian/Ubuntu supported. For other distros install Node.js 20+ manually."
fi

# ─── Collect config ───────────────────────────────────────────────────────────
header "Configuration"

read -rp "  Domain or server IP (e.g. seo.example.com or 1.2.3.4): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

read -rp "  App port      [3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}

read -rp "  Install Nginx reverse proxy? [Y/n]: " INSTALL_NGINX
INSTALL_NGINX=${INSTALL_NGINX:-Y}

read -rp "  Setup SSL with Let's Encrypt? (only if real domain) [y/N]: " SETUP_SSL
SETUP_SSL=${SETUP_SSL:-N}

echo ""

# ─── System packages ──────────────────────────────────────────────────────────
header "System packages"
info "Updating package lists..."
apt-get update -qq

info "Installing curl, git, unzip..."
apt-get install -y -qq curl git unzip build-essential

success "System packages ready"

# ─── Node.js 20 ───────────────────────────────────────────────────────────────
header "Node.js"
if command -v node &>/dev/null && [ "$(node -e "console.log(process.versions.node.split('.')[0])")" -ge 20 ]; then
  success "Node.js $(node -v) already installed"
else
  info "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs
  success "Node.js $(node -v) installed"
fi

# ─── PM2 ──────────────────────────────────────────────────────────────────────
header "PM2 (process manager)"
if command -v pm2 &>/dev/null; then
  success "PM2 already installed"
else
  info "Installing PM2..."
  npm install -g pm2 --silent
  success "PM2 installed"
fi

# ─── App dependencies ─────────────────────────────────────────────────────────
header "App dependencies"
info "Running npm install..."
npm install --silent
success "Dependencies installed"

# ─── .env ─────────────────────────────────────────────────────────────────────
header ".env"
if [ -f ".env" ]; then
  warn ".env already exists — skipping. Edit manually if needed."
else
  info "Generating .env..."

  if command -v openssl &>/dev/null; then
    SECRET=$(openssl rand -base64 32)
  else
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  fi

  # Determine URL
  if [[ "$DOMAIN" == "localhost" || "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    NEXTAUTH_URL="http://${DOMAIN}:${APP_PORT}"
  else
    if [[ "${SETUP_SSL^^}" == "Y" ]]; then
      NEXTAUTH_URL="https://${DOMAIN}"
    else
      NEXTAUTH_URL="http://${DOMAIN}"
    fi
  fi

  echo ""
  echo -e "${YELLOW}  Google OAuth credentials are required for login.${NC}"
  echo -e "  Create them at: ${CYAN}https://console.cloud.google.com${NC}"
  echo -e "  APIs & Services → Credentials → Create OAuth 2.0 Client ID"
  echo -e "  Redirect URI: ${CYAN}${NEXTAUTH_URL}/api/auth/callback/google${NC}"
  echo ""
  read -rp "  Google Client ID: " GOOGLE_CLIENT_ID
  read -rsp "  Google Client Secret: " GOOGLE_CLIENT_SECRET
  echo ""

  cat > .env <<EOF
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="${SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL}"

# Google OAuth
# Redirect URI: ${NEXTAUTH_URL}/api/auth/callback/google
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"
EOF

  success ".env created (NEXTAUTH_URL=${NEXTAUTH_URL})"
fi

# ─── Build ────────────────────────────────────────────────────────────────────
header "Database & Build"
info "Generating Prisma client..."
npx prisma generate 2>/dev/null

info "Pushing database schema..."
npx prisma db push --skip-generate 2>/dev/null

info "Building Next.js..."
npm run build

success "Build complete"

# ─── PM2 start ────────────────────────────────────────────────────────────────
header "Starting app with PM2"

pm2 delete seogets 2>/dev/null || true
pm2 start npm --name seogets -- start -- -p "$APP_PORT"
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

success "App running on port ${APP_PORT} (pm2 name: seogets)"

# ─── Nginx ────────────────────────────────────────────────────────────────────
if [[ "${INSTALL_NGINX^^}" == "Y" ]]; then
  header "Nginx"

  if ! command -v nginx &>/dev/null; then
    info "Installing Nginx..."
    apt-get install -y -qq nginx
  fi

  NGINX_CONF="/etc/nginx/sites-available/seogets"

  cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 10M;

    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/seogets
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t && systemctl reload nginx

  success "Nginx configured → http://${DOMAIN}"

  # ─── SSL ──────────────────────────────────────────────────────────────────
  if [[ "${SETUP_SSL^^}" == "Y" ]]; then
    header "SSL (Let's Encrypt)"
    apt-get install -y -qq certbot python3-certbot-nginx
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" || \
      warn "SSL setup failed — make sure the domain points to this server's IP"
    success "SSL certificate installed"
  fi
fi

# ─── Firewall ─────────────────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  header "Firewall"
  ufw allow OpenSSH  > /dev/null 2>&1 || true
  ufw allow 80/tcp   > /dev/null 2>&1 || true
  ufw allow 443/tcp  > /dev/null 2>&1 || true
  if [[ "${INSTALL_NGINX^^}" != "Y" ]]; then
    ufw allow "${APP_PORT}/tcp" > /dev/null 2>&1 || true
  fi
  ufw --force enable > /dev/null 2>&1 || true
  success "UFW firewall configured"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✔ Installation complete!        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

if [[ "${INSTALL_NGINX^^}" == "Y" ]]; then
  if [[ "${SETUP_SSL^^}" == "Y" ]]; then
    echo -e "  Open: ${CYAN}https://${DOMAIN}${NC}"
  else
    echo -e "  Open: ${CYAN}http://${DOMAIN}${NC}"
  fi
else
  echo -e "  Open: ${CYAN}http://${DOMAIN}:${APP_PORT}${NC}"
fi

echo ""
echo -e "  Sign in with your Google account on first visit."
echo -e "  The first account becomes the owner of the dashboard."
echo -e "  Add more Google accounts via Settings to pull GSC data from all of them."
echo ""
echo -e "  PM2 commands:"
echo -e "    ${CYAN}pm2 logs seogets${NC}     — view logs"
echo -e "    ${CYAN}pm2 restart seogets${NC}  — restart"
echo -e "    ${CYAN}pm2 stop seogets${NC}     — stop"
echo ""
