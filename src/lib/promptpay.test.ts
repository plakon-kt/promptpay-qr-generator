import { describe, expect, it } from "vitest";
import { generatePromptPayPayload } from "./promptpay";

describe("generatePromptPayPayload", () => {
  // it("อธิบายว่าเทสนี้เช็คอะไร", () => {
  //   expect(ผลลัพธ์ที่ได้).toBe(ผลลัพธ์ที่คาดหวัง);
  // });
  it("should generate payload for mobile number (0812345678) without amount", () => {
    const expected = 
      "000201" + // Payload Format Indicator
      "010211" + // Point of Initiation Method (Static)
      "2937" + // Merchant Account Information
      "0016A000000677010111" + // GUID
      "01130066812345678" + // Mobile
      "5802TH" + // Country Code
      "5303764" + // Currency
      "6304" + // CRC placeholder
      "5D82"; // CRC
    
    const result = generatePromptPayPayload({ target: "0812345678" });
    expect(result).toBe(expected);
    
    expect(result.length).toBe(74);
    expect(result.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
  });

  it("should generate payload for Thai National ID without amount", () => {
    const expected = 
      "000201" + // Payload Format Indicator
      "010211" + // Point of Initiation Method (Static)
      "2937" + // Merchant Account Information
      "0016A000000677010111" + // GUID
      "02131234567890123" + // National ID
      "5802TH" + // Country Code
      "5303764" + // Currency
      "6304" + // CRC placeholder
      "EC40"; // CRC
    
    const result = generatePromptPayPayload({ target: "1234567890123" });
    expect(result).toBe(expected);
    expect(result.length).toBe(74);
  });

  it("should generate payload with amount for mobile number", () => {
    const result = generatePromptPayPayload({ target: "0812345678", amount: 100 });
    expect(result).toContain("010212"); // Dynamic QR
    expect(result).toContain("0016A000000677010111"); // GUID
    expect(result).toContain("5406100.00"); // Amount tag 54, len 06, val 100.00
    expect(result.length).toBe(84);
  });

  it("should generate payload with decimal amount", () => {
    const result = generatePromptPayPayload({ target: "0812345678", amount: 100.5 });
    expect(result).toContain("5406100.50");
    expect(result.length).toBe(84);
  });

  it("should throw error for invalid input (too short)", () => {
    expect(() => generatePromptPayPayload({ target: "123" })).toThrow();
  });

  it("should throw error for invalid input (non-Thai format)", () => {
    expect(() => generatePromptPayPayload({ target: "123456789012345" })).toThrow();
  });

  it("should throw error for negative amount", () => {
    expect(() => generatePromptPayPayload({ target: "0812345678", amount: -100 })).toThrow();
  });

  it("should throw error for zero amount", () => {
    expect(() => generatePromptPayPayload({ target: "0812345678", amount: 0 })).toThrow();
  });

  it("should return same string for same valid input", () => {
    const input = { target: "0812345678", amount: 100 };
    const result1 = generatePromptPayPayload(input);
    const result2 = generatePromptPayPayload(input);
    expect(result1).toBe(result2);
  });

  it("should use corrected 0066 prefix for Thai phone numbers", () => {
    const result = generatePromptPayPayload({ target: "0987654321" });
    expect(result).toContain("0066987654321");
    expect(result).not.toContain("0987654321");
  });

  it("should throw for Thai phone number with less than 10 digits", () => {
    expect(() => generatePromptPayPayload({ target: "081234567" })).toThrow("ข้อมูลไม่ถูกต้อง");
  });

  it("should throw for ID with less than 13 digits", () => {
    expect(() => generatePromptPayPayload({ target: "123456789012" })).toThrow("ข้อมูลไม่ถูกต้อง");
  });

  it("should validate CRC16 calculation", () => {
    const expectedPayloadBeforeCrc = 
      "000201" + // Payload Format Indicator
      "010211" + // Point of Initiation Method (Static)
      "2937" + // Merchant Account Information
      "0016A000000677010111" + // GUID
      "01130066812345678" + // Mobile
      "5802TH" + // Country Code
      "5303764" + // Currency
      "6304"; // CRC placeholder
    
    const result = generatePromptPayPayload({ target: "0812345678" });
    const payloadBeforeCrc = result.slice(0, -4);
    
    expect(payloadBeforeCrc).toBe(expectedPayloadBeforeCrc);
    
    const crcHex = result.slice(-4);
    expect(crcHex).toBe("5D82");
  });
});