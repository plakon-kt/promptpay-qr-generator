import { useState, useRef } from "react";
import QRCode from "qrcode";
import { generatePromptPayPayload } from "./lib/promptpay";
import "./App.css";

function App() {
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [hasQr, setHasQr] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleGenerateClick() {
    setError("");

    try {
      const parsedAmount = amount.trim() ? Number(amount) : undefined;
      const payload = generatePromptPayPayload({ target, amount: parsedAmount });

      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          payload,
          { width: 220, margin: 1, color: { dark: "#1B1035", light: "#FFFFFF" } },
          function (err) {
            if (err) {
              console.error(err);
              return;
            }
            setHasQr(true);
          }
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setHasQr(false);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }

  return (
    <div className="page">
      <div className="glow" aria-hidden="true" />
      <main className="card">
        <header className="card__header">
          <span className="eyebrow">พร้อมเพย์ · PromptPay</span>
          <h1>สร้าง QR รับเงิน</h1>
          <p className="subtitle">กรอกเบอร์โทรหรือเลขบัตรประชาชน แล้วสแกนโอนได้จริงทันที</p>
        </header>

        <div className="card__body">
          <div className="form">
            <label className="field">
              <span className="field__label">เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน</span>
              <input
                className="field__input"
                placeholder="0812345678"
                value={target}
                maxLength={13}
                onChange={(e) => {
                  // กรองเอาเฉพาะตัวเลข และตัดให้ไม่เกิน 13 หลัก
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 13) {
                    setTarget(val);
                  }
                }}
              />
            </label>

            <label className="field">
              <span className="field__label">จำนวนเงิน (บาท)</span>
              <div className="amount-input">
                <span className="amount-input__prefix">฿</span>
                <input
                  className="field__input field__input--amount"
                  placeholder="0.00 (ไม่บังคับ)"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    // ให้พิมพ์ได้แค่ค่าว่าง หรือตัวเลขที่ไม่ติดลบ
                    if (val === "" || Number(val) >= 0) {
                      setAmount(val);
                    }
                  }}
                />
              </div>
              <span className="field__hint">เว้นว่างได้ถ้าต้องการให้ผู้โอนพิมพ์จำนวนเงินเอง</span>
            </label>

            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}

            <button className="submit-btn" onClick={handleGenerateClick}>
              สร้าง QR
            </button>
          </div>

          <div className="qr-slip">
            <div className={`qr-slip__frame ${hasQr ? "is-ready" : ""}`}>
              <canvas ref={canvasRef} className="qr-slip__canvas" />
              {!hasQr && (
                <div className="qr-slip__placeholder">
                  <span>QR จะแสดงที่นี่</span>
                </div>
              )}
            </div>
            <div className="qr-slip__perforation" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
            <span className="qr-slip__label">มาตรฐาน EMVCo · ธนาคารแห่งประเทศไทย</span>
          </div>
        </div>
      </main>
      <p className="footnote">ข้อมูลของคุณไม่ถูกส่งไปที่เซิร์ฟเวอร์ใดๆ — QR ถูกสร้างขึ้นในเบราว์เซอร์ของคุณทั้งหมด</p>
    </div>
  );
}

export default App;