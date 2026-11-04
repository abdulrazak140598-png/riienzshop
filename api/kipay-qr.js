// api/kipay-qr.js - NGIKUTIN DOKUMEN DI VIDEO ABANG (4 OPERASI)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { amount, note } = req.body;
    const APIKEY = "qpg_pub_OqY_WWOqe1uLHo3Zow-PeX4MHogpxWhe";
    const BASE = `https://api.kipay.id/api/pay/${APIKEY}`;

    // OPERASI 1 - Sesuai video: POST /transactions
    const r = await fetch(`${BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ apiKey: APIKEY, amount: Number(amount), order_id: 'order_' + Date.now(), note: note || '' })
    });
    const data = await r.json();
    const trx_id = data.trx_id || data.data?.trx_id || data.id;
    if (!trx_id) return res.status(200).json({ success: false, raw: data });

    // OPERASI 2 - Sesuai video: GET /transactions/{trx_id}/qr
    // Di dokumen, ini balasnya JSON, bukan gambar. Jadi kita baca JSON-nya dulu.
    const qrRes = await fetch(`${BASE}/transactions/${trx_id}/qr`, {
      headers: { 'Accept': 'application/json' }
    });
    const qrJson = await qrRes.json();

    // Di dokumen KiPay, field-nya biasanya salah satu dari ini:
    // qr_string / qr_code / qris / data / url
    const qr_string = qrJson.qr_string || qrJson.qr_code || qrJson.qr || qrJson.qris || qrJson.data?.qr_string || qrJson.data?.qr || qrJson.data || null;
    const qr_url = qrJson.qr_url || qrJson.qr_image || qrJson.url || qrJson.data?.qr_url || null;

    let qr_image = qr_url;
    if (qr_string && typeof qr_string === 'string' && qr_string.length > 20) {
      // Kalau dapat qr_string (000201...), bikin gambar dari situ - ini yang bisa di-scan DANA
      qr_image = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(qr_string)}`;
    } else if (qr_string && typeof qr_string === 'string' && qr_string.startsWith('http')) {
      qr_image = qr_string;
    }

    if (!qr_image) return res.status(200).json({ success: false, error: 'QR tidak ketemu di balasan KiPay', trx_id, qrJson, createData: data });

    return res.status(200).json({
      success: true, trx_id,
      nominal_diminta: Number(amount),
      total_amount: data.total_amount || data.data?.total_amount || Number(amount),
      unique_code: data.unique_code || data.data?.unique_code || 0,
      qr_image: qr_image
    });
  } catch(e){
    return res.status(200).json({ success: false, error: String(e) });
  }
}
