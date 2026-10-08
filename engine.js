// Chipmath engine - CNC milling/routing feeds and speeds.
// Exact arithmetic: feed = rpm x flutes x chipload; surface speed = pi d n.
// The material table (chipload sweet ranges at a 6mm carbide baseline, scaled
// linearly with tool diameter; surface-speed ranges) is published shop
// guidance, labeled: machine rigidity, tool coating and coolant move the real
// numbers. Verdicts describe the cut, not the operator.
const MATERIALS = {
  hardwood: { label: 'Hardwood',      chip: [0.06, 0.15], smm: [200, 600] },
  softwood: { label: 'Softwood',      chip: [0.08, 0.20], smm: [200, 600] },
  plywood:  { label: 'Plywood / MDF', chip: [0.05, 0.12], smm: [200, 600] },
  acrylic:  { label: 'Acrylic',       chip: [0.03, 0.10], smm: [150, 400] },
  aluminum: { label: 'Aluminum',      chip: [0.02, 0.08], smm: [100, 300] },
  steel:    { label: 'Steel',         chip: [0.01, 0.04], smm: [20, 90] },
};
const BASE_DIA = 6;

function feedRate(rpm, flutes, chipMm){
  if (!(rpm > 0)) throw new Error('RPM must be positive');
  if (!(flutes >= 1)) throw new Error('flutes must be at least 1');
  if (!(chipMm > 0)) throw new Error('chipload must be positive');
  return rpm * flutes * chipMm;
}

function chipload(feedMmMin, rpm, flutes){
  if (!(feedMmMin > 0)) throw new Error('feed rate must be positive');
  if (!(rpm > 0)) throw new Error('RPM must be positive');
  if (!(flutes >= 1)) throw new Error('flutes must be at least 1');
  return feedMmMin / (rpm * flutes);
}

function surfaceSpeed(rpm, diaMm){
  if (!(rpm > 0)) throw new Error('RPM must be positive');
  if (!(diaMm > 0)) throw new Error('tool diameter must be positive');
  return Math.PI * diaMm * rpm / 1000;
}

function assess(material, diaMm, flutes, rpm, feedMmMin){
  const m = MATERIALS[material];
  if (!m) throw new Error('unknown material - pick one from the list');
  if (!(diaMm > 0)) throw new Error('tool diameter must be positive');
  const chip = chipload(feedMmMin, rpm, flutes);
  const smm = surfaceSpeed(rpm, diaMm);
  const scale = diaMm / BASE_DIA;
  const lo = m.chip[0] * scale, hi = m.chip[1] * scale, mid = (lo + hi) / 2;
  const chipVerdict = chip < lo ? 'too small - dust instead of chips means rubbing, heat and a dull tool (labeled)'
    : chip <= hi ? 'in the pocket (labeled guidance)'
    : 'too big - expect chatter or a snapped endmill (labeled)';
  const speedVerdict = smm < m.smm[0] ? 'slow for the material - gummy, torn finish (labeled)'
    : smm <= m.smm[1] ? 'in range (labeled guidance)'
    : 'fast for the material - heat kills the edge (labeled)';
  const idealFeed = feedRate(rpm, flutes, mid);
  const rpmLo = Math.ceil(m.smm[0] * 1000 / (Math.PI * diaMm));
  const rpmHi = Math.floor(m.smm[1] * 1000 / (Math.PI * diaMm));
  return { chiploadMm: chip, surfaceMpm: smm, chipLo: lo, chipHi: hi, midChip: mid,
    chipVerdict, speedVerdict, idealFeed, rpmRange: [rpmLo, rpmHi] };
}

// Depth/width of cut vs tool diameter. Slotting (full-width) doubles the heat (labeled).
function engagement(docMm, wocMm, diaMm){
  if (!(docMm > 0)) throw new Error('depth of cut must be positive');
  if (!(wocMm > 0)) throw new Error('width of cut must be positive');
  if (!(diaMm > 0)) throw new Error('tool diameter must be positive');
  if (docMm > 3 * diaMm) throw new Error('deeper than 3x diameter - peck it in passes instead');
  if (wocMm > diaMm) throw new Error('wider than the tool - that is not a cut, that is a crash');
  const docR = docMm / diaMm, wocR = wocMm / diaMm;
  const slotting = wocR >= 0.999;
  const verdict = slotting ? 'full-width slot - every tooth cuts twice the arc; drop the feed or open the slot (labeled)'
    : wocR > 0.5 ? 'heavy radial engagement - strong pull, watch deflection (labeled)'
    : wocR >= 0.05 ? 'healthy engagement (labeled guidance)'
    : 'whisper cut - finishing territory, rubbing risk on hard passes (labeled)';
  return { docRatio: docR, wocRatio: wocR, slotting, verdict };
}

const API = { MATERIALS, feedRate, chipload, surfaceSpeed, assess, engagement };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.Chipmath = API;
