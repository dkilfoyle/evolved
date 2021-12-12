import { Coord, Dir, visitNeighborhood } from './coord';
import { Grid } from './grid';
import { Individual } from './individual';
import { Compass, Sensors, SimState } from './models';
import { params } from './params';
import { Signals } from './signals';

export function getPopulationDensityAlongAxis(
  loc: Coord,
  dir: Dir,
  grid: Grid
) {
  // Converts the population along the specified axis to the sensor range. The
  // locations of neighbors are scaled by the inverse of their distance times
  // the positive absolute cosine of the difference of their angle and the
  // specified axis. The maximum positive or negative magnitude of the sum is
  // about 2*radius. We don't adjust for being close to a border, so populations
  // along borders and in corners are commonly sparser than away from borders.
  // An empty neighborhood results in a sensor value exactly midrange; below
  // midrange if the population density is greatest in the reverse direction,
  // above midrange if density is greatest in forward direction.

  if (dir.dir9 == Compass.CENTER) return 0; //throw new Error(); // require a defined axis

  let sum = 0.0;
  const dirVec = dir.asNormalizedCoord();
  const len = Math.sqrt(dirVec.x * dirVec.x + dirVec.y * dirVec.y);
  const dirVecX = dirVec.x / len;
  const dirVecY = dirVec.y / len; // Unit vector components along dir

  const f = (tloc: Coord) => {
    if (!tloc.isEqual(loc) && grid.isOccupiedAt(tloc)) {
      const offset = tloc.sub(loc);
      const proj = dirVecX * offset.x + dirVecY * offset.y; // Magnitude of projection along dir
      const contrib = proj / (offset.x * offset.x + offset.y * offset.y);
      if (isNaN(contrib)) debugger;
      sum += contrib;
    }
  };

  visitNeighborhood(loc, params.populationSensorRadius, f);

  const maxSumMag = 6.0 * params.populationSensorRadius;
  if (!(sum >= -maxSumMag && sum <= maxSumMag)) throw new Error();

  let sensorVal;
  sensorVal = sum / maxSumMag; // convert to -1.0..1.0
  sensorVal = (sensorVal + 1.0) / 2.0; // convert to 0.0..1.0

  return sensorVal;
}

// Converts the number of locations (not including loc) to the next barrier location
// along opposite directions of the specified axis to the sensor range. If no barriers
// are found, the result is sensor mid-range. Ignores agents in the path.
export function getShortProbeBarrierDistance(
  loc0: Coord,
  dir: Dir,
  probeDistance: number,
  grid: Grid
) {
  let countFwd = 0;
  let countRev = 0;
  let loc = loc0.add(dir.asNormalizedCoord());
  let numLocsToTest = probeDistance;
  // Scan positive direction
  while (numLocsToTest > 0 && grid.isInBounds(loc) && !grid.isBarrierAt(loc)) {
    ++countFwd;
    loc = loc.add(dir.asNormalizedCoord());
    --numLocsToTest;
  }
  if (numLocsToTest > 0 && !grid.isInBounds(loc)) {
    countFwd = probeDistance;
  }
  // Scan negative direction
  numLocsToTest = probeDistance;
  loc = loc0.sub(dir.asNormalizedCoord());
  while (numLocsToTest > 0 && grid.isInBounds(loc) && !grid.isBarrierAt(loc)) {
    ++countRev;
    loc = loc.sub(dir.asNormalizedCoord());
    --numLocsToTest;
  }
  if (numLocsToTest > 0 && !grid.isInBounds(loc)) {
    countRev = probeDistance;
  }

  let sensorVal = countFwd - countRev + probeDistance; // convert to 0..2*probeDistance
  sensorVal = sensorVal / 2.0 / probeDistance; // convert to 0.0..1.0
  return sensorVal;
}

export function getSignalDensity(
  layerNum: number,
  loc: Coord,
  signals: Signals
) {
  // returns magnitude of the specified signal layer in a neighborhood, with
  // 0.0..maxSignalSum converted to the sensor range.

  let countLocs = 0;
  let sum = 0;
  const center = loc;

  const f = (tloc: Coord) => {
    ++countLocs;
    sum += signals.getMagnitude(layerNum, tloc);
  };

  visitNeighborhood(center, params.signalSensorRadius, f);
  const maxSum = countLocs * Signals.SIGNAL_MAX;
  const sensorVal = sum / maxSum; // convert to 0.0..1.0

  return sensorVal;
}

export function getSignalDensityAlongAxis(
  layerNum: number,
  loc: Coord,
  dir: Dir,
  signals: Signals
) {
  // Converts the signal density along the specified axis to sensor range. The
  // values of cell signal levels are scaled by the inverse of their distance times
  // the positive absolute cosine of the difference of their angle and the
  // specified axis. The maximum positive or negative magnitude of the sum is
  // about 2*radius*SIGNAL_MAX (?). We don't adjust for being close to a border,
  // so signal densities along borders and in corners are commonly sparser than
  // away from borders.

  if (!(dir.dir9 != Compass.CENTER)) return 0; //throw new Error(); // require a defined axis

  let sum = 0.0;
  const dirVec = dir.asNormalizedCoord();
  const len = Math.sqrt(dirVec.x * dirVec.x + dirVec.y * dirVec.y);
  const dirVecX = dirVec.x / len;
  const dirVecY = dirVec.y / len; // Unit vector components along dir

  const f = (tloc: Coord) => {
    if (!tloc.isEqual(loc)) {
      const offset = tloc.sub(loc);
      const proj = dirVecX * offset.x + dirVecY * offset.y; // Magnitude of projection along dir
      const contrib =
        (proj * signals.getMagnitude(layerNum, loc)) /
        (offset.x * offset.x + offset.y * offset.y);
      sum += contrib;
    }
  };

  visitNeighborhood(loc, params.populationSensorRadius, f);

  const maxSumMag = 6.0 * params.signalSensorRadius * Signals.SIGNAL_MAX;
  if (!(sum >= -maxSumMag && sum <= maxSumMag)) throw new Error();
  let sensorVal = sum / maxSumMag; // convert to -1.0..1.0
  sensorVal = (sensorVal + 1.0) / 2.0; // convert to 0.0..1.0

  return sensorVal;
}

// Returns the number of locations to the next agent in the specified
// direction, not including loc. If the probe encounters a boundary or a
// barrier before reaching the longProbeDist distance, returns longProbeDist.
// Returns 0..longProbeDist.
export function longProbePopulationFwd(
  loc: Coord,
  dir: Dir,
  longProbeDist: number,
  grid: Grid
) {
  if (!(longProbeDist > 0)) throw new Error();
  let count = 0;
  loc = loc.add(dir.asNormalizedCoord());
  let numLocsToTest = longProbeDist;
  while (numLocsToTest > 0 && grid.isInBounds(loc) && grid.isEmptyAt(loc)) {
    ++count;
    loc = loc.add(dir.asNormalizedCoord());
    --numLocsToTest;
  }
  if (numLocsToTest > 0 && (!grid.isInBounds(loc) || grid.isBarrierAt(loc))) {
    return longProbeDist;
  } else {
    return count;
  }
}

export function longProbeBarrierFwd(
  loc: Coord,
  dir: Dir,
  longProbeDist: number,
  grid: Grid
) {
  if (!(longProbeDist > 0)) throw new Error();
  let count = 0;
  loc = loc.add(dir.asNormalizedCoord());
  let numLocsToTest = longProbeDist;
  while (numLocsToTest > 0 && grid.isInBounds(loc) && !grid.isBarrierAt(loc)) {
    ++count;
    loc = loc.add(dir.asNormalizedCoord());
    --numLocsToTest;
  }
  if (numLocsToTest > 0 && !grid.isInBounds(loc)) {
    return longProbeDist;
  } else {
    return count;
  }
}

export function getSensor(
  sensorNum: Sensors,
  indiv: Individual,
  sim: SimState
) {
  let sensorVal = 0.0;
  switch (sensorNum) {
    case Sensors.AGE:
      sensorVal = indiv.age / params.stepsPerGeneration;
      break;
    case Sensors.BOUNDARY_DIST:
      const distX = Math.min(indiv.loc.x, params.sizeX - indiv.loc.x - 1);
      const distY = Math.min(indiv.loc.y, params.sizeY - indiv.loc.y - 1);
      const closest = Math.min(distX, distY);
      const maxPossible = Math.max(params.sizeX / 2 - 1, params.sizeY / 2 - 1);
      sensorVal = closest / maxPossible;
      break;

    case Sensors.BOUNDARY_DIST_X:
      // Measures the distance to nearest boundary in the east-west axis,
      // max distance is half the grid width; scaled to sensor range 0.0..1.0.
      const minDistX = Math.min(indiv.loc.x, params.sizeX - indiv.loc.x - 1);
      sensorVal = minDistX / (params.sizeX / 2.0);
      break;
    case Sensors.BOUNDARY_DIST_Y:
      // Measures the distance to nearest boundary in the south-north axis,
      // max distance is half the grid height; scaled to sensor range 0.0..1.0.
      const minDistY = Math.min(indiv.loc.y, params.sizeY - indiv.loc.y - 1);
      sensorVal = minDistY / (params.sizeY / 2.0);
      break;
    case Sensors.LAST_MOVE_DIR_X:
      // X component -1,0,1 maps to sensor values 0.0, 0.5, 1.0
      const lastX = indiv.lastMoveDir.asNormalizedCoord().x;
      sensorVal = lastX == 0 ? 0.5 : lastX == -1 ? 0.0 : 1.0;
      break;
    case Sensors.LAST_MOVE_DIR_Y:
      // Y component -1,0,1 maps to sensor values 0.0, 0.5, 1.0
      const lastY = indiv.lastMoveDir.asNormalizedCoord().y;
      sensorVal = lastY == 0 ? 0.5 : lastY == -1 ? 0.0 : 1.0;
      break;
    case Sensors.LOC_X:
      // Maps current X location 0..params.sizeX-1 to sensor range 0.0..1.0
      sensorVal = indiv.loc.x / (params.sizeX - 1);
      break;
    case Sensors.LOC_Y:
      // Maps current Y location 0..params.sizeY-1 to sensor range 0.0..1.0
      sensorVal = indiv.loc.y / (params.sizeY - 1);
      break;
    case Sensors.OSC1:
      // Maps the oscillator sine wave to sensor range 0.0..1.0;
      // cycles starts at sim.simStep 0 for everbody.
      const phase = (sim.simStep % indiv.oscPeriod) / indiv.oscPeriod; // 0.0..1.0
      let factor = -Math.cos(phase * 2.0 * 3.1415927);
      factor += 1.0; // convert to 0.0..2.0
      factor /= 2.0; // convert to 0.0..1.0
      sensorVal = factor;
      // Clip any round-off error
      sensorVal = Math.min(1.0, Math.max(0.0, sensorVal));
      break;
    case Sensors.LONGPROBE_POP_FWD:
      // Measures the distance to the nearest other individual in the
      // forward direction. If non found, returns the maximum sensor value.
      // Maps the result to the sensor range 0.0..1.0.
      sensorVal =
        longProbePopulationFwd(
          indiv.loc,
          indiv.lastMoveDir,
          indiv.longProbeDist,
          sim.grid
        ) / indiv.longProbeDist; // 0..1
      break;
    case Sensors.LONGPROBE_BAR_FWD:
      // Measures the distance to the nearest barrier in the forward
      // direction. If non found, returns the maximum sensor value.
      // Maps the result to the sensor range 0.0..1.0.
      sensorVal =
        longProbeBarrierFwd(
          indiv.loc,
          indiv.lastMoveDir,
          indiv.longProbeDist,
          sim.grid
        ) / indiv.longProbeDist; // 0..1
      break;
    case Sensors.POPULATION:
      // Returns population density in neighborhood converted linearly from
      // 0..100% to sensor range
      let countLocs = 0;
      let countOccupied = 0;
      const center = indiv.loc;

      const f = (tloc: Coord) => {
        ++countLocs;
        if (sim.grid.isOccupiedAt(tloc)) {
          ++countOccupied;
        }
      };

      visitNeighborhood(center, params.populationSensorRadius, f);
      sensorVal = countOccupied / countLocs;
      break;
    case Sensors.POPULATION_FWD:
      // Sense population density along axis of last movement direction, mapped
      // to sensor range 0.0..1.0
      sensorVal = getPopulationDensityAlongAxis(
        indiv.loc,
        indiv.lastMoveDir,
        sim.grid
      );
      break;
    case Sensors.POPULATION_LR:
      // Sense population density along an axis 90 degrees from last movement direction
      sensorVal = getPopulationDensityAlongAxis(
        indiv.loc,
        indiv.lastMoveDir.rotate90DegCW(),
        sim.grid
      );
      break;
    case Sensors.BARRIER_FWD:
      // Sense the nearest barrier along axis of last movement direction, mapped
      // to sensor range 0.0..1.0
      sensorVal = getShortProbeBarrierDistance(
        indiv.loc,
        indiv.lastMoveDir,
        params.shortProbeBarrierDistance,
        sim.grid
      );
      break;
    case Sensors.BARRIER_LR:
      // Sense the nearest barrier along axis perpendicular to last movement direction, mapped
      // to sensor range 0.0..1.0
      sensorVal = getShortProbeBarrierDistance(
        indiv.loc,
        indiv.lastMoveDir.rotate90DegCW(),
        params.shortProbeBarrierDistance,
        sim.grid
      );
      break;
    case Sensors.RANDOM:
      // Returns a random sensor value in the range 0.0..1.0.
      sensorVal = Math.random();
      break;
    case Sensors.SIGNAL0:
      // Returns magnitude of signal0 in the local neighborhood, with
      // 0.0..maxSignalSum converted to sensorRange 0.0..1.0
      sensorVal = getSignalDensity(0, indiv.loc, sim.signals);
      break;
    case Sensors.SIGNAL0_FWD:
      // Sense signal0 density along axis of last movement direction
      sensorVal = getSignalDensityAlongAxis(
        0,
        indiv.loc,
        indiv.lastMoveDir,
        sim.signals
      );
      break;
    case Sensors.SIGNAL0_LR:
      // Sense signal0 density along an axis perpendicular to last movement direction
      sensorVal = getSignalDensityAlongAxis(
        0,
        indiv.loc,
        indiv.lastMoveDir.rotate90DegCW(),
        sim.signals
      );
      break;
    case Sensors.GENETIC_SIM_FWD:
      // Return minimum sensor value if nobody is alive in the forward adjacent location,
      // else returns a similarity match in the sensor range 0.0..1.0
      const loc2 = indiv.loc.add(indiv.lastMoveDir.asNormalizedCoord());
      if (sim.grid.isInBounds(loc2) && sim.grid.isOccupiedAt(loc2)) {
        const indiv2 = sim.peeps.individuals[sim.grid.get(loc2)];
        if (indiv2.alive) {
          sensorVal = indiv.genome.similarity(indiv2.genome); // 0.0..1.0
        }
      }
      break;
    default:
      throw new Error();
  }
  sensorVal = Math.max(0, Math.min(sensorVal, 1.0)); // clamp to 0.0..1.0
  return sensorVal;
}
