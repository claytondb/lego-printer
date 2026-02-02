// Set catalog with embedded LDR data
// These are simple builds for demonstration

export const SET_CATALOG = [
    {
        id: 'simple-car',
        name: 'Simple Car',
        number: 'SC-001',
        category: 'vehicles',
        pieces: 23,
        icon: '🚗',
        ldr: `0 Simple Car
0 Name: Simple Car
0 Author: Lego Printer

1 4 0 -8 0 1 0 0 0 1 0 0 0 1 3020.dat
1 4 0 -8 40 1 0 0 0 1 0 0 0 1 3020.dat
1 4 0 -16 0 1 0 0 0 1 0 0 0 1 3001.dat
1 4 0 -16 40 1 0 0 0 1 0 0 0 1 3001.dat
1 4 0 -40 10 1 0 0 0 1 0 0 0 1 3004.dat
1 4 0 -40 30 1 0 0 0 1 0 0 0 1 3004.dat
1 15 0 -40 20 1 0 0 0 1 0 0 0 1 3024.dat
1 0 -30 -4 0 1 0 0 0 1 0 0 0 1 4624.dat
1 0 30 -4 0 1 0 0 0 1 0 0 0 1 4624.dat
1 0 -30 -4 40 1 0 0 0 1 0 0 0 1 4624.dat
1 0 30 -4 40 1 0 0 0 1 0 0 0 1 4624.dat
`
    },
    {
        id: 'mini-house',
        name: 'Mini House',
        number: 'MH-001',
        category: 'buildings',
        pieces: 35,
        icon: '🏠',
        ldr: `0 Mini House
0 Name: Mini House
0 Author: Lego Printer

1 2 0 -8 0 1 0 0 0 1 0 0 0 1 3032.dat
1 1 0 -32 0 1 0 0 0 1 0 0 0 1 3001.dat
1 1 0 -32 40 1 0 0 0 1 0 0 0 1 3001.dat
1 1 0 -32 80 1 0 0 0 1 0 0 0 1 3001.dat
1 1 40 -32 20 0 0 1 0 1 0 -1 0 0 3001.dat
1 1 -40 -32 20 0 0 1 0 1 0 -1 0 0 3001.dat
1 1 40 -32 60 0 0 1 0 1 0 -1 0 0 3001.dat
1 1 -40 -32 60 0 0 1 0 1 0 -1 0 0 3001.dat
1 1 0 -56 0 1 0 0 0 1 0 0 0 1 3001.dat
1 1 0 -56 40 1 0 0 0 1 0 0 0 1 3001.dat
1 1 0 -56 80 1 0 0 0 1 0 0 0 1 3001.dat
1 15 0 -56 20 1 0 0 0 1 0 0 0 1 3065.dat
1 15 0 -56 60 1 0 0 0 1 0 0 0 1 3065.dat
1 4 0 -80 40 1 0 0 0 1 0 0 0 1 3039.dat
1 4 20 -80 40 1 0 0 0 1 0 0 0 1 3039.dat
1 4 -20 -80 40 1 0 0 0 1 0 0 0 1 3039.dat
`
    },
    {
        id: 'robot',
        name: 'Simple Robot',
        number: 'SR-001',
        category: 'figures',
        pieces: 28,
        icon: '🤖',
        ldr: `0 Simple Robot
0 Name: Simple Robot
0 Author: Lego Printer

1 7 0 -8 0 1 0 0 0 1 0 0 0 1 3003.dat
1 7 0 -32 0 1 0 0 0 1 0 0 0 1 3003.dat
1 7 0 -56 0 1 0 0 0 1 0 0 0 1 3003.dat
1 7 -40 -32 0 1 0 0 0 1 0 0 0 1 3622.dat
1 7 40 -32 0 1 0 0 0 1 0 0 0 1 3622.dat
1 7 -40 -8 0 1 0 0 0 1 0 0 0 1 3024.dat
1 7 40 -8 0 1 0 0 0 1 0 0 0 1 3024.dat
1 0 -10 -72 10 1 0 0 0 1 0 0 0 1 3024.dat
1 0 10 -72 10 1 0 0 0 1 0 0 0 1 3024.dat
1 14 0 -80 0 1 0 0 0 1 0 0 0 1 4589.dat
`
    },
    {
        id: 'spaceship',
        name: 'Micro Spaceship',
        number: 'MS-001',
        category: 'space',
        pieces: 18,
        icon: '🚀',
        ldr: `0 Micro Spaceship
0 Name: Micro Spaceship
0 Author: Lego Printer

1 7 0 -8 0 1 0 0 0 1 0 0 0 1 3795.dat
1 7 0 -16 0 1 0 0 0 1 0 0 0 1 3004.dat
1 7 0 -16 20 1 0 0 0 1 0 0 0 1 3004.dat
1 7 0 -16 40 1 0 0 0 1 0 0 0 1 3004.dat
1 1 0 -40 20 1 0 0 0 1 0 0 0 1 3039.dat
1 15 0 -40 40 1 0 0 0 1 0 0 0 1 3024.dat
1 4 -30 -16 30 1 0 0 0 1 0 0 0 1 3040.dat
1 4 30 -16 30 1 0 0 0 1 0 0 0 1 3040.dat
1 4 0 -16 60 1 0 0 0 1 0 0 0 1 3039.dat
`
    },
    {
        id: 'tree',
        name: 'Simple Tree',
        number: 'ST-001',
        category: 'nature',
        pieces: 12,
        icon: '🌳',
        ldr: `0 Simple Tree
0 Name: Simple Tree
0 Author: Lego Printer

1 6 0 -8 0 1 0 0 0 1 0 0 0 1 3005.dat
1 6 0 -32 0 1 0 0 0 1 0 0 0 1 3005.dat
1 6 0 -56 0 1 0 0 0 1 0 0 0 1 3005.dat
1 2 0 -80 0 1 0 0 0 1 0 0 0 1 3003.dat
1 2 0 -104 0 1 0 0 0 1 0 0 0 1 3003.dat
1 2 20 -80 0 1 0 0 0 1 0 0 0 1 3024.dat
1 2 -20 -80 0 1 0 0 0 1 0 0 0 1 3024.dat
1 2 0 -80 20 1 0 0 0 1 0 0 0 1 3024.dat
1 2 0 -80 -20 1 0 0 0 1 0 0 0 1 3024.dat
1 2 0 -128 0 1 0 0 0 1 0 0 0 1 4589.dat
`
    },
    {
        id: 'duck',
        name: 'Rubber Duck',
        number: 'RD-001',
        category: 'animals',
        pieces: 10,
        icon: '🦆',
        ldr: `0 Rubber Duck
0 Name: Rubber Duck
0 Author: Lego Printer

1 14 0 -8 0 1 0 0 0 1 0 0 0 1 3003.dat
1 14 0 -32 0 1 0 0 0 1 0 0 0 1 3003.dat
1 14 20 -32 0 1 0 0 0 1 0 0 0 1 3005.dat
1 14 -20 -32 0 1 0 0 0 1 0 0 0 1 3005.dat
1 14 0 -56 20 1 0 0 0 1 0 0 0 1 3005.dat
1 0 -6 -50 26 1 0 0 0 1 0 0 0 1 3024.dat
1 0 6 -50 26 1 0 0 0 1 0 0 0 1 3024.dat
1 25 0 -40 30 1 0 0 0 1 0 0 0 1 3024.dat
`
    },
    {
        id: 'tower',
        name: 'Castle Tower',
        number: 'CT-001',
        category: 'buildings',
        pieces: 32,
        icon: '🏰',
        ldr: `0 Castle Tower
0 Name: Castle Tower
0 Author: Lego Printer

1 71 0 -8 0 1 0 0 0 1 0 0 0 1 3031.dat
1 71 0 -32 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 20 -32 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 -20 -32 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -32 20 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -32 -20 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -56 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 20 -56 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 -20 -56 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -56 20 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -56 -20 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -80 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 20 -80 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 -20 -80 0 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -80 20 1 0 0 0 1 0 0 0 1 3003.dat
1 71 0 -80 -20 1 0 0 0 1 0 0 0 1 3003.dat
1 71 -20 -104 -20 1 0 0 0 1 0 0 0 1 3005.dat
1 71 20 -104 -20 1 0 0 0 1 0 0 0 1 3005.dat
1 71 -20 -104 20 1 0 0 0 1 0 0 0 1 3005.dat
1 71 20 -104 20 1 0 0 0 1 0 0 0 1 3005.dat
`
    },
    {
        id: 'airplane',
        name: 'Mini Airplane',
        number: 'MA-001',
        category: 'vehicles',
        pieces: 15,
        icon: '✈️',
        ldr: `0 Mini Airplane
0 Name: Mini Airplane
0 Author: Lego Printer

1 1 0 -8 0 1 0 0 0 1 0 0 0 1 3795.dat
1 1 0 -16 20 1 0 0 0 1 0 0 0 1 3004.dat
1 1 0 -16 40 1 0 0 0 1 0 0 0 1 3004.dat
1 15 0 -40 30 1 0 0 0 1 0 0 0 1 3024.dat
1 1 -40 -8 20 1 0 0 0 1 0 0 0 1 3710.dat
1 1 40 -8 20 1 0 0 0 1 0 0 0 1 3710.dat
1 4 0 -16 60 1 0 0 0 1 0 0 0 1 3039.dat
1 1 -20 -16 60 1 0 0 0 1 0 0 0 1 3040.dat
1 1 20 -16 60 1 0 0 0 1 0 0 0 1 3040.dat
`
    },
    {
        id: 'heart',
        name: 'Heart',
        number: 'HT-001',
        category: 'decorative',
        pieces: 14,
        icon: '❤️',
        ldr: `0 Heart
0 Name: Heart
0 Author: Lego Printer

1 4 0 -8 0 1 0 0 0 1 0 0 0 1 3023.dat
1 4 -20 -8 0 1 0 0 0 1 0 0 0 1 3024.dat
1 4 20 -8 0 1 0 0 0 1 0 0 0 1 3024.dat
1 4 -10 -16 0 1 0 0 0 1 0 0 0 1 3003.dat
1 4 10 -16 0 1 0 0 0 1 0 0 0 1 3003.dat
1 4 -30 -16 0 1 0 0 0 1 0 0 0 1 3005.dat
1 4 30 -16 0 1 0 0 0 1 0 0 0 1 3005.dat
1 4 -20 -40 0 1 0 0 0 1 0 0 0 1 3003.dat
1 4 20 -40 0 1 0 0 0 1 0 0 0 1 3003.dat
1 4 0 -64 0 1 0 0 0 1 0 0 0 1 3023.dat
`
    },
    {
        id: 'flower',
        name: 'Flower',
        number: 'FL-001',
        category: 'nature',
        pieces: 11,
        icon: '🌸',
        ldr: `0 Flower
0 Name: Flower
0 Author: Lego Printer

1 2 0 -8 0 1 0 0 0 1 0 0 0 1 3024.dat
1 2 0 -32 0 1 0 0 0 1 0 0 0 1 3024.dat
1 2 0 -56 0 1 0 0 0 1 0 0 0 1 3024.dat
1 4 0 -80 0 1 0 0 0 1 0 0 0 1 3024.dat
1 4 20 -80 0 1 0 0 0 1 0 0 0 1 3024.dat
1 4 -20 -80 0 1 0 0 0 1 0 0 0 1 3024.dat
1 4 0 -80 20 1 0 0 0 1 0 0 0 1 3024.dat
1 4 0 -80 -20 1 0 0 0 1 0 0 0 1 3024.dat
1 14 0 -104 0 1 0 0 0 1 0 0 0 1 3024.dat
`
    }
];
