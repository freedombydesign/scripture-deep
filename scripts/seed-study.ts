/**
 * Seed the database with "Heard From the First Day" study
 * Run with: npx ts-node scripts/seed-study.ts
 *
 * Prerequisites:
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Create a teacher user first via the UI
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const studyData = {
  title: 'Heard From the First Day',
  subtitle: 'A Study on Prayer and Spiritual Warfare',
  slug: 'heard-from-the-first-day',
  key_verse_ref: 'Daniel 10:12',
  theme: 'Why are some prayers answered quickly while others seem delayed? This study explores the spiritual warfare behind prayer, examining Daniel\'s 21-day wait and what it teaches us about persistence in prayer.',
  status: 'published' as const,
  published_at: new Date().toISOString(),
}

const sections = [
  {
    position: 1,
    heading: 'The Setting: Daniel\'s Burden',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Daniel was in mourning for three full weeks (Daniel 10:2-3). He had received a troubling vision about a great war, and his heart was heavy with concern for his people. During this time, he ate no choice food, no meat or wine touched his lips, and he used no lotions at all.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This wasn\'t casual prayer - this was intense, focused intercession. Daniel was about 85 years old at this point, having served through the reigns of multiple kings. His lifetime of faithfulness (Daniel 6:4) had prepared him for this moment of spiritual battle.' }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '"In those days I Daniel was mourning three full weeks." - Daniel 10:2' }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Consider how Nehemiah 1:4 shows a similar pattern of mourning and prayer, and Ezra 10:6 demonstrates fasting while mourning. These practices were not mere rituals but expressions of deep spiritual earnestness.' }
          ]
        }
      ]
    },
    reflection_questions: [
      'Have you ever felt burdened to pray for something or someone for an extended period?',
      'What does Daniel\'s three-week fast teach us about persistence in prayer?',
      'How does Daniel 6:10 show us Daniel\'s prayer habits that prepared him for this moment?'
    ]
  },
  {
    position: 2,
    heading: 'The Heavenly Messenger',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'After 21 days, a glorious figure appeared to Daniel by the Tigris River. The description in Daniel 10:5-6 is remarkable: a man clothed in linen, with a belt of gold, his body like beryl, his face like lightning, his eyes like torches of fire, his arms and feet like polished bronze, and his voice like the sound of a multitude.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This description parallels Revelation 1:13-16 where John sees the risen Christ. The similarities are striking - both figures are clothed in radiant garments, both have eyes like fire, both have voices of great power. Compare also Ezekiel 1:26-28 for another vision of divine glory.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Daniel alone saw the vision; the men with him did not see it, but such terror overwhelmed them that they fled and hid (Daniel 10:7). This reminds us of Acts 9:7 where Saul\'s companions heard a voice but saw no one, and Acts 22:9 which adds they did not understand the voice.' }
          ]
        }
      ]
    },
    reflection_questions: [
      'Why do you think God sometimes reveals Himself in such overwhelming ways?',
      'What does it mean that others didn\'t see what Daniel saw (Matthew 13:16)?',
      'How does this compare to Elisha praying for his servant\'s eyes to be opened in 2 Kings 6:17?'
    ]
  },
  {
    position: 3,
    heading: 'Heard From the First Day',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The angel\'s words in Daniel 10:12 are among the most encouraging in all of Scripture: "Fear not, Daniel: for from the first day that thou didst set thine heart to understand, and to chasten thyself before thy God, thy words were heard, and I am come for thy words."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'From the ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'first day', marks: [{ type: 'bold' }, { type: 'italic' }] },
            { type: 'text', text: '. Not the twenty-first day when the answer arrived, but the very first day Daniel began to pray. This echoes Isaiah 65:24: "Before they call, I will answer; and while they are yet speaking, I will hear."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The delay wasn\'t in heaven\'s response - it was in the delivery. The angel was dispatched immediately, but something intervened. This teaches us that unanswered prayer is not the same as unheard prayer. See also 1 John 5:14-15 and Psalm 66:18-19.' }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '"The effectual fervent prayer of a righteous man availeth much." - James 5:16' }
              ]
            }
          ]
        }
      ]
    },
    reflection_questions: [
      'How does knowing your prayers are heard immediately change how you pray?',
      'What does Matthew 6:8 tell us about God\'s awareness of our needs?',
      'How does Hebrews 4:16 encourage us to approach God in prayer?'
    ]
  },
  {
    position: 4,
    heading: 'The Prince of Persia',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Daniel 10:13 reveals something startling: "But the prince of the kingdom of Persia withstood me one and twenty days." This is not the human king of Persia, but a spiritual principality - a demonic power that held influence over the Persian empire.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This verse pulls back the curtain on spiritual warfare in ways few other passages do. Ephesians 6:12 clarifies: "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'These territorial spirits are referenced throughout Scripture. Deuteronomy 32:8 speaks of God dividing the nations according to the number of divine beings. Psalm 82:1 depicts God taking His place among the divine council. Isaiah 24:21 promises punishment for "the host of the high ones on high."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The conflict was real and intense. It took Michael, "one of the chief princes" (Daniel 10:13), to help overcome the resistance. Jude 1:9 and Revelation 12:7-9 give us further glimpses of Michael\'s role in spiritual combat.' }
          ]
        }
      ]
    },
    reflection_questions: [
      'How does understanding spiritual warfare affect how you view delays in answered prayer?',
      'What does Colossians 2:15 tell us about Christ\'s victory over these powers?',
      'According to 2 Corinthians 10:3-4, what weapons do we have for this warfare?'
    ]
  },
  {
    position: 5,
    heading: 'The Weapons of Our Warfare',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Since we face real spiritual opposition, we need real spiritual weapons. Ephesians 6:10-18 gives us the complete armor of God: truth, righteousness, the gospel of peace, faith, salvation, the Word of God, and prayer.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Notice that prayer is mentioned last - it is the means by which we wield all the other pieces. 1 Thessalonians 5:17 commands us to "pray without ceasing." Luke 18:1 teaches us "that men ought always to pray, and not to faint."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The early church understood this. Acts 12:5 tells us Peter was kept in prison, "but prayer was made without ceasing of the church unto God for him." The result? An angel freed him that very night (Acts 12:7-11).' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Consider also Exodus 17:11-12 where Israel prevailed when Moses\' hands were raised in prayer. Joshua 10:12-13 shows another instance of prayer affecting the natural and spiritual realms. Prayer is not passive - it is active spiritual combat.' }
          ]
        }
      ]
    },
    reflection_questions: [
      'Which piece of the armor in Ephesians 6:10-18 do you need to strengthen?',
      'How does the example of Moses in Exodus 17:11 illustrate the importance of persistent prayer?',
      'What does Mark 9:29 teach about certain kinds of spiritual opposition?'
    ]
  },
  {
    position: 6,
    heading: 'Persistence in Prayer',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Jesus taught extensively on persistent prayer. Luke 11:5-8 tells the parable of the friend at midnight who receives bread because of his importunity (persistence). Luke 18:1-8 features the persistent widow who receives justice because she kept asking.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Matthew 7:7-8 uses three progressive verbs: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you." The Greek tense indicates continuous action - keep asking, keep seeking, keep knocking.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Elijah provides another example. In 1 Kings 18:42-44, he prayed seven times for rain before the answer came. He didn\'t give up after the first, second, or sixth prayer. Romans 12:12 commands us to be "continuing instant in prayer."' }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '"And he spake a parable unto them to this end, that men ought always to pray, and not to faint." - Luke 18:1' }
              ]
            }
          ]
        }
      ]
    },
    reflection_questions: [
      'In what area of your life are you tempted to give up praying?',
      'What does Galatians 6:9 promise to those who don\'t give up?',
      'How does Hebrews 10:35-36 encourage persistence?'
    ]
  },
  {
    position: 7,
    heading: 'The Unseen Battle',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Behind every visible circumstance is an invisible spiritual reality. 2 Kings 6:15-17 records Elisha\'s servant panicking at the surrounding army, but Elisha prayed for his eyes to be opened. Suddenly he saw the mountains full of horses and chariots of fire.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Job 1:6-12 and Job 2:1-6 give us a backstage look at heavenly councils where Satan accuses and God permits testing. Zechariah 3:1-2 shows Satan standing to accuse Joshua the high priest. Revelation 12:10 calls Satan "the accuser of our brethren."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '2 Corinthians 4:18 reminds us: "We look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal." Our battles are often won or lost in the unseen realm before they manifest in the visible.' }
          ]
        }
      ]
    },
    reflection_questions: [
      'How would seeing the spiritual realm change your perspective on current struggles?',
      'What does 1 Peter 5:8-9 tell us about spiritual vigilance?',
      'How does Colossians 1:16 help us understand the hierarchy of spiritual beings?'
    ]
  },
  {
    position: 8,
    heading: 'Victory Through Christ',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The ultimate victory has already been won. Colossians 2:15 declares that Christ "having spoiled principalities and powers, he made a shew of them openly, triumphing over them in it." The cross was the decisive battle.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hebrews 2:14-15 explains that through death, Christ destroyed "him that had the power of death, that is, the devil." 1 John 3:8 states plainly: "For this purpose the Son of God was manifested, that he might destroy the works of the devil."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'We fight from victory, not for victory. Romans 8:37 assures us: "In all these things we are more than conquerors through him that loved us." 1 John 4:4 reminds us: "Greater is he that is in you, than he that is in the world."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'When we pray, we\'re not trying to convince a reluctant God. We\'re partnering with a victorious King who has already secured the outcome. Luke 10:19 gives us authority "over all the power of the enemy." Revelation 12:11 shows the saints overcoming "by the blood of the Lamb, and by the word of their testimony."' }
          ]
        }
      ]
    },
    reflection_questions: [
      'How does knowing Christ has already won change how you face spiritual battles?',
      'What does James 4:7 promise when we resist the devil?',
      'According to Romans 16:20, what will happen to Satan?'
    ]
  },
  {
    position: 9,
    heading: 'Application: Pray Without Fainting',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Daniel\'s experience teaches us several practical lessons. First, from Philippians 4:6: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Second, delays are not denials. Isaiah 40:31 promises: "They that wait upon the LORD shall renew their strength." Habakkuk 2:3 counsels: "Though it tarry, wait for it; because it will surely come, it will not tarry."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Third, fasting can accompany intense prayer. Matthew 17:21 (in some manuscripts) and Mark 9:29 indicate that certain spiritual breakthroughs require prayer and fasting. Joel 2:12 calls for returning to the Lord "with fasting, and with weeping, and with mourning."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Finally, Psalm 27:14 exhorts: "Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD." And Jeremiah 33:3 promises: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not."' }
          ]
        }
      ]
    },
    reflection_questions: [
      'What specific prayer request will you commit to persistent prayer about this week?',
      'How can you incorporate the principles from Colossians 4:2 into your prayer life?',
      'What does 1 Thessalonians 5:16-18 teach about our attitude in prayer?'
    ]
  },
  {
    position: 10,
    heading: 'Conclusion: From the First Day',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Remember: from the first day you pray, God hears. Psalm 34:17 assures us: "The righteous cry, and the LORD heareth, and delivereth them out of all their troubles." Psalm 145:18 adds: "The LORD is nigh unto all them that call upon him, to all that call upon him in truth."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The silence you experience is not heaven\'s indifference. Like Daniel, your words may be heard even while the answer is being fought through. Proverbs 15:29 promises: "The LORD is far from the wicked: but he heareth the prayer of the righteous."' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'John 16:24 invites us: "Ask, and ye shall receive, that your joy may be full." Matthew 21:22 promises: "And all things, whatsoever ye shall ask in prayer, believing, ye shall receive." The God of Daniel is your God. The angel of Daniel serves your King. Keep praying.' }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '"Fear not, Daniel: for from the first day that thou didst set thine heart to understand, and to chasten thyself before thy God, thy words were heard, and I am come for thy words." - Daniel 10:12' }
              ]
            }
          ]
        }
      ]
    },
    reflection_questions: [
      'What truth from this study has most impacted you?',
      'How will you apply the lessons from Daniel 10 to your prayer life?',
      'Who can you share these truths about prayer with this week?'
    ]
  }
]

async function seed() {
  console.log('Seeding database with "Heard From the First Day" study...')

  // First, get or create the teacher user
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'teacher')
    .limit(1)

  if (usersError) {
    console.error('Error fetching users:', usersError)
    process.exit(1)
  }

  let authorId: string

  if (!users || users.length === 0) {
    console.log('No teacher found. Creating a placeholder teacher...')

    // Try to create a placeholder auth user
    let authUserId: string | null = null

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'ruth@scripturedeep.com',
      password: 'temporary-password-change-me',
      email_confirm: true
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        // User exists in auth, get their ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === 'ruth@scripturedeep.com')
        if (existingUser) {
          authUserId = existingUser.id
          console.log('Found existing auth user:', authUserId)
        }
      }

      if (!authUserId) {
        console.error('Error creating auth user:', authError)
        process.exit(1)
      }
    } else {
      authUserId = authUser.user.id
    }

    authorId = authUserId

    // Create the user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authorId,
        email: 'ruth@scripturedeep.com',
        display_name: 'Ruth Carpenter',
        role: 'teacher'
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      process.exit(1)
    }

    console.log('Created teacher user: ruth@scripturedeep.com')
  } else {
    authorId = users[0].id
    console.log('Using existing teacher:', authorId)
  }

  // Check if study already exists
  const { data: existingStudy } = await supabase
    .from('studies')
    .select('id')
    .eq('slug', studyData.slug)
    .single()

  if (existingStudy) {
    console.log('Study already exists, deleting and recreating...')

    // Delete existing sections
    await supabase
      .from('sections')
      .delete()
      .eq('study_id', existingStudy.id)

    // Delete existing study
    await supabase
      .from('studies')
      .delete()
      .eq('id', existingStudy.id)
  }

  // Create the study
  const { data: study, error: studyError } = await supabase
    .from('studies')
    .insert({
      ...studyData,
      author_id: authorId
    })
    .select('id')
    .single()

  if (studyError) {
    console.error('Error creating study:', studyError)
    process.exit(1)
  }

  console.log('Created study:', study.id)

  // Create sections
  for (const section of sections) {
    const { error: sectionError } = await supabase
      .from('sections')
      .insert({
        study_id: study.id,
        ...section
      })

    if (sectionError) {
      console.error('Error creating section:', section.heading, sectionError)
    } else {
      console.log('Created section:', section.position, section.heading)
    }
  }

  // Count scripture references
  const countReferences = (obj: unknown): number => {
    const json = JSON.stringify(obj)
    // Simple pattern to count scripture references
    const patterns = [
      /\d+\s*(John|Peter|Timothy|Thessalonians|Corinthians|Kings|Chronicles|Samuel)\s+\d+:\d+/gi,
      /(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Galatians|Ephesians|Philippians|Colossians|Titus|Philemon|Hebrews|James|Jude|Revelation)\s+\d+:\d+/gi,
    ]

    let count = 0
    for (const pattern of patterns) {
      const matches = json.match(pattern)
      if (matches) count += matches.length
    }
    return count
  }

  const totalRefs = sections.reduce((acc, s) => {
    return acc + countReferences(s.body) + countReferences(s.reflection_questions)
  }, 0)

  console.log(`\nSeeding complete!`)
  console.log(`- Study: "${studyData.title}"`)
  console.log(`- Sections: ${sections.length}`)
  console.log(`- Approximate scripture references: ${totalRefs}+`)
  console.log(`\nView at: /study/${studyData.slug}`)
}

seed().catch(console.error)
