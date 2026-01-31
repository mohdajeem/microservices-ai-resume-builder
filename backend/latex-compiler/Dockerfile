# FROM node:20-slim

# # Install dependencies for Tectonic
# RUN apt-get update && apt-get install -y \
#     curl \
#     libfontconfig1 \
#     libgraphite2-3 \
#     libharfbuzz0b \
#     libicu-dev \
#     libssl-dev \
#     ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

# # Install Tectonic
# RUN curl --proto '=https' --tlsv1.2 -sSf https://drop-sh.tectonic-typesetting.org | sh && \
#     mv tectonic /usr/local/bin/

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# EXPOSE 6000

# CMD ["npm", "start"]


# # Stage 1: Get Tectonic
# FROM dxjoke/tectonic-docker:latest AS tectonic-source

# # Stage 2: Your Node App
# FROM node:20-slim

# # Install the minimal runtime libs Tectonic needs
# # Note: Added libfontconfig1 and others required for PDF rendering
# RUN apt-get update && apt-get install -y \
#     libfontconfig1 \
#     libgraphite2-3 \
#     libharfbuzz0b \
#     libicu72 \
#     ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

# # Corrected path: dxjoke image stores it in /usr/bin/
# COPY --from=tectonic-source /usr/bin/tectonic /usr/local/bin/tectonic

# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .

# EXPOSE 6000
# CMD ["npm", "start"]


# 1. Base Image: Start directly with Node.js 18 on Debian 12 (Bookworm)
FROM node:18-bookworm-slim

# 2. Install System Dependencies
# Tectonic needs these libraries to run on Linux
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    libssl-dev \
    libfontconfig1 \
    libgraphite2-3 \
    libharfbuzz0b \
    libicu-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 3. Install Tectonic (Official Binary Script)
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh && \
    mv tectonic /usr/local/bin/tectonic

# 4. Pre-Cache LaTeX Packages
# ✅ FIX: We COPY the local file instead of using 'echo' or 'printf'
# This avoids the "invalid character" shell errors.
WORKDIR /app
COPY dummy.tex ./

# Run Tectonic on the dummy file. 
# This forces it to download the ~60MB of core LaTeX files now, 
# so the user doesn't wait for it later.
RUN tectonic dummy.tex && \
    rm dummy.*

# 5. Setup Your Express App
COPY package*.json ./
RUN npm install --production
COPY . .

# 6. Start
EXPOSE 6000
CMD ["node", "server.js"]