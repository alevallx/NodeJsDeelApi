/* eslint-disable no-undef */
const app = require('./app');
const swaggerUi = require('swagger-ui-express'),
  swaggerDocument = require('./swagger.json');
init();

async function init() {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  try {
    app.listen(3001, () => {
      console.log('Express App Listening on Port 3001');
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
