// gamesData.ts
export interface Game {
    id: number;
    name: string;
    genre: string;
    type: "game" | "sports";
    imageUrl: string;
  }
  
  export const topGames: Game[] = [
    // 🎮 Regular Games
 
    {
      id: 2,
      name: "Badminton",
      genre: "Action-Adventure",
      type: "game",
      imageUrl: "https://allnameideas.com/wp-content/uploads/2024/11/badminton-team-names-featured.jpg"
    },
    {
      id: 3,
      name: "Tennis",
      genre: "Action-Adventure",
      type: "game",
      imageUrl: "https://images.tennis.com/image/private/t_q-best/tenniscom-prd/dwiykguu0443uqb24qxs.jpg"
    },
    {
      id: 4,
      name: "running",
      genre: "RPG",
      type: "game",
      imageUrl: "https://i.pinimg.com/originals/c2/7d/e0/c27de021952dadd85c623e8d40996a87.jpg"
    },
    {
      id: 5,
      name: "rugby",
      genre: "Battle Royale",
      type: "game",
      imageUrl: "https://live.staticflickr.com/3702/20086802905_5125fecc9b_b.jpg"
    },
    {
      id: 6,
      name: "Horse Racing",
      genre: "Sandbox / Survival",
      type: "game",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Horse-racing-1.jpg/960px-Horse-racing-1.jpg"
    },
    {
      id: 7,
      name: "kabaddi",
      genre: "Battle Royale",
      type: "game",
      imageUrl: "https://assets.gqindia.com/photos/5cdc19fc306c1c39516e43df/16:9/w_1280,c_limit/top-image91.jpg"
    },
    {
      id: 8,
      name: "Valorant",
      genre: "Shooter",
      type: "game",
      imageUrl: "https://ss-i.thgim.com/public/shooting/43ffn3/article54606825.ece/alternates/LANDSCAPE_1200/CHANDELAjpg"
    },
    {
      id: 9,
      name: "Call of Duty: Modern Warfare II",
      genre: "Shooter",
      type: "game",
      imageUrl: "https://www.thesun.co.uk/wp-content/uploads/2022/08/NINTCHDBPICT000750769046.jpg?strip=all&amp;quality=100&amp;w=1920&amp;h=1080&amp;crop=1"
    },
    {
      id: 10,
      name: "Greyhound Racing",
      genre: "Action RPG",
      type: "game",
      imageUrl: "https://static.ffx.io/images/$zoom_0.53%2C$multiply_0.5855%2C$ratio_1.776846%2C$width_1059%2C$x_0%2C$y_26/t_crop_custom/q_86%2Cf_auto/19c0e57cbb6da5683d03d6504f8b0af8b6e87ab2"
    },
  
    // 🏏 Cricket Games
    {
      id: 11,
      name: "Cricket 24",
      genre: "Sports / Cricket",
      type: "sports",
      imageUrl: "https://static.independent.co.uk/s3fs-public/thumbnails/image/2014/07/24/14/AN48554887World-Cup-Final-a.jpg"
    },
    {
      id: 12,
      name: "Cricket 22",
      genre: "Sports / Cricket",
      type: "sports",
      imageUrl: "https://www.isportconnect.com/wp-content/uploads/2021/03/icc-womens-t20-world-cup-2016-schedule-1024x768-1.jpg"
    },
    {
      id: 13,
      name: "Big Bash Boom",
      genre: "Sports / Cricket",
      type: "sports",
      imageUrl: "https://i2.wp.com/neoprimesport.com/wp-content/uploads/2018/01/team1.jpg"
    },
    {
      id: 14,
      name: "cycling",
      genre: "Sports / Cricket",
      type: "sports",
      imageUrl: "https://c02.purpledshub.com/uploads/sites/39/2019/03/1400023626990-t1xak1n5qfck-b176042.jpg?webp=1&w=1200"
    },
    {
      id: 15,
      name: "skeleton",
      genre: "Sports / Cricket",
      type: "sports",
      imageUrl: "https://s.hs-data.com/picmon/03/3FA2_673zOl_l.jpg"
    },
  
    // ⚽ Football Games
    {
      id: 16,
      name: "EA Sports FC 24",
      genre: "Sports / Football",
      type: "sports",
      imageUrl: "https://imgresizer.eurosport.com/unsafe/2400x1260/filters:format(jpeg)/origin-imgresizer.eurosport.com/2014/06/23/1264392-27279456-2560-1440.jpg"
    },
    {
      id: 17,
      name: "FIFA 23",
      genre: "Sports / Football",
      type: "sports",
      imageUrl: "https://www.reviewjournal.com/wp-content/uploads/2015/06/web1_2015-06-30t231547z_1_lynxnpeb5t19r_rtroptp_3_us-soccer-women-usa_2.jpg"
    },
    {
      id: 18,
      name: "eFootball 2024",
      genre: "Sports / Football",
      type: "sports",
      imageUrl: "https://i.ytimg.com/vi/sNP3B5olbb4/maxresdefault.jpg"
    },
    {
      id: 19,
      name: "swimming",
      genre: "Sports / Management",
      type: "sports",
      imageUrl: "https://media.insidethegames.biz/media/image/36885/o/O2ZCM784AfXIfmFZ"
    },
    {
      id: 21,
      name: "dancing",
      genre: "Sports / Dancing",
      type: "sports",
      imageUrl: "https://i.pinimg.com/736x/9d/47/6d/9d476d05edaad6d82a9f28f1efccab93.jpg"
    },
    {
      id: 22,
      name: "chess",
      genre: "Sports / Boxing",
      type: "sports",
      imageUrl: "https://avatars.mds.yandex.net/i?id=7751f6675a179f0006442c645d68494f8d4c61c7-11043615-images-thumbs&n=13"
    },
    {
      id: 23,
      name: "karate",
      genre: "Sports / Karate",
      type: "sports",
      imageUrl: "https://i.ytimg.com/vi/cPxmGAZwUdQ/maxresdefault.jpg"
    },
    {
      id: 24,
      name: "hockey",
      genre: "Sports / Hockey",
      type: "sports",
      imageUrl: "https://www.thehockeypaper.co.uk/wp-content/uploads/2018/04/Lily-Owsley-takes-on-the-New-Zealand-defence.-Credit-Simon-Parker.jpg"
    },
    {
      id: 25,
      name: "ice hockey",
      genre: "Sports / Cricket",
      type: "sports",
      imageUrl: "https://thumbs.dreamstime.com/z/ukraine-national-ice-hockey-team-29428674.jpg"
    },
    {
      id: 26,
      name: "basketball",
      genre: "Sports / Football",
      type: "sports",
      imageUrl: "https://i.ytimg.com/vi/QzQD7-E2tUI/maxresdefault.jpg"
    },
    {
      id: 27,
      name: "volleyball",
      genre: "Sports / Volleyball",
      type: "sports",
      imageUrl: "http://www.staradvertiser.com/wp-content/uploads/2017/11/web1_20171104-7361-SPT-UH-WAHINE-VB.jpg"
    },
    {
      id: 20,
      name: "Rocket League",
      genre: "Sports / Vehicular Football",
      type: "sports",
      imageUrl: "https://www.si.com/.image/t_share/MTY4MDA4MTk5MDYxMzE2ODgx/katharine-lotzegettyimages.jpg"
    },

  ];
  