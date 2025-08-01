// app.js
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; 
import { fetchData } from './controllers/dataController.js'; 
import salesRoutes from './routes/salesRoute.js'
import productRoutes from './routes/productRoutes.js'
import extractToDB from './routes/extractRoutes.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

connectDB(); 


app.get('/', (req, res) => {
    res.send('Welcome to the dashboard backend. Now get to work.');
});

app.use('/api/data', fetchData); 

app.use('/api/products', productRoutes);

app.use('/api/sales', salesRoutes);

app.use('/api/extract', extractToDB)



// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}. Don't screw it up.`);
});
