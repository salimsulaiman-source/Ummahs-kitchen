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
    console.warn('Twilio WhatsApp not configured, skipping message send.');
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

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzUJSXrPciqcIKzMoFya2C6JxygM-XK88JoJnuBE0I4QP0ZoeFzqHmDELl44lK8tCzEZg/exec";

export async function handler(event, context) {
  try {
    const payload = JSON.parse(event.body);

    const response = await fetch(
      APPS_SCRIPT_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const text = await response.text();

    const whatsappMessage = `New order received:\nName: ${payload.name}\nPhone: ${payload.phone}\nItem: ${payload.food}\nTray: ${payload.tray}\nQuantity: ${payload.qty}\nTotal: $${payload.total}\nPickup: ${payload.pickupDate} ${payload.pickupTime}`;

    try {
      await sendWhatsAppMessage(whatsappMessage);
    } catch (whatsappError) {
      console.warn('WhatsApp send failed:', whatsappError.message);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: text
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
