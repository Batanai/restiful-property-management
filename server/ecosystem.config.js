module.exports = {
  apps: [
    {
      name: "property-management-api",
      script: "yarn",
      args: "start:dev",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
