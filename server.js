const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Servir les fichiers statiques depuis dist
app.use(express.static(path.join(__dirname, 'dist')));

// Toutes les routes renvoient index.html (pour le routing SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
