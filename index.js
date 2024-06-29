import axios from "axios";
import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL = "https://api.mangadex.org";
const IMAGE_URL = `https://uploads.mangadex.org`;


// Middlewares


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


// Proxy route to fetch manga cover and chapters


app.get('/proxy-cover/:mangaId/:coverId', async (req, res) => {
    try {
        const { mangaId, coverId } = req.params;
        const coverUrl = `${IMAGE_URL}/covers/${mangaId}/${coverId}`;

        const response = await axios.get(coverUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];

        res.set('Content-Type', contentType);
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching manga cover:', error.message);
        res.status(500).send('Error fetching manga cover');
    }
});

app.get('/proxy-chapter/:chapterHash/:chapterFile', async (req, res) => {
    try {
        const { chapterHash, chapterFile } = req.params;
        const chapterUrl = `${IMAGE_URL}/data/${chapterHash}/${chapterFile}`;

        const response = await axios.get(chapterUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];

        res.set('Content-Type', contentType);
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching manga chapter:', error.message);
        res.status(500).send('Error fetching manga chapter');
    }
});



// Get Routes



app.get("/", async (req, res) => {
    try {
        const result = await axios.get(`${API_URL}/manga`);
        const mangaData = result.data.data;
        let mangaList = [];
    
        for (const manga of mangaData) {
            try {
                const coverResponse = await axios.get(`https://api.mangadex.org/cover?manga[]=${manga.id}`);
                if (coverResponse.data.data.length > 0) {
                    const coverId = coverResponse.data.data[0].attributes.fileName;
                    const proxyCoverUrl = `/proxy-cover/${manga.id}/${coverId}`;
                    mangaList.push({
                        manga: manga,
                        coverUrl: proxyCoverUrl
                    });
                } else {
                    console.log("not found??");
                }
            } catch (error) {
                console.error(`Error fetching cover for manga with ID ${manga.id}:`, error);
            }
        }
    
        res.render("index.ejs", { mangas: mangaList });
    } catch (error) {
        console.error('Error fetching mangas:', error.message);
        res.status(500).send('Error fetching mangas');
    }
});

app.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const result = await axios.get(`${API_URL}/manga/${id}/aggregate`);
        const mangaVolumes = result.data.volumes;

        const manga = await axios.get(`${API_URL}/manga/${id}`);
        const mangaTitle = manga.data.data.attributes.title.en;

        let mangaData = [];
        let coverUrl;
        
        
        Object.keys(mangaVolumes).forEach(volumeKey => {
            const volume = mangaVolumes[volumeKey];

            Object.keys(volume.chapters).forEach(chapterKey => {
                const chapter = volume.chapters[chapterKey];
                
                mangaData.push({
                    Chapter: chapter.chapter,
                    Id: chapter.id
                });
            });
        });

        try {
            const coverResponse = await axios.get(`https://api.mangadex.org/cover?manga[]=${id}`);
            if (coverResponse.data.data.length > 0) {
                const coverId = coverResponse.data.data[0].attributes.fileName;
                const proxyCoverUrl = `/proxy-cover/${id}/${coverId}`;

                coverUrl = proxyCoverUrl;
                
            } else {
                console.log("Manga cover not found");
            }

        } catch (error) {
            console.error('Error fetching manga cover:', error.message);
            res.status(500).send('Error fetching manga cover');
        }

        res.render("manga.ejs", { manga: mangaData, title: mangaTitle, coverUrl: coverUrl });
    } catch (error) {
        console.error('Error fetching mangas:', error.message);
        res.status(500).send('Error fetching mangas');
    }
});

app.get("/:id/chapter/:chapterNumber", async (req, res) => {
    try {
        const { id, chapterNumber } = req.params;

        const result = await axios.get(`${API_URL}/at-home/server/${id}`);

        const chapterHash = result.data.chapter.hash;
        const chapterData = result.data.chapter.data;

        let chapterImages = [];

        chapterData.forEach(chapter => {
            const proxyChapterUrl = `/proxy-chapter/${chapterHash}/${chapter}`;
            chapterImages.push(proxyChapterUrl);
        });
        
        res.render("chapter.ejs", { chapter: chapterImages, chapterNumber: chapterNumber, hash: chapterHash, id: id });
    } catch (error) {
        
    }
});


// Post routes



app.post("/search-manga", async (req, res) => {
    try {
        const mangaTitle = req.body.title;
        const result = await axios.get(`${API_URL}/manga?title=${mangaTitle}`);
        const mangaData = result.data.data
        let mangaList = [];
        
        for (const manga of mangaData) {
            try {
                const coverResponse = await axios.get(`https://api.mangadex.org/cover?manga[]=${manga.id}`);
                if (coverResponse.data.data.length > 0) {
                    const coverId = coverResponse.data.data[0].attributes.fileName;
                    const proxyCoverUrl = `/proxy-cover/${manga.id}/${coverId}`;
                    mangaList.push({
                        manga: manga,
                        coverUrl: proxyCoverUrl
                    });
                } else {
                    console.log("not found??");
                }
            } catch (error) {
                console.error(`Error fetching cover for manga with ID ${manga.id}:`, error);
            }
        }
    
        res.render("index.ejs", { mangas: mangaList });
    } catch (error) {
        console.error('Error fetching mangas:', error.message);
        res.status(500).send('Error fetching mangas');
    }
});

app.listen(port, () => {
    console.log(`Server running on: http://127.0.0.1:${port} | http://localhost:${port}`);
});