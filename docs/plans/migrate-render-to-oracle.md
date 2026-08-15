# Plan: Migrate BE từ Render → Oracle Cloud VM

- **Ngày lập:** 2026-08-15
- **Trạng thái:** Đang thực thi — Phase 0 xong (trừ Security List), Phase 1 đã implement, Phase 3 đã chốt **proxy qua Next.js** (bỏ nginx/domain)
- **VM:** Oracle Cloud `VM.Standard.E2.1.Micro` (x86, 1/8 OCPU, 1GB RAM, Always Free)
- **Repo:** `github.com/khangpd1212/squademy`
- **GHCR image:** `ghcr.io/khangpd1212/squademy-api`

---

## Hiện trạng & Mục tiêu

| | Hiện tại | Sau migrate |
|---|---|---|
| Frontend | Vercel (`squademy-web.vercel.app`) | Vercel (giữ nguyên) |
| API | Render `squademy-api` (Docker, free plan) | Oracle VM `E2.1.Micro` |
| DB | **Supabase** (Postgres) | **Supabase** (giữ nguyên — không migrate data) |
| Domain | `*.onrender.com` | **Proxy cùng nguồn Next.js**: browser gọi `/api/*` → `rewrites()` → `http://161.118.198.102:3001` (Vercel lo HTTPS; không cần domain/nginx/certbot) |
| Build | Render tự build | GitHub Actions → GHCR → VM pull |

## Quyết định đã chốt

1. **DB giữ ở Supabase** — không cần di chuyển dữ liệu, chỉ đổi connection string trong môi trường VM.
2. **Proxy qua Next.js (đã chốt 15/08)** — không dùng nginx/domain: web gọi API qua `/api/*` + `rewrites()` tới `http://161.118.198.102:3001`. Trước đó từng tính public IP + HTTP, rồi DuckDNS — đều đã huỷ.
3. **Build qua GitHub Actions → GHCR** — VM 1GB RAM không build nổi NestJS+Prisma, tránh OOM.
4. **Cơ chế deploy: GitHub Actions SSH deploy (Cách A)** — GH Actions build + push image lên GHCR, rồi SSH vào VM `pull && up -d`.
5. **SSH thủ công**: dùng key đã tải về (`ssh-key-2026-08-14.key`) với user `ubuntu` — Cloud Shell cũng được.

---

## Phase 0 — Chuẩn bị VM Oracle

> **⚠️ Thực tế VM đã phát hiện:** VM chạy **Ubuntu 22.04.5 LTS (jammy)**, KHÔNG phải Oracle Linux → user SSH là **`ubuntu`** (không phải `opc`), dùng **`apt`** (không dùng `dnf`), **không có firewalld** (ufw đang inactive → không cần cấu hình firewall bổ sung, kiểm soát qua Security List). Public IP: `161.118.198.102`; key: `~/ssh-key-2026-08-14.key`.

1. **Mở Security List / NSG** trong VCN (Oracle Console → Networking → Virtual Cloud Networks → Security List):
   - `TCP 22` — SSH (cho GitHub Actions runner — IP động, nên mở từ `0.0.0.0/0`)
   - `TCP 80` — HTTP API
   - `TCP 443` — để dành SSL (Phase 5)
   > ⏳ **CHƯA LÀM** — bắt buộc mở **trước Phase 3** (nginx), không chặn Phase 1–2.
2. **SSH vào VM**: `ssh -i ~/ssh-key-2026-08-14.key ubuntu@161.118.198.102` (VM dựng với Ubuntu → user `ubuntu`). ✅ Xong
3. **Swap 2GB** (1GB RAM dễ OOM khi chạy Docker + NestJS + nginx): ✅ Xong
   ```bash
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
   → `free -h` xác nhận `Swap: 2.0Gi`.
4. **Cài Docker Engine + compose plugin** (repo chính thức docker.com cho Ubuntu jammy): ✅ Xong
   ```bash
   sudo apt update
   sudo apt install -y ca-certificates curl
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo systemctl enable --now docker
   sudo usermod -aG docker ubuntu
   ```
   Đăng xuất + đăng nhập lại để nhóm `docker` có hiệu lực → `docker ps` OK.
   → Đã cài: **Docker 29.7.2**, **Compose v5.4.0**.
5. **Firewall** — VM dùng Ubuntu, ufw đang **inactive**, không có firewalld → **BỎ bước này**; kiểm soát access qua Security List (bước 1) là đủ.

---

## Phase 1 — Thay đổi trong repo (GitHub)

### 1a. `deploy/docker-compose.prod.yml` (file mới)

Compose riêng cho prod — **không có service postgres** (DB ở Supabase), dùng image từ GHCR thay vì `build:`.

```yaml
services:
  api:
    image: ghcr.io/khangpd1212/squademy-api:latest
    container_name: squademy-api
    restart: unless-stopped
    env_file: .env.prod
    ports:
      - "127.0.0.1:3001:8080"   # Dockerfile ENV PORT=8080 → container nghe 8080; 3001 giữ khớp nginx conf
```

- Giữ nguyên `docker-compose.yml` ở root cho dev local (có postgres) — không sửa.

### 1b. `.github/workflows/deploy-api.yml` (file mới)

Trigger khi push `main` thay đổi `apps/api/**`, `packages/database/**`, `packages/shared/**`, `deploy/**`, `.dockerignore`.

Các bước:
1. **Build image** từ `apps/api/Dockerfile` (runner `ubuntu-latest` = amd64, khớp E2.1.Micro). Dockerfile hiện có đã build được qua multi-stage — không cần sửa.
2. **Push** `ghcr.io/khangpd1212/squademy-api:latest` + `:<sha>` (dùng `GITHUB_TOKEN`, scope `packages: write`).
3. **SCP** `deploy/docker-compose.prod.yml` lên VM (`appleboy/scp-action` → `/opt/squademy/deploy/`).
4. **SSH vào VM** (`appleboy/ssh-action`): `cd /opt/squademy && docker compose -f deploy/docker-compose.prod.yml pull && up -d`.
5. **Health check**: `curl -f http://127.0.0.1:3001/api/version` (chạy trong script SSH — hoạt động cả trước lẫn sau khi có nginx).

### 1c. GitHub Secrets cần tạo

| Secret | Giá trị |
|---|---|
| `ORACLE_HOST` | Public IP của VM Oracle (`161.118.198.102`) |
| `ORACLE_SSH_USER` | `ubuntu` |
| `ORACLE_SSH_PORT` | `22` |
| `ORACLE_SSH_KEY` | Toàn bộ nội dung file `ssh-key-2026-08-14.key` (từ `-----BEGIN OPENSSH PRIVATE KEY-----` đến `-----END...-----`) — key đã nằm trong `authorized_keys` của `ubuntu`, dùng luôn |
| `GHCR_TOKEN` | Fine-grained PAT của GitHub, scope `read:packages` (VM cần để pull image) |

> VM pull image cần đăng nhập GHCR: `docker login ghcr.io -u khangpd1212` bằng `GHCR_TOKEN` (PAT). Hoặc chọn image public (không cần login).

---

## Phase 2 — Deploy lần đầu lên VM

1. Trên VM, tạo thư mục `/opt/squademy` (chown `ubuntu:ubuntu`), copy `deploy/docker-compose.prod.yml` vào.
2. Tạo `.env.prod` trên VM (không commit — gitignored):
   ```
   DATABASE_URL=postgresql://postgres.<ref>...@aws-0-<region>.pooler.supabase.com:5432/postgres?...&sslmode=require
   JWT_SECRET=<giữ nguyên secret trên Render hiện tại>
   JWT_REFRESH_SECRET=<giữ nguyên>
   FRONTEND_URL=https://squademy-web.vercel.app
   PORT=8080
   ```
   - **Giữ nguyên JWT secrets** → người dùng không bị đăng xuất hàng loạt (refresh token cũ vẫn hợp lệ). Đổi secret = mọi phiên đăng nhập chết.
   - `PORT=8080` khớp Dockerfile (container nghe 8080; compose map host `127.0.0.1:3001` → container `8080`).
   - Supabase free không có IP allowlist → Oracle IP không bị chặn.
   - ⚠️ **Không dùng được direct connection**: host direct `db.<ref>.supabase.co` và `<ref>.pooler.supabase.com` **chỉ resolve ra IPv6**, mà Oracle VM không có IPv6 → "Network is unreachable". Bắt buộc dùng host pooler **IPv4**: `aws-1-ap-south-1.pooler.supabase.com` (A record, port 5432 reachable từ VM).
   - Giá trị chạy được (đã verify production 15/08/2026): `postgresql://postgres.<ref>:<pass>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require`
   - Session pooler `:6543` **treo** với `prisma migrate deploy` (`can-connect-to-database` không trả lời) → dùng transaction pooler `:5432` (khớp URL local dev đang chạy tốt với Prisma).
3. `docker login ghcr.io` bằng `GHCR_TOKEN`, rồi:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml up -d
   ```
4. Test local trên VM: `curl http://127.0.0.1:3001/api/version` → `{"version":"1.0.3", "status":"ok", ...}`

---

## Phase 3 — Proxy qua Next.js (đã chốt 15/08/2026, thay thế nginx)

**Quyết định:** Không dùng nginx/domain như plan cũ — browser gọi API qua **cùng nguồn Next.js** (`/api/*`), `next.config.ts` dùng `rewrites()` forward tới `http://161.118.198.102:3001`. Hết mixed-content, không cần mở port 80/443, Vercel xử lý HTTPS. API trên VM chỉ bind `127.0.0.1:3001` → không public trực tiếp (chủ ý).

1. **`apps/web/next.config.ts`** — thêm `rewrites()`: `source: "/api/:path*"` → `${apiBase}/:path*`, với `apiBase = process.env.API_URL || (NODE_ENV === "production" ? "http://161.118.198.102:3001/api" : "http://localhost:4001/api")`.
2. **`browser-client.ts`** — `API_BASE_URL = "/api"` (bỏ `NEXT_PUBLIC_API_URL`; token vẫn localStorage, header `Authorization: Bearer` giữ nguyên).
3. **Vercel env**: đặt `API_URL=http://161.118.198.102:3001/api` (server-only), **xoá** `NEXT_PUBLIC_API_URL`, rồi **redeploy** (env dùng lúc build).
4. **CORS**: không cần đổi — rewrite forward nguyên Origin của caller (Vercel), đã nằm trong `FRONTEND_URL` whitelist.
5. **Verify end-to-end**: `curl -s https://squademy-web.vercel.app/api/version` → `{"version":"1.0.3",...}`; rồi đăng nhập → tạo group → mời member → CRUD lesson/card trên production.

---

## Phase 4 — Decommission Render + Tài liệu

1. Xác nhận mọi flow hoạt động ổn định trên Oracle **ít nhất 1 tuần**.
2. Render: set `squademy-api` sang **inactive** (chưa xoá) để rollback dễ dàng.
3. Xoá/đánh dấu deprecated `render.yaml`.
4. Cập nhật `AGENTS.md` + `README.md`:
   - Bảng Deployment: Backend đổi Render → Oracle (GitHub Actions + GHCR).
   - Bổ sung mục hướng dẫn deploy mới.
   - Ghi rõ cơ chế: push `main` → GH Actions build → SSH deploy.

---

## Phase 5 — (Tuỳ chọn) Domain riêng cho API — KHÔNG cần nữa

Proxy Next.js đã giải quyết đường truy cập công khai + HTTPS. Chỉ làm tiếp nếu muốn expose API trực tiếp qua domain riêng:

1. Trỏ domain `api.<tên>.com` → A record về public IP Oracle + nginx SSL (`deploy/nginx/api.squademy.com.conf` đã có sẵn trong repo).

---

## Rủi ro & Lưu ý

- **1GB RAM**: đã xử lý bằng swap + build image ở cloud (không build trên VM). Tránh cài thêm service không cần thiết trên VM.
- **Không cần SSL riêng cho API**: mọi traffic browser→API đi qua Vercel HTTPS (rewrite cùng nguồn), không còn mixed-content. Token vẫn qua Bearer header.
- **Latency rewrite**: Vercel edge → VM thêm vài chục ms so với gọi thẳng, chấp nhận được ở quy mô hiện tại.
- **Downtime cutover**: ~vài phút (đổi env Vercel + redeploy). Làm giờ thấp điểm nếu cần.
- **Rollback**: giữ Render active ít nhất 1 tuần sau cutover.
- **GitHub Actions cần mở port 22** cho IP của GitHub runner từ ngoài internet — lưu ý khi cấu hình Security List (không giới hạn quá chặt sẽ chặn mất deploy).
- **GITHUB_TOKEN push GHCR** chỉ tồn tại trong lúc workflow chạy — VM pull dùng `GHCR_TOKEN` (PAT) riêng.

---

## Checklist triển khai

- [ ] Phase 0: ✅ swap, ✅ Docker (Ubuntu/apt), ⏳ Security List mở **22** (SSH deploy; 80/443 không cần cho proxy)
- [ ] Phase 1: `deploy/docker-compose.prod.yml`, `.github/workflows/deploy-api.yml`, 5 GitHub Secrets
- [ ] Phase 2: `.env.prod` trên VM, `docker login`, `up -d`, test `/api/version`
- [ ] Phase 3: proxy `rewrites()` + `API_BASE_URL=/api` + Vercel env `API_URL` (xoá `NEXT_PUBLIC_API_URL`) + redeploy + verify E2E
- [ ] Phase 4: giữ Render inactive 1 tuần, rồi dừng hẳn; xoá render.yaml; cập nhật docs
- [ ] (Tuỳ chọn) Phase 5: domain + certbot SSL
