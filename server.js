import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';
import cdnRoutes from './routes/cdn.routes.js'

connectDB();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🛒 Hammer Mart API is live!');
});

app.use('/api/users', userRoutes);

app.use('/api/upload/', cdnRoutes )

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
