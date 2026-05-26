export const schedule = "0 20 * * *";

function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: process.env.WHATSAPP_TARGET_NUMBER || 'whatsapp:+14695962180'
  };
}

async function sendWhatsAppMessage(message) {
  const { accountSid, authToken, from, to } = getTwilioConfig();
  if (!accountSid || !authToken || !from || !to) {
    console.warn('Twilio WhatsApp not configured, skipping summary send.');
    return;
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const body = new URLSearchParams();
  body.append('Body', message);
  body.append('From', from);
  body.append('To', to);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Twilio send failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function handler(event, context) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const targetDate = `${yyyy}-${mm}-${dd}`;

    const response = await fetch('https://script.google.com/macros/s/AKfycbzUJSXrPciqcIKzMoFya2C6JxygM-XK88JoJnuBE0I4QP0ZoeFzqHmDELl44lK8tCzEZg/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'summary', date: targetDate })
    });

    const summaryText = await response.text();
    const message = summaryText && summaryText.trim().length > 0
      ? `Order summary for ${targetDate}:\n${summaryText}`
      : `No orders were received for ${targetDate}.`;

    await sendWhatsAppMessage(message);

    return {
      statusCode: 200,
      body: `Summary sent for ${targetDate}`
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
