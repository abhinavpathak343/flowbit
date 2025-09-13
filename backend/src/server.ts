// server.ts
import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  console.log("ok backend is running");
  res.send("ok backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
