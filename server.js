const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;

app.get('/status', (req, res) => {
  res.json({ redis: true, db: true });
});

app.get('/stats', (req, res) => {
  res.json({ users: 12, files: 1231 });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
  } else {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  }
});

ver;
