async function run() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/oportunidades/externas');
    if (!res.ok) {
      console.log('Failed:', res.status);
      return;
    }
    const data = await res.json();
    console.log(`Success! Array length: ${data.length}`);
    console.log(`First item:`, data[0] ? data[0].titulo : 'none');
  } catch(e) {
    console.log('Error', e);
  }
}
run();
