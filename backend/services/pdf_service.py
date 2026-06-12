import os
from pathlib import Path

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def _render_template(template_name: str, context: dict) -> str:
    path = TEMPLATES_DIR / template_name
    html = path.read_text(encoding="utf-8")
    for key, value in context.items():
        html = html.replace(f"{{{{ {key} }}}}", str(value) if value is not None else "")
    # Handle simple {% if %} blocks for optional fields
    import re
    def replace_if_block(m):
        var = m.group(1).strip()
        body = m.group(2)
        return body if context.get(var) else ""
    html = re.sub(r"\{%\s*if\s+(\w+)\s*%\}(.*?)\{%\s*endif\s*%\}", replace_if_block, html, flags=re.DOTALL)
    return html


def generate_receipt_pdf(
    receipt_id: str,
    invoice_title: str,
    invoice_id: str,
    amount: float,
    payer_name: str,
    payer_wallet: str,
    payee_name: str,
    payee_wallet: str,
    tx_hash: str,
    confirmed_at: str,
    ai_receipt: str | None = None,
) -> bytes:
    context = {
        "receipt_id": receipt_id,
        "invoice_title": invoice_title,
        "invoice_id": invoice_id,
        "amount": f"{amount:.2f}",
        "payer_name": payer_name,
        "payer_wallet": payer_wallet or "N/A",
        "payee_name": payee_name,
        "payee_wallet": payee_wallet or "N/A",
        "tx_hash": tx_hash or "N/A",
        "confirmed_at": confirmed_at,
        "ai_receipt": ai_receipt or "",
    }
    html = _render_template("receipt.html", context)

    try:
        import weasyprint
        pdf_bytes = weasyprint.HTML(string=html).write_pdf()
        return pdf_bytes
    except Exception:
        # WeasyPrint unavailable (e.g. missing system libs) — return HTML as bytes fallback
        return html.encode("utf-8")
