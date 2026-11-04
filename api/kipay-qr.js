// api/kipay-qr.js - FINAL, SESUAI DOKUMEN FOTO ABANG - ADA .png NYA!
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { amount, note } = req.body;
    const APIKEY = "qpg_pub_OqY_WWOqe1uLHo3Zow-PeX4MHogpxWhe";
    const BASE = `https://api.kipay.id/api/pay/${APIKEY}`;

    // 1. POST /transactions - Buat transaksi
    const r = await fetch(`${BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ apiKey: APIKEY, amount: Number(amount), order_id: 'order_' + Date.now(), note: note || '' })
    });
    const data = await r.json();
    const trx_id = data.trx_id || data.data?.trx_id || data.id;
    if (!trx_id) return res.status(200).json({ success: false, raw: data });

    // 2. GET /transactions/{trx_id}/qr.png - Ambil gambar QR
    // INI KUNCINYA: PAKAI /qr.png, BUKAN /qr !
    // Dan ini balasnya image/png, bukan JSON
    const qrRes = await fetch(`${BASE}/transactions/${trx_id}/qr.png`);
    const buf = Buffer.from(await qrRes.arrayBuffer());

    // Kalau KiPay ngasih error JSON, buf-nya bukan gambar. Cek dulu:
    const ct = qrRes.headers.get('content-type') || '';
    if (!ct.includes('image')) {
      return res.status(200).json({ success: false, error: 'KiPay tidak ngasih gambar, content-type: ' + ct, qrError: buf.toString().slice(0, 500), trx_id });
    }

    const qr_image = `data:image/png;base64,${buf.toString('base64')}`;

    return res.status(200).json({
      success: true,
      trx_id: trx_id,
      nominal_diminta: Number(amount),
      total_amount: data.total_amount || data.data?.total_amount || Number(amount),
      unique_code: data.unique_code || data.data?.unique_code || 0,
      qr_image: qr_image
    });
  } catch(e){
    return res.status(200).json({ success: false, error: String(e) });
  }
}
