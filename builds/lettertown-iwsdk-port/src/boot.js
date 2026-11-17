import('./index.js').catch(error => { console.error('Letter Town startup failed', error); document.getElementById('build-id').textContent += ' — STARTUP FAILED: ' + error.message; });
