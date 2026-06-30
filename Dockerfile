# ============================================================
# DOCKERFILE - SPaye Frontend (Angular)
# ============================================================

# Étape 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les dépendances
COPY package*.json ./
COPY package-lock.json ./

# Installer
RUN npm ci && \
    npm cache clean --force

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build -- --configuration=production

# Étape 2: Production avec Nginx
FROM nginx:alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist/spaye-frontend /usr/share/nginx/html

# Port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]