const express = require('express');
const app = express();

const PORT = process.env.PORT || 9000;

app.set('view engine', 'ejs');
app.use('/static', express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.render('../src/public/views/index');
});

app.listen(PORT, () => {
    console.log(`Listening on -> http://localhost:${PORT}`);
});