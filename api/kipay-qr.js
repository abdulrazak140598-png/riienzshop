// api/kipay-qr.js - AMBIL QR LEWAT SERVER, JANGAN KASIH LINK MENTAH
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { amount, note } = req.body;
    const APIKEY = "qpg_pub_OqY_WWOqe1uLHo3Zow-PeX4MHogpxWhe";

    // 1. Bikin transaksi
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
    const trx_id = data.trx_id || data.data?.trx_id || data.id;
    if (!trx_id) return res.status(200).json({ success: false, raw: data });

    // 2. Ambil gambar QR-nya LEWAT SERVER, bukan kasih link mentah
    const qrRes = await fetch(`https://api.kipay.id/api/pay/${APIKEY}/transactions/${trx_id}/qr`);
    const buf = Buffer.from(await qrRes.arrayBuffer());
    const qr_image = `data:image/png;base64,${buf.toString('base64')}`;

    return res.status(200).json({
      success: true,
      trx_id: trx_id,
      nominal_diminta: Number(amount),
      total_amount: data.total_amount || data.data?.total_amount || Number(amount),
      unique_code: data.unique_code || data.data?.unique_code || 0,
      qr_image: qr_image
    });
  } catch (e) {
    return res.status(200).json({ success: false, error: String(e) });
  }
}
