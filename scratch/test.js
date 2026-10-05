(async () => {
  const res = await fetch('http://localhost:8080/api/mocidade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome_completo: "Test",
      data_nascimento: "2000-01-01",
      sexo: "Masculino",
      comum_id: ""
    })
  });
  console.log("STATUS:", res.status);
  const text = await res.text();
  console.log("BODY:", text);
})();
