export const CHASSIS_MAPPING: Record<string, string> = {
    // X1 / iX1
    '11EF': 'U11', // X1 sDrive18d
    '21EF': 'U11', // X1 xDrive23d
    '31EF': 'U11', // X1 M35i
    '41EF': 'U11', // iX1 xDrive30
    '51EF': 'U11', // X1 sDrive18i
    '61EF': 'U11', // iX1 eDrive20

    // X2 / iX2
    '11GM': 'U10', // X2 sDrive20i
    '21GM': 'U10', // X2 M35i
    '31GM': 'U10', // X2 sDrive18d
    '41GM': 'U10', // X2 xDrive20d
    '51GM': 'U10', // iX2 eDrive20 (Verified)
    '61GM': 'U10', // iX2 xDrive30

    // 5 Series / i5
    '11FJ': 'G60', // 520d
    '21FJ': 'G60', // 520d xDrive
    '31FJ': 'G60', // 520i
    '41FJ': 'G60', // i5 eDrive40
    '51FJ': 'G60', // i5 M60 xDrive
    '61FJ': 'G60', // 530e
    '71FJ': 'G60', // 550e xDrive

    // Touring (G61)
    '11GK': 'G61', // 520d Touring
    '21GK': 'G61', // 520d xDrive Touring
    '31GK': 'G61', // i5 eDrive40 Touring
    '41GK': 'G61', // i5 M60 xDrive Touring

    // 7 Series / i7
    '11EJ': 'G70', // 740d xDrive
    '21EJ': 'G70', // 750e xDrive
    '31EJ': 'G70', // M760e xDrive
    '41EJ': 'G70', // i7 xDrive60
    '51EJ': 'G70', // i7 M70 xDrive
    '61EJ': 'G70', // i7 eDrive50

    // X5
    '11EU': 'G05', // X5 xDrive30d
    '21EU': 'G05', // X5 xDrive40i
    '31EU': 'G05', // X5 xDrive40d
    '41EU': 'G05', // X5 M60i xDrive
    '51EU': 'G05', // X5 xDrive50e

    // X6
    '11EY': 'G06', // X6 xDrive30d
    '21EY': 'G06', // X6 xDrive40i
    '31EY': 'G06', // X6 xDrive40d
    '41EY': 'G06', // X6 M60i xDrive

    // X4
    '31CA': 'G02', // X4 xDrive20d
    '81CA': 'G02', // X4 M40d

    // X7
    '21EN': 'G07', // X7 xDrive40d (Verified)
    '31EN': 'G07', // X7 M60i xDrive
    '41EN': 'G07', // X7 xDrive40i

    // XM
    '21CS': 'G09', // XM
    '31CS': 'G09', // XM Label Red

    // 3 Series
    '11FY': 'G20', // 318i
    '21FY': 'G20', // 320i
    '31FY': 'G20', // 330i
    '41FY': 'G20', // M340i xDrive
    '51FY': 'G20', // 318d
    '61FY': 'G20', // 320d
    '71FY': 'G20', // 330d
    '81FY': 'G20', // M340d xDrive
    '91FY': 'G20', // 320e
    '18FF': 'G20', // 330e

    // 4 Series
    '11AR': 'G22', // 420i Coupe
    '21AR': 'G22', // 430i Coupe
    '31AR': 'G22', // M440i xDrive Coupe
    '11AT': 'G23', // 420i Convertible
    '11AW': 'G26', // 420i Gran Coupe
    '41AW': 'G26', // i4 eDrive35
    '51AW': 'G26', // i4 eDrive40
    '61AW': 'G26', // i4 M50
    '71AW': 'G26', // i4 xDrive40

    // X3 (New G45 / Old G01)
    '11GR': 'G45', // X3 20 xDrive
    '21GR': 'G45', // X3 M50 xDrive
    '31GR': 'G45', // X3 20d xDrive
    '41GR': 'G45', // X3 30e xDrive
};

export function getChassisCode(modelCode: string, fallback?: string): string {
    // Direct match
    if (CHASSIS_MAPPING[modelCode]) {
        return CHASSIS_MAPPING[modelCode];
    }

    // Fallback or heuristics (if needed)
    return fallback || '';
}
