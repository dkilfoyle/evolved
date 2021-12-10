// Given a factor in the range 0.0..1.0, return a bool with the
// probability of it being true proportional to factor. For example, if
// factor == 0.2, then there is a 20% chance this function will

import { Coord, Dir } from './coord';
import { Individual } from './individual';
import { Actions, SimState } from './models';
import { params } from './params';

// return true.
function prob2bool(factor: number) {
  if (!(factor >= 0.0 && factor <= 1.0)) throw new Error();
  return Math.random() < factor;
}

// This takes a probability from 0.0..1.0 and adjusts it according to an
// exponential curve. The steepness of the curve is determined by the K factor
// which is a small positive integer. This tends to reduce the activity level
// a bit (makes the peeps less reactive and jittery).
function responseCurve(r: number) {
  const k = params.responsivenessCurveKFactor;
  return Math.pow(r - 2.0, -2.0 * k) - Math.pow(2.0, -2.0 * k) * (1.0 - r);
}

/**********************************************************************************
Action levels are driven by sensors or internal neurons as connected by an agent's
neural net brain. Each agent's neural net is reevaluated once each simulator
step (simStep). After evaluating the action neuron outputs, this function is
called to execute the actions according to their output levels. This function is
called in multi-threaded mode and operates on a single individual while other
threads are doing to the same to other individuals.
Action (their output) values arrive here as floating point values of arbitrary
range (because they are the raw sums of zero or more weighted inputs) and will
eventually be converted in this function to a probability 0.0..1.0 of actually
getting executed.
For the various possible action neurons, if they are driven by a sufficiently
strong level, we do this:
    MOVE_* actions- queue our agent for deferred movement with peeps.queueForMove(); the
         queue will be executed at the end of the multithreaded loop in a single thread.
    SET_RESPONSIVENESS action - immediately change indiv.responsiveness to the action
         level scaled to 0.0..1.0 (because we have exclusive access to this member in
         our own individual during this function)
    SET_OSCILLATOR_PERIOD action - immediately change our individual's indiv.oscPeriod
         to the action level exponentially scaled to 2..2048 (TBD)
    EMIT_SIGNALn action(s) - immediately increment the signal level at our agent's
         location using signals.increment() (using a thread-safe call)
    KILL_FORWARD action - queue the other agent for deferred death with
         peeps.queueForDeath()
The deferred movement and death queues will be emptied by the caller at the end of the
simulator step by endOfSimStep() in a single thread after all individuals have been
evaluated multithreadedly.
**********************************************************************************/

export function executeActions(
  indiv: Individual,
  actionLevels: number[],
  sim: SimState
) {
  // Only a subset of all possible actions might be enabled (i.e., compiled in).
  // This returns true if the specified action is enabled. See sensors-actions.h
  // for how to enable sensors and actions during compilation.
  const isEnabled = (action: Actions) => {
    return action < Actions.NUM_ACTIONS;
  };

  // Responsiveness action - convert neuron action level from arbitrary let range
  // to the range 0.0..1.0. If this action neuron is enabled but not driven, will
  // default to mid-level 0.5.
  if (isEnabled(Actions.SET_RESPONSIVENESS)) {
    let level = actionLevels[Actions.SET_RESPONSIVENESS]; // default 0.0
    level = (Math.tanh(level) + 1.0) / 2.0; // convert to 0.0..1.0
    indiv.responsiveness = level;
  }

  // For the rest of the action outputs, we'll apply an adjusted responsiveness
  // factor (see responseCurve() for more info). Range 0.0..1.0.
  const responsivenessAdjusted = responseCurve(indiv.responsiveness);

  // Oscillator period action - convert action level nonlinearly to
  // 2..4*p.stepsPerGeneration. If this action neuron is enabled but not driven,
  // will default to 1.5 + e^(3.5) = a period of 34 simSteps.
  if (isEnabled(Actions.SET_OSCILLATOR_PERIOD)) {
    const periodf = actionLevels[Actions.SET_OSCILLATOR_PERIOD];
    const newPeriodf01 = (Math.tanh(periodf) + 1.0) / 2.0; // convert to 0.0..1.0
    const newPeriod = 1 + (1.5 + Math.exp(7.0 * newPeriodf01));
    if (!(newPeriod >= 2 && newPeriod <= 2048)) throw new Error();
    indiv.oscPeriod = newPeriod;
  }

  // Set longProbeDistance - convert action level to 1..maxLongProbeDistance.
  // If this action neuron is enabled but not driven, will default to
  // mid-level period of 17 simSteps.
  if (isEnabled(Actions.SET_LONGPROBE_DIST)) {
    const maxLongProbeDistance = 32;
    let level = actionLevels[Actions.SET_LONGPROBE_DIST];
    level = (Math.tanh(level) + 1.0) / 2.0; // convert to 0.0..1.0
    level = 1 + level * maxLongProbeDistance;
    indiv.longProbeDist = level;
  }

  // Emit signal0 - if this action value is below a threshold, nothing emitted.
  // Otherwise convert the action value to a probability of emitting one unit of
  // signal (pheromone).
  // Pheromones may be emitted immediately (see signals.cpp). If this action neuron
  // is enabled but not driven, nothing will be emitted.
  if (isEnabled(Actions.EMIT_SIGNAL0)) {
    const emitThreshold = 0.5; // 0.0..1.0; 0.5 is midlevel
    let level = actionLevels[Actions.EMIT_SIGNAL0];
    level = (Math.tanh(level) + 1.0) / 2.0; // convert to 0.0..1.0
    level *= responsivenessAdjusted;
    if (level > emitThreshold && prob2bool(level)) {
      sim.signals.increment(0, indiv.loc, sim);
    }
  }

  // Kill forward -- if this action value is > threshold, value is converted to probability
  // of an attempted murder. Probabilities under the threshold are considered 0.0.
  // If this action neuron is enabled but not driven, the neighbors are safe.
  if (isEnabled(Actions.KILL_FORWARD) && params.killEnable) {
    const killThreshold = 0.5; // 0.0..1.0; 0.5 is midlevel
    let level = actionLevels[Actions.KILL_FORWARD];
    level = (Math.tanh(level) + 1.0) / 2.0; // convert to 0.0..1.0
    level *= responsivenessAdjusted;
    if (level > killThreshold && prob2bool(level)) {
      const otherLoc = indiv.loc.add(indiv.lastMoveDir.asNormalizedCoord());
      if (sim.grid.isInBounds(otherLoc) && sim.grid.isOccupiedAt(otherLoc)) {
        const indiv2 = sim.peeps.individuals[sim.grid.get(otherLoc)];
        if (indiv2.alive) {
          if (!(indiv.loc.sub(indiv2.loc).length() == 1)) throw new Error();
          sim.peeps.queueForDeath(indiv2);
        }
      }
    }
  }

  // ------------- Movement action neurons ---------------

  // There are multiple action neurons for movement. Each type of movement neuron
  // urges the individual to move in some specific direction. We sum up all the
  // X and Y components of all the movement urges, then pass the X and Y sums through
  // a transfer function (tanh()) to get a range -1.0..1.0. The absolute values of the
  // X and Y values are passed through prob2bool() to convert to -1, 0, or 1, then
  // multiplied by the component's signum. This results in the x and y components of
  // a normalized movement offset. I.e., the probability of movement in either
  // dimension is the absolute value of tanh of the action level X,Y components and
  // the direction is the sign of the X, Y components. For example, for a particular
  // action neuron:
  //     X, Y == -5.9, +0.3 as raw action levels received here
  //     X, Y == -0.999, +0.29 after passing raw values through tanh()
  //     Xprob, Yprob == 99.9%, 29% probability of X and Y becoming 1 (or -1)
  //     X, Y == -1, 0 after applying the sign and probability
  //     The agent will then be moved West (an offset of -1, 0) if it's a legal move.

  let level;
  let offset;
  const lastMoveOffset = indiv.lastMoveDir.asNormalizedCoord();

  // moveX,moveY will be the accumulators that will hold the sum of all the
  // urges to move along each axis. (+- floating values of arbitrary range)
  let moveX = isEnabled(Actions.MOVE_X) ? actionLevels[Actions.MOVE_X] : 0.0;
  let moveY = isEnabled(Actions.MOVE_Y) ? actionLevels[Actions.MOVE_Y] : 0.0;

  if (isEnabled(Actions.MOVE_EAST)) moveX += actionLevels[Actions.MOVE_EAST];
  if (isEnabled(Actions.MOVE_WEST)) moveX -= actionLevels[Actions.MOVE_WEST];
  if (isEnabled(Actions.MOVE_NORTH)) moveY += actionLevels[Actions.MOVE_NORTH];
  if (isEnabled(Actions.MOVE_SOUTH)) moveY -= actionLevels[Actions.MOVE_SOUTH];

  if (isEnabled(Actions.MOVE_FORWARD)) {
    level = actionLevels[Actions.MOVE_FORWARD];
    moveX += lastMoveOffset.x * level;
    moveY += lastMoveOffset.y * level;
  }
  if (isEnabled(Actions.MOVE_REVERSE)) {
    level = actionLevels[Actions.MOVE_REVERSE];
    moveX -= lastMoveOffset.x * level;
    moveY -= lastMoveOffset.y * level;
  }
  if (isEnabled(Actions.MOVE_LEFT)) {
    level = actionLevels[Actions.MOVE_LEFT];
    offset = indiv.lastMoveDir.rotate90DegCCW().asNormalizedCoord();
    moveX += offset.x * level;
    moveY += offset.y * level;
  }
  if (isEnabled(Actions.MOVE_RIGHT)) {
    level = actionLevels[Actions.MOVE_RIGHT];
    offset = indiv.lastMoveDir.rotate90DegCW().asNormalizedCoord();
    moveX += offset.x * level;
    moveY += offset.y * level;
  }
  if (isEnabled(Actions.MOVE_RL)) {
    level = actionLevels[Actions.MOVE_RL];
    offset = indiv.lastMoveDir.rotate90DegCW().asNormalizedCoord();
    moveX += offset.x * level;
    moveY += offset.y * level;
  }

  if (isEnabled(Actions.MOVE_RANDOM)) {
    level = actionLevels[Actions.MOVE_RANDOM];
    offset = Dir.random8().asNormalizedCoord();
    moveX += offset.x * level;
    moveY += offset.y * level;
  }

  // Convert the accumulated X, Y sums to the range -1.0..1.0 and scale by the
  // individual's responsiveness (0.0..1.0) (adjusted by a curve)
  moveX = Math.tanh(moveX);
  moveY = Math.tanh(moveY);
  moveX *= responsivenessAdjusted;
  moveY *= responsivenessAdjusted;

  // The probability of movement along each axis is the absolute value
  const probX = prob2bool(Math.abs(moveX)) ? 1 : 0; // convert abs(level) to 0 or 1
  const probY = prob2bool(Math.abs(moveY)) ? 1 : 0; // convert abs(level) to 0 or 1

  // The direction of movement (if any) along each axis is the sign
  const signumX = moveX < 0.0 ? -1 : 1;
  const signumY = moveY < 0.0 ? -1 : 1;

  // Generate a normalized movement offset, where each component is -1, 0, or 1
  const movementOffset = new Coord(probX * signumX, probY * signumY);

  // Move there if it's a valid location
  const newLoc = indiv.loc.add(movementOffset);
  if (sim.grid.isInBounds(newLoc) && sim.grid.isEmptyAt(newLoc)) {
    sim.peeps.queueForMove(indiv, newLoc);
  }
}
