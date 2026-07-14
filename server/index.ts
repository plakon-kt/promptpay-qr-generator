import express from 'express';
import cors from 'cors';
// Import ฟังก์ชันสร้าง PromptPay ของเดิมมาใช้
import { generatePromptPayPayload } from '../src/lib/promptpay.js';

const app = express();
app.use(cors());
app.use(express.json()); // ให้รับข้อมูลเป็น JSON ได้

// สร้าง API Endpoint
app.post('/api/generate', (req, res) => {
  try {
    const { target, amount } = req.body;
    
    // เรียกใช้ฟังก์ชันเดิม
    const payload = generatePromptPayPayload({ 
      target, 
      amount: amount ? Number(amount) : undefined 
    });

    // ส่ง Payload กลับไปให้ Frontend
    res.json({ payload });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend Server รันอยู่บนพอร์ต ${PORT} (http://localhost:${PORT})`);
});
