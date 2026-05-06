// Bootstrap server - imports modular app
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// ONLY call app.listen ONCE. 
// Using '0.0.0.0' allows both localhost (computer) and 192.168.x.x (phone) to connect.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`For local network access, use your computer's IP: http://192.168.1.12:${PORT}`);
});