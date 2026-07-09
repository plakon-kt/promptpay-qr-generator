import { useState, useRef } from "react";
import QRCode from "qrcode";
import { generatePromptPayPayload } from "./lib/promptpay";

function App() {
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleGenerateClick() {
    setError("");

    try {
      const parsedAmount = amount.trim() ? Number(amount) : undefined;
      const payload = generatePromptPayPayload({ target, amount: parsedAmount});

      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, payload, { width: 250 }, function (err) {
          if (err) console.error(err);
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width,canvasRef.current.height);
      }
    }
  }
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif'}}>
      <h2>สร้าง PromptPay QR Code</h2>

      <div style={{ marginBottom: '10px'}}>
        <input placeholder="เบอร์โทร หรือ เลขบัตรประชาชน" 
        value={target} 
        onChange={(e) => setTarget(e.target.value)} 
        style={{ padding: '8px', width: '250px' }} />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="จำนวนเงิน (ไม่บังคับ)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number" // ดักให้พิมพ์ได้แต่ตัวเลข
          style={{ padding: '8px', width: '250px' }} />
      </div>

      <button onClick={handleGenerateClick} style={{ padding: '8px 16px' }}>
        สร้าง QR
      </button>

      {/* ถ้ามี error ให้โชว์ข้อความสีแดง */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {/* พื้นที่สำหรับวาด QR Code */}
      <div style={{ marginTop: '20px' }}>
        <canvas ref={canvasRef} />
      </div>
      
    </div>
  )
}

export default App;