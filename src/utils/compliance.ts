export interface CarCompliance {
  isCompliant: boolean;
  reason?: string;
  requiresIVA?: boolean;
}

export function checkCarCompliance(car: any, country: string | null, hasTurkeyPermit: boolean | null): CarCompliance {
  if (!country || country === 'Global') return { isCompliant: true };

  const carYear = Number(car.year) || 0;
  const isLHD = car.driversSeat?.toLowerCase().includes('left') || car.driversSeat?.toLowerCase() === 'lhd';
  const isRHD = car.driversSeat?.toLowerCase().includes('right') || car.driversSeat?.toLowerCase() === 'rhd';
  const isSalvage = car.condition?.toLowerCase() === 'salvage' || car.condition?.toLowerCase() === 'repaired' || car.condition?.toLowerCase() === 'accident';

  switch (country) {
    case 'Saudi Arabia':
      if (isSalvage) return { isCompliant: false, reason: 'Salvage/Repaired vehicles are banned from entry.' };
      if (!isLHD) return { isCompliant: false, reason: 'Only Left-Hand Drive (LHD) vehicles are permitted.' };
      if (carYear < 2021) return { isCompliant: false, reason: 'Vehicle must be 5 years old or newer (2021+).' };
      break;

    case 'Morocco':
      if (carYear < 2021) return { isCompliant: false, reason: 'Vehicle must be 5 years old or newer (2021+).' };
      break;

    case 'Cyprus':
      // RHD OK, No strict age limit (must pass MOT)
      break;

    case 'Spain':
    case 'Netherlands':
    case 'Greece':
    case 'France':
    case 'Belgium':
    case 'Luxembourg':
    case 'Monaco':
    case 'Switzerland':
      // LHD/RHD OK, No strict age limit. Must pass IVA/Euro emissions.
      return { isCompliant: true, requiresIVA: true };

    case 'United States':
      if (carYear > new Date().getFullYear() - 25) return { isCompliant: false, reason: 'Vehicle must be 25 years old or older to import without extensive modifications.' };
      break;

    case 'United Kingdom':
      return { isCompliant: true, requiresIVA: true };

    default:
      return { isCompliant: true };
  }

  return { isCompliant: true };
}
