export async function handler(event, context) {
  try {
    const payload = JSON.parse(event.body);

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzUJSXrPciqcIKzMoFya2C6JxygM-XK88JoJnuBE0I4QP0ZoeFzqHmDELl44lK8tCzEZg/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const text = await response.text();

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
