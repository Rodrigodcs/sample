import axios from 'axios';
import express, { Request, Response } from 'express';
import cron from 'node-cron';
import { Client, LocalAuth, Chat } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const app = express();
const port = 3000;

app.use(express.json());

let serializedGroupId = '120363302732128993@g.us';
let lastDotTime = new Date();
lastDotTime.setHours(lastDotTime.getHours() - 2);

let stopCronJob = false;

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on('qr', (qr: string) => {
  qrcode.generate(qr, { small: true });
  console.log('QR Code gerado. Escaneie para autenticar.');
});

client.on('ready', () => {
  console.log('Cliente do WhatsApp pronto!');
  client.on('message', async (msg: any) => {
    try {
      const chat: Chat = await msg.getChat();
      if (chat.isGroup && chat.name === 'Ponto') {
        const messageContent = msg.body;
        console.log({ messageContent })
        if (msg === 'Stop') {
          stopCron();
          return;
        }
        if (msg === 'Start') {
          startCron();
          return;
        }
        if (msg === 'Health') {
          await sendMessage('Server funcionando normalmente');
          return;
        }
        if (msg === 'Dot') {
          await registerDot();
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao processar a mensagem recebida:', error);
    }
  });
});

// app.get('/find-group/:name', async (req: Request, res: Response) => {
//   console.log('Buscando id do grupo...');
//   const groupName = req.params.name;
//   try {
//     const chats: Chat[] = await client.getChats();
//     const group = chats.find(chat => chat.isGroup && chat.name === groupName);

//     if (!group) {
//       throw (`Grupo não encontrado: ${groupName}`);
//     }
//     serializedGroupId = group.id._serialized;
//     res.send(`Grupo encontrado e registrado. Serial: ${group.id._serialized}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: `Grupo não encontrado: ${groupName}` });
//   }
// });

// app.get('/register-dot', async (req: Request, res: Response) => {
//   const promiseReturn = await registerDot()
//   return res.json({ message: promiseReturn });
// });

const startCron = () => {
  stopCronJob = false;
  console.log('CRON JOB STARTED');
}

const stopCron = () => {
  stopCronJob = true;
  console.log('CRON JOB STOPPED');
}

const scheduleTimes = [
  '29 8 * * *',  // 8:30 AM
  '59 11 * * *', // 12:00 PM
  '29 13 * * *', // 1:30 PM
  '59 17 * * *', // 6:00 PM
];

scheduleTimes.forEach((time) => {
  cron.schedule(time, async () => {
    console.log(`CRON JOB STARTED: ${getCurrentTime()}`);
    //await sendMessage(`BOT INICIALIZADO EM: ${getCurrentTime()}`);
    if (stopCronJob) {
      console.log(`CRON JOB REJECTED`);
      //await sendMessage(`BOT DESLIGADO`);
      return;
    }
    const now = new Date();
    if (now.getTime() - lastDotTime.getTime() < 1000 * 60 * 60) {
      await sendMessage(`FALHA NO REGISTRO, ULTIMO PONTO REGISTRADO EM: ${getCurrentTime(lastDotTime)}`);
      return;
    }
    const delay = getRandomNumber(1, 60000);
    console.log(`DELAY APPLIED: ${delay / 1000} seconds`);
    applyDelayToRequest(delay);
  });
});

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function applyDelayToRequest(delay: number) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        const data = await registerDot();
        resolve(data);
      } catch (error) {
        resolve(error);
      }
    }, delay);
  });
}

const registerDot = async () => {
  axios.post(
    'https://sys.easydots.com.br/humanresources/funcionario/register-hour',
    {},
    {
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Length': '0',
        'Cookie': 'cookieconsent_status_UNCATEGORIZED=ALLOW; cookieconsent_status_ESSENTIAL=ALLOW; cookieconsent_status_PERSONALIZATION=ALLOW; cookieconsent_status_ANALYTICS=ALLOW; cookieconsent_status_MARKETING=ALLOW; _identity=b375bca1322a63454bdb1e25a897b92ad71019f853e680acf67ba4244cffa0dea%3A2%3A%7Bi%3A0%3Bs%3A9%3A%22_identity%22%3Bi%3A1%3Bs%3A26%3A%22%5B30409%2C%22MTE4Njk3%22%2C2592000%5D%22%3B%7D; _csrf=f521d670cb0431e7fe6bd7ca9e6dcbc822d11b04d4d34817129c3858d2aa12b1a%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22S5c-Np2XsrYbi1BaUNT80XgW1rIml17A%22%3B%7D; token_easydots=962b87a963c1d97b1cba85f6890496b69682de7f9916242bcc16ca75aae585c9a%3A2%3A%7Bi%3A0%3Bs%3A14%3A%22token_easydots%22%3Bi%3A1%3Bs%3A32%3A%22h8s2vwv3dPXedIJaeThhGHfhFBgScenE%22%3B%7D; advanced-backend=upe7jvtoa1lm4h1slrqltivgr2',
        'Origin': 'https://sys.easydots.com.br',
        'Referer': 'https://sys.easydots.com.br/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'X-CSRF-Token': 'wwoJEn8shee53MGgp7VPfDaOdFr-4yHg2OuOGPxPbNqQP2o_MVy3v8qumMLOhA0dY8AgYs67Rrfpmcd1kH5bmw==',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      }
    }
  ).then(async (response) => {
    console.log(response.data);
    console.log(`DOT REGISTERED AT: ${getCurrentTime()}`);
    await sendMessage(`PONTO REGISTRADO: ${getCurrentTime()}`);
    lastDotTime = new Date();
    return response.data;
  }).catch(async (error) => {
    console.error(error);
    console.log(`DOT FAILED TO REGISTER AT: ${getCurrentTime()}`);
    await sendMessage(`FALHA NO REGISTRO: ${getCurrentTime()}`, true);
    stopCron();
    return error;
  });
}

const sendMessage = async (message: string, bold: boolean = false) => {
  const formattedMessage = bold ? `*\`${message}\`*` : `\`${message}\``;
  await client.sendMessage(serializedGroupId, formattedMessage);
}

function getCurrentTime(date: any = new Date()) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
