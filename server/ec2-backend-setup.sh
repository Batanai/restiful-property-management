#!/bin/bash

# Update system
sudo yum update -y

# Install required build tools and libraries
sudo yum install -y gcc-c++ make openssl-devel git curl

# Install libatomic (required for Node.js)
sudo yum install -y libatomic

# Install nvm (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js (latest LTS)
nvm install --lts
nvm use --lts

# Install Yarn
npm install -g yarn

# Install PM2
npm install -g pm2

# Clone your repo (replace with your repo and SSH key setup as needed)
# Make sure your SSH key is already set up and added to GitHub
git clone git@github.com:Batanai/restiful-property-management.git

# Change directory to your project (update if your repo name is different)
cd restiful-property-management/server

# Install dependencies
yarn

# Generate Prisma client (if using Prisma)
yarn prisma generate

# Build your NestJS project (if using TypeScript)
yarn build

# Start the app with PM2 (update entry point if needed)
pm2 start dist/main.js --name nest-backend

# Save PM2 process list and enable startup on boot
pm2 save
pm2 startup

echo "Setup complete! Your NestJS app should be running under PM2."