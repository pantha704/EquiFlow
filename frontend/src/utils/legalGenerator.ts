import { jsPDF } from "jspdf";

export const generateLegalContract = async (
  homeowner: string,
  appraisalValue: string,
  requestedLiquidity: string,
  duration: number,
  propertyAddress: string
): Promise<{ blob: Blob; hash: string }> => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();

  // --- Layout Constants ---
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // --- Helper Functions ---
  const addText = (text: string, fontSize: number = 11, fontType: string = "normal", align: "left" | "center" | "right" | "justify" = "left") => {
    doc.setFont("times", fontType);
    doc.setFontSize(fontSize);

    if (align === "justify" || align === "left") {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y, { align: align === "justify" ? "justify" : "left", maxWidth: contentWidth });
      y += (lines.length * fontSize * 0.5) + 2; // Dynamic line height
    } else if (align === "center") {
      doc.text(text, pageWidth / 2, y, { align: "center" });
      y += fontSize * 0.5 + 4;
    } else {
      doc.text(text, pageWidth - margin, y, { align: "right" });
      y += fontSize * 0.5 + 4;
    }
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  };

  // --- Header ---
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text("EQUIFLOW PROTOCOL", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text("REAL WORLD ASSET TOKENIZATION AGREEMENT", pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 15;

  addLine();

  // --- Date & ID ---
  addText(`Date: ${date}`, 11, "normal", "right");
  addText(`Agreement ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 11, "normal", "right");
  y += 10;

  // --- Parties ---
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("PARTIES", margin, y);
  y += 8;

  addText(`THIS AGREEMENT is made on ${date} BETWEEN:`, 11, "normal");
  y += 5;

  // Homeowner Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "F");
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "S");

  const boxY = y + 8;
  doc.setFont("times", "bold");
  doc.text("THE ISSUER (Homeowner):", margin + 5, boxY);
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.text(`Wallet: ${homeowner}`, margin + 5, boxY + 8);
  doc.text(`Property: ${propertyAddress}`, margin + 5, boxY + 16);
  y += 45;

  addText("AND", 11, "bold", "center");
  y += 5;

  addText("EQUIFLOW PROTOCOL (The Platform)", 12, "bold", "center");
  y += 15;

  // --- Recitals ---
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("1. ASSET DETAILS", margin, y);
  y += 8;

  const details = [
    [`Property Address:`, propertyAddress],
    [`Appraisal Value:`, `${appraisalValue} IP`],
    [`Requested Liquidity:`, `${requestedLiquidity} IP`],
    [`Loan Duration:`, `${duration} Days`],
    [`Collateral Type:`, `Real Estate Equity (RWA)`]
  ];

  details.forEach(([label, value]) => {
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(label, margin + 10, y);
    doc.setFont("times", "normal");
    doc.text(value, margin + 60, y);
    y += 8;
  });
  y += 10;

  // --- Terms ---
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("2. TERMS AND CONDITIONS", margin, y);
  y += 8;

  const terms = [
    "The Issuer grants the Platform the right to issue ERC-721 tokens representing equity in the underlying asset.",
    "The Issuer agrees to repay the requested liquidity plus any accrued fees by the deadline specified in the smart contract.",
    "Failure to repay the liquidity by the deadline may result in the foreclosure and liquidation of the underlying asset collateral.",
    "This agreement is cryptographically signed and stored on the Story Protocol blockchain. The smart contract serves as the immutable record of this agreement.",
    "The Issuer certifies that they are the legal owner of the property and have the right to tokenize its equity."
  ];

  terms.forEach((term, index) => {
    const prefix = `${index + 1}. `;
    const lines = doc.splitTextToSize(term, contentWidth - 10);
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(prefix, margin, y);
    doc.text(lines, margin + 10, y);
    y += (lines.length * 6) + 4;
  });

  // --- Signatures ---
  const signatureBlockHeight = 100; // Increased buffer again
  // If we are past the middle of the page, just add a new page for signatures to look cleaner
  if (y > pageHeight - margin - signatureBlockHeight) {
    doc.addPage();
    y = margin;
  } else {
    y += 30; // More spacing
  }

  addLine();
  y += 10;

  // Two columns for signatures
  const colWidth = contentWidth / 2;

  // Issuer Column
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("SIGNED by the ISSUER", margin, y);
  y += 20;
  doc.line(margin, y, margin + colWidth - 20, y);
  y += 5;
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text("Digital Signature", margin, y);

  // Platform Column
  y -= 25; // Reset Y
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("VERIFIED by EQUIFLOW", margin + colWidth, y);
  y += 20;
  doc.line(margin + colWidth, y, pageWidth - margin, y);
  y += 5;
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text("Cryptographic Verification", margin + colWidth, y);

  // --- Footer ---
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Generated by EquiFlow Protocol | Powered by Story Protocol", pageWidth / 2, pageHeight - 10, { align: "center" });

  // --- Output ---
  const pdfBlob = doc.output("blob");

  // Simulate a hash of the document content
  const contentString = doc.output();
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(contentString));
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { blob: pdfBlob, hash: "0x" + hashHex };
};
