FROM node:16

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Copy prisma and TS types
COPY prisma ./prisma/
COPY @types ./@types/

# Install necessary libraries
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000

CMD npm run start:migrate:prod && npx ts-node ./src/server.ts