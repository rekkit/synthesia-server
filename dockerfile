FROM node:16

# Create app directory and set it as the default directory
WORKDIR /app

# Copy package.json and prisma
COPY package*.json ./
COPY prisma ./prisma/

# COPY tsconfig.json file
COPY tsconfig.json ./

# COPY
COPY . .

# Install libraries
RUN npm install

# Compile TS to JS
RUN npx tsc

# Run and expose the server on port 3000
EXPOSE 3000

# A command to start the server
CMD npm start