"""
Dedicated 2-Variant ATS-Safe CV PDF Generator for Léo Lombardini.
Built faithfully from Léo's updated November 2026 CV (leo.lombardini@edhec.com):
  - Variant A ('trading'): Trading / Structuring / Sales FICC / Macro Research
  - Variant B ('buyside'): Asset Management / Portfolio Management / Hedge Fund Analyst / M&A
Uses Chrome headless print-to-pdf to generate crisp 1-page selectable-text PDFs matching his exact layout.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
from typing import Tuple

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

VARIANT_METADATA = {
    "trading": {
        "label": "CV A · Trading / Structuring / Sales FICC",
        "filename": "CV_Leo_Lombardini_Trading_Structuring.pdf",
    },
    "buyside": {
        "label": "CV B · Asset Management / Portfolio Mgmt / Hedge Fund",
        "filename": "CV_Leo_Lombardini_AM_PM_HedgeFund.pdf",
    },
}


def recommend_cv_variant(desk: str = "", title: str = "") -> str:
    combined = f"{desk or ''} {title or ''}".lower()
    buyside_kws = [
        "asset management", "portfolio", "gérant", "gerant", "hedge fund",
        "buy-side", "buyside", "wealth", "private banking", "private equity",
        "m&a", "corporate finance", "investment analyst", "fund", "gestion",
        "equity research", "economist", "strategy",
    ]
    if any(k in combined for k in buyside_kws):
        return "buyside"
    return "trading"


def _build_cv_html(variant: str) -> Tuple[str, str]:
    is_buyside = variant == "buyside"

    if is_buyside:
        summary = (
            "Master 1 Finance student at EDHEC Business School, combining a rigorous academic foundation in market finance "
            "with hands-on experience in portfolio allocation, macroeconomic research, and quantitative modeling. "
            "Highly driven to build a long-term career in Buy-Side &amp; Capital Markets, seeking a 6-month off-cycle "
            "internship starting in June 2027 across Asset Management, Portfolio Management, Hedge Fund Analysis or Macro Research."
        )
        horacle_bullets = [
            "<b>Capital Allocation &amp; Risk Management:</b> Actively manage a €30k personal portfolio across foreign exchange and equity indices under strict drawdowns and position-sizing rules.",
            "<b>Proprietary Research &amp; Analytics (Horacle Hub):</b> Built an end-to-end Python framework computing macro-scoring engines and cross-asset fair-value metrics; publish weekly research notes on institutional macro dynamics (horaclecapital.com).",
            "<b>Discretionary Macro FX Trading:</b> Trade G10 currency pairs driven by central bank balance sheet analysis, real interest rate differentials, economic surprise momentum, and liquidity cycles.",
            "<b>Systematic Index Strategies:</b> Design, backtest, and deploy algorithmic trading models on US equity indices (Python, MQL5), focusing on statistical mean-reversion, regime shifts, and volatility expansion.",
        ]
    else:
        summary = (
            "Master 1 Finance student at EDHEC Business School, combining a rigorous academic foundation in market finance "
            "with hands-on experience in macroeconomic research and quantitative modeling. "
            "Highly driven to build a long-term career in Capital Markets, seeking a 6-month off-cycle internship starting "
            "in June 2027 across Trading, Structuring, Asset Management or Macro Research."
        )
        horacle_bullets = [
            "<b>Discretionary Macro FX Trading:</b> Trade G10 currency pairs driven by central bank balance sheet analysis, real interest rate differentials, economic surprise momentum, and liquidity cycles.",
            "<b>Systematic Index Strategies:</b> Design, backtest, and deploy algorithmic trading models on US equity indices (Python, MQL5), focusing on statistical mean-reversion, regime shifts, and volatility expansion.",
            "<b>Capital Allocation &amp; Risk Management:</b> Actively manage a €30k personal portfolio across foreign exchange and equity indices under strict drawdowns and position-sizing rules.",
            "<b>Proprietary Research &amp; Analytics (Horacle Hub):</b> Built an end-to-end Python framework computing macro-scoring engines and cross-asset fair-value metrics; publish weekly research notes on institutional macro dynamics (horaclecapital.com).",
        ]

    plain_text = (
        "Léo Lombardini. leo.lombardini@edhec.com | +33 (0)7 85 42 69 11 | LinkedIn. "
        "Master 1 Finance student at EDHEC Business School (Nice, Programme Grande École, Finance Track, 09/2025-06/2029). "
        "Relevant coursework: Portfolio Construction with Python & Management, Corporate Finance & Company Valuation, "
        "Financial Markets & Instruments, Fixed Income & Derivatives, Advanced Macroeconomics. "
        "Lycée Jean Perrin Marseille ENS D2 Preparatory Class (Mathematics, Economics, Statistics). "
        "Seeking 6-month off-cycle internship starting June 2027 across Trading, Structuring, Asset Management, Portfolio Management, Hedge Fund or Macro Research. "
        "Horacle Capital Nice (10/2024 - Today), Founder and Independent Investor: "
        "Capital Allocation & Risk Management (€30k personal portfolio across FX and equity indices under strict drawdowns and position-sizing rules); "
        "Discretionary Macro FX Trading (G10 currency pairs, central bank balance sheet analysis, real interest rate differentials, economic surprise momentum, liquidity cycles); "
        "Systematic Index Strategies (algorithmic trading models on US equity indices in Python and MQL5, mean-reversion, regime shifts, volatility expansion); "
        "Proprietary Research & Analytics Horacle Hub (Python framework, macro-scoring engines, cross-asset fair-value, weekly notes on horaclecapital.com). "
        "Institut Paoli Calmettes Junior Accounting Assistant (treasury operations, payments, monthly bank reconciliations). "
        "Market Kom Agency Founder. Languages: French Native, English C1, Spanish Intermediate. "
        "Skills: Python (NumPy, Pandas, SciPy, Scikit-Learn), MQL5 (MetaTrader 5), Git, VS Code, Excel, Adobe Creative Suite, Claude Code, AI tools. "
        "Quantitative & Financial Expertise: Systematic Trading, Backtesting, Time Series Analysis, Statistical Modeling, Macroeconomic Forecasting. "
        "Interests: Long-distance Running (Marseille-Cassis 20km), Chess, Algorithmic Trading Systems, Perfumery."
    )

    bullets_html = "\n".join(f"<li>{b}</li>" for b in horacle_bullets)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @page {{ size: A4; margin: 10mm 13mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: "Times New Roman", Times, Georgia, serif;
    color: #111111;
    font-size: 9.6pt;
    line-height: 1.28;
    margin: 0;
  }}
  .header {{ text-align: center; border-bottom: 1.2px solid #111; padding-bottom: 5px; margin-bottom: 6px; }}
  h1 {{ font-size: 18pt; margin: 0 0 2px 0; font-weight: 700; letter-spacing: 0.01em; }}
  .contact {{ font-size: 9pt; color: #222; }}
  .summary {{ font-style: italic; text-align: center; margin: 5px 0 8px 0; font-size: 9.4pt; }}
  .sec-title {{
    font-size: 9.8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #111;
    margin: 8px 0 4px 0;
    padding-bottom: 1px;
  }}
  .row {{ display: flex; justify-content: space-between; font-weight: 700; margin-top: 3px; }}
  .dates {{ font-style: italic; font-weight: 400; font-size: 9.2pt; }}
  .sub {{ font-style: italic; font-size: 9.2pt; margin-bottom: 1px; }}
  ul {{ margin: 1.5px 0 4px 0; padding-left: 16px; }}
  li {{ margin-bottom: 1.5px; text-align: justify; }}
  .skills p {{ margin: 2px 0; }}
</style>
</head>
<body>
  <div class="header">
    <h1>Léo Lombardini</h1>
    <div class="contact">
      leo.lombardini@edhec.com &bull; +33 (0)7 85 42 69 11 &bull; LinkedIn
    </div>
  </div>

  <div class="summary">{summary}</div>

  <div class="sec-title">Education</div>
  <div class="row"><span>EDHEC - Master in Management (PGE) - Nice, France</span><span class="dates">09/2025 – 06/2029</span></div>
  <ul>
    <li>Master in Management - Finance Track</li>
    <li><b>Relevant coursework:</b> Portfolio Construction with Python &amp; Management, Corporate Finance &amp; Company Valuation, Financial Markets &amp; Instruments, Fixed Income &amp; Derivatives, Advanced Macroeconomics.</li>
  </ul>

  <div class="row"><span>Lycée Jean Perrin – Marseille, France</span><span class="dates">09/2023 – 07/2025</span></div>
  <ul>
    <li>ENS D2 Preparatory Class : Intensive two-year undergraduate program in Mathematics, Economics, and Statistics.</li>
  </ul>

  <div class="sec-title">Professional Experience</div>
  <div class="row"><span>Horacle Capital - Nice, France</span><span class="dates">10/2024 – Today</span></div>
  <div class="sub">Founder and Independent Investor</div>
  <ul>
    {bullets_html}
  </ul>

  <div class="row"><span>Institut Paoli Calmettes – Marseille, France</span><span class="dates">08/2025 – 08/2025</span></div>
  <div class="sub">Junior Accounting Assistant</div>
  <ul>
    <li>Supported treasury operations by processing corporate payments, executing accounting entries, and completing monthly bank reconciliations.</li>
  </ul>

  <div class="row"><span>Boucherie BEC – Marseille, France</span><span class="dates">04/2024 – 08/2025 (Weekends &amp; Academic Holidays)</span></div>
  <div class="sub">Butcher / Customer Service</div>
  <ul>
    <li>Managed high-volume customer transactions and strict hygiene standards in a demanding, fast-paced environment alongside academic curriculum.</li>
  </ul>

  <div class="row"><span>Le Florentin - Aubagne, France</span><span class="dates">02/2023 – 06/2023 (Weekends &amp; Academic Holidays)</span></div>
  <div class="sub">Server</div>
  <ul>
    <li>Managed high-intensity peak services, table coordination, and stock replenishment in a dynamic restaurant environment.</li>
  </ul>

  <div class="row"><span>Market Kom Agency – Marseille, France</span><span class="dates"></span></div>
  <div class="sub">Founder</div>
  <ul>
    <li>Designed websites and marketing materials using Adobe Creative Suite.</li>
    <li>Managed client projects and ensured delivery of high-quality digital content.</li>
  </ul>

  <div class="sec-title">Languages and IT Skills</div>
  <div class="skills">
    <p><b>Languages:</b> French (Native), English (C1), Spanish (Intermediate).</p>
    <p><b>Programming &amp; Tools:</b> Python (NumPy, Pandas, SciPy, Scikit-Learn), MQL5 (MetaTrader 5), Git, VS Code, Excel, Adobe Creative Suite, Claude Code, AI tools.</p>
    <p><b>Quantitative &amp; Financial Expertise:</b> Systematic Trading, Backtesting, Time Series Analysis, Statistical Modeling, Macroeconomic Forecasting.</p>
    <p><b>Interests:</b> Long-distance Running (Marseille-Cassis 20km), Chess, Algorithmic Trading Systems, Perfumery.</p>
  </div>
</body>
</html>"""
    return html, plain_text


def generate_cv_pdf_bytes(variant: str) -> Tuple[bytes, str]:
    """Generates an ATS-safe 1-page PDF using Chrome headless and returns (pdf_bytes, plain_text)."""
    html_content, plain_text = _build_cv_html(variant)

    with tempfile.TemporaryDirectory() as tmpdir:
        html_path = os.path.join(tmpdir, f"cv_{variant}.html")
        pdf_path = os.path.join(tmpdir, f"cv_{variant}.pdf")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        if os.path.exists(CHROME_PATH):
            subprocess.run(
                [
                    CHROME_PATH,
                    "--headless",
                    "--disable-gpu",
                    "--no-sandbox",
                    f"--print-to-pdf={pdf_path}",
                    "--no-pdf-header-footer",
                    f"file://{html_path}",
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=20,
            )
            with open(pdf_path, "rb") as pf:
                return pf.read(), plain_text

    raise RuntimeError("Google Chrome headless introuvable pour générer le PDF.")
