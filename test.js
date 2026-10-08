const e = require('./engine.js');
const exp = require('./expected.json');
let pass = 0, fail = 0;
const close = (a, b, tol) => (typeof a === 'boolean' && a === b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)));
function cmp(g, w, path){
  if (Array.isArray(w)){ g.forEach((g2, i) => cmp(g2, w[i], path + '[' + i + ']')); return; }
  if (typeof w === 'string'){ if (g !== w) throw new Error(path + ': got "' + g + '" want "' + w + '"'); return; }
  if (typeof w === 'object' && w !== null){ Object.keys(w).forEach(k => cmp(g[k], w[k], path + '.' + k)); return; }
  if (!close(g, w, 1e-9)) throw new Error(path + ': got ' + g + ' want ' + w);
}
exp.cases.forEach((c, i) => {
  try {
    const got = c.kind === 'feedRate' ? e.feedRate(...c.args) : c.kind === 'chipload' ? e.chipload(...c.args) : c.kind === 'surfaceSpeed' ? e.surfaceSpeed(...c.args) : c.kind === 'assess' ? e.assess(...c.args) : e.engagement(...c.args);
    cmp(got, c.out, 'case' + i);
    pass++;
  } catch (err){ fail++; console.log('FAIL case', i, c.kind, err.message); }
});
// Anchors: exact identities.
(function(){
  if (e.feedRate(10000, 2, 0.1) !== 2000) throw new Error('anchor feed');
  if (e.chipload(2000, 10000, 2) !== 0.1) throw new Error('anchor chip');
  const s = e.surfaceSpeed(10000, 10);
  if (Math.abs(s - Math.PI * 100) > 1e-9) throw new Error('anchor smm');
  // feed/chipload round-trip.
  const f = e.feedRate(18000, 2, 0.105);
  if (Math.abs(e.chipload(f, 18000, 2) - 0.105) > 1e-12) throw new Error('anchor roundtrip');
  // 6mm baseline: no scaling.
  const a = e.assess('hardwood', 6, 2, 18000, 3780);
  if (Math.abs(a.chipLo - 0.06) > 1e-12 || Math.abs(a.chipHi - 0.15) > 1e-12) throw new Error('anchor baseline');
  pass += 5;
})();
// Properties.
(function(){
  // Feed linear in RPM.
  if (e.feedRate(20000, 2, 0.1) !== 2 * e.feedRate(10000, 2, 0.1)) throw new Error('feed linearity');
  // Bigger tool: bigger chipload range.
  const a6 = e.assess('hardwood', 6, 2, 18000, 2000), a12 = e.assess('hardwood', 12, 2, 18000, 2000);
  if (!(a12.chipHi > a6.chipHi)) throw new Error('chip scale');
  // Slotting only at full width.
  if (!e.engagement(2, 6, 6).slotting) throw new Error('slot detect');
  if (e.engagement(2, 5.9, 6).slotting) throw new Error('slot false positive');
  pass += 4;
})();
// Error cases.
(function(){
  const bad = [
    () => e.feedRate(0, 2, 0.1),
    () => e.chipload(0, 10000, 2),
    () => e.surfaceSpeed(10000, 0),
    () => e.assess('granite', 6, 2, 18000, 2000),
    () => e.engagement(20, 2, 6),
    () => e.engagement(2, 7, 6),
  ];
  bad.forEach((f2, i) => {
    try { f2(); fail++; console.log('FAIL error case', i, 'did not throw'); }
    catch (err){ pass++; }
  });
})();
console.log(pass + '/' + (pass + fail) + ' checks pass');
process.exit(fail ? 1 : 0);
