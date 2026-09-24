"use client";

import type { Client, Installation, Invoice, Job, StockItem, Tech } from "@/data/types";
import type { Sector } from "@/data/sectors";
import { fmt } from "./utils";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

async function base(sector: Sector, titulo: string, numero: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const [r, g, b] = hexToRgb(sector.color);
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 210, 4, "F");
  doc.roundedRect(18, 16, 12, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(sector.empresaCorta.slice(0, 1), 24, 24.5, { align: "center" });
  doc.setTextColor(12, 26, 34);
  doc.setFontSize(13);
  doc.text(sector.empresa, 34, 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 105, 115);
  doc.text("CIF B07000000 (datos de ejemplo), Polígono de Son Castelló, 07009 Palma", 34, 26);
  doc.setTextColor(12, 26, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(titulo, 192, 22, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 105, 115);
  doc.text(numero, 192, 27.5, { align: "right" });
  return { doc, rgb: [r, g, b] as [number, number, number] };
}

function footer(doc: import("jspdf").jsPDF) {
  doc.setDrawColor(221, 227, 231);
  doc.line(18, 282, 192, 282);
  doc.setFontSize(7.5);
  doc.setTextColor(120, 135, 145);
  doc.text("Documento generado en la demo de Nexo4Pymes con datos ficticios.", 18, 287);
  doc.text("nexo4pymes.com", 192, 287, { align: "right" });
}

export async function invoicePdf(inv: Invoice, client: Client, sector: Sector) {
  const { doc, rgb } = await base(sector, "Factura", inv.numero);
  let y = 44;
  doc.setFontSize(8);
  doc.setTextColor(120, 135, 145);
  doc.text("Facturar a", 18, y);
  doc.text("Fecha", 130, y);
  doc.text("Vencimiento", 165, y);
  doc.setFontSize(10);
  doc.setTextColor(12, 26, 34);
  doc.setFont("helvetica", "bold");
  doc.text(client.nombre, 18, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(fmt.date(inv.fecha), 130, y + 5.5);
  doc.text(fmt.date(inv.vencimiento), 165, y + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(70, 86, 97);
  doc.text(client.direccion, 18, y + 10.5);
  doc.text(`CIF ${client.cif}`, 18, y + 15);

  y = 74;
  doc.setFillColor(244, 246, 247);
  doc.rect(18, y, 174, 8, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(70, 86, 97);
  doc.text("Concepto", 21, y + 5.3);
  doc.text("Cant.", 128, y + 5.3, { align: "right" });
  doc.text("Precio", 155, y + 5.3, { align: "right" });
  doc.text("Importe", 189, y + 5.3, { align: "right" });
  y += 8;
  doc.setTextColor(12, 26, 34);
  doc.setFontSize(9.5);
  for (const l of inv.lineas) {
    y += 7;
    doc.text(l.concepto, 21, y);
    doc.text(fmt.num(l.cantidad, Number.isInteger(l.cantidad) ? 0 : 2), 128, y, { align: "right" });
    doc.text(fmt.eur(l.precio), 155, y, { align: "right" });
    doc.text(fmt.eur(l.cantidad * l.precio), 189, y, { align: "right" });
    doc.setDrawColor(235, 239, 241);
    doc.line(18, y + 3, 192, y + 3);
  }
  y += 14;
  const row = (k: string, v: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 9.5);
    doc.text(k, 150, y, { align: "right" });
    doc.text(v, 189, y, { align: "right" });
    y += bold ? 8 : 6;
  };
  row("Base imponible", fmt.eur(inv.base));
  row("IVA 21 %", fmt.eur(inv.iva));
  doc.setDrawColor(...rgb);
  doc.line(120, y - 3, 192, y - 3);
  y += 2;
  row("Total", fmt.eur(inv.total), true);

  // Pago
  y += 6;
  if (inv.enlacePago) {
    doc.setFillColor(...rgb);
    doc.roundedRect(18, y, 110, 16, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Paga con tarjeta o Bizum", 23, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(inv.enlacePago, 23, y + 11.5);
  }

  // VeriFactu
  if (inv.verifactu) {
    const QR = (await import("qrcode")).default;
    const url = `https://nexo4pymes.com/demo?factura=${encodeURIComponent(inv.numero)}`;
    const data = await QR.toDataURL(url, { margin: 0, width: 240 });
    const qy = 222;
    doc.addImage(data, "PNG", 18, qy, 32, 32);
    doc.setTextColor(12, 26, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Factura registrada con VeriFactu", 56, qy + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 105, 115);
    doc.text(`Huella del registro: ${inv.verifactu.huella}`, 56, qy + 13);
    doc.text(`Registrada el ${fmt.date(inv.verifactu.registrada)} a las ${fmt.time(inv.verifactu.registrada)}`, 56, qy + 18);
    doc.text("QR de verificación incluido en la factura.", 56, qy + 23);
  }
  footer(doc);
  doc.save(`${inv.numero.replace(/\s+/g, "-")}.pdf`);
}

export async function reportPdf(job: Job, client: Client, tech: Tech | undefined, inst: Installation | undefined, sector: Sector, stock: StockItem[]) {
  const { doc, rgb } = await base(sector, "Informe de servicio", job.codigo);
  let y = 44;
  const kv = (x: number, k: string, v: string) => {
    doc.setFontSize(8);
    doc.setTextColor(120, 135, 145);
    doc.text(k, x, y);
    doc.setFontSize(10);
    doc.setTextColor(12, 26, 34);
    doc.text(v, x, y + 5.5);
  };
  kv(18, "Cliente", client.nombre);
  kv(95, "Fecha", `${fmt.date(job.fecha)}, ${job.hora}`);
  kv(145, "Técnico", tech?.nombre ?? "");
  y += 14;
  kv(18, sector.instalacion.tipo, inst?.nombre ?? "General");
  kv(95, "Servicio", job.titulo);
  kv(145, "Tiempo", fmt.dur((job.horasReales ?? job.duracionMin / 60) * 60));

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Trabajo realizado", 18, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  sector.checklist.forEach((c, i) => {
    y += 6.5;
    const ok = job.checklistHecho?.[i] ?? true;
    doc.setFillColor(...(ok ? rgb : ([200, 205, 210] as [number, number, number])));
    doc.circle(20, y - 1.2, 1.4, "F");
    doc.setTextColor(12, 26, 34);
    doc.text(c, 24, y);
  });

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Mediciones", 18, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  sector.mediciones.forEach((m) => {
    y += 6.5;
    const v = job.mediciones?.[m.nombre] ?? (m.ok[0] + m.ok[1]) / 2;
    const ok = v >= m.ok[0] && v <= m.ok[1];
    doc.setTextColor(12, 26, 34);
    doc.text(m.nombre, 20, y);
    doc.text(`${fmt.num(v, m.dec)} ${m.unidad}`, 100, y, { align: "right" });
    doc.setTextColor(...(ok ? ([19, 132, 90] as [number, number, number]) : ([207, 63, 55] as [number, number, number])));
    doc.text(ok ? "Correcto" : "Fuera de rango", 106, y);
    doc.setTextColor(120, 135, 145);
    doc.text(`Referencia ${fmt.num(m.ok[0], m.dec)} a ${fmt.num(m.ok[1], m.dec)} ${m.unidad}`, 140, y);
  });

  const mat = (job.material ?? []).filter((m) => m.cantidad > 0);
  if (mat.length) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(12, 26, 34);
    doc.text("Material utilizado", 18, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    mat.forEach((m) => {
      const it = stock.find((s) => s.id === m.itemId);
      y += 6.5;
      doc.text(`${m.cantidad} ${it?.unidad ?? ""}  ${it?.nombre ?? ""}`, 20, y);
    });
  }

  // Fotos
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Fotos", 18, y);
  y += 4;
  const labels = ["Antes", "Después"];
  labels.forEach((l, i) => {
    const x = 18 + i * 60;
    doc.setFillColor(...(i ? rgb : ([150, 165, 175] as [number, number, number])));
    doc.roundedRect(x, y, 56, 36, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`${l}, ${job.hora}`, x + 3, y + 33);
  });

  // Firma
  const fy = y;
  doc.setTextColor(12, 26, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Firma del cliente", 142, fy - 4);
  doc.setDrawColor(12, 26, 34);
  doc.setLineWidth(0.5);
  doc.lines([[6, -6], [4, 8], [5, -10], [3, 9], [8, -4], [6, 2]], 146, fy + 22, [1, 1]);
  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 205, 210);
  doc.line(142, fy + 28, 192, fy + 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 105, 115);
  doc.text(job.firmadoPor ?? client.contacto, 142, fy + 33);
  footer(doc);
  doc.save(`Informe-${job.codigo}.pdf`);
}
