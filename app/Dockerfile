FROM node:20-alpine

WORKDIR /usr/src/app

# Instala pacotes raiz (concurrently)
COPY package.json start.js ./
RUN npm install

# Copia e compila backend
COPY backend ./backend
RUN cd backend && npm install && npm run build

# Copia e compila frontend
COPY frontend ./frontend
RUN cd frontend && npm install && npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
