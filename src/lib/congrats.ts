type Band = 'perfect' | 'excellent' | 'strong' | 'solid' | 'building' | 'start'

const MESSAGES: Record<Band, string[]> = {
  perfect: [
    'Akshu, a perfect score — you didn’t just study, you owned it.',
    'Flawless, Akshu. Every answer landed. That’s pure brilliance.',
    'One hundred percent, Akshu. The paper didn’t stand a chance.',
    'Akshu, full marks. Quiet confidence, loud results.',
    'Perfect run, Akshu. Save this feeling — you earned every bit of it.',
  ],
  excellent: [
    'Akshu, that score is glowing. You’re exam-ready and then some.',
    'Outstanding work, Akshu. This is what dedicated practice looks like.',
    'Akshu, you’re crushing it — keep this pace and the real exam will feel familiar.',
    'What a finish, Akshu. Sharp mind, steady hands, beautiful score.',
    'Akshu, this is excellence with heart. You’re so close to unstoppable.',
  ],
  strong: [
    'Akshu, strong score — your hard work is clearly paying off.',
    'Well done, Akshu. You’re building real exam stamina.',
    'Akshu, that was a solid, confident performance. Be proud of this.',
    'Nice work, Akshu. You’re thinking like a nurse already.',
    'Akshu, look at that progress. Keep going — you’re rising fast.',
  ],
  solid: [
    'Akshu, good finish. Every attempt is making you sharper.',
    'You’re learning in public, Akshu — and it’s working. Keep at it.',
    'Akshu, a respectable score and a clearer map of what to review next.',
    'Proud of you for finishing, Akshu. Consistency beats perfection.',
    'Akshu, this is momentum. Review the misses and come back stronger.',
  ],
  building: [
    'Akshu, you showed up — that’s the hardest part. The score will follow.',
    'Not your peak yet, Akshu, but every quiz is a step toward it.',
    'Akshu, treat this as a practice lap. The next one can surprise you.',
    'Brave finish, Akshu. Save the tough ones and try them again soon.',
    'Akshu, progress isn’t always a high percentage — sometimes it’s finishing with courage.',
  ],
  start: [
    'Akshu, starting is winning. Dust off, retry the hard ones, and rise.',
    'This round was a diagnostic, Akshu — now you know exactly what to practice.',
    'Akshu, low score doesn’t mean low ability. It means a clearer study plan.',
    'Chin up, Akshu. Nurses grow through tough days — this is one of those reps.',
    'Akshu, come back to the missed questions. Tomorrow-you will thank today-you.',
  ],
}

function bandFor(percent: number): Band {
  if (percent >= 100) return 'perfect'
  if (percent >= 90) return 'excellent'
  if (percent >= 75) return 'strong'
  if (percent >= 60) return 'solid'
  if (percent >= 40) return 'building'
  return 'start'
}

/** Pick an uplifting message for Akshu; unique-ish across completions via time + score. */
export function congratsForAkshu(percent: number): { title: string; message: string } {
  const band = bandFor(percent)
  const pool = MESSAGES[band]
  const seed = Date.now() + percent * 17
  const message = pool[seed % pool.length]

  const titles: Record<Band, string> = {
    perfect: 'Congratulations, Akshu!',
    excellent: 'Amazing work, Akshu!',
    strong: 'Well done, Akshu!',
    solid: 'Nice job, Akshu!',
    building: 'Keep going, Akshu!',
    start: 'You’ve got this, Akshu!',
  }

  return { title: titles[band], message }
}
