const fs = require('fs')
const path = require('path')

const targetFile = path.join(__dirname, '..', 'src', 'data', 'corridorsData.js')
let fileContent = fs.readFileSync(targetFile, 'utf8')

const CORRIDOR_GEO_MAP = {
  'CORRIDOR-01': {
    name: "Corridor 01: Hyderabad → Shamshabad",
    from: "Hyderabad",
    to: "Shamshabad",
    keyLocations: "Hyderabad (PVNR North) → Attapur → Aramghar → Shamshabad",
    towns: ["Hyderabad", "Attapur", "Aramghar", "Shamshabad"],
    mapCenter: [17.3230, 78.4410],
    waypoints: [
      { name: "Hyderabad (PVNR North)", lat: 17.3950, lng: 78.4480, km: "Km 0.0" },
      { name: "Attapur Elevated Link", lat: 17.3580, lng: 78.4420, km: "Km 8.0" },
      { name: "Aramghar Junction", lat: 17.3210, lng: 78.4415, km: "Km 14.0" },
      { name: "Gaganpahad Corridor", lat: 17.2750, lng: 78.4310, km: "Km 20.0" },
      { name: "Shamshabad (Airport)", lat: 17.2510, lng: 78.4285, km: "Km 28.0" }
    ],
    cameraCoords: [
      { lat: 17.3950, lng: 78.4480, location: "Hyderabad (PVNR North)" },
      { lat: 17.3580, lng: 78.4420, location: "Attapur Elevated Link" },
      { lat: 17.3210, lng: 78.4415, location: "Aramghar Express Toll" },
      { lat: 17.2510, lng: 78.4285, location: "Shamshabad Tollway" }
    ]
  },
  'CORRIDOR-02': {
    name: "Corridor 02: Shamshabad → Thondupally → Farukhnagar",
    from: "Shamshabad",
    to: "Farukhnagar",
    keyLocations: "Shamshabad → Thondupally → Thimmapur → Kothur → Farukhnagar",
    towns: ["Shamshabad", "Thondupally", "Thimmapur", "Kothur", "Farukhnagar"],
    mapCenter: [17.1615, 78.3185],
    waypoints: [
      { name: "Shamshabad", lat: 17.2510, lng: 78.4285, km: "Km 28.0" },
      { name: "Thondupally Toll", lat: 17.2280, lng: 78.3980, km: "Km 34.0" },
      { name: "Thimmapur", lat: 17.1850, lng: 78.3320, km: "Km 42.0" },
      { name: "Kothur", lat: 17.1450, lng: 78.2880, km: "Km 50.0" },
      { name: "Farukhnagar (Shadnagar)", lat: 17.0720, lng: 78.2090, km: "Km 58.0" }
    ],
    cameraCoords: [
      { lat: 17.2510, lng: 78.4285, location: "Shamshabad" },
      { lat: 17.2280, lng: 78.3980, location: "Thondupally Toll Plaza" },
      { lat: 17.1450, lng: 78.2880, location: "Kothur Highway Section" },
      { lat: 17.0720, lng: 78.2090, location: "Farukhnagar (Shadnagar)" }
    ]
  },
  'CORRIDOR-03': {
    name: "Corridor 03: Farukhnagar → Jadcherla",
    from: "Farukhnagar",
    to: "Jadcherla",
    keyLocations: "Farukhnagar → Rajapur → Balanagar → Polepally → Jadcherla",
    towns: ["Farukhnagar", "Rajapur", "Balanagar", "Polepally", "Jadcherla"],
    mapCenter: [16.9185, 78.1745],
    waypoints: [
      { name: "Farukhnagar", lat: 17.0720, lng: 78.2090, km: "Km 58.0" },
      { name: "Rajapur", lat: 16.9600, lng: 78.1820, km: "Km 68.0" },
      { name: "Balanagar", lat: 16.9200, lng: 78.1750, km: "Km 74.0" },
      { name: "Polepally", lat: 16.8000, lng: 78.1480, km: "Km 82.0" },
      { name: "Jadcherla", lat: 16.7650, lng: 78.1400, km: "Km 88.0" }
    ],
    cameraCoords: [
      { lat: 17.0720, lng: 78.2090, location: "Farukhnagar" },
      { lat: 16.9600, lng: 78.1820, location: "Rajapur Section" },
      { lat: 16.9200, lng: 78.1750, location: "Balanagar Corridor" },
      { lat: 16.7650, lng: 78.1400, location: "Jadcherla" }
    ]
  },
  'CORRIDOR-04': {
    name: "Corridor 04: Jadcherla → Kothakota",
    from: "Jadcherla",
    to: "Kothakota",
    keyLocations: "Jadcherla → Bhootpur → Addakal → Kothakota",
    towns: ["Jadcherla", "Bhootpur", "Addakal", "Kothakota"],
    mapCenter: [16.5700, 78.0400],
    waypoints: [
      { name: "Jadcherla", lat: 16.7650, lng: 78.1400, km: "Km 88.0" },
      { name: "Bhootpur", lat: 16.5800, lng: 78.0200, km: "Km 104.0" },
      { name: "Addakal", lat: 16.4800, lng: 77.9700, km: "Km 118.0" },
      { name: "Kothakota", lat: 16.3750, lng: 77.9400, km: "Km 132.0" }
    ],
    cameraCoords: [
      { lat: 16.7650, lng: 78.1400, location: "Jadcherla" },
      { lat: 16.5800, lng: 78.0200, location: "Bhootpur Bypass" },
      { lat: 16.4800, lng: 77.9700, location: "Addakal Checkpost" },
      { lat: 16.3750, lng: 77.9400, location: "Kothakota" }
    ]
  },
  'CORRIDOR-05': {
    name: "Corridor 05: Kothakota → Krishna River → Pullur",
    from: "Kothakota",
    to: "Pullur",
    keyLocations: "Kothakota → Pebbair → Beechupally (Krishna River) → Pullur",
    towns: ["Kothakota", "Pebbair", "Beechupally", "Pullur"],
    mapCenter: [16.1425, 78.0075],
    waypoints: [
      { name: "Kothakota", lat: 16.3750, lng: 77.9400, km: "Km 132.0" },
      { name: "Pebbair", lat: 16.2050, lng: 77.9950, km: "Km 154.0" },
      { name: "Beechupally (Krishna River)", lat: 16.0200, lng: 78.0100, km: "Km 176.0" },
      { name: "Pullur Toll Plaza", lat: 15.9100, lng: 78.0250, km: "Km 195.0" }
    ],
    cameraCoords: [
      { lat: 16.3750, lng: 77.9400, location: "Kothakota" },
      { lat: 16.2050, lng: 77.9950, location: "Pebbair Junction" },
      { lat: 16.0200, lng: 78.0100, location: "Krishna River Toll Bridge" },
      { lat: 15.9100, lng: 78.0250, location: "Pullur Toll Plaza" }
    ]
  },
  'CORRIDOR-06': {
    name: "Corridor 06: Pullur → Kurnool",
    from: "Pullur",
    to: "Kurnool",
    keyLocations: "Pullur Toll Plaza → Alampur X Road → Tungabhadra Bridge → Kurnool City",
    towns: ["Pullur", "Alampur", "Tungabhadra", "Kurnool"],
    mapCenter: [15.8690, 78.0321],
    waypoints: [
      { name: "Pullur", lat: 15.9100, lng: 78.0250, km: "Km 195.0" },
      { name: "Alampur X Road", lat: 15.8800, lng: 78.0300, km: "Km 202.0" },
      { name: "Tungabhadra Bridge", lat: 15.8450, lng: 78.0360, km: "Km 210.0" },
      { name: "Kurnool", lat: 15.8281, lng: 78.0373, km: "Km 218.0" }
    ],
    cameraCoords: [
      { lat: 15.9100, lng: 78.0250, location: "Pullur" },
      { lat: 15.8800, lng: 78.0300, location: "Alampur X Road" },
      { lat: 15.8450, lng: 78.0360, location: "Tungabhadra Bridge" },
      { lat: 15.8281, lng: 78.0373, location: "Kurnool City Entry" }
    ]
  },
  'CORRIDOR-07': {
    name: "Corridor 07: Kurnool → Veldurthi → Dhone",
    from: "Kurnool",
    to: "Dhone",
    keyLocations: "Kurnool → Ulindakonda → Veldurthi → Dhone",
    towns: ["Kurnool", "Ulindakonda", "Veldurthi", "Dhone"],
    mapCenter: [15.6240, 77.9560],
    waypoints: [
      { name: "Kurnool", lat: 15.8281, lng: 78.0373, km: "Km 218.0" },
      { name: "Ulindakonda", lat: 15.7100, lng: 77.9850, km: "Km 235.0" },
      { name: "Veldurthi", lat: 15.6100, lng: 77.9500, km: "Km 248.0" },
      { name: "Dhone", lat: 15.4200, lng: 77.8750, km: "Km 270.0" }
    ],
    cameraCoords: [
      { lat: 15.8281, lng: 78.0373, location: "Kurnool" },
      { lat: 15.7100, lng: 77.9850, location: "Ulindakonda Checkpoint" },
      { lat: 15.6100, lng: 77.9500, location: "Veldurthi" },
      { lat: 15.4200, lng: 77.8750, location: "Dhone Bypass" }
    ]
  },
  'CORRIDOR-08': {
    name: "Corridor 08: Dhone → Peapully → Gooty",
    from: "Dhone",
    to: "Gooty",
    keyLocations: "Dhone → Peapully → Gooty Toll Plaza → Gooty",
    towns: ["Dhone", "Peapully", "Gooty Toll", "Gooty"],
    mapCenter: [15.2675, 77.7550],
    waypoints: [
      { name: "Dhone", lat: 15.4200, lng: 77.8750, km: "Km 270.0" },
      { name: "Peapully", lat: 15.2800, lng: 77.7800, km: "Km 290.0" },
      { name: "Gooty Toll", lat: 15.2000, lng: 77.7000, km: "Km 304.0" },
      { name: "Gooty", lat: 15.1150, lng: 77.6350, km: "Km 318.0" }
    ],
    cameraCoords: [
      { lat: 15.4200, lng: 77.8750, location: "Dhone" },
      { lat: 15.2800, lng: 77.7800, location: "Peapully Section" },
      { lat: 15.2000, lng: 77.7000, location: "Gooty Toll Plaza" },
      { lat: 15.1150, lng: 77.6350, location: "Gooty Junction" }
    ]
  },
  'CORRIDOR-09': {
    name: "Corridor 09: Gooty → Pamidi → Anantapur",
    from: "Gooty",
    to: "Anantapur",
    keyLocations: "Gooty → Pamidi → Garladinne → Anantapur",
    towns: ["Gooty", "Pamidi", "Garladinne", "Anantapur"],
    mapCenter: [14.8984, 77.6178],
    waypoints: [
      { name: "Gooty", lat: 15.1150, lng: 77.6350, km: "Km 318.0" },
      { name: "Pamidi", lat: 14.8800, lng: 77.6100, km: "Km 345.0" },
      { name: "Garladinne", lat: 14.7800, lng: 77.6050, km: "Km 360.0" },
      { name: "Anantapur", lat: 14.6819, lng: 77.6006, km: "Km 376.0" }
    ],
    cameraCoords: [
      { lat: 15.1150, lng: 77.6350, location: "Gooty" },
      { lat: 14.8800, lng: 77.6100, location: "Pamidi Bridge" },
      { lat: 14.7800, lng: 77.6050, location: "Garladinne Section" },
      { lat: 14.6819, lng: 77.6006, location: "Anantapur North Entry" }
    ]
  },
  'CORRIDOR-10': {
    name: "Corridor 10: Anantapur → Penukonda",
    from: "Anantapur",
    to: "Penukonda",
    keyLocations: "Anantapur → Raptadu → Marur Toll → Penukonda",
    towns: ["Anantapur", "Raptadu", "Marur", "Penukonda"],
    mapCenter: [14.3835, 77.5903],
    waypoints: [
      { name: "Anantapur", lat: 14.6819, lng: 77.6006, km: "Km 376.0" },
      { name: "Raptadu", lat: 14.5600, lng: 77.5850, km: "Km 394.0" },
      { name: "Marur Toll", lat: 14.3600, lng: 77.5750, km: "Km 418.0" },
      { name: "Penukonda", lat: 14.0833, lng: 77.5933, km: "Km 445.0" }
    ],
    cameraCoords: [
      { lat: 14.6819, lng: 77.6006, location: "Anantapur" },
      { lat: 14.5600, lng: 77.5850, location: "Raptadu Section" },
      { lat: 14.3600, lng: 77.5750, location: "Marur Toll Plaza" },
      { lat: 14.0833, lng: 77.5933, location: "Penukonda Kia Hub" }
    ]
  },
  'CORRIDOR-11': {
    name: "Corridor 11: Penukonda → Somandepalli → Kodikonda",
    from: "Penukonda",
    to: "Kodikonda",
    keyLocations: "Penukonda → Somandepalli → Chilamathur → Kodikonda",
    towns: ["Penukonda", "Somandepalli", "Chilamathur", "Kodikonda"],
    mapCenter: [13.9625, 77.6325],
    waypoints: [
      { name: "Penukonda", lat: 14.0833, lng: 77.5933, km: "Km 445.0" },
      { name: "Somandepalli", lat: 13.9800, lng: 77.6100, km: "Km 462.0" },
      { name: "Chilamathur", lat: 13.8800, lng: 77.6400, km: "Km 478.0" },
      { name: "Kodikonda", lat: 13.8400, lng: 77.6700, km: "Km 490.0" }
    ],
    cameraCoords: [
      { lat: 14.0833, lng: 77.5933, location: "Penukonda" },
      { lat: 13.9800, lng: 77.6100, location: "Somandepalli" },
      { lat: 13.8800, lng: 77.6400, location: "Chilamathur" },
      { lat: 13.8400, lng: 77.6700, location: "Kodikonda Checkpost" }
    ]
  },
  'CORRIDOR-12': {
    name: "Corridor 12: Kodikonda → AP/Karnataka Border → Bagepalli",
    from: "Kodikonda",
    to: "Bagepalli",
    keyLocations: "Kodikonda → State Border → Bagepalli Toll → Bagepalli",
    towns: ["Kodikonda", "Border", "Bagepalli Toll", "Bagepalli"],
    mapCenter: [13.8025, 77.7325],
    waypoints: [
      { name: "Kodikonda", lat: 13.8400, lng: 77.6700, km: "Km 490.0" },
      { name: "AP/KA State Border", lat: 13.8050, lng: 77.7000, km: "Km 498.0" },
      { name: "Bagepalli Toll", lat: 13.7850, lng: 77.7400, km: "Km 508.0" },
      { name: "Bagepalli", lat: 13.7800, lng: 77.7950, km: "Km 516.0" }
    ],
    cameraCoords: [
      { lat: 13.8400, lng: 77.6700, location: "Kodikonda" },
      { lat: 13.8050, lng: 77.7000, location: "AP/KA State Border Checkpost" },
      { lat: 13.7850, lng: 77.7400, location: "Bagepalli Toll Plaza" },
      { lat: 13.7800, lng: 77.7950, location: "Bagepalli City Entry" }
    ]
  },
  'CORRIDOR-13': {
    name: "Corridor 13: Bagepalli → Chikkaballapur",
    from: "Bagepalli",
    to: "Chikkaballapur",
    keyLocations: "Bagepalli → Mittemari → Peresandra → Chikkaballapur",
    towns: ["Bagepalli", "Mittemari", "Peresandra", "Chikkaballapur"],
    mapCenter: [13.6078, 77.7612],
    waypoints: [
      { name: "Bagepalli", lat: 13.7800, lng: 77.7950, km: "Km 516.0" },
      { name: "Mittemari", lat: 13.6800, lng: 77.7800, km: "Km 530.0" },
      { name: "Peresandra", lat: 13.5800, lng: 77.7600, km: "Km 546.0" },
      { name: "Chikkaballapur", lat: 13.4355, lng: 77.7275, km: "Km 565.0" }
    ],
    cameraCoords: [
      { lat: 13.7800, lng: 77.7950, location: "Bagepalli" },
      { lat: 13.6800, lng: 77.7800, location: "Mittemari Stretch" },
      { lat: 13.5800, lng: 77.7600, location: "Peresandra Flyover" },
      { lat: 13.4355, lng: 77.7275, location: "Chikkaballapur Hub" }
    ]
  },
  'CORRIDOR-14': {
    name: "Corridor 14: Chikkaballapur → Nandi Hills → Devanahalli",
    from: "Chikkaballapur",
    to: "Devanahalli",
    keyLocations: "Chikkaballapur → Nandi Cross → Devanahalli Bypass → Devanahalli",
    towns: ["Chikkaballapur", "Nandi Cross", "Devanahalli Bypass", "Devanahalli"],
    mapCenter: [13.3402, 77.7198],
    waypoints: [
      { name: "Chikkaballapur", lat: 13.4355, lng: 77.7275, km: "Km 565.0" },
      { name: "Nandi Cross", lat: 13.3600, lng: 77.7200, km: "Km 578.0" },
      { name: "Devanahalli Bypass", lat: 13.2800, lng: 77.7150, km: "Km 590.0" },
      { name: "Devanahalli", lat: 13.2483, lng: 77.7125, km: "Km 600.0" }
    ],
    cameraCoords: [
      { lat: 13.4355, lng: 77.7275, location: "Chikkaballapur" },
      { lat: 13.3600, lng: 77.7200, location: "Nandi Cross Junction" },
      { lat: 13.2800, lng: 77.7150, location: "Devanahalli Bypass" },
      { lat: 13.2483, lng: 77.7125, location: "Devanahalli Kempegowda North" }
    ]
  },
  'CORRIDOR-15': {
    name: "Corridor 15: Devanahalli → Bengaluru / Hebbal",
    from: "Devanahalli",
    to: "Bengaluru",
    keyLocations: "Devanahalli → KIA Tollway → Yelahanka → Hebbal Flyover",
    towns: ["Devanahalli", "KIA Tollway", "Yelahanka", "Hebbal"],
    mapCenter: [13.1404, 77.6545],
    waypoints: [
      { name: "Devanahalli", lat: 13.2483, lng: 77.7125, km: "Km 600.0" },
      { name: "KIA Tollway", lat: 13.1850, lng: 77.6700, km: "Km 612.0" },
      { name: "Yelahanka", lat: 13.1000, lng: 77.5950, km: "Km 624.0" },
      { name: "Hebbal Flyover (BLR)", lat: 13.0358, lng: 77.5970, km: "Km 636.0" }
    ],
    cameraCoords: [
      { lat: 13.2483, lng: 77.7125, location: "Devanahalli" },
      { lat: 13.1850, lng: 77.6700, location: "KIA Elevated Tollway" },
      { lat: 13.1000, lng: 77.5950, location: "Yelahanka Airforce Base Link" },
      { lat: 13.0358, lng: 77.5970, location: "Hebbal Flyover" }
    ]
  },
  'CORRIDOR-16': {
    name: "Corridor 16: Bengaluru Urban NH-44 continuation → Electronic City → Bommasandra → Attibele",
    from: "Bengaluru",
    to: "Attibele",
    keyLocations: "Central Silk Board → Electronic City Elevated Tollway → Bommasandra → Attibele Toll Plaza",
    towns: ["Silk Board", "Electronic City", "Bommasandra", "Attibele"],
    mapCenter: [12.8485, 77.6970],
    waypoints: [
      { name: "Central Silk Board", lat: 12.9170, lng: 77.6230, km: "Km 648.0" },
      { name: "Electronic City Tollway", lat: 12.8450, lng: 77.6650, km: "Km 662.0" },
      { name: "Bommasandra", lat: 12.8150, lng: 77.6850, km: "Km 672.0" },
      { name: "Attibele Toll Plaza", lat: 12.7800, lng: 77.7700, km: "Km 686.0" }
    ],
    cameraCoords: [
      { lat: 12.9170, lng: 77.6230, location: "Central Silk Board" },
      { lat: 12.8450, lng: 77.6650, location: "Electronic City Tollway" },
      { lat: 12.8150, lng: 77.6850, location: "Bommasandra Industrial Corridor" },
      { lat: 12.7800, lng: 77.7700, location: "Attibele Toll Plaza" }
    ]
  },
  'NH-44': {
    mapCenter: [15.2, 77.9],
    waypoints: [
      { name: "Hyderabad (PVNR North)", lat: 17.3950, lng: 78.4480, km: "Km 0" },
      { name: "Aramghar", lat: 17.3210, lng: 78.4415, km: "Km 14" },
      { name: "Shamshabad", lat: 17.2510, lng: 78.4285, km: "Km 28" },
      { name: "Thondupally Toll", lat: 17.2280, lng: 78.3980, km: "Km 34" },
      { name: "Shadnagar", lat: 17.0720, lng: 78.2090, km: "Km 58" },
      { name: "Balanagar", lat: 16.9200, lng: 78.1750, km: "Km 74" },
      { name: "Jadcherla", lat: 16.7650, lng: 78.1400, km: "Km 88" },
      { name: "Bhootpur", lat: 16.5800, lng: 78.0200, km: "Km 104" },
      { name: "Addakal", lat: 16.4800, lng: 77.9700, km: "Km 118" },
      { name: "Kothakota", lat: 16.3750, lng: 77.9400, km: "Km 132" },
      { name: "Pebbair", lat: 16.2050, lng: 77.9950, km: "Km 154" },
      { name: "Krishna River (Beechupally)", lat: 16.0200, lng: 78.0100, km: "Km 176" },
      { name: "Pullur Toll", lat: 15.9100, lng: 78.0250, km: "Km 195" },
      { name: "Kurnool", lat: 15.8281, lng: 78.0373, km: "Km 218" },
      { name: "Veldurthi", lat: 15.6100, lng: 77.9500, km: "Km 248" },
      { name: "Dhone", lat: 15.4200, lng: 77.8750, km: "Km 270" },
      { name: "Gooty", lat: 15.1150, lng: 77.6350, km: "Km 318" },
      { name: "Pamidi", lat: 14.8800, lng: 77.6100, km: "Km 345" },
      { name: "Anantapur", lat: 14.6819, lng: 77.6006, km: "Km 376" },
      { name: "Penukonda", lat: 14.0833, lng: 77.5933, km: "Km 445" },
      { name: "Kodikonda", lat: 13.8400, lng: 77.6700, km: "Km 490" },
      { name: "Bagepalli", lat: 13.7800, lng: 77.7950, km: "Km 516" },
      { name: "Chikkaballapur", lat: 13.4355, lng: 77.7275, km: "Km 565" },
      { name: "Devanahalli", lat: 13.2483, lng: 77.7125, km: "Km 600" },
      { name: "Hebbal", lat: 13.0358, lng: 77.5970, km: "Km 636" },
      { name: "Electronic City", lat: 12.8450, lng: 77.6650, km: "Km 662" },
      { name: "Attibele", lat: 12.7800, lng: 77.7700, km: "Km 686" }
    ]
  }
}

// Parse CORRIDORS_LIST array from file
// Find where CORRIDORS_LIST starts and ends
const matchStart = fileContent.indexOf('export const CORRIDORS_LIST = [')
if (matchStart === -1) {
  console.error('Could not find CORRIDORS_LIST in file')
  process.exit(1)
}

// Use Function constructor or vm to parse
const listTextStart = matchStart + 'export const CORRIDORS_LIST = '.length
// Find the closing bracket before export const ALL_CORRIDOR_INCIDENTS
const matchEnd = fileContent.indexOf('export const ALL_CORRIDOR_INCIDENTS =')
if (matchEnd === -1) {
  console.error('Could not find ALL_CORRIDOR_INCIDENTS in file')
  process.exit(1)
}

let arrayText = fileContent.slice(listTextStart, matchEnd).trim()
if (arrayText.endsWith(';')) {
  arrayText = arrayText.slice(0, -1).trim()
}

const corridorsList = JSON.parse(arrayText)

// Update each corridor in corridorsList
corridorsList.forEach((c) => {
  const geo = CORRIDOR_GEO_MAP[c.id]
  if (geo) {
    if (geo.name) c.name = geo.name
    if (geo.from) c.from = geo.from
    if (geo.to) c.to = geo.to
    if (geo.keyLocations) c.keyLocations = geo.keyLocations
    if (geo.towns) c.towns = geo.towns
    if (geo.mapCenter) c.mapCenter = geo.mapCenter
    if (geo.waypoints) c.waypoints = geo.waypoints

    if (geo.cameraCoords && c.keyCameras && Array.isArray(c.keyCameras)) {
      c.keyCameras.forEach((cam, idx) => {
        if (geo.cameraCoords[idx]) {
          cam.lat = geo.cameraCoords[idx].lat
          cam.lng = geo.cameraCoords[idx].lng
          if (geo.cameraCoords[idx].location) {
            cam.location = geo.cameraCoords[idx].location
            cam.name = `${cam.id} - ${geo.cameraCoords[idx].location}`
          }
        }
      })
    }
  }
})

// Re-serialize with clean JSON
const newArrayText = JSON.stringify(corridorsList, null, 2)
const newFileContent = fileContent.slice(0, listTextStart) + newArrayText + ';\n\n' + fileContent.slice(matchEnd)

fs.writeFileSync(targetFile, newFileContent, 'utf8')
console.log('Successfully updated all 16 corridors with authentic direct highway GPS waypoints!')
