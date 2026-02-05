const BACKEND_URL =
  location.hostname === localhost
     httplocalhost10000
     httpsYOUR-BACKEND.onrender.com;

const topicEl = document.getElementById(topic);
const outEl = document.getElementById(output);
const btn = document.getElementById(generate);

btn.addEventListener(click, async () = {
  const topic = topicEl.value.trim();
  if (!topic) return alert(Type something first.);

  outEl.textContent = Chartie is thinking…;

  try {
    const res = await fetch(`${BACKEND_URL}apigenerate`, {
      method POST,
      headers { Content-Type applicationjson },
      body JSON.stringify({ prompt topic })
    });

    const data = await res.json();
    outEl.textContent = data.text  No output returned.;
  } catch (e) {
    outEl.textContent = Something went wrong.;
  }
});
