#!/usr/bin/env python3
"""Extract text from a homebrew PDF using PyMuPDF (fitz).

PyMuPDF is used deliberately: the pypdf/cryptography stack is frequently broken
in sandboxed environments (missing _cffi_backend), while PyMuPDF is
self-contained. Install with `pip install pymupdf` if the import fails.

Usage:
    python3 extract_pdf.py FILE.pdf                 # all pages
    python3 extract_pdf.py FILE.pdf --pages 1-6     # a page range (1-indexed)
    python3 extract_pdf.py FILE.pdf --pages 2       # a single page
    python3 extract_pdf.py FILE.pdf --info          # page count + metadata only

Pages are separated by a form-feed (\\f) and a "===== PAGE n =====" marker so you
can see where multi-column tables break across pages. Reconstruct tables by
column position, not by the raw extracted order.
"""
import argparse
import sys


def parse_range(spec, n):
    if spec is None:
        return range(n)
    if "-" in spec:
        a, b = spec.split("-", 1)
        return range(int(a) - 1, min(int(b), n))
    i = int(spec) - 1
    return range(i, i + 1)


def main():
    ap = argparse.ArgumentParser(description="Extract text from a PDF via PyMuPDF.")
    ap.add_argument("pdf")
    ap.add_argument("--pages", help="1-indexed page or range, e.g. 3 or 1-6")
    ap.add_argument("--info", action="store_true", help="print page count + metadata and exit")
    args = ap.parse_args()

    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("PyMuPDF not installed. Run: pip install pymupdf")

    try:
        doc = fitz.open(args.pdf)
    except Exception as e:  # noqa: BLE001
        sys.exit(f"Could not open {args.pdf}: {e}")

    if args.info:
        print(f"pages: {doc.page_count}")
        for k, v in (doc.metadata or {}).items():
            if v:
                print(f"{k}: {v}")
        return

    out = []
    for i in parse_range(args.pages, doc.page_count):
        text = doc[i].get_text()
        out.append(f"\n===== PAGE {i + 1} =====\n{text}")
    sys.stdout.write("\f".join(out))


if __name__ == "__main__":
    main()
