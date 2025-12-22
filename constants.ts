
import { Ride, Operator, Counter } from './types';

/**
 * Storage keys that should be preserved during cache clear operations and quota cleanup.
 * These keys contain critical user session data that must persist across cache operations:
 * - authRole: User's role/permission level
 * - authUser: User's profile information
 * - authLastActivity: Timestamp of last user activity
 * - currentView: Current navigation state for view persistence
 * - tfw_data_config_appLogo: Application logo image data
 * - tfw_data_config_appLogo_timestamp: Logo cache timestamp
 */
export const PRESERVE_STORAGE_KEYS = ['authRole', 'authUser', 'authLastActivity', 'currentView', 'tfw_data_config_appLogo', 'tfw_data_config_appLogo_timestamp'];

// Utility function to convert array to an object with IDs as keys, which is a Firebase best practice.
const arrayToObjectById = <T extends { id: number }>(arr: T[]): Record<number, Omit<T, 'id'>> => {
  return arr.reduce((acc, item) => {
    const { id, ...rest } = item;
    acc[id] = rest;
    return acc;
  }, {} as Record<number, Omit<T, 'id'>>);
};


export const RIDES_ARRAY: Ride[] = [
  { id: 1, name: 'Paintball', floor: '17th', imageUrl: 'https://picsum.photos/seed/1-Paintball/400/300' },
  { id: 2, name: 'Laser Maze', floor: '16th', imageUrl: 'https://picsum.photos/seed/2-LaserMaze/400/300' },
  { id: 3, name: 'VR Tank', floor: '16th', imageUrl: 'https://picsum.photos/seed/3-VRTank/400/300' },
  { id: 4, name: 'Jurassic Escape', floor: '16th', imageUrl: 'https://picsum.photos/seed/4-JurassicEscape/400/300' },
  { id: 5, name: 'Walk the Plank', floor: '16th', imageUrl: 'https://picsum.photos/seed/5-WalkthePlank/400/300' },
  { id: 6, name: 'Simulator Roller Coaster', floor: '16th', imageUrl: 'https://picsum.photos/seed/6-SimulatorRollerCoaster/400/300' },
  { id: 7, name: 'Fly Max', floor: '16th', imageUrl: 'https://picsum.photos/seed/7-FlyMax/400/300' },
  { id: 10, name: 'Laser Tag 1', floor: '15th', imageUrl: 'https://picsum.photos/seed/10-LaserTag1/400/300' },
  { id: 11, name: 'V of War', floor: '15th', imageUrl: 'https://picsum.photos/seed/11-VofWar/400/300' },
  { id: 12, name: 'VR Egg', floor: '15th', imageUrl: 'https://picsum.photos/seed/12-VREgg/400/300' },
  { id: 13, name: 'Shooter Walker 1', floor: '15th', imageUrl: 'https://picsum.photos/seed/13-ShooterWalker1/400/300' },
  { id: 14, name: 'Shooter Walker 2', floor: '15th', imageUrl: 'https://picsum.photos/seed/14-ShooterWalker2/400/300' },
  { id: 15, name: 'Jurassic Park', floor: '15th', imageUrl: 'https://picsum.photos/seed/15-JurassicPark/400/300' },
  { id: 16, name: 'Transformer Human Alliance', floor: '15th', imageUrl: 'https://picsum.photos/seed/16-TransformerHumanAlliance/400/300' },
  { id: 17, name: 'House of the Dead 2', floor: '15th', imageUrl: 'https://picsum.photos/seed/17-HouseoftheDead2/400/300' },
  { id: 18, name: 'Monster Eye 2', floor: '15th', imageUrl: 'https://picsum.photos/seed/18-MonsterEye2/400/300' },
  { id: 19, name: 'Walking Dead Shooting', floor: '15th', imageUrl: 'https://picsum.photos/seed/19-WalkingDeadShooting/400/300' },
  { id: 20, name: 'VR Motorcycle', floor: '14th', imageUrl: 'https://picsum.photos/seed/20-VRMotorcycle/400/300' },
  { id: 21, name: 'VR Racer', floor: '14th', imageUrl: 'https://picsum.photos/seed/21-VRRacer/400/300' },
  { id: 22, name: 'F1 Racer Max', floor: '14th', imageUrl: 'https://picsum.photos/seed/22-F1RacerMax/400/300' },
  { id: 23, name: 'Sea Adventure', floor: '14th', imageUrl: 'https://picsum.photos/seed/23-SeaAdventure/400/300' },
  { id: 24, name: 'F1 Racer', floor: '14th', imageUrl: 'https://picsum.photos/seed/24-F1Racer/400/300' },
  { id: 25, name: 'NFS Drifter 1', floor: '14th', imageUrl: 'https://picsum.photos/seed/25-NFSDrifter1/400/300' },
  { id: 26, name: 'NFS Drifter 2', floor: '14th', imageUrl: 'https://picsum.photos/seed/26-NFSDrifter2/400/300' },
  { id: 27, name: 'VR Horse Warrior', floor: '14th', imageUrl: 'https://picsum.photos/seed/27-VRHorseWarrior/400/300' },
  { id: 28, name: 'Speed Racer Blue', floor: '14th', imageUrl: 'https://picsum.photos/seed/28-SpeedRacerBlue/400/300' },
  { id: 29, name: 'Speed Racer Red', floor: '14th', imageUrl: 'https://picsum.photos/seed/29-SpeedRacerRed/400/300' },
  { id: 30, name: 'Sports Simulator 1', floor: '14th', imageUrl: 'https://picsum.photos/seed/30-SportsSimulator1/400/300' },
  { id: 31, name: 'Overtake VR', floor: '14th', imageUrl: 'https://picsum.photos/seed/31-OvertakeVR/400/300' },
  { id: 32, name: 'Extreme Snowboard 2', floor: '14th', imageUrl: 'https://picsum.photos/seed/32-ExtremeSnowboard2/400/300' },
  { id: 33, name: 'Robotic Roller Coaster 1', floor: '14th', imageUrl: 'https://picsum.photos/seed/33-RoboticRollerCoaster1/400/300' },
  { id: 34, name: 'Robotic Roller Coaster 2', floor: '14th', imageUrl: 'https://picsum.photos/seed/34-RoboticRollerCoaster2/400/300' },
  { id: 35, name: 'Monster Eye', floor: '14th', imageUrl: 'https://picsum.photos/seed/35-MonsterEye/400/300' },
  { id: 36, name: 'Mirror Maze', floor: '13th', imageUrl: 'https://picsum.photos/seed/36-MirrorMaze/400/300' },
  { id: 38, name: 'Escape room', floor: '13th', imageUrl: 'https://picsum.photos/seed/38-Escaperoom/400/300' },
  { id: 39, name: 'Dragon Hunter', floor: '13th', imageUrl: 'https://picsum.photos/seed/39-DragonHunter/400/300' },
  { id: 40, name: 'VR Space Tour 1', floor: '13th', imageUrl: 'https://picsum.photos/seed/40-VRSpaceTour1/400/300' },
  { id: 41, name: 'VR Space Tour 2', floor: '13th', imageUrl: 'https://picsum.photos/seed/41-VRSpaceTour2/400/300' },
  { id: 42, name: 'Pump it up 1', floor: '13th', imageUrl: 'https://picsum.photos/seed/42-Pumpitup1/400/300' },
  { id: 43, name: 'Pump it up 2', floor: '13th', imageUrl: 'https://picsum.photos/seed/43-Pumpitup2/400/300' },
  { id: 44, name: 'Speed Air Hockey', floor: '13th', imageUrl: 'https://picsum.photos/seed/44-SpeedAirHockey/400/300' },
  { id: 45, name: 'Starry Sky', floor: '13th', imageUrl: 'https://picsum.photos/seed/45-StarrySky/400/300' },
  { id: 46, name: 'Dance Baze', floor: '13th', imageUrl: 'https://picsum.photos/seed/46-DanceBaze/400/300' },
  { id: 47, name: 'Dance Central 3', floor: '13th', imageUrl: 'https://picsum.photos/seed/47-DanceCentral3/400/300' },
  { id: 48, name: 'Hologate 1', floor: '12th', imageUrl: 'https://picsum.photos/seed/48-Hologate1/400/300' },
  { id: 49, name: 'Hologate 2', floor: '12th', imageUrl: 'https://picsum.photos/seed/49-Hologate2/400/300' },
  { id: 50, name: 'Gyro VR 1', floor: '12th', imageUrl: 'https://picsum.photos/seed/50-GyroVR1/400/300' },
  { id: 51, name: 'Gyro VR 2', floor: '12th', imageUrl: 'https://picsum.photos/seed/51-GyroVR2/400/300' },
  { id: 52, name: 'HADO 1', floor: '12th', imageUrl: 'https://picsum.photos/seed/52-HADO1/400/300' },
  { id: 53, name: 'HADO 2', floor: '12th', imageUrl: 'https://picsum.photos/seed/53-HADO2/400/300' },
  { id: 54, name: 'Jurassic World', floor: '12th', imageUrl: 'https://picsum.photos/seed/54-JurassicWorld/400/300' },
  { id: 55, name: 'Kids Train', floor: '11th', imageUrl: 'https://picsum.photos/seed/55-KidsTrain/400/300' },
  { id: 56, name: 'Sea Saw', floor: '11th', imageUrl: 'https://picsum.photos/seed/56-SeaSaw/400/300' },
  { id: 57, name: 'Flower Tea cup', floor: '11th', imageUrl: 'https://picsum.photos/seed/57-FlowerTeacup/400/300' },
  { id: 58, name: 'Flowing Boat', floor: '11th', imageUrl: 'https://picsum.photos/seed/58-FlowingBoat/400/300' },
  { id: 59, name: 'Discotagada', floor: '11th', imageUrl: 'https://picsum.photos/seed/59-Discotagada/400/300' },
  { id: 60, name: 'Happy Spray Ball', floor: '11th', imageUrl: 'https://picsum.photos/seed/60-HappySprayBall/400/300' },
  { id: 61, name: 'Bumper Car', floor: '11th', imageUrl: 'https://picsum.photos/seed/61-BumperCar/400/300' },
  { id: 62, name: 'Rambo Machine Gun', floor: '11th', imageUrl: 'https://picsum.photos/seed/62-RamboMachineGun/400/300' },
  { id: 63, name: 'Hummer', floor: '11th', imageUrl: 'https://picsum.photos/seed/63-Hummer/400/300' },
  { id: 64, name: 'Batman 1', floor: '11th', imageUrl: 'https://picsum.photos/seed/64-Batman1/400/300' },
  { id: 65, name: 'Super Bike 1', floor: '11th', imageUrl: 'https://picsum.photos/seed/65-SuperBike1/400/300' },
  { id: 66, name: 'Power Truck', floor: '11th', imageUrl: 'https://picsum.photos/seed/66-PowerTruck/400/300' },
  { id: 67, name: 'MVP Basket Ball 1', floor: '11th', imageUrl: 'https://picsum.photos/seed/67-MVPBasketBall1/400/300' },
  { id: 68, name: 'MVP Basket Ball 2', floor: '11th', imageUrl: 'https://picsum.photos/seed/68-MVPBasketBall2/400/300' },
  { id: 69, name: 'Extreme Snowboard 1', floor: '11th', imageUrl: 'https://picsum.photos/seed/69-ExtremeSnowboard1/400/300' },
  { id: 70, name: 'Initial D6', floor: '10th', imageUrl: 'https://picsum.photos/seed/70-InitialD6/400/300' },
  { id: 71, name: 'Cosmos Bowling', floor: '10th', imageUrl: 'https://picsum.photos/seed/71-CosmosBowling/400/300' },
  { id: 72, name: 'Jumping House', floor: '10th', imageUrl: 'https://picsum.photos/seed/72-JumpingHouse/400/300' },
  { id: 73, name: 'Flying Chair', floor: '10th', imageUrl: 'https://picsum.photos/seed/73-FlyingChair/400/300' },
  { id: 74, name: 'Little plane', floor: '10th', imageUrl: 'https://picsum.photos/seed/74-Littleplane/400/300' },
  { id: 75, name: 'Ladybug Paradise', floor: '10th', imageUrl: 'https://picsum.photos/seed/75-LadybugParadise/400/300' },
  { id: 76, name: 'Samba Balloon', floor: '10th', imageUrl: 'https://picsum.photos/seed/76-SambaBalloon/400/300' },
  { id: 77, name: 'Bee Park 1', floor: '10th', imageUrl: 'https://picsum.photos/seed/77-BeePark1/400/300' },
  { id: 78, name: 'Bee Park 2', floor: '10th', imageUrl: 'https://picsum.photos/seed/78-BeePark2/400/300' },
  { id: 79, name: 'Love Sports 1', floor: '10th', imageUrl: 'https://picsum.photos/seed/79-LoveSports1/400/300' },
  { id: 80, name: 'Drummer Kids', floor: '10th', imageUrl: 'https://picsum.photos/seed/80-DrummerKids/400/300' },
  { id: 81, name: 'Dirty Driven', floor: '10th', imageUrl: 'https://picsum.photos/seed/81-DirtyDriven/400/300' },
  { id: 82, name: 'Storm Racer G', floor: '10th', imageUrl: 'https://picsum.photos/seed/82-StormRacerG/400/300' },
  { id: 83, name: 'Kids BasketBall 1', floor: '10th', imageUrl: 'https://picsum.photos/seed/83-KidsBasketBall1/400/300' },
  { id: 84, name: 'Kids BasketBall 2', floor: '10th', imageUrl: 'https://picsum.photos/seed/84-KidsBasketBall2/400/300' },
  { id: 85, name: 'Kids BasketBall 3', floor: '10th', imageUrl: 'https://picsum.photos/seed/85-KidsBasketBall3/400/300' },
  { id: 86, name: '3D Extreme Flight 2', floor: '10th', imageUrl: 'https://picsum.photos/seed/86-3DExtremeFlight2/400/300' },
  { id: 87, name: 'Space Travel', floor: '10th', imageUrl: 'https://picsum.photos/seed/87-SpaceTravel/400/300' },
  { id: 88, name: 'Dolphin Baby', floor: '10th', imageUrl: 'https://picsum.photos/seed/88-DolphinBaby/400/300' },
  { id: 89, name: 'Police Car', floor: '10th', imageUrl: 'https://picsum.photos/seed/89-PoliceCar/400/300' },
  { id: 90, name: 'TT Motor 1', floor: '10th', imageUrl: 'https://picsum.photos/seed/90-TTMotor1/400/300' },
  { id: 91, name: 'TT Motor 2', floor: '10th', imageUrl: 'https://picsum.photos/seed/91-TTMotor2/400/300' },
  { id: 92, name: 'Dark Space Ball', floor: '9th', imageUrl: 'https://picsum.photos/seed/92-DarkSpaceBall/400/300' },
  { id: 93, name: 'Softplay', floor: '9th', imageUrl: 'https://picsum.photos/seed/93-Softplay/400/300' },
  { id: 94, name: 'Inflatable Volcano', floor: '9th', imageUrl: 'https://picsum.photos/seed/94-InflatableVolcano/400/300' },
  { id: 95, name: 'Kids Trampoline', floor: '9th', imageUrl: 'https://picsum.photos/seed/95-KidsTrampoline/400/300' },
  { id: 96, name: 'Carousel 12 seat', floor: '9th', imageUrl: 'https://picsum.photos/seed/96-Carousel12seat/400/300' },
  { id: 97, name: 'Mini Pirate ship', floor: '9th', imageUrl: 'https://picsum.photos/seed/97-MiniPirateship/400/300' },
  { id: 98, name: 'Gyroscope', floor: '9th', imageUrl: 'https://picsum.photos/seed/98-Gyroscope/400/300' },
  { id: 99, name: 'Toddler Zone', floor: '9th', imageUrl: 'https://picsum.photos/seed/99-ToddlerZone/400/300' },
  { id: 100, name: 'Go Fishing 1', floor: '9th', imageUrl: 'https://picsum.photos/seed/100-GoFishing1/400/300' },
  { id: 101, name: 'Go Fishing 2', floor: '9th', imageUrl: 'https://picsum.photos/seed/101-GoFishing2/400/300' },
  { id: 102, name: 'Summer Time 1', floor: '9th', imageUrl: 'https://picsum.photos/seed/102-SummerTime1/400/300' },
  { id: 103, name: 'Summer Time 2', floor: '9th', imageUrl: 'https://picsum.photos/seed/103-SummerTime2/400/300' },
  { id: 104, name: 'Just Dance kids', floor: '9th', imageUrl: 'https://picsum.photos/seed/104-JustDancekids/400/300' },
  { id: 105, name: 'Island Hero', floor: '9th', imageUrl: 'https://picsum.photos/seed/105-IslandHero/400/300' },
  { id: 106, name: 'Tubin Twist', floor: '9th', imageUrl: 'https://picsum.photos/seed/106-TubinTwist/400/300' },
  { id: 107, name: 'Shooting Mania', floor: '9th', imageUrl: 'https://picsum.photos/seed/107-ShootingMania/400/300' },
  { id: 108, name: 'Operation Ghost', floor: '9th', imageUrl: 'https://picsum.photos/seed/108-OperationGhost/400/300' },
  { id: 109, name: 'Greedy snake', floor: '9th', imageUrl: 'https://picsum.photos/seed/109-Greedysnake/400/300' },
  { id: 110, name: 'Rainbow Paradise', floor: '9th', imageUrl: 'https://picsum.photos/seed/110-RainbowParadise/400/300' },
  { id: 111, name: 'Hopping Road Island', floor: '9th', imageUrl: 'https://picsum.photos/seed/111-HoppingRoadIsland/400/300' },
  { id: 112, name: 'Candy Car', floor: '1st', imageUrl: 'https://picsum.photos/seed/112-CandyCar/400/300' },
];

export const OPERATORS_ARRAY: Operator[] = [
  { id: 21700110, name: 'Anser Uddin' },
  { id: 21700111, name: 'Kayum Hossain' },
  { id: 21700148, name: 'Md.Rustom Ali' },
  { id: 21700250, name: 'Md.Rakib Hossain' },
  { id: 21700254, name: 'Md. Tarek khan' },
  { id: 21700336, name: 'Rakibul Islam Santo' },
  { id: 21800379, name: 'Md. Akidul Islam' },
  { id: 21801023, name: 'Md. Antaj Khan Rafsan' },
  { id: 21900062, name: 'Md. Songram Ali' },
  { id: 22200363, name: 'Md. Shohag Mia' },
  { id: 22200364, name: 'Md. Nurul Islam' },
  { id: 22200366, name: 'Mehedi Hasan' },
  { id: 22200367, name: 'Md. Shoyeb Hossain' },
  { id: 22200373, name: 'Md. Foysal' },
  { id: 22200377, name: 'Lemon Ritchil' },
  { id: 22200414, name: 'Rubel Miah' },
  { id: 22200968, name: 'Saiful Islam Tapu' },
  { id: 22200969, name: 'Md. Iqbal Hossan' },
  { id: 22200971, name: 'Sabbir Sheikh' },
  { id: 22201614, name: 'Sujon Miah' },
  { id: 22201615, name: 'Mir.Md.Kawsar' },
  { id: 22300887, name: 'Md. Ashikur Rahman' },
  { id: 22300888, name: 'Md. Sarowar Hosen Sani' },
  { id: 22300889, name: 'Md. Jihadul Islam' },
  { id: 22300890, name: 'Tajul Islam' },
  { id: 22300891, name: 'Md. Saikat Howlader' },
  { id: 22300892, name: 'Md.Rana' },
  { id: 22300873, name: 'Asadul Islam' },
  { id: 22300874, name: 'Said Al Fahim' },
  { id: 22300893, name: 'Md.Hazrot Ali' },
  { id: 22300881, name: 'Md.Mohiuddin Raju' },
  { id: 22300894, name: 'Md.Imran Hossen' },
  { id: 22300884, name: 'Md.Mohirul Islam' },
  { id: 22400253, name: 'Alif Bin Rahman Arnob' },
  { id: 22400663, name: 'Md.Sagor Ali' },
  { id: 22200420, name: 'Ahad Islam Borhan' },
  { id: 21700442, name: 'Meneka Rema' },
  { id: 22200388, name: 'Maria Akter' },
  { id: 22200389, name: 'Taniya Khatun' },
  { id: 22200390, name: 'Lima Akter' },
  { id: 22200392, name: 'Mahfuja Akter-1' },
  { id: 22200393, name: 'Aka Moni Akter' },
  { id: 22200394, name: 'Farzana Akter Popi' },
  { id: 22200400, name: 'Akhi Akter' },
  { id: 22200405, name: 'Taslima Nasrin' },
  { id: 22200410, name: 'Rabeya Akter' },
  { id: 22200972, name: 'Amena Akter' },
  { id: 22200976, name: 'Motia Sultana' },
  { id: 22300858, name: 'Sathi Akter' },
  { id: 22300859, name: 'Chandona Falguni' },
  { id: 22300860, name: 'Rally Chakma' },
  { id: 22300861, name: 'Salma Akter' },
  { id: 22300864, name: 'Nazma Akter' },
  { id: 22400254, name: 'Taslima Akter' },
  { id: 22401018, name: 'Farhana Akter Mou' },
  { id: 22401019, name: 'Sanjida Akter' },
  { id: 22501155, name: 'Kethi Nekola' },
  { id: 22501156, name: 'Md. Hasibur Rahman' },
  { id: 22501157, name: 'Faysal Ahammed Emon' },
  { id: 22501158, name: 'Uzzal Sarder' },
  { id: 22501159, name: 'Tania Akter' },
  { id: 22501160, name: 'Sayed Shahriar Naved Deep' },
  { id: 95110479, name: 'Md. Biplob Alom' },
  { id: 95110370, name: 'Morsaline Mollah' },
  { id: 95110850, name: 'Shiuli Khatun' },
  { id: 95110399, name: 'Zobaida' },
  { id: 95110402, name: 'Akhinur Begum' },
  { id: 95110465, name: 'Rikta Akter' },
  { id: 95110702, name: 'Fahima Kobir' },
  { id: 95110401, name: 'Lipi Akter' },
  { id: 95110967, name: 'Farida Akter' },
];

export const TICKET_SALES_PERSONNEL_ARRAY: Operator[] = [
  { id: 22200425, name: 'Moriom Akter' },
  { id: 22200428, name: 'Md. Shawon Ali Shek' },
  { id: 22201973, name: 'Md. Maruf' },
  { id: 22200607, name: 'Abu Taher' },
  { id: 22300856, name: 'Mahamudul Hasan' },
  { id: 22200335, name: 'Sumaiya Sharmin Tiha' },
  { id: 22301496, name: 'A. Rahman Nayeem' },
  { id: 22301495, name: 'Samia Akter Mim' },
  { id: 22200395, name: 'Bithi Akter' },
  { id: 22300862, name: 'Happy Akter' },
  { id: 22200962, name: 'Abdullah Shajib' },
  { id: 22200401, name: 'Jannatul Ferdous' },
  { id: 21801025, name: 'Md. Mainuddin Chokder' },
  { id: 22200966, name: 'Md. Ferdaus' },
  { id: 21801029, name: 'Rumjhum Nokrek' },
  { id: 22500734, name: 'Uday Chandra' },
  { id: 22500733, name: 'Md.Arifuzzaman' },
  { id: 22200370, name: 'Md. Jhohirul Islam' },
  { id: 22201975, name: 'Sumaiya Chowdhury' },
  { id: 22200423, name: 'Afsi Kongkon' },
  { id: 22200602, name: 'Lima Parvin' },
];

export const COUNTERS_ARRAY: Counter[] = [
    { id: 1, name: 'L-1, North (Attrium)', location: 'Level-1, TFW Booth' },
    { id: 2, name: 'L-1, South (Attrium)', location: 'Level-1, TFW Booth' },
    { id: 3, name: 'Tower Part Counter-1', location: 'Tower Part (Beside Aarong)' },
    { id: 4, name: 'Tower Part Counter-3', location: 'Tower Part (Beside Aarong)' },
    { id: 5, name: 'Tower Part Counter-2 (Online)', location: 'Tower Part (Beside Aarong)' },
    { id: 6, name: 'Basement Counter-1', location: 'Basement -1' },
    { id: 7, name: 'Level-8 Counter-1', location: 'Level-8' },
    { id: 8, name: 'Level-8 Counter-2', location: 'Level-8' },
    { id: 9, name: 'Level-8 Counter-3', location: 'Level-8' },
    { id: 10, name: 'Level-8 Counter-4', location: 'Level-8' },
    { id: 11, name: 'Level-8 Counter-1 (Online)', location: 'Level-8' },
    { id: 12, name: 'Level-9 Counter-1', location: 'Level-9' },
    { id: 13, name: 'Level-10 Counter-1', location: 'Level-10' },
    { id: 14, name: 'Cosmos Bowling Counter', location: 'Cosmos Bowling' },
    { id: 15, name: 'Level-11 Counter-1', location: 'Level-11' },
    { id: 16, name: 'Level-12 Counter-1', location: 'Level-12' },
    { id: 17, name: 'Level-13 Counter-1', location: 'Level-13' },
    { id: 18, name: 'Level-14 Counter-1', location: 'Level-14' },
    { id: 19, name: 'Level-15 Counter-1', location: 'Level-15' },
    { id: 20, name: 'Level-16 Counter-1', location: 'Level-16' },
    { id: 21, name: 'Level-17 Counter-1', location: 'Level-17' }
];

export const RIDES = arrayToObjectById(RIDES_ARRAY);
export const OPERATORS = arrayToObjectById(OPERATORS_ARRAY);
export const TICKET_SALES_PERSONNEL = arrayToObjectById(TICKET_SALES_PERSONNEL_ARRAY);
export const COUNTERS = arrayToObjectById(COUNTERS_ARRAY);

const uniqueFloors = [...new Set(RIDES_ARRAY.map(ride => ride.floor))];
const floorOrder = ['17th', '16th', '15th', '14th', '13th', '12th', '11th', '10th', '9th', '1st'];

export const FLOORS = [...uniqueFloors].sort((a, b) => {
    const indexA = floorOrder.indexOf(a);
    const indexB = floorOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
});

export const SECURITY_FLOORS = ['1st', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th'];

// Minimal 1x1 transparent PNG as placeholder
export const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";