import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

async function createInvoice(invoice, pathVar) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  await generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  doc.end();
  doc.pipe(fs.createWriteStream(path.resolve(`./Orders/${pathVar}`)));
}

function generateHeader(doc) {
  doc
    .fillColor("#444444") // black
    .fontSize(20) // 20
    .text("Art Space", 75, 57) 
    .fillColor("#000000")
    .fontSize(10)
    .text("Art Space", 400, 50, { align: "left" })
    .text("29, Kahifa ST", 400, 65, { align: "left" })
    .text("Cairo, Egypt", 400, 80, { align: "left" })
    .moveDown(); 
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Order Code:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.orderCode, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 30)
    .text(formatDate(new Date(invoice.date)), 150, customerInformationTop + 30)
    .font("Helvetica-Bold")
    .font("Helvetica")
    .text("Customer Name:", 290, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.name, 400, customerInformationTop)
    .font("Helvetica")
    .text("Customer Address:", 290, customerInformationTop + 15)
    .text(invoice.street + ", " + invoice.region, 400, customerInformationTop + 15)
    .text((invoice.postalCode ?? "No Postal") + ", " + invoice.city + ", " + invoice.country, 400, customerInformationTop + 30)

    .text("Customer Phone:", 290, customerInformationTop + 47)
    .text(invoice.phone, 400, customerInformationTop + 47)
    
    .moveDown();


  generateHr(doc, 265);
}

async function generateInvoiceTable (doc, invoice) {
  let i;
  const invoiceTableTop = 300;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Unit Cost",
    "Discount",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.title, // product title
      formatCurrency(item.basePrice), // product price
      item.discount + "%", // product quantity
      formatCurrency(item.appliedPrice ) // product final price
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subTotal)
  );

  const paidToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "",
    "Amount Required",
    "",
    formatCurrency(invoice.paidAmount) // orderPaidAmount
  );

  doc.font("Helvetica");
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      " Payment is due within 3 days. Thank you for trusting us.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(cents) {
  return cents + "EGP";
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

export default createInvoice;
