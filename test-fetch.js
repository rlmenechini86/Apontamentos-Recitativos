fetch('https://ckqvxjzgvfrllhgnkqdu.supabase.co')
  .then(res => console.log('Success:', res.status))
  .catch(err => {
    console.error('Error:', err.message);
    console.error('Cause:', err.cause);
  });
