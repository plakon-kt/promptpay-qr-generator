
import { generatePromptPayPayload } from "../../src/lib/promptpay";

// ใน Cloudflare จะใช้ฟังก์ชัน onRequestPost สำหรับรับ POST request
export async function onRequestPost(context: any) {
  try {
    // อ่านข้อมูล JSON ที่ส่งมาจาก Frontend
    const body = await context.request.json();
    console.log("📥 [Backend] ได้รับข้อมูล JSON จาก Frontend:", body);
    
    const { target, amount } = body;

    // เรียกใช้ฟังก์ชันเดิม
    const payload = generatePromptPayPayload({ 
      target, 
      amount: amount ? Number(amount) : undefined 
    });

    // ส่งข้อมูลกลับเป็น JSON
    return new Response(JSON.stringify({ payload }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// เพิ่มฟังก์ชัน onRequestGet สำหรับรับ GET request
export async function onRequestGet(context: any) {
  try {
    const url = new URL(context.request.url);
    const target = url.searchParams.get("target");
    const amount = url.searchParams.get("amount");

    if (!target) {
      throw new Error("กรุณาระบุ target ใน URL เช่น ?target=0812345678");
    }

    const payload = generatePromptPayPayload({ 
      target, 
      amount: amount ? Number(amount) : undefined 
    });

    return new Response(JSON.stringify({ payload }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
