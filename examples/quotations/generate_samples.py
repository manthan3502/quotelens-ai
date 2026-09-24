from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUTPUT = Path(__file__).resolve().parent
FONT_REGULAR = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"


def font(size: int, bold: bool = False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def draw_lines(draw, items, x, y, width, row_height=54):
    for label, value in items:
        draw.text((x, y), label.upper(), font=font(19, True), fill="#69716D")
        draw.text((x + width, y), value, font=font(23), fill="#17221E", anchor="ra")
        y += row_height
        draw.line((x, y - 13, x + width, y - 13), fill="#DDE3DF", width=2)
    return y


def make_northstar_pdf():
    path = OUTPUT / "northstar-systems-quotation.pdf"
    styles = getSampleStyleSheet()
    document = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=17 * mm, bottomMargin=17 * mm)
    story = [
        Paragraph("<font color='#176B4D'><b>NORTHSTAR SYSTEMS</b></font>", styles["Title"]),
        Paragraph("Fictional supplier quotation - demonstration data only", styles["Normal"]),
        Spacer(1, 8 * mm),
        Table([
            ["QUOTATION", "NS-2026-0912"],
            ["DATE", "12 September 2026"],
            ["VALID UNTIL", "12 October 2026"],
            ["CUSTOMER", "Example College Procurement Team"],
        ], colWidths=[42 * mm, 105 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E9F4EE")),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#10513A")),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDE3DF")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ])),
        Spacer(1, 9 * mm),
        Table([
            ["Description", "Qty", "Unit price", "Tax", "Amount"],
            ["Aster Pro 14 business laptop\n16 GB RAM / 512 GB SSD", "10", "INR 52,000", "GST 18%", "INR 520,000"],
        ], colWidths=[75 * mm, 15 * mm, 30 * mm, 23 * mm, 30 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17221E")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDE3DF")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ])),
        Spacer(1, 8 * mm),
        Table([
            ["Subtotal", "INR 520,000"],
            ["Shipping", "FREE"],
            ["GST 18%", "INR 93,600"],
            ["GRAND TOTAL", "INR 613,600"],
        ], colWidths=[112 * mm, 50 * mm], hAlign="RIGHT", style=TableStyle([
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E9F4EE")),
            ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#176B4D")),
            ("PADDING", (0, 0), (-1, -1), 7),
        ])),
        Spacer(1, 11 * mm),
        Paragraph("<b>Commercial terms</b>", styles["Heading2"]),
        Paragraph("Delivery: Within 7 days of confirmed order", styles["Normal"]),
        Paragraph("Warranty: 1 year onsite warranty", styles["Normal"]),
        Paragraph("Payment: 50% advance, balance before dispatch", styles["Normal"]),
        Spacer(1, 18 * mm),
        Paragraph("Northstar Systems is a fictional company. GST-FICTIONAL-NS01", styles["Italic"]),
    ]
    document.build(story)


def make_pixelpeak_png():
    image = Image.new("RGB", (1200, 1500), "#F5F0FF")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((55, 55, 1145, 1445), radius=34, fill="white", outline="#DDD1F2", width=3)
    draw.rectangle((55, 55, 1145, 260), fill="#5C32A3")
    draw.text((105, 100), "PIXELPEAK SUPPLY", font=font(48, True), fill="white")
    draw.text((105, 175), "QUOTATION PPS/Q/774", font=font(24), fill="#E7DDF7")
    draw.text((1090, 175), "14 SEP 2026", font=font(23, True), fill="white", anchor="ra")
    draw.text((105, 315), "YOUR ORDER AT A GLANCE", font=font(22, True), fill="#5C32A3")
    draw.rounded_rectangle((95, 365, 1105, 610), radius=20, fill="#F8F5FC")
    draw.text((135, 410), "ASTER PRO 14", font=font(36, True), fill="#17221E")
    draw.text((135, 468), "16GB memory / 512GB SSD", font=font(24), fill="#69716D")
    draw.text((135, 535), "10 PCS  x  INR 49,500", font=font(28, True), fill="#5C32A3")
    y = draw_lines(draw, [
        ("Equipment subtotal", "INR 495,000"),
        ("GST 18%", "INR 89,100"),
        ("Shipping", "INR 2,000"),
    ], 120, 690, 960, 72)
    draw.rounded_rectangle((95, y + 20, 1105, y + 130), radius=20, fill="#17221E")
    draw.text((135, y + 55), "TOTAL PAYABLE", font=font(24, True), fill="#CBB8EC")
    draw.text((1065, y + 55), "INR 586,100", font=font(36, True), fill="white", anchor="ra")
    y += 190
    draw.text((105, y), "TERMS", font=font(22, True), fill="#5C32A3")
    y += 55
    for line in ["Delivery: 15 working days", "Warranty: 3 year manufacturer warranty", "Payment: 100% before delivery", "Offer valid for 15 days"]:
        draw.ellipse((110, y + 8, 122, y + 20), fill="#5C32A3")
        draw.text((145, y), line, font=font(23), fill="#17221E")
        y += 52
    draw.text((105, 1375), "Fictional demo supplier | GST-FICTIONAL-PP02 | +91 90000 00002", font=font(18), fill="#69716D")
    image.save(OUTPUT / "pixelpeak-supply-quotation.png", optimize=True)


def make_cedar_jpg():
    image = Image.new("RGB", (1200, 1500), "#FFFDF7")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1200, 22), fill="#B76B2A")
    draw.text((75, 75), "CEDAR", font=font(62, True), fill="#743D15")
    draw.text((75, 145), "OFFICE TECH", font=font(26, True), fill="#B76B2A")
    draw.text((1125, 90), "QUOTE COT-1188", font=font(25, True), fill="#17221E", anchor="ra")
    draw.text((1125, 137), "15 September 2026", font=font(21), fill="#69716D", anchor="ra")
    draw.line((75, 225, 1125, 225), fill="#D8C6B4", width=3)
    draw.text((75, 280), "Prepared for", font=font(19, True), fill="#69716D")
    draw.text((75, 318), "Example College Procurement Team", font=font(26), fill="#17221E")
    draw.rounded_rectangle((75, 415, 1125, 780), radius=10, outline="#D8C6B4", width=3)
    draw.rectangle((75, 415, 1125, 485), fill="#F2E7D9")
    draw.text((105, 437), "ITEM", font=font(19, True), fill="#743D15")
    draw.text((670, 437), "QTY", font=font(19, True), fill="#743D15")
    draw.text((925, 437), "UNIT", font=font(19, True), fill="#743D15", anchor="ra")
    draw.text((1090, 437), "TOTAL", font=font(19, True), fill="#743D15", anchor="ra")
    draw.text((105, 535), "Aster Pro-14 laptop bundle", font=font(28, True), fill="#17221E")
    draw.text((105, 585), "Laptop + sleeve + wireless mouse", font=font(22), fill="#69716D")
    draw.text((670, 535), "10 sets", font=font(24), fill="#17221E")
    draw.text((925, 535), "INR 54,000", font=font(24), fill="#17221E", anchor="ra")
    draw.text((1090, 535), "INR 540,000", font=font(24, True), fill="#17221E", anchor="ra")
    draw.text((105, 685), "Prices inclusive of applicable GST", font=font(22, True), fill="#B76B2A")
    draw.text((105, 730), "Tax rate and amount not separately itemized", font=font(20), fill="#69716D")
    draw.text((650, 850), "Shipping", font=font(23), fill="#69716D")
    draw.text((1090, 850), "INR 8,000", font=font(24), fill="#17221E", anchor="ra")
    draw.rounded_rectangle((620, 920, 1125, 1040), radius=12, fill="#743D15")
    draw.text((655, 958), "QUOTED TOTAL", font=font(21, True), fill="#E7CDB6")
    draw.text((1090, 953), "INR 548,000", font=font(32, True), fill="white", anchor="ra")
    draw.text((75, 1115), "DELIVERY", font=font(18, True), fill="#B76B2A")
    draw.text((75, 1150), "Approx. 10 days", font=font(23), fill="#17221E")
    draw.text((410, 1115), "WARRANTY", font=font(18, True), fill="#B76B2A")
    draw.text((410, 1150), "Standard 1 year", font=font(23), fill="#17221E")
    draw.text((720, 1115), "PAYMENT", font=font(18, True), fill="#B76B2A")
    draw.text((720, 1150), "30% order / balance delivery", font=font(21), fill="#17221E")
    draw.line((75, 1300, 1125, 1300), fill="#D8C6B4", width=2)
    draw.text((75, 1340), "44 Example Market, Pune | Fictional demonstration data", font=font(19), fill="#69716D")
    image.save(OUTPUT / "cedar-office-tech-quote.jpg", quality=92, optimize=True)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    make_northstar_pdf()
    make_pixelpeak_png()
    make_cedar_jpg()
