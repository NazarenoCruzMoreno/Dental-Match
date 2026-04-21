require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 DentalMach Backend corriendo en puerto ${PORT}`);
  console.log(`📊 http://localhost:${PORT}`);
});