type TargetType = "phone" | "national_id";


function tlv(tag: string, value: string): string{
    const length = value.length.toString().padStart(2, "0");
    return tag + length + value;
}
function isValidThaiID(id: string): boolean {
    if (!id || id.length !== 13 || isNaN(Number(id))) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(id.charAt(i)) * (13 - i);
    }
    const mod = sum % 11;
    const checkDigit = (11 - mod) % 10;
    return checkDigit === parseInt(id.charAt(12));
}

function formatTarget(rawInput: string): { type: TargetType; formattedValue: string } {
    // เอาเฉพาะตัวเลขออกมาจาก rawinput ตัด "-" , "" ทิ้ง
    const digitsOnly = rawInput.replace(/\D/g, "");
    // เช็คความยาวว่าเป็น 10 หลักรึป่าวและถ้าขึ้นต้นด้วย 0 ไหมถ้าใช้ก็เท่ากับ เบอร์โทร
    if(digitsOnly.length === 10 && /^0[689]/.test(digitsOnly)) {
        const formattedValue = "0066" + digitsOnly.slice(1); //ตัด 0 ตัวแรกออก แล้วเติม 0066 ข้างหน้า
        return { type: "phone", formattedValue };
    }
    // เช็คความยาวว่าเป็น 13 หลักรึป่าวถ้าใช่ก็เท่ากับ เลขบัตรปชช
    if(digitsOnly.length === 13) {
        if (!isValidThaiID(digitsOnly)) {
            throw new Error("เลขบัตรประชาชนไม่ถูกต้อง");
        }
        return { type: "national_id", formattedValue: digitsOnly };
    }
    // ถ้าไม่เข้าเงื่อนไขทั้งสองอันจะแจ้งเตือนว่า ข้อมูลไม่ถูกต้อง
    throw new Error("ข้อมูลไม่ถูกต้อง: ต้องเป็นเบอร์โทรศัพท์ (ขึ้นต้นด้วย 06, 08, 09) หรือ เลขบัตรประชาชน 13 หลัก");
    
}

function crc16(input: string): string{
    let crc = 0xffff; //ค่าตั้งต้นของ CRC (ค่าที่ใช้ในการคำนวณ)

    for (let i = 0; i < input.length; i++){
        crc ^= input.charCodeAt(i) << 8; // เอา ASCII code ของตัวอักษร เลื่อนซ้าย 8 bit แล้ว XOR เข้า crc
        // ประมวลผลทีละ byte ของ string → XOR และ bit shift ทั้งหมด 8 รอบต่อ byte
        for (let bit = 0; bit < 8; bit++) {
            // เช็ค bit ซ้ายสุดบิตที่ 16 หรือ 0x8000) ว่าเป็น 1 รึป่าว
            if ((crc & 0x8000) !== 0) {
                // ถ้าเป็นเลข 1 ให้เลื่อนซ้าย 1 บิต แล้ว XOR ด้วย 0x1021 
                crc = (crc << 1) ^ 0x1021;
            } else {
                // ถ้าเป็นเลข 0 ให้เลื่อนซ้าย 1 บิตเฉยๆ
                crc = crc << 1;
            }
            // บังคับให้ค่า crc อยู่ในกรอบของ 16-bit ตัดบิตที่เกินทิ้ง เพื่อไม่ให้ค่าเพื้ยนใน JavaScript
            crc &= 0xffff; 
        }
    }
    // แปลง crc เป็น 16หลัก ตัวใหญ่ ความยาว 4 หลัก (เติม 0 ข้างหน้าถ้าไม่ครบ)
    return crc.toString(16).toUpperCase().padStart(4, "0"); //ผลลัพธ์: ค่า hex 4 หลัก ตัวพิมพ์ใหญ่ (เช่น "5D82")
}

export interface GeneratePayloadOptinos {
    target: string;
    amount?: number;
}

export function generatePromptPayPayload({ target, amount }: GeneratePayloadOptinos):
string {
    const { type, formattedValue } = formatTarget(target);
    // GUID สำหรับ PromptPay คือ A000000677010111 มันคือสำหรับ การโอนเงินทั่วไป (เป็นมาตรฐานของธนาคารแห่งประเทศไทย)
    const GUID = "A000000677010111";
    const targetTag = type === "phone" ? "01" : "02";
    // สร้าง merchantAccountInfo: tlv("00", GUID) + tlv("01" หรือ "02", formattedValue)
    const merchantAccountInfo = tlv("00", GUID) + tlv(targetTag, formattedValue);
    // เช็คว่ามีการส่งค่า amount มาหรือไม่ (เพื่อป้องกันเคสส่ง 0 มาแล้วกลายเป็น falsy)
    const hasAmount = amount !== undefined;
    if (hasAmount && amount <= 0) {
        throw new Error("จำนวนเงินต้องมากกว่า 0");
    }
    // ถ้ามีระบุยอดเงิน (amount) จะเป็น "12" (Dynamic) ถ้าไม่มีจะเป็น "11" (Static)
    const poiMethod = hasAmount ? "12" : "11";

    // สร้าง array ของ fields ทั้งหมดตามตาราง (00, 01, 29, 58, 53)
    const fields = [
        tlv("00","01"),                     // Payload Format Indicator (01 เสมอ) *
        tlv("01", poiMethod),               // Point of Initiation Method
        tlv("29", merchantAccountInfo),     // ข้อมูลบัญชีผู้รับเงิน (PromptPay) *
        tlv("58", "TH"),                    // Country Code (ไทย = TH) *
        tlv("53", "764"),                   // Transaction Currency (เงินบาท = 764) *
    ];
    //ถ้ามี amount ให้ format เป็นทศนิยม 2 ตำแหน่งด้วย amount.toFixed(2) แล้วเติมเป็น tag 54 ถูกกำหนดไว้สำหรับเก็บข้อมูล Transaction Amount
    if (hasAmount) {
        fields.push(tlv("54", amount.toFixed(2))); // Amount
    }
    // นำทุก fields มารวมกันแล้วต่อ "6304" ข้างท้าย (6304 คือ tag สำหรับ CRC)
    // "63" คือ Tag ของ CRC และ "04" คือความยาว (4 หลัก)
    const payloadBeforeCrc = fields.join("") + "6304";
    // คำนวณค่า CRC16 จาก payloadBeforeCrc
    const crc = crc16(payloadBeforeCrc);
    // นำ payloadBeforeCrc ต่อกับค่า crc ที่ได้
    // return payload + crc
    return payloadBeforeCrc + crc;
}