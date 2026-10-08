# Chipmath

CNC feeds and speeds without the prayer. Enter the material, tool, spindle and feed; get the chipload per tooth, the surface speed, verdicts against published material guidance, a suggested feed for your RPM, and an engagement check that flags full-width slotting.

## Anchors

- Feed rate = RPM x flutes x chipload; chipload = feed / (RPM x flutes). Exact, round-trip anchor-tested.
- Surface speed = &pi; d n (m/min). Exact.

## Labeled guidance

Material chipload pockets are published shop norms at a 6mm carbide baseline, scaled linearly with tool diameter; surface-speed ranges likewise. Rigidity, coating, coolant and tool sharpness move real numbers. Verdicts describe the cut, never the operator.

## Run tests

```
node test.js
```

196 checks: 181 randomized cases against an independent Python oracle, exact anchors (including the feed/chipload round-trip and the 6mm baseline), monotonicity properties, and error cases.
