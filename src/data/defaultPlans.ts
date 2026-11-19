import { ExerciseDefinition, WorkoutPlan } from '../types/workout';

export const DEFAULT_EXERCISES: ExerciseDefinition[] = [
  // ================= BACK =================
  {
    id: 'ex-single-arm-db-row',
    name: 'Single-Arm Bench-Supported Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms', 'Shoulders'],
    equipment: 'Dumbbell (Single)',
    benchAngle: 'Flat Bench (0°)',
    defaultRestSeconds: 75,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 45,
    unilateral: true,
    setupCues: [
      'Set bench flat (0°). Place non-working hand and knee firmly on the bench.',
      'Keep your torso nearly parallel to the floor with a flat, braced spine.'
    ],
    executionCues: [
      'Pull the dumbbell in an arc toward your hip pocket (not straight up to your chest) to maximize lat recruitment.',
      'Pause 1 second at the top, then let your shoulder blade stretch slightly at the bottom.'
    ],
    whyItWorks: 'Allows heavy unilateral loading (up to 55 lbs) with zero lower-back strain and full lat stretch.'
  },
  {
    id: 'ex-chest-supported-incline-row',
    name: 'Chest-Supported Incline DB Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Traps', 'Shoulders'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Incline (45°)',
    defaultRestSeconds: 75,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 35,
    unilateral: false,
    setupCues: [
      'Set bench to a 30°–45° incline and lie chest-down with feet planted wide for stability.',
      'Let arms hang straight down with a neutral or 45° grip.'
    ],
    executionCues: [
      'Drive elbows back and squeeze your shoulder blades together hard for 1 full second at the top.',
      'Control the lowering phase over 2 seconds without bouncing off the bottom.'
    ],
    whyItWorks: 'Eliminates momentum completely so 35–50 lb dumbbells build dense mid-back, rhomboids, and lats.'
  },
  {
    id: 'ex-db-pullover',
    name: 'Flat Bench Dumbbell Pullover',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Chest', 'Triceps'],
    equipment: 'Dumbbell (Single)',
    benchAngle: 'Flat Bench (0°)',
    defaultRestSeconds: 60,
    repRangeMin: 10,
    repRangeMax: 12,
    startingWeightLbs: 40,
    unilateral: false,
    setupCues: [
      'Lie flat on the bench (or upper back across the bench) holding the inside plate of one dumbbell with both hands in a diamond grip.',
      'Keep a slight, fixed 15° bend in your elbows throughout the entire set.'
    ],
    executionCues: [
      'Lower the dumbbell in a wide arc behind your head until you feel a deep stretch in your lats (2–3 seconds down).',
      'Pull the weight back to forehead/eye level by driving with your lats and triceps long head.'
    ],
    whyItWorks: 'One of the only free-weight exercises that loads the lats and triceps long head in a fully stretched overhead position.'
  },
  {
    id: 'ex-rear-delt-row',
    name: 'Wide-Elbow Upper Back Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Shoulders', 'Traps'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Low Incline (30°)',
    defaultRestSeconds: 60,
    repRangeMin: 10,
    repRangeMax: 15,
    startingWeightLbs: 30,
    unilateral: false,
    setupCues: [
      'Set bench to 30° incline, lie chest-down, and use a pronated (palms facing back) grip.',
      'Flare elbows out at roughly a 60°–75° angle from your torso.'
    ],
    executionCues: [
      'Row the dumbbells toward your upper chest/collarbone line.',
      'Hold the top contraction for 1 second to blow up upper traps, rear delts, and teres major.'
    ],
    whyItWorks: 'Targets the upper back shelf and rear delts for wider, thicker upper-body posture.'
  },

  // ================= SHOULDERS =================
  {
    id: 'ex-seated-db-shoulder-press',
    name: 'Seated DB Overhead Shoulder Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Chest'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Seated Upright (75–85°)',
    defaultRestSeconds: 90,
    repRangeMin: 6,
    repRangeMax: 10,
    startingWeightLbs: 35,
    unilateral: false,
    setupCues: [
      'Set bench one notch forward of vertical (75°–80°) to protect shoulder joints and recruit upper chest/delts.',
      'Tuck elbows slightly forward (about 30° into the scapular plane) rather than flared straight out.'
    ],
    executionCues: [
      'Press explosively overhead until biceps are near ears, stopping just short of clanking the dumbbells together.',
      'Lower under control until the dumbbells touch ear/chin level.'
    ],
    whyItWorks: 'Primary compound builder for pressing strength and anterior/lateral deltoid mass.'
  },
  {
    id: 'ex-db-push-press',
    name: 'Explosive Dumbbell Push Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Core'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Standing',
    defaultRestSeconds: 90,
    repRangeMin: 6,
    repRangeMax: 8,
    startingWeightLbs: 40,
    unilateral: false,
    setupCues: [
      'Stand with feet shoulder-width apart, dumbbells resting on your front delts in a neutral or semi-pronated grip.',
      'Brace abs and glutes tightly.'
    ],
    executionCues: [
      'Dip knees 3–4 inches, then drive explosively through the floor to launch the dumbbells overhead (Power concentric).',
      'Lower the weights back to your shoulders using a strict, slow 3-second negative.'
    ],
    whyItWorks: 'Develops upper-body explosive power and lets you overload the shoulders and triceps with 5–10 lbs more on the eccentric.'
  },
  {
    id: 'ex-db-lateral-raise',
    name: 'Dumbbell Lateral Raise (Scapular Plane)',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Traps'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Standing',
    defaultRestSeconds: 60,
    repRangeMin: 10,
    repRangeMax: 15,
    startingWeightLbs: 15,
    unilateral: false,
    setupCues: [
      'Stand tall with a slight 10° forward hip hinge; hold dumbbells slightly in front of your thighs.',
      'Keep a soft 15° bend in your elbows.'
    ],
    executionCues: [
      'Push your hands "out toward the walls" (not up with your traps) in a 20°–30° forward plane until arms are parallel to the floor.',
      'Lower over a controlled 2-second count without resting completely at your sides.'
    ],
    whyItWorks: 'Directly isolates the lateral deltoid head responsible for shoulder width and the V-taper silhouette.'
  },
  {
    id: 'ex-chest-supported-rear-delt-fly',
    name: 'Chest-Supported Rear Delt Fly',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Back', 'Traps'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Low Incline (30°)',
    defaultRestSeconds: 60,
    repRangeMin: 12,
    repRangeMax: 15,
    startingWeightLbs: 15,
    unilateral: false,
    setupCues: [
      'Lie chest-down on a 30° incline bench so your torso is stabilized.',
      'Use a neutral or pinky-slightly-out grip.'
    ],
    executionCues: [
      'Sweep the dumbbells out wide in a big arc without pinching your shoulder blades together first (isolate the rear delts).',
      'Pause briefly at the top, then control the negative.'
    ],
    whyItWorks: 'Completes the 3D shoulder cap and balances heavy pressing to keep shoulder joints healthy.'
  },
  {
    id: 'ex-arnold-press',
    name: 'Seated Arnold Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Seated Upright (75–85°)',
    defaultRestSeconds: 75,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 30,
    unilateral: false,
    setupCues: [
      'Sit upright against a 75°–85° bench holding dumbbells at chin height with palms facing you (like the top of a curl).'
    ],
    executionCues: [
      'As you press up, smoothly rotate your palms outward so they face forward at lockout.',
      'Reverse the rotation slowly on the way down for maximum time under tension across all three delt heads.'
    ],
    whyItWorks: 'Increases range of motion and time under tension so moderate dumbbell weights stimulate maximum delt hypertrophy.'
  },

  // ================= BICEPS & FOREARMS =================
  {
    id: 'ex-incline-db-curl',
    name: 'Incline Dumbbell Curl (Deep Stretch)',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Incline (45°)',
    defaultRestSeconds: 60,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 20,
    unilateral: false,
    setupCues: [
      'Set the bench to 45°–60°. Sit back with shoulder blades pinned and let arms hang perpendicular to the floor behind your torso.',
      'Keep palms supinated (facing forward) from the bottom.'
    ],
    executionCues: [
      'Curl the weights up while keeping your elbows locked behind your body—do not let elbows drift forward.',
      'Lower all the way down into a full 1-second biceps stretch at the bottom of every rep.'
    ],
    whyItWorks: 'Places maximal stretch tension on the long head of the biceps, proven to drive superior biceps peak and growth.'
  },
  {
    id: 'ex-hammer-curl',
    name: 'Alternating DB Hammer Curl',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Standing',
    defaultRestSeconds: 60,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 25,
    unilateral: false,
    setupCues: [
      'Stand tall holding dumbbells with a neutral (palms facing each other) grip.',
      'Pin upper arms to the sides of your ribcage.'
    ],
    executionCues: [
      'Curl upward powerfully, squeezing the thumb-side of your forearm and biceps at the top.',
      'Control the descent for 2 seconds before initiating the opposite arm.'
    ],
    whyItWorks: 'Targets the brachialis (underneath the biceps, pushing it up for thicker arms) and the brachioradialis for thick forearms.'
  },
  {
    id: 'ex-spider-preacher-curl',
    name: 'Incline Bench Preacher / Spider Curl',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'High Incline (60°)',
    defaultRestSeconds: 60,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 20,
    unilateral: false,
    setupCues: [
      'Set bench to 60°. Drape your chest or armpits over the top of the backrest so your upper arms rest against the pad or hang vertical.',
      'Supinate wrists fully (pinkies turned slightly upward).'
    ],
    executionCues: [
      'Curl smoothly to full contraction, holding the top squeeze for 1 full second.',
      'Lower slowly (2–3s) without using torso momentum.'
    ],
    whyItWorks: 'Zero-cheat isolation of the biceps short head for front-view arm width and peak contraction.'
  },
  {
    id: 'ex-zottman-curl',
    name: 'Dumbbell Zottman Curl',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Standing',
    defaultRestSeconds: 60,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 20,
    unilateral: false,
    setupCues: [
      'Stand with dumbbells at your sides, palms facing forward (supinated).'
    ],
    executionCues: [
      'Curl the weights up with palms up just like a strict biceps curl.',
      'At the top, rotate your wrists 180° so palms face down (pronated) and lower slowly over 3 seconds.'
    ],
    whyItWorks: 'Combines a heavy supinated concentric for the biceps with an overloaded pronated eccentric for massive forearms and elbow health.'
  },
  {
    id: 'ex-concentration-curl',
    name: 'Seated Concentration Curl',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell (Single)',
    benchAngle: 'Flat Bench (0°)',
    defaultRestSeconds: 60,
    repRangeMin: 10,
    repRangeMax: 15,
    startingWeightLbs: 25,
    unilateral: true,
    setupCues: [
      'Sit on the flat bench, spread knees wide, and brace the back of your working upper arm against your inner thigh.'
    ],
    executionCues: [
      'Curl toward your face while actively twisting your pinky finger higher than your thumb.',
      'Squeeze hard at the top, then extend fully until the arm is nearly straight.'
    ],
    whyItWorks: 'Highest EMG biceps activation of any curl variation—awesome finisher when chasing a pump.'
  },

  // ================= TRICEPS =================
  {
    id: 'ex-db-skullcrusher',
    name: 'Flat Bench DB Skullcrushers',
    primaryMuscle: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Flat Bench (0°)',
    defaultRestSeconds: 60,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 20,
    unilateral: false,
    setupCues: [
      'Lie on a flat bench holding dumbbells with a neutral (hammer) grip.',
      'Angle your upper arms back slightly (about 15° toward the wall behind your head) to keep constant tension on the triceps.'
    ],
    executionCues: [
      'Bend only at the elbows to lower the bells beside your ears/temples.',
      'Extend powerfully back to the starting angle without moving your upper arms.'
    ],
    whyItWorks: 'Hits all three heads of the triceps with neutral-grip wrist comfort.'
  },
  {
    id: 'ex-overhead-db-triceps-ext',
    name: 'Seated Overhead Single-DB Extension',
    primaryMuscle: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Dumbbell (Single)',
    benchAngle: 'Seated Upright (75–85°)',
    defaultRestSeconds: 60,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 40,
    unilateral: false,
    setupCues: [
      'Sit against a 75°–85° bench holding one heavy dumbbell vertically overhead with both hands cupped under the top plate.',
      'Keep elbows pointed forward and close to your head.'
    ],
    executionCues: [
      'Lower the dumbbell deep behind your neck to stretch the triceps long head (which makes up 2/3 of triceps mass).',
      'Press straight up to full lockout.'
    ],
    whyItWorks: 'Overhead arm elevation maximally stretches the triceps long head for upper-arm sleeve-filling size.'
  },
  {
    id: 'ex-close-grip-neutral-db-press',
    name: 'Close-Grip Neutral DB Bench Press',
    primaryMuscle: 'Triceps',
    secondaryMuscles: ['Chest', 'Shoulders'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Flat Bench (0°)',
    defaultRestSeconds: 75,
    repRangeMin: 8,
    repRangeMax: 12,
    startingWeightLbs: 40,
    unilateral: false,
    setupCues: [
      'Lie on the flat bench pressing two dumbbells together with palms facing each other (neutral grip).',
      'Keep elbows tucked tight against your ribcage.'
    ],
    executionCues: [
      'Lower the dumbbells to your lower chest/ribs while grazing your sides with your elbows.',
      'Drive up explosively and lock out the triceps at the top.'
    ],
    whyItWorks: 'Allows heavy compound loading (40–55 lbs per hand) on the triceps lateral and medial heads.'
  },
  {
    id: 'ex-diamond-pushup-or-dips',
    name: 'Diamond Push-Ups / Bench Dips',
    primaryMuscle: 'Triceps',
    secondaryMuscles: ['Chest', 'Shoulders'],
    equipment: 'Bodyweight + DB',
    benchAngle: 'Floor / Bench Edge',
    defaultRestSeconds: 60,
    repRangeMin: 10,
    repRangeMax: 15,
    startingWeightLbs: 0,
    unilateral: false,
    setupCues: [
      'Option A: Hands close on the floor or elevated on the bench edge in a diamond/shoulder-width tuck.',
      'Option B: Hands on the edge of the flat bench, heels on floor (place a dumbbell across your lap to add weight).'
    ],
    executionCues: [
      'Lower under control over 2 seconds, keeping elbows tracking back (not flared wide).',
      'Drive hard to full triceps lockout on every rep.'
    ],
    whyItWorks: 'Zero dumbbell dial-switching time when paired in a superset, and finishes the triceps and chest with high metabolic stress.'
  },

  // ================= CHEST / UPPER BODY PRESSING & TRAPS =================
  {
    id: 'ex-incline-db-bench-press',
    name: 'Incline Dumbbell Bench Press (30°)',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Low Incline (30°)',
    defaultRestSeconds: 90,
    repRangeMin: 6,
    repRangeMax: 10,
    startingWeightLbs: 45,
    unilateral: false,
    setupCues: [
      'Set the bench to a low 30° incline (1–2 notches up from flat) to hit upper chest and front delts simultaneously.',
      'Retract shoulder blades into the pad and plant feet hard.'
    ],
    executionCues: [
      'Lower dumbbells with a 45° elbow tuck until the bells are level with your chest for a full stretch.',
      'Press up and slightly inward with explosive power.'
    ],
    whyItWorks: 'Builds the upper-chest shelf, front delts, and pressing triceps strength simultaneously.'
  },
  {
    id: 'ex-db-shrugs',
    name: 'Dumbbell Shrugs (2s Peak Hold)',
    primaryMuscle: 'Traps',
    secondaryMuscles: ['Forearms', 'Back'],
    equipment: 'Dumbbell (Pair)',
    benchAngle: 'Standing',
    defaultRestSeconds: 60,
    repRangeMin: 10,
    repRangeMax: 15,
    startingWeightLbs: 50,
    unilateral: false,
    setupCues: [
      'Stand tall with heavy dumbbells held slightly in front of/beside your thighs and lean forward 5°.'
    ],
    executionCues: [
      'Shrug your shoulders straight up and slightly back toward your ears.',
      'Hold the top contraction for a strict 2-second count on every single rep.'
    ],
    whyItWorks: 'Uses a 2-second isometric pause so 50–55 lb dumbbells thoroughly exhaust the upper traps and grip.'
  },
  {
    id: 'ex-feet-elevated-pushup',
    name: 'Feet-Elevated Bench Push-Ups',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps', 'Core'],
    equipment: 'Bodyweight',
    benchAngle: 'Floor / Bench Edge',
    defaultRestSeconds: 60,
    repRangeMin: 10,
    repRangeMax: 18,
    startingWeightLbs: 0,
    unilateral: false,
    setupCues: [
      'Place toes on the flat bench and hands slightly wider than shoulder-width on the floor (or hold hexagonal dumbbells as push-up handles for deeper stretch).'
    ],
    executionCues: [
      'Keep core rigid, lower chest deep between your hands, and explode up.'
    ],
    whyItWorks: 'Shifts more bodyweight onto the upper chest, shoulders, and triceps while requiring zero dumbbell change time.'
  }
];

export const DEFAULT_WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'plan-upper-a',
    code: 'A',
    name: 'Workout A — Heavy Strength & Thickness',
    subtitle: 'Compound Pressing & Pulling + Heavy Arm Builders',
    estimatedMinutes: 35,
    focusMuscles: ['Back', 'Shoulders', 'Biceps', 'Triceps', 'Chest'],
    description:
      'Built around heavy compound supersets (A1/A2 & B1/B2) followed by an arm/delt isolation pair (C1/C2). Move from A1 to A2 with ~45s transition, rest 75s, and repeat for 3 sets to finish 18 sets in ~35 minutes.',
    sortOrder: 1,
    updatedAt: '2026-11-18T08:00:00.000Z',
    exercises: [
      {
        slotId: 'slot-a1',
        exerciseId: 'ex-incline-db-bench-press',
        supersetTag: 'A1',
        targetSets: 3,
        repRangeMin: 6,
        repRangeMax: 10,
        restSeconds: 60,
        coachingNote: '30° bench. Explosive up, 2s controlled lowering. Pair with A2.'
      },
      {
        slotId: 'slot-a2',
        exerciseId: 'ex-single-arm-db-row',
        supersetTag: 'A2',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 10,
        restSeconds: 75,
        coachingNote: 'Pull toward your hip pocket. Log the weight used per hand.'
      },
      {
        slotId: 'slot-b1',
        exerciseId: 'ex-seated-db-shoulder-press',
        supersetTag: 'B1',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 10,
        restSeconds: 60,
        coachingNote: '75°–80° upright bench. Elbows tucked 30° into scapular plane.'
      },
      {
        slotId: 'slot-b2',
        exerciseId: 'ex-hammer-curl',
        supersetTag: 'B2',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        restSeconds: 75,
        coachingNote: 'Neutral grip for brachialis & forearm thickness.'
      },
      {
        slotId: 'slot-c1',
        exerciseId: 'ex-db-skullcrusher',
        supersetTag: 'C1',
        targetSets: 3,
        repRangeMin: 10,
        repRangeMax: 12,
        restSeconds: 45,
        coachingNote: 'Keep upper arms angled slightly back to maintain constant tension.'
      },
      {
        slotId: 'slot-c2',
        exerciseId: 'ex-db-lateral-raise',
        supersetTag: 'C2',
        targetSets: 3,
        repRangeMin: 10,
        repRangeMax: 15,
        restSeconds: 60,
        coachingNote: 'Lead with elbows out in the scapular plane; 2s lowering.'
      }
    ]
  },
  {
    id: 'plan-upper-b',
    code: 'B',
    name: 'Workout B — Hypertrophy, V-Taper & Arm Peak',
    subtitle: 'Stretch-Loaded Biceps, Triceps Long Head, Back & 3D Delts',
    estimatedMinutes: 35,
    focusMuscles: ['Biceps', 'Triceps', 'Back', 'Shoulders', 'Traps'],
    description:
      'Emphasizes loaded stretch positions on the adjustable bench (incline rows, incline curls, overhead triceps extensions) where moderate dumbbell weights stimulate maximum muscle fiber growth.',
    sortOrder: 2,
    updatedAt: '2026-11-18T08:00:00.000Z',
    exercises: [
      {
        slotId: 'slot-b-a1',
        exerciseId: 'ex-chest-supported-incline-row',
        supersetTag: 'A1',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        restSeconds: 60,
        coachingNote: '45° bench chest-down. Hold the top squeeze for 1 full second.'
      },
      {
        slotId: 'slot-b-a2',
        exerciseId: 'ex-close-grip-neutral-db-press',
        supersetTag: 'A2',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        restSeconds: 75,
        coachingNote: 'Press bells together with neutral grip; elbows tight to ribs for triceps power.'
      },
      {
        slotId: 'slot-b-b1',
        exerciseId: 'ex-incline-db-curl',
        supersetTag: 'B1',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        restSeconds: 45,
        coachingNote: '45°–60° bench. Keep elbows pinned back for a deep biceps stretch.'
      },
      {
        slotId: 'slot-b-b2',
        exerciseId: 'ex-overhead-db-triceps-ext',
        supersetTag: 'B2',
        targetSets: 3,
        repRangeMin: 10,
        repRangeMax: 12,
        restSeconds: 60,
        coachingNote: 'Single heavy DB held with both hands overhead; deep stretch behind neck.'
      },
      {
        slotId: 'slot-b-c1',
        exerciseId: 'ex-chest-supported-rear-delt-fly',
        supersetTag: 'C1',
        targetSets: 3,
        repRangeMin: 12,
        repRangeMax: 15,
        restSeconds: 45,
        coachingNote: '30° bench chest-down. Sweep wide to isolate rear delts.'
      },
      {
        slotId: 'slot-b-c2',
        exerciseId: 'ex-db-shrugs',
        supersetTag: 'C2',
        targetSets: 3,
        repRangeMin: 10,
        repRangeMax: 15,
        restSeconds: 60,
        coachingNote: 'Hold each rep at the top for a strict 2-second count.'
      }
    ]
  },
  {
    id: 'plan-upper-c',
    code: 'C',
    name: 'Workout C — Power & Arm Specialization',
    subtitle: 'Explosive Overhead Drive + High-Volume Biceps, Triceps & Delts',
    estimatedMinutes: 35,
    focusMuscles: ['Shoulders', 'Biceps', 'Triceps', 'Back', 'Forearms'],
    description:
      'Starts with explosive overhead power and full-range lat pullovers, then moves into high-density biceps, triceps, forearm, and shoulder specialization.',
    sortOrder: 3,
    updatedAt: '2026-11-18T08:00:00.000Z',
    exercises: [
      {
        slotId: 'slot-c-a1',
        exerciseId: 'ex-db-push-press',
        supersetTag: 'A1',
        targetSets: 3,
        repRangeMin: 6,
        repRangeMax: 8,
        restSeconds: 60,
        coachingNote: 'Dip knees 3 inches & drive explosively overhead; lower in a slow 3s count.'
      },
      {
        slotId: 'slot-c-a2',
        exerciseId: 'ex-db-pullover',
        supersetTag: 'A2',
        targetSets: 3,
        repRangeMin: 10,
        repRangeMax: 12,
        restSeconds: 75,
        coachingNote: 'Single heavy DB across flat bench; deep overhead lat & triceps stretch.'
      },
      {
        slotId: 'slot-c-b1',
        exerciseId: 'ex-spider-preacher-curl',
        supersetTag: 'B1',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        restSeconds: 45,
        coachingNote: '60° bench chest/armpits over top edge for strict biceps short-head isolation.'
      },
      {
        slotId: 'slot-c-b2',
        exerciseId: 'ex-diamond-pushup-or-dips',
        supersetTag: 'B2',
        targetSets: 3,
        repRangeMin: 10,
        repRangeMax: 15,
        restSeconds: 60,
        coachingNote: 'Zero DB switch time! Diamond push-ups or bench dips (optional DB on lap).'
      },
      {
        slotId: 'slot-c-c1',
        exerciseId: 'ex-zottman-curl',
        supersetTag: 'C1',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        restSeconds: 45,
        coachingNote: 'Curl palms up, rotate palms down at the top, and lower for 3 seconds.'
      },
      {
        slotId: 'slot-c-c2',
        exerciseId: 'ex-arnold-press',
        supersetTag: 'C2',
        targetSets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        restSeconds: 60,
        coachingNote: 'Smooth rotational shoulder press to finish all 3 deltoid heads.'
      }
    ]
  }
];
