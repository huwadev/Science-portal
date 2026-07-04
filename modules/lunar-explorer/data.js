// Extracted Lunar Mission Data and Translations
const lunarSites = [
    // APOLLO
    {type: 'mission', id: 'apollo11', name: 'Apollo 11', lat: 0.6740, lon: 23.4720, description: 'First human landing (1969). Neil Armstrong and Buzz Aldrin.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/A_Man_on_the_Moon%2C_AS11-40-5903_%28cropped%29.jpg/960px-A_Man_on_the_Moon%2C_AS11-40-5903_%28cropped%29.jpg'},
    {type: 'mission', id: 'apollo12', name: 'Apollo 12', lat: -3.0123, lon: -23.4215, description: 'Pinpoint landing near Surveyor 3 (1969). Pete Conrad and Alan Bean.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Pete_Conrad_with_Surveyor_3_and_Intrepid_in_background.jpg/960px-Pete_Conrad_with_Surveyor_3_and_Intrepid_in_background.jpg'},
    {type: 'mission', id: 'apollo14', name: 'Apollo 14', lat: -3.6453, lon: -17.4713, description: 'Fra Mauro highlands landing (1971). Alan Shepard and Edgar Mitchell.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Apollo_14_Shepard_with_flag.jpg/960px-Apollo_14_Shepard_with_flag.jpg'},
    {type: 'mission', id: 'apollo15', name: 'Apollo 15', lat: 26.1322, lon: 3.6338, description: 'First J-mission with Lunar Roving Vehicle at Hadley Rille (1971).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/AS15-88-11866_-_Apollo_15_flag%2C_rover%2C_LM%2C_Irwin_-_restoration1.jpg/960px-AS15-88-11866_-_Apollo_15_flag%2C_rover%2C_LM%2C_Irwin_-_restoration1.jpg'},
    {type: 'mission', id: 'apollo16', name: 'Apollo 16', lat: -8.9730, lon: 15.5001, description: 'Descartes Highlands landing (1972). John Young and Charles Duke.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Apollo_16_John_Young_salutes_flag.jpg/960px-Apollo_16_John_Young_salutes_flag.jpg'},
    {type: 'mission', id: 'apollo17', name: 'Apollo 17', lat: 20.1908, lon: 30.7716, description: 'Taurus-Littrow valley. Final Apollo mission (1972). Eugene Cernan and Harrison Schmitt.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Eugene_Cernan_at_the_LM%2C_Apollo_17%2C_AS17-134-20378.jpg'},

    // LUNA
    {type: 'mission', id: 'luna-2', name: 'Luna 2', lat: 29.1, lon: 0.0, description: 'First human-made object to reach the Moon (1959). Intentional hard impact.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Luna_1_-_2_Spacecraft.png'},
    {type: 'mission', id: 'luna-9', name: 'Luna 9', lat: 7.08, lon: -64.37, description: 'First spacecraft to achieve a soft landing on the Moon (1966).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Luna_9.jpg/640px-Luna_9.jpg'},
    {type: 'mission', id: 'luna-13', name: 'Luna 13', lat: 18.87, lon: -62.05, description: 'Soviet lander (1966) equipped with a soil penetrometer.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Luna_13_model.jpg/640px-Luna_13_model.jpg'},
    {type: 'mission', id: 'luna-16', name: 'Luna 16', lat: -0.68, lon: 56.30, description: 'First successful robotic sample return mission (1970).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Luna_16_model.jpg/640px-Luna_16_model.jpg'},
    {type: 'mission', id: 'luna-17', name: 'Luna 17 (Lunokhod 1)', lat: 38.28, lon: -35.0, description: 'Delivered Lunokhod 1, the first successful robotic lunar rover (1970).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Lunokhod_1.jpg/640px-Lunokhod_1.jpg'},
    {type: 'mission', id: 'luna-20', name: 'Luna 20', lat: 3.53, lon: 56.55, description: 'Robotic sample return mission from the Apollonius highlands (1972).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Luna_20_Ascent_Stage.jpg/640px-Luna_20_Ascent_Stage.jpg'},
    {type: 'mission', id: 'luna-21', name: 'Luna 21 (Lunokhod 2)', lat: 25.85, lon: 30.45, description: 'Delivered Lunokhod 2 rover, which traveled 39 km across the surface (1973).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Lunokhod_2_rover.jpg/640px-Lunokhod_2_rover.jpg'},
    {type: 'mission', id: 'luna-24', name: 'Luna 24', lat: 12.71, lon: 62.22, description: 'The third and final successful Soviet robotic sample return mission (1976).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Luna_24_model.jpg/640px-Luna_24_model.jpg'},

    // SURVEYOR
    {type: 'mission', id: 'surveyor-1', name: 'Surveyor 1', lat: -2.47, lon: -43.34, description: 'First US spacecraft to achieve a soft landing on the Moon (1966).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Surveyor_1.jpg/640px-Surveyor_1.jpg'},
    {type: 'mission', id: 'surveyor-3', name: 'Surveyor 3', lat: -3.01, lon: -23.34, description: 'Landed in 1967. Parts were later retrieved by Apollo 12 astronauts.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Surveyor_3.jpg/640px-Surveyor_3.jpg'},
    {type: 'mission', id: 'surveyor-5', name: 'Surveyor 5', lat: 1.41, lon: 23.18, description: 'Landed in 1967. Conducted the first alpha particle x-ray spectrometry on the Moon.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Surveyor_5_model.jpg/640px-Surveyor_5_model.jpg'},
    {type: 'mission', id: 'surveyor-6', name: 'Surveyor 6', lat: 0.46, lon: -1.37, description: 'Landed in 1967. Was the first spacecraft to lift off from the lunar surface.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Surveyor_6_model.jpg/640px-Surveyor_6_model.jpg'},
    {type: 'mission', id: 'surveyor-7', name: 'Surveyor 7', lat: -40.86, lon: -11.47, description: 'Landed in 1968 near Tycho crater. The final Surveyor mission.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Surveyor_7_model.jpg/640px-Surveyor_7_model.jpg'},

    // CHANG'E
    {type: 'mission', id: 'change-3', name: 'Chang\'e 3 (Yutu)', lat: 44.12, lon: -19.51, description: 'Chinese lander and Yutu rover. First soft landing since 1976 (2013).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Change_3_lander.jpg/640px-Change_3_lander.jpg'},
    {type: 'mission', id: 'change-4', name: 'Chang\'e 4 (Yutu-2)', lat: -45.45, lon: 177.59, description: 'First mission to land on the far side of the Moon (2019).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/ChangE-4_-_PCAM.png/960px-ChangE-4_-_PCAM.png'},
    {type: 'mission', id: 'change-5', name: 'Chang\'e 5', lat: 43.06, lon: -51.91, description: 'Chinese sample return mission from Oceanus Procellarum (2020).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Change_5_Ascender.jpg/640px-Change_5_Ascender.jpg'},
    {type: 'mission', id: 'change-6', name: 'Chang\'e 6', lat: -41.6, lon: 153.98, description: 'First mission to return samples from the lunar far side (2024).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Change_6_Ascender.png/640px-Change_6_Ascender.png'},

    // OTHER MODERN LANDERS
    {type: 'mission', id: 'chandrayaan-3', name: 'Chandrayaan-3 (Vikram/Pragyan)', lat: -69.37, lon: 32.32, description: 'ISRO lander and rover. First to land near the lunar south pole (2023).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Chandrayaan-3_Vikram_Lander.jpg/640px-Chandrayaan-3_Vikram_Lander.jpg'},
    {type: 'mission', id: 'slim', name: 'SLIM (JAXA)', lat: -13.31, lon: 25.25, description: 'Smart Lander for Investigating Moon (JAXA). Achieved an unprecedented pinpoint landing (2024).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/SLIM_Lander_model.jpg/640px-SLIM_Lander_model.jpg'},
    {type: 'mission', id: 'odysseus', name: 'IM-1 Odysseus', lat: -80.12, lon: 1.44, description: 'First successful commercial lunar lander (Intuitive Machines, 2024).', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Odysseus_lander_model.jpg/640px-Odysseus_lander_model.jpg'},

    // CRATERS
    {type: 'crater', id: 'tycho', name: 'Tycho Crater', lat: -43.30, lon: -11.20, description: 'A very prominent crater with a spectacular ray system, estimated at 108 million years old.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Tycho_LRO.png/960px-Tycho_LRO.png'},
    {type: 'crater', id: 'copernicus', name: 'Copernicus Crater', lat: 9.62, lon: -20.08, description: 'A magnificent impact crater visible with binoculars, located in eastern Oceanus Procellarum.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Copernicus_%28LRO%29_2.png/960px-Copernicus_%28LRO%29_2.png'},
    {type: 'crater', id: 'aristarchus', name: 'Aristarchus Crater', lat: 23.7, lon: -47.4, description: 'Considered the brightest of the large formations on the lunar surface.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Aristarchus_crater_4150_h3.jpg'},
    {type: 'crater', id: 'clavius', name: 'Clavius Crater', lat: -58.4, lon: -14.4, description: 'One of the largest crater formations on the Moon and the second largest crater on the visible near side.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Clavius_LROC.jpg'},

    // MARIA
    {type: 'mare', id: 'mare-imbrium', name: 'Mare Imbrium (Sea of Showers)', lat: 32.8, lon: -15.6, description: 'A vast lunar mare created when lava flooded the giant crater formed by a massive asteroid impact.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Mare_Imbrium_%28LRO%29.png'},
    {type: 'mare', id: 'oceanus-procellarum', name: 'Oceanus Procellarum (Ocean of Storms)', lat: 10.4, lon: -53.4, description: 'The largest of the lunar maria, stretching 2,500 kilometers across its north-south axis.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Oceanus_Procellarum_%28LRO%29.png'},
    {type: 'mare', id: 'mare-serenitatis', name: 'Mare Serenitatis (Sea of Serenity)', lat: 28.0, lon: 17.5, description: 'A lunar mare located to the east of Mare Imbrium.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Mare_Serenitatis_-_Clementine.jpg'},
    {type: 'mare', id: 'mare-crisium', name: 'Mare Crisium (Sea of Crises)', lat: 17.0, lon: 59.1, description: 'A lunar mare located in the Moon\'s Crisium basin, just northeast of Mare Tranquillitatis.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Mare_Crisium_%28LRO%29.png'},

    // MOUNTAINS
    {type: 'mountain', id: 'mons-huygens', name: 'Mons Huygens', lat: 19.92, lon: -2.86, description: 'The Moon\'s tallest mountain, rising over 5.5 kilometers (18,000 ft) high.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Mons_Ampere_Mons_Huygens_4109_h3.jpg'},

    // PLANNED
    {type: 'planned', id: 'artemis3-shackleton', name: 'Artemis III: Shackleton Crater', lat: -89.9, lon: 0.0, description: 'A planned candidate landing region for NASA\'s Artemis III mission, located exactly at the lunar South Pole. The crater interior is permanently shadowed, potentially trapping water ice.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Shackleton_crater_LRO_WAC.jpg'},
    {type: 'planned', id: 'artemis3-malapert', name: 'Artemis III: Malapert Massif', lat: -85.99, lon: -2.94, description: 'Another prime candidate landing region for Artemis III. This prominent mountain near the South Pole receives near-continuous sunlight and offers line-of-sight communication with Earth.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Lunar_south_pole.jpg'}
];

const siteTranslations = {
    'Apollo 11': 'አፖሎ 11',
    'Apollo 12': 'አፖሎ 12',
    'Apollo 14': 'አፖሎ 14',
    'Apollo 15': 'አፖሎ 15',
    'Apollo 16': 'አፖሎ 16',
    'Apollo 17': 'አፖሎ 17',
    'Luna 2': 'ሉና 2',
    'Luna 9': 'ሉና 9',
    'Luna 13': 'ሉና 13',
    'Luna 16': 'ሉና 16',
    'Luna 17 (Lunokhod 1)': 'ሉና 17 (ሉኖኮድ 1)',
    'Luna 20': 'ሉና 20',
    'Luna 21 (Lunokhod 2)': 'ሉና 21 (ሉኖኮድ 2)',
    'Luna 24': 'ሉና 24',
    'Surveyor 1': 'ሰርቬየር 1',
    'Surveyor 3': 'ሰርቬየር 3',
    'Surveyor 5': 'ሰርቬየር 5',
    'Surveyor 6': 'ሰርቬየር 6',
    'Surveyor 7': 'ሰርቬየር 7',
    'Chang\'e 3 (Yutu)': 'ቻንግ 3 (Chang\'e 3)',
    'Chang\'e 4 (Yutu-2)': 'ቻንግ 4 (Chang\'e 4)',
    'Chang\'e 5': 'ቻንግ 5',
    'Chang\'e 6': 'ቻንግ 6',
    'Chandrayaan-3 (Vikram/Pragyan)': 'ቻንድራያን-3 (Chandrayaan-3)',
    'SLIM (JAXA)': 'ስሊም (SLIM JAXA)',
    'IM-1 Odysseus': 'ኦዲሴየስ (Odysseus IM-1)',
    'Tycho Crater': 'ታይኮ ሸለቆ',
    'Copernicus Crater': 'ኮፐርኒከስ ሸለቆ',
    'Aristarchus Crater': 'አሪስታርከስ ሸለቆ',
    'Clavius Crater': 'ክላቪየስ ሸለቆ',
    'Mare Imbrium (Sea of Showers)': 'ማሬ ኢምብሪየም (የዝናብ ባህር)',
    'Oceanus Procellarum (Ocean of Storms)': 'ኦሽኑስ ፕሮሴላረም (የአውሎ ነፋስ ውቅያኖስ)',
    'Mare Serenitatis (Sea of Serenity)': 'ማሬ ሴሬኒታቲስ (የሰላም ባህር)',
    'Mare Crisium (Sea of Crises)': 'ማሬ ክሪሲየም (የቀውስ ባህር)',
    'Mons Huygens': 'ሁይገንስ ተራራ',
    'Artemis III: Shackleton Crater': 'አርጤምስ 3: ሻክልተን ሸለቆ',
    'Artemis III: Malapert Massif': 'አርጤምስ 3: ማላፐርት ተራራ'
};
