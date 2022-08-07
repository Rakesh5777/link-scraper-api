import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import getUrls from 'get-urls';
import { load } from 'cheerio';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());

const getMetaData = (text: string) => {
    const urls = [...getUrls(text).values()];
    const metaData = urls.map(async (url) => {
        const meta = await fetch(url);
        const html = await meta.text();
        const $ = load(html);
        const getMetaTag = (name: string) => $(`meta[name=${name}]`).attr('content') || $(`meta[property="og:${name}"]`).attr('content') || $(`meta[property="twitter:${name}"]`).attr('content');
        return {
            url,
            title: $('title').first().text(),
            favicon: $('link[rel="shortcut icon"]').attr('href'),
            description: getMetaTag('description'),
            image: getMetaTag('image'),
            author: getMetaTag('author')
        };
    })
    return Promise.all(metaData);
}

app.post('/preview-urls', async (req: Request, res: Response) => {
    const { urls } = req.body;
    try {
        const metaData = await getMetaData(urls);
        return res.json(metaData);
    } catch (err) {
        return res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`[server]: Server is running at: https://localhost:${port}`);
});