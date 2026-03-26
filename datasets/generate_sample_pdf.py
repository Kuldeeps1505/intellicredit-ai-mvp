"""
Generates a realistic sample Annual Report PDF for IntelliCredit AI testing.
Uses only reportlab (already in most Pythonfpdf2.

Rune_pdf.py
"""
import oss

OUT = os.path.jo")

# ── Try reportlab first ────────────────────
try:
    from reportlab
    from reportlab.lib.styles import get
    from reportlab.lib.units imp cm
    from reportlab.lib import colors
    from reportlab


    doc = SimpleDocTemp=1.5*cm,
                            leftMargin=1.5
    styles = getSampleStyleSheet()
    blue = colors.HexColor("#1e40af")
f")

    H1 = ParagraphStyle("H1", parent=styles
    H2 = ParagraphStyle("H2", parent=style
    BODY = ParagraphStyle("BODY", parent

    def tbl(data, col_widths, header
        t = Table(_widths)
 = [
            ("FONTNAME",  (0,0), (-1,0 if headeld"),
            ("FONTSIZE",  (0,0), (-1,-1),
            ("BACKGROUND",(0,0), (-1,0), blue),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("GRID",      (0,0), (-1,-1), 0.y),
]),
            ("ALIGN",     (1,0), (-1,-1),GHT"),
            ("ALIGN",     (0,0), (0,-1), "LEFT"),
            ("TOPPADDING",(0,0), (-1,-1)
            ("BOTTOMPADDING",(0,0), (-1,-1,
        ]
        t.setStyle(TableStyle(style))
        return t


    story = []

    # Title
    story.append(Paragraph("MERIDIAN TEXTILES 
    story.app)))
    story.append(Spacer(1, 0.4*cm))

    # Company Info
    story.append()
= [

        ["C],
        ["PAN",          "AABCM5678G"],
        ["GSTI,
        ["Sector",       "TEXTILE
"],
        ["Incorporation","15 March 2019"],
        ["Paid-up Capital","₹6,50,000"],
    ]
    t = Ta])
    t.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,-1)
        ("FONTNAME",(0,0),(0,-,
        ("GRID",(0,0),(-1,-1),0.3,colors.lightgrey),
        (),
        ("TOPPADDING",(0,0),(-1,-1),3),
    ]))
cm))

    # Directors
    story.append(Paragraph("Board of Directors", H2))
    dirs = [
        ["Name", "Designation", "DIN"],
        ["Mr. Rajesh Kumar Sharma", "Managing Di"],
        ["Mrs. Priya Mehta",        "Director (Finance)", "00778899"],
        ["Mr. Suresh Patel",        "Ind"],
    ]
    story.append(tbl(dirs, [7*cm, 6*cm, 3*cm])); story.appm))

    # P&L
)
    pnl = [
        ["Particulars",                023-24"],
        ["Revenue from Operations",            "6,840",     "8,210",     ",750"],
        ["Other Income",                       "120",       "145",       "180"],
        ["Total Revenue / Net Sales",          "6,960",     "8,355",     "9,"],
        ["Cost of Materials Consumed",         "4,104",     "4,926",     "5,850"],
        [],

        ["Depreciation & Amortisation",        "205",       "247",       "293"],
        ["Other Operating Expenses",           "479",       
        ["EBITDA",                             "1,421",     "1,704",     "2,031"]
        ["Profit Before T"],
        ["Income Tax",        
        ],
    ]
    story.append(tbl(pnl, [8*cm, 3*cm, 3*cm, 3*cm])); story.append(S

    # Balance Sheet
    story.append(Paragraph("Balance Sheet as at 31 March 2024 (₹ in 
    bs = [
        ["Particulars",                "FY 2021-22","FY 2022-23","FY"],
        ["Share Capital",              "650",       "650",       "65
        ["Reserves & Surplus",         "2,180",     "2,963",     "3,89
        ["Total Net Worth / Equity",   "2,830",     "3,613",     "4,54,
        ["Long-Term Borrowings",       "1,890",     "2,268",     "2,72,
        ["Short-Term Borrowings",      "1,260",     "1,512",     "1,4"],
        ["Total Current Liabilities",  "1,026",     "1,232",     "1,"],
 
        ["Fixed Assets / PPE ("],
        ["Total Non-Current Assets",   "3,292",     "4,054",     "4,956"],
        ["Inventories",                "1,261",     "1,553", 8"],
        ["],
,
        ["Total Current Assets",       "3,714",     "4,571",     "5,590"],
        ["TOTAL ASSETS",               "7,006",     "8,625",     "10,546"],
    ]
    story.append(tbl(bs, 

    # Cash Flow
    story.append(Paragraph("Cash Flow Statement (₹ in Lakhs)", H)
    cf = [
        ["Particulars",                    "FY 2021-22","FY 2022-23",
        ["Cash from Operations (CFO)",     "820",       "984",       ,
        ["Cash from Investing (CFI)",      "(336)",     "(403)",     
        ["Cash from Financing (CFF)",      "(315)",     "(378)",     
        ["Net Change in Cash",             "169",       "203",     
        ["Closing Cash Balance",           "525",       "647",     
    ]
    story.append(tbl(cf, [8*cm, 3*cm, 3*cm, 3*cm])); story.append(Spac

    # Ratios
    story.append(Paragraph("Key Financial Ratios", H2))
    ratios = [
        ["Ratio",                    "FY 2021-22","FY 2022-23","FY 20rk"],
        ["Current Ratio",            "1.62",      "1.71",      "1.82"5"],
        ["Quick Ratio",              "1.21",      "1.30",      "1.40"1.0"],
        ["Debt / Equity Ratio",      "1.11",      "1.05",      "0.9
        ["Interest Coverage Ratio",  "3.54",      "3.64",      "3.7 2.5"],
        ["DSCR",                     "1.52",      "1.58",      "1.65"
        ["EBITDA Margin",            "20.4%",     "20.4%",     "20.5%""],
 ,
        ["Return on Equity",     "≥ 12%"],
        ["Receivables Days",         "74",        "76",        "79",        "≤ 90"],
        ["Inventory Days",           "67",        "69", "],
    ]
    storym))

    # Loan Request
    story.append(Paragraph("Loan Application Details", H2))
    loan = [
        ["Loan Amount Req
        ["Purpose",           
        ["P,
        ["Collateral Offered",     "Equitable mortgage of factory prems"],
        ["Existing Banker",        "State Bank of India, Bhiwandi Bran
        ["Credit Rating",          "BBB+ (CRISIL, FY2024)"],
    ]
    t2 = Table(loan, colWidths=[5*cm, W-5*cm])
    t2.setStyle(TableStyle([
 ,9),
        ("FONTNAME",(0,0),(0,-1),
        ("GRID",(0,0),(-1,-1),0.3,colors.lightgrey),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[colors.white, colors]),
        (

    story.append(t2); story.append(Spacer(1, 0.3*cm))

    # Auditor note
    story.append(Paragraph("S))
    story.append(Paragraph(
        "We, M "
        "statements of Meridian Textiles & Fabrics Pvt Ltd for FY 2023-24. In ol "
        "statements give a true and fair view. GST returns (GSTR-1, GSTR-3B) ar no "
        "material ITC variance. Income Tax Returns for AY 2024-25 have been filtion "
        "of material nature. Total debt as at 31 March 2024: ₹4,536 Lakhs. Net 
        BODY
    ))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph("For M/s Kapoor & Associates | CA Ramesh Kapoor (M.NODY))

    doc.build(story)
    print(f"✅ PDF generated using reportlab: {OUT}")

e
    # ── Fallback: minimal valid PDF─
    print("reportlab not found — generating minima...")

-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>end
3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Re R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
"""

    text_lines = [
        "MERIDIAN TEXTILES & FABRICS PVT LTD",
        "24",

        "CIN: U17291MH2019PTC234567",
        "PAN: AABCM5678G",
        "GSTIN: 27AABCM5678G1Z3"
        "Sector: TEX,
        "Address: Plot 45 MIDC Bhiwandi Maharashtra 421302",
        "",
        "PROFIT & LOSS (Rs in Lakhs)",
        "Revenue from Operations FY24: 9750",
        "Total Revenue / Net Sales: 9930",
        "EBITDA: 2031",
        "Net Profit / Profit After Tax (PAT): 934",
        "",
 )",
        ",
        "Total Debt / Long-Term B
        "Total Assets: 10546",
        "Current Assets: 5590",
        "Current Liabilities: 1463",
0",
      
        "LOAN REQUEST",
        "Loan Amount
        "Purpose: Working capital expansion ,
        "",
")
500L Rs oan:E | LEXTIL Sector: T8G1Z3 |M567AABC"GSTIN: 27(frintd")
pt Ltics Pvtiles & Fabrn Texny: MeridiaCompa
print(f"ine.")l pipelthe fulto test ad plot:3000/up://localhosttat h file d thisoa\nUplf"print(UT}")

ated: {Ogenernimal PDF t(f"✅ Mi   prinnt)
 ite(conte       f.wr
 ") as f:atin-1ing="lod"w", encn(OUT, th ope

    win%%EOF\n"\rtxref\n0sta1 0 R>>\n/Root <</Size 6"trailertent += 
    con535 f\n"00 656\n00000000\n0 reftent += "x  con\n"
  bjendoam\nm}\nendstrem\n{streaeastr\n}>>eam)en(str {l/Length obj<<t += f"5 0   contenines)

 stream_l\n".join(= "    stream )
end("ET".app_lines stream 8
   if line else= 14       y - Td")
  8}lse if line e"-50 -{14 nd(fes.appetream_lin
        safe}) Tj")f"({sppend(eam_lines.atr
        s\\\\")\\","ace("\\)").repl")","e().replac\(","\lace("("ine.repafe = l)
        s50 {y} Td"end(f"es.appam_lintre        s:
text_linesline in )
    for  11 Tf"/F1pend("nes.apeam_li str"BT")
   ines.append(tream_l  s y = 800
   = []
   am_lines    stre
    ]

",egularly.ns filed rtur GST reation.erial litigNo mat"        ",
56Woor FRN 1234esh KapRams CA ciate & Asso M/s Kapoorr:"Audito     "",
     e",
      or Financ99 Direct788DIN 007 Mehta yaPri  "Mrs.     tor",
  ecir Managing D0445566ma DIN 0 Kumar SharMr. Rajesh       "RS",
 "DIRECTO        