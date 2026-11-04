// api/kipay-qr.js - YANG BENER, QR DARI KIPAY LANGSUNG, BUKAN QR LINK
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { amount, note } = req.body;
  const APIKEY = "qpg_pub_OqY_WWOqe1uLHo3Zow-PeX4MHogpxWhe";

  // 1. Bikin transaksi dulu ke KiPay
  const r = await fetch(`https://api.kipay.id/api/pay/${APIKEY}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      apiKey: APIKEY,
      amount: Number(amount),
      order_id: 'order_' + Date.now(),
      note: note || ''
    })
  });
  const data = await r.json();
  const trx_id = data.trx_id || data.data?.trx_id;

  if (!trx_id) return res.status(200).json({ success: false, raw: data });

  // 2. Ambil QR ASLI dari KiPay - ini yang bisa di-scan DANA
  // Jangan pakai qrserver.com lagi!
  const qr_image = `https://api.kipay.id/api/pay/${APIKEY}/transactions/${trx_id}/qr`;

  return res.status(200).json({
    success: true,
    trx_id: trx_id,
    nominal_diminta: Number(amount),
    total_amount: Number(amount), // kalau mau pakai kode unik, hitung di sini
    qr_image: qr_image
  });
}
