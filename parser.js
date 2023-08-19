const axios = require('axios');
const XLSX = require('xlsx');

const headers = {
    "authority": "similar-queries.wildberries.ru",
    "accept": "*/*",
    "accept-language": "en,ru;q=0.9,uk;q=0.8",
    "dnt": "1",
    "origin": "https://global.wildberries.ru",
    "referer": "https://global.wildberries.ru/",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
};

let processedQueries = new Set();
let results = [];
const iterations = 1000;
let counter = 0;

async function fetchData(query, parent = null, depth = 0) {
    if (processedQueries.has(query) || results.length / 10 >= iterations * 10 || depth >= iterations) {
        return;
    }
    processedQueries.add(query);
    console.log(`iterations: ${++counter}`)

    try {
        const response = await axios.get(`https://similar-queries.wildberries.ru/api/v2/search/query?query=${query}`, { headers });
        const keywords = response.data.query;

        // console.log(`Ключевые слова по родителю ${parent}: ${keywords}`);

        for (let keyword of keywords) {
            if (results.length / 10 >= iterations * 10) {
                break;
            }
            results.push({
                keyword: keyword,
                parent: parent
            });
        }

        for (let keyword of keywords) {
            if (results.length / 10 >= iterations * 10) {
                break;
            }
            await fetchData(keyword, query, depth + 1);
        }

    } catch (error) {
        console.log('Error fetching data for query:', query, error);
    }
}

(async function () {
    await fetchData('кеды');

    const ws = XLSX.utils.json_to_sheet(results.map(r => ({
        'Ключевое слово': r.keyword,
        'Родитель': r.parent || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const dd = String(today.getDate()).padStart(2, '0');

    const formattedDate = `${yyyy}-${mm}-${dd}`;
    XLSX.writeFile(wb, `keywords_${formattedDate}.xlsx`);
})();