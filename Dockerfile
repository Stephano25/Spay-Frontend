# frontend/Dockerfile
# ============================================================
# DOCKERFILE - SPaye Frontend (Angular)
# ============================================================

# ── Étape 1: Build Angular ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install && npm cache clean --force

# Copier le code source
COPY . .

# ✅ Utiliser build:prod pour la production
RUN npm run build:prod

# ── Étape 2: Servir avec Nginx ──
FROM nginx:alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
# ✅ Vérifier le chemin de sortie (par défaut: dist/spaye-frontend)
COPY --from=builder /app/dist/spaye-frontend /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]