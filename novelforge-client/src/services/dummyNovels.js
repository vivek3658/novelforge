/**
 * NovelForge Curated Catalog & Demonstration Dataset
 *
 * NOTE ON DATA ISOLATION:
 * This catalog provides a showcase of serials, genres, and readable chapters
 * for client-side discovery, reading UI demonstration, and navigation testing.
 * All items in this file are explicitly flagged with `isCuratedCatalog: true`
 * and are never represented as live backend server records.
 */

export const DUMMY_NOVELS = [
  {
    id: 'catalog-1',
    title: 'Shadows of the Astral Realm',
    author: 'Elena Vance',
    categoryType: 'FICTION',
    genre: 'Fantasy / Cultivation',
    synopsis:
      'A fallen prodigy discovers an ancient forbidden scroll that binds cosmic constellations to his spirit soul. Facing ancient clans and sect rivalries, he embarks on an arduous ascension path to uncover primordial secrets that the celestial empires have kept buried for ten thousand years.',
    rating: 4.9,
    views: '124K',
    bookmarkCount: 8420,
    chaptersCount: 3,
    chapterStatus: '3 Chapters Available',
    createdAt: '2026-09-15T10:30:00Z',
    updatedAt: '2026-10-02T14:20:00Z',
    gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    isCuratedCatalog: true,
    tags: ['Constellations', 'Cultivation', 'Prodigy', 'Martial Spirits'],
    chapters: [
      {
        id: 'ch-1',
        chapterNumber: 1,
        title: 'Chapter 1: The Broken Meridian',
        wordCount: 1420,
        publishedAt: '2026-09-15T12:00:00Z',
        paragraphs: [
          'The evening mist rolled thick across the jade courtyards of the Silver Horizon Sect. Rain had fallen throughout the third watch, drenching the carved dragons coiled around the pavilion pillars.',
          'Kaelen stood with his hands behind his back, staring out across the valley where thunder still rumbled like distant war drums. His meridians burned with the cold sting of shattered spirit veins. Three seasons had passed since the catastrophe in the Obsidian Gorge, and the sect elders had long ceased their visits.',
          '"Still watching the stars?" A quiet voice cut through the damp chill. Liora stepped out onto the veranda, holding a simple lantern whose light flickered against the wet slate tiles.',
          '"They are the only things in this realm that do not alter their courses when a disciple falls from grace," Kaelen replied without turning. His breath formed faint plumes in the autumn mountain air.',
          'Liora set the lantern upon the low stone balustrade. "The council meets at dawn. Elder Shen has already proposed allocating your spirit chamber to one of the newly admitted disciples from the outer court. They believe your core will never rekindle."',
          'A quiet smile touched the corner of Kaelen\'s lips, though it did not reach his eyes. Within the depth of his spiritual sea—beneath the cracked foundation that the physicians had declared dead—an ancient glyph shaped like a burning eye of sapphire starlight had begun to turn for the first time in five hundred years.',
          'He reached into the lining of his tunic and felt the rough parchment of the Astral Lexicon. It was cold to the touch, yet whenever his pulse quickened, it resonated with a heartbeat entirely separate from his own.',
          '"Let them take the chamber," Kaelen said softly. "The pavilion was always too small for what comes next."'
        ]
      },
      {
        id: 'ch-2',
        chapterNumber: 2,
        title: 'Chapter 2: The Whispering Lexicon',
        wordCount: 1580,
        publishedAt: '2026-09-22T14:00:00Z',
        paragraphs: [
          'Midnight arrived without moonlight. Dense cloud cover shrouded Mount Qinglan, casting the outer forest in pitch blackness.',
          'Inside the secluded bamboo hut at the foot of the cliff, Kaelen unrolled the parchment across a weathered pine table. The ink did not resemble charcoal or cinnabar; it glistened like crushed lapis lazuli suspended in midnight dew.',
          'As he leaned closer, the characters rearranged themselves upon the fibers of the paper. Where standard martial codices described the flow of qi through twelve terrestrial channels, the Lexicon described thirty-six celestial convergences corresponding to the constellations above the southern quadrant.',
          '"The nine heavens do not give power to the flesh," the opening verse read. "The flesh is merely the needle that points toward the cosmic pole. Break the vessel, and the sea cannot be contained."',
          'Kaelen closed his eyes and drew a slow, deliberate breath. Following the intricate sequence of breathing cycles mapped in the first diagram, he bypassed his damaged dantian completely, drawing the ambient spiritual pressure of the mountain directly toward his crown.',
          'A sharp, piercing agony spiked through his skull, as though molten silver were being poured into his mind. Yet right behind the pain came an intoxicating clarity. The sound of pine needles brushing against the roof, the rhythm of insects beneath the damp earth fifty yards away, the distant breathing of sentries at the sect gates—everything echoed in his consciousness with immaculate fidelity.',
          'When he opened his eyes, the parchment was glowing with a faint, iridescent azure radiance. The first constellation—The Starlight Archer—had imprinted itself onto his soul.'
        ]
      },
      {
        id: 'ch-3',
        chapterNumber: 3,
        title: 'Chapter 3: The Gathering Storm',
        wordCount: 1690,
        publishedAt: '2026-09-29T16:30:00Z',
        paragraphs: [
          'Dawn broke over Mount Qinglan in hues of pale bronze and cold violet. The ceremonial bell struck three times, its deep bronze resonance echoing down into the river valleys.',
          'Disciple ranks gathered upon the Grand Sun Terrace for the biannual meridian assessment. Hundreds of young martial artists stood in pristine white tunics, their spirit rings gleaming under the morning light as elders observed from the elevated marble dais.',
          'When Kaelen entered through the south archway, a sudden silence rippled through the outer rows. Whispers spread like fire through dry grass.',
          '"Is that Kaelen?"',
          '"Why has he come? Elder Shen explicitly decreed that crippled disciples need not attend the ranking."',
          'Kaelen paid no heed to the murmurs. His posture was straight, his footsteps light. To the casual eye, he seemed unchanged—slender, quiet, carrying no weapons beyond a worn wooden sheath at his belt. But to the spiritual beasts kept in the sect stables half a mile distant, something vast and terrifying had just entered the courtyard, causing three iron-clawed gryphons to pace restlessly inside their reinforced cages.',
          'At the center of the terrace stood the Pillar of Resonant Truth, an eight-foot obelisk of translucent basalt that measured a cultivator\'s inner vitality.',
          '"Next candidate," the proctor called out, glancing at the ledger before pausing as his eyes met Kaelen\'s. "Kaelen of the Third Peak... step forward if you insist on formal examination."'
        ]
      }
    ]
  },
  {
    id: 'catalog-2',
    title: 'Cyberpunk Odyssey 2099',
    author: 'Kaelen Cross',
    categoryType: 'FICTION',
    genre: 'Sci-Fi / Cyberpunk',
    synopsis:
      'In a rain-drenched megacity governed by neural AI overlords, a rogue data smuggler uncovers a fatal glitch in humanity\'s uploaded consciousness grid. With corp syndicates hunting his biometric signature, he must dive into the dark subnets of Old Neo-Tokyo to deliver the payload.',
    rating: 4.8,
    views: '98K',
    bookmarkCount: 6150,
    chaptersCount: 2,
    chapterStatus: '2 Chapters Available',
    createdAt: '2026-09-18T08:15:00Z',
    updatedAt: '2026-10-04T11:45:00Z',
    gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
    isCuratedCatalog: true,
    tags: ['Cyberpunk', 'AI', 'Neural Net', 'Neon Noir'],
    chapters: [
      {
        id: 'co-1',
        chapterNumber: 1,
        title: 'Chapter 1: Rain on Neon Glass',
        wordCount: 1350,
        publishedAt: '2026-09-18T10:00:00Z',
        paragraphs: [
          'The drizzle over Sector 09 tasted of zinc and exhaust fumes. Holographic advertisements for synthesized memory vacations bathed the chrome skyways in sickly shades of magenta and electric teal.',
          'Jax adjusted the optic filter over his left eye, watching the encrypted packet trickle across his augmented retina. 48.2 percent. The transmission was coming from a burner server lodged somewhere in the flooded geothermal vents beneath Lower Shinjuku.',
          '"Two minutes till city security drone sweep," his handler whispered over the sub-dermal comms channel. Vesper sounded tense, her vocal modulation rattling slightly.',
          '"They won\'t scan this vent," Jax muttered, stepping deeper into the shadow of the cooling exhaust tower. "The thermals here are hot enough to fry an infrared optic."',
          '"You haven\'t seen what the Syndicate rolled out this morning, Jax. They deployed Chiron-class hunters. Autonomous wetware drones with predictive heuristic chips."',
          'Jax watched the progress bar hit 85 percent. Whatever was in this data shard, it wasn\'t standard corporate embezzlement ledgers. The telemetry headers carried military-grade quantum encryption signatures reserved for project Genesis.'
        ]
      },
      {
        id: 'co-2',
        chapterNumber: 2,
        title: 'Chapter 2: Ghost in the Quantum Lattice',
        wordCount: 1480,
        publishedAt: '2026-09-25T11:30:00Z',
        paragraphs: [
          'The download pinged complete with a sharp vibrational chime directly behind Jax\'s temple. Instantly, his ocular overlay glitched with red static.',
          'Lines of uncompiled binary cascaded across his field of vision. Not code—memories. High-resolution sensory playback of a laboratory in high Earth orbit, cold white sterile light, and an artificial voice speaking a phrase that chilled his blood.',
          '"Subject 04 consciousness upload failed. Commencing memory wipe on remaining civilian test subjects."',
          'Above him on the transit rail, the high-pitched whine of magnetic lift thrusters cut through the rain. A sleek carbon-fiber craft dropped out of the smog without navigation lights.',
          'Jax didn\'t hesitate. He vaulted over the rusty safety railing into the dark abyss of the transit ventilation shaft.'
        ]
      }
    ]
  },
  {
    id: 'catalog-3',
    title: 'The Alchemist of Forgotten Stars',
    author: 'Aria Thorne',
    categoryType: 'FICTION',
    genre: 'LitRPG / Adventure',
    synopsis:
      'When modern potion brewing meets high fantasy system progression, one forgotten craft turns the tides of war across seven celestial empires. Armed with knowledge of molecular distillation and ancient runic catalysts, a master apothecary rises.',
    rating: 4.95,
    views: '210K',
    bookmarkCount: 11200,
    chaptersCount: 2,
    chapterStatus: '2 Chapters Available',
    createdAt: '2026-09-20T12:00:00Z',
    updatedAt: '2026-10-05T16:10:00Z',
    gradient: 'linear-gradient(135deg, #065f46, #10b981)',
    isCuratedCatalog: true,
    tags: ['Alchemy', 'System Progression', 'Magic', 'Adventure'],
    chapters: [
      {
        id: 'al-1',
        chapterNumber: 1,
        title: 'Chapter 1: The Boiling Cauldron',
        wordCount: 1290,
        publishedAt: '2026-09-20T14:00:00Z',
        paragraphs: [
          'In the imperial academy of Valenor, alchemy was considered the refuge of failed sorcerers. True mages commanded thunder and split mountains; alchemists merely stained their fingers with sulfur and charcoal.',
          'Sylas adjusted the copper condenser coil above his retort. While other apprentices chanted incantations to stabilize their draughts, Sylas monitored temperature gradients using a glass thermometer he had calibrated by hand.',
          'A soft chime resonated in his mind: [System Notification: Distillation Purity 98.4%. Reaction Efficiency Exceeds Tier 1 Thresholds.]',
          '"Remarkable," he whispered, watching the crystalline violet precipitate settle at the bottom of the flask.'
        ]
      },
      {
        id: 'al-2',
        chapterNumber: 2,
        title: 'Chapter 2: Runic Resonance',
        wordCount: 1410,
        publishedAt: '2026-09-27T16:00:00Z',
        paragraphs: [
          'The master evaluator examined the flask with raised eyebrows. "You claim this potion was brewed without a spirit core catalyst?"',
          '"Catalysts do not require spiritual cores when the molecular affinity between the sun-dew herb and silver nitrate is properly catalyzed by ambient thermal convection," Sylas answered calmly.',
          'The evaluator uncorked the vial. A fragrance like sweet spring rain filled the judging chamber, and the ambient magical detectors in the room flared gold.',
          '[Skill Unlocked: Celestial Apothecary Tier I.]'
        ]
      }
    ]
  },
  {
    id: 'catalog-4',
    title: 'Chronicles of the Broken Throne',
    author: 'Marcus Vance',
    categoryType: 'FICTION',
    genre: 'Epic Fantasy',
    synopsis:
      'Seven kingdoms collide under the omen of the twin moons. Betrayal, honor, and ancient beasts awaken to reshape the geopolitical map of the Old World as winter storms threaten the northern frontiers.',
    rating: 4.7,
    views: '86K',
    bookmarkCount: 4300,
    chaptersCount: 1,
    chapterStatus: '1 Chapter Available',
    createdAt: '2026-09-22T09:40:00Z',
    updatedAt: '2026-10-01T18:30:00Z',
    gradient: 'linear-gradient(135deg, #7c2d12, #ea580c)',
    isCuratedCatalog: true,
    tags: ['Kingdoms', 'Intrigue', 'Warfare', 'Dragons'],
    chapters: [
      {
        id: 'bt-1',
        chapterNumber: 1,
        title: 'Chapter 1: Ravens in the Frost',
        wordCount: 1520,
        publishedAt: '2026-09-22T11:00:00Z',
        paragraphs: [
          'The raven arrived at dawn with ice clinging to its flight feathers. In the great hall of Ironkeep, Lord Corvin broke the wax seal stamped with the royal crest.',
          'The king was dead, and seven armies were already marching toward the capital.',
          '"Summon the bannermen," Corvin said to his seneschal. "The long peace is finished."'
        ]
      }
    ]
  },
  {
    id: 'catalog-5',
    title: 'Architecting Distributed Cloud Systems',
    author: 'Devon Patel',
    categoryType: 'NONFICTION',
    genre: 'Technology & Engineering',
    synopsis:
      'A comprehensive handbook exploring enterprise microservices, reactive event streaming, container orchestration, and fault-tolerant cloud architectures designed for high-throughput distributed scale.',
    rating: 4.92,
    views: '64K',
    bookmarkCount: 5200,
    chaptersCount: 1,
    chapterStatus: '1 Chapter Available',
    createdAt: '2026-09-25T14:00:00Z',
    updatedAt: '2026-10-03T09:15:00Z',
    gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    isCuratedCatalog: true,
    tags: ['Microservices', 'Distributed Systems', 'Architecture', 'DevOps'],
    chapters: [
      {
        id: 'arch-1',
        chapterNumber: 1,
        title: 'Chapter 1: Deconstructing the Monolith',
        wordCount: 1640,
        publishedAt: '2026-09-25T15:00:00Z',
        paragraphs: [
          'When designing modern distributed applications, breaking business domains into cohesive, independently deployable services requires rigorous bounded context definition.',
          'This chapter explores API Gateway patterns, token lifecycle isolation, circuit breakers, and database-per-service isolation models.'
        ]
      }
    ]
  },
  {
    id: 'catalog-6',
    title: 'Echoes of the Abyssal Core',
    author: 'Miriam Zhang',
    categoryType: 'FICTION',
    genre: 'Deep Sea Sci-Fi',
    synopsis:
      'Deep ocean surveyors breach a hydrothermal rift only to wake a dormant biomechanical leviathan civilization sleeping beneath the seabed for three million years.',
    rating: 4.85,
    views: '73K',
    bookmarkCount: 3900,
    chaptersCount: 1,
    chapterStatus: '1 Chapter Available',
    createdAt: '2026-09-28T11:20:00Z',
    updatedAt: '2026-10-06T15:50:00Z',
    gradient: 'linear-gradient(135deg, #312e81, #6366f1)',
    isCuratedCatalog: true,
    tags: ['Deep Sea', 'Sci-Fi', 'Mystery', 'Leviathans'],
    chapters: [
      {
        id: 'ab-1',
        chapterNumber: 1,
        title: 'Chapter 1: At 11,000 Meters',
        wordCount: 1380,
        publishedAt: '2026-09-28T13:00:00Z',
        paragraphs: [
          'The sonar pulse rebounded with a resonance that should not have been possible at eleven thousand meters beneath the Pacific surface.',
          'Dr. Maya Chen stared at the acoustic profile. It was not volcanic basalt—it was a repeating lattice of geometric titanium arches.'
        ]
      }
    ]
  },
  {
    id: 'catalog-7',
    title: 'The Art of Modern Narrative Craft',
    author: 'Clarissa Montgomery',
    categoryType: 'NONFICTION',
    genre: 'Writing & Literary Craft',
    synopsis:
      'Exploring character dynamics, narrative tension, reader psychology, and pacing strategies for digital serialized web fiction authors navigating reader engagement.',
    rating: 4.88,
    views: '45K',
    bookmarkCount: 2900,
    chaptersCount: 1,
    chapterStatus: '1 Chapter Available',
    createdAt: '2026-10-01T13:10:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
    gradient: 'linear-gradient(135deg, #831843, #ec4899)',
    isCuratedCatalog: true,
    tags: ['Writing Craft', 'Storytelling', 'Serialization', 'Creativity'],
    chapters: [
      {
        id: 'craft-1',
        chapterNumber: 1,
        title: 'Chapter 1: The Serialized Hook',
        wordCount: 1470,
        publishedAt: '2026-10-01T15:00:00Z',
        paragraphs: [
          'Web serialization demands a fundamentally different narrative rhythm than traditional novel publishing. Each installment must deliver both satisfying immediate micro-payoffs and persistent overarching tension.'
        ]
      }
    ]
  },
  {
    id: 'catalog-8',
    title: 'Reincarnation of the Void Sovereign',
    author: 'Jin Woo',
    categoryType: 'FICTION',
    genre: 'Action / Reincarnation',
    synopsis:
      'Betrayed by divine pantheons at the pinnacle of power, the Void Sovereign reawakens three centuries earlier in the mortal body of an exiled noble destined for execution.',
    rating: 4.91,
    views: '180K',
    bookmarkCount: 9700,
    chaptersCount: 1,
    chapterStatus: '1 Chapter Available',
    createdAt: '2026-10-03T17:45:00Z',
    updatedAt: '2026-10-07T10:30:00Z',
    gradient: 'linear-gradient(135deg, #581c87, #c084fc)',
    isCuratedCatalog: true,
    tags: ['Reincarnation', 'Action', 'Vengeance', 'Void Magic'],
    chapters: [
      {
        id: 'vs-1',
        chapterNumber: 1,
        title: 'Chapter 1: The Executioner\'s Blade',
        wordCount: 1510,
        publishedAt: '2026-10-03T19:00:00Z',
        paragraphs: [
          'The cold iron of the blade pressed against his collarbone. Rain pelted the muddy cobblestones of the royal execution plaza.',
          'Lucian opened his eyes. But the soul dwelling behind those violet irises was no longer a frightened boy—it was the Void Sovereign.'
        ]
      }
    ]
  }
];

export const NOVEL_GRADIENTS = [
  'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  'linear-gradient(135deg, #4c1d95, #8b5cf6)',
  'linear-gradient(135deg, #065f46, #10b981)',
  'linear-gradient(135deg, #7c2d12, #ea580c)',
  'linear-gradient(135deg, #312e81, #6366f1)',
  'linear-gradient(135deg, #581c87, #c084fc)',
  'linear-gradient(135deg, #0f766e, #14b8a6)',
  'linear-gradient(135deg, #831843, #ec4899)',
];
