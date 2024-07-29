import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

app.use(express.json());

app.post('/multiply/:number', (req: Request, res: Response) => {
  const number = parseInt(req.params.number, 10);

  if (isNaN(number)) {
    return res.status(400).json({ error: 'Invalid number parameter' });
  }

  const result = number * 2;
  return res.json({ result });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
