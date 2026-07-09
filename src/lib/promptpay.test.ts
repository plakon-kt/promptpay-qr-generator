import { describe, expect, it } from "vitest";
import { generatePromptPayPayload } from "./promptpay";

describe("generatePromptPayPayload", () => {
  // it("อธิบายว่าเทสนี้เช็คอะไร", () => {
  //   expect(ผลลัพธ์ที่ได้).toBe(ผลลัพธ์ที่คาดหวัง);
  // });
  it("ควรสร้าง payload สำหรับเบอร์โทรศัพท์ (0812345678) แบบไม่ระบุยอดเงินได้ถูกต้อง", () => {
    const expected = 
      "000201" + // รูปแบบ Payload
      "010211" + // รูปแบบ QR (11 = Static)
      "2937" + // ข้อมูลบัญชีผู้รับเงิน (PromptPay)
      "0016A000000677010111" + // รหัส GUID มาตรฐาน
      "01130066812345678" + // เบอร์โทรศัพท์
      "5802TH" + // รหัสประเทศ (TH)
      "5303764" + // สกุลเงินบาท (764)
      "6304" + // ตำแหน่งค่า CRC-16
      "5D82"; // ค่า CRC-16 ที่คำนวณได้
    
    const result = generatePromptPayPayload({ target: "0812345678" });
    expect(result).toBe(expected);
    
    expect(result.length).toBe(74);
    expect(result.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
  });

  it("ควรสร้าง payload สำหรับเลขบัตรประชาชน แบบไม่ระบุยอดเงินได้ถูกต้อง", () => {
    const expected = 
      "000201" + // รูปแบบ Payload
      "010211" + // รูปแบบ QR (11 = Static)
      "2937" + // ข้อมูลบัญชีผู้รับเงิน (PromptPay)
      "0016A000000677010111" + // รหัส GUID มาตรฐาน
      "02131234567890123" + // เลขบัตรประชาชน
      "5802TH" + // รหัสประเทศ (TH)
      "5303764" + // สกุลเงินบาท (764)
      "6304" + // ตำแหน่งค่า CRC-16
      "EC40"; // ค่า CRC-16 ที่คำนวณได้
    
    const result = generatePromptPayPayload({ target: "1234567890123" });
    expect(result).toBe(expected);
    expect(result.length).toBe(74);
  });

  it("ควรสร้าง payload สำหรับเบอร์โทรศัพท์ แบบระบุยอดเงินได้ถูกต้อง", () => {
    const result = generatePromptPayPayload({ target: "0812345678", amount: 100 });
    expect(result).toContain("010212"); // เปลี่ยนเป็น 12 (Dynamic QR) เมื่อมียอดเงิน
    expect(result).toContain("0016A000000677010111"); // รหัส GUID มาตรฐาน
    expect(result).toContain("5406100.00"); // Tag 54: ยอดเงิน (ยาว 06, ค่า 100.00)
    expect(result.length).toBe(84);
  });

  it("ควรสร้าง payload แบบระบุยอดเงินมีทศนิยมได้ถูกต้อง", () => {
    const result = generatePromptPayPayload({ target: "0812345678", amount: 100.5 });
    expect(result).toContain("5406100.50");
    expect(result.length).toBe(84);
  });

  it("ควรแจ้งเตือน Error เมื่อข้อมูลสั้นเกินไป", () => {
    expect(() => generatePromptPayPayload({ target: "123" })).toThrow();
  });

  it("ควรแจ้งเตือน Error เมื่อข้อมูลยาวเกินไป (ผิดฟอร์แมต)", () => {
    expect(() => generatePromptPayPayload({ target: "123456789012345" })).toThrow();
  });

  it("ควรแจ้งเตือน Error เมื่อยอดเงินติดลบ", () => {
    expect(() => generatePromptPayPayload({ target: "0812345678", amount: -100 })).toThrow();
  });

  it("ควรแจ้งเตือน Error เมื่อยอดเงินเป็น 0", () => {
    expect(() => generatePromptPayPayload({ target: "0812345678", amount: 0 })).toThrow();
  });

  it("ควรคืนค่าผลลัพธ์เหมือนเดิมเสมอ หากใส่ข้อมูลเดิม (Deterministic)", () => {
    const input = { target: "0812345678", amount: 100 };
    const result1 = generatePromptPayPayload(input);
    const result2 = generatePromptPayPayload(input);
    expect(result1).toBe(result2);
  });

  it("ควรแปลงเบอร์โทรศัพท์ให้ขึ้นต้นด้วย 0066 ได้ถูกต้อง", () => {
    const result = generatePromptPayPayload({ target: "0987654321" });
    expect(result).toContain("0066987654321");
    expect(result).not.toContain("0987654321");
  });

  it("ควรแจ้งเตือน Error เมื่อเบอร์โทรศัพท์มีไม่ถึง 10 หลัก", () => {
    expect(() => generatePromptPayPayload({ target: "081234567" })).toThrow("ข้อมูลไม่ถูกต้อง");
  });

  it("ควรแจ้งเตือน Error เมื่อเลขบัตรประชาชนมีไม่ถึง 13 หลัก", () => {
    expect(() => generatePromptPayPayload({ target: "123456789012" })).toThrow("ข้อมูลไม่ถูกต้อง");
  });

  it("ควรคำนวณค่า CRC-16 Checksum ได้ถูกต้องเป๊ะๆ", () => {
    const expectedPayloadBeforeCrc = 
      "000201" + // รูปแบบ Payload
      "010211" + // รูปแบบ QR (11 = Static)
      "2937" + // ข้อมูลบัญชีผู้รับเงิน (PromptPay)
      "0016A000000677010111" + // รหัส GUID มาตรฐาน
      "01130066812345678" + // เบอร์โทรศัพท์
      "5802TH" + // รหัสประเทศ (TH)
      "5303764" + // สกุลเงินบาท (764)
      "6304"; // ตำแหน่งค่า CRC-16
    
    const result = generatePromptPayPayload({ target: "0812345678" });
    const payloadBeforeCrc = result.slice(0, -4);
    
    expect(payloadBeforeCrc).toBe(expectedPayloadBeforeCrc);
    
    const crcHex = result.slice(-4);
    expect(crcHex).toBe("5D82");
  });
});