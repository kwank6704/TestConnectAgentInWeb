import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')  # ✅ แก้ UnicodeEncodeError

import re
import json
from decimal import Decimal, InvalidOperation

def summarize_advanced(text: str) -> str:
    summary = {}

    company_match = re.search(r'บริษัท\s+(.+?)\s+จำกัด', text)
    summary['company'] = company_match.group(1).strip() if company_match else "ไม่พบ"

    payee_match = re.search(r'Pay to\s+(.*)', text)
    summary['payee'] = payee_match.group(1).strip() if payee_match else "ไม่พบ"

    date_match = re.search(r'Date Printed:\s+([\d/]+)', text)
    summary['date'] = date_match.group(1).strip() if date_match else "ไม่พบ"

    doc_match = re.search(r'Document No.\s+([^\s]+)', text)
    summary['doc_no'] = doc_match.group(1).strip() if doc_match else "ไม่พบ"

    total_match = re.search(r'TOTALS\s+([\d,]+\.\d+)', text)
    summary['total'] = total_match.group(1).strip() if total_match else "0.00"

    entry_regex = re.compile(
        r'\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*([\d,]+\.\d+)?\s*\|'
    )
    entries = entry_regex.findall(text)

    parsed_entries = []
    account_totals = {}
    debit_total = Decimal(0)
    credit_total = Decimal(0)

    for entry in entries:
        line, code, desc, note, amount_str = entry
        try:
            amount = Decimal(amount_str.replace(',', '')) if amount_str else Decimal(0)
        except InvalidOperation:
            amount = Decimal(0)

        parsed_entries.append({
            "line": line,
            "account_code": code,
            "description": desc.strip(),
            "note": note.strip(),
            "amount": float(amount)
        })

        account_totals[code] = account_totals.get(code, Decimal(0)) + amount

        if code.startswith("21"):
            if code.startswith("2154"):
                debit_total += amount
            elif code.startswith("2111"):
                credit_total += amount

    summary['entries'] = parsed_entries
    summary['account_totals'] = {k: float(v) for k, v in account_totals.items()}
    summary['debit_total'] = float(debit_total)
    summary['credit_total'] = float(credit_total)
    summary['balance_ok'] = debit_total == credit_total

    insights = []

    if summary['balance_ok']:
        insights.append("✅ บัญชีสมดุล เดบิตและเครดิตตรงกัน")
    else:
        insights.append("⚠️ บัญชีไม่สมดุล กรุณาตรวจสอบ")

    if "ADV" in text:
        insights.append("📌 รายการเกี่ยวกับการคืนเงินค่าใช้จ่ายส่วนเกิน (Advance)")

    if any("Instrumentation" in e['note'] for e in parsed_entries):
        insights.append("🔧 เกี่ยวข้องกับงาน Instrumentation หลายโครงการ")

    if "ภาษีซื้อ" in text and "0.00" in text:
        insights.append("🧾 ไม่มีการบันทึกภาษีซื้อในการชำระครั้งนี้")

    summary['insights'] = insights

    return json.dumps(summary, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({ "error": "กรุณาระบุ path ของไฟล์ข้อความ OCR" }, ensure_ascii=False))
        sys.exit(1)

    try:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            ocr_text = f.read()
        print(summarize_advanced(ocr_text))
    except Exception as e:
        print(json.dumps({ "error": f"เกิดข้อผิดพลาด: {str(e)}" }, ensure_ascii=False))
        sys.exit(1)
