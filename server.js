const express = require('express');
const WebTorrent = require('webtorrent');
const cors = require('cors');
const app = express();

app.use(cors());
const client = new WebTorrent();

// Route: Is link par aap browser mein torrent magnet link bhejenge
app.get('/stream', (req, res) => {
    const magnetLink = req.query.magnet;
    
    if (!magnetLink) {
        return res.status(400).send('Bhai jaan, Magnet link zaroori hai.');
    }

    // Torrent add karna backend par
    client.add(magnetLink, (torrent) => {
        // Sab se barri file dhundna (jo movie file hoti hai)
        const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv'));

        if (!file) {
            return res.status(404).send('Movie file nahi mili.');
        }

        // Browser ke bandwidth rules ke mutabiq header set karna
        const range = req.headers.range;
        if (!range) {
            return res.status(416).send('Requires Range header');
        }

        const positions = range.replace(/bytes=/, "").split("-");
        const start = parseInt(positions[0], 10);
        const file_size = file.length;
        const end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
        const chunk_size = (end - start) + 1;

        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${file_size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunk_size,
            "Content-Type": "video/mp4" // Mkv ho tab bhi mp4 browser handle kar leta hai
        });

        // Live stream create karna bina file save kiye
        const stream = file.createReadStream({ start, end });
        stream.pipe(res);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));