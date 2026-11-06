const fs = require('fs')
const path = require('path')

const targetFile = path.join(__dirname, '..', 'src', 'data', 'corridorsData.js')
let fileContent = fs.readFileSync(targetFile, 'utf8')

// Exact direct geographical highway waypoints for all 16 corridors along NH-44
// Strictly from North (Hyderabad PVNR: 17.3950°N) to South (Bengaluru Attibele: 12.7800°N)
const CORRIDOR_CONFIGS = {
  'CORRIDOR-01': {
    name: "Corridor 01: Hyderabad → Shamshabad",
    keyLocations: "Hyderabad (PVNR North) → Attapur → Aramghar → Gaganpahad → Shamshabad",
    towns: ["Hyderabad", "Attapur", "Aramghar", "Gaganpahad", "Shamshabad"],
    mapCenter: [17.3230, 78.4410],
    waypoints: [
      { id: 'COR01-WP1', name: "Hyderabad (PVNR North)", lat: 17.3950, lng: 78.4480, km: 0, speed: 78, isTerminal: true, terminalLabel: '← Hyderabad', hasCamera: true, cameraId: 'CAM-001' },
      { id: 'COR01-WP2', name: "Attapur Elevated Link", lat: 17.3580, lng: 78.4420, km: 8, speed: 75, hasCamera: true, cameraId: 'CAM-002' },
      { id: 'COR01-WP3', name: "Aramghar Junction", lat: 17.3210, lng: 78.4415, km: 14, speed: 80, hasCamera: true, cameraId: 'CAM-003' },
      { id: 'COR01-WP4', name: "Gaganpahad Corridor", lat: 17.2750, lng: 78.4310, km: 20, speed: 82 },
      { id: 'COR01-WP5', name: "Shamshabad (Airport)", lat: 17.2510, lng: 78.4285, km: 28, speed: 85, isTerminal: true, terminalLabel: 'Shamshabad →', hasCamera: true, cameraId: 'CAM-004' }
    ],
    incidentReplacements: [
      {
        index: 0,
        kmMarker: 4.0,
        location: "CORRIDOR 01 · Km 4.0 Near Attapur (PVNR Expressway)",
        shortLocation: "Km 4.0 (Attapur)",
        lat: 17.3580,
        lng: 78.4420,
        upstream: [
          { place: "Hyderabad (PVNR North)", km: "0.0", distanceFromIncident: "4.0 km before" },
          { place: "Mehdipatnam", km: "-2.0", distanceFromIncident: "6.0 km before" }
        ],
        downstream: [
          { place: "Aramghar Junction", km: "14.0", distanceFromIncident: "10.0 km after" },
          { place: "Shamshabad", km: "28.0", distanceFromIncident: "24.0 km after" }
        ]
      },
      {
        index: 1,
        kmMarker: 11.5,
        location: "CORRIDOR 01 · Km 11.5 Near Aramghar Junction",
        shortLocation: "Km 11.5 (Aramghar)",
        lat: 17.3320,
        lng: 78.4418,
        upstream: [
          { place: "Attapur Elevated Link", km: "8.0", distanceFromIncident: "3.5 km before" },
          { place: "Hyderabad (PVNR North)", km: "0.0", distanceFromIncident: "11.5 km before" }
        ],
        downstream: [
          { place: "Gaganpahad Corridor", km: "20.0", distanceFromIncident: "8.5 km after" },
          { place: "Shamshabad", km: "28.0", distanceFromIncident: "16.5 km after" }
        ]
      },
      {
        index: 2,
        kmMarker: 19.0,
        location: "CORRIDOR 01 · Km 19.0 Near Gaganpahad Corridor",
        shortLocation: "Km 19.0 (Gaganpahad)",
        lat: 17.2750,
        lng: 78.4310,
        upstream: [
          { place: "Aramghar Junction", km: "14.0", distanceFromIncident: "5.0 km before" },
          { place: "Attapur", km: "8.0", distanceFromIncident: "11.0 km before" }
        ],
        downstream: [
          { place: "Shamshabad (Airport)", km: "28.0", distanceFromIncident: "9.0 km after" }
        ]
      },
      {
        index: 3,
        kmMarker: 26.5,
        location: "CORRIDOR 01 · Km 26.5 Near Shamshabad Tollway",
        shortLocation: "Km 26.5 (Shamshabad)",
        lat: 17.2510,
        lng: 78.4285,
        upstream: [
          { place: "Gaganpahad Corridor", km: "20.0", distanceFromIncident: "6.5 km before" },
          { place: "Aramghar Junction", km: "14.0", distanceFromIncident: "12.5 km before" }
        ],
        downstream: [
          { place: "Shamshabad Airport Exit", km: "30.0", distanceFromIncident: "3.5 km after" }
        ]
      }
    ]
  },
  'CORRIDOR-02': {
    name: "Corridor 02: Shamshabad → Thondupally → Farukhnagar",
    keyLocations: "Shamshabad → Thondupally → Thimmapur → Kothur → Farukhnagar",
    towns: ["Shamshabad", "Thondupally", "Thimmapur", "Kothur", "Farukhnagar"],
    mapCenter: [17.1615, 78.3185],
    waypoints: [
      { id: 'COR02-WP1', name: "Shamshabad", lat: 17.2510, lng: 78.4285, km: 28, speed: 82, isTerminal: true, terminalLabel: '← Shamshabad', hasCamera: true, cameraId: 'CAM-005' },
      { id: 'COR02-WP2', name: "Thondupally Toll", lat: 17.2280, lng: 78.3980, km: 34, speed: 80, hasCamera: true, cameraId: 'CAM-006' },
      { id: 'COR02-WP3', name: "Thimmapur", lat: 17.1850, lng: 78.3320, km: 42, speed: 78 },
      { id: 'COR02-WP4', name: "Kothur", lat: 17.1450, lng: 78.2880, km: 50, speed: 80, hasCamera: true, cameraId: 'CAM-007' },
      { id: 'COR02-WP5', name: "Farukhnagar (Shadnagar)", lat: 17.0720, lng: 78.2090, km: 58, speed: 85, isTerminal: true, terminalLabel: 'Farukhnagar →', hasCamera: true, cameraId: 'CAM-008' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 36.0, location: "CORRIDOR 02 · Km 36.0 Near Thondupally Toll", shortLocation: "Km 36.0 (Thondupally)", lat: 17.2280, lng: 78.3980 },
      { index: 1, kmMarker: 43.5, location: "CORRIDOR 02 · Km 43.5 Near Thimmapur", shortLocation: "Km 43.5 (Thimmapur)", lat: 17.1850, lng: 78.3320 },
      { index: 2, kmMarker: 51.0, location: "CORRIDOR 02 · Km 51.0 Near Kothur Industrial", shortLocation: "Km 51.0 (Kothur)", lat: 17.1450, lng: 78.2880 },
      { index: 3, kmMarker: 58.5, location: "CORRIDOR 02 · Km 58.5 Near Farukhnagar", shortLocation: "Km 58.5 (Farukhnagar)", lat: 17.0720, lng: 78.2090 }
    ]
  },
  'CORRIDOR-03': {
    name: "Corridor 03: Farukhnagar → Jadcherla",
    keyLocations: "Farukhnagar → Rajapur → Balanagar → Polepally → Jadcherla",
    towns: ["Farukhnagar", "Rajapur", "Balanagar", "Polepally", "Jadcherla"],
    mapCenter: [16.9185, 78.1745],
    waypoints: [
      { id: 'COR03-WP1', name: "Farukhnagar", lat: 17.0720, lng: 78.2090, km: 58, speed: 82, isTerminal: true, terminalLabel: '← Farukhnagar', hasCamera: true, cameraId: 'CAM-009' },
      { id: 'COR03-WP2', name: "Rajapur", lat: 16.9600, lng: 78.1820, km: 68, speed: 84, hasCamera: true, cameraId: 'CAM-010' },
      { id: 'COR03-WP3', name: "Balanagar", lat: 16.9200, lng: 78.1750, km: 74, speed: 80, hasCamera: true, cameraId: 'CAM-011' },
      { id: 'COR03-WP4', name: "Polepally", lat: 16.8000, lng: 78.1480, km: 82, speed: 85 },
      { id: 'COR03-WP5', name: "Jadcherla", lat: 16.7650, lng: 78.1400, km: 88, speed: 80, isTerminal: true, terminalLabel: 'Jadcherla →', hasCamera: true, cameraId: 'CAM-012' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 69.0, location: "CORRIDOR 03 · Km 69.0 Near Rajapur", shortLocation: "Km 69.0 (Rajapur)", lat: 16.9600, lng: 78.1820 },
      { index: 1, kmMarker: 76.5, location: "CORRIDOR 03 · Km 76.5 Near Balanagar", shortLocation: "Km 76.5 (Balanagar)", lat: 16.9200, lng: 78.1750 },
      { index: 2, kmMarker: 84.0, location: "CORRIDOR 03 · Km 84.0 Near Polepally", shortLocation: "Km 84.0 (Polepally)", lat: 16.8000, lng: 78.1480 },
      { index: 3, kmMarker: 91.5, location: "CORRIDOR 03 · Km 91.5 Near Jadcherla", shortLocation: "Km 91.5 (Jadcherla)", lat: 16.7650, lng: 78.1400 }
    ]
  },
  'CORRIDOR-04': {
    name: "Corridor 04: Jadcherla → Kothakota",
    keyLocations: "Jadcherla → Bhootpur → Addakal → Kothakota",
    towns: ["Jadcherla", "Bhootpur", "Addakal", "Kothakota"],
    mapCenter: [16.5700, 78.0400],
    waypoints: [
      { id: 'COR04-WP1', name: "Jadcherla", lat: 16.7650, lng: 78.1400, km: 88, speed: 80, isTerminal: true, terminalLabel: '← Jadcherla', hasCamera: true, cameraId: 'CAM-013' },
      { id: 'COR04-WP2', name: "Bhootpur", lat: 16.5800, lng: 78.0200, km: 104, speed: 85, hasCamera: true, cameraId: 'CAM-014' },
      { id: 'COR04-WP3', name: "Addakal", lat: 16.4800, lng: 77.9700, km: 118, speed: 82, hasCamera: true, cameraId: 'CAM-015' },
      { id: 'COR04-WP4', name: "Kothakota", lat: 16.3750, lng: 77.9400, km: 132, speed: 80, isTerminal: true, terminalLabel: 'Kothakota →', hasCamera: true, cameraId: 'CAM-016' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 99.0, location: "CORRIDOR 04 · Km 99.0 Near Bhootpur Bypass", shortLocation: "Km 99.0 (Bhootpur)", lat: 16.5800, lng: 78.0200 },
      { index: 1, kmMarker: 106.5, location: "CORRIDOR 04 · Km 106.5 Near Addakal", shortLocation: "Km 106.5 (Addakal)", lat: 16.4800, lng: 77.9700 },
      { index: 2, kmMarker: 114.0, location: "CORRIDOR 04 · Km 114.0 Near Kothakota North", shortLocation: "Km 114.0 (Kothakota North)", lat: 16.4100, lng: 77.9500 },
      { index: 3, kmMarker: 121.5, location: "CORRIDOR 04 · Km 121.5 Near Kothakota Bypass", shortLocation: "Km 121.5 (Kothakota)", lat: 16.3750, lng: 77.9400 }
    ]
  },
  'CORRIDOR-05': {
    name: "Corridor 05: Kothakota → Krishna River → Pullur",
    keyLocations: "Kothakota → Pebbair → Beechupally (Krishna River) → Pullur Toll Plaza",
    towns: ["Kothakota", "Pebbair", "Beechupally", "Pullur"],
    mapCenter: [16.1425, 78.0075],
    waypoints: [
      { id: 'COR05-WP1', name: "Kothakota", lat: 16.3750, lng: 77.9400, km: 132, speed: 80, isTerminal: true, terminalLabel: '← Kothakota', hasCamera: true, cameraId: 'CAM-017' },
      { id: 'COR05-WP2', name: "Pebbair", lat: 16.2050, lng: 77.9950, km: 154, speed: 82, hasCamera: true, cameraId: 'CAM-018' },
      { id: 'COR05-WP3', name: "Beechupally (Krishna River)", lat: 16.0200, lng: 78.0100, km: 162, speed: 75, hasCamera: true, cameraId: 'CAM-019' },
      { id: 'COR05-WP4', name: "Pullur Toll Plaza", lat: 15.9100, lng: 78.0250, km: 177, speed: 80, isTerminal: true, terminalLabel: 'Pullur →', hasCamera: true, cameraId: 'CAM-020' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 144.0, location: "CORRIDOR 05 · Km 144.0 Near Pebbair", shortLocation: "Km 144.0 (Pebbair)", lat: 16.2050, lng: 77.9950 },
      { index: 1, kmMarker: 151.5, location: "CORRIDOR 05 · Km 151.5 Near Beechupally (Krishna River Bridge)", shortLocation: "Km 151.5 (Beechupally Bridge)", lat: 16.0200, lng: 78.0100 },
      { index: 2, kmMarker: 159.0, location: "CORRIDOR 05 · Km 159.0 Near Itkyal Section", shortLocation: "Km 159.0 (Itkyal)", lat: 15.9700, lng: 78.0180 },
      { index: 3, kmMarker: 166.5, location: "CORRIDOR 05 · Km 166.5 Near Pullur Tollway", shortLocation: "Km 166.5 (Pullur)", lat: 15.9100, lng: 78.0250 }
    ]
  },
  'CORRIDOR-06': {
    name: "Corridor 06: Pullur → Kurnool",
    keyLocations: "Pullur Toll Plaza → Alampur X Road → Tungabhadra Bridge → Kurnool City",
    towns: ["Pullur", "Alampur", "Tungabhadra", "Kurnool"],
    mapCenter: [15.8690, 78.0310],
    waypoints: [
      { id: 'COR06-WP1', name: "Pullur", lat: 15.9100, lng: 78.0250, km: 177, speed: 80, isTerminal: true, terminalLabel: '← Pullur', hasCamera: true, cameraId: 'CAM-021' },
      { id: 'COR06-WP2', name: "Alampur X Road", lat: 15.8800, lng: 78.0300, km: 184, speed: 82, hasCamera: true, cameraId: 'CAM-022' },
      { id: 'COR06-WP3', name: "Tungabhadra Bridge", lat: 15.8450, lng: 78.0360, km: 194, speed: 75, hasCamera: true, cameraId: 'CAM-023' },
      { id: 'COR06-WP4', name: "Kurnool", lat: 15.8281, lng: 78.0373, km: 202, speed: 78, isTerminal: true, terminalLabel: 'Kurnool →', hasCamera: true, cameraId: 'CAM-024' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 189.0, location: "CORRIDOR 06 · Km 189.0 Near Alampur X Road", shortLocation: "Km 189.0 (Alampur X Road)", lat: 15.8800, lng: 78.0300 },
      { index: 1, kmMarker: 196.5, location: "CORRIDOR 06 · Km 196.5 Near Tungabhadra Bridge", shortLocation: "Km 196.5 (Tungabhadra Bridge)", lat: 15.8450, lng: 78.0360 },
      { index: 2, kmMarker: 204.0, location: "CORRIDOR 06 · Km 204.0 Near Kurnool North Checkpost", shortLocation: "Km 204.0 (Kurnool North)", lat: 15.8350, lng: 78.0370 },
      { index: 3, kmMarker: 211.5, location: "CORRIDOR 06 · Km 211.5 Near Kurnool City Bypass", shortLocation: "Km 211.5 (Kurnool Bypass)", lat: 15.8150, lng: 78.0380 }
    ]
  },
  'CORRIDOR-07': {
    name: "Corridor 07: Kurnool → Veldurthi → Dhone",
    keyLocations: "Kurnool → Ulindakonda → Veldurthi → Dhone",
    towns: ["Kurnool", "Ulindakonda", "Veldurthi", "Dhone"],
    mapCenter: [15.6240, 77.9300],
    waypoints: [
      { id: 'COR07-WP1', name: "Kurnool", lat: 15.8281, lng: 78.0373, km: 202, speed: 78, isTerminal: true, terminalLabel: '← Kurnool', hasCamera: true, cameraId: 'CAM-025' },
      { id: 'COR07-WP2', name: "Ulindakonda", lat: 15.7100, lng: 77.9850, km: 216, speed: 84, hasCamera: true, cameraId: 'CAM-026' },
      { id: 'COR07-WP3', name: "Veldurthi", lat: 15.6100, lng: 77.9500, km: 228, speed: 82, hasCamera: true, cameraId: 'CAM-027' },
      { id: 'COR07-WP4', name: "Dhone", lat: 15.4200, lng: 77.8750, km: 242, speed: 80, isTerminal: true, terminalLabel: 'Dhone →', hasCamera: true, cameraId: 'CAM-028' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 229.0, location: "CORRIDOR 07 · Km 229.0 Near Ulindakonda", shortLocation: "Km 229.0 (Ulindakonda)", lat: 15.7100, lng: 77.9850 },
      { index: 1, kmMarker: 236.5, location: "CORRIDOR 07 · Km 236.5 Near Veldurthi", shortLocation: "Km 236.5 (Veldurthi)", lat: 15.6100, lng: 77.9500 },
      { index: 2, kmMarker: 244.0, location: "CORRIDOR 07 · Km 244.0 Near Dhone North", shortLocation: "Km 244.0 (Dhone North)", lat: 15.4500, lng: 77.8900 },
      { index: 3, kmMarker: 251.5, location: "CORRIDOR 07 · Km 251.5 Near Dhone Junction", shortLocation: "Km 251.5 (Dhone)", lat: 15.4200, lng: 77.8750 }
    ]
  },
  'CORRIDOR-08': {
    name: "Corridor 08: Dhone → Peapully → Gooty",
    keyLocations: "Dhone → Peapully → Gooty Toll Plaza → Gooty",
    towns: ["Dhone", "Peapully", "Gooty Toll", "Gooty"],
    mapCenter: [15.2675, 77.7550],
    waypoints: [
      { id: 'COR08-WP1', name: "Dhone", lat: 15.4200, lng: 77.8750, km: 242, speed: 80, isTerminal: true, terminalLabel: '← Dhone', hasCamera: true, cameraId: 'CAM-029' },
      { id: 'COR08-WP2', name: "Peapully", lat: 15.2800, lng: 77.7800, km: 260, speed: 82, hasCamera: true, cameraId: 'CAM-030' },
      { id: 'COR08-WP3', name: "Gooty Toll Plaza", lat: 15.2000, lng: 77.7000, km: 275, speed: 78, hasCamera: true, cameraId: 'CAM-031' },
      { id: 'COR08-WP4', name: "Gooty", lat: 15.1150, lng: 77.6350, km: 289, speed: 80, isTerminal: true, terminalLabel: 'Gooty →', hasCamera: true, cameraId: 'CAM-032' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 274.0, location: "CORRIDOR 08 · Km 274.0 Near Peapully Section", shortLocation: "Km 274.0 (Peapully)", lat: 15.2800, lng: 77.7800 },
      { index: 1, kmMarker: 281.5, location: "CORRIDOR 08 · Km 281.5 Near Gooty Toll Plaza", shortLocation: "Km 281.5 (Gooty Toll)", lat: 15.2000, lng: 77.7000 },
      { index: 2, kmMarker: 289.0, location: "CORRIDOR 08 · Km 289.0 Near Gooty Junction", shortLocation: "Km 289.0 (Gooty)", lat: 15.1150, lng: 77.6350 }
    ]
  },
  'CORRIDOR-09': {
    name: "Corridor 09: Gooty → Pamidi → Anantapur",
    keyLocations: "Gooty → Pamidi → Garladinne → Anantapur",
    towns: ["Gooty", "Pamidi", "Garladinne", "Anantapur"],
    mapCenter: [14.8985, 77.6178],
    waypoints: [
      { id: 'COR09-WP1', name: "Gooty", lat: 15.1150, lng: 77.6350, km: 289, speed: 80, isTerminal: true, terminalLabel: '← Gooty', hasCamera: true, cameraId: 'CAM-033' },
      { id: 'COR09-WP2', name: "Pamidi", lat: 14.8800, lng: 77.6100, km: 312, speed: 82, hasCamera: true, cameraId: 'CAM-034' },
      { id: 'COR09-WP3', name: "Garladinne", lat: 14.7800, lng: 77.6050, km: 326, speed: 84, hasCamera: true, cameraId: 'CAM-035' },
      { id: 'COR09-WP4', name: "Anantapur", lat: 14.6819, lng: 77.6006, km: 344, speed: 78, isTerminal: true, terminalLabel: 'Anantapur →', hasCamera: true, cameraId: 'CAM-036' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 319.0, location: "CORRIDOR 09 · Km 319.0 Near Pamidi", shortLocation: "Km 319.0 (Pamidi)", lat: 14.8800, lng: 77.6100 },
      { index: 1, kmMarker: 326.5, location: "CORRIDOR 09 · Km 326.5 Near Garladinne", shortLocation: "Km 326.5 (Garladinne)", lat: 14.7800, lng: 77.6050 },
      { index: 2, kmMarker: 334.0, location: "CORRIDOR 09 · Km 334.0 Near Anantapur Bypass", shortLocation: "Km 334.0 (Anantapur)", lat: 14.6819, lng: 77.6006 }
    ]
  },
  'CORRIDOR-10': {
    name: "Corridor 10: Anantapur → Penukonda",
    keyLocations: "Anantapur → Raptadu → Marur Toll → Penukonda",
    towns: ["Anantapur", "Raptadu", "Marur", "Penukonda"],
    mapCenter: [14.3826, 77.5970],
    waypoints: [
      { id: 'COR10-WP1', name: "Anantapur", lat: 14.6819, lng: 77.6006, km: 344, speed: 78, isTerminal: true, terminalLabel: '← Anantapur', hasCamera: true, cameraId: 'CAM-037' },
      { id: 'COR10-WP2', name: "Raptadu", lat: 14.5600, lng: 77.5850, km: 358, speed: 82, hasCamera: true, cameraId: 'CAM-038' },
      { id: 'COR10-WP3', name: "Marur Toll", lat: 14.3600, lng: 77.5750, km: 372, speed: 80, hasCamera: true, cameraId: 'CAM-039' },
      { id: 'COR10-WP4', name: "Penukonda", lat: 14.0833, lng: 77.5933, km: 389, speed: 80, isTerminal: true, terminalLabel: 'Penukonda →', hasCamera: true, cameraId: 'CAM-040' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 364.0, location: "CORRIDOR 10 · Km 364.0 Near Raptadu", shortLocation: "Km 364.0 (Raptadu)", lat: 14.5600, lng: 77.5850 },
      { index: 1, kmMarker: 371.5, location: "CORRIDOR 10 · Km 371.5 Near Marur Toll", shortLocation: "Km 371.5 (Marur Toll)", lat: 14.3600, lng: 77.5750 },
      { index: 2, kmMarker: 379.0, location: "CORRIDOR 10 · Km 379.0 Near Penukonda", shortLocation: "Km 379.0 (Penukonda)", lat: 14.0833, lng: 77.5933 }
    ]
  },
  'CORRIDOR-11': {
    name: "Corridor 11: Penukonda → Somandepalli → Kodikonda",
    keyLocations: "Penukonda → Somandepalli → Chilamathur → Kodikonda",
    towns: ["Penukonda", "Somandepalli", "Chilamathur", "Kodikonda"],
    mapCenter: [13.9616, 77.6400],
    waypoints: [
      { id: 'COR11-WP1', name: "Penukonda", lat: 14.0833, lng: 77.5933, km: 389, speed: 80, isTerminal: true, terminalLabel: '← Penukonda', hasCamera: true, cameraId: 'CAM-041' },
      { id: 'COR11-WP2', name: "Somandepalli", lat: 13.9800, lng: 77.6100, km: 405, speed: 82, hasCamera: true, cameraId: 'CAM-042' },
      { id: 'COR11-WP3', name: "Chilamathur", lat: 13.8800, lng: 77.6400, km: 418, speed: 80, hasCamera: true, cameraId: 'CAM-043' },
      { id: 'COR11-WP4', name: "Kodikonda", lat: 13.8400, lng: 77.6700, km: 439, speed: 80, isTerminal: true, terminalLabel: 'Kodikonda →', hasCamera: true, cameraId: 'CAM-044' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 414.0, location: "CORRIDOR 11 · Km 414.0 Near Somandepalli", shortLocation: "Km 414.0 (Somandepalli)", lat: 13.9800, lng: 77.6100 },
      { index: 1, kmMarker: 421.5, location: "CORRIDOR 11 · Km 421.5 Near Chilamathur", shortLocation: "Km 421.5 (Chilamathur)", lat: 13.8800, lng: 77.6400 },
      { index: 2, kmMarker: 429.0, location: "CORRIDOR 11 · Km 429.0 Near Kodikonda Checkpost", shortLocation: "Km 429.0 (Kodikonda)", lat: 13.8400, lng: 77.6700 }
    ]
  },
  'CORRIDOR-12': {
    name: "Corridor 12: Kodikonda → AP/Karnataka Border → Bagepalli",
    keyLocations: "Kodikonda → State Border → Bagepalli Toll Plaza → Bagepalli",
    towns: ["Kodikonda", "Border", "Bagepalli Toll", "Bagepalli"],
    mapCenter: [13.7925, 77.7475],
    waypoints: [
      { id: 'COR12-WP1', name: "Kodikonda", lat: 13.8400, lng: 77.6700, km: 439, speed: 80, isTerminal: true, terminalLabel: '← Kodikonda', hasCamera: true, cameraId: 'CAM-045' },
      { id: 'COR12-WP2', name: "AP/KA State Border", lat: 13.8050, lng: 77.7000, km: 447, speed: 75, hasCamera: true, cameraId: 'CAM-046' },
      { id: 'COR12-WP3', name: "Bagepalli Toll Plaza", lat: 13.7850, lng: 77.7400, km: 462, speed: 78, hasCamera: true, cameraId: 'CAM-047' },
      { id: 'COR12-WP4', name: "Bagepalli", lat: 13.7800, lng: 77.7950, km: 474, speed: 80, isTerminal: true, terminalLabel: 'Bagepalli →', hasCamera: true, cameraId: 'CAM-048' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 454.0, location: "CORRIDOR 12 · Km 454.0 Near AP/Karnataka Border", shortLocation: "Km 454.0 (AP/KA Border)", lat: 13.8050, lng: 77.7000 },
      { index: 1, kmMarker: 461.5, location: "CORRIDOR 12 · Km 461.5 Near Bagepalli Toll Plaza", shortLocation: "Km 461.5 (Bagepalli Toll)", lat: 13.7850, lng: 77.7400 },
      { index: 2, kmMarker: 469.0, location: "CORRIDOR 12 · Km 469.0 Near Bagepalli Town", shortLocation: "Km 469.0 (Bagepalli)", lat: 13.7800, lng: 77.7950 },
      { index: 3, kmMarker: 476.5, location: "CORRIDOR 12 · Km 476.5 Near Bagepalli South", shortLocation: "Km 476.5 (Bagepalli South)", lat: 13.7200, lng: 77.7850 }
    ]
  },
  'CORRIDOR-13': {
    name: "Corridor 13: Bagepalli → Chikkaballapur",
    keyLocations: "Bagepalli → Mittemari → Peresandra → Chikkaballapur",
    towns: ["Bagepalli", "Mittemari", "Peresandra", "Chikkaballapur"],
    mapCenter: [13.6078, 77.7612],
    waypoints: [
      { id: 'COR13-WP1', name: "Bagepalli", lat: 13.7800, lng: 77.7950, km: 474, speed: 80, isTerminal: true, terminalLabel: '← Bagepalli', hasCamera: true, cameraId: 'CAM-049' },
      { id: 'COR13-WP2', name: "Mittemari", lat: 13.6800, lng: 77.7800, km: 490, speed: 82, hasCamera: true, cameraId: 'CAM-050' },
      { id: 'COR13-WP3', name: "Peresandra", lat: 13.5800, lng: 77.7600, km: 504, speed: 80, hasCamera: true, cameraId: 'CAM-051' },
      { id: 'COR13-WP4', name: "Chikkaballapur", lat: 13.4355, lng: 77.7275, km: 516, speed: 78, isTerminal: true, terminalLabel: 'Chikkaballapur →', hasCamera: true, cameraId: 'CAM-052' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 489.0, location: "CORRIDOR 13 · Km 489.0 Near Mittemari Section", shortLocation: "Km 489.0 (Mittemari)", lat: 13.6800, lng: 77.7800 },
      { index: 1, kmMarker: 496.5, location: "CORRIDOR 13 · Km 496.5 Near Peresandra Toll Plaza", shortLocation: "Km 496.5 (Peresandra)", lat: 13.5800, lng: 77.7600 },
      { index: 2, kmMarker: 504.0, location: "CORRIDOR 13 · Km 504.0 Near Chikkaballapur North", shortLocation: "Km 504.0 (Chikkaballapur North)", lat: 13.4700, lng: 77.7400 },
      { index: 3, kmMarker: 511.5, location: "CORRIDOR 13 · Km 511.5 Near Chikkaballapur Bypass", shortLocation: "Km 511.5 (Chikkaballapur)", lat: 13.4355, lng: 77.7275 }
    ]
  },
  'CORRIDOR-14': {
    name: "Corridor 14: Chikkaballapur → Nandi Hills → Devanahalli",
    keyLocations: "Chikkaballapur → Nandi Cross → Devanahalli Bypass → Devanahalli",
    towns: ["Chikkaballapur", "Nandi Cross", "Devanahalli Bypass", "Devanahalli"],
    mapCenter: [13.3419, 77.7200],
    waypoints: [
      { id: 'COR14-WP1', name: "Chikkaballapur", lat: 13.4355, lng: 77.7275, km: 516, speed: 78, isTerminal: true, terminalLabel: '← Chikkaballapur', hasCamera: true, cameraId: 'CAM-053' },
      { id: 'COR14-WP2', name: "Nandi Cross", lat: 13.3600, lng: 77.7200, km: 524, speed: 82, hasCamera: true, cameraId: 'CAM-054' },
      { id: 'COR14-WP3', name: "Devanahalli Bypass", lat: 13.2800, lng: 77.7150, km: 536, speed: 84, hasCamera: true, cameraId: 'CAM-055' },
      { id: 'COR14-WP4', name: "Devanahalli", lat: 13.2483, lng: 77.7125, km: 546, speed: 80, isTerminal: true, terminalLabel: 'Devanahalli →', hasCamera: true, cameraId: 'CAM-056' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 519.0, location: "CORRIDOR 14 · Km 519.0 Near Nandi Cross", shortLocation: "Km 519.0 (Nandi Cross)", lat: 13.3600, lng: 77.7200 },
      { index: 1, kmMarker: 526.5, location: "CORRIDOR 14 · Km 526.5 Near Devanahalli North Bypass", shortLocation: "Km 526.5 (Devanahalli North)", lat: 13.2800, lng: 77.7150 },
      { index: 2, kmMarker: 534.0, location: "CORRIDOR 14 · Km 534.0 Near Devanahalli Toll Plaza", shortLocation: "Km 534.0 (Devanahalli Toll)", lat: 13.2600, lng: 77.7130 },
      { index: 3, kmMarker: 541.5, location: "CORRIDOR 14 · Km 541.5 Near Devanahalli Town", shortLocation: "Km 541.5 (Devanahalli)", lat: 13.2483, lng: 77.7125 }
    ]
  },
  'CORRIDOR-15': {
    name: "Corridor 15: Devanahalli → Bengaluru / Hebbal",
    keyLocations: "Devanahalli → KIA Tollway → Yelahanka → Hebbal Flyover",
    towns: ["Devanahalli", "KIA Tollway", "Yelahanka", "Hebbal"],
    mapCenter: [13.1420, 77.6547],
    waypoints: [
      { id: 'COR15-WP1', name: "Devanahalli", lat: 13.2483, lng: 77.7125, km: 546, speed: 80, isTerminal: true, terminalLabel: '← Devanahalli', hasCamera: true, cameraId: 'CAM-057' },
      { id: 'COR15-WP2', name: "KIA Tollway", lat: 13.1850, lng: 77.6700, km: 554, speed: 80, hasCamera: true, cameraId: 'CAM-058' },
      { id: 'COR15-WP3', name: "Yelahanka", lat: 13.1000, lng: 77.5950, km: 566, speed: 70, hasCamera: true, cameraId: 'CAM-059' },
      { id: 'COR15-WP4', name: "Hebbal Flyover (BLR)", lat: 13.0358, lng: 77.5970, km: 578, speed: 65, isTerminal: true, terminalLabel: 'Hebbal (Bengaluru) →', hasCamera: true, cameraId: 'CAM-060' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 549.0, location: "CORRIDOR 15 · Km 549.0 Near KIA Tollway", shortLocation: "Km 549.0 (KIA Tollway)", lat: 13.1850, lng: 77.6700 },
      { index: 1, kmMarker: 556.5, location: "CORRIDOR 15 · Km 556.5 Near Yelahanka Bypass", shortLocation: "Km 556.5 (Yelahanka)", lat: 13.1000, lng: 77.5950 },
      { index: 2, kmMarker: 564.0, location: "CORRIDOR 15 · Km 564.0 Near Jakkur Aerodrome", shortLocation: "Km 564.0 (Jakkur)", lat: 13.0750, lng: 77.5980 },
      { index: 3, kmMarker: 571.5, location: "CORRIDOR 15 · Km 571.5 Near Hebbal Flyover", shortLocation: "Km 571.5 (Hebbal Flyover)", lat: 13.0358, lng: 77.5970 }
    ]
  },
  'CORRIDOR-16': {
    name: "Corridor 16: Bengaluru Urban NH-44 continuation → Electronic City → Bommasandra → Attibele",
    keyLocations: "Central Silk Board → Electronic City Elevated Tollway → Bommasandra → Attibele Toll Plaza",
    towns: ["Silk Board", "Electronic City", "Bommasandra", "Attibele"],
    mapCenter: [12.8485, 77.6965],
    waypoints: [
      { id: 'COR16-WP1', name: "Central Silk Board", lat: 12.9170, lng: 77.6230, km: 578, speed: 55, isTerminal: true, terminalLabel: '← Silk Board', hasCamera: true, cameraId: 'CAM-061' },
      { id: 'COR16-WP2', name: "Electronic City Tollway", lat: 12.8450, lng: 77.6650, km: 588, speed: 75, hasCamera: true, cameraId: 'CAM-062' },
      { id: 'COR16-WP3', name: "Bommasandra", lat: 12.8150, lng: 77.6850, km: 598, speed: 72, hasCamera: true, cameraId: 'CAM-063' },
      { id: 'COR16-WP4', name: "Attibele Toll Plaza", lat: 12.7800, lng: 77.7700, km: 613, speed: 75, isTerminal: true, terminalLabel: 'Attibele Border →', hasCamera: true, cameraId: 'CAM-064' }
    ],
    incidentReplacements: [
      { index: 0, kmMarker: 569.0, location: "CORRIDOR 16 · Km 569.0 Near Central Silk Board", shortLocation: "Km 569.0 (Silk Board)", lat: 12.9170, lng: 77.6230 },
      { index: 1, kmMarker: 576.5, location: "CORRIDOR 16 · Km 576.5 Near Electronic City Elevated", shortLocation: "Km 576.5 (Electronic City)", lat: 12.8450, lng: 77.6650 },
      { index: 2, kmMarker: 584.0, location: "CORRIDOR 16 · Km 584.0 Near Bommasandra Industrial", shortLocation: "Km 584.0 (Bommasandra)", lat: 12.8150, lng: 77.6850 },
      { index: 3, kmMarker: 591.5, location: "CORRIDOR 16 · Km 591.5 Near Attibele Toll Plaza", shortLocation: "Km 591.5 (Attibele)", lat: 12.7800, lng: 77.7700 }
    ]
  }
}

// Parse CORRIDORS_LIST from fileContent
const matchStart = fileContent.indexOf('export const CORRIDORS_LIST = [')
const listTextStart = matchStart + 'export const CORRIDORS_LIST = '.length
const matchEnd = fileContent.indexOf('export const ALL_CORRIDOR_INCIDENTS =')

let arrayText = fileContent.slice(listTextStart, matchEnd).trim()
if (arrayText.endsWith(';')) {
  arrayText = arrayText.slice(0, -1).trim()
}

const corridorsList = JSON.parse(arrayText)

// Update all corridors
corridorsList.forEach((c) => {
  const cfg = CORRIDOR_CONFIGS[c.id]
  if (cfg) {
    if (cfg.name) c.name = cfg.name
    if (cfg.keyLocations) c.keyLocations = cfg.keyLocations
    if (cfg.towns) c.towns = cfg.towns
    if (cfg.mapCenter) c.mapCenter = cfg.mapCenter
    if (cfg.waypoints) c.waypoints = cfg.waypoints

    if (cfg.incidentReplacements && c.incidents && Array.isArray(c.incidents)) {
      cfg.incidentReplacements.forEach((rep) => {
        const inc = c.incidents[rep.index]
        if (inc) {
          if (rep.kmMarker !== undefined) inc.kmMarker = rep.kmMarker
          if (rep.location) inc.location = rep.location
          if (rep.shortLocation) inc.shortLocation = rep.shortLocation
          if (rep.lat !== undefined) inc.lat = rep.lat
          if (rep.lng !== undefined) inc.lng = rep.lng
          if (rep.pointId) inc.pointId = rep.pointId
          if (rep.upstream) {
            rep.upstream.forEach((up, uIdx) => {
              if (inc.upstreamImpact && inc.upstreamImpact[uIdx]) {
                inc.upstreamImpact[uIdx].place = up.place
                inc.upstreamImpact[uIdx].km = up.km
                inc.upstreamImpact[uIdx].distanceFromIncident = up.distanceFromIncident
              }
            })
          }
          if (rep.downstream) {
            rep.downstream.forEach((down, dIdx) => {
              if (inc.downstreamImpact && inc.downstreamImpact[dIdx]) {
                inc.downstreamImpact[dIdx].place = down.place
                inc.downstreamImpact[dIdx].km = down.km
                inc.downstreamImpact[dIdx].distanceFromIncident = down.distanceFromIncident
              }
            })
          }
        }
      })
    }

    // Ensure all incidents have pointId, lat, and lng
    if (c.incidents && Array.isArray(c.incidents) && c.waypoints && Array.isArray(c.waypoints)) {
      c.incidents.forEach((inc, idx) => {
        if (!inc.pointId) {
          // If 5 waypoints, map 0->WP2, 1->WP3, 2->WP4, 3->WP5
          const wpIdx = c.waypoints.length > 4 ? Math.min(idx + 1, c.waypoints.length - 1) : Math.min(idx, c.waypoints.length - 1)
          inc.pointId = c.waypoints[wpIdx].id
          if (!inc.lat) inc.lat = c.waypoints[wpIdx].lat
          if (!inc.lng) inc.lng = c.waypoints[wpIdx].lng
        }
      })
    }
  }
})

// Update NH-44 super-corridor's incidents as well so they match clean coordinates
const nh44 = corridorsList.find((c) => c.id === 'NH-44')
if (nh44 && nh44.incidents) {
  nh44.incidents.forEach((inc) => {
    // If it was LB Nagar or Hayathnagar
    if (inc.shortLocation && inc.shortLocation.includes('LB Nagar')) {
      inc.location = 'NH-44 · Km 4.0 Near Attapur (PVNR Expressway)'
      inc.shortLocation = 'Km 4.0 (Attapur)'
      inc.lat = 17.3580
      inc.lng = 78.4420
    } else if (inc.shortLocation && inc.shortLocation.includes('Hayathnagar')) {
      inc.location = 'NH-44 · Km 11.5 Near Aramghar Junction'
      inc.shortLocation = 'Km 11.5 (Aramghar)'
      inc.lat = 17.3320
      inc.lng = 78.4418
    } else if (inc.shortLocation && inc.shortLocation.includes('Kothwalguda')) {
      inc.location = 'NH-44 · Km 43.5 Near Thimmapur'
      inc.shortLocation = 'Km 43.5 (Thimmapur)'
      inc.lat = 17.1850
      inc.lng = 78.3320
    }
  })
}

// Re-serialize with clean JSON
const newArrayText = JSON.stringify(corridorsList, null, 2)
const newFileContent = fileContent.slice(0, listTextStart) + newArrayText + ';\n\n' + fileContent.slice(matchEnd)

fs.writeFileSync(targetFile, newFileContent, 'utf8')
console.log('Successfully updated all corridors and incidents with exact direct geographical highway coordinates!')
