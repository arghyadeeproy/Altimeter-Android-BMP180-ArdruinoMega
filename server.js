import express from 'express';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import cors from 'cors';

const app = express();
app.use(cors());

const port = new SerialPort({ path: 'COM3', baudRate: 9600 });  // Update with your correct COM port
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

let altitude = 0;

parser.on('data', (data) => {
    try {
        const parsedData = JSON.parse(data);
        if (parsedData.altitude) {
            altitude = parsedData.altitude;
            console.log('Altitude:', altitude);
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});

app.get('/altitude', (req, res) => {
    res.json({ altitude });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/altitude`);
});
