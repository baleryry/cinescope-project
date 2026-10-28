import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moviesRouter from './routes/movies.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ruta raíz de bienvenida
app.get('/', (req, res) => {
    res.json({
        mensaje: "🎬 Servidor Backend de CineScope Activo (UAC)",
        endpoints: {
            peliculas: "http://localhost:5000/api/movies",
            salud: "http://localhost:5000/api/health"
        }
    });
});

// Endpoint base de las películas
app.use('/api/movies', moviesRouter);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'CineScope API Node.js Gateway' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor CineScope corriendo en http://localhost:${PORT}`);
});