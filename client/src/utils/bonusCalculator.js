export const BONUS_TABLE = [
  {
    min: 5000,
    max: 6500,
    label: '5000 - 6500',
    oneWorker: { baseline: 150000, baseBonus: 100, ratePerThousand: 1.5 },
    twoWorkers: { baseline: 200000, baseBonus: 100, ratePerThousand: 1.0 }
  },
  {
    min: 6500,
    max: 8000,
    label: '6500 - 8000',
    oneWorker: { baseline: 200000, baseBonus: 100, ratePerThousand: 1.5 },
    twoWorkers: { baseline: 250000, baseBonus: 100, ratePerThousand: 1.0 }
  },
  {
    min: 8000,
    max: 9500,
    label: '8000 - 9500',
    oneWorker: { baseline: 250000, baseBonus: 100, ratePerThousand: 1.0 },
    twoWorkers: { baseline: 300000, baseBonus: 100, ratePerThousand: 0.5 }
  },
  {
    min: 9500,
    max: 11000,
    label: '9500 - 11000',
    oneWorker: { baseline: 300000, baseBonus: 100, ratePerThousand: 1.0 },
    twoWorkers: { baseline: 350000, baseBonus: 100, ratePerThousand: 0.5 }
  },
  {
    min: 11000,
    max: 15000,
    label: '11000 - 15000',
    oneWorker: { baseline: 350000, baseBonus: 100, ratePerThousand: 1.0 },
    twoWorkers: { baseline: 400000, baseBonus: 100, ratePerThousand: 0.5 }
  },
  {
    min: 15000,
    max: Infinity,
    label: '15000 - UPAR',
    oneWorker: { baseline: 400000, baseBonus: 100, ratePerThousand: 1.0 },
    twoWorkers: { baseline: 450000, baseBonus: 100, ratePerThousand: 0.5 }
  }
];

export const getDesignBonusPolicy = (designStitch, workerCount = 1) => {
  const safeDesignStitch = Number(designStitch) || 0;
  const safeWorkerCount = Number(workerCount) > 1 ? 2 : 1;

  if (safeDesignStitch < 5000) {
    return {
      min: 0,
      max: 5000,
      label: 'Below 5000 (No Bonus)',
      baseline: 0,
      baseBonus: 0,
      ratePerThousand: 0,
      workerCount: safeWorkerCount
    };
  }

  const matchedRange = BONUS_TABLE.find((range) => {
    return safeDesignStitch >= range.min && safeDesignStitch < range.max;
  }) || BONUS_TABLE[BONUS_TABLE.length - 1];

  const config = safeWorkerCount === 2 ? matchedRange.twoWorkers : matchedRange.oneWorker;

  return {
    min: matchedRange.min,
    max: matchedRange.max === Infinity ? 'UPAR' : matchedRange.max,
    label: matchedRange.label,
    baseline: config.baseline,
    baseBonus: config.baseBonus,
    ratePerThousand: config.ratePerThousand,
    workerCount: safeWorkerCount
  };
};

export const calculateDesignBonus = ({ designStitch, machineStitch = 0, frame = 1, workerCount = 1 }) => {
  const safeDesignStitch = Number(designStitch) || 0;
  const safeWorkerCount = Number(workerCount) > 1 ? 2 : 1;
  const safeFrame = Number(frame) || 1;

  if (safeDesignStitch < 5000) {
    return 0;
  }

  // Total stitches produced
  let totalStitches = Number(machineStitch) || 0;
  if (totalStitches <= 0 && safeDesignStitch > 0) {
    totalStitches = safeDesignStitch * safeFrame;
  }

  const policy = getDesignBonusPolicy(safeDesignStitch, safeWorkerCount);

  if (totalStitches < policy.baseline) {
    return 0;
  }

  const extraStitches = totalStitches - policy.baseline;
  const extraThousands = extraStitches / 1000;
  const bonus = policy.baseBonus + (extraThousands * policy.ratePerThousand);

  return Math.max(0, Math.round(bonus));
};
