/**
 * Bundled popular sets for offline/no-API-key usage
 * These are curated sets that work without Rebrickable API
 */

export const FEATURED_SETS = [
    {
        id: '75192-1',
        name: 'Millennium Falcon',
        number: '75192',
        year: 2017,
        pieces: 7541,
        image: 'https://cdn.rebrickable.com/media/sets/75192-1/14aborb.jpg',
        theme: 'Star Wars'
    },
    {
        id: '10294-1',
        name: 'Titanic',
        number: '10294',
        year: 2021,
        pieces: 9090,
        image: 'https://cdn.rebrickable.com/media/sets/10294-1/79024.jpg',
        theme: 'Icons'
    },
    {
        id: '71043-1',
        name: 'Hogwarts Castle',
        number: '71043',
        year: 2018,
        pieces: 6020,
        image: 'https://cdn.rebrickable.com/media/sets/71043-1/15405.jpg',
        theme: 'Harry Potter'
    },
    {
        id: '10276-1',
        name: 'Colosseum',
        number: '10276',
        year: 2020,
        pieces: 9036,
        image: 'https://cdn.rebrickable.com/media/sets/10276-1/63498.jpg',
        theme: 'Icons'
    },
    {
        id: '42143-1',
        name: 'Ferrari Daytona SP3',
        number: '42143',
        year: 2022,
        pieces: 3778,
        image: 'https://cdn.rebrickable.com/media/sets/42143-1/99607.jpg',
        theme: 'Technic'
    },
    {
        id: '75341-1',
        name: 'Luke Skywalker\'s Landspeeder',
        number: '75341',
        year: 2022,
        pieces: 1890,
        image: 'https://cdn.rebrickable.com/media/sets/75341-1/100665.jpg',
        theme: 'Star Wars'
    },
    {
        id: '10307-1',
        name: 'Eiffel Tower',
        number: '10307',
        year: 2022,
        pieces: 10001,
        image: 'https://cdn.rebrickable.com/media/sets/10307-1/106313.jpg',
        theme: 'Icons'
    },
    {
        id: '21330-1',
        name: 'Home Alone',
        number: '21330',
        year: 2021,
        pieces: 3957,
        image: 'https://cdn.rebrickable.com/media/sets/21330-1/87098.jpg',
        theme: 'Ideas'
    },
    {
        id: '42151-1',
        name: 'Bugatti Bolide',
        number: '42151',
        year: 2023,
        pieces: 905,
        image: 'https://cdn.rebrickable.com/media/sets/42151-1/111697.jpg',
        theme: 'Technic'
    },
    {
        id: '75331-1',
        name: 'The Razor Crest',
        number: '75331',
        year: 2022,
        pieces: 6187,
        image: 'https://cdn.rebrickable.com/media/sets/75331-1/104959.jpg',
        theme: 'Star Wars'
    },
    {
        id: '10300-1',
        name: 'Back to the Future Time Machine',
        number: '10300',
        year: 2022,
        pieces: 1872,
        image: 'https://cdn.rebrickable.com/media/sets/10300-1/101053.jpg',
        theme: 'Icons'
    },
    {
        id: '42141-1',
        name: 'McLaren Formula 1 Race Car',
        number: '42141',
        year: 2022,
        pieces: 1434,
        image: 'https://cdn.rebrickable.com/media/sets/42141-1/99579.jpg',
        theme: 'Technic'
    }
];

export const THEMES = [
    { id: 158, name: 'Star Wars', icon: '⭐' },
    { id: 1, name: 'Technic', icon: '⚙️' },
    { id: 246, name: 'Harry Potter', icon: '⚡' },
    { id: 695, name: 'Icons', icon: '🏆' },
    { id: 577, name: 'Ideas', icon: '💡' },
    { id: 252, name: 'Architecture', icon: '🏛️' },
    { id: 435, name: 'Speed Champions', icon: '🏎️' },
    { id: 608, name: 'City', icon: '🏙️' },
    { id: 610, name: 'Ninjago', icon: '🥷' },
    { id: 621, name: 'Super Heroes', icon: '🦸' },
    { id: 602, name: 'Creator 3-in-1', icon: '🔄' },
    { id: 494, name: 'Creator Expert', icon: '🎨' },
    { id: 52, name: 'Disney', icon: '🏰' },
    { id: 216, name: 'Friends', icon: '💜' },
    { id: 577, name: 'Minecraft', icon: '⛏️' },
    { id: 504, name: 'Classic', icon: '🧱' },
];

// Sample parts for some popular sets (allows basic functionality without API)
export const SET_PARTS = {
    '42151-1': [
        { id: '3001', name: 'Brick 2x4', color: 0, colorName: 'Black', quantity: 12 },
        { id: '3003', name: 'Brick 2x2', color: 1, colorName: 'Blue', quantity: 24 },
        { id: '3004', name: 'Brick 1x2', color: 1, colorName: 'Blue', quantity: 36 },
        { id: '3020', name: 'Plate 2x4', color: 0, colorName: 'Black', quantity: 18 },
        { id: '3022', name: 'Plate 2x2', color: 1, colorName: 'Blue', quantity: 28 },
        { id: '3023', name: 'Plate 1x2', color: 0, colorName: 'Black', quantity: 42 },
        { id: '3024', name: 'Plate 1x1', color: 0, colorName: 'Black', quantity: 56 },
        { id: '3710', name: 'Plate 1x4', color: 1, colorName: 'Blue', quantity: 22 },
        { id: '3039', name: 'Slope 45 2x2', color: 1, colorName: 'Blue', quantity: 8 },
        { id: '3040', name: 'Slope 45 1x2', color: 0, colorName: 'Black', quantity: 12 },
    ]
};
